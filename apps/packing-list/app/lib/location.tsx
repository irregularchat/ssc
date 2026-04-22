import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { Base } from '~/types/database'

interface LocationContextType {
  selectedBase: Base | null
  setSelectedBase: (base: Base | null) => void
  bases: Base[]
}

const LocationContext = createContext<LocationContextType | null>(null)

const COOKIE_NAME = 'cpl_base_id'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

function setLocationCookie(baseId: number | null) {
  if (typeof document === 'undefined') return

  if (baseId === null) {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`
  } else {
    document.cookie = `${COOKIE_NAME}=${baseId}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
  }
}

export function getLocationFromCookie(cookieHeader: string | null): number | null {
  if (!cookieHeader) return null

  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
  if (!match) return null

  const baseId = parseInt(match[1], 10)
  return isNaN(baseId) ? null : baseId
}

interface LocationProviderProps {
  children: React.ReactNode
  bases: Base[]
  initialBaseId: number | null
}

export function LocationProvider({ children, bases, initialBaseId }: LocationProviderProps) {
  const [selectedBase, setSelectedBaseState] = useState<Base | null>(() => {
    if (initialBaseId === null) return null
    return bases.find((b) => b.id === initialBaseId) || null
  })

  const setSelectedBase = useCallback(
    (base: Base | null) => {
      setSelectedBaseState(base)
      setLocationCookie(base?.id ?? null)
    },
    []
  )

  // Sync with cookie on mount (in case of hydration mismatch)
  useEffect(() => {
    if (initialBaseId && !selectedBase) {
      const base = bases.find((b) => b.id === initialBaseId)
      if (base) {
        setSelectedBaseState(base)
      }
    }
  }, [initialBaseId, bases, selectedBase])

  return (
    <LocationContext.Provider value={{ selectedBase, setSelectedBase, bases }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}

// Helper to get location from loader context
export function useLocationContext() {
  return useContext(LocationContext)
}

import { useState, useCallback, useEffect, useRef } from 'react'
import { searchBuildings } from '../lib/api'
import type { Building } from '../lib/types'
import { BUILDING_CATEGORIES } from '../lib/types'
import DeliveryStopList from '../components/DeliveryStopList'
import GateInfoBanner from '../components/GateInfoBanner'
import DirectionsModal from '../components/DirectionsModal'
import {
  H1575_GATE,
  optimizeRoute,
  buildGoogleMapsUrl,
  estimateRouteTime,
  formatRouteSummary,
} from '../lib/route-utils'

type OriginType = 'current' | 'gate'

function loadStops(): Building[] {
  try {
    const raw = localStorage.getItem('milnav-delivery-stops')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function loadChecked(): Set<string> {
  try {
    const raw = localStorage.getItem('milnav-delivery-checked')
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function loadOrigin(): OriginType {
  return (localStorage.getItem('milnav-delivery-origin') as OriginType) || 'current'
}

export default function DeliverPage() {
  const [stops, setStops] = useState<Building[]>(loadStops)
  const [checkedStops, setCheckedStops] = useState<Set<string>>(loadChecked)
  const [origin, setOrigin] = useState<OriginType>(loadOrigin)
  const [gateBannerDismissed, setGateBannerDismissed] = useState(false)

  // Search state
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Building[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Directions modal
  const [directionsBuilding, setDirectionsBuilding] = useState<Building | null>(null)

  // Copy feedback
  const [copied, setCopied] = useState(false)

  // Geolocation
  const [currentPos, setCurrentPos] = useState<{ latitude: number; longitude: number } | null>(null)

  // Get current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentPos({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => {} // Silently fail — will use gate as fallback
      )
    }
  }, [])

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('milnav-delivery-stops', JSON.stringify(stops))
  }, [stops])

  useEffect(() => {
    localStorage.setItem('milnav-delivery-checked', JSON.stringify([...checkedStops]))
  }, [checkedStops])

  useEffect(() => {
    localStorage.setItem('milnav-delivery-origin', origin)
  }, [origin])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const results = await searchBuildings('fort-bragg', query.trim())
        // Filter out buildings already in stop list
        const stopIds = new Set(stops.map((s) => s.id))
        setSearchResults(results.filter((r) => !stopIds.has(r.id)))
        setShowResults(true)
      } catch {
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, stops])

  // Close search results on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const addStop = useCallback((building: Building) => {
    setStops((prev) => {
      if (prev.some((s) => s.id === building.id)) return prev
      return [...prev, building]
    })
    setQuery('')
    setShowResults(false)
  }, [])

  const removeStop = useCallback((buildingId: string) => {
    setStops((prev) => prev.filter((s) => s.id !== buildingId))
    setCheckedStops((prev) => {
      const next = new Set(prev)
      next.delete(buildingId)
      return next
    })
  }, [])

  const toggleChecked = useCallback((buildingId: string) => {
    setCheckedStops((prev) => {
      const next = new Set(prev)
      if (next.has(buildingId)) next.delete(buildingId)
      else next.add(buildingId)
      return next
    })
  }, [])

  const handleOptimize = useCallback(() => {
    const routeOrigin =
      origin === 'gate'
        ? { latitude: H1575_GATE.latitude, longitude: H1575_GATE.longitude }
        : currentPos ?? { latitude: H1575_GATE.latitude, longitude: H1575_GATE.longitude }
    setStops((prev) => optimizeRoute(routeOrigin, prev))
    setCheckedStops(new Set()) // Reset delivery checks after reoptimizing
  }, [origin, currentPos])

  const handleNavigate = useCallback(() => {
    const allStops = origin === 'gate'
      ? [{ latitude: H1575_GATE.latitude, longitude: H1575_GATE.longitude }, ...stops]
      : stops
    const urls = buildGoogleMapsUrl(allStops)
    if (urls.length > 0) {
      window.open(urls[0], '_blank')
    }
  }, [origin, stops])

  const handleCopySummary = useCallback(async () => {
    const summary = formatRouteSummary(stops)
    await navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [stops])

  const handleClearAll = useCallback(() => {
    if (stops.length === 0) return
    if (window.confirm(`Clear all ${stops.length} delivery stops?`)) {
      setStops([])
      setCheckedStops(new Set())
    }
  }, [stops.length])

  const est = estimateRouteTime(stops)
  const deliveredCount = stops.filter((s) => checkedStops.has(s.id)).length

  return (
    <div className="min-h-screen bg-sand-50 flex flex-col">
      {/* Header */}
      <div className="bg-olive-700 text-white px-4 py-3 flex items-center gap-3 shrink-0">
        <a href="/" className="font-bold text-lg hover:text-sand-200 transition-colors">MilNav</a>
        <span className="text-olive-300 text-sm">|</span>
        <span className="font-medium text-sm">Delivery Planner</span>
        <div className="flex-1" />
        {stops.length > 0 && (
          <span className="text-sm text-olive-200">
            {deliveredCount}/{stops.length} stops
          </span>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 space-y-4 pb-36">
        {/* Starting Point */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-steel mb-3">Starting Point</h2>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="origin"
                checked={origin === 'current'}
                onChange={() => setOrigin('current')}
                className="w-4 h-4 text-olive-600"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Use my current location</span>
                {currentPos ? (
                  <p className="text-xs text-gray-400">Location available</p>
                ) : (
                  <p className="text-xs text-amber-500">Location not available — will default to gate</p>
                )}
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="origin"
                checked={origin === 'gate'}
                onChange={() => setOrigin('gate')}
                className="w-4 h-4 text-olive-600"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Start at All American Gate (Bldg H1575)</span>
                <p className="text-xs text-gray-400">For visitors entering post</p>
              </div>
            </label>
          </div>

          {origin === 'gate' && !gateBannerDismissed && (
            <div className="mt-3">
              <GateInfoBanner onDismiss={() => setGateBannerDismissed(true)} />
            </div>
          )}
        </div>

        {/* Search & Add Stops */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-steel mb-3">Add Delivery Stops</h2>
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search building #, name, MGRS, or Plus Code..."
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-olive-300 focus:border-olive-300"
              />
              {searchLoading && (
                <svg className="animate-spin h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
            </div>

            {/* Search results dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg max-h-64 overflow-y-auto">
                {searchResults.map((building) => {
                  const cat = building.category ? BUILDING_CATEGORIES[building.category] : null
                  return (
                    <button
                      key={building.id}
                      onClick={() => addStop(building)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-olive-50 transition-colors border-b border-gray-50 last:border-b-0 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {cat && <span className="text-sm">{cat.icon}</span>}
                          <span className="text-sm font-semibold text-steel">Bldg {building.building_number}</span>
                          {cat && (
                            <span
                              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: cat.color }}
                            >
                              {cat.label}
                            </span>
                          )}
                        </div>
                        {building.name && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{building.name}</p>
                        )}
                      </div>
                      <span className="text-olive-500 text-xs font-medium shrink-0 ml-2 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {showResults && !searchLoading && query.trim() && searchResults.length === 0 && (
              <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg p-4 text-center">
                <p className="text-sm text-gray-500">No buildings found for "{query}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Stops */}
        {stops.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-steel">
                Delivery Stops ({stops.length})
              </h2>
              {est > 0 && (
                <span className="text-xs text-gray-400">~{est} min estimated</span>
              )}
            </div>
            <DeliveryStopList
              stops={stops}
              checkedStops={checkedStops}
              onRemove={removeStop}
              onReorder={setStops}
              onToggleChecked={toggleChecked}
              onGetDirections={setDirectionsBuilding}
            />
          </div>
        )}

        {/* Quick links when empty */}
        {stops.length === 0 && (
          <div className="text-center py-8 space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-olive-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-olive-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h17.25a1.125 1.125 0 0 0 1.125-1.125V6.75a1.125 1.125 0 0 0-1.125-1.125H3.375a1.125 1.125 0 0 0-1.125 1.125v6.375c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Search for buildings above to plan your delivery route</p>
            <div className="flex gap-3 justify-center">
              <a href="/" className="text-olive-500 text-sm font-medium hover:text-olive-700">Home</a>
              <span className="text-gray-300">|</span>
              <a href="/explore" className="text-olive-500 text-sm font-medium hover:text-olive-700">Explore Map</a>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom action bar */}
      {stops.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 z-40">
          <div className="max-w-2xl mx-auto flex gap-2">
            <button
              onClick={handleOptimize}
              disabled={stops.length < 2}
              className="flex-1 py-3 bg-olive-100 text-olive-700 font-semibold rounded-xl hover:bg-olive-200 transition-colors disabled:opacity-40 text-sm"
            >
              Optimize Route
            </button>
            <button
              onClick={handleNavigate}
              className="flex-1 py-3 bg-olive-600 text-white font-semibold rounded-xl hover:bg-olive-700 transition-colors text-sm"
            >
              Navigate ({stops.length} stops)
            </button>
            <button
              onClick={handleCopySummary}
              className={`px-3 py-3 rounded-xl border text-sm font-medium transition-all ${
                copied
                  ? 'bg-green-50 border-green-200 text-green-600'
                  : 'border-gray-200 text-gray-500 hover:text-olive-600 hover:border-olive-300'
              }`}
              title="Copy route summary"
            >
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                </svg>
              )}
            </button>
            <button
              onClick={handleClearAll}
              className="px-3 py-3 rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 transition-all text-sm"
              title="Clear all stops"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Directions Modal */}
      {directionsBuilding && (
        <DirectionsModal
          isOpen={!!directionsBuilding}
          onClose={() => setDirectionsBuilding(null)}
          latitude={directionsBuilding.latitude}
          longitude={directionsBuilding.longitude}
          label={`Building ${directionsBuilding.building_number}${directionsBuilding.name ? ` — ${directionsBuilding.name}` : ''}`}
          buildingNumber={directionsBuilding.building_number}
          buildingId={directionsBuilding.id}
          mgrs={directionsBuilding.mgrs}
          plusCode={directionsBuilding.plus_code}
        />
      )}
    </div>
  )
}

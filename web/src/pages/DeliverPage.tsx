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
import { SearchIcon, SpinnerIcon, PlusIcon, TruckIcon, CopyIcon, CheckIcon, TrashIcon } from '../components/Icons'

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
    if (stops.length === 0) return

    // Build waypoints: always start from user's current location, then gate (if selected), then stops
    const gateCoord = { latitude: H1575_GATE.latitude, longitude: H1575_GATE.longitude }
    const stopsWithGate = origin === 'gate' ? [gateCoord, ...stops] : stops

    if (currentPos) {
      const allStops = [{ latitude: currentPos.latitude, longitude: currentPos.longitude }, ...stopsWithGate]
      const urls = buildGoogleMapsUrl(allStops)
      if (urls.length > 0) window.open(urls[0], '_blank')
    } else {
      // No GPS — let Google Maps use "My Location" as origin
      const coords = stopsWithGate.map((s) => `${s.latitude},${s.longitude}`).join('/')
      window.open(`https://www.google.com/maps/dir/My+Location/${coords}`, '_blank')
    }
  }, [origin, stops, currentPos])

  const handleCopySummary = useCallback(async () => {
    const startLabel =
      origin === 'gate'
        ? `Start: All American Gate (Bldg H1575)`
        : currentPos
          ? `Start: Current Location (${currentPos.latitude.toFixed(6)}, ${currentPos.longitude.toFixed(6)})`
          : `Start: Current Location`
    const summary = startLabel + '\n\n' + formatRouteSummary(stops)
    await navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [stops, origin, currentPos])

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
    <div className="flex-1 overflow-auto bg-gray-50 flex flex-col">
      {/* Page header with progress */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-base font-semibold text-steel">Delivery Planner</h1>
          {stops.length > 0 && (
            <span className="text-sm text-gray-500">
              {deliveredCount}/{stops.length} delivered
            </span>
          )}
        </div>
        {/* Progress bar */}
        {stops.length > 0 && (
          <div className="max-w-2xl mx-auto mt-2">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-olive-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(deliveredCount / stops.length) * 100}%` }}
              />
            </div>
          </div>
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
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search building #, name, MGRS, or Plus Code..."
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-olive-300 focus:border-olive-300"
              />
              {searchLoading && (
                <SpinnerIcon className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
                        <PlusIcon className="w-4 h-4" />
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

        {/* Empty state */}
        {stops.length === 0 && (
          <div className="text-center py-10 space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-olive-100 rounded-full">
              <TruckIcon className="w-7 h-7 text-olive-600" />
            </div>
            <p className="text-gray-500 text-sm">Search for buildings above to plan your delivery route</p>
          </div>
        )}
      </div>

      {/* Sticky bottom action bar */}
      {stops.length > 0 && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 pb-safe z-40">
          <div className="max-w-2xl mx-auto flex gap-2">
            <button
              onClick={handleOptimize}
              disabled={stops.length < 2}
              className="flex-1 min-h-[48px] bg-olive-100 text-olive-700 font-semibold rounded-xl hover:bg-olive-200 active:scale-[0.98] transition-all disabled:opacity-40 text-sm"
            >
              Optimize
            </button>
            <button
              onClick={handleNavigate}
              className="flex-1 min-h-[48px] bg-olive-600 text-white font-semibold rounded-xl hover:bg-olive-700 active:scale-[0.98] transition-all text-sm"
            >
              Navigate ({stops.length})
            </button>
            <button
              onClick={handleCopySummary}
              className={`min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl border transition-all active:scale-95 ${
                copied
                  ? 'bg-green-50 border-green-200 text-green-600'
                  : 'border-gray-200 text-gray-500 hover:text-olive-600 hover:border-olive-300'
              }`}
              title="Copy route summary"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
            <button
              onClick={handleClearAll}
              className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 active:scale-95 transition-all"
              title="Clear all stops"
            >
              <TrashIcon />
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

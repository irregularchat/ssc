import { useState, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { searchBuildings } from '../lib/api'
import type { Building } from '../lib/types'
import DirectionsModal from '../components/DirectionsModal'
import BuildingResultCard from '../components/BuildingResultCard'
import { isMGRS, decodeMGRS } from '../lib/mgrs-utils'
import { SearchIcon, MapIcon, TruckIcon, SpinnerIcon } from '../components/Icons'

const DEFAULT_INSTALLATION = 'fort-bragg'
const MAX_RECENT = 5

function loadRecents(): string[] {
  try {
    return JSON.parse(localStorage.getItem('milnav-recent-searches') || '[]')
  } catch { return [] }
}

function saveRecent(query: string) {
  const recents = loadRecents().filter((r) => r !== query)
  recents.unshift(query)
  localStorage.setItem('milnav-recent-searches', JSON.stringify(recents.slice(0, MAX_RECENT)))
}

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Building[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [directionsBuilding, setDirectionsBuilding] = useState<Building | null>(null)
  const [recents, setRecents] = useState<string[]>(loadRecents)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Debounced real-time search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSearched(false)
      return
    }

    debounceRef.current && clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setSearched(true)
      try {
        const data = await searchBuildings(DEFAULT_INSTALLATION, query.trim())
        setResults(data)
        if (data.length > 0) {
          saveRecent(query.trim())
          setRecents(loadRecents())
        }
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => { debounceRef.current && clearTimeout(debounceRef.current) }
  }, [query])

  const handleRecentClick = useCallback((term: string) => {
    setQuery(term)
  }, [])

  // When search returns no results and query looks like MGRS, decode it
  const mgrsLocation =
    searched && !loading && results.length === 0 && isMGRS(query.trim())
      ? decodeMGRS(query.trim())
      : null

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {/* Hero */}
      <div className="bg-olive-700 text-white py-10 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight md:hidden">Fort Maps</h1>
          <p className="mt-2 text-olive-200 text-sm md:text-base leading-relaxed max-w-md mx-auto">
            Search any building by number, name, or MGRS coordinate.
          </p>

          {/* Search */}
          <div className="mt-6 relative max-w-lg mx-auto">
            <SearchIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-olive-300/60" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Try "R2560" or "clinic" or MGRS...'
              className="w-full pl-12 pr-4 py-3.5 rounded-xl text-steel bg-white text-base focus:outline-none focus:ring-2 focus:ring-sand-300 shadow-lg"
              autoFocus
            />
            {loading && (
              <SpinnerIcon className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
            )}
          </div>

          <p className="mt-3 text-olive-300 text-xs">Fort Liberty (Bragg), NC — 5,668 buildings</p>
        </div>
      </div>

      {/* Results area */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Result count */}
        {searched && !loading && results.length > 0 && (
          <p className="text-xs text-gray-400 mb-3 font-medium">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* No results — MGRS fallback */}
        {searched && !loading && results.length === 0 && (
          <div className="text-center py-8">
            {mgrsLocation ? (
              <>
                <p className="text-gray-600 font-medium">
                  No building found at MGRS <span className="font-mono text-olive-600">{query.trim().toUpperCase()}</span>
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Decoded to {mgrsLocation.latitude.toFixed(6)}, {mgrsLocation.longitude.toFixed(6)}
                </p>
                <Link
                  to={`/explore?lat=${mgrsLocation.latitude}&lng=${mgrsLocation.longitude}&zoom=17`}
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-olive-500 text-white font-semibold rounded-xl hover:bg-olive-600 active:scale-95 transition-all"
                >
                  <MapIcon className="w-5 h-5" />
                  View on map
                </Link>
              </>
            ) : (
              <>
                <p className="text-gray-500">No buildings found for &quot;{query}&quot;</p>
                <p className="text-sm text-gray-400 mt-1">
                  Try a building number, name, or MGRS coordinate
                </p>
              </>
            )}
          </div>
        )}

        {/* Result cards */}
        {results.map((building) => (
          <BuildingResultCard
            key={building.id}
            building={building}
            onGetDirections={setDirectionsBuilding}
          />
        ))}

        {/* Quick links + recents when no search */}
        {!searched && (
          <div className="space-y-6">
            {/* Recent searches */}
            {recents.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Recent</p>
                <div className="flex flex-wrap gap-2">
                  {recents.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleRecentClick(term)}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-olive-300 hover:text-olive-600 active:scale-95 transition-all"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick action cards */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/explore"
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-olive-200 active:scale-[0.98] transition-all group"
              >
                <MapIcon className="w-7 h-7 text-olive-500 mb-2 group-hover:text-olive-600 transition-colors" />
                <p className="font-semibold text-sm text-steel">Explore Map</p>
                <p className="text-xs text-gray-400 mt-0.5">Browse all buildings</p>
              </Link>
              <Link
                to="/deliver"
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-olive-200 active:scale-[0.98] transition-all group"
              >
                <TruckIcon className="w-7 h-7 text-olive-500 mb-2 group-hover:text-olive-600 transition-colors" />
                <p className="font-semibold text-sm text-steel">Delivery Mode</p>
                <p className="text-xs text-gray-400 mt-0.5">Plan multi-stop routes</p>
              </Link>
            </div>
          </div>
        )}
      </div>

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

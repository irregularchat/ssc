import { useState, useCallback } from 'react'
import { searchBuildings } from '../lib/api'
import { BUILDING_CATEGORIES } from '../lib/types'
import type { Building } from '../lib/types'
import DirectionsModal from '../components/DirectionsModal'

const DEFAULT_INSTALLATION = 'fort-bragg'

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Building[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [directionsBuilding, setDirectionsBuilding] = useState<Building | null>(null)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const data = await searchBuildings(DEFAULT_INSTALLATION, query.trim())
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Hero */}
      <div className="bg-olive-700 text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">MilNav</h1>
          <p className="mt-2 text-olive-200 text-lg">Find any building on post</p>

          {/* Search */}
          <div className="mt-8 flex gap-2 max-w-lg mx-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Building number (e.g., R2560, 32920)"
              className="flex-1 px-4 py-3 rounded-xl text-steel bg-white text-lg focus:outline-none focus:ring-2 focus:ring-sand-300"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-sand-300 text-olive-700 font-semibold rounded-xl hover:bg-sand-200 transition-colors disabled:opacity-50"
            >
              {loading ? '...' : 'Search'}
            </button>
          </div>

          <p className="mt-3 text-olive-300 text-sm">Fort Bragg, NC — 5,668 buildings</p>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Searching...
          </div>
        )}

        {searched && !loading && results.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No buildings found for &quot;{query}&quot;</p>
            <p className="text-sm text-gray-400 mt-1">Try a different building number or browse the <a href="/explore" className="text-olive-500 underline">map</a></p>
          </div>
        )}

        {results.map((building) => {
          const cat = building.category ? BUILDING_CATEGORIES[building.category] : null
          return (
            <div key={building.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {cat && <span className="text-lg">{cat.icon}</span>}
                    <h2 className="text-xl font-bold text-steel">
                      Bldg {building.building_number}
                    </h2>
                  </div>
                  {building.name && (
                    <p className="text-olive-500 font-medium mt-0.5">{building.name}</p>
                  )}
                </div>
                {cat && (
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full text-white shrink-0"
                    style={{ backgroundColor: cat.color }}
                  >
                    {cat.label}
                  </span>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setDirectionsBuilding(building)}
                  className="flex-1 py-3 bg-olive-500 text-white font-semibold rounded-xl hover:bg-olive-600 transition-colors"
                >
                  Get Directions
                </button>
                <a
                  href="/explore"
                  onClick={() => {
                    // Store selected building for the explore page to pick up
                    sessionStorage.setItem('milnav-selected', building.id)
                  }}
                  className="px-4 py-3 border border-olive-300 text-olive-600 font-semibold rounded-xl hover:bg-olive-50 transition-colors flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                  </svg>
                  Map
                </a>
              </div>
            </div>
          )
        })}

        {/* Quick links */}
        {!searched && (
          <div className="text-center py-8 space-y-4">
            <a href="/explore" className="inline-flex items-center gap-2 text-olive-500 text-lg font-medium hover:text-olive-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
              </svg>
              Browse all buildings on the map
            </a>
            <p className="text-sm text-gray-400">5,668 buildings at Fort Bragg</p>
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

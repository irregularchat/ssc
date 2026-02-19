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
              placeholder="Building number (e.g., 4-2274)"
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

          <p className="mt-3 text-olive-300 text-sm">Fort Bragg, NC</p>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {loading && <p className="text-center text-gray-400">Searching...</p>}

        {searched && !loading && results.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No buildings found for &quot;{query}&quot;</p>
            <p className="text-sm text-gray-400 mt-1">Try a different building number or check the <a href="/explore" className="text-olive-500 underline">map</a></p>
          </div>
        )}

        {results.map((building) => {
          const cat = building.category ? BUILDING_CATEGORIES[building.category] : null
          return (
            <div key={building.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-steel">
                    Building {building.building_number}
                  </h2>
                  {building.name && (
                    <p className="text-olive-500 font-medium">{building.name}</p>
                  )}
                  {building.description && (
                    <p className="text-gray-500 text-sm mt-1">{building.description}</p>
                  )}
                  {building.address && (
                    <p className="text-gray-400 text-sm mt-1">{building.address}</p>
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
              <button
                onClick={() => setDirectionsBuilding(building)}
                className="mt-4 w-full py-3 bg-olive-500 text-white font-semibold rounded-xl hover:bg-olive-600 transition-colors"
              >
                Get Directions
              </button>
            </div>
          )
        })}

        {/* Quick links */}
        {!searched && (
          <div className="text-center py-8">
            <a href="/explore" className="text-olive-500 underline text-lg">
              Browse all buildings on the map
            </a>
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
        />
      )}
    </div>
  )
}

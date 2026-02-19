import { useState, useEffect, useMemo } from 'react'
import { fetchBuildings, fetchBuildingCategories } from '../lib/api'
import type { Building, Installation } from '../lib/types'
import { BUILDING_CATEGORIES } from '../lib/types'
import BuildingMap from '../components/BuildingMap'
import DirectionsModal from '../components/DirectionsModal'

const FORT_BRAGG: Installation = {
  id: 'fort-bragg',
  name: 'Fort Bragg',
  slug: 'fort-bragg',
  state: 'NC',
  center_latitude: 35.1390,
  center_longitude: -79.0064,
  default_zoom: 13,
}

export default function ExplorePage() {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [directionsBuilding, setDirectionsBuilding] = useState<Building | null>(null)
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map')

  useEffect(() => {
    fetchBuildings('fort-bragg').then((res) => setBuildings(res.data))
    fetchBuildingCategories('fort-bragg').then(setCategories)
  }, [])

  const filteredBuildings = useMemo(() => {
    let result = buildings
    if (selectedCategory !== 'all') {
      result = result.filter((b) => b.category === selectedCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((b) =>
        b.building_number.toLowerCase().includes(q) ||
        b.name?.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q)
      )
    }
    return result
  }, [buildings, selectedCategory, searchQuery])

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-olive-700 text-white px-4 py-3 flex items-center gap-4">
        <a href="/" className="font-bold text-lg">MilNav</a>
        <span className="text-olive-300 text-sm">Fort Bragg</span>
        <div className="flex-1" />
        {/* Mobile view toggle */}
        <div className="md:hidden flex gap-1">
          <button
            onClick={() => setMobileView('map')}
            className={`px-3 py-1 rounded-lg text-sm ${mobileView === 'map' ? 'bg-white/20' : ''}`}
          >
            Map
          </button>
          <button
            onClick={() => setMobileView('list')}
            className={`px-3 py-1 rounded-lg text-sm ${mobileView === 'list' ? 'bg-white/20' : ''}`}
          >
            List
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white border-b px-4 py-2 flex gap-2 items-center overflow-x-auto">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search buildings..."
          className="px-3 py-1.5 border rounded-lg text-sm min-w-[180px] focus:outline-none focus:ring-1 focus:ring-olive-300"
        />
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
            selectedCategory === 'all' ? 'bg-olive-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          All ({buildings.length})
        </button>
        {categories.map((cat) => {
          const info = BUILDING_CATEGORIES[cat.category]
          return (
            <button
              key={cat.category}
              onClick={() => setSelectedCategory(cat.category)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                selectedCategory === cat.category ? 'text-white' : 'bg-gray-100 text-gray-600'
              }`}
              style={selectedCategory === cat.category ? { backgroundColor: info?.color || '#94A3B8' } : {}}
            >
              {info?.label || cat.category} ({cat.count})
            </button>
          )
        })}
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className={`flex-1 ${mobileView === 'list' ? 'hidden md:block' : ''}`}>
          <BuildingMap
            buildings={filteredBuildings}
            installation={FORT_BRAGG}
            selectedBuilding={selectedBuilding}
            onSelectBuilding={setSelectedBuilding}
          />
        </div>

        {/* Sidebar / List */}
        <div className={`w-full md:w-80 lg:w-96 overflow-y-auto border-l bg-white ${mobileView === 'map' ? 'hidden md:block' : ''}`}>
          <div className="p-3 text-sm text-gray-500">
            {filteredBuildings.length} buildings
          </div>
          {filteredBuildings.map((b) => {
            const cat = b.category ? BUILDING_CATEGORIES[b.category] : null
            return (
              <div
                key={b.id}
                onClick={() => setSelectedBuilding(b)}
                className={`px-4 py-3 border-b cursor-pointer hover:bg-sand-50 transition-colors ${
                  selectedBuilding?.id === b.id ? 'bg-sand-100' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {cat && (
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  )}
                  <span className="font-semibold text-sm text-steel">Bldg {b.building_number}</span>
                </div>
                {b.name && <p className="text-sm text-gray-600 mt-0.5">{b.name}</p>}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setDirectionsBuilding(b) }}
                    className="text-xs text-olive-500 font-medium hover:underline"
                  >
                    Directions
                  </button>
                </div>
              </div>
            )
          })}
        </div>
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

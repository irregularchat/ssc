import { useState, useEffect, useMemo, useRef } from 'react'
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
  const [loading, setLoading] = useState(true)
  const selectedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      fetchBuildings('fort-bragg'),
      fetchBuildingCategories('fort-bragg'),
    ]).then(([buildingsRes, categoriesRes]) => {
      setBuildings(buildingsRes.data)
      setCategories(categoriesRes)
      setLoading(false)
    })
  }, [])

  // Scroll selected building into view in sidebar
  useEffect(() => {
    if (selectedBuilding && selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedBuilding])

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
        b.category?.toLowerCase().includes(q)
      )
    }
    return result
  }, [buildings, selectedCategory, searchQuery])

  const handleSelectBuilding = (building: Building | null) => {
    setSelectedBuilding(building)
    if (building && mobileView === 'list') {
      setMobileView('map')
    }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-olive-700 text-white px-4 py-3 flex items-center gap-3 shrink-0">
        <a href="/" className="font-bold text-lg hover:text-sand-200 transition-colors">MilNav</a>
        <span className="text-olive-300 text-sm hidden sm:inline">Fort Bragg, NC</span>
        <div className="flex-1" />
        {loading ? (
          <span className="text-olive-300 text-sm">Loading...</span>
        ) : (
          <span className="text-olive-300 text-sm">{filteredBuildings.length.toLocaleString()} buildings</span>
        )}
        {/* Mobile view toggle */}
        <div className="md:hidden flex gap-1 bg-olive-600 rounded-lg p-0.5">
          <button
            onClick={() => setMobileView('map')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${mobileView === 'map' ? 'bg-white/20 text-white' : 'text-olive-300'}`}
          >
            Map
          </button>
          <button
            onClick={() => setMobileView('list')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${mobileView === 'list' ? 'bg-white/20 text-white' : 'text-olive-300'}`}
          >
            List
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white border-b px-4 py-2 flex gap-2 items-center overflow-x-auto shrink-0">
        <div className="relative min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search building # or name..."
            className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-olive-300 focus:border-olive-300"
          />
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            selectedCategory === 'all' ? 'bg-olive-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories.map((cat) => {
          const info = BUILDING_CATEGORIES[cat.category]
          if (!info) return null
          return (
            <button
              key={cat.category}
              onClick={() => setSelectedCategory(cat.category)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.category ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={selectedCategory === cat.category ? { backgroundColor: info.color } : {}}
            >
              {info.icon} {info.label} ({cat.count})
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
            onSelectBuilding={handleSelectBuilding}
            onDirections={setDirectionsBuilding}
          />
        </div>

        {/* Sidebar / List */}
        <div className={`w-full md:w-80 lg:w-96 overflow-y-auto border-l bg-white ${mobileView === 'map' ? 'hidden md:block' : ''}`}>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <svg className="animate-spin h-6 w-6 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading buildings...
            </div>
          ) : filteredBuildings.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-gray-500">No buildings found</p>
              <p className="text-sm text-gray-400 mt-1">Try a different search or category</p>
            </div>
          ) : (
            filteredBuildings.map((b) => {
              const cat = b.category ? BUILDING_CATEGORIES[b.category] : null
              const isSelected = selectedBuilding?.id === b.id
              return (
                <div
                  key={b.id}
                  ref={isSelected ? selectedRef : undefined}
                  onClick={() => handleSelectBuilding(b)}
                  className={`px-4 py-3 border-b cursor-pointer transition-colors ${
                    isSelected ? 'bg-olive-50 border-l-4 border-l-olive-500' : 'hover:bg-sand-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {cat && (
                      <span className="text-sm" title={cat.label}>{cat.icon}</span>
                    )}
                    <span className="font-semibold text-sm text-steel">Bldg {b.building_number}</span>
                    {cat && (
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: cat.color }}
                      >
                        {cat.label}
                      </span>
                    )}
                  </div>
                  {b.name && <p className="text-sm text-gray-600 mt-0.5 ml-6">{b.name}</p>}
                  <button
                    onClick={(e) => { e.stopPropagation(); setDirectionsBuilding(b) }}
                    className="ml-6 mt-1.5 text-xs text-olive-500 font-medium hover:text-olive-700 hover:underline transition-colors"
                  >
                    Get Directions →
                  </button>
                </div>
              )
            })
          )}
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
          buildingNumber={directionsBuilding.building_number}
          buildingId={directionsBuilding.id}
        />
      )}
    </div>
  )
}

import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchBuildings, fetchBuildingCategories } from '../lib/api'
import type { Building, Installation } from '../lib/types'
import { BUILDING_CATEGORIES } from '../lib/types'
import BuildingMap from '../components/BuildingMap'
import DirectionsModal from '../components/DirectionsModal'
import { SkeletonBuildingList } from '../components/Skeleton'
import { SearchIcon } from '../components/Icons'

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
  const [searchParams] = useSearchParams()
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

  // Override map center if URL has ?lat=X&lng=Y&zoom=Z params
  const mapInstallation = useMemo<Installation>(() => {
    const lat = parseFloat(searchParams.get('lat') || '')
    const lng = parseFloat(searchParams.get('lng') || '')
    const zoom = parseFloat(searchParams.get('zoom') || '')
    if (!isNaN(lat) && !isNaN(lng)) {
      return {
        ...FORT_BRAGG,
        center_latitude: lat,
        center_longitude: lng,
        default_zoom: !isNaN(zoom) ? zoom : 17,
      }
    }
    return FORT_BRAGG
  }, [searchParams])

  const handleSelectBuilding = (building: Building | null) => {
    setSelectedBuilding(building)
    if (building && mobileView === 'list') {
      setMobileView('map')
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Mobile view toggle + count bar */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3 shrink-0">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setMobileView('map')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mobileView === 'map' ? 'bg-white text-olive-700 shadow-sm' : 'text-gray-500'}`}
          >
            Map
          </button>
          <button
            onClick={() => setMobileView('list')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mobileView === 'list' ? 'bg-white text-olive-700 shadow-sm' : 'text-gray-500'}`}
          >
            List
          </button>
        </div>
        <div className="flex-1" />
        {!loading && (
          <span className="text-gray-400 text-xs">{filteredBuildings.length.toLocaleString()} buildings</span>
        )}
      </div>

      {/* Search + Filters */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex gap-2 items-center overflow-x-auto shrink-0 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="relative min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search building # or name..."
            className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-olive-300 focus:border-olive-300"
          />
          <SearchIcon className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
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
        <div className={`flex-1 relative ${mobileView === 'list' ? 'hidden md:block' : ''}`}>
          <div className="absolute inset-0">
          <BuildingMap
            buildings={filteredBuildings}
            installation={mapInstallation}
            selectedBuilding={selectedBuilding}
            onSelectBuilding={handleSelectBuilding}
            onDirections={setDirectionsBuilding}
          />
          </div>
        </div>

        {/* Sidebar / List */}
        <div className={`w-full md:w-80 lg:w-96 overflow-y-auto border-l border-gray-200 bg-white ${mobileView === 'map' ? 'hidden md:block' : ''}`}>
          {/* Desktop count header */}
          {!loading && (
            <div className="hidden md:flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-500 font-medium">
                {filteredBuildings.length.toLocaleString()} buildings
              </span>
            </div>
          )}
          {loading ? (
            <SkeletonBuildingList count={8} />
          ) : filteredBuildings.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-gray-500 text-sm">No buildings found</p>
              <p className="text-xs text-gray-400 mt-1">Try a different search or category</p>
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
                  className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-olive-50 border-l-4 border-l-olive-500'
                      : 'hover:bg-gray-50 active:bg-gray-100'
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
                  {b.name && <p className="text-xs text-gray-500 mt-0.5 ml-6">{b.name}</p>}
                  {b.mgrs && <p className="text-[10px] font-mono text-amber-600/60 mt-0.5 ml-6">{b.mgrs}</p>}
                  <button
                    onClick={(e) => { e.stopPropagation(); setDirectionsBuilding(b) }}
                    className="ml-6 mt-1.5 text-xs text-olive-500 font-medium hover:text-olive-700 active:scale-95 transition-all"
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
          mgrs={directionsBuilding.mgrs}
          plusCode={directionsBuilding.plus_code}
        />
      )}
    </div>
  )
}

import { useRef, useCallback } from 'react'
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Building, Installation } from '../lib/types'
import { BUILDING_CATEGORIES } from '../lib/types'

interface BuildingMapProps {
  buildings: Building[]
  installation: Installation
  selectedBuilding: Building | null
  onSelectBuilding: (building: Building | null) => void
}

export default function BuildingMap({ buildings, installation, selectedBuilding, onSelectBuilding }: BuildingMapProps) {
  const mapRef = useRef<any>(null)

  const handleMarkerClick = useCallback((building: Building) => {
    onSelectBuilding(building)
    mapRef.current?.flyTo({
      center: [building.longitude, building.latitude],
      zoom: 17,
      duration: 500,
    })
  }, [onSelectBuilding])

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        latitude: installation.center_latitude,
        longitude: installation.center_longitude,
        zoom: installation.default_zoom,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="https://tiles.openfreemap.org/styles/liberty"
    >
      <NavigationControl position="top-right" />
      <GeolocateControl position="top-right" />

      {buildings.map((b) => {
        const cat = b.category ? BUILDING_CATEGORIES[b.category] : null
        const color = cat?.color || '#94A3B8'
        return (
          <Marker
            key={b.id}
            latitude={b.latitude}
            longitude={b.longitude}
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              handleMarkerClick(b)
            }}
          >
            <div
              className="w-4 h-4 rounded-full border-2 border-white cursor-pointer hover:scale-125 transition-transform"
              style={{ backgroundColor: color }}
              title={`Bldg ${b.building_number}`}
            />
          </Marker>
        )
      })}

      {selectedBuilding && (
        <Popup
          latitude={selectedBuilding.latitude}
          longitude={selectedBuilding.longitude}
          onClose={() => onSelectBuilding(null)}
          offset={12}
          closeOnClick={false}
        >
          <div className="p-1">
            <p className="font-bold text-sm">Bldg {selectedBuilding.building_number}</p>
            {selectedBuilding.name && <p className="text-xs text-gray-600">{selectedBuilding.name}</p>}
            {selectedBuilding.category && (
              <span className="text-xs text-gray-400">{BUILDING_CATEGORIES[selectedBuilding.category]?.label}</span>
            )}
          </div>
        </Popup>
      )}
    </Map>
  )
}

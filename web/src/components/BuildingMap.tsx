import { useRef, useCallback, useMemo, useState } from 'react'
import MapGL, { Source, Layer, Popup, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre'
import type { MapLayerMouseEvent, GeoJSONSource } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Building, Installation } from '../lib/types'
import { BUILDING_CATEGORIES } from '../lib/types'

interface BuildingMapProps {
  buildings: Building[]
  installation: Installation
  selectedBuilding: Building | null
  onSelectBuilding: (building: Building | null) => void
  onDirections?: (building: Building) => void
}

export default function BuildingMap({ buildings, installation, selectedBuilding, onSelectBuilding, onDirections }: BuildingMapProps) {
  const mapRef = useRef<any>(null)
  const [cursor, setCursor] = useState('')

  // Convert buildings to GeoJSON for clustering
  const geojson = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: buildings.map((b) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [b.longitude, b.latitude],
      },
      properties: {
        id: b.id,
        building_number: b.building_number,
        name: b.name || '',
        category: b.category || 'other',
        color: BUILDING_CATEGORIES[b.category || 'other']?.color || '#94A3B8',
      },
    })),
  }), [buildings])

  // Build a lookup for click handling
  const buildingLookup = useMemo(() => {
    const lookup: Record<string, Building> = {}
    buildings.forEach((b) => { lookup[b.id] = b })
    return lookup
  }, [buildings])

  const handleClusterClick = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0]
    if (!feature || !mapRef.current) return

    const clusterId = feature.properties?.cluster_id
    const source = mapRef.current.getSource('buildings') as GeoJSONSource
    if (!source || !clusterId) return

    source.getClusterExpansionZoom(clusterId).then((zoom: number) => {
      const coords = (feature.geometry as any).coordinates
      mapRef.current?.flyTo({
        center: coords,
        zoom: Math.min(zoom, 18),
        duration: 500,
      })
    })
  }, [])

  const handlePointClick = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0]
    if (!feature) return

    const buildingId = feature.properties?.id
    const building = buildingLookup[buildingId]
    if (!building) return

    onSelectBuilding(building)
    mapRef.current?.flyTo({
      center: [building.longitude, building.latitude],
      zoom: Math.max(mapRef.current.getZoom(), 16),
      duration: 500,
    })
  }, [buildingLookup, onSelectBuilding])

  const handleMouseEnter = useCallback(() => setCursor('pointer'), [])
  const handleMouseLeave = useCallback(() => setCursor(''), [])

  return (
    <MapGL
      ref={mapRef}
      initialViewState={{
        latitude: installation.center_latitude,
        longitude: installation.center_longitude,
        zoom: installation.default_zoom,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="https://tiles.openfreemap.org/styles/liberty"
      cursor={cursor}
      interactiveLayerIds={['clusters', 'unclustered-point']}
      onClick={(e) => {
        const feature = e.features?.[0]
        if (!feature) {
          onSelectBuilding(null)
          return
        }
        if (feature.layer?.id === 'clusters') {
          handleClusterClick(e)
        } else if (feature.layer?.id === 'unclustered-point') {
          handlePointClick(e)
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <NavigationControl position="top-right" />
      <GeolocateControl position="top-right" />

      <Source
        id="buildings"
        type="geojson"
        data={geojson}
        cluster={true}
        clusterMaxZoom={15}
        clusterRadius={50}
      >
        {/* Cluster circles */}
        <Layer
          id="clusters"
          type="circle"
          filter={['has', 'point_count']}
          paint={{
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#4B5320',   // olive: small clusters (< 20)
              20,
              '#C2B280',   // sand: medium clusters (20-100)
              100,
              '#43464B',   // steel: large clusters (100+)
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              18,    // small
              20,
              24,    // medium
              100,
              32,    // large
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          }}
        />

        {/* Cluster count labels */}
        <Layer
          id="cluster-count"
          type="symbol"
          filter={['has', 'point_count']}
          layout={{
            'text-field': '{point_count_abbreviated}',
            'text-size': 13,
            'text-font': ['Open Sans Bold'],
          }}
          paint={{
            'text-color': '#ffffff',
          }}
        />

        {/* Individual building points */}
        <Layer
          id="unclustered-point"
          type="circle"
          filter={['!', ['has', 'point_count']]}
          paint={{
            'circle-color': ['get', 'color'],
            'circle-radius': 7,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          }}
        />
      </Source>

      {/* Popup for selected building */}
      {selectedBuilding && (
        <Popup
          latitude={selectedBuilding.latitude}
          longitude={selectedBuilding.longitude}
          onClose={() => onSelectBuilding(null)}
          offset={12}
          closeOnClick={false}
          maxWidth="280px"
        >
          <div className="p-1 min-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
              {selectedBuilding.category && BUILDING_CATEGORIES[selectedBuilding.category] && (
                <span className="text-base">{BUILDING_CATEGORIES[selectedBuilding.category].icon}</span>
              )}
              <p className="font-bold text-base text-steel">Bldg {selectedBuilding.building_number}</p>
            </div>
            {selectedBuilding.name && (
              <p className="text-sm text-gray-700 mb-1">{selectedBuilding.name}</p>
            )}
            {selectedBuilding.category && BUILDING_CATEGORIES[selectedBuilding.category] && (
              <span
                className="inline-block text-xs font-medium px-2 py-0.5 rounded-full text-white mb-2"
                style={{ backgroundColor: BUILDING_CATEGORIES[selectedBuilding.category].color }}
              >
                {BUILDING_CATEGORIES[selectedBuilding.category].label}
              </span>
            )}
            {onDirections && (
              <button
                onClick={() => onDirections(selectedBuilding)}
                className="w-full mt-1 py-2 bg-olive-500 text-white text-sm font-semibold rounded-lg hover:bg-olive-600 transition-colors"
              >
                Get Directions
              </button>
            )}
          </div>
        </Popup>
      )}
    </MapGL>
  )
}

import type { Building } from './types'

// All American Gate — primary vehicle entry point for Fort Bragg
export const H1575_GATE = {
  id: 'h1575-gate',
  building_number: 'H1575',
  name: 'All American Gate — Vehicle Inspection',
  latitude: 35.1221341,
  longitude: -78.9791632,
  mgrs: '17SPU8414388456',
  plus_code: '877342CC+V84',
} as const

const EARTH_RADIUS_M = 6371000

/**
 * Haversine distance between two GPS coordinates.
 * Returns distance in meters.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_M * c
}

/**
 * Nearest-neighbor TSP approximation.
 * Starts at origin and repeatedly visits the nearest unvisited stop.
 * Returns a new array in optimized order (does not mutate input).
 */
export function optimizeRoute(
  origin: { latitude: number; longitude: number },
  stops: Building[],
): Building[] {
  if (stops.length <= 1) return [...stops]

  const remaining = [...stops]
  const ordered: Building[] = []
  let current = { lat: origin.latitude, lng: origin.longitude }

  while (remaining.length > 0) {
    let nearestIdx = 0
    let nearestDist = Infinity

    for (let i = 0; i < remaining.length; i++) {
      const d = haversineDistance(
        current.lat,
        current.lng,
        remaining[i].latitude,
        remaining[i].longitude,
      )
      if (d < nearestDist) {
        nearestDist = d
        nearestIdx = i
      }
    }

    const nearest = remaining.splice(nearestIdx, 1)[0]
    ordered.push(nearest)
    current = { lat: nearest.latitude, lng: nearest.longitude }
  }

  return ordered
}

const MAX_GOOGLE_WAYPOINTS = 10

/**
 * Build Google Maps direction URLs from an ordered list of stops.
 * Max 10 waypoints per URL; splits into multiple legs if needed.
 */
export function buildGoogleMapsUrl(
  stops: Array<{ latitude: number; longitude: number }>,
): string[] {
  if (stops.length === 0) return []

  const urls: string[] = []

  for (let i = 0; i < stops.length; i += MAX_GOOGLE_WAYPOINTS) {
    const chunk = stops.slice(i, i + MAX_GOOGLE_WAYPOINTS)
    const coords = chunk.map((s) => `${s.latitude},${s.longitude}`).join('/')
    urls.push(`https://www.google.com/maps/dir/${coords}`)
  }

  return urls
}

/**
 * Apple Maps driving directions URL for a single destination.
 */
export function buildAppleMapsUrl(lat: number, lng: number): string {
  return `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`
}

/**
 * Waze navigation URL for a single destination.
 */
export function buildWazeUrl(lat: number, lng: number): string {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
}

const AVG_MINUTES_BETWEEN_STOPS = 3

/**
 * Estimate total route time in minutes.
 * Uses 3 min average between consecutive stops (military post speed limits + checkpoints).
 */
export function estimateRouteTime(
  stops: Array<{ latitude: number; longitude: number }>,
): number {
  if (stops.length <= 1) return 0
  return (stops.length - 1) * AVG_MINUTES_BETWEEN_STOPS
}

/**
 * Format a human-readable route summary for display or sharing.
 */
export function formatRouteSummary(stops: Building[]): string {
  const lines: string[] = [
    'MilNav Delivery Route — Fort Bragg',
    '===================================',
  ]

  for (let i = 0; i < stops.length; i++) {
    const s = stops[i]
    const label = s.name ? `${s.building_number} — ${s.name}` : s.building_number
    lines.push(`${i + 1}. Bldg ${label}`)

    const mgrs = s.mgrs ?? 'N/A'
    const plusCode = s.plus_code ?? 'N/A'
    lines.push(`   MGRS: ${mgrs} | Plus Code: ${plusCode}`)
  }

  const est = estimateRouteTime(stops)
  lines.push('')
  lines.push(`Total stops: ${stops.length} | Est. time: ~${est} min`)

  return lines.join('\n')
}

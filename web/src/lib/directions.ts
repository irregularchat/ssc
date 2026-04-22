export type NavApp = 'google' | 'apple' | 'waze'

export function getDirectionsUrl(lat: number, lng: number, app: NavApp): string {
  switch (app) {
    case 'google':
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    case 'apple':
      return `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`
    case 'waze':
      return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
  }
}

export function openDirections(lat: number, lng: number, app: NavApp): void {
  window.open(getDirectionsUrl(lat, lng, app), '_blank')
}

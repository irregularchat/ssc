import { type NavApp, getDirectionsUrl } from '../lib/directions'

interface DirectionsModalProps {
  isOpen: boolean
  onClose: () => void
  latitude: number
  longitude: number
  label: string
}

const NAV_APPS: { id: NavApp; name: string; icon: string }[] = [
  { id: 'google', name: 'Google Maps', icon: '📍' },
  { id: 'apple', name: 'Apple Maps', icon: '🗺' },
  { id: 'waze', name: 'Waze', icon: '🚗' },
]

export default function DirectionsModal({ isOpen, onClose, latitude, longitude, label }: DirectionsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-steel mb-1">Get Directions</h3>
        <p className="text-sm text-gray-500 mb-4">{label}</p>
        <div className="space-y-2">
          {NAV_APPS.map((app) => (
            <a
              key={app.id}
              href={getDirectionsUrl(latitude, longitude, app.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-sand-50 transition-colors"
            >
              <span className="text-2xl">{app.icon}</span>
              <span className="font-medium text-steel">{app.name}</span>
            </a>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2 text-gray-500 text-sm">
          Cancel
        </button>
      </div>
    </div>
  )
}

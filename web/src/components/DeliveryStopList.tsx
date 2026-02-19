import type { Building } from '../lib/types'
import { BUILDING_CATEGORIES } from '../lib/types'

interface DeliveryStopListProps {
  stops: Building[]
  checkedStops: Set<string>
  onRemove: (buildingId: string) => void
  onReorder: (stops: Building[]) => void
  onToggleChecked: (buildingId: string) => void
  onGetDirections: (building: Building) => void
}

export default function DeliveryStopList({
  stops,
  checkedStops,
  onRemove,
  onReorder,
  onToggleChecked,
  onGetDirections,
}: DeliveryStopListProps) {
  if (stops.length === 0) {
    return (
      <div className="py-12 px-4 text-center text-gray-400">
        <svg className="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503-8.457a3.75 3.75 0 01-5.006 0L8.497 6.75A3.75 3.75 0 0112 3a3.75 3.75 0 013.503 3.75l-2 1.793zM12 21a9 9 0 100-18 9 9 0 000 18z" />
        </svg>
        <p className="text-sm">No stops added. Search for buildings above to start planning your route.</p>
      </div>
    )
  }

  const firstUncheckedIndex = stops.findIndex((s) => !checkedStops.has(s.id))

  function moveStop(index: number, direction: -1 | 1) {
    const newStops = [...stops]
    const targetIndex = index + direction
    ;[newStops[index], newStops[targetIndex]] = [newStops[targetIndex], newStops[index]]
    onReorder(newStops)
  }

  return (
    <div className="divide-y divide-gray-100">
      {stops.map((stop, index) => {
        const isChecked = checkedStops.has(stop.id)
        const isNextStop = index === firstUncheckedIndex
        const category = stop.category ? BUILDING_CATEGORIES[stop.category] : null

        return (
          <div
            key={stop.id}
            className={`flex items-center gap-2 py-3 px-4 transition-colors ${
              isChecked
                ? 'opacity-60 bg-gray-50'
                : isNextStop
                  ? 'bg-olive-50 border-l-4 border-l-olive-500'
                  : 'hover:bg-gray-50'
            }`}
          >
            {/* Reorder arrows */}
            <div className="flex flex-col gap-0.5 shrink-0">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => moveStop(index, -1)}
                className="flex items-center justify-center w-7 h-7 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                aria-label="Move up"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                disabled={index === stops.length - 1}
                onClick={() => moveStop(index, 1)}
                className="flex items-center justify-center w-7 h-7 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                aria-label="Move down"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Stop number */}
            <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-olive-100 text-olive-700 text-xs font-bold">
              {index + 1}
            </span>

            {/* Checkbox */}
            <button
              type="button"
              onClick={() => onToggleChecked(stop.id)}
              className="shrink-0 flex items-center justify-center w-6 h-6"
              aria-label={isChecked ? 'Mark as not delivered' : 'Mark as delivered'}
            >
              {isChecked ? (
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="9" />
                </svg>
              )}
            </button>

            {/* Building info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {category && <span className="text-sm" title={category.label}>{category.icon}</span>}
                <span className={`text-sm font-bold text-gray-900 ${isChecked ? 'line-through' : ''}`}>
                  Bldg {stop.building_number}
                </span>
              </div>
              {stop.name && (
                <p className={`text-xs text-gray-500 truncate ${isChecked ? 'line-through' : ''}`}>
                  {stop.name}
                </p>
              )}
              {stop.mgrs && (
                <p className="text-[10px] font-mono text-gray-400 tracking-wide">{stop.mgrs}</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onGetDirections(stop)}
                className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-olive-700 bg-olive-50 hover:bg-olive-100 rounded transition-colors min-h-[44px] min-w-[44px] justify-center"
                aria-label={`Directions to building ${stop.building_number}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline">Directions</span>
              </button>
              <button
                type="button"
                onClick={() => onRemove(stop.id)}
                className="flex items-center justify-center w-8 h-8 min-h-[44px] min-w-[44px] text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                aria-label={`Remove building ${stop.building_number}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

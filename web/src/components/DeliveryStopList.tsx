import type { Building } from '../lib/types'
import { BUILDING_CATEGORIES } from '../lib/types'
import { ChevronUpIcon, ChevronDownIcon, DirectionsIcon, CloseIcon, CircleCheckIcon, CircleIcon } from './Icons'

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
                className="flex items-center justify-center w-7 h-7 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-25 disabled:cursor-not-allowed active:scale-90 transition-all"
                aria-label="Move up"
              >
                <ChevronUpIcon />
              </button>
              <button
                type="button"
                disabled={index === stops.length - 1}
                onClick={() => moveStop(index, 1)}
                className="flex items-center justify-center w-7 h-7 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-25 disabled:cursor-not-allowed active:scale-90 transition-all"
                aria-label="Move down"
              >
                <ChevronDownIcon />
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
              className="shrink-0 flex items-center justify-center w-7 h-7 min-h-[44px] min-w-[44px]"
              aria-label={isChecked ? 'Mark as not delivered' : 'Mark as delivered'}
            >
              {isChecked ? (
                <CircleCheckIcon className="w-5 h-5 text-green-500" />
              ) : (
                <CircleIcon className="w-5 h-5 text-gray-300" />
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
                className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-olive-700 bg-olive-50 hover:bg-olive-100 rounded-lg active:scale-95 transition-all min-h-[44px] min-w-[44px] justify-center"
                aria-label={`Directions to building ${stop.building_number}`}
              >
                <DirectionsIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Directions</span>
              </button>
              <button
                type="button"
                onClick={() => onRemove(stop.id)}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg active:scale-95 transition-all"
                aria-label={`Remove building ${stop.building_number}`}
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Building } from '../lib/types'
import { BUILDING_CATEGORIES } from '../lib/types'
import { CopyIcon, CheckIcon, InfoIcon, MapIcon } from './Icons'

interface BuildingResultCardProps {
  building: Building
  onGetDirections: (building: Building) => void
}

function CopyField({ label, value, color }: { label: string; value: string; color?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center justify-between py-2">
      <div className="min-w-0">
        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
        <p className={`text-sm font-mono font-medium mt-0.5 ${color || 'text-gray-700'}`}>{value}</p>
      </div>
      <button
        onClick={handleCopy}
        className={`shrink-0 ml-3 p-2 rounded-lg border transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
          copied
            ? 'bg-green-50 border-green-200 text-green-600'
            : 'border-gray-200 text-gray-400 hover:text-olive-500 hover:border-olive-300'
        }`}
        aria-label={`Copy ${label}`}
      >
        {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default function BuildingResultCard({ building, onGetDirections }: BuildingResultCardProps) {
  const [showInfo, setShowInfo] = useState(false)
  const cat = building.category ? BUILDING_CATEGORIES[building.category] : null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            {cat && <span className="text-lg">{cat.icon}</span>}
            <h2 className="text-lg font-bold text-steel">
              Bldg {building.building_number}
            </h2>
          </div>
          {building.name && (
            <p className="text-olive-600 font-medium text-sm mt-0.5">{building.name}</p>
          )}
        </div>
        {cat && (
          <span
            className="text-[10px] font-medium px-2 py-1 rounded-full text-white shrink-0"
            style={{ backgroundColor: cat.color }}
          >
            {cat.label}
          </span>
        )}
      </div>

      {/* Info panel (expandable) */}
      {showInfo && (
        <div className="mt-3 bg-gray-50 rounded-xl p-4 divide-y divide-gray-200">
          <CopyField
            label="Coordinates"
            value={`${building.latitude.toFixed(6)}, ${building.longitude.toFixed(6)}`}
          />
          {building.mgrs && (
            <CopyField label="MGRS" value={building.mgrs} color="text-amber-700" />
          )}
          {building.plus_code && (
            <CopyField label="Plus Code" value={building.plus_code} color="text-blue-600" />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onGetDirections(building)}
          className="flex-1 py-2.5 bg-olive-500 text-white font-semibold rounded-xl hover:bg-olive-600 active:scale-[0.98] transition-all text-sm"
        >
          Get Directions
        </button>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className={`px-3 py-2.5 font-medium rounded-xl transition-all flex items-center gap-1.5 text-sm active:scale-95 ${
            showInfo
              ? 'bg-gray-100 text-gray-700 border border-gray-200'
              : 'border border-gray-200 text-gray-500 hover:text-olive-600 hover:border-olive-300'
          }`}
        >
          <InfoIcon className="w-4 h-4" />
          Info
        </button>
        <Link
          to={`/explore?lat=${building.latitude}&lng=${building.longitude}&zoom=17`}
          className="px-3 py-2.5 border border-gray-200 text-gray-500 font-medium rounded-xl hover:text-olive-600 hover:border-olive-300 active:scale-95 transition-all flex items-center gap-1 text-sm"
        >
          <MapIcon className="w-4 h-4" />
          Map
        </Link>
      </div>
    </div>
  )
}

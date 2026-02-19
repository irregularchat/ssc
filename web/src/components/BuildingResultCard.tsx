import { useState } from 'react'
import type { Building } from '../lib/types'
import { BUILDING_CATEGORIES } from '../lib/types'

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
        className="shrink-0 ml-3 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
        style={copied
          ? { borderColor: '#22c55e', color: '#22c55e', backgroundColor: '#f0fdf4' }
          : { borderColor: '#e5e7eb', color: '#6b7280' }
        }
        aria-label={`Copy ${label}`}
      >
        {copied ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
          </svg>
        )}
      </button>
    </div>
  )
}

export default function BuildingResultCard({ building, onGetDirections }: BuildingResultCardProps) {
  const [showInfo, setShowInfo] = useState(false)
  const cat = building.category ? BUILDING_CATEGORIES[building.category] : null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            {cat && <span className="text-lg">{cat.icon}</span>}
            <h2 className="text-xl font-bold text-steel">
              Bldg {building.building_number}
            </h2>
          </div>
          {building.name && (
            <p className="text-olive-500 font-medium mt-0.5">{building.name}</p>
          )}
        </div>
        {cat && (
          <span
            className="text-xs font-medium px-2 py-1 rounded-full text-white shrink-0"
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
            <CopyField
              label="MGRS"
              value={building.mgrs}
              color="text-amber-700"
            />
          )}
          {building.plus_code && (
            <CopyField
              label="Plus Code"
              value={building.plus_code}
              color="text-blue-600"
            />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onGetDirections(building)}
          className="flex-1 py-3 bg-olive-500 text-white font-semibold rounded-xl hover:bg-olive-600 transition-colors"
        >
          Get Directions
        </button>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className={`px-4 py-3 font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
            showInfo
              ? 'bg-gray-100 text-gray-700 border border-gray-200'
              : 'border border-olive-300 text-olive-600 hover:bg-olive-50'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          Info
        </button>
        <a
          href={`/explore?lat=${building.latitude}&lng=${building.longitude}&zoom=17`}
          onClick={() => {
            sessionStorage.setItem('milnav-selected', building.id)
          }}
          className="px-4 py-3 border border-olive-300 text-olive-600 font-semibold rounded-xl hover:bg-olive-50 transition-colors flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
          </svg>
          Map
        </a>
      </div>
    </div>
  )
}

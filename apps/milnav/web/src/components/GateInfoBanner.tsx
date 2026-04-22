import { useState } from 'react'
import { CloseIcon, ShieldCheckIcon, ChevronDownIcon } from './Icons'

interface GateInfoBannerProps {
  onDismiss: () => void
}

export default function GateInfoBanner({ onDismiss }: GateInfoBannerProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 relative">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-amber-400 hover:text-amber-600 transition-colors p-1"
        aria-label="Dismiss"
      >
        <CloseIcon className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 pr-6">
        <ShieldCheckIcon className="w-5 h-5 text-amber-600 shrink-0" />
        <h3 className="font-semibold text-amber-900 text-sm">All American Gate — Bldg H1575</h3>
      </div>

      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
        Most visitors enter Fort Bragg via the All American Gate on Reilly Rd. Anyone with a REAL ID can enter at normal FPCON levels.
      </p>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 mt-3 text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors"
      >
        <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        Access Details
      </button>

      {expanded && (
        <ul className="mt-2 space-y-1.5 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-1 shrink-0">&#8226;</span>
            REAL ID or passport required for base access
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-1 shrink-0">&#8226;</span>
            Gate is staffed 24/7 (hours may vary with FPCON level)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-1 shrink-0">&#8226;</span>
            Have vehicle registration and insurance ready
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-1 shrink-0">&#8226;</span>
            Visitor Center (Bldg 110) is just inside the gate for those needing a visitor pass
          </li>
        </ul>
      )}
    </div>
  )
}

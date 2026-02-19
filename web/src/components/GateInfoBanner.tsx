import { useState } from 'react'

interface GateInfoBannerProps {
  onDismiss: () => void
}

export default function GateInfoBanner({ onDismiss }: GateInfoBannerProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 relative">
      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-amber-400 hover:text-amber-600 transition-colors p-1"
        aria-label="Dismiss"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header */}
      <div className="flex items-center gap-2 pr-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-amber-600 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
        <h3 className="font-semibold text-amber-900 text-sm">All American Gate — Bldg H1575</h3>
      </div>

      {/* Body */}
      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
        Most visitors enter Fort Bragg via the All American Gate on Reilly Rd. Anyone with a REAL ID can enter at normal FPCON levels. Commercial vehicles may be subject to inspection.
      </p>

      {/* Expandable section */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 mt-3 text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
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

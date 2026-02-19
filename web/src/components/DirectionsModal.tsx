import React, { useState } from 'react'
import { getDirectionsUrl, type NavApp } from '../lib/directions'

interface DirectionsModalProps {
  isOpen: boolean
  onClose: () => void
  latitude: number
  longitude: number
  label: string
  buildingNumber?: string
  buildingId?: string
  mgrs?: string | null
  plusCode?: string | null
}

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
  </svg>
)

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
)

const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
)

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
  </svg>
)

const NAV_APPS: { id: NavApp; name: string; subtitle: string; iconBg: string; iconColor: string; icon: React.ReactNode }[] = [
  {
    id: 'google',
    name: 'Google Maps',
    subtitle: 'Open in app or browser',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M12 0C7.31 0 3.5 3.81 3.5 8.5c0 5.42 7.79 14.85 8.13 15.25.19.23.55.23.74 0 .34-.4 8.13-9.83 8.13-15.25C20.5 3.81 16.69 0 12 0zm0 11.5c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
      </svg>
    ),
  },
  {
    id: 'apple',
    name: 'Apple Maps',
    subtitle: 'Open in app',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-700',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>
    ),
  },
  {
    id: 'waze',
    name: 'Waze',
    subtitle: 'Open in app',
    iconBg: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M20.54 6.63c-2.83-4.36-8.7-5.3-12.67-2.27-.54.41-1.03.87-1.47 1.37C4.64 7.85 3.76 10.58 4.23 13.2c.25 1.37.82 2.62 1.57 3.73.2.29.1.69-.22.85-.9.47-1.43 1.4-1.43 2.42 0 1.52 1.23 2.75 2.75 2.75 1.03 0 1.93-.57 2.41-1.41.16-.27.52-.37.8-.22 1.24.65 2.62 1 4.05 1 5.06 0 9.27-3.88 9.78-8.95.27-2.69-.51-5.32-2.13-7.37-.47-.6-.99-1.14-1.56-1.62zM9 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm6 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
      </svg>
    ),
  },
]

export default function DirectionsModal({ isOpen, onClose, latitude, longitude, label, buildingNumber, mgrs, plusCode }: DirectionsModalProps) {
  const [copiedCoords, setCopiedCoords] = useState(false)
  const [copiedMGRS, setCopiedMGRS] = useState(false)
  const [copiedPlusCode, setCopiedPlusCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState<NavApp | null>(null)
  const [showPlusCodeTooltip, setShowPlusCodeTooltip] = useState(false)

  if (!isOpen) return null

  const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`

  const handleCopyCoords = async () => {
    await navigator.clipboard.writeText(coords)
    setCopiedCoords(true)
    setTimeout(() => setCopiedCoords(false), 2000)
  }

  const handleCopyMGRS = async () => {
    if (!mgrs) return
    await navigator.clipboard.writeText(mgrs)
    setCopiedMGRS(true)
    setTimeout(() => setCopiedMGRS(false), 2000)
  }

  const handleCopyPlusCode = async () => {
    if (!plusCode) return
    await navigator.clipboard.writeText(plusCode)
    setCopiedPlusCode(true)
    setTimeout(() => setCopiedPlusCode(false), 2000)
  }

  const handleCopyLink = async (app: NavApp) => {
    const url = getDirectionsUrl(latitude, longitude, app)
    await navigator.clipboard.writeText(url)
    setCopiedLink(app)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-olive-700 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-white">Get Directions</h2>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-white/80 text-sm mt-1 truncate">{label}</p>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Coordinates section */}
          <div className="bg-sand-50 p-3 rounded-xl border border-sand-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Coordinates</p>
                <p className="text-sm font-mono text-steel mt-0.5">{coords}</p>
                {buildingNumber && (
                  <p className="text-xs text-gray-400 mt-0.5">Fort Bragg, NC</p>
                )}
              </div>
              <button
                onClick={handleCopyCoords}
                className={`p-2 rounded-lg border transition-all ${
                  copiedCoords
                    ? 'bg-green-50 border-green-200 text-green-600'
                    : 'bg-white border-gray-200 text-gray-400 hover:text-olive-500 hover:border-olive-300'
                }`}
                title="Copy coordinates"
              >
                {copiedCoords ? <CheckIcon /> : <CopyIcon />}
              </button>
            </div>
          </div>

          {/* MGRS section */}
          {mgrs && (
            <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">MGRS</p>
                  <p className="text-sm font-mono text-steel mt-0.5 tracking-wider">{mgrs}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Military Grid Reference System</p>
                </div>
                <button
                  onClick={handleCopyMGRS}
                  className={`p-2 rounded-lg border transition-all ${
                    copiedMGRS
                      ? 'bg-green-50 border-green-200 text-green-600'
                      : 'bg-white border-gray-200 text-gray-400 hover:text-amber-600 hover:border-amber-300'
                  }`}
                  title="Copy MGRS coordinate"
                >
                  {copiedMGRS ? <CheckIcon /> : <CopyIcon />}
                </button>
              </div>
            </div>
          )}

          {/* Plus Code section */}
          {plusCode && (
            <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Plus Code</p>
                    <button
                      onClick={() => setShowPlusCodeTooltip(!showPlusCodeTooltip)}
                      className="text-gray-400 hover:text-blue-500 transition-colors"
                      title="What is a Plus Code?"
                    >
                      <InfoIcon />
                    </button>
                  </div>
                  <p className="text-sm font-mono text-steel mt-0.5 tracking-wider">{plusCode}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={handleCopyPlusCode}
                    className={`p-2 rounded-lg border transition-all ${
                      copiedPlusCode
                        ? 'bg-green-50 border-green-200 text-green-600'
                        : 'bg-white border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-300'
                    }`}
                    title="Copy Plus Code"
                  >
                    {copiedPlusCode ? <CheckIcon /> : <CopyIcon />}
                  </button>
                  <a
                    href={`https://plus.codes/${plusCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-blue-500 hover:border-blue-300 transition-all"
                    title="Open in Plus Codes"
                  >
                    <ExternalLinkIcon />
                  </a>
                </div>
              </div>

              {/* Tooltip */}
              {showPlusCodeTooltip && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-blue-100 text-xs text-gray-600 space-y-2">
                  <p className="font-semibold text-steel">What is a Plus Code?</p>
                  <p>
                    Plus Codes (Open Location Code) are short codes created by Google that work like street addresses for places that don't have one.
                    Each code represents a ~3m x 3m area — precise enough to find a specific building entrance.
                  </p>
                  <p className="font-medium text-steel">How to use it:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-500">
                    <li>Copy the code above (e.g. <span className="font-mono text-blue-500">87735266+397</span>)</li>
                    <li>Paste it directly into <span className="font-semibold">Google Maps</span> search bar</li>
                    <li>Google Maps will navigate you to the exact spot</li>
                  </ol>
                  <p className="text-gray-400">
                    Works offline, no app needed — just paste into Google Maps. Free and open-source.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation app buttons */}
          <div className="space-y-2">
            {NAV_APPS.map((app) => (
              <div key={app.id} className="flex gap-2">
                <a
                  href={getDirectionsUrl(latitude, longitude, app.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-between p-3.5 bg-white hover:bg-sand-50 border border-gray-200 hover:border-olive-300 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${app.iconBg} rounded-lg flex items-center justify-center ${app.iconColor}`}>
                      {app.icon}
                    </div>
                    <div className="text-left">
                      <span className="block font-semibold text-steel">{app.name}</span>
                      <span className="text-xs text-gray-400 group-hover:text-olive-400 transition-colors">
                        {app.subtitle}
                      </span>
                    </div>
                  </div>
                  <ExternalLinkIcon />
                </a>
                <button
                  onClick={() => handleCopyLink(app.id)}
                  className={`w-12 flex items-center justify-center rounded-xl border transition-all ${
                    copiedLink === app.id
                      ? 'bg-green-50 border-green-200 text-green-600'
                      : 'bg-white border-gray-200 text-gray-400 hover:text-olive-500 hover:border-olive-300'
                  }`}
                  title={`Copy ${app.name} link`}
                >
                  {copiedLink === app.id ? <CheckIcon /> : <CopyIcon />}
                </button>
              </div>
            ))}

            {/* Plus Code nav option */}
            {plusCode && (
              <div className="flex gap-2">
                <a
                  href={`https://plus.codes/${plusCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-between p-3.5 bg-white hover:bg-blue-50/50 border border-gray-200 hover:border-blue-300 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <span className="block font-semibold text-steel">Plus Code</span>
                      <span className="text-xs text-gray-400 group-hover:text-blue-400 transition-colors font-mono">
                        {plusCode}
                      </span>
                    </div>
                  </div>
                  <ExternalLinkIcon />
                </a>
                <button
                  onClick={handleCopyPlusCode}
                  className={`w-12 flex items-center justify-center rounded-xl border transition-all ${
                    copiedPlusCode
                      ? 'bg-green-50 border-green-200 text-green-600'
                      : 'bg-white border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-300'
                  }`}
                  title="Copy Plus Code"
                >
                  {copiedPlusCode ? <CheckIcon /> : <CopyIcon />}
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-gray-400">
            Tap to open in your preferred navigation app
          </p>
        </div>
      </div>
    </div>
  )
}

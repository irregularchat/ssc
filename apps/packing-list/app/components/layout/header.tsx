import { useState, useRef, useEffect } from 'react'
import { Link, useLocation as useRouterLocation } from 'react-router'
import { Package, Store, Command, MapPin, ChevronDown, Check, GraduationCap } from 'lucide-react'
import { useLocation } from '~/lib/location'

const navLinks = [
  { path: '/', label: 'Lists', icon: Package },
  { path: '/stores', label: 'Stores', icon: Store },
  { path: '/schools', label: 'Schools', icon: GraduationCap },
]

export function Header() {
  const routerLocation = useRouterLocation()
  const { selectedBase, setSelectedBase, bases } = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Group bases by branch
  const basesByBranch = bases.reduce((acc, base) => {
    const branch = base.branch || 'Other'
    if (!acc[branch]) acc[branch] = []
    acc[branch].push(base)
    return acc
  }, {} as Record<string, typeof bases>)

  return (
    <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-text-primary flex items-center justify-center">
                <Command size={16} className="text-text-inverse" />
              </div>
              <span className="font-semibold text-text-primary hidden sm:block">
                CPL
              </span>
            </Link>

            {/* Location Selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm
                  transition-colors duration-150 border
                  ${selectedBase
                    ? 'bg-accent/10 border-accent/30 text-accent'
                    : 'bg-bg-subtle border-border text-text-secondary hover:text-text-primary hover:border-border-hover'
                  }
                `}
              >
                <MapPin size={14} />
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {selectedBase ? selectedBase.name : 'All Locations'}
                </span>
                <span className="sm:hidden">
                  {selectedBase ? selectedBase.abbreviation || selectedBase.name.slice(0, 8) : 'All'}
                </span>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 max-h-80 overflow-y-auto rounded-lg bg-bg-elevated border border-border shadow-xl z-50">
                  {/* All Locations Option */}
                  <button
                    onClick={() => {
                      setSelectedBase(null)
                      setIsOpen(false)
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 text-sm text-left
                      transition-colors hover:bg-bg-subtle
                      ${!selectedBase ? 'text-accent bg-accent/5' : 'text-text-primary'}
                    `}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin size={14} />
                      All Locations
                    </span>
                    {!selectedBase && <Check size={14} />}
                  </button>

                  <div className="border-t border-border" />

                  {/* Bases grouped by branch */}
                  {Object.entries(basesByBranch).map(([branch, branchBases]) => (
                    <div key={branch}>
                      <div className="px-3 py-1.5 text-xs font-medium text-text-muted uppercase tracking-wider bg-bg-subtle">
                        {branch}
                      </div>
                      {branchBases.map((base) => (
                        <button
                          key={base.id}
                          onClick={() => {
                            setSelectedBase(base)
                            setIsOpen(false)
                          }}
                          className={`
                            w-full flex items-center justify-between px-3 py-2 text-sm text-left
                            transition-colors hover:bg-bg-subtle
                            ${selectedBase?.id === base.id ? 'text-accent bg-accent/5' : 'text-text-primary'}
                          `}
                        >
                          <span className="truncate">
                            {base.name}
                            {base.state && (
                              <span className="text-text-muted ml-1">({base.state})</span>
                            )}
                          </span>
                          {selectedBase?.id === base.id && <Check size={14} className="flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = routerLocation.pathname === link.path
              const Icon = link.icon
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                    transition-colors duration-150
                    ${isActive
                      ? 'bg-bg-elevated text-text-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
                    }
                  `}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </header>
  )
}

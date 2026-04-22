import { useLocation, Link } from 'react-router-dom'
import { SearchIcon, MapIcon, TruckIcon } from './Icons'

const NAV_ITEMS = [
  { path: '/', label: 'Search', icon: SearchIcon },
  { path: '/explore', label: 'Explore', icon: MapIcon },
  { path: '/deliver', label: 'Deliver', icon: TruckIcon },
] as const

export default function NavBar() {
  const { pathname } = useLocation()

  return (
    <>
      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 pb-safe">
        <div className="flex items-center justify-around h-16">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[48px] px-3 py-1.5 rounded-xl transition-colors ${
                  isActive
                    ? 'text-olive-600'
                    : 'text-gray-400 active:text-gray-600'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-olive-600' : ''}`} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-olive-600' : ''}`}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop top nav */}
      <header className="hidden md:block bg-olive-700 text-white shrink-0">
        <div className="w-full max-w-7xl mx-auto px-6 h-14 flex items-center gap-8">
          <Link to="/" className="font-bold text-lg tracking-tight hover:text-sand-200 transition-colors">
            Fort Maps
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const isActive = pathname === path
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-olive-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
          </nav>
          <div className="flex-1" />
          <span className="text-olive-300 text-sm">Fort Liberty (Bragg), NC</span>
        </div>
      </header>
    </>
  )
}

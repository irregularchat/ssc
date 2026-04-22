import { Link, useLocation } from 'react-router'
import { Home, Package, Plus, Store } from 'lucide-react'

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/lists', icon: Package, label: 'Lists' },
  { path: '/list/create', icon: Plus, label: 'New', isAction: true },
  { path: '/stores', icon: Store, label: 'Stores' },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-bg/90 backdrop-blur-md border-t border-border pb-safe">
        <div className="flex items-center justify-around h-16 px-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path === '/lists' && location.pathname.startsWith('/list/') && !location.pathname.includes('create'))
            const Icon = item.icon

            if (item.isAction) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center justify-center"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-text-primary transition-transform active:scale-95">
                    <Plus size={20} className="text-text-inverse" />
                  </div>
                </Link>
              )
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex flex-col items-center justify-center flex-1 h-full
                  transition-colors duration-150
                  ${isActive ? 'text-text-primary' : 'text-text-muted'}
                `}
              >
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

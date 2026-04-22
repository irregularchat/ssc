import { useState } from 'react'
import { Link, useLocation, Form } from 'react-router'
import {
  LayoutDashboard,
  Store,
  Package,
  MapPin,
  GraduationCap,
  ClipboardList,
  DollarSign,
  LogOut,
  Menu,
  X,
  Command,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '~/components/ui/button'

interface AdminLayoutProps {
  children: ReactNode
}

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/stores', label: 'Stores', icon: Store },
  { path: '/admin/items', label: 'Items', icon: Package },
  { path: '/admin/bases', label: 'Bases', icon: MapPin },
  { path: '/admin/schools', label: 'Schools', icon: GraduationCap },
  { path: '/admin/lists', label: 'Lists', icon: ClipboardList },
  { path: '/admin/prices', label: 'Prices', icon: DollarSign },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 bg-bg/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-bg-subtle transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} className="text-text-primary" />
            </button>
            <span className="font-semibold text-text-primary">Admin Panel</span>
          </div>
          <Form action="/admin/logout" method="post">
            <Button type="submit" variant="ghost" size="sm">
              <LogOut size={16} />
            </Button>
          </Form>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-60 bg-bg border-r border-border
          transform transition-transform duration-200 ease-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between h-14 px-4 border-b border-border">
            <Link to="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <Command size={16} className="text-white" />
              </div>
              <span className="font-semibold text-text-primary">CPL Admin</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-bg-subtle transition-colors"
              aria-label="Close menu"
            >
              <X size={18} className="text-text-muted" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path, item.exact)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                    transition-colors duration-150
                    ${
                      active
                        ? 'bg-accent/10 text-accent border border-accent/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-subtle border border-transparent'
                    }
                  `}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="p-3 border-t border-border">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-success" />
              <span>Back to Site</span>
            </Link>
            <Form action="/admin/logout" method="post" className="mt-1">
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-error hover:bg-error/10 transition-colors"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </Form>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-60">
        {/* Desktop header */}
        <header className="hidden lg:flex sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between w-full h-14 px-6">
            <h1 className="text-lg font-semibold text-text-primary">Admin Panel</h1>
            <Form action="/admin/logout" method="post">
              <Button type="submit" variant="ghost" size="sm">
                <LogOut size={16} />
                <span>Logout</span>
              </Button>
            </Form>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}

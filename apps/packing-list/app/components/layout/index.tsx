import type { ReactNode } from 'react'
import { Header } from './header'
import { BottomNav } from './bottom-nav'
import { Footer } from './footer'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}

export { Header, BottomNav, Footer }

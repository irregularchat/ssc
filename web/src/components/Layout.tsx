import { Outlet } from 'react-router-dom'
import NavBar from './NavBar'

export default function Layout() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <NavBar />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden pb-20 md:pb-0">
        <Outlet />
      </main>
    </div>
  )
}

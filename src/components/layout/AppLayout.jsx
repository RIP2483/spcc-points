import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-dvh flex bg-sand-50">
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen(o => !o)} />

      <main className="page-content animate-fade-in flex-1 w-full">
        {/* Spacer for mobile top bar */}
        <div className="h-14 md:hidden" />
        <Outlet />
      </main>
    </div>
  )
}

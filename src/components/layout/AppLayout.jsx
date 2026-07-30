import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out')
    navigate('/login')
  }

  return (
    <div className="min-h-dvh flex bg-sand-50">
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuToggle={() => setSidebarOpen(o => !o)} />

      {/* Spacer for mobile top bar */}
      <div className="h-14 md:hidden w-full absolute top-0" />

      <main className="page-content animate-fade-in flex-1 w-full relative">
        {/* Desktop-only Logout Button in top right */}
        <div className="hidden md:flex justify-end mb-4 right-8 top-6 absolute z-10">
          <button
            onClick={handleSignOut}
            className="btn btn-secondary btn-sm shadow-sm"
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
        
        {/* Content area */}
        <div className="pt-12 md:pt-0">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

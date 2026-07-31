import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Clock, Users, Building2,
  ShieldCheck, LogOut, ChevronRight, X, KeyRound
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import ChangePasswordModal from '../admin/ChangePasswordModal'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['committee', 'head', 'exco', 'secretary'] },
  { to: '/history',   label: 'My History',  icon: Clock,          roles: ['committee', 'head', 'exco', 'secretary'] },
  { to: '/department',label: 'Department',  icon: Building2,      roles: ['head'] },
  { to: '/members',   label: 'Members',     icon: Users,          roles: ['exco', 'secretary'] },
  { to: '/admin',     label: 'Admin Panel', icon: ShieldCheck,    roles: ['secretary'] },
]

export default function Sidebar({ mobileOpen, onClose }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [showChangePw, setShowChangePw] = useState(false)

  const visibleItems = NAV_ITEMS.filter(
    item => profile && item.roles.includes(profile.role)
  )

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out')
    navigate('/login')
  }

  const initials = profile?.name
    ? profile.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Logo area */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-green-800/40">
          <img
            src="/spcc_logo.png"
            alt="SPCC Logo"
            className="w-9 h-9 rounded-lg object-contain bg-white/10 p-0.5"
          />
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">SPCC</p>
            <p className="text-green-300 text-xs truncate">Points Tracker</p>
          </div>
          {/* Mobile close */}
          <button
            onClick={onClose}
            className="ml-auto btn-icon btn-ghost text-green-300 md:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {visibleItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              <ChevronRight size={14} className="ml-auto opacity-40" />
            </NavLink>
          ))}
        </nav>

        {/* User footer — always pinned to bottom */}
        <div className="mt-auto border-t border-green-800/40 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-green-700 flex items-center justify-center
                            text-white font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{profile?.name ?? '—'}</p>
              <p className="text-green-400 text-xs truncate capitalize">{profile?.role}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg
                       bg-green-800/50 hover:bg-red-900/60 text-green-200 hover:text-white
                       text-sm font-semibold transition-all duration-200 border border-green-700/40
                       hover:border-red-700/60"
            id="sidebar-signout-btn"
          >
            <LogOut size={16} />
            Sign Out
          </button>

          <button
            onClick={() => setShowChangePw(true)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg mt-1
                       text-green-400 hover:text-green-200 hover:bg-green-800/30
                       text-xs font-medium transition-all duration-200"
            id="sidebar-changepw-btn"
          >
            <KeyRound size={13} />
            Change Password
          </button>
        </div>
      </aside>

      {showChangePw && (
        <ChangePasswordModal onClose={() => setShowChangePw(false)} />
      )}
    </>
  )
}

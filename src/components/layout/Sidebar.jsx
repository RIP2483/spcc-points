import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Clock, Users, Building2,
  ShieldCheck, LogOut, ChevronRight, X, KeyRound, Trophy
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import ChangePasswordModal from '../admin/ChangePasswordModal'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { to: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard, roles: ['committee', 'head', 'exco', 'secretary'] },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy,          roles: ['committee', 'head', 'exco', 'secretary'] },
  { to: '/history',     label: 'My History',  icon: Clock,           roles: ['committee', 'head', 'exco', 'secretary'] },
  { to: '/department',  label: 'Department',  icon: Building2,       roles: ['head'] },
  { to: '/members',     label: 'Members',     icon: Users,           roles: ['exco', 'secretary'] },
  { to: '/admin',       label: 'Admin Panel', icon: ShieldCheck,     roles: ['secretary'] },
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
            className="w-11 h-11 object-contain"
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

        {/* Navigation links */}
        <nav className="py-4 px-3">
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

        {/* Action buttons — Sign Out + Change Password */}
        <div className="px-3 pb-3 space-y-1 border-t border-green-800/40 pt-3">
          <button
            onClick={handleSignOut}
            className="sidebar-link w-full text-left text-green-200 hover:text-white hover:bg-red-900/40"
            id="sidebar-signout-btn"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
          <button
            onClick={() => setShowChangePw(true)}
            className="sidebar-link w-full text-left text-green-300 hover:text-white"
            id="sidebar-changepw-btn"
          >
            <KeyRound size={18} />
            <span>Change Password</span>
          </button>
        </div>

        {/* User info strip — pinned to bottom */}
        <div className="mt-auto border-t border-green-800/40 px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center
                          text-white font-bold text-xs flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{profile?.name ?? '—'}</p>
            <p className="text-green-400 text-xs truncate capitalize">{profile?.role}</p>
          </div>
        </div>
      </aside>

      {showChangePw && (
        <ChangePasswordModal onClose={() => setShowChangePw(false)} />
      )}
    </>
  )
}

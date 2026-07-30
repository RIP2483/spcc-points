import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Clock, Users, Building2, ShieldCheck, Menu, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { to: '/dashboard',  label: 'Home',       icon: LayoutDashboard, roles: ['committee', 'head', 'exco', 'secretary'] },
  { to: '/history',    label: 'History',    icon: Clock,           roles: ['committee', 'head', 'exco', 'secretary'] },
  { to: '/department', label: 'Dept',       icon: Building2,       roles: ['head'] },
  { to: '/members',    label: 'Members',    icon: Users,           roles: ['exco', 'secretary'] },
  { to: '/admin',      label: 'Admin',      icon: ShieldCheck,     roles: ['secretary'] },
]

export default function TopBar({ onMenuToggle }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const visibleItems = NAV_ITEMS.filter(
    item => profile && item.roles.includes(profile.role)
  )

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out')
    navigate('/login')
  }

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-green-950 flex items-center px-4 h-14 md:hidden border-b border-green-800/40">
        <button
          onClick={onMenuToggle}
          className="btn-icon btn-ghost text-green-200 mr-3"
          aria-label="Open menu"
          id="mobile-menu-btn"
        >
          <Menu size={22} />
        </button>
        <img src="/spcc_logo.png" alt="SPCC" className="w-7 h-7 rounded object-contain" />
        <span className="text-white font-bold ml-2 text-sm">SPCC Points</span>

        <button
          onClick={handleSignOut}
          className="ml-auto btn-icon btn-ghost text-green-300 hover:text-white"
          aria-label="Sign out"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav md:hidden">
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}

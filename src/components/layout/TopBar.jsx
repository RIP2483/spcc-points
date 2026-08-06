import { useNavigate } from 'react-router-dom'
import { Menu, LogOut, Sun, Moon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import toast from 'react-hot-toast'

export default function TopBar({ onMenuToggle }) {
  const { signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out')
    navigate('/login')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-green-950 flex items-center px-4 h-14 md:hidden border-b border-green-800/40">
      <button
        onClick={onMenuToggle}
        className="btn-icon btn-ghost text-green-200 mr-3"
        aria-label="Open menu"
        id="mobile-menu-btn"
      >
        <Menu size={22} />
      </button>
      <img src="/spcc_logo.png" alt="SPCC" className="w-9 h-9 object-contain" />
      <span className="text-white font-bold ml-2 text-sm">SPCC Points</span>

      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="btn-icon btn-ghost text-green-200 hover:text-white"
          aria-label="Toggle theme"
          id="mobile-theme-toggle-btn"
        >
          {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-blue-300" />}
        </button>
        <button
          onClick={handleSignOut}
          className="btn-icon btn-ghost text-green-300 hover:text-white"
          aria-label="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}

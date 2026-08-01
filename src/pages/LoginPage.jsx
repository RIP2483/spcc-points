import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(email.trim(), password)
    setLoading(false)
    if (error) {
      toast.error(error.message || 'Invalid credentials')
    } else {
      navigate(from, { replace: true })
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #1a3d2b 0%, #2d6a4f 50%, #40916c 100%)' }}>

      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo card */}
        <div className="text-center mb-8">
          <img src="/spcc_logo.png" alt="SPCC Logo" className="w-24 h-24 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">SPCC Points Tracker</h1>
          <p className="text-green-200 text-sm mt-1">Sunway Pakistani Cultural Club</p>
        </div>

        {/* Login card */}
        <div className="card p-8">
          <h2 className="text-xl font-bold text-green-900 mb-6">Sign in</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="login-password">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600"
                  aria-label="Toggle password"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full mt-2"
              disabled={loading}
              id="login-submit-btn"
            >
              {loading
                ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><LogIn size={18} /> Sign in</>}
            </button>
          </form>

          <p className="text-center text-xs text-green-600 mt-6">
            Contact your club secretary to get access.
          </p>
        </div>

        <p className="text-center text-green-300/60 text-xs mt-6">
          © {new Date().getFullYear()} Sunway Pakistani Cultural Club
        </p>
      </div>
    </div>
  )
}

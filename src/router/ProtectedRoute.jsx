import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_HIERARCHY = {
  committee: 1,
  head: 2,
  exco: 3,
  secretary: 4,
}

/**
 * Wraps a route so only authenticated users with sufficient role can access it.
 * @param {string[]} [roles] - allowed roles; omit to allow any authenticated user
 */
export default function ProtectedRoute({ children, roles }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-green-300 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

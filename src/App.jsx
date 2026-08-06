import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './router/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'

import LoginPage        from './pages/LoginPage'
import DashboardPage    from './pages/DashboardPage'
import HistoryPage      from './pages/HistoryPage'
import LeaderboardPage  from './pages/LeaderboardPage'
import DepartmentPage   from './pages/DepartmentPage'
import MembersPage      from './pages/MembersPage'
import AdminPage        from './pages/AdminPage'
import MemberDetailPage from './pages/MemberDetailPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"   element={<DashboardPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/history"     element={<HistoryPage />} />

            {/* Head only */}
            <Route
              path="/department"
              element={
                <ProtectedRoute roles={['head', 'secretary']}>
                  <DepartmentPage />
                </ProtectedRoute>
              }
            />

            {/* Exco + Secretary */}
            <Route
              path="/members"
              element={
                <ProtectedRoute roles={['exco', 'secretary']}>
                  <MembersPage />
                </ProtectedRoute>
              }
            />

            {/* Secretary only */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['secretary']}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            {/* Member detail — auth guard is inside the page component */}
            <Route path="/member/:id" element={<MemberDetailPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: 'Inter, sans-serif',
            borderRadius: '0.75rem',
            border: '1px solid #d8f3dc',
            boxShadow: '0 8px 32px rgba(45,106,79,0.15)',
          },
          success: { iconTheme: { primary: '#2d6a4f', secondary: '#f5f0e8' } },
        }}
      />
    </AuthProvider>
  )
}

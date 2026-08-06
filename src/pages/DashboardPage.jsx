import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { canAwardTo, formatAmount, formatDate, roleLabel, roleBadgeClass } from '../lib/permissions'
import AddPointsModal from '../components/transactions/AddPointsModal'
import { Plus, TrendingUp, TrendingDown, Clock } from 'lucide-react'

export default function DashboardPage() {
  const { profile } = useAuth()
  const [balance, setBalance] = useState(null)
  const [recentTx, setRecentTx] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [canAward, setCanAward] = useState(false)

  const fetchData = useCallback(async () => {
    if (!profile) return
    setLoading(true)

    // Check if this user can award to anyone
    const { data: allMembers } = await supabase.from('users').select('id, role, department')
    const hasTargets = allMembers?.some(m => canAwardTo(profile, m))
    setCanAward(hasTargets)

    // Get balance — only count APPROVED transactions
    const { data: sumData } = await supabase
      .from('point_transactions')
      .select('amount')
      .eq('member_id', profile.id)
      .eq('status', 'approved')
    const total = sumData?.reduce((acc, t) => acc + t.amount, 0) ?? 0
    setBalance(total)

    // Get recent approved transactions (last 5)
    const { data: txData } = await supabase
      .from('point_transactions')
      .select(`
        id, amount, reason, created_at,
        awarded_by_user:awarded_by(name, role)
      `)
      .eq('member_id', profile.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(5)
    setRecentTx(txData ?? [])

    setLoading(false)
  }, [profile])

  useEffect(() => { fetchData() }, [fetchData])

  const positiveTotal = recentTx.filter(t => t.amount > 0).reduce((a, t) => a + t.amount, 0)
  const negativeTotal = recentTx.filter(t => t.amount < 0).reduce((a, t) => a + t.amount, 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-green-900">
            Welcome back, {profile?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-green-600 mt-0.5">
            <span className={roleBadgeClass(profile?.role)}>{roleLabel(profile?.role)}</span>
            {profile?.department && (
              <span className="ml-2 text-sm capitalize text-green-600">· {profile.department} dept.</span>
            )}
          </p>
        </div>
        {canAward && (
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
            id="dashboard-award-btn"
          >
            <Plus size={16} /> Award Points
          </button>
        )}
      </div>

      {/* Points balance card */}
      <div className="card p-8 text-center relative overflow-hidden">
        {/* Decorative circle */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-5"
          style={{ background: 'var(--color-green-800)' }} />

        <p className="text-sm font-semibold uppercase tracking-widest text-green-600 mb-2">
          Your Current Points
        </p>
        {loading ? (
          <div className="skeleton h-16 w-40 mx-auto rounded-xl" />
        ) : (
          <div className={`text-7xl font-black tracking-tight ${balance >= 0 ? 'points-positive' : 'points-negative'}`}>
            {balance ?? 0}
          </div>
        )}
        <p className="text-green-500 text-sm mt-2">points balance</p>

        {/* Mini stats */}
        {!loading && recentTx.length > 0 && (
          <div className="flex justify-center gap-8 mt-6 pt-6 border-t border-sand-200">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-green-600" />
              <span className="text-sm text-green-700 font-semibold points-positive">+{positiveTotal}</span>
              <span className="text-xs text-green-500">recent awards</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown size={16} className="text-red-500" />
              <span className="text-sm font-semibold points-negative">{negativeTotal}</span>
              <span className="text-xs text-green-500">recent deductions</span>
            </div>
          </div>
        )}
      </div>

      {/* Recent transactions */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-sand-200">
          <h2 className="font-bold text-green-900 flex items-center gap-2">
            <Clock size={16} className="text-green-600" />
            Recent Activity
          </h2>
          <Link to="/history" className="btn btn-ghost btn-sm text-green-600">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-lg" />
            ))}
          </div>
        ) : recentTx.length === 0 ? (
          <div className="empty-state">
            <Clock size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No activity yet</p>
            <p className="text-sm text-green-600">Your point history will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-sand-100">
            {recentTx.map(tx => (
              <div key={tx.id} className="flex items-center gap-4 px-6 py-4 hover:bg-sand-50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm
                  ${tx.amount >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {tx.amount >= 0 ? '+' : '−'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-900 truncate">{tx.reason}</p>
                  <p className="text-xs text-green-600">
                    By {tx.awarded_by_user?.name} · {formatDate(tx.created_at)}
                  </p>
                </div>
                <span className={`font-bold text-base flex-shrink-0 ${tx.amount >= 0 ? 'points-positive' : 'points-negative'}`}>
                  {formatAmount(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddPointsModal onClose={() => setShowModal(false)} onSuccess={fetchData} />
      )}
    </div>
  )
}

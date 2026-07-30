import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { canViewMember, canAwardTo, roleBadgeClass, roleLabel, formatAmount, formatDate } from '../lib/permissions'
import AddPointsModal from '../components/transactions/AddPointsModal'
import { ArrowLeft, Plus } from 'lucide-react'

export default function MemberDetailPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [notAuthorized, setNotAuthorized] = useState(false)

  const fetchData = useCallback(async () => {
    if (!profile || !id) return
    setLoading(true)

    // Fetch member profile
    const { data: memberData, error } = await supabase
      .from('users')
      .select('id, name, role, department')
      .eq('id', id)
      .single()

    if (error || !memberData) {
      setNotAuthorized(true)
      setLoading(false)
      return
    }

    // Check client-side permission (RLS also enforces this server-side)
    if (!canViewMember(profile, memberData)) {
      setNotAuthorized(true)
      setLoading(false)
      return
    }

    setMember(memberData)

    // Fetch transactions
    const { data: txData } = await supabase
      .from('point_transactions')
      .select(`
        id, amount, reason, created_at,
        awarded_by_user:awarded_by(name, role)
      `)
      .eq('member_id', id)
      .order('created_at', { ascending: false })

    setTransactions(txData ?? [])
    setBalance(txData?.reduce((a, t) => a + t.amount, 0) ?? 0)
    setLoading(false)
  }, [profile, id])

  useEffect(() => { fetchData() }, [fetchData])

  if (notAuthorized) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 animate-fade-in">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-green-900">Access Restricted</h1>
        <p className="text-green-600 mt-2">You don't have permission to view this member's details.</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary mt-6">Go back</button>
      </div>
    )
  }

  const canAward = member && canAwardTo(profile, member)

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm text-green-700">
        <ArrowLeft size={16} /> Back
      </button>

      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      ) : member && (
        <>
          {/* Member card */}
          <div className="card p-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center
                            text-green-700 font-black text-xl flex-shrink-0">
              {member.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-green-900">{member.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={roleBadgeClass(member.role)}>{roleLabel(member.role)}</span>
                {member.department && (
                  <span className="badge badge-role-committee capitalize">{member.department}</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className={`text-4xl font-black ${balance >= 0 ? 'points-positive' : 'points-negative'}`}>
                {balance}
              </p>
              <p className="text-xs text-green-500 mt-0.5">points</p>
            </div>
          </div>

          {/* Actions */}
          {canAward && (
            <div>
              <button onClick={() => setShowModal(true)} className="btn btn-primary" id="member-detail-award-btn">
                <Plus size={16} /> Award / Deduct Points
              </button>
            </div>
          )}

          {/* Transactions */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-sand-200">
              <h2 className="font-bold text-green-900">Transaction History</h2>
              <p className="text-xs text-green-600 mt-0.5">{transactions.length} records</p>
            </div>

            {transactions.length === 0 ? (
              <div className="empty-state">
                <p className="font-semibold">No transactions yet</p>
              </div>
            ) : (
              <div className="divide-y divide-sand-100">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center gap-4 px-6 py-4 hover:bg-sand-50 transition-colors">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm
                      ${tx.amount >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {tx.amount >= 0 ? '+' : '−'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-green-900">{tx.reason}</p>
                      <p className="text-xs text-green-600">
                        By {tx.awarded_by_user?.name} · {formatDate(tx.created_at)}
                      </p>
                    </div>
                    <span className={`font-bold flex-shrink-0 ${tx.amount >= 0 ? 'points-positive' : 'points-negative'}`}>
                      {formatAmount(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {showModal && member && (
        <AddPointsModal
          onClose={() => setShowModal(false)}
          onSuccess={fetchData}
          preselectedMember={member}
        />
      )}
    </div>
  )
}

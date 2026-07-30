import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { roleBadgeClass, roleLabel } from '../lib/permissions'
import AddPointsModal from '../components/transactions/AddPointsModal'
import { Building2, Plus, ChevronRight } from 'lucide-react'

export default function DepartmentPage() {
  const { profile } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)

  const fetchMembers = useCallback(async () => {
    if (!profile) return
    setLoading(true)

    // Fetch committee members in this head's department
    const { data: memberData } = await supabase
      .from('users')
      .select('id, name, role, department')
      .eq('role', 'committee')
      .eq('department', profile.department)
      .order('name')

    // Get balances for each
    const ids = memberData?.map(m => m.id) ?? []
    let balances = {}
    if (ids.length > 0) {
      const { data: txData } = await supabase
        .from('point_transactions')
        .select('member_id, amount')
        .in('member_id', ids)
      txData?.forEach(tx => {
        balances[tx.member_id] = (balances[tx.member_id] ?? 0) + tx.amount
      })
    }

    setMembers(memberData?.map(m => ({ ...m, balance: balances[m.id] ?? 0 })) ?? [])
    setLoading(false)
  }, [profile])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  function openAward(member) {
    setSelectedMember(member)
    setShowModal(true)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-green-900 flex items-center gap-2">
            <Building2 size={22} />
            {profile?.department ? profile.department.charAt(0).toUpperCase() + profile.department.slice(1) : ''} Department
          </h1>
          <p className="text-green-600 text-sm mt-0.5">
            {members.length} committee member{members.length !== 1 ? 's' : ''} · Manage their points
          </p>
        </div>
        <button
          onClick={() => { setSelectedMember(null); setShowModal(true) }}
          className="btn btn-primary"
          id="dept-award-btn"
        >
          <Plus size={16} /> Award Points
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 rounded-lg" />)}
          </div>
        ) : members.length === 0 ? (
          <div className="empty-state">
            <Building2 size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No committee members yet</p>
            <p className="text-sm text-green-600">Ask Tabeer to add members to your department.</p>
          </div>
        ) : (
          <div className="divide-y divide-sand-100">
            {members.map(member => (
              <div key={member.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-sand-50 transition-colors group">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center
                                text-green-700 font-bold text-sm flex-shrink-0">
                  {member.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-green-900">{member.name}</p>
                  <span className={roleBadgeClass(member.role)}>{roleLabel(member.role)}</span>
                </div>

                <div className="text-right mr-2">
                  <p className={`text-xl font-black ${member.balance >= 0 ? 'points-positive' : 'points-negative'}`}>
                    {member.balance}
                  </p>
                  <p className="text-xs text-green-500">pts</p>
                </div>

                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => openAward(member)}
                    className="btn btn-sm btn-primary"
                    id={`award-${member.id}`}
                  >
                    <Plus size={14} /> Points
                  </button>
                  <Link
                    to={`/member/${member.id}`}
                    className="btn btn-sm btn-secondary btn-icon"
                    title="View history"
                  >
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddPointsModal
          onClose={() => setShowModal(false)}
          onSuccess={fetchMembers}
          preselectedMember={selectedMember}
        />
      )}
    </div>
  )
}

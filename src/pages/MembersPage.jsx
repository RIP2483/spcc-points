import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { canAwardTo, roleBadgeClass, roleLabel } from '../lib/permissions'
import AddPointsModal from '../components/transactions/AddPointsModal'
import { Users, Plus, ChevronRight, Search } from 'lucide-react'

const DEPT_ORDER = { events: 0, media: 1 }
const ROLE_ORDER = { secretary: 0, exco: 1, head: 2, committee: 3 }

export default function MembersPage() {
  const { profile } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)

  const fetchMembers = useCallback(async () => {
    if (!profile) return
    setLoading(true)

    const { data: allUsers } = await supabase
      .from('users')
      .select('id, name, role, department')
      .order('name')

    const ids = allUsers?.map(u => u.id) ?? []
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

    const enriched = allUsers?.map(m => ({
      ...m,
      balance: balances[m.id] ?? 0,
      canModify: canAwardTo(profile, m),
    })) ?? []

    enriched.sort((a, b) => {
      const roleDiff = (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9)
      if (roleDiff !== 0) return roleDiff
      const deptDiff = (DEPT_ORDER[a.department] ?? 9) - (DEPT_ORDER[b.department] ?? 9)
      if (deptDiff !== 0) return deptDiff
      return a.name.localeCompare(b.name)
    })

    setMembers(enriched)
    setLoading(false)
  }, [profile])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase()) ||
    (m.department ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function openAward(member) {
    setSelectedMember(member)
    setShowModal(true)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-green-900 flex items-center gap-2">
            <Users size={22} /> All Members
          </h1>
          <p className="text-green-600 text-sm mt-0.5">
            Organisation-wide points overview · {members.length} members
          </p>
        </div>
        <button
          onClick={() => { setSelectedMember(null); setShowModal(true) }}
          className="btn btn-primary"
          id="members-award-btn"
        >
          <Plus size={16} /> Award Points
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />
        <input
          type="search"
          className="input !pl-11"
          placeholder="Search by name, role, or department…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          id="members-search"
        />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-16 rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No members found</p>
          </div>
        ) : (
          <div className="divide-y divide-sand-100">
            {filtered.map(member => (
              <div key={member.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-sand-50 transition-colors">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center
                                text-green-700 font-bold text-sm flex-shrink-0">
                  {member.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-green-900">{member.name}</p>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className={roleBadgeClass(member.role)}>{roleLabel(member.role)}</span>
                    {member.department && (
                      <span className="text-xs text-green-500 capitalize">{member.department}</span>
                    )}
                  </div>
                </div>

                <div className="text-right mr-2">
                  {member.role === 'secretary' ? (
                    <span className="text-sm font-medium text-green-500">—</span>
                  ) : (
                    <>
                      <p className={`text-xl font-black ${member.balance >= 0 ? 'points-positive' : 'points-negative'}`}>
                        {member.balance}
                      </p>
                      <p className="text-xs text-green-500">pts</p>
                    </>
                  )}
                </div>

                <div className="flex gap-2 items-center">
                  {member.canModify && (
                    <button
                      onClick={() => openAward(member)}
                      className="btn btn-sm btn-primary"
                      id={`award-${member.id}`}
                    >
                      <Plus size={14} /> Points
                    </button>
                  )}
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

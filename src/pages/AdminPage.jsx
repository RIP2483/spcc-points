import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { roleBadgeClass, roleLabel, formatAmount, formatDate } from '../lib/permissions'
import CreateUserModal from '../components/admin/CreateUserModal'
import EditTransactionModal from '../components/admin/EditTransactionModal'
import AddPointsModal from '../components/transactions/AddPointsModal'
import ChangePasswordModal from '../components/admin/ChangePasswordModal'
import { ShieldCheck, Plus, Search, Trash2, Pencil, Users, Clock, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const { profile } = useAuth()
  const [tab, setTab] = useState('members')
  const [members, setMembers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showAddPoints, setShowAddPoints] = useState(false)
  const [editTx, setEditTx] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [changePwMember, setChangePwMember] = useState(null)

  const fetchMembers = useCallback(async () => {
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
    setMembers(allUsers?.map(m => ({ ...m, balance: balances[m.id] ?? 0 })) ?? [])
  }, [])

  const fetchTransactions = useCallback(async () => {
    const { data } = await supabase
      .from('point_transactions')
      .select(`
        id, amount, reason, created_at,
        member:member_id(name, role),
        awarded_by_user:awarded_by(name, role)
      `)
      .order('created_at', { ascending: false })
      .limit(200)
    setTransactions(data ?? [])
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchMembers(), fetchTransactions()])
    setLoading(false)
  }, [fetchMembers, fetchTransactions])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleDeleteUser(userId, userName) {
    if (!window.confirm(`Delete ${userName}'s account? This cannot be undone.`)) return
    const { error } = await supabase.from('users').delete().eq('id', userId)
    if (error) toast.error(error.message)
    else { toast.success(`${userName} removed`); fetchAll() }
  }

  async function handleDeleteTx(tx) {
    if (!window.confirm(`Delete this transaction (${formatAmount(tx.amount)} pts for ${tx.member?.name})?`)) return
    const { error } = await supabase.from('point_transactions').delete().eq('id', tx.id)
    if (error) toast.error(error.message)
    else { toast.success('Transaction deleted'); fetchAll() }
  }

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase()) ||
    (m.department ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const filteredTx = transactions.filter(tx =>
    tx.member?.name?.toLowerCase().includes(search.toLowerCase()) ||
    tx.reason?.toLowerCase().includes(search.toLowerCase()) ||
    tx.awarded_by_user?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-green-900 flex items-center gap-2">
            <ShieldCheck size={22} /> Admin Panel
          </h1>
          <p className="text-green-600 text-sm mt-0.5">
            Full organisation management · {members.length} members · {transactions.length} transactions
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowAddPoints(true)} className="btn btn-primary" id="admin-award-btn">
            <Plus size={16} /> Award Points
          </button>
          <button onClick={() => setShowCreateUser(true)} className="btn btn-secondary" id="admin-create-user-btn">
            <Plus size={16} /> Add Member
          </button>
        </div>
      </div>

      {/* Stats row */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Members', value: members.length, icon: Users },
            { label: 'Transactions',  value: transactions.length, icon: Clock },
            { label: 'Points Awarded', value: transactions.filter(t => t.amount > 0).reduce((a, t) => a + t.amount, 0), icon: Plus },
            { label: 'Points Deducted', value: Math.abs(transactions.filter(t => t.amount < 0).reduce((a, t) => a + t.amount, 0)), icon: ShieldCheck },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-2xl font-black text-green-800">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-sand-200 rounded-xl p-1 w-fit">
        {[
          { id: 'members', label: 'Members', icon: Users },
          { id: 'transactions', label: 'Transactions', icon: Clock },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${tab === t.id ? 'bg-white text-green-900 shadow-sm' : 'text-green-700 hover:text-green-900'}`}
            id={`admin-tab-${t.id}`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" />
        <input
          type="search"
          className="input pl-9"
          placeholder={tab === 'members' ? 'Search members…' : 'Search transactions…'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          id="admin-search"
        />
      </div>

      {/* Members table */}
      {tab === 'members' && (
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-lg" />)}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Balance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(m => (
                    <tr key={m.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center
                                          text-green-700 font-bold text-xs flex-shrink-0">
                            {m.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                          <span className="font-semibold text-green-900">{m.name}</span>
                        </div>
                      </td>
                      <td><span className={roleBadgeClass(m.role)}>{roleLabel(m.role)}</span></td>
                      <td className="capitalize text-green-700">{m.department ?? '—'}</td>
                      <td>
                        <span className={`font-bold ${m.balance >= 0 ? 'points-positive' : 'points-negative'}`}>
                          {m.balance}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setSelectedMember(m); setShowAddPoints(true) }}
                            className="btn btn-sm btn-primary btn-icon"
                            title="Award points"
                            id={`admin-award-${m.id}`}
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            onClick={() => setChangePwMember(m)}
                            className="btn btn-sm btn-secondary btn-icon"
                            title="Reset password"
                            id={`admin-pw-${m.id}`}
                          >
                            <KeyRound size={14} />
                          </button>
                          {m.id !== profile?.id && (
                            <button
                              onClick={() => handleDeleteUser(m.id, m.name)}
                              className="btn btn-sm btn-danger btn-icon"
                              title="Delete member"
                              id={`admin-delete-user-${m.id}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Transactions table */}
      {tab === 'transactions' && (
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Amount</th>
                    <th>Reason</th>
                    <th>Awarded by</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.map(tx => (
                    <tr key={tx.id}>
                      <td className="font-semibold text-green-900">{tx.member?.name ?? '—'}</td>
                      <td>
                        <span className={`font-bold ${tx.amount >= 0 ? 'points-positive' : 'points-negative'}`}>
                          {formatAmount(tx.amount)}
                        </span>
                      </td>
                      <td className="max-w-xs text-sm text-green-800">{tx.reason}</td>
                      <td className="text-sm text-green-700">{tx.awarded_by_user?.name ?? '—'}</td>
                      <td className="text-sm text-green-600 whitespace-nowrap">{formatDate(tx.created_at)}</td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditTx(tx)}
                            className="btn btn-sm btn-secondary btn-icon"
                            title="Edit"
                            id={`admin-edit-tx-${tx.id}`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteTx(tx)}
                            className="btn btn-sm btn-danger btn-icon"
                            title="Delete"
                            id={`admin-delete-tx-${tx.id}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateUser && (
        <CreateUserModal onClose={() => setShowCreateUser(false)} onSuccess={fetchAll} />
      )}
      {showAddPoints && (
        <AddPointsModal
          onClose={() => { setShowAddPoints(false); setSelectedMember(null) }}
          onSuccess={fetchAll}
          preselectedMember={selectedMember}
        />
      )}
      {editTx && (
        <EditTransactionModal
          transaction={editTx}
          onClose={() => setEditTx(null)}
          onSuccess={fetchAll}
        />
      )}
      {changePwMember && (
        <ChangePasswordModal
          member={changePwMember}
          onClose={() => setChangePwMember(null)}
        />
      )}
    </div>
  )
}

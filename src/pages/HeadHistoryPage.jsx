import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { formatAmount, formatDate, roleBadgeClass, roleLabel } from '../lib/permissions'
import { ClipboardList, ChevronLeft, ChevronRight, Search } from 'lucide-react'

const ITEMS_PER_PAGE = 20

export default function HeadHistoryPage() {
  const { profile } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchSubmissions = useCallback(async () => {
    if (!profile) return
    setLoading(true)

    const { data } = await supabase
      .from('point_transactions')
      .select(`
        id, amount, reason, created_at, status,
        member:member_id(name, role, department)
      `)
      .eq('awarded_by', profile.id)
      .order('created_at', { ascending: false })

    setSubmissions(data ?? [])
    setLoading(false)
  }, [profile])

  useEffect(() => { fetchSubmissions() }, [fetchSubmissions])
  useEffect(() => { setPage(1) }, [search])

  const filtered = submissions.filter(tx =>
    tx.member?.name?.toLowerCase().includes(search.toLowerCase()) ||
    tx.reason?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const pendingCount = submissions.filter(t => t.status === 'pending').length
  const approvedCount = submissions.filter(t => t.status === 'approved').length
  const rejectedCount = submissions.filter(t => t.status === 'rejected').length

  function statusBadge(status) {
    if (status === 'pending')  return <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap">⏳ Pending</span>
    if (status === 'approved') return <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">✔ Approved</span>
    if (status === 'rejected') return <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full whitespace-nowrap">✕ Rejected</span>
    return null
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-green-900 flex items-center gap-2">
          <ClipboardList size={22} /> My Submissions
        </h1>
        <p className="text-green-600 text-sm mt-0.5">
          All point requests you've submitted for your department members
        </p>
      </div>

      {/* Stats row */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Pending',  value: pendingCount,  color: 'text-amber-600' },
            { label: 'Approved', value: approvedCount, color: 'points-positive' },
            { label: 'Rejected', value: rejectedCount, color: 'points-negative' },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by member or reason…"
          className="input !pl-11 w-full"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">{search ? 'No matching submissions' : 'No submissions yet'}</p>
            <p className="text-sm mt-1">Requests you submit will appear here.</p>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Amount</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(tx => (
                    <tr key={tx.id} className={tx.status === 'rejected' ? 'opacity-50' : ''}>
                      <td>
                        <div>
                          <p className="font-semibold text-green-900">{tx.member?.name ?? '—'}</p>
                          <span className={`text-xs ${roleBadgeClass(tx.member?.role ?? '')}`}>
                            {roleLabel(tx.member?.role ?? '')}
                            {tx.member?.department ? ` · ${tx.member.department}` : ''}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`font-bold text-base ${
                          tx.status === 'rejected'
                            ? 'text-gray-400 line-through'
                            : tx.amount >= 0 ? 'points-positive' : 'points-negative'
                        }`}>
                          {formatAmount(tx.amount)}
                        </span>
                      </td>
                      <td className="max-w-xs">
                        <p className="text-sm text-green-900">{tx.reason}</p>
                      </td>
                      <td>{statusBadge(tx.status)}</td>
                      <td className="text-sm text-green-700 whitespace-nowrap">
                        {formatDate(tx.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filtered.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-sand-200 text-sm text-green-700 bg-sand-50/50 flex-wrap gap-2">
                <p className="font-medium text-xs md:text-sm">
                  Showing <strong>{(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)}</strong> of <strong>{filtered.length}</strong>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn btn-sm btn-secondary"
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <span className="font-semibold text-xs text-green-900 px-1">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn btn-sm btn-secondary"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

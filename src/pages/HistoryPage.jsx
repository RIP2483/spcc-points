import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { formatAmount, formatDate } from '../lib/permissions'
import { downloadCsv } from '../lib/csvExport'
import { Clock, Search, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function HistoryPage() {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const ITEMS_PER_PAGE = 20
  const [page, setPage] = useState(1)

  const fetchTx = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    const { data } = await supabase
      .from('point_transactions')
      .select(`
        id, amount, reason, created_at, status,
        awarded_by_user:awarded_by(name, role)
      `)
      .eq('member_id', profile.id)
      .order('created_at', { ascending: false })
    setTransactions(data ?? [])
    setLoading(false)
  }, [profile])

  useEffect(() => { fetchTx() }, [fetchTx])

  const filtered = transactions.filter(tx =>
    tx.reason.toLowerCase().includes(search.toLowerCase()) ||
    tx.awarded_by_user?.name?.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => { setPage(1) }, [search])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // Balance only from approved transactions
  const totalBalance = transactions.filter(t => t.status === 'approved').reduce((a, t) => a + t.amount, 0)

  function handleExportCsv() {
    if (!filtered.length) return toast.error('No transactions to export')
    const headers = ['Amount', 'Reason', 'Awarded By', 'Date']
    const rows = filtered.map(t => [
      formatAmount(t.amount),
      t.reason,
      t.awarded_by_user?.name || '—',
      formatDate(t.created_at),
    ])
    downloadCsv(`${profile?.name || 'My'}_Point_History`, headers, rows)
    toast.success('History CSV exported!')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-green-900 flex items-center gap-2">
            <Clock size={22} /> My Point History
          </h1>
          <p className="text-green-600 text-sm mt-0.5">
            Complete record of your points — {transactions.length} transactions total
          </p>
        </div>
        <button onClick={handleExportCsv} className="btn btn-secondary" id="history-export-csv-btn">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Summary banner */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Balance', value: totalBalance, cls: totalBalance >= 0 ? 'points-positive' : 'points-negative' },
            { label: 'Total Earned',  value: `+${transactions.filter(t => t.amount > 0).reduce((a, t) => a + t.amount, 0)}`, cls: 'points-positive' },
            { label: 'Total Deducted', value: transactions.filter(t => t.amount < 0).reduce((a, t) => a + t.amount, 0), cls: 'points-negative' },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.cls}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />
        <input
          type="search"
          className="input !pl-11"
          placeholder="Search by reason or awarded by…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          id="history-search"
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
            <Clock size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">{search ? 'No matching transactions' : 'No transactions yet'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Awarded by</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(tx => (
                  <tr key={tx.id} className={tx.status === 'rejected' ? 'opacity-50' : ''}>
                    <td>
                      <span className={`font-bold text-base ${
                        tx.status === 'rejected' ? 'text-gray-400 line-through' :
                        tx.amount >= 0 ? 'points-positive' : 'points-negative'
                      }`}>
                        {formatAmount(tx.amount)}
                      </span>
                    </td>
                    <td className="max-w-xs">
                      <p className="text-sm text-green-900">{tx.reason}</p>
                    </td>
                    <td>
                      <p className="text-sm font-medium text-green-800">{tx.awarded_by_user?.name ?? '—'}</p>
                    </td>
                    <td>
                      {tx.status === 'pending' && (
                        <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap">⏳ Pending</span>
                      )}
                      {tx.status === 'approved' && (
                        <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">✔ Approved</span>
                      )}
                      {tx.status === 'rejected' && (
                        <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full whitespace-nowrap">✕ Rejected</span>
                      )}
                    </td>
                    <td className="text-sm text-green-700 whitespace-nowrap">
                      {formatDate(tx.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {filtered.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-sand-200 text-sm text-green-700 bg-sand-50/50 flex-wrap gap-2">
            <p className="font-medium text-xs md:text-sm">
              Showing <strong>{(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)}</strong> of <strong>{filtered.length}</strong> transactions
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-sm btn-secondary"
                id="history-prev-page-btn"
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
                id="history-next-page-btn"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

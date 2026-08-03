import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { formatAmount, formatDate } from '../lib/permissions'
import { downloadCsv } from '../lib/csvExport'
import { Clock, Search, Download } from 'lucide-react'
import toast from 'react-hot-toast'

export default function HistoryPage() {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchTx = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    const { data } = await supabase
      .from('point_transactions')
      .select(`
        id, amount, reason, created_at,
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

  const totalBalance = transactions.reduce((a, t) => a + t.amount, 0)

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
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => (
                  <tr key={tx.id}>
                    <td>
                      <span className={`font-bold text-base ${tx.amount >= 0 ? 'points-positive' : 'points-negative'}`}>
                        {formatAmount(tx.amount)}
                      </span>
                    </td>
                    <td className="max-w-xs">
                      <p className="text-sm text-green-900">{tx.reason}</p>
                    </td>
                    <td>
                      <p className="text-sm font-medium text-green-800">{tx.awarded_by_user?.name ?? '—'}</p>
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
      </div>
    </div>
  )
}

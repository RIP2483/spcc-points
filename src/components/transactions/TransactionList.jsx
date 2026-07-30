import { formatAmount, formatDate, roleBadgeClass, roleLabel } from '../../lib/permissions'
import { Trash2, Pencil } from 'lucide-react'

export default function TransactionList({ transactions, showMember = false, showActions = false, onEdit, onDelete }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="font-semibold text-base">No transactions yet</p>
        <p className="text-sm text-green-600 mt-1">Point activity will appear here.</p>
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {showMember && <th>Member</th>}
            <th>Amount</th>
            <th>Reason</th>
            <th>Awarded by</th>
            <th>Date</th>
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {transactions.map(tx => (
            <tr key={tx.id} className="animate-fade-in">
              {showMember && (
                <td>
                  <div className="font-semibold text-green-900">{tx.member?.name ?? '—'}</div>
                  <div className={roleBadgeClass(tx.member?.role) + ' mt-0.5 text-xs'}>
                    {roleLabel(tx.member?.role)}
                  </div>
                </td>
              )}
              <td>
                <span className={`font-bold text-base ${tx.amount >= 0 ? 'points-positive' : 'points-negative'}`}>
                  {formatAmount(tx.amount)}
                </span>
              </td>
              <td className="max-w-xs">
                <p className="text-sm text-green-900 line-clamp-2">{tx.reason}</p>
              </td>
              <td>
                <p className="text-sm font-medium text-green-800">{tx.awarded_by_user?.name ?? '—'}</p>
                <p className="text-xs text-green-600 capitalize">{tx.awarded_by_user?.role}</p>
              </td>
              <td className="text-sm text-green-700 whitespace-nowrap">
                {formatDate(tx.created_at)}
              </td>
              {showActions && (
                <td>
                  <div className="flex gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(tx)}
                        className="btn btn-sm btn-secondary btn-icon"
                        title="Edit transaction"
                        id={`edit-tx-${tx.id}`}
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(tx)}
                        className="btn btn-sm btn-danger btn-icon"
                        title="Delete transaction"
                        id={`delete-tx-${tx.id}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

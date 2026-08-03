import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { formatAmount, formatDate } from '../../lib/permissions'
import toast from 'react-hot-toast'

export default function DeleteTransactionModal({ transaction, onClose, onSuccess }) {
  const { profile } = useAuth()
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleDelete(e) {
    e.preventDefault()
    if (!reason.trim()) return toast.error('A reason is required before deleting')

    setLoading(true)
    try {
      // 1. Write audit log entry first
      const { error: auditError } = await supabase.from('audit_log').insert({
        action: 'transaction_deleted',
        performed_by: profile.id,
        reason: reason.trim(),
        details: {
          transaction_id: transaction.id,
          member_name: transaction.member?.name,
          amount: transaction.amount,
          original_reason: transaction.reason,
          awarded_by: transaction.awarded_by_user?.name,
          created_at: transaction.created_at,
        },
      })
      if (auditError) throw auditError

      // 2. Delete the transaction
      const { error: deleteError } = await supabase
        .from('point_transactions')
        .delete()
        .eq('id', transaction.id)
      if (deleteError) throw deleteError

      toast.success('Transaction deleted and logged')
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to delete transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal animate-fade-in" style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <h2 className="text-lg font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle size={18} /> Delete Transaction
          </h2>
          <button onClick={onClose} className="btn-icon btn-ghost" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleDelete}>
          <div className="modal-body space-y-4">
            {/* Transaction summary */}
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm">
              <p className="text-red-700 font-semibold mb-1">Transaction to be deleted</p>
              <p className="text-green-900">
                <span className={`font-bold ${transaction.amount >= 0 ? 'points-positive' : 'points-negative'}`}>
                  {formatAmount(transaction.amount)} pts
                </span>
                {' '}→ <strong>{transaction.member?.name}</strong>
              </p>
              <p className="text-green-700 text-xs mt-1">"{transaction.reason}"</p>
              <p className="text-green-600 text-xs mt-0.5">
                Awarded by {transaction.awarded_by_user?.name ?? '—'} · {formatDate(transaction.created_at)}
              </p>
            </div>

            {/* Mandatory reason */}
            <div>
              <label className="label" htmlFor="delete-reason">
                Reason for deletion <span className="text-red-500">*</span>
              </label>
              <textarea
                id="delete-reason"
                className="input resize-none"
                rows={3}
                placeholder="e.g. Entered for the wrong person, duplicate entry..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
              />
              <p className="text-xs text-green-600 mt-1">
                This will be saved in the audit log for accountability.
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              id="confirm-delete-tx-btn"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Delete & Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

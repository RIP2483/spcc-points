import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import toast from 'react-hot-toast'
import { formatAmount, formatDate } from '../../lib/permissions'

export default function EditTransactionModal({ transaction, onClose, onSuccess }) {
  const [amount, setAmount] = useState(Math.abs(transaction.amount))
  const [isPositive, setIsPositive] = useState(transaction.amount >= 0)
  const [reason, setReason] = useState(transaction.reason)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return toast.error('Enter a valid positive amount')
    }
    if (!reason.trim()) return toast.error('Please enter a reason')

    const finalAmount = isPositive ? Number(amount) : -Number(amount)
    setLoading(true)
    const { error } = await supabase
      .from('point_transactions')
      .update({ amount: finalAmount, reason: reason.trim() })
      .eq('id', transaction.id)
    setLoading(false)

    if (error) {
      toast.error(error.message || 'Failed to update transaction')
    } else {
      toast.success('Transaction updated')
      onSuccess?.()
      onClose()
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal animate-fade-in">
        <div className="modal-header">
          <h2 className="text-lg font-bold text-green-900">Edit Transaction</h2>
          <button onClick={onClose} className="btn-icon btn-ghost" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            {/* Context */}
            <div className="rounded-lg bg-sand-100 border border-sand-200 p-3 text-sm">
              <p className="text-green-700 font-semibold">Original transaction</p>
              <p className="text-green-900 mt-0.5">
                <span className={transaction.amount >= 0 ? 'points-positive font-bold' : 'points-negative font-bold'}>
                  {formatAmount(transaction.amount)} pts
                </span>
                {' '}→ <strong>{transaction.member?.name}</strong>
              </p>
              <p className="text-green-600 text-xs mt-1">
                Awarded by {transaction.awarded_by_user?.name} · {formatDate(transaction.created_at)}
              </p>
            </div>

            {/* Amount */}
            <div>
              <label className="label">Updated Amount</label>
              <div className="flex gap-2">
                <div className="flex rounded-lg overflow-hidden border border-sand-300">
                  <button
                    type="button"
                    onClick={() => setIsPositive(true)}
                    className={`px-4 py-2 font-bold text-sm transition-colors
                      ${isPositive ? 'bg-green-700 text-white' : 'bg-white text-green-700'}`}
                  >+ Award</button>
                  <button
                    type="button"
                    onClick={() => setIsPositive(false)}
                    className={`px-4 py-2 font-bold text-sm transition-colors
                      ${!isPositive ? 'bg-red-600 text-white' : 'bg-white text-red-600'}`}
                  >− Deduct</button>
                </div>
                <input
                  type="number" min="1" step="1"
                  className="input flex-1"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="label" htmlFor="edit-reason">Reason</label>
              <textarea
                id="edit-reason"
                className="input resize-none"
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="save-edit-tx-btn">
              {loading
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

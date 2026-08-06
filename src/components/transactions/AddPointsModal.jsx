import { useState, useEffect } from 'react'
import { X, Plus, Minus } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { canAwardTo, roleLabel } from '../../lib/permissions'
import toast from 'react-hot-toast'

export default function AddPointsModal({ onClose, onSuccess, preselectedMember = null }) {
  const { profile } = useAuth()
  const [members, setMembers] = useState([])
  const [selectedId, setSelectedId] = useState(preselectedMember?.id ?? '')
  const [amount, setAmount] = useState('')
  const [isPositive, setIsPositive] = useState(true)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingMembers, setFetchingMembers] = useState(true)

  useEffect(() => {
    async function loadMembers() {
      setFetchingMembers(true)
      const { data, error } = await supabase
        .from('users')
        .select('id, name, role, department')
        .order('name')
      if (!error && data) {
        // Filter to only members actor is allowed to award
        const allowed = data.filter(m => canAwardTo(profile, m))
        setMembers(allowed)
      }
      setFetchingMembers(false)
    }
    loadMembers()
  }, [profile])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedId) return toast.error('Please select a member')
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return toast.error('Enter a valid positive amount')
    }
    if (!reason.trim()) return toast.error('Please enter a reason')

    const finalAmount = isPositive ? Number(amount) : -Number(amount)
    const isSecretary = profile.role === 'secretary'
    // Secretary's actions are auto-approved; everyone else creates a pending request
    const status = isSecretary ? 'approved' : 'pending'

    setLoading(true)
    const { error } = await supabase.from('point_transactions').insert({
      member_id: selectedId,
      awarded_by: profile.id,
      amount: finalAmount,
      reason: reason.trim(),
      status,
      reviewed_by: isSecretary ? profile.id : null,
      reviewed_at: isSecretary ? new Date().toISOString() : null,
    })
    setLoading(false)

    if (error) {
      toast.error(error.message || 'Failed to submit request')
    } else if (isSecretary) {
      toast.success(`Points ${isPositive ? 'awarded' : 'deducted'} successfully!`)
      onSuccess?.()
      onClose()
    } else {
      toast.success('Request submitted — awaiting Secretary approval 📋')
      onSuccess?.()
      onClose()
    }
  }

  const selectedMember = members.find(m => m.id === selectedId)

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Add points">
      <div className="modal animate-fade-in">
        <div className="modal-header">
          <h2 className="text-lg font-bold text-green-900">Award / Deduct Points</h2>
          <button onClick={onClose} className="btn-icon btn-ghost" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            {/* Member selector */}
            <div>
              <label className="label" htmlFor="points-member">Recipient</label>
              {preselectedMember ? (
                <div className="input bg-sand-100 cursor-not-allowed text-green-800 font-medium">
                  {preselectedMember.name} <span className="text-green-600 text-sm">({roleLabel(preselectedMember.role)})</span>
                </div>
              ) : (
                <select
                  id="points-member"
                  className="input"
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                  disabled={fetchingMembers}
                  required
                >
                  <option value="">
                    {fetchingMembers ? 'Loading members…' : 'Select a member…'}
                  </option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({roleLabel(m.role)}{m.department ? ` · ${m.department}` : ''})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Amount + type toggle */}
            <div>
              <label className="label">Amount</label>
              <div className="flex gap-2">
                {/* +/- toggle */}
                <div className="flex rounded-lg overflow-hidden border border-sand-300">
                  <button
                    type="button"
                    onClick={() => setIsPositive(true)}
                    className={`px-4 py-2 font-bold flex items-center gap-1 text-sm transition-colors
                      ${isPositive ? 'bg-green-700 text-white' : 'bg-white text-green-700'}`}
                    id="toggle-award"
                  >
                    <Plus size={14} /> Award
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPositive(false)}
                    className={`px-4 py-2 font-bold flex items-center gap-1 text-sm transition-colors
                      ${!isPositive ? 'bg-red-600 text-white' : 'bg-white text-red-600'}`}
                    id="toggle-deduct"
                  >
                    <Minus size={14} /> Deduct
                  </button>
                </div>
                <input
                  id="points-amount"
                  type="number"
                  min="1"
                  step="1"
                  className="input flex-1"
                  placeholder="e.g. 15"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>
              {amount && Number(amount) > 0 && (
                <p className={`text-sm font-semibold mt-1.5 ${isPositive ? 'points-positive' : 'points-negative'}`}>
                  {isPositive ? '+' : '−'}{amount} pts will be {isPositive ? 'added to' : 'deducted from'}{' '}
                  {selectedMember ? selectedMember.name + "'s" : "the member's"} balance
                  {profile.role !== 'secretary' && (
                    <span className="block text-xs text-amber-600 font-medium mt-0.5">⏳ Pending Secretary approval</span>
                  )}
                </p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="label" htmlFor="points-reason">Reason</label>
              <textarea
                id="points-reason"
                className="input resize-none"
                rows={3}
                placeholder="e.g. Helped with event setup"
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${isPositive ? 'btn-primary' : 'btn-danger'}`}
              disabled={loading}
              id="submit-points-btn"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : profile.role === 'secretary' ? (
                isPositive ? 'Award Points' : 'Deduct Points'
              ) : (
                isPositive ? 'Submit Award Request' : 'Submit Deduction Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

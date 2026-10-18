import { useState } from 'react'
import { X, KeyRound, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import toast from 'react-hot-toast'

export default function ResetMemberPasswordModal({ member, onClose }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) return toast.error('Password must be at least 6 characters')
    if (password !== confirm) return toast.error('Passwords do not match')

    setLoading(true)
    const { error } = await supabase.rpc('admin_reset_user_password', {
      target_user_id: member.id,
      new_password: password,
    })
    setLoading(false)

    if (error) {
      toast.error(error.message || 'Failed to reset password')
    } else {
      toast.success(`Password updated for ${member.name} ✔️`)
      onClose()
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Reset password">
      <div className="modal animate-fade-in">
        <div className="modal-header">
          <h2 className="text-lg font-bold text-green-900 flex items-center gap-2">
            <KeyRound size={18} /> Reset Password
          </h2>
          <button onClick={onClose} className="btn-icon btn-ghost" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <p className="text-sm text-green-700">
              Setting a new password for <strong className="text-green-900">{member.name}</strong>.
              They will use this to log in next time.
            </p>

            {/* New password */}
            <div>
              <label className="label" htmlFor="reset-pw">New Password</label>
              <div className="relative">
                <input
                  id="reset-pw"
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 hover:text-green-700"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="label" htmlFor="reset-pw-confirm">Confirm Password</label>
              <input
                id="reset-pw-confirm"
                type={showPw ? 'text' : 'password'}
                className="input"
                placeholder="Re-enter password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
              {confirm && password !== confirm && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
              {confirm && password === confirm && confirm.length >= 6 && (
                <p className="text-xs text-green-600 mt-1">✔ Passwords match</p>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || password !== confirm || password.length < 6}
              id="confirm-reset-pw-btn"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Set New Password'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

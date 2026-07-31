import { useState } from 'react'
import { X, Eye, EyeOff, KeyRound } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import toast from 'react-hot-toast'

export default function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')
    if (form.password !== form.confirm) return toast.error('Passwords do not match')

    setLoading(true)
    try {
      // supabase.auth.updateUser only updates the currently logged-in user
      const { error } = await supabase.auth.updateUser({ password: form.password })
      if (error) throw error
      toast.success('Password updated successfully!')
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal animate-fade-in" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h2 className="text-lg font-bold text-green-900 flex items-center gap-2">
            <KeyRound size={18} /> Change Your Password
          </h2>
          <button onClick={onClose} className="btn-icon btn-ghost" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <label className="label" htmlFor="new-pw">New Password</label>
              <div className="relative">
                <input
                  id="new-pw"
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600"
                  onClick={() => setShowPw(s => !s)}
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="confirm-pw">Confirm New Password</label>
              <input
                id="confirm-pw"
                type={showPw ? 'text' : 'password'}
                className="input"
                placeholder="Re-enter your new password"
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="save-pw-btn">
              {loading
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Save Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

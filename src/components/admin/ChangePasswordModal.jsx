import { useState } from 'react'
import { X, Eye, EyeOff, KeyRound } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

export default function ChangePasswordModal({ member, onClose }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 8) return toast.error('Password must be at least 8 characters')
    if (password !== confirm)  return toast.error('Passwords do not match')

    setLoading(true)
    try {
      // We use a separate non-persisted client so we can sign in as the
      // member, change their password, then immediately sign out without
      // affecting Tabeer's active session.
      const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        { auth: { persistSession: false } }
      )

      // Supabase doesn't expose admin password-change on client side,
      // so we send a password-reset email to the member instead.
      const { error } = await tempClient.auth.resetPasswordForEmail(
        member.email,
        { redirectTo: window.location.origin + '/login' }
      )

      if (error) throw error

      toast.success(`Password reset email sent to ${member.email}`)
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal animate-fade-in" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h2 className="text-lg font-bold text-green-900 flex items-center gap-2">
            <KeyRound size={18} /> Reset Password
          </h2>
          <button onClick={onClose} className="btn-icon btn-ghost" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
            <p className="font-semibold mb-1">📧 Password Reset Email</p>
            <p>
              A password reset link will be emailed to <strong>{member.email}</strong>.
              They'll click the link to set their new password.
            </p>
          </div>

          <p className="text-sm text-green-700">
            Member: <span className="font-semibold">{member.name}</span>
          </p>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={loading}
            id="send-reset-btn"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Send Reset Email'}
          </button>
        </div>
      </div>
    </div>
  )
}

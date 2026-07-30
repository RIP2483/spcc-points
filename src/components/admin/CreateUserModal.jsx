import { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { createClient } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'committee', label: 'Committee Member' },
  { value: 'head',      label: 'Department Head' },
  { value: 'exco',      label: 'Exco' },
  { value: 'secretary', label: 'Secretary' },
]
const DEPARTMENTS = [
  { value: 'events', label: 'Events' },
  { value: 'media',  label: 'Media' },
]

export default function CreateUserModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'committee', department: 'events',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const needsDept = form.role === 'committee' || form.role === 'head'

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name is required')
    if (!form.email.trim()) return toast.error('Email is required')
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')

    setLoading(true)
    try {
      // Create a temporary client that doesn't persist the session,
      // so we can sign up a new user without logging Tabeer out.
      const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        { auth: { persistSession: false } }
      )

      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: form.email.trim(),
        password: form.password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create account (no user returned)')

      const userId = authData.user.id

      const { error: profileError } = await supabase.from('users').insert({
        id: userId,
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        department: needsDept ? form.department : null,
      })

      if (profileError) throw profileError

      toast.success(`Account created for ${form.name}!`)
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal animate-fade-in">
        <div className="modal-header">
          <h2 className="text-lg font-bold text-green-900">Create Member Account</h2>
          <button onClick={onClose} className="btn-icon btn-ghost" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <label className="label" htmlFor="new-name">Full Name</label>
              <input id="new-name" className="input" placeholder="e.g. Ali Hassan"
                value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>

            <div>
              <label className="label" htmlFor="new-email">Email</label>
              <input id="new-email" type="email" className="input" placeholder="ali@example.com"
                value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>

            <div>
              <label className="label" htmlFor="new-password">Temporary Password</label>
              <div className="relative">
                <input id="new-password" type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Min. 8 characters"
                  value={form.password} onChange={e => set('password', e.target.value)}
                  minLength={8} required />
                <button type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="new-role">Role</label>
              <select id="new-role" className="input"
                value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            {needsDept && (
              <div>
                <label className="label" htmlFor="new-dept">Department</label>
                <select id="new-dept" className="input"
                  value={form.department} onChange={e => set('department', e.target.value)}>
                  {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            )}

            <p className="text-xs text-green-600 bg-green-50 rounded-lg p-3">
              💡 Share the email and temporary password with the member directly. They can change their password after logging in.
            </p>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="create-user-btn">
              {loading
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

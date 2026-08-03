import { useState } from 'react'
import { X, Pencil } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'committee', label: 'Committee Member' },
  { value: 'head',      label: 'Department Head' },
  { value: 'exco',      label: 'Exco' },
]

const DEPARTMENTS = [
  { value: 'events', label: 'Events' },
  { value: 'media',  label: 'Media' },
]

export default function EditUserModal({ member, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: member.name || '',
    role: member.role || 'committee',
    department: member.department || 'events',
  })
  const [loading, setLoading] = useState(false)

  const isSecretary = member.role === 'secretary'
  const needsDept = (form.role === 'committee' || form.role === 'head') && !isSecretary

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name is required')

    setLoading(true)
    try {
      const updates = {
        name: form.name.trim(),
        role: isSecretary ? 'secretary' : form.role,
        department: needsDept ? form.department : null,
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', member.id)

      if (error) throw error

      toast.success(`Updated details for ${form.name}!`)
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to update member profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal animate-fade-in">
        <div className="modal-header">
          <h2 className="text-lg font-bold text-green-900 flex items-center gap-2">
            <Pencil size={18} /> Edit Member Profile
          </h2>
          <button onClick={onClose} className="btn-icon btn-ghost" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <label className="label" htmlFor="edit-name">Full Name</label>
              <input
                id="edit-name"
                className="input"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="edit-email">Email (Read Only)</label>
              <input
                id="edit-email"
                className="input bg-sand-100 text-green-800 cursor-not-allowed"
                value={member.email || ''}
                disabled
              />
            </div>

            {!isSecretary && (
              <div>
                <label className="label" htmlFor="edit-role">Role</label>
                <select
                  id="edit-role"
                  className="input"
                  value={form.role}
                  onChange={e => set('role', e.target.value)}
                >
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            )}

            {needsDept && (
              <div>
                <label className="label" htmlFor="edit-dept">Department</label>
                <select
                  id="edit-dept"
                  className="input"
                  value={form.department}
                  onChange={e => set('department', e.target.value)}
                >
                  {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="save-user-btn">
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

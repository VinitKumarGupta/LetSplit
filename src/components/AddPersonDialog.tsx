import { useState } from 'react'

interface AddPersonDialogProps {
  onClose: () => void
  onAdd: (name: string) => Promise<void>
  showToast: (message: string, type: 'success' | 'error') => void
}

export function AddPersonDialog({ onClose, onAdd, showToast }: AddPersonDialogProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      await onAdd(name.trim())
      showToast(`${name.trim()} added!`, 'success')
      onClose()
    } catch (err: any) {
      showToast(err.message || 'Could not add person.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
      <div
        className="bg-[var(--color-surface)] rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-1">Add Person</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-5">
          Add someone to the carpool group.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 mb-5"
            placeholder="Person name"
            autoFocus
            required
            maxLength={50}
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-60"
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
import type { TripWithParticipants, Person } from '../lib/types'
import { formatPaise, paiseToRupees, rupeesToPaise, perPersonDisplay } from '../lib/money'
import { formatDateShort } from '../lib/dates'

interface EditTripDialogProps {
  trip: TripWithParticipants
  activePeople: Person[]
  onSave: (tripId: number, amount: number, participantIds: number[]) => Promise<void>
  onClose: () => void
  saving: boolean
}

export function EditTripDialog({ trip, activePeople, onSave, onClose, saving }: EditTripDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(trip.participants.map(p => p.person_id))
  )
  const [priceRupees, setPriceRupees] = useState(String(paiseToRupees(trip.total_amount_paise)))

  const pricePaise = rupeesToPaise(parseFloat(priceRupees) || 0)

  const togglePassenger = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Ensure all current participants appear even if inactive
  const allRelevantPeople = [
    ...activePeople,
    ...trip.participants
      .map(p => p.person)
      .filter(p => !activePeople.find(ap => ap.id === p.id)),
  ]

  const handleSave = () => {
    if (selectedIds.size === 0 || pricePaise <= 0) return
    onSave(trip.id, pricePaise, Array.from(selectedIds))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
      <div
        className="bg-[var(--color-surface)] rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-1">Edit Trip</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-5">
          {formatDateShort(trip.trip_date)} · {trip.trip_type === 'morning' ? 'Morning' : 'Evening'}
        </p>

        {/* Price */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5">Trip Price (₹)</label>
          <input
            type="number"
            value={priceRupees}
            onChange={e => setPriceRupees(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            min="1"
            step="0.01"
          />
        </div>

        {/* Passengers */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Passengers</label>
          <div className="space-y-1.5">
            {allRelevantPeople.map(person => {
              const isSelected = selectedIds.has(person.id)
              return (
                <button
                  key={person.id}
                  onClick={() => togglePassenger(person.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    isSelected
                      ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200 border border-purple-300 dark:border-purple-700'
                      : 'bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                    isSelected
                      ? 'border-purple-500 bg-purple-500 text-white'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {isSelected && '✓'}
                  </span>
                  <span className="font-medium">{person.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Summary */}
        {selectedIds.size > 0 && pricePaise > 0 && (
          <div className="text-sm text-[var(--color-text-secondary)] mb-5">
            {selectedIds.size} passenger{selectedIds.size !== 1 ? 's' : ''} ·{' '}
            {perPersonDisplay(pricePaise, selectedIds.size)}/person
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || selectedIds.size === 0 || pricePaise <= 0}
            className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

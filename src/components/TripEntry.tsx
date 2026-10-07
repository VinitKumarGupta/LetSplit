import type { Person, TripType } from '../lib/types'
import { formatPaise, perPersonDisplay, paiseToRupees, rupeesToPaise } from '../lib/money'

interface TripEntryProps {
  tripType: TripType
  setTripType: (t: TripType) => void
  tripPrice: number       // in paise
  setTripPrice: (p: number) => void
  activePeople: Person[]
  selectedIds: Set<number>
  togglePassenger: (id: number) => void
  onRecord: () => void
  onAddPerson: () => void
  saving: boolean
  defaultPrice: number    // in paise
}

export function TripEntry({
  tripType,
  setTripType,
  tripPrice,
  setTripPrice,
  activePeople,
  selectedIds,
  togglePassenger,
  onRecord,
  onAddPerson,
  saving,
  defaultPrice,
}: TripEntryProps) {
  const tripLabel = tripType === 'morning' ? 'Morning' : 'Evening'
  const tripSubLabel = tripType === 'morning' ? 'Home → College' : 'College → Home'

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
      {/* Morning / Evening toggle */}
      <div className="flex border-b border-[var(--color-border)]">
        <button
          onClick={() => setTripType('morning')}
          className={`flex-1 py-3.5 text-sm font-semibold transition-all relative ${
            tripType === 'morning'
              ? 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30'
              : 'text-[var(--color-text-secondary)] hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
          }`}
        >
          <span className="text-base">☀️</span> Morning
          {tripType === 'morning' && (
            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-purple-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setTripType('evening')}
          className={`flex-1 py-3.5 text-sm font-semibold transition-all relative ${
            tripType === 'evening'
              ? 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30'
              : 'text-[var(--color-text-secondary)] hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
          }`}
        >
          <span className="text-base">🌙</span> Evening
          {tripType === 'evening' && (
            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-purple-600 rounded-full" />
          )}
        </button>
      </div>

      <div className="p-5">
        {/* Trip direction */}
        <p className="text-xs text-[var(--color-text-secondary)] mb-4 font-medium tracking-wide uppercase">
          {tripSubLabel}
        </p>

        {/* Trip price display */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm text-[var(--color-text-secondary)]">Trip price</span>
          <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
            {formatPaise(tripPrice)}
          </span>
        </div>

        {/* Passengers */}
        <h3 className="text-sm font-semibold mb-3">Passengers</h3>
        <div className="space-y-2 mb-3">
          {activePeople.map(person => {
            const isSelected = selectedIds.has(person.id)
            return (
              <button
                key={person.id}
                onClick={() => togglePassenger(person.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200 border border-purple-300 dark:border-purple-700 shadow-sm shadow-purple-100 dark:shadow-none'
                    : 'bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    isSelected
                      ? 'border-purple-500 bg-purple-500 text-white'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {isSelected && '✓'}
                  </span>
                  <span className="font-medium">{person.name}</span>
                </div>
                <div className="flex gap-1">
                  {isSelected ? (
                    <span className="w-8 h-8 rounded-lg bg-purple-200 dark:bg-purple-800 flex items-center justify-center text-purple-700 dark:text-purple-200 text-lg font-bold">
                      −
                    </span>
                  ) : (
                    <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-300 text-lg font-bold">
                      +
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Add person link */}
        <button
          onClick={onAddPerson}
          className="text-sm text-purple-600 dark:text-purple-400 font-medium hover:underline mb-5 flex items-center gap-1"
        >
          <span className="text-lg">+</span> Add person
        </button>

        {/* Calculation summary */}
        {selectedIds.size > 0 && (
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl px-4 py-3 mb-5 border border-purple-100 dark:border-purple-800">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                {selectedIds.size} passenger{selectedIds.size !== 1 ? 's' : ''}
              </span>
              <span className="font-semibold text-purple-700 dark:text-purple-300">
                {perPersonDisplay(tripPrice, selectedIds.size)} / person
              </span>
            </div>
          </div>
        )}

        {/* Record button */}
        <button
          onClick={onRecord}
          disabled={saving || selectedIds.size === 0}
          className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-md shadow-purple-200 dark:shadow-purple-900/40"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            `Record ${tripLabel} Trip`
          )}
        </button>
      </div>
    </div>
  )
}

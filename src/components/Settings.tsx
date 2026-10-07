import { useState } from 'react'
import type { Person, AppSettings } from '../lib/types'
import { formatPaise, paiseToRupees, rupeesToPaise } from '../lib/money'

interface SettingsProps {
  settings: AppSettings
  people: Person[]
  activePeople: Person[]
  onUpdateSetting: (key: string, value: string) => Promise<void>
  onAddPerson: () => void
  onToggleActive: (personId: number, isActive: boolean) => Promise<void>
  showToast: (message: string, type: 'success' | 'error') => void
}

export function Settings({
  settings,
  people,
  activePeople,
  onUpdateSetting,
  onAddPerson,
  onToggleActive,
  showToast,
}: SettingsProps) {
  const [editingPrice, setEditingPrice] = useState(false)
  const [priceInput, setPriceInput] = useState(String(paiseToRupees(settings.defaultTripPricePaise)))
  const [savingPrice, setSavingPrice] = useState(false)
  const [savingDriver, setSavingDriver] = useState(false)

  const handleSavePrice = async () => {
    const rupees = parseFloat(priceInput)
    if (isNaN(rupees) || rupees <= 0) {
      showToast('Please enter a valid price.', 'error')
      return
    }
    setSavingPrice(true)
    try {
      await onUpdateSetting('default_trip_price_paise', String(rupeesToPaise(rupees)))
      setEditingPrice(false)
      showToast('Trip price updated.', 'success')
    } catch {
      showToast('Could not update price.', 'error')
    } finally {
      setSavingPrice(false)
    }
  }

  const handleChangeDriver = async (personId: number) => {
    setSavingDriver(true)
    try {
      await onUpdateSetting('driver_person_id', String(personId))
      showToast('Driver updated.', 'success')
    } catch {
      showToast('Could not update driver.', 'error')
    } finally {
      setSavingDriver(false)
    }
  }

  const handleToggle = async (person: Person) => {
    try {
      await onToggleActive(person.id, !person.is_active)
      showToast(
        `${person.name} ${person.is_active ? 'deactivated' : 'activated'}.`,
        'success'
      )
    } catch {
      showToast('Could not update person.', 'error')
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <h2 className="text-lg font-bold">Settings</h2>

      {/* Default Trip Price */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold mb-3">Default Trip Price</h3>
        {editingPrice ? (
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-secondary)]">₹</span>
              <input
                type="number"
                value={priceInput}
                onChange={e => setPriceInput(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                min="1"
                step="0.01"
                autoFocus
              />
            </div>
            <button
              onClick={handleSavePrice}
              disabled={savingPrice}
              className="px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-60"
            >
              {savingPrice ? '...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setEditingPrice(false)
                setPriceInput(String(paiseToRupees(settings.defaultTripPricePaise)))
              }}
              className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {formatPaise(settings.defaultTripPricePaise)}
            </span>
            <button
              onClick={() => setEditingPrice(true)}
              className="text-sm text-purple-600 dark:text-purple-400 font-medium hover:underline"
            >
              Change
            </button>
          </div>
        )}
        <p className="text-xs text-[var(--color-text-secondary)] mt-2">
          Changing this won't affect previously recorded trips.
        </p>
      </div>

      {/* Driver */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold mb-3">Driver</h3>
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">
          All other passengers' balances are calculated as amounts owed to the driver.
        </p>
        <div className="space-y-1.5">
          {activePeople.map(person => (
            <button
              key={person.id}
              onClick={() => handleChangeDriver(person.id)}
              disabled={savingDriver}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                person.id === settings.driverPersonId
                  ? 'bg-purple-100 dark:bg-purple-900/40 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-200'
                  : 'bg-[var(--color-surface-alt)] border border-[var(--color-border)] hover:border-purple-200 dark:hover:border-purple-700'
              }`}
            >
              <span className="font-medium">{person.name}</span>
              {person.id === settings.driverPersonId && (
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-300">Current</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* People */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold mb-3">People</h3>
        <div className="space-y-1.5 mb-3">
          {people.map(person => (
            <div
              key={person.id}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm ${
                person.is_active
                  ? 'bg-[var(--color-surface-alt)] border border-[var(--color-border)]'
                  : 'bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 opacity-60'
              }`}
            >
              <span className={`font-medium ${!person.is_active ? 'line-through' : ''}`}>
                {person.name}
              </span>
              <button
                onClick={() => handleToggle(person)}
                className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                  person.is_active
                    ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                }`}
              >
                {person.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={onAddPerson}
          className="text-sm text-purple-600 dark:text-purple-400 font-medium hover:underline flex items-center gap-1"
        >
          <span className="text-lg">+</span> Add person
        </button>
      </div>
    </div>
  )
}

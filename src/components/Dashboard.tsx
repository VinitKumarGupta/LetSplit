import type { TripWithParticipants, Person } from '../lib/types'
import { formatPaise } from '../lib/money'
import { getMonthName } from '../lib/dates'

interface DashboardProps {
  monthTrips: TripWithParticipants[]
  people: Person[]
  driverPersonId: number
  driverName: string
  selectedMonth: { month: number; year: number }
  tripsLoading: boolean
}

export function Dashboard({
  monthTrips,
  people,
  driverPersonId,
  driverName,
  selectedMonth,
  tripsLoading,
}: DashboardProps) {
  // Calculate per-person totals for the month
  const personTotals = new Map<number, number>()
  let totalExpensePaise = 0

  for (const trip of monthTrips) {
    totalExpensePaise += trip.total_amount_paise
    for (const p of trip.participants) {
      personTotals.set(p.person_id, (personTotals.get(p.person_id) ?? 0) + p.amount_paise)
    }
  }

  const monthLabel = `${getMonthName(selectedMonth.month)} ${selectedMonth.year}`

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-medium text-[var(--color-text-secondary)]">{monthLabel}</h2>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-0.5">
            {formatPaise(totalExpensePaise)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--color-text-secondary)]">Trips</p>
          <p className="text-2xl font-bold">{monthTrips.length}</p>
        </div>
      </div>

      {tripsLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 animate-pulse" />
          ))}
        </div>
      ) : people.length > 0 ? (
        <div className="space-y-2">
          {people
            .filter(p => p.is_active)
            .map(person => {
              const total = personTotals.get(person.id) ?? 0
              const isDriver = person.id === driverPersonId

              return (
                <div
                  key={person.id}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl ${
                    isDriver
                      ? 'bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800'
                      : 'bg-[var(--color-surface-alt)] border border-[var(--color-border)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{person.name}</span>
                    {isDriver && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-200 px-1.5 py-0.5 rounded">
                        Driver
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    {isDriver ? (
                      <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                        {formatPaise(total)}
                      </span>
                    ) : total > 0 ? (
                      <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                        Owes {formatPaise(total)}
                      </span>
                    ) : (
                      <span className="text-sm text-[var(--color-text-secondary)]">₹0</span>
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      ) : null}
    </div>
  )
}

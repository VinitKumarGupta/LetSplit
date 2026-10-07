import { useState, useEffect } from 'react'
import type { TripWithParticipants, Person } from '../lib/types'
import { formatPaise } from '../lib/money'
import { getMonthName } from '../lib/dates'

interface MonthlySummaryProps {
  trips: TripWithParticipants[]
  people: Person[]
  driverPersonId: number
  driverName: string
  selectedMonth: { month: number; year: number }
  onMonthChange: (m: { month: number; year: number }) => void
  tripsLoading: boolean
  fetchTripsForMonth: (year: number, month: number) => Promise<TripWithParticipants[]>
}

export function MonthlySummary({
  trips: externalTrips,
  people,
  driverPersonId,
  driverName,
  selectedMonth,
  onMonthChange,
  tripsLoading,
  fetchTripsForMonth,
}: MonthlySummaryProps) {
  const [summaryMonth, setSummaryMonth] = useState(selectedMonth)
  const [trips, setTrips] = useState<TripWithParticipants[]>(externalTrips)
  const [loading, setLoading] = useState(false)

  // When summary month changes, fetch that month's trips
  useEffect(() => {
    if (summaryMonth.month === selectedMonth.month && summaryMonth.year === selectedMonth.year) {
      setTrips(externalTrips)
    } else {
      setLoading(true)
      fetchTripsForMonth(summaryMonth.year, summaryMonth.month)
        .then(setTrips)
        .catch(() => setTrips([]))
        .finally(() => setLoading(false))
    }
  }, [summaryMonth, selectedMonth, externalTrips, fetchTripsForMonth])

  const prevMonth = () => {
    setSummaryMonth(prev => ({
      month: prev.month === 1 ? 12 : prev.month - 1,
      year: prev.month === 1 ? prev.year - 1 : prev.year,
    }))
  }

  const nextMonth = () => {
    setSummaryMonth(prev => ({
      month: prev.month === 12 ? 1 : prev.month + 1,
      year: prev.month === 12 ? prev.year + 1 : prev.year,
    }))
  }

  // Calculate totals
  const personTotals = new Map<number, number>()
  let totalExpensePaise = 0

  for (const trip of trips) {
    totalExpensePaise += trip.total_amount_paise
    for (const p of trip.participants) {
      personTotals.set(p.person_id, (personTotals.get(p.person_id) ?? 0) + p.amount_paise)
    }
  }

  const monthLabel = `${getMonthName(summaryMonth.month)} ${summaryMonth.year}`
  const isLoading = loading || tripsLoading

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Month Selector */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={prevMonth}
          className="w-10 h-10 rounded-xl border border-[var(--color-border)] flex items-center justify-center text-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
        >
          ‹
        </button>
        <h2 className="text-lg font-bold min-w-[180px] text-center">{monthLabel}</h2>
        <button
          onClick={nextMonth}
          className="w-10 h-10 rounded-xl border border-[var(--color-border)] flex items-center justify-center text-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
        >
          ›
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse" />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-8 text-center">
          <p className="text-[var(--color-text-secondary)] text-sm">
            No expenses recorded for {monthLabel}.
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 text-center">
              <p className="text-xs text-[var(--color-text-secondary)] mb-1">Total Expense</p>
              <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                {formatPaise(totalExpensePaise)}
              </p>
            </div>
            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 text-center">
              <p className="text-xs text-[var(--color-text-secondary)] mb-1">Trips</p>
              <p className="text-xl font-bold">{trips.length}</p>
            </div>
          </div>

          {/* Individual totals */}
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-border)]">
              <h3 className="text-sm font-semibold">Individual Expenses</h3>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {people
                .filter(p => p.is_active || (personTotals.get(p.id) ?? 0) > 0)
                .map(person => {
                  const total = personTotals.get(person.id) ?? 0
                  const isDriver = person.id === driverPersonId
                  return (
                    <div key={person.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{person.name}</span>
                        {isDriver && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-200 px-1.5 py-0.5 rounded">
                            Driver
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold">{formatPaise(total)}</span>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-[var(--color-surface)] rounded-2xl border border-purple-200 dark:border-purple-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/30">
              <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                💳 Payment Summary
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Amount each person needs to pay {driverName}
              </p>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {people
                .filter(p => p.id !== driverPersonId && (p.is_active || (personTotals.get(p.id) ?? 0) > 0))
                .map(person => {
                  const owed = personTotals.get(person.id) ?? 0
                  return (
                    <div key={person.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{person.name}</span>
                        <span className="text-[var(--color-text-secondary)]">→</span>
                        <span className="text-[var(--color-text-secondary)]">{driverName}</span>
                      </div>
                      <span className={`text-sm font-bold ${
                        owed > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--color-text-secondary)]'
                      }`}>
                        {formatPaise(owed)}
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

import { useState } from 'react'
import type { TripWithParticipants } from '../lib/types'
import { formatPaise, perPersonDisplay } from '../lib/money'
import { formatDateShort, getMonthName } from '../lib/dates'

interface TripHistoryProps {
  trips: TripWithParticipants[]
  loading: boolean
  isAuthenticated: boolean
  onEdit: (trip: TripWithParticipants) => void
  onDelete: (trip: TripWithParticipants) => void
  selectedMonth: { month: number; year: number }
  onMonthChange: (m: { month: number; year: number }) => void
}

export function TripHistory({
  trips,
  loading,
  isAuthenticated,
  onEdit,
  onDelete,
  selectedMonth,
  onMonthChange,
}: TripHistoryProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const prevMonth = () => {
    const m = selectedMonth.month === 1 ? 12 : selectedMonth.month - 1
    const y = selectedMonth.month === 1 ? selectedMonth.year - 1 : selectedMonth.year
    onMonthChange({ month: m, year: y })
  }

  const nextMonth = () => {
    const m = selectedMonth.month === 12 ? 1 : selectedMonth.month + 1
    const y = selectedMonth.month === 12 ? selectedMonth.year + 1 : selectedMonth.year
    onMonthChange({ month: m, year: y })
  }

  return (
    <div>
      {/* Month Selector */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">Trip History</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg border border-[var(--color-border)] flex items-center justify-center text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          >
            ‹
          </button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {getMonthName(selectedMonth.month)} {selectedMonth.year}
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg border border-[var(--color-border)] flex items-center justify-center text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse" />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-8 text-center">
          <p className="text-[var(--color-text-secondary)] text-sm">
            No trips recorded for {getMonthName(selectedMonth.month)} {selectedMonth.year}.
          </p>
          <p className="text-[var(--color-text-secondary)] text-xs mt-1">
            Select Morning or Evening and add today's passengers.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {trips.map(trip => {
            const isExpanded = expandedId === trip.id
            const participantNames = trip.participants.map(p => p.person?.name ?? '?').join(' · ')
            const count = trip.participants.length

            return (
              <div
                key={trip.id}
                className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden transition-all"
              >
                {/* Compact row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : trip.id)}
                  className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    trip.trip_type === 'morning' ? 'bg-amber-400' : 'bg-indigo-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{formatDateShort(trip.trip_date)}</span>
                      <span className="text-[var(--color-text-secondary)] text-xs capitalize">
                        {trip.trip_type}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">
                      {count} people · {formatPaise(trip.total_amount_paise)} · {perPersonDisplay(trip.total_amount_paise, count)}/person
                    </p>
                  </div>
                  <span className={`text-xs text-[var(--color-text-secondary)] transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}>
                    ▾
                  </span>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-3 border-t border-[var(--color-border)] pt-3 animate-fade-in">
                    <p className="text-sm text-[var(--color-text-secondary)] mb-2">{participantNames}</p>

                    {/* Per-person breakdown */}
                    <div className="space-y-1 mb-3">
                      {trip.participants.map(p => (
                        <div key={p.id} className="flex justify-between text-xs">
                          <span>{p.person?.name ?? '?'}</span>
                          <span className="font-medium">{formatPaise(p.amount_paise)}</span>
                        </div>
                      ))}
                    </div>

                    {isAuthenticated && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEdit(trip)}
                          className="flex-1 py-2 rounded-lg border border-[var(--color-border)] text-xs font-medium hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(trip)}
                          className="flex-1 py-2 rounded-lg border border-red-200 dark:border-red-900 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

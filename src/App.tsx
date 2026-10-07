import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { useAuth } from './hooks/useAuth'
import { usePeople } from './hooks/usePeople'
import { useSettings } from './hooks/useSettings'
import { useTrips } from './hooks/useTrips'
import { isSupabaseConfigured } from './lib/supabase'
import type { TripType, TripWithParticipants, AppView } from './lib/types'
import { formatPaise, calculateShares, paiseToRupees, rupeesToPaise } from './lib/money'
import { getTodayIST, getCurrentMonthIST, formatDateShort, getMonthName, getMonthRange, formatDateLong } from './lib/dates'
import { LoginDialog } from './components/LoginDialog'
import { AddPersonDialog } from './components/AddPersonDialog'
import { ConfirmDialog } from './components/ConfirmDialog'
import { EditTripDialog } from './components/EditTripDialog'
import { Toast } from './components/Toast'
import { Dashboard } from './components/Dashboard'
import { TripEntry } from './components/TripEntry'
import { TripHistory } from './components/TripHistory'
import { MonthlySummary } from './components/MonthlySummary'
import { Settings } from './components/Settings'

export function App() {
  const auth = useAuth()
  const people = usePeople()
  const settings = useSettings()
  const trips = useTrips()

  // UI State
  const [view, setView] = useState<AppView>('trips')
  const [tripType, setTripType] = useState<TripType>('morning')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [tripPrice, setTripPrice] = useState(22500)
  const [monthTrips, setMonthTrips] = useState<TripWithParticipants[]>([])
  const [tripsLoading, setTripsLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonthIST())

  // Dialog state
  const [showLogin, setShowLogin] = useState(false)
  const [showAddPerson, setShowAddPerson] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<TripWithParticipants | null>(null)
  const [editTrip, setEditTrip] = useState<TripWithParticipants | null>(null)

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
  }, [])

  // Set trip price from settings
  useEffect(() => {
    if (!settings.loading) {
      setTripPrice(settings.settings.defaultTripPricePaise)
    }
  }, [settings.settings.defaultTripPricePaise, settings.loading])

  // Auto-select trip type based on time of day (IST)
  useEffect(() => {
    const now = new Date()
    const istHour = parseInt(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        hour12: false,
      }).format(now)
    )
    // After 1 PM, default to evening
    setTripType(istHour >= 13 ? 'evening' : 'morning')
  }, [])

  // Load trips for selected month
  const loadTrips = useCallback(async () => {
    setTripsLoading(true)
    try {
      const data = await trips.fetchTripsForMonth(selectedMonth.year, selectedMonth.month)
      setMonthTrips(data)
    } catch {
      showToast('Could not load trips. Please check your connection.', 'error')
    } finally {
      setTripsLoading(false)
    }
  }, [selectedMonth.year, selectedMonth.month, trips.fetchTripsForMonth, showToast])

  useEffect(() => {
    loadTrips()
  }, [loadTrips])

  // Toggle passenger selection
  const togglePassenger = (personId: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(personId)) next.delete(personId)
      else next.add(personId)
      return next
    })
  }

  // Record a trip
  const handleRecordTrip = async () => {
    if (selectedIds.size === 0) {
      showToast('Select at least one passenger.', 'error')
      return
    }

    try {
      await trips.recordTrip(tripType, tripPrice, Array.from(selectedIds))
      setSelectedIds(new Set())
      showToast(`${tripType === 'morning' ? 'Morning' : 'Evening'} trip recorded!`)
      await loadTrips()
    } catch (err: any) {
      const msg = err.message || 'Could not save the trip.'
      if (msg.startsWith('DUPLICATE:')) {
        showToast(msg.replace('DUPLICATE:', ''), 'error')
      } else {
        showToast(msg, 'error')
      }
    }
  }

  // Delete a trip
  const handleDeleteTrip = async (trip: TripWithParticipants) => {
    try {
      await trips.deleteTrip(trip.id)
      setConfirmDelete(null)
      showToast('Trip deleted.')
      await loadTrips()
    } catch {
      showToast('Could not delete the trip.', 'error')
    }
  }

  // Update a trip
  const handleUpdateTrip = async (tripId: number, amount: number, participantIds: number[]) => {
    try {
      await trips.updateTrip(tripId, amount, participantIds)
      setEditTrip(null)
      showToast('Trip updated.')
      await loadTrips()
    } catch {
      showToast('Could not update the trip.', 'error')
    }
  }

  // Driver info
  const driverPerson = people.people.find(p => p.id === settings.settings.driverPersonId)
  const driverName = driverPerson?.name ?? 'Om'

  // Determine if data is still loading
  const isInitialLoading = auth.loading || people.loading || settings.loading

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[var(--color-text-secondary)] text-sm">Loading LetSplit...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-purple-700 dark:text-purple-300 tracking-tight">
            LetSplit
          </h1>
          <div className="flex items-center gap-2">
            {auth.isAuthenticated ? (
              <button
                onClick={() => auth.signOut()}
                className="text-xs text-[var(--color-text-secondary)] hover:text-purple-600 px-2 py-1 rounded transition-colors"
              >
                Sign out
              </button>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-lg font-medium hover:bg-purple-200 dark:hover:bg-purple-900/60 transition-colors"
              >
                Sign in
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="max-w-lg mx-auto px-4 pb-2 flex gap-1">
          <NavTab active={view === 'trips'} onClick={() => setView('trips')}>
            Trips
          </NavTab>
          <NavTab active={view === 'summary'} onClick={() => setView('summary')}>
            Summary
          </NavTab>
          {auth.isAuthenticated && (
            <NavTab active={view === 'settings'} onClick={() => setView('settings')}>
              Settings
            </NavTab>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {!isSupabaseConfigured && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-2xl p-4 mb-5 text-xs">
            <p className="font-semibold text-sm mb-1">⚙️ Supabase Setup Required</p>
            <p>Connect your Supabase project by copying <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">.env.example</code> to <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">.env</code> and filling in your project URL & Anon Key.</p>
          </div>
        )}

        {view === 'trips' && (
          <div className="space-y-6 animate-fade-in">
            <Dashboard
              monthTrips={monthTrips}
              people={people.people}
              driverPersonId={settings.settings.driverPersonId}
              driverName={driverName}
              selectedMonth={selectedMonth}
              tripsLoading={tripsLoading}
            />

            {auth.isAuthenticated ? (
              <TripEntry
                tripType={tripType}
                setTripType={setTripType}
                tripPrice={tripPrice}
                setTripPrice={setTripPrice}
                activePeople={people.activePeople}
                selectedIds={selectedIds}
                togglePassenger={togglePassenger}
                onRecord={handleRecordTrip}
                onAddPerson={() => setShowAddPerson(true)}
                saving={trips.loading}
                defaultPrice={settings.settings.defaultTripPricePaise}
              />
            ) : (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 text-center shadow-sm">
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  Viewer Mode
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 mb-3">
                  Sign in with group credentials to record trips or adjust settings.
                </p>
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                >
                  Sign in to record trips
                </button>
              </div>
            )}

            <TripHistory
              trips={monthTrips}
              loading={tripsLoading}
              isAuthenticated={auth.isAuthenticated}
              onEdit={setEditTrip}
              onDelete={setConfirmDelete}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
          </div>
        )}

        {view === 'summary' && (
          <MonthlySummary
            trips={monthTrips}
            people={people.people}
            driverPersonId={settings.settings.driverPersonId}
            driverName={driverName}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            tripsLoading={tripsLoading}
            fetchTripsForMonth={trips.fetchTripsForMonth}
          />
        )}

        {view === 'settings' && auth.isAuthenticated && (
          <Settings
            settings={settings.settings}
            people={people.people}
            activePeople={people.activePeople}
            onUpdateSetting={settings.updateSetting}
            onAddPerson={() => setShowAddPerson(true)}
            onToggleActive={people.toggleActive}
            showToast={showToast}
          />
        )}
      </main>

      {/* Dialogs */}
      {showLogin && (
        <LoginDialog
          onClose={() => setShowLogin(false)}
          onSignIn={auth.signIn}
          showToast={showToast}
        />
      )}

      {showAddPerson && (
        <AddPersonDialog
          onClose={() => setShowAddPerson(false)}
          onAdd={people.addPerson}
          showToast={showToast}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Trip?"
          message={`This will remove the ${confirmDelete.trip_type} trip on ${formatDateShort(confirmDelete.trip_date)} and its expenses from everyone's totals.`}
          confirmLabel="Delete"
          onConfirm={() => handleDeleteTrip(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
          destructive
        />
      )}

      {editTrip && (
        <EditTripDialog
          trip={editTrip}
          activePeople={people.activePeople}
          onSave={handleUpdateTrip}
          onClose={() => setEditTrip(null)}
          saving={trips.loading}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  )
}

/* Simple nav tab component */
function NavTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
        active
          ? 'bg-purple-600 text-white shadow-md shadow-purple-200 dark:shadow-purple-900/40'
          : 'text-[var(--color-text-secondary)] hover:bg-purple-50 dark:hover:bg-purple-900/20'
      }`}
    >
      {children}
    </button>
  )
}

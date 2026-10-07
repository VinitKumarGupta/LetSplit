import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { TripWithParticipants, TripType } from '../lib/types'
import { calculateShares } from '../lib/money'
import { getTodayIST, getMonthRange } from '../lib/dates'

/**
 * Hook to manage trip operations (CRUD).
 */
export function useTrips() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch trips for a given month with their participants.
   */
  const fetchTripsForMonth = useCallback(async (year: number, month: number): Promise<TripWithParticipants[]> => {
    const { start, end } = getMonthRange(year, month)

    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('*')
      .gte('trip_date', start)
      .lte('trip_date', end)
      .order('trip_date', { ascending: false })
      .order('trip_type', { ascending: false }) // evening before morning for same date

    if (tripsError) throw tripsError
    if (!trips || trips.length === 0) return []

    const tripIds = trips.map(t => t.id)

    const { data: participants, error: partError } = await supabase
      .from('trip_participants')
      .select('*, person:people(*)')
      .in('trip_id', tripIds)

    if (partError) throw partError

    return trips.map(trip => ({
      ...trip,
      participants: (participants ?? [])
        .filter(p => p.trip_id === trip.id)
        .sort((a, b) => a.person_id - b.person_id),
    }))
  }, [])

  /**
   * Check if a trip already exists for a given date and type.
   */
  const checkDuplicateTrip = useCallback(async (
    date: string,
    tripType: TripType
  ): Promise<TripWithParticipants | null> => {
    const { data, error: dbError } = await supabase
      .from('trips')
      .select('*')
      .eq('trip_date', date)
      .eq('trip_type', tripType)
      .maybeSingle()

    if (dbError) throw dbError
    if (!data) return null

    // Also fetch participants
    const { data: participants } = await supabase
      .from('trip_participants')
      .select('*, person:people(*)')
      .eq('trip_id', data.id)

    return {
      ...data,
      participants: participants ?? [],
    }
  }, [])

  /**
   * Record a new trip.
   */
  const recordTrip = useCallback(async (
    tripType: TripType,
    totalAmountPaise: number,
    participantIds: number[],
    date?: string
  ) => {
    setLoading(true)
    setError(null)

    try {
      const tripDate = date ?? getTodayIST()

      // Check for duplicate
      const existing = await checkDuplicateTrip(tripDate, tripType)
      if (existing) {
        throw new Error(
          `DUPLICATE:A ${tripType} trip has already been recorded for this date.`
        )
      }

      if (participantIds.length === 0) {
        throw new Error('At least one passenger must be selected.')
      }

      if (totalAmountPaise <= 0) {
        throw new Error('Trip price must be greater than zero.')
      }

      // Calculate exact shares
      const shares = calculateShares(totalAmountPaise, participantIds)

      // Insert trip
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert({
          trip_date: tripDate,
          trip_type: tripType,
          total_amount_paise: totalAmountPaise,
        })
        .select()
        .single()

      if (tripError) {
        if (tripError.code === '23505') {
          throw new Error(
            `DUPLICATE:A ${tripType} trip has already been recorded for this date.`
          )
        }
        throw tripError
      }

      // Insert participants
      const participantRows = participantIds.map(personId => ({
        trip_id: trip.id,
        person_id: personId,
        amount_paise: shares.get(personId)!,
      }))

      const { error: partError } = await supabase
        .from('trip_participants')
        .insert(participantRows)

      if (partError) {
        // Rollback the trip
        await supabase.from('trips').delete().eq('id', trip.id)
        throw partError
      }

      return trip
    } catch (err: any) {
      const message = err.message || 'Could not save the trip. Please try again.'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [checkDuplicateTrip])

  /**
   * Update an existing trip.
   */
  const updateTrip = useCallback(async (
    tripId: number,
    totalAmountPaise: number,
    participantIds: number[]
  ) => {
    setLoading(true)
    setError(null)

    try {
      if (participantIds.length === 0) {
        throw new Error('At least one passenger must be selected.')
      }

      const shares = calculateShares(totalAmountPaise, participantIds)

      // Update trip amount
      const { error: tripError } = await supabase
        .from('trips')
        .update({ total_amount_paise: totalAmountPaise })
        .eq('id', tripId)

      if (tripError) throw tripError

      // Delete old participants
      const { error: delError } = await supabase
        .from('trip_participants')
        .delete()
        .eq('trip_id', tripId)

      if (delError) throw delError

      // Insert new participants
      const participantRows = participantIds.map(personId => ({
        trip_id: tripId,
        person_id: personId,
        amount_paise: shares.get(personId)!,
      }))

      const { error: partError } = await supabase
        .from('trip_participants')
        .insert(participantRows)

      if (partError) throw partError
    } catch (err: any) {
      setError(err.message || 'Could not update the trip.')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Delete a trip and its participants (CASCADE handles participants).
   */
  const deleteTrip = useCallback(async (tripId: number) => {
    setLoading(true)
    setError(null)

    try {
      const { error: dbError } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId)

      if (dbError) throw dbError
    } catch (err: any) {
      setError(err.message || 'Could not delete the trip.')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    fetchTripsForMonth,
    checkDuplicateTrip,
    recordTrip,
    updateTrip,
    deleteTrip,
  }
}

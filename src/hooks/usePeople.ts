import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Person } from '../lib/types'

/**
 * Hook to manage the people list.
 */
export function usePeople() {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPeople = useCallback(async () => {
    try {
      setError(null)
      const { data, error: dbError } = await supabase
        .from('people')
        .select('*')
        .order('id', { ascending: true })

      if (dbError) throw dbError
      setPeople(data ?? [])
    } catch (err: any) {
      setError('Could not load people. Please check your connection.')
      console.error('fetchPeople error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPeople()
  }, [fetchPeople])

  const addPerson = useCallback(async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) throw new Error('Name cannot be empty.')

    // Case-insensitive duplicate check (client-side, server also enforces)
    const duplicate = people.find(
      p => p.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (duplicate) {
      throw new Error(`"${duplicate.name}" already exists.`)
    }

    const { error: dbError } = await supabase
      .from('people')
      .insert({ name: trimmed })

    if (dbError) {
      if (dbError.code === '23505') {
        throw new Error(`"${trimmed}" already exists.`)
      }
      throw new Error('Could not add person. Please try again.')
    }

    await fetchPeople()
  }, [people, fetchPeople])

  const toggleActive = useCallback(async (personId: number, isActive: boolean) => {
    const { error: dbError } = await supabase
      .from('people')
      .update({ is_active: isActive })
      .eq('id', personId)

    if (dbError) throw new Error('Could not update person.')
    await fetchPeople()
  }, [fetchPeople])

  return {
    people,
    activePeople: people.filter(p => p.is_active),
    loading,
    error,
    addPerson,
    toggleActive,
    refetch: fetchPeople,
  }
}

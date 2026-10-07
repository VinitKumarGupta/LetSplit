import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { AppSettings } from '../lib/types'

/**
 * Hook to manage application settings.
 */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    defaultTripPricePaise: 22500,
    driverPersonId: 1,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      setError(null)
      const { data, error: dbError } = await supabase
        .from('settings')
        .select('*')

      if (dbError) throw dbError

      if (data) {
        const settingsMap = new Map(data.map(s => [s.key, s.value]))
        setSettings({
          defaultTripPricePaise: parseInt(settingsMap.get('default_trip_price_paise') ?? '22500'),
          driverPersonId: parseInt(settingsMap.get('driver_person_id') ?? '1'),
        })
      }
    } catch (err: any) {
      setError('Could not load settings.')
      console.error('fetchSettings error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const updateSetting = useCallback(async (key: string, value: string) => {
    const { error: dbError } = await supabase
      .from('settings')
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )

    if (dbError) throw new Error('Could not update setting.')
    await fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    loading,
    error,
    updateSetting,
    refetch: fetchSettings,
  }
}

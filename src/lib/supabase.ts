import { createClient } from '@supabase/supabase-js'

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.includes('YOUR_PROJECT_ID')
)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase environment variables are missing or default placeholders. ' +
    'Create a .env file based on .env.example with your Supabase credentials.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

import { createClient } from '@supabase/supabase-js'

export const supabaseProjectId = process.env.SUPABASE_PROJECT_ID
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseProjectId || !supabaseAnonKey) {
  throw new Error('Missing environment variables for Supabase')
}

export const supabaseUrl = `https://${supabaseProjectId}.supabase.co`

// Original Supabase client (can be removed if not needed, but keeping for now as a general client)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
import { createClient } from '@supabase/supabase-js'

const supabaseProjectId = process.env.SUPABASE_PROJECT_ID
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseProjectId || !supabaseAnonKey) {
  throw new Error('Missing environment variables for Supabase')
}

const supabaseUrl = `https://${supabaseProjectId}.supabase.co`

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

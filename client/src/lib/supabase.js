import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase = null

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — Supabase client not initialized')
}

export { supabase }

export const SUPABASE_ANON_KEY = supabaseAnonKey || ''
export const EDGE_FUNCTIONS_BASE = supabaseUrl ? `${supabaseUrl}/functions/v1` : ''
export const EDGE_FUNCTION_URL = EDGE_FUNCTIONS_BASE ? `${EDGE_FUNCTIONS_BASE}/auth-handler` : ''

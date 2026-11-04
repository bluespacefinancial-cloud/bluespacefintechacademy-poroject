import { supabase } from './supabase'

export async function getCurrentProfile() {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!authData.user?.email) return null

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', authData.user.email)
    .single()

  if (error) throw error
  return data
}

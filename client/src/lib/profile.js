import { api } from './backend'

// Must match the column-level SELECT grant on public.users
// (lms/database/08_column_grants.sql). select('*') is denied
// because the legacy password column is not granted.
export const PROFILE_COLUMNS =
  'id, name, email, type, avatar, phone, is_active, force_password_change, last_login_at, created_at, updated_at, student_id'

export async function getCurrentProfile() {
  const { data: authData, error: authError } = await api.auth.getUser()
  if (authError) throw authError
  if (!authData.user?.email) return null

  const { data, error } = await api
    .from('users')
    .select(PROFILE_COLUMNS)
    .eq('email', authData.user.email)
    .single()

  if (error) throw error
  return data
}

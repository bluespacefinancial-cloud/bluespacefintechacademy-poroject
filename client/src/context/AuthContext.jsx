import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PROFILE_COLUMNS } from '../lib/profile'

const AuthContext = createContext(null)

class ProfileLoadError extends Error {
  constructor(cause) {
    super('We could not load your academy profile right now. Please try again shortly.')
    this.name = 'ProfileLoadError'
    this.cause = cause
  }
}

// Role lives in public.users.type, not in the Supabase auth session. Without
// this lookup, a page refresh restores a user with no `type`, which breaks
// every role-gated route and sidebar until the next login.
async function loadProfile(authUser) {
  if (!authUser?.email) return { ...authUser, hasProfile: false }
  const { data: profile, error } = await supabase
    .from('users')
    // Explicit columns: public.users.password is deliberately not selectable
    // (see supabase/migrations/015_fix_users_rls_recursion.sql).
    .select(PROFILE_COLUMNS)
    .eq('email', authUser.email)
    .maybeSingle()
  // A failed query is not the same as "no profile": surface it instead of
  // telling an active student their account is deactivated.
  if (error) {
    console.error('Profile lookup failed:', error)
    throw new ProfileLoadError(error)
  }
  return {
    ...authUser,
    ...(profile || {}),
    hasProfile: Boolean(profile),
    // DB column is force_password_change (snake_case); the UI reads camelCase.
    forcePasswordChange: profile?.force_password_change === 1,
  }
}

// A missing profile or a deactivated account must not be restored into the app.
// RLS already denies their data; clearing the session avoids rendering an empty
// dashboard and makes the block explicit.
function isBlocked(profile) {
  return !profile?.hasProfile || profile?.is_active === 0
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // If Supabase is not configured, there is nothing to load.
  const [loading, setLoading] = useState(Boolean(supabase))

  useEffect(() => {
    // Without Supabase env vars the client is null. Calling into it here used
    // to throw and render a blank page; fail visibly instead.
    if (!supabase) return

    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (data.session?.user && window.location.pathname !== '/reset-password') {
          const profile = await loadProfile(data.session.user)
          if (isBlocked(profile)) {
            await supabase.auth.signOut()
            setUser(null)
          } else {
            setUser(profile)
          }
        }
      } catch {
        // Supabase not configured
      }
      setLoading(false)
    }

    initAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Password recovery sessions belong to the reset form. Keep them alive
        // here even when an applicant is not active in the academy yet.
        if (window.location.pathname === '/reset-password') return
        if (event === 'SIGNED_IN' && session?.user) {
          // Defer the profile lookup: awaiting Supabase inside this callback
          // can deadlock. The raw session user has no role, so never set it
          // directly.
          setTimeout(() => {
            loadProfile(session.user)
              .then(async (profile) => {
                if (isBlocked(profile)) {
                  await supabase.auth.signOut()
                  setUser(null)
                  return
                }
                setUser(profile)
              })
              .catch(() => setUser(null))
          }, 0)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    let fullUser
    try {
      fullUser = await loadProfile(data.user)
    } catch (profileError) {
      await supabase.auth.signOut()
      throw profileError
    }
    if (isBlocked(fullUser)) {
      await supabase.auth.signOut()
      throw new Error('This account is not active in the academy. Contact an administrator for help.')
    }

    localStorage.setItem('token', data.session.access_token)
    localStorage.setItem('user', JSON.stringify(fullUser))
    setUser(fullUser)
    return fullUser
  }

  const logout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const setUserFromProfile = (updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates }
      localStorage.setItem('user', JSON.stringify(next))
      return next
    })
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser: setUserFromProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

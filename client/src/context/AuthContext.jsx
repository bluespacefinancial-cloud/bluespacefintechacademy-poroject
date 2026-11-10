import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../lib/backend'
import { PROFILE_COLUMNS } from '../lib/profile'

const AuthContext = createContext(null)

class ProfileLoadError extends Error {
  constructor(cause) {
    super('We could not load your academy profile right now. Please try again shortly.')
    this.name = 'ProfileLoadError'
    this.cause = cause
  }
}

// Role lives in public.users.type, not in the academy API session. Without
// this lookup, a page refresh restores a user with no `type`, which breaks
// every role-gated route and sidebar until the next login.
async function loadProfile(authUser) {
  if (!authUser?.email) return { ...authUser, hasProfile: false }
  const { data: profile, error } = await api
    .from('users')
    // Explicit columns: public.users.password is deliberately not selectable
    // (see lms/database/08_column_grants.sql).
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
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('bluespace-dark-mode')
    return saved ? saved === 'true' : false
  })

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev
      localStorage.setItem('bluespace-dark-mode', String(next))
      return next
    })
  }

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await api.auth.getSession()
        if (data.session?.user && window.location.pathname !== '/reset-password') {
          const profile = await loadProfile(data.session.user)
          if (isBlocked(profile)) {
            await api.auth.signOut()
            setUser(null)
          } else {
            setUser(profile)
          }
        }
      } catch {
        // A failed session check must not block the sign-in screen. Role gates
        // still apply once a profile loads.
      }
      setLoading(false)
    }

    initAuth()

    const { data: authListener } = api.auth.onAuthStateChange(
      (event, session) => {
        // Password recovery sessions belong to the reset form. Keep them alive
        // here even when an applicant is not active in the academy yet.
        if (window.location.pathname === '/reset-password') return
        if (event === 'SIGNED_IN' && session?.user) {
          // Defer the profile lookup so the auth listener returns immediately.
          // The raw session user has no role, so never set it directly.
          setTimeout(() => {
            loadProfile(session.user)
              .then((profile) => {
                if (isBlocked(profile)) {
                  api.auth.signOut()
                  setUser(null)
                } else {
                  setUser(profile)
                }
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

  // Session timeout: auto-logout after 30 minutes of inactivity
  useEffect(() => {
    if (!user) return

    const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes
    let timer

    const resetTimer = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        api.auth.signOut()
        setUser(null)
      }, INACTIVITY_TIMEOUT)
    }

    const activityHandler = () => resetTimer()

    window.addEventListener('mousemove', activityHandler)
    window.addEventListener('keydown', activityHandler)
    window.addEventListener('click', activityHandler)
    window.addEventListener('scroll', activityHandler)

    resetTimer()

    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener('mousemove', activityHandler)
      window.removeEventListener('keydown', activityHandler)
      window.removeEventListener('click', activityHandler)
      window.removeEventListener('scroll', activityHandler)
    }
  }, [user])

  const login = async (email, password) => {
    const { data, error } = await api.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    let fullUser
    try {
      fullUser = await loadProfile(data.user)
    } catch (profileError) {
      await api.auth.signOut()
      throw profileError
    }
    if (isBlocked(fullUser)) {
      await api.auth.signOut()
      throw new Error('This account is not active in the academy. Contact an administrator for help.')
    }

    // Store minimal session info only (no password hash, no sensitive data)
    setUser(fullUser)
    return fullUser
  }

  const logout = async () => {
    await api.auth.signOut()
    setUser(null)
  }

  const setUserFromProfile = (updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates }
      return next
    })
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser: setUserFromProfile, isDarkMode, toggleDarkMode }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

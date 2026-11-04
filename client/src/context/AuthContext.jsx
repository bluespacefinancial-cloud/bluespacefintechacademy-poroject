import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          setUser(data.session.user)
        }
      } catch {
        // Supabase not configured
      }
      setLoading(false)
    }

    initAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user)
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

    const userData = data.user
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', userData.id)
      .maybeSingle()

    const fullUser = {
      ...userData,
      ...(profile || {}),
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

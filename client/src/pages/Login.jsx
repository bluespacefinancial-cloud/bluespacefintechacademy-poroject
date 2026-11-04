import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'

const ease = [0.23, 1, 0.32, 1]

// Each portal has its own URL and only accepts accounts whose
// public.users.type matches. The URL is a UX boundary; real authorization is
// enforced by Supabase RLS (see supabase/migrations/001_phase_one_academy.sql).
const PORTALS = {
  '/student-login': {
    role: 'Student',
    title: 'Student Sign In',
    description: 'Access your learning portal, modules and progress',
  },
  '/instructor-login': {
    role: 'Instructor',
    displayRole: 'Teacher',
    title: 'Teacher Sign In',
    description: 'Access your modules, squads, grading and clinics',
  },
  '/admin-login': {
    role: 'Administrator',
    title: 'Administrator Sign In',
    description: 'Access cohorts, enrolments, reports and academy operations',
  },
}

const DEFAULT_PORTAL = PORTALS['/student-login']

const PORTAL_LABEL_BY_ROLE = {
  Student: 'student',
  Instructor: 'teacher',
  Administrator: 'administrator',
}

export default function Login() {
  const { login, logout, setUser } = useAuth()
  const navigate = useNavigate()
  const { pathname: rawPathname } = useLocation()
  // Normalize so "/admin-login/" or "/Admin-Login" cannot fall back to the
  // student portal by missing the lookup.
  const pathname = rawPathname.replace(/\/+$/, '').toLowerCase() || '/'
  const portal = PORTALS[pathname] || DEFAULT_PORTAL
  const { role } = portal
  const displayRole = portal.displayRole || role
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [forceChange, setForceChange] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changing, setChanging] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }
    setLoading(true)
    try {
      const user = await login(email, password)
      const accountRole = user?.type

      // Deactivated accounts are also blocked by RLS (see migration 010), but
      // fail visibly here instead of dropping them into an empty dashboard.
      if (user?.is_active === 0 || user?.is_active === false) {
        await logout()
        toast.error('This account has been deactivated. Contact an administrator.')
        return
      }

      // Fail closed: an account with no provisioned role, or one that does not
      // match this portal, must not continue into the app.
      if (!accountRole || !PORTAL_LABEL_BY_ROLE[accountRole]) {
        await logout()
        toast.error('This account is not provisioned for the academy. Contact an administrator.')
        return
      }
      if (accountRole !== role) {
        await logout()
        toast.error(
          `This is the ${PORTAL_LABEL_BY_ROLE[role]} sign-in. Use the ${PORTAL_LABEL_BY_ROLE[accountRole]} sign-in instead.`
        )
        return
      }

      if (user.forcePasswordChange) {
        setForceChange(true)
        toast('Your password was reset by admin. Please set a new password.', { icon: '🔐' })
      } else {
        toast.success(`Welcome back, ${user.name || user.email}`)
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      toast.error(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const handleForceChange = async (e) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 4) {
      toast.error('Password must be at least 4 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setChanging(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (error) throw error
      // Clear the DB flag too, otherwise the next login forces a reset again.
      await supabase.rpc('clear_my_force_password_change')
      setUser({ forcePasswordChange: false })
      toast.success('Password updated successfully')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Failed to update password')
    } finally {
      setChanging(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-gray-50">
      <div
        className="hidden lg:flex w-1/2 min-h-screen relative overflow-hidden items-center justify-center bg-deep-600 bg-cover bg-center"
        style={{
          backgroundImage: 'url("https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=1600")',
        }}
      >
        <div className="absolute inset-0 bg-deep-900/70" />
        <div className="relative z-10 text-center px-12 max-w-md">
          <motion.img
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            src="/logo-white.png"
            alt="BlueSPACE"
            className="h-14 w-auto mx-auto mb-6"
          />
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.1 }}
            className="text-3xl font-bold text-white mb-3"
          >
            BlueSPACE Fintech Academy
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.2 }}
            className="text-blue-200 text-sm leading-relaxed"
          >
            Learning Management System - training Finsoft and Finops Fellows on the AI Fintech Factory domains: FaaS, FinCore, FinOps and FinInfra.
          </motion.p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="w-full max-w-sm"
        >
          <AnimatePresence mode="wait">
            {forceChange ? (
              <motion.div
                key="forceChange"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Set New Password</CardTitle>
                    <CardDescription>Your password was reset by admin. Please create a new one.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleForceChange} className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-500">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                            minLength={4}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-2 top-1/2 -mt-2 flex items-center px-3 text-gray-400 hover:text-deep-500 transition-colors"
                          >
                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-500">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          required
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={changing}>
                        {changing ? (
                          <span className="flex items-center gap-2">
                            <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Updating...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Lock size={15} />
                            Update Password
                          </span>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{portal.title}</CardTitle>
                    <CardDescription>{portal.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-500">
                          Email
                        </label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@bluespacefintechacademy.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-500">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -mt-2 flex items-center px-3 text-gray-400 hover:text-deep-500 transition-colors"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Signing in...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              Sign in as {displayRole}
                              <ArrowRight size={15} />
                            </span>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        </div>
        <footer className="shrink-0 px-6 pb-6 text-center text-xs text-gray-400">
          BlueSPACE Fintech Academy &copy; 2026
        </footer>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/backend'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import AuthSplitLayout from '../components/auth/AuthSplitLayout'
import { AUTH_ARTWORK } from '../components/auth/artwork'

const ease = [0.23, 1, 0.32, 1]

// Each portal has its own URL and only accepts accounts whose
// public.users.type matches. The URL is a UX boundary; real authorization is
// enforced by PostgreSQL row-level security (see lms/database/01_schema.sql).
const PORTALS = {
  '/student-login': {
    role: 'Student',
    artwork: AUTH_ARTWORK.Student,
    title: 'Student Sign In',
    description: 'Access your learning portal, modules and progress',
  },
  '/instructor-login': {
    role: 'Instructor',
    artwork: AUTH_ARTWORK.Instructor,
    displayRole: 'Teacher',
    title: 'Teacher Sign In',
    description: 'Access your modules, squads, grading and clinics',
  },
  '/admin-login': {
    role: 'Administrator',
    artwork: AUTH_ARTWORK.Administrator,
    title: 'Administrator Sign In',
    description: 'Access cohorts, enrolments, reports and academy operations',
  },
  '/partner-login': {
    role: 'Partner',
    artwork: AUTH_ARTWORK.Partner,
    title: 'Partner Sign In',
    description: 'Create and manage partner courses for academy students',
  },
}

const DEFAULT_PORTAL = PORTALS['/student-login']

const PORTAL_LABEL_BY_ROLE = {
  Student: 'student',
  Instructor: 'teacher',
  Administrator: 'administrator',
  Partner: 'partner',
}

// Password complexity: at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/

export default function Login() {
  const { login, logout, setUser } = useAuth()
  const navigate = useNavigate()
  const { pathname: rawPathname, search, state } = useLocation()
  const query = new URLSearchParams(search)
  const pendingVerification = query.get('pendingVerification') === '1'
  const emailVerified = query.get('emailVerified') === '1'
  const pathname = rawPathname.replace(/\/+$/, '').toLowerCase() || '/'
  const portal = PORTALS[pathname] || DEFAULT_PORTAL
  const { role } = portal
  const { artwork } = portal
  const displayRole = portal.displayRole || role
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [email, setEmail] = useState(state?.registeredEmail || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [forceChange, setForceChange] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changing, setChanging] = useState(false)
  const [resending, setResending] = useState(false)

  // Rate limiting state
  const [attemptCount, setAttemptCount] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const MAX_ATTEMPTS = 5
  const LOCKOUT_MS = 5 * 60 * 1000 // 5 minutes

  const isLockedOut = lockoutUntil > now
  const remainingLockout = Math.max(0, Math.ceil((lockoutUntil - now) / 1000))

  useEffect(() => {
    if (lockoutUntil <= 0) return undefined
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [lockoutUntil])

  const canAttempt = () => {
    if (!isLockedOut) return true
    return false
  }

  const recordFailedAttempt = () => {
    const next = attemptCount + 1
    setAttemptCount(next)
    if (next >= MAX_ATTEMPTS) {
      setLockoutUntil(Date.now() + LOCKOUT_MS)
      setNow(Date.now())
    }
  }

  const resetAttempts = () => {
    setAttemptCount(0)
    setLockoutUntil(0)
  }

  const resendVerification = async () => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      toast.error('Enter your email address first')
      return
    }
    setResending(true)
    try {
      const { error } = await api.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: { emailRedirectTo: `${window.location.origin}/student-login?emailVerified=1` },
      })
      if (error) throw error
      toast.success('Verification email sent. Check your inbox and spam folder.')
    } catch (err) {
      toast.error(err.message || 'Unable to resend verification email')
    } finally {
      setResending(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }

    if (!canAttempt()) {
      toast.error(`Too many failed attempts. Try again in ${remainingLockout} seconds.`)
      return
    }

    setLoading(true)
    try {
      const user = await login(email, password)
      const accountRole = user?.type

      // Accounts pending approval or deactivated are blocked.
      if (user?.is_active === 0 || user?.is_active === false) {
        await logout()
        toast.error('Your application is pending academy review and approval. You will receive an email once approved.')
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

      resetAttempts()

      if (user.forcePasswordChange) {
        setForceChange(true)
        toast('Your password was reset by admin. Please set a new password.')
      } else {
        toast.success(`Welcome back, ${user.name || user.email}`)
        navigate('/dashboard', { replace: true })
      }
    } catch {
      const nextAttempts = attemptCount + 1
      recordFailedAttempt()
      // Generic error message to prevent email enumeration
      toast.error(nextAttempts >= MAX_ATTEMPTS
        ? `Too many failed attempts. Try again in ${Math.ceil(LOCKOUT_MS / 1000)} seconds.`
        : 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleForceChange = async (e) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (!PASSWORD_REGEX.test(newPassword)) {
      toast.error('Password must include uppercase, lowercase, number, and special character')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setChanging(true)
    try {
      const { error } = await api.auth.updateUser({
        password: newPassword,
      })
      if (error) throw error
      // Clear the DB flag too, otherwise the next login forces a reset again.
      await api.rpc('clear_my_force_password_change')
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
    <AuthSplitLayout
      image={artwork.image}
      imageAlt={artwork.alt}
      headline={artwork.headline}
      description={artwork.description}
    >
        <div className="flex flex-1 items-start justify-center px-4 pb-4 pt-20 lg:items-center lg:p-6">
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
                  <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-4">
                    <CardTitle>Set New Password</CardTitle>
                    <CardDescription>Your password was reset by admin. Please create a new one.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                    <form onSubmit={handleForceChange} className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold normal-case tracking-normal text-deep-600 dark:text-bluespace-300">
                          New password
                        </label>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            autoComplete="new-password"
                            placeholder="Create a new password"
                            required
                            minLength={8}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-2 top-1/2 -mt-2 flex items-center px-3 text-gray-400 hover:text-deep-500 dark:hover:text-bluespace-300 transition-colors"
                          >
                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Must include uppercase, lowercase, number, and special character
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold normal-case tracking-normal text-deep-600 dark:text-bluespace-300">
                          Confirm New password
                        </label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          autoComplete="new-password"
                          placeholder="Enter your new password again"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full bg-deep-600 text-white hover:bg-deep-700" disabled={changing}>
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
                  <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-4">
                    <CardTitle>{portal.title}</CardTitle>
                    <CardDescription>{portal.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                    {emailVerified && <p role="status" className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">Your email is verified. The academy team must approve your application before you can sign in.</p>}
                    {pendingVerification && <div className="mb-4 rounded-md bg-bluespace-700 p-3 text-sm text-white"><p>Check your inbox for the verification link. You can resend it after entering your email below.</p><Button type="button" variant="link" className="mt-1 h-auto p-0 text-white" onClick={resendVerification} disabled={resending}>{resending ? 'Sending...' : 'Resend verification email'}</Button></div>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold normal-case tracking-normal text-deep-600 dark:text-bluespace-300">
                          Email
                        </label>
                        <Input
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold normal-case tracking-normal text-deep-600 dark:text-bluespace-300">
                          Password
                        </label>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -mt-2 flex items-center px-3 text-gray-400 hover:text-deep-500 dark:hover:text-bluespace-300 transition-colors"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Must include uppercase, lowercase, number, and special character
                        </p>
                      </div>

                      <div className="-mt-2 flex justify-end">
                        <Link to="/forgot-password" state={{ email, from: pathname }} className="text-sm font-medium text-deep-700 dark:text-bluespace-300 hover:underline">Forgot password?</Link>
                      </div>

                      <div className="pt-2">
                        <Button type="submit" className="w-full bg-deep-600 text-white hover:bg-deep-700" disabled={loading || isLockedOut}>
                          {isLockedOut ? (
                            <span className="flex items-center gap-2">
                              <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Locked ({remainingLockout}s)
                            </span>
                          ) : loading ? (
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
                    <p className="mt-5 text-center text-xs text-gray-500 dark:text-gray-400">
                      Need an account? <Link to="/register" className="font-semibold text-deep-700 dark:text-bluespace-300 hover:underline">Submit an application</Link>
                    </p>
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
    </AuthSplitLayout>
  )
}

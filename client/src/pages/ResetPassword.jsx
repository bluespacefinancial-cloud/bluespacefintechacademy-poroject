import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../lib/backend'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import AuthSplitLayout from '../components/auth/AuthSplitLayout'
import { AUTH_ARTWORK } from '../components/auth/artwork'

const LOGIN_PATHS = ['/student-login', '/instructor-login', '/partner-login', '/admin-login']

export default function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const requestedReturnTo = new URLSearchParams(location.search).get('from')
  const returnTo = LOGIN_PATHS.includes(requestedReturnTo) ? requestedReturnTo : '/student-login'
  const { logout } = useAuth()
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [updated, setUpdated] = useState(false)

  useEffect(() => {
    let active = true
    api.auth.getSession().then(({ data }) => {
      if (active) {
        setHasSession(Boolean(data.session))
        setChecking(false)
      }
    })
    const { data: listener } = api.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) setHasSession(true)
      if (event === 'SIGNED_OUT') setHasSession(false)
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    if (password.length < 8) {
      toast.error('Use a password with at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const { error } = await api.auth.updateUser({ password })
      if (error) throw error
      await logout()
      setUpdated(true)
    } catch (error) {
      toast.error(error.message || 'Unable to update your password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthSplitLayout
      image={AUTH_ARTWORK.Student.image}
      imageAlt={AUTH_ARTWORK.Student.alt}
      headline="Choose a new password"
      description="Set a new password to get back to your BlueSPACE account."
    >
      <div className="flex flex-1 items-start justify-center px-4 pb-4 pt-20 lg:items-center lg:p-6">
        <Card className="w-full max-w-sm">
          <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-4">
            <CardTitle>{updated ? 'Password updated' : 'Reset your password'}</CardTitle>
            <CardDescription>{updated ? 'Your new password is ready to use.' : 'Choose a new password for your account.'}</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
            {updated ? (
              <Button className="w-full bg-deep-600 text-white hover:bg-deep-700" onClick={() => navigate(returnTo, { replace: true })}>Back to sign in</Button>
            ) : checking ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Checking your secure reset link...</p>
            ) : hasSession ? (
              <form onSubmit={submit} className="space-y-4">
                <label className="block space-y-2 text-sm font-medium text-deep-600 dark:text-bluespace-300">
                  New password
                  <Input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
                </label>
                <label className="block space-y-2 text-sm font-medium text-deep-600 dark:text-bluespace-300">
                  Confirm new password
                  <Input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter it again" />
                </label>
                <Button type="submit" className="w-full bg-deep-600 text-white hover:bg-deep-700" disabled={loading}>
                  {loading ? 'Updating...' : 'Update password'}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">This password reset link is invalid or has expired. Request a new one to continue.</p>
                <Button className="w-full bg-deep-600 text-white hover:bg-deep-700" onClick={() => navigate('/forgot-password', { replace: true, state: { from: returnTo } })}>Request another reset link</Button>
              </div>
            )}
            <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
              <Link to={returnTo} className="font-semibold text-deep-700 dark:text-bluespace-300 hover:underline">Back to sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </AuthSplitLayout>
  )
}

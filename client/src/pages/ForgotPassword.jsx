import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import AuthSplitLayout from '../components/auth/AuthSplitLayout'
import { AUTH_ARTWORK } from '../components/auth/artwork'

const LOGIN_PATHS = ['/student-login', '/instructor-login', '/partner-login', '/admin-login']

export default function ForgotPassword() {
  const location = useLocation()
  const returnTo = LOGIN_PATHS.includes(location.state?.from) ? location.state.from : '/student-login'
  const [email, setEmail] = useState(location.state?.email || '')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (!supabase) {
      toast.error('Password recovery is unavailable until Supabase is configured')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password?from=${encodeURIComponent(returnTo)}`,
      })
      if (error) throw error
      setSent(true)
    } catch (error) {
      toast.error(error.message || 'Unable to request a password reset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthSplitLayout
      image={AUTH_ARTWORK.Student.image}
      imageAlt={AUTH_ARTWORK.Student.alt}
      headline="Recover your account"
      description="We will send a secure password reset link to the email address on your account."
    >
      <div className="flex flex-1 items-start justify-center px-4 pb-4 pt-20 lg:items-center lg:p-6">
        <Card className="w-full max-w-sm">
          <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-4">
            <CardTitle>Forgot password?</CardTitle>
            <CardDescription>Enter the email address you use to sign in.</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
            {sent ? (
              <div className="space-y-4">
                <p role="status" className="rounded-md bg-bluespace-700 p-3 text-sm text-white">
                  If an account matches that address, a password reset link is on its way. Check your inbox and spam folder.
                </p>
                <Button type="button" variant="outline" className="w-full" onClick={() => setSent(false)}>Try another email</Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <label className="block space-y-2 text-sm font-medium text-deep-600">
                  Email
                  <Input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
                </label>
                <Button type="submit" className="w-full bg-deep-600 text-white hover:bg-deep-700" disabled={loading}>
                  {loading ? 'Sending...' : 'Send reset link'}
                </Button>
              </form>
            )}
            <p className="mt-5 text-center text-sm text-gray-500">
              Remember your password? <Link to={returnTo} className="font-semibold text-deep-700 hover:underline">Back to sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </AuthSplitLayout>
  )
}

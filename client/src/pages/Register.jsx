import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import AuthSplitLayout from '../components/auth/AuthSplitLayout'
import { AUTH_ARTWORK } from '../components/auth/artwork'

const ROLES = [
  { value: 'Student', label: 'Student', description: 'Apply for a Finsoft or Finops fellowship.', artwork: AUTH_ARTWORK.Student },
  { value: 'Instructor', label: 'Teacher', description: 'Teach modules, mentor squads and review work.', artwork: AUTH_ARTWORK.Instructor },
  { value: 'Partner', label: 'Partner agency', description: 'Publish learning content for academy students.', artwork: AUTH_ARTWORK.Partner },
]

const slide = {
  enter: (direction) => ({ opacity: 0, x: direction > 0 ? 24 : -24 }),
  center: { opacity: 1, x: 0 },
  exit: (direction) => ({ opacity: 0, x: direction > 0 ? -24 : 24 }),
}

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    role: 'Student',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    track: 'Finsoft',
    organisation: '',
    motivation: '',
  })

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const selectedRole = ROLES.find((role) => role.value === form.role)
  const { artwork } = selectedRole

  const next = () => {
    if (step === 1 && !form.role) return
    if (step === 2 && (!form.name.trim() || !form.email.trim())) {
      toast.error('Enter your name and email address')
      return
    }
    if (step === 3 && (form.password.length < 8 || form.password !== form.confirmPassword)) {
      toast.error('Use an 8 character password and make sure both passwords match')
      return
    }
    setDirection(1)
    setStep((current) => current + 1)
  }

  const back = () => {
    setDirection(-1)
    setStep((current) => current - 1)
  }

  const submit = async () => {
    if (!supabase) {
      toast.error('Registration is unavailable until Supabase is configured')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.functions.invoke('auth-handler', {
        body: {
          action: 'apply',
          email: form.email.trim().toLowerCase(),
          password: form.password,
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          role: form.role,
          track: form.role === 'Student' ? form.track : null,
          organisation: form.role === 'Partner' ? form.organisation.trim() || null : null,
          motivation: form.motivation.trim() || null,
        },
      })
      if (error) throw error
      toast.success('Application submitted. The academy team will review it shortly.')
      navigate('/student-login', { replace: true })
    } catch (error) {
      toast.error(error.message || 'Unable to submit application')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthSplitLayout image={artwork.image} imageAlt={artwork.alt} headline={artwork.headline} description={artwork.description}>
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/student-login" className="flex items-center gap-2 text-sm text-gray-500 hover:text-deep-600">
            <ArrowLeft size={16} /> Back to sign in
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">Step {step} of 4</span>
        </div>
        <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-gray-200">
          <motion.div className="h-full bg-brand-600" animate={{ width: `${step * 25}%` }} transition={{ duration: 0.25 }} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Join BlueSPACE Fintech Academy</CardTitle>
            <CardDescription>Complete one shared application for students, teachers and partner agencies.</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div key={step} custom={direction} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
                {step === 1 && (
                  <div className="grid gap-3 md:grid-cols-3">
                    {ROLES.map((role) => (
                      <button key={role.value} type="button" onClick={() => update('role', role.value)} className={`rounded-lg border p-4 text-left transition ${form.role === role.value ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-100' : 'border-gray-200 hover:border-brand-300'}`}>
                        <UserRound size={20} className="mb-3 text-brand-600" />
                        <p className="font-semibold text-deep-600">{role.label}</p>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">{role.description}</p>
                      </button>
                    ))}
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-brand-500">Full name<Input autoComplete="name" placeholder="Your full name" value={form.name} onChange={(event) => update('name', event.target.value)} required /></label>
                      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-brand-500">Email<Input type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(event) => update('email', event.target.value)} required /></label>
                    </div>
                    <label className="block space-y-2 text-xs font-semibold uppercase tracking-wider text-brand-500">Phone (optional)<Input type="tel" autoComplete="tel" placeholder="+233 24 000 0000" value={form.phone} onChange={(event) => update('phone', event.target.value)} /></label>
                    {form.role === 'Student' && <label className="block space-y-2 text-xs font-semibold uppercase tracking-wider text-brand-500">Preferred fellowship track<select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.track} onChange={(event) => update('track', event.target.value)}><option>Finsoft</option><option>Finops</option></select></label>}
                    {form.role === 'Partner' && <label className="block space-y-2 text-xs font-semibold uppercase tracking-wider text-brand-500">Organisation name<Input autoComplete="organization" placeholder="Your agency or organisation" value={form.organisation} onChange={(event) => update('organisation', event.target.value)} /></label>}
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-4">
                    <label className="block space-y-2 text-xs font-semibold uppercase tracking-wider text-brand-500">Password<Input type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} value={form.password} onChange={(event) => update('password', event.target.value)} /></label>
                    <label className="block space-y-2 text-xs font-semibold uppercase tracking-wider text-brand-500">Confirm password<Input type="password" autoComplete="new-password" placeholder="Enter your password again" value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} /></label>
                    <label className="block space-y-2 text-xs font-semibold uppercase tracking-wider text-brand-500">Why are you applying? (optional)<textarea placeholder="Share what you hope to learn or contribute." maxLength={2000} className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground" value={form.motivation} onChange={(event) => update('motivation', event.target.value)} /></label>
                  </div>
                )}
                {step === 4 && (
                  <div className="space-y-4 rounded-lg bg-gray-50 p-5">
                    <div className="flex items-center gap-3"><Check className="text-emerald-600" /><span className="font-semibold text-deep-600">Ready to submit</span></div>
                    <p className="text-sm text-gray-600">You are applying as a <strong>{selectedRole.label}</strong> with <strong>{form.email}</strong>.</p>
                    <p className="text-sm text-gray-500">Your account stays inactive until an academy administrator reviews the application.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            <div className="mt-8 flex justify-between">
              <Button type="button" variant="outline" onClick={back} disabled={step === 1 || loading}>Back</Button>
              {step < 4 ? <Button type="button" onClick={next}>Continue <ArrowRight size={15} className="ml-2" /></Button> : <Button type="button" onClick={submit} disabled={loading}>{loading ? 'Submitting...' : 'Submit application'}</Button>}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
      <footer className="shrink-0 px-6 pb-6 text-center text-xs text-gray-400">BlueSPACE Fintech Academy &copy; 2026</footer>
    </AuthSplitLayout>
  )
}

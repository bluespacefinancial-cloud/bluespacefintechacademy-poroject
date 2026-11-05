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
  { value: 'Student', label: 'Student', description: 'Choose a fellowship track and tell us what you want to learn.', artwork: AUTH_ARTWORK.Student },
  { value: 'Instructor', label: 'Instructor', description: 'Share the domains you teach and your relevant experience.', artwork: AUTH_ARTWORK.Instructor },
  { value: 'Partner', label: 'Partner agency', description: 'Tell us about your organisation and how you want to work with the academy.', artwork: AUTH_ARTWORK.Partner },
]

const TEACHING_DOMAINS = ['FaaS', 'FinCore', 'FinOps', 'FinInfra']
const PARTNERSHIP_FOCUSES = ['Learning content', 'Project briefs', 'Mentorship', 'Internships and hiring', 'Other']

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
    website: '',
    teachingDomains: [],
    teachingExperience: '',
    partnershipFocus: '',
    partnershipDetails: '',
  })

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const selectedRole = ROLES.find((role) => role.value === form.role)
  const { artwork } = selectedRole

  const next = () => {
    if (step === 1 && !form.role) return
    if (step === 2) {
      if (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        toast.error('Enter your name and a valid email address')
        return
      }
      if (form.role === 'Instructor' && (!form.teachingDomains.length || !form.teachingExperience.trim())) {
        toast.error('Choose at least one teaching domain and describe your relevant experience')
        return
      }
      if (form.role === 'Partner' && (!form.organisation.trim() || !form.partnershipFocus || !form.partnershipDetails.trim())) {
        toast.error('Complete your organisation, partnership focus and collaboration details')
        return
      }
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
      const { data, error } = await supabase.functions.invoke('auth-handler', {
        body: {
          action: 'apply',
          email: form.email.trim().toLowerCase(),
          password: form.password,
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          role: form.role,
          track: form.role === 'Student' ? form.track : null,
          organisation: form.role === 'Partner' ? form.organisation.trim() || null : null,
          motivation: form.role === 'Student' ? form.motivation.trim() || null : null,
          website: form.role === 'Partner' ? form.website.trim() || null : null,
          teachingDomains: form.role === 'Instructor' ? form.teachingDomains : [],
          teachingExperience: form.role === 'Instructor' ? form.teachingExperience.trim() : null,
          partnershipFocus: form.role === 'Partner' ? form.partnershipFocus : null,
          partnershipDetails: form.role === 'Partner' ? form.partnershipDetails.trim() : null,
        },
      })
      if (error) throw error
      toast.success(data?.emailConfirmationRequired
        ? 'Application received. Check your email to verify your address.'
        : 'Application submitted. The academy team will review it shortly.')
      navigate(data?.emailConfirmationRequired ? '/student-login?pendingVerification=1' : '/student-login', {
        replace: true,
        state: { registeredEmail: form.email.trim().toLowerCase() },
      })
    } catch (error) {
      toast.error(error.message || 'Unable to submit application')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthSplitLayout image={artwork.image} imageAlt={artwork.alt} headline={artwork.headline} description={artwork.description}>
      <div className="flex flex-1 items-start justify-center px-4 pb-4 pt-20 lg:items-center lg:p-6">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold normal-case tracking-normal text-deep-600">Step {step} of 4</span>
          <Link to="/student-login" className="flex shrink-0 items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-500 hover:text-deep-600">
            <ArrowLeft size={16} /> Back to sign in
          </Link>
        </div>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-gray-200 sm:mb-6">
          <motion.div className="h-full bg-deep-600" animate={{ width: `${step * 25}%` }} transition={{ duration: 0.25 }} />
        </div>
        <Card>
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle className="text-xl sm:text-2xl">{form.role === 'Student' ? 'Student fellowship application' : form.role === 'Instructor' ? 'Instructor application' : 'Partner agency application'}</CardTitle>
            <CardDescription>{form.role === 'Student' ? 'Tell us which track you want to join and what you hope to learn.' : form.role === 'Instructor' ? 'Tell us what you can teach and the experience you would bring.' : 'Tell us about your organisation and the support you can offer.'}</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div key={step} custom={direction} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
                {step === 1 && (
                  <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
                    {ROLES.map((role) => (
                      <button key={role.value} type="button" onClick={() => update('role', role.value)} className={`rounded-lg border p-3 text-left transition sm:p-4 ${form.role === role.value ? 'border-deep-600 bg-deep-600 text-white ring-2 ring-deep-200' : 'border-gray-200 hover:border-deep-600'}`}>
                        <UserRound size={20} className={`mb-3 ${form.role === role.value ? 'text-white' : 'text-deep-600'}`} />
                        <p className={`font-semibold ${form.role === role.value ? 'text-white' : 'text-deep-600'}`}>{role.label}</p>
                        <p className={`mt-1 text-xs leading-relaxed ${form.role === role.value ? 'text-white/80' : 'text-gray-500'}`}>{role.description}</p>
                      </button>
                    ))}
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-2 text-xs font-semibold normal-case tracking-normal text-deep-600">Full name<Input autoComplete="name" placeholder="Your full name" value={form.name} onChange={(event) => update('name', event.target.value)} required /></label>
                      <label className="space-y-2 text-xs font-semibold normal-case tracking-normal text-deep-600">Email<Input type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(event) => update('email', event.target.value)} required /></label>
                    </div>
                    <label className="block space-y-2 text-xs font-semibold normal-case tracking-normal text-deep-600">Phone (optional)<Input type="tel" autoComplete="tel" placeholder="+233 24 000 0000" value={form.phone} onChange={(event) => update('phone', event.target.value)} /></label>
                    {form.role === 'Student' && <label className="block space-y-2 text-xs font-semibold normal-case tracking-normal text-deep-600">Preferred fellowship track<select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-600 focus-visible:ring-offset-2" value={form.track} onChange={(event) => update('track', event.target.value)}><option>Finsoft</option><option>Finops</option></select></label>}
                    {form.role === 'Student' && <label className="block space-y-2 text-xs font-semibold normal-case tracking-normal text-deep-600">What do you hope to learn in the fellowship?<textarea placeholder="Share the skills or fintech topics you want to develop." maxLength={2000} className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-600 focus-visible:ring-offset-2" value={form.motivation} onChange={(event) => update('motivation', event.target.value)} /></label>}
                    {form.role === 'Instructor' && <div className="space-y-3"><fieldset><legend className="mb-2 text-xs font-semibold text-deep-600">Which domains can you teach?</legend><div className="grid grid-cols-2 gap-2">{TEACHING_DOMAINS.map((domain) => <label key={domain} className="flex items-center gap-2 rounded-md border border-gray-200 p-2.5 text-sm"><input type="checkbox" checked={form.teachingDomains.includes(domain)} onChange={(event) => update('teachingDomains', event.target.checked ? [...form.teachingDomains, domain] : form.teachingDomains.filter((item) => item !== domain))} />{domain}</label>)}</div></fieldset><label className="block space-y-2 text-xs font-semibold normal-case tracking-normal text-deep-600">Teaching or industry experience<textarea required placeholder="Describe your relevant experience, mentoring or technical background." maxLength={3000} className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-600 focus-visible:ring-offset-2" value={form.teachingExperience} onChange={(event) => update('teachingExperience', event.target.value)} /></label></div>}
                    {form.role === 'Partner' && <div className="space-y-3 sm:space-y-4"><label className="block space-y-2 text-xs font-semibold normal-case tracking-normal text-deep-600">Organisation name<Input autoComplete="organization" placeholder="Your agency or organisation" value={form.organisation} onChange={(event) => update('organisation', event.target.value)} required /></label><label className="block space-y-2 text-xs font-semibold normal-case tracking-normal text-deep-600">Organisation website (optional)<Input type="url" autoComplete="url" placeholder="https://example.com" value={form.website} onChange={(event) => update('website', event.target.value)} /></label><label className="block space-y-2 text-xs font-semibold normal-case tracking-normal text-deep-600">How would you like to partner?<select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-600 focus-visible:ring-offset-2" value={form.partnershipFocus} onChange={(event) => update('partnershipFocus', event.target.value)} required><option value="">Select a partnership focus</option>{PARTNERSHIP_FOCUSES.map((focus) => <option key={focus}>{focus}</option>)}</select></label><label className="block space-y-2 text-xs font-semibold normal-case tracking-normal text-deep-600">What can your organisation contribute?<textarea required placeholder="Describe content, projects, mentorship, placements or other support you can offer." maxLength={3000} className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-600 focus-visible:ring-offset-2" value={form.partnershipDetails} onChange={(event) => update('partnershipDetails', event.target.value)} /></label></div>}
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-3">
                    <label className="block space-y-2 text-xs font-semibold normal-case tracking-normal text-deep-600">Password<Input type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} value={form.password} onChange={(event) => update('password', event.target.value)} /></label>
                    <label className="block space-y-2 text-xs font-semibold normal-case tracking-normal text-deep-600">Confirm password<Input type="password" autoComplete="new-password" placeholder="Enter your password again" value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} /></label>
                  </div>
                )}
                {step === 4 && (
                  <div className="space-y-4 rounded-lg bg-gray-50 p-5">
                    <div className="flex items-center gap-3"><Check className="text-emerald-600" /><span className="font-semibold text-deep-600">Ready to submit</span></div>
                    <p className="text-sm text-gray-600">You are applying as a <strong>{selectedRole.label}</strong> with <strong>{form.email}</strong>.</p>
                    {form.role === 'Student' && <p className="text-sm text-gray-600">Track: <strong>{form.track}</strong>{form.motivation && <> · Learning goals: {form.motivation}</>}</p>}
                    {form.role === 'Instructor' && <div className="text-sm text-gray-600"><p>Teaching domains: <strong>{form.teachingDomains.join(', ')}</strong></p><p className="mt-1">Experience: {form.teachingExperience}</p></div>}
                    {form.role === 'Partner' && <div className="text-sm text-gray-600"><p>Organisation: <strong>{form.organisation}</strong></p><p>Partnership focus: <strong>{form.partnershipFocus}</strong></p>{form.website && <p>Website: {form.website}</p>}<p className="mt-1">Contribution: {form.partnershipDetails}</p></div>}
                    <p className="text-sm text-gray-500">Your account stays inactive until an academy administrator reviews the application.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            <div className="mt-5 flex justify-between sm:mt-8">
              <Button type="button" variant="outline" onClick={back} disabled={step === 1 || loading}>Back</Button>
              {step < 4 ? <Button type="button" className="bg-deep-600 text-white hover:bg-deep-700" onClick={next}>Continue <ArrowRight size={15} className="ml-2" /></Button> : <Button type="button" className="bg-deep-600 text-white hover:bg-deep-700" onClick={submit} disabled={loading}>{loading ? 'Submitting...' : 'Submit application'}</Button>}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
      <footer className="hidden shrink-0 px-6 pb-6 text-center text-xs text-gray-400 sm:block">BlueSPACE Fintech Academy &copy; 2026</footer>
    </AuthSplitLayout>
  )
}

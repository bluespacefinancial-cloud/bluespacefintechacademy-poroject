import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  User,
  Shield,
  Award,
  Check,
  Save,
  Lock,
  Layers,
  Compass,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  GraduationCap,
  CreditCard,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import { api } from '../lib/backend'
import { getCurrentProfile } from '../lib/profile'
import { IDCardLanyard } from '../components/ui/id-card-lanyard'
import { Breadcrumb } from '../components/ui/breadcrumb'
import toast from 'react-hot-toast'

const ROLES = [
  { id: 'Project Manager', label: 'Project Manager', desc: 'Team execution, sprint roadmaps, and stakeholder alignment' },
  { id: 'Field Lead', label: 'Field Lead', desc: 'Fintech deployment, field integrations, and merchant operations' },
  { id: 'UAT', label: 'UAT & Quality Analyst', desc: 'Quality assurance, ISO test scripts, and compliance verification' },
  { id: 'Technical Specialist', label: 'Technical Specialist', desc: 'Core architecture, payment APIs, microservices, and databases' },
  { id: 'Not Sure Yet', label: 'General / Undecided', desc: 'Exploring fellowship tracks and cross-functional opportunities' },
]

const DOMAINS = [
  { id: 'FaaS', name: 'Fintech-as-a-Service (FaaS)', desc: 'Banking-as-a-service, open banking APIs, and financial middleware' },
  { id: 'FinCore', name: 'Core Banking (FinCore)', desc: 'Double-entry ledgers, transaction switching, and core account systems' },
  { id: 'FinOps', name: 'Fintech Operations (FinOps)', desc: 'Treasury and Liquidity mgt, Payment Systems, Reconciliation, Settlement, Transaction monitoring, Compliance and AML' },
  { id: 'FinInfra', name: 'Fintech Infrastructure (FinFra)', desc: 'AI and Fintech, Data Infrastructure, Cyber Resilience, Data warehouse etc' },
]

const ALL_SKILLS = [
  'API Design',
  'Ledger Engineering',
  'Payment Systems',
  'Treasury & Liquidity Mgt',
  'Reconciliation & Settlement',
  'Transaction Monitoring',
  'Compliance & AML',
  'AI & Fintech Systems',
  'Data Infrastructure',
  'Data Warehouse & Analytics',
  'Cyber Resilience & Security',
  'Cloud Platforms & CI/CD',
  'Project Management',
  'Stakeholder Communication',
  'UAT & Test Suites',
  'SQL & TimescaleDB',
  'Message Queues (Kafka/RabbitMQ)',
]

export default function ProfileSettings() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  // The URL is the single source of truth for the active tab.
  const activeTab = ['showcase', 'skills', 'credentials', 'security'].includes(tabParam)
    ? tabParam
    : 'showcase'

  // Profile and Account State
  const [profile, setProfile] = useState(null)
  const [cohortName, setCohortName] = useState('')
  const [accountForm, setAccountForm] = useState({ name: '', email: '', phone: '' })
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' })

  // Skills State
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedDomains, setSelectedDomains] = useState([])
  const [selectedSkills, setSelectedSkills] = useState([])
  const [careerNotes, setCareerNotes] = useState('')

  // Credentials State
  const [certifications, setCertifications] = useState([])
  const [capstoneSubmission, setCapstoneSubmission] = useState(null)

  // Status & UI State
  const [loading, setLoading] = useState(true)
  const [showIdCard, setShowIdCard] = useState(true)
  const [savingAccount, setSavingAccount] = useState(false)
  const [savingSkills, setSavingSkills] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleTabChange = (tab) => {
    setSearchParams({ tab })
    setError('')
    setMessage('')
  }

  useEffect(() => {
    let cancelled = false
    const loadAll = async () => {
      try {
        const p = await getCurrentProfile()
        if (!p) {
          navigate('/login')
          return
        }

        const [
          { data: enrolmentRow },
          { data: skillsRow },
          { data: certRows },
          { data: capstoneRows },
        ] = await Promise.all([
          api
            .from('enrolments')
            .select('cohort_id, track, cohorts(name)')
            .eq('user_id', p.id)
            .in('status', ['enrolled', 'active'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          api
            .from('skills_profiles')
            .select('*')
            .eq('user_id', p.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          api
            .from('certifications')
            .select('*, cohorts(name)')
            .eq('user_id', p.id)
            .order('created_at', { ascending: false }),
          api
            .from('submissions')
            .select('*, assessments!inner(type, title)')
            .eq('user_id', p.id)
            .eq('assessments.type', 'capstone')
            .order('created_at', { ascending: false })
            .limit(1),
        ])

        if (cancelled) return

        setProfile(p)
        setCohortName(enrolmentRow?.cohorts?.name || 'Cohort 1 2026')
        setAccountForm({
          name: p.name || '',
          email: p.email || '',
          phone: p.phone || '',
        })

        if (skillsRow) {
          setSelectedRole(skillsRow.role_preference || '')
          setSelectedDomains(skillsRow.domains || [])
          setSelectedSkills(skillsRow.skills?.selected || [])
          setCareerNotes(skillsRow.notes || '')
        }

        setCertifications(certRows || [])
        setCapstoneSubmission(capstoneRows?.[0] || null)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load profile data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadAll()
    return () => {
      cancelled = true
    }
  }, [navigate])

  const handleSaveAccount = async (e) => {
    e.preventDefault()
    setSavingAccount(true)
    setError('')
    setMessage('')
    try {
      const updates = {
        name: accountForm.name.trim(),
        phone: accountForm.phone.trim() || null,
      }
      const { error: updateError } = await api
        .from('users')
        .update(updates)
        .eq('id', profile.id)

      if (updateError) throw updateError
      setProfile((prev) => ({ ...prev, ...updates }))
      setMessage('Account profile details updated successfully.')
    } catch (err) {
      setError(err.message || 'Failed to update account details.')
    } finally {
      setSavingAccount(false)
    }
  }

  const handleSaveSkills = async () => {
    if (!selectedRole) {
      setError('Please select your preferred fellowship role.')
      return
    }
    if (selectedDomains.length === 0) {
      setError('Please select at least one domain track interest.')
      return
    }

    setSavingSkills(true)
    setError('')
    setMessage('')

    try {
      const payload = {
        user_id: profile.id,
        role_preference: selectedRole,
        domains: selectedDomains,
        skills: { selected: selectedSkills },
        notes: careerNotes.trim() || null,
        updated_at: new Date().toISOString(),
      }

      const { error: saveError } = await api
        .from('skills_profiles')
        .upsert(payload, { onConflict: 'user_id' })

      if (saveError) throw saveError
      setMessage('Skills profile saved successfully. Faculty uses this for squad assignments.')
    } catch (err) {
      setError(err.message || 'Failed to save skills profile.')
    } finally {
      setSavingSkills(false)
    }
  }

  const calculatePasswordStrength = (password) => {
    if (!password) return 0
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25
    if (/\d/.test(password)) strength += 25
    if (/[^A-Za-z0-9]/.test(password)) strength += 25
    return strength
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('New password and confirmation do not match.')
      return
    }
    if (passwordForm.new_password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setSavingPassword(true)
    setError('')
    setMessage('')

    try {
      const { error: pwError } = await api.auth.updateUser({
        password: passwordForm.new_password,
      })
      if (pwError) throw pwError
      setMessage('Your password has been changed successfully.')
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
      toast.success('Password updated successfully')
    } catch (err) {
      setError(err.message || 'Unable to change password.')
      toast.error('Password change failed')
    } finally {
      setSavingPassword(false)
    }
  }

  const toggleDomain = (domainId) => {
    setSelectedDomains((prev) => {
      const match = (id) => id === domainId || (domainId === 'FinInfra' && id === 'FinFra') || (domainId === 'FinFra' && id === 'FinInfra')
      if (prev.some(match)) return prev.filter((d) => !match(d))
      if (prev.length >= 2) return [prev[1], domainId]
      return [...prev, domainId]
    })
  }

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  if (loading || !profile) {
    return (
      <div className="w-full space-y-6">
        <DashboardHeader
          title="Fellow Profile & Showcase"
          subtitle="Manage your fintech track preferences, verified skills, and account security."
        />
        <div className="min-h-[300px] flex items-center justify-center bg-card border border-border rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-deep-600 dark:border-deep-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading fellow profile...</span>
          </div>
        </div>
      </div>
    )
  }

  const skillsCompletion = Math.min(
    100,
    (selectedRole ? 40 : 0) +
      (selectedDomains.length ? 30 : 0) +
      (selectedSkills.length ? 20 : 0) +
      (careerNotes.trim() ? 10 : 0)
  )

  return (
    <div className="w-full space-y-6">
      {/* 3D Interactive Lanyard ID Badge on the profile area */}
      {showIdCard && (
        <IDCardLanyard
          name={profile.name || 'Fellow'}
          role={`${cohortName || 'Cohort 1'} • ${selectedRole || profile.track || 'Fellow'}`}
          brand="BLUESPACE"
          brandTagline="Fintech Academy"
          pillars={["Code", "Ledgers", "Ship"]}
          location="Accra · Lagos"
          idNumber={profile.student_id || profile.id || 'BS-2026-0042'}
          validThru="12/2027"
          site="bluespacefintechacademy.com"
          anchorX="calc(100% - 130px)"
          anchorY={6}
          zIndex={60}
          showHint={true}
          onClose={() => setShowIdCard(false)}
        />
      )}

      {/* Top Header */}
      <Breadcrumb items={[{ label: 'Profile & Settings' }]} />
      <DashboardHeader
        title="Fellow Profile & Showcase"
        subtitle={`${profile.name || 'Fellow'} • ${profile.type || 'Student'} • ${cohortName}`}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              ID: <span className="font-mono font-medium text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>{profile.student_id || profile.id}</span>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowIdCard(!showIdCard)}
              className="text-xs border-border text-foreground dark:text-deep-300 bg-card hover:bg-muted/60 font-medium h-8"
              title="Toggle Student Lanyard ID Badge"
            >
              <CreditCard size={13} className="mr-1.5 text-deep-600 dark:text-deep-400" />
              {showIdCard ? 'Hide Lanyard' : 'Physical ID Badge'}
            </Button>
            <Badge variant="solidEmerald" className="text-xs font-semibold px-2.5 py-0.5">
              Active Enrolment
            </Badge>
          </div>
        }
      />

      {/* Alerts */}
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3.5 text-xs text-red-800 dark:text-red-300 flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <span>{error}</span>
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
          <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-border gap-4 sm:gap-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabChange('showcase')}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'showcase'
              ? 'border-deep-600 text-deep-600 dark:border-deep-400 dark:text-deep-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <User size={15} />
          Showcase & Bio
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('skills')}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'skills'
              ? 'border-deep-600 text-deep-600 dark:border-deep-400 dark:text-deep-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Compass size={15} />
          Skills & Domains
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-deep-700 dark:text-deep-300 border border-deep-200 dark:border-deep-800/80 bg-deep-50/80 dark:bg-deep-950/60">
            {skillsCompletion}%
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('credentials')}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'credentials'
              ? 'border-deep-600 text-deep-600 dark:border-deep-400 dark:text-deep-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Award size={15} />
          Credentials & Capstone
          {certifications.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/40">
              {certifications.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('security')}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-deep-600 text-deep-600 dark:border-deep-400 dark:text-deep-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Lock size={15} />
          Account & Security
        </button>
      </div>

      {/* TAB 1: SHOWCASE & BIO */}
      {activeTab === 'showcase' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Fellow Card (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-border shadow-sm bg-card overflow-hidden">
              <div className="p-6 border-b border-border bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-deep-50 dark:bg-deep-950/40 border border-deep-100 dark:border-deep-800/60 flex items-center justify-center text-xl font-bold text-deep-700 dark:text-deep-300 shrink-0">
                    {profile.name?.charAt(0)?.toUpperCase() || 'F'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{profile.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-300 font-mono mt-0.5">{profile.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="solidBlue" className="text-[10px] font-semibold">
                        {selectedRole || 'Fintech Engineer Fellow'}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{cohortName}</span>
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTabChange('skills')}
                  className="text-xs border-border bg-card dark:bg-card/90 text-foreground dark:text-white hover:bg-muted/60 hover:text-foreground dark:hover:text-white font-medium"
                >
                  Edit Skills
                </Button>
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Domain Focus */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                    Specialization Tracks
                  </h4>
                  {selectedDomains.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No domain focus selected yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedDomains.map((d) => (
                        <span
                          key={d}
                          className="text-xs font-semibold px-3 py-1 rounded-lg text-deep-700 dark:text-deep-300 border border-deep-200 dark:border-deep-800/60 bg-deep-50/50 dark:bg-deep-950/30"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Skills Chips */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                    Verified Competencies ({selectedSkills.length})
                  </h4>
                  {selectedSkills.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No skills selected yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedSkills.map((skill) => (
                        <span
                          key={skill}
                          className="text-xs font-medium px-2.5 py-1 rounded-md text-foreground border border-border bg-background"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Career Notes */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Fellowship Bio & Career Goals
                  </h4>
                  <div className="rounded-xl border border-border bg-card dark:bg-card/60 p-4 text-xs text-foreground dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {careerNotes ||
                      'No bio added yet. Visit the Skills & Domains tab to add your background, target fintech roles, and engineering aspirations.'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Metrics & Showcase Sidebar */}
          <div className="space-y-4">
            <Card className="border border-border shadow-sm bg-card">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Shield size={15} className="text-deep-600 dark:text-deep-400" />
                  Fellow Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs text-muted-foreground">
                <div className="flex justify-between items-center py-1 border-b border-border">
                  <span className="text-muted-foreground">Student ID</span>
                  <span className="font-mono font-semibold text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>{profile.student_id || profile.id}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border">
                  <span className="text-muted-foreground">Cohort</span>
                  <span className="font-semibold text-foreground">{cohortName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border">
                  <span className="text-muted-foreground">Academic Status</span>
                  <Badge variant="solidEmerald" className="text-[10px] font-semibold">
                    Enrolled
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Certificates Earned</span>
                  <span className="font-semibold text-foreground">{certifications.length}</span>
                </div>
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-muted-foreground">Interactive Lanyard</span>
                  <button
                    type="button"
                    onClick={() => setShowIdCard(!showIdCard)}
                    className="text-xs font-semibold text-deep-600 dark:text-deep-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <CreditCard size={12} />
                    {showIdCard ? 'Hide Badge' : 'View Hanging Badge'}
                  </button>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <Award size={14} className="text-deep-600 dark:text-deep-400" />
                Industry Talent Network
              </p>
              <p className="leading-relaxed">
                Your verified skills and capstone submissions are shared with BlueSPACE fintech hiring partners during the Week 13-16 placement phase.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SKILLS & DOMAINS */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Compass size={15} className="text-deep-600 dark:text-deep-400" />
                    Specialization Role Preference
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Select the engineering or project leadership role you want to focus on in your squad
                  </CardDescription>
                </div>
                <span className="text-xs font-semibold text-deep-600 dark:text-deep-400">Choose 1 Role</span>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ROLES.map((r) => {
                  const isSelected = selectedRole === r.id
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-deep-600 dark:border-deep-500 bg-deep-50/80 dark:bg-deep-950/60 shadow-xs ring-1 ring-deep-600 dark:ring-deep-500'
                          : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:bg-gray-50 dark:hover:bg-slate-800/80 hover:border-gray-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold ${isSelected ? 'text-deep-700 dark:text-deep-300' : 'text-gray-900 dark:text-white'}`}>
                          {r.label}
                        </span>
                        {isSelected && <Check size={14} className="text-deep-600 dark:text-deep-400" />}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-snug">{r.desc}</p>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Domain Selection */}
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Layers size={15} className="text-deep-600 dark:text-deep-400" />
                    Fintech Domain Tracks
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Select up to 2 domain focus areas for squad placement
                  </CardDescription>
                </div>
                <Badge variant="solidBlue" className="text-xs font-semibold">
                  {selectedDomains.length} of 2 Selected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {DOMAINS.map((domain) => {
                  const isSelected = selectedDomains.includes(domain.id) || (domain.id === 'FinInfra' && selectedDomains.includes('FinFra'))
                  return (
                    <button
                      key={domain.id}
                      type="button"
                      onClick={() => toggleDomain(domain.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-deep-600 dark:border-deep-500 bg-deep-50/80 dark:bg-deep-950/60 shadow-xs ring-1 ring-deep-600 dark:ring-deep-500'
                          : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:bg-gray-50 dark:hover:bg-slate-800/80 hover:border-gray-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-bold ${isSelected ? 'text-deep-700 dark:text-deep-300' : 'text-gray-900 dark:text-white'}`}>
                          {domain.name}
                        </span>
                        {isSelected && <Check size={14} className="text-deep-600 dark:text-deep-400" />}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">{domain.desc}</p>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Skills Chips */}
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Technical & Operational Competencies
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Click skills that match your experience or targets
                  </CardDescription>
                </div>
                <Badge variant="solidBlue" className="text-xs font-semibold">
                  {selectedSkills.length} Selected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex flex-wrap gap-2">
                {ALL_SKILLS.map((skill) => {
                  const isSelected = selectedSkills.includes(skill)
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-deep-600 text-white border-deep-600 dark:bg-deep-600 dark:border-deep-500 shadow-xs'
                          : 'bg-white dark:bg-slate-900/80 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-800 hover:border-deep-600/50 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      {isSelected && <Check size={12} />}
                      <span>{skill}</span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Career Notes */}
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-sm font-bold text-foreground">
                Career Goals & Engineering Background
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Share any prior experience, programming languages, or target fintech companies
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <Textarea
                rows={3}
                placeholder="Tell us about your background, tools you've worked with, or what you want to build during the academy..."
                value={careerNotes}
                onChange={(e) => setCareerNotes(e.target.value)}
                className="text-xs text-foreground bg-background border-input"
              />

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleSaveSkills}
                  disabled={savingSkills}
                  size="sm"
                  className="bg-deep-600 text-white hover:bg-deep-700 text-xs font-semibold"
                >
                  <Save size={13} className="mr-1.5" />
                  {savingSkills ? 'Saving...' : 'Save Skills Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: CREDENTIALS & CAPSTONE */}
      {activeTab === 'credentials' && (
        <div className="space-y-6">
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Award size={15} className="text-deep-600 dark:text-deep-400" />
                    Issued Certificates & Badges
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Official graduation credentials issued by BlueSPACE Fintech Academy
                  </CardDescription>
                </div>
                <Button asChild variant="outline" size="sm" className="text-xs border-border">
                  <Link to="/certificates">
                    <span>Full Certificates Page</span>
                    <ExternalLink size={12} className="ml-1.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {certifications.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <Award size={24} className="text-muted-foreground/40 mx-auto" />
                  <p className="text-xs font-bold text-foreground">No Certificates Issued Yet</p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    Certificates are awarded upon achieving 80%+ coursework completion, submitting all required labs, and successfully defending your capstone project.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="text-sm font-bold text-foreground">
                            BlueSPACE {cert.track} Certificate
                          </h5>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {cert.cohorts?.name || cohortName}
                          </p>
                        </div>
                        <Badge
                          variant="solidEmerald"
                          className="text-[10px] capitalize font-semibold"
                        >
                          {cert.status}
                        </Badge>
                      </div>

                      {cert.final_grade && (
                        <p className="text-xs text-muted-foreground">
                          Final Grade: <span className="font-bold text-foreground">{cert.final_grade}%</span>
                        </p>
                      )}

                      {cert.certificate_url && (
                        <Button asChild size="sm" variant="outline" className="w-full text-xs border-border">
                          <a href={cert.certificate_url} target="_blank" rel="noreferrer">
                            <ExternalLink size={13} className="mr-1.5" />
                            View Verifiable Certificate
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Capstone Defense Status */}
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <GraduationCap size={15} className="text-deep-600 dark:text-deep-400" />
                    Capstone Defense Status
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Final graduation software deliverable and faculty review panel
                  </CardDescription>
                </div>
                <Button asChild variant="outline" size="sm" className="text-xs border-border">
                  <Link to="/capstone">
                    <span>Open Capstone Submission</span>
                    <ExternalLink size={12} className="ml-1.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {capstoneSubmission ? (
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      {capstoneSubmission.assessments?.title || 'Production Capstone'}
                    </span>
                    <Badge variant="solidBlue" className="text-[10px] capitalize font-semibold">
                      {capstoneSubmission.status || 'Under Review'}
                    </Badge>
                  </div>
                  {capstoneSubmission.score !== null && (
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Panel Score: {capstoneSubmission.score}/100
                    </p>
                  )}
                  {capstoneSubmission.feedback && (
                    <p className="text-xs text-muted-foreground mt-1">{capstoneSubmission.feedback}</p>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center space-y-1.5">
                  <p className="text-xs font-bold text-foreground">Capstone Project Pending</p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    The capstone milestone opens in Weeks 13-16. Fellows submit a functional fintech application with video walkthrough and defend before the panel.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: ACCOUNT & SECURITY */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-sm font-bold text-foreground">Personal Information</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Update your display name and contact telephone
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleSaveAccount} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    value={accountForm.name}
                    onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Email Address (Read Only)
                  </label>
                  <Input
                    disabled
                    value={accountForm.email}
                    className="text-xs bg-muted/40 text-muted-foreground font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    placeholder="+233 20 000 0000"
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                    className="text-xs"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={savingAccount}
                    size="sm"
                    className="bg-deep-600 text-white hover:bg-deep-700 text-xs font-semibold"
                  >
                    <Save size={13} className="mr-1.5" />
                    {savingAccount ? 'Saving...' : 'Save Account Details'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-sm font-bold text-foreground">Change Password</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Ensure your account uses a secure password of at least 8 characters
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    required
                    placeholder="At least 8 characters"
                    value={passwordForm.new_password}
                    onChange={(e) => {
                      const val = e.target.value
                      setPasswordForm({ ...passwordForm, new_password: val })
                      setPasswordStrength(calculatePasswordStrength(val))
                    }}
                    className="text-xs"
                  />
                  {passwordStrength > 0 && (
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            passwordStrength < 40
                              ? 'bg-red-500'
                              : passwordStrength < 70
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                      <span
                        className={`text-[10px] font-medium ${
                          passwordStrength < 40
                            ? 'text-red-600 dark:text-red-400'
                            : passwordStrength < 70
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {passwordStrength < 40
                          ? 'Weak'
                          : passwordStrength < 70
                          ? 'Fair'
                          : 'Strong'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    required
                    placeholder="Repeat new password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    className="text-xs"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={savingPassword}
                    size="sm"
                    variant="outline"
                    className="text-xs border-border"
                  >
                    <Lock size={13} className="mr-1.5" />
                    {savingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

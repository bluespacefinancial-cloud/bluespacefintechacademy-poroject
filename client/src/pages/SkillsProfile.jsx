import { useEffect, useState } from 'react'
import {
  Check,
  Save,
  Compass,
  Briefcase,
  FileText,
  Layers,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Textarea } from '../components/ui/textarea'
import { api } from '../lib/backend'
import { getCurrentProfile } from '../lib/profile'
import DashboardHeader from '../components/dashboard/DashboardHeader'

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
  { id: 'FinOps', name: 'Fintech Operations (FinOps)', desc: 'Settlement rails, reconciliation engines, and dispute handling' },
  { id: 'FinInfra', name: 'Fintech Infrastructure (FinInfra)', desc: 'High-availability payment gateways, HSM security, and cloud infra' },
]

const SKILLS = [
  'API Design',
  'Ledger Engineering',
  'CI/CD Pipelines',
  'Reconciliation',
  'Regulatory Reporting',
  'Cloud Platforms',
  'Project Management',
  'Stakeholder Communication',
  'UAT & Test Suites',
  'Team Leadership',
  'SQL & TimescaleDB',
  'Message Queues (Kafka/RabbitMQ)',
]

export default function SkillsProfile() {
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState('')
  const [selectedDomains, setSelectedDomains] = useState([])
  const [selectedSkills, setSelectedSkills] = useState([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const completion = Math.min(
    100,
    (role ? 40 : 0) + (selectedDomains.length ? 30 : 0) + (selectedSkills.length ? 20 : 0) + (notes.trim() ? 10 : 0)
  )

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const current = await getCurrentProfile()
        if (!current) throw new Error('You must be signed in to access your skills profile.')
        const { data, error: loadError } = await api
          .from('skills_profiles')
          .select('*')
          .eq('user_id', current.id)
          .maybeSingle()
        if (loadError) throw loadError

        if (!cancelled) {
          setProfile(current)
          if (data) {
            setRole(data.role_preference || '')
            setSelectedDomains(data.domains || [])
            setSelectedSkills(data.skills?.selected || [])
            setNotes(data.notes || '')
          }
        }
      } catch (loadErr) {
        if (!cancelled) setError(loadErr.message || 'Unable to load skills profile.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const save = async () => {
    if (!profile) return
    if (!role) {
      setError('Please choose your preferred fellowship role.')
      return
    }
    if (selectedDomains.length === 0) {
      setError('Please select at least one domain track interest.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const { error: saveError } = await api.from('skills_profiles').upsert(
        {
          user_id: profile.id,
          role_preference: role,
          domains: selectedDomains,
          skills: { selected: selectedSkills },
          notes: notes.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      if (saveError) throw saveError

      setMessage('Your skills profile has been saved. Faculty will use this for cohort squad placement.')
      setTimeout(() => setMessage(''), 4000)
    } catch (saveErr) {
      setError(saveErr.message || 'Unable to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const toggleDomain = (domainId) => {
    setSelectedDomains((prev) => {
      if (prev.includes(domainId)) {
        return prev.filter((d) => d !== domainId)
      }
      if (prev.length >= 2) {
        // limit to max 2 domains
        return [prev[1], domainId]
      }
      return [...prev, domainId]
    })
  }

  const toggleSkill = (skillName) => {
    setSelectedSkills((prev) =>
      prev.includes(skillName) ? prev.filter((s) => s !== skillName) : [...prev, skillName]
    )
  }

  if (loading) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm font-medium text-gray-500">Loading skills profile...</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header with Completion Progress */}
      <DashboardHeader
        title="Fellowship Skills Profile"
        subtitle="Keep your role preferences, domain interests, and technical strengths up to date for collaborative squad placement."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-200/90 rounded-lg px-3 py-1.5 shadow-xs text-xs">
              <span className="font-semibold text-gray-900">{completion}%</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">Profile Complete</span>
              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden ml-1">
                <div
                  className="h-full bg-deep-600 rounded-full transition-all duration-300"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={save}
              disabled={saving}
              className="bg-deep-600 text-white hover:bg-deep-700 text-xs font-semibold"
            >
              <Save size={13} className="mr-1.5" />
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        }
      />

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <p className="font-semibold">Notice</p>
          <p className="mt-0.5">{error}</p>
        </div>
      )}

      {message && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
          <p className="font-semibold">Saved</p>
          <p className="mt-0.5">{message}</p>
        </div>
      )}

      {/* Section 1: Preferred Fellowship Role */}
      <Card className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-deep-50 border border-deep-100 flex items-center justify-center text-deep-600 shrink-0">
              <Briefcase size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 leading-tight">1. Preferred Fellowship Role</h3>
              <p className="text-xs text-gray-500">Select your primary role contribution within cohort sprint teams</p>
            </div>
          </div>
          <Badge
            variant={role ? 'secondary' : 'outline'}
            className="text-[11px] font-medium border-gray-200"
          >
            {role || 'Select one'}
          </Badge>
        </div>

        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ROLES.map((r) => {
              const isSelected = role === r.id
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-deep-600 bg-deep-50/30 ring-1 ring-deep-600 shadow-2xs'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/60 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-gray-900">{r.label}</p>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center border shrink-0 mt-0.5 ${
                        isSelected
                          ? 'border-deep-600 bg-deep-600 text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check size={10} strokeWidth={3} />}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">{r.desc}</p>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Domain Interests (2/3) & Skills (1/3 or 2-col) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain Interests */}
        <Card className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-deep-50 border border-deep-100 flex items-center justify-center text-deep-600 shrink-0">
                  <Compass size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">2. Domain Specialization</h3>
                  <p className="text-xs text-gray-500">Pick up to 2 target fintech tracks</p>
                </div>
              </div>
              <Badge
                variant={selectedDomains.length > 0 ? 'secondary' : 'outline'}
                className="text-[11px] font-medium border-gray-200"
              >
                {selectedDomains.length}/2 selected
              </Badge>
            </div>

            <CardContent className="p-5 space-y-3">
              {DOMAINS.map((d) => {
                const isSelected = selectedDomains.includes(d.id)
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDomain(d.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-deep-600 bg-deep-50/30 ring-1 ring-deep-600 shadow-2xs'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/60 bg-white'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900">{d.name}</p>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{d.desc}</p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'border-deep-600 bg-deep-600 text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check size={10} strokeWidth={3} />}
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </div>

          <div className="px-5 py-3 bg-gray-50/60 border-t border-gray-100 text-[11px] text-gray-500">
            Selected domains determine which lab modules and use-case challenges you tackle.
          </div>
        </Card>

        {/* Technical Strengths & Skills */}
        <Card className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-deep-50 border border-deep-100 flex items-center justify-center text-deep-600 shrink-0">
                  <Layers size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">3. Skills & Competencies</h3>
                  <p className="text-xs text-gray-500">Tag competencies you bring to your squad</p>
                </div>
              </div>
              <Badge
                variant={selectedSkills.length > 0 ? 'secondary' : 'outline'}
                className="text-[11px] font-medium border-gray-200"
              >
                {selectedSkills.length} selected
              </Badge>
            </div>

            <CardContent className="p-5">
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((skill) => {
                  const isSelected = selectedSkills.includes(skill)
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'border-deep-600 bg-deep-50 text-deep-800 shadow-2xs'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 ${
                          isSelected
                            ? 'border-deep-600 bg-deep-600 text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check size={9} strokeWidth={3} />}
                      </div>
                      <span>{skill}</span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </div>

          <div className="px-5 py-3 bg-gray-50/60 border-t border-gray-100 text-[11px] text-gray-500">
            Skills are matched against sprint challenge requirements to ensure balanced teams.
          </div>
        </Card>
      </div>

      {/* Section 4: Experience & Career Notes */}
      <Card className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-deep-50 border border-deep-100 flex items-center justify-center text-deep-600 shrink-0">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 leading-tight">4. Background & Career Goals</h3>
              <p className="text-xs text-gray-500">Share your prior software or banking experience and career aspirations</p>
            </div>
          </div>
        </div>

        <CardContent className="p-5 space-y-3">
          <Textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tell us about your technical background, programming languages you're comfortable with, and specific fintech areas you want to master during this fellowship..."
            className="w-full rounded-lg border border-gray-200 p-3 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-deep-600"
          />
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>{notes.length} characters</span>
            <span>Reviewed by faculty advisors during squad allocation</span>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Save Bar */}
      <Card className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden">
        <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-gray-900">Ready to update your matching profile?</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              You can return to update your role preference or skill tags at any point during your fellowship.
            </p>
          </div>

          <Button
            onClick={save}
            disabled={saving}
            className="w-full sm:w-auto bg-deep-600 text-white hover:bg-deep-700 font-semibold px-6 text-xs h-9"
          >
            <Save size={14} className="mr-1.5" />
            {saving ? 'Saving Profile...' : 'Save Skills Profile'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

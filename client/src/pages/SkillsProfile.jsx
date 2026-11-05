import { useEffect, useState } from 'react'
import { Award, CheckCircle, Save, Users, ArrowRight, Clock } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { supabase } from '../lib/supabase'
import { getCurrentProfile } from '../lib/profile'

const roles = ['Project Manager', 'Field Lead', 'UAT', 'Technical Specialist', 'Not Sure Yet']
const domains = ['FaaS', 'FinCore', 'FinOps', 'FinInfra']
const skills = ['API Design', 'Ledger Engineering', 'CI/CD', 'Reconciliation', 'Reporting', 'Cloud Platforms', 'Project Management', 'Stakeholder Communication', 'UAT', 'Team Leadership']

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

  const completion = Math.min(100, (role ? 40 : 0) + (selectedDomains.length ? 30 : 0) + (selectedSkills.length ? 20 : 0))

  useEffect(() => {
    const load = async () => {
      try {
        const current = await getCurrentProfile()
        if (!current) throw new Error('You must be signed in')
        const { data, error: loadError } = await supabase.from('skills_profiles').select('*').eq('user_id', current.id).maybeSingle()
        if (loadError) throw loadError
        setProfile(current)
        if (data) { setRole(data.role_preference || ''); setSelectedDomains(data.domains || []); setSelectedSkills(data.skills?.selected || []); setNotes(data.notes || '') }
      } catch (loadError) { setError(loadError.message || 'Unable to load skills profile') } finally { setLoading(false) }
    }
    load()
  }, [])

  const save = async () => {
    if (!profile || !role || selectedDomains.length === 0) { setError('Choose a role and at least one domain'); return }
    setSaving(true); setError(''); setMessage('')
    const { error: saveError } = await supabase.from('skills_profiles').upsert({ user_id: profile.id, role_preference: role, domains: selectedDomains, skills: { selected: selectedSkills }, notes: notes.trim() || null, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (saveError) setError(saveError.message)
    else { setMessage('Skills profile saved for placement matching.'); setSaving(false); setTimeout(() => setMessage(''), 3000) }
    setSaving(false)
  }

  const toggle = (items, value, setter, limit) => setter(items.includes(value) ? items.filter((item) => item !== value) : items.length < limit ? [...items, value] : items)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-deep-600">Skills Profile</h1>
            <p className="text-sm text-gray-500">Keep your role preferences and skills current for project matching.</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-deep-600 uppercase tracking-wider">Profile Completion</span>
            <span className="text-xs text-gray-500 ml-auto">{completion}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${completion < 100 ? 'bg-brand-600' : 'bg-emerald-600'}`} style={{ width: `${completion}%` }} />
          </div>
        </div>
      </div>

      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}

      {loading ? (
        <div className="py-10 text-center text-sm text-gray-500">Loading profile...</div>
      ) : (
        <div className="max-w-5xl space-y-6">
          {/* Section 1: Role Selection */}
          <Card className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden">
            <CardHeader className="flex items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-deep-100 flex items-center justify-center text-xs font-bold text-deep-600 shrink-0">
                  <Award size={14} />
                </span>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-bold text-deep-600">Preferred Role</CardTitle>
                  <CardDescription className="text-[10px] text-gray-500">Choose your target role for project matching</CardDescription>
                </div>
              </div>
              <Badge className={`text-[11px] font-bold text-deep-600 bg-deep-50 border border-deep-200 ${role ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : ''}`}>
                {role || 'Not selected'}
              </Badge>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {roles.map((item) => (
                  <Button
                    key={item}
                    variant={role === item ? 'default' : 'outline'}
                    className={`flex flex-col items-center gap-2 text-[11px] ${role === item ? 'bg-deep-600 text-white border-deep-600' : 'border-gray-200 text-gray-600 hover:bg-deep-50 hover:text-deep-600'}`}
                    onClick={() => setRole(item)}
                  >
                    <CheckCircle size={14} className={role === item ? 'text-white' : 'text-deep-600 opacity-50'} />
                    {item}
                  </Button>
                ))}
              </div>
              {!role && <p className="mt-2 text-[10px] text-red-600">Please select a role</p>}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section 2: Domain Interests */}
            <Card className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden">
              <CardHeader className="flex items-center justify-between py-4">
                <div className="flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-deep-600 shrink-0">
                    <Users size={14} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-bold text-deep-600">Domain Interests</CardTitle>
                    <CardDescription className="text-[10px] text-gray-500">Select up to two domain tracks</CardDescription>
                  </div>
                </div>
                <Badge className={`text-[11px] font-bold ${selectedDomains.length >= 2 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-deep-600 bg-deep-50 border-deep-200'}`}>
                  {selectedDomains.length} of 2
                </Badge>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {domains.map((item) => {
                    const isSelected = selectedDomains.includes(item)
                    return (
                      <Button
                        key={item}
                        variant={isSelected ? 'default' : 'outline'}
                        className={`flex flex-col items-center gap-2 text-[11px] ${isSelected ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 text-gray-600 hover:bg-brand-50 hover:text-deep-600'}`}
                        onClick={() => toggle(selectedDomains, item, setSelectedDomains, 2)}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${isSelected ? 'text-white bg-deep-600' : 'text-gray-400 bg-gray-100'}`}>
                          {isSelected ? '✓' : item.charAt(0)}
                        </div>
                        {item}
                      </Button>
                    )
                  })}
                </div>
                {selectedDomains.length === 0 && <p className="mt-2 text-[10px] text-red-600">Please select at least one domain</p>}
                {selectedDomains.length === 2 && <p className="mt-2 text-[10px] text-emerald-600">Selection complete</p>}
              </CardContent>
            </Card>

            {/* Section 3: Skills */}
            <Card className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden">
              <CardHeader className="flex items-center justify-between py-4">
                <div className="flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600 shrink-0">
                    <Users size={14} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-bold text-deep-600">Skills &amp; Expertise</CardTitle>
                    <CardDescription className="text-[10px] text-gray-500">Select all that apply</CardDescription>
                  </div>
                </div>
                <Badge className={`text-[11px] font-bold ${selectedSkills.length > 0 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-deep-600 bg-deep-50 border-deep-200'}`}>
                  {selectedSkills.length} selected
                </Badge>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {skills.map((item) => {
                    const isSelected = selectedSkills.includes(item)
                    return (
                      <Button
                        key={item}
                        variant={isSelected ? 'default' : 'outline'}
                        className={`flex flex-col items-center gap-2 text-[11px] ${isSelected ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'}`}
                        onClick={() => toggle(selectedSkills, item, setSelectedSkills, skills.length)}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${isSelected ? 'text-white bg-emerald-600' : 'text-gray-400 bg-gray-100'}`}>
                          {isSelected ? '✓' : item.charAt(0)}
                        </div>
                        {item}
                      </Button>
                    )
                  })}
                </div>
                {selectedSkills.length === 0 && <p className="mt-2 text-[10px] text-gray-500">Select skills that match your expertise</p>}
              </CardContent>
            </Card>
          </div>

          {/* Section 4: Career Notes */}
          <Card className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden">
            <CardHeader className="flex items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-600 shrink-0">
                  <Clock size={14} />
                </span>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-bold text-deep-600">Career Notes</CardTitle>
                  <CardDescription className="text-[10px] text-gray-500">Optional — share your goals with the academy team</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <Textarea
                rows={5}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Tell us about your career goals, previous experience, or anything that helps us match you with the right projects..."
                className="w-full rounded-md border-gray-200 bg-white focus-visible:border-deep-500 focus-visible:ring-1 focus-visible:ring-deep-500"
              />
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] text-gray-500">{notes.length} characters</span>
                <span className="text-[10px] text-gray-400">•</span>
                <span className="text-[10px] text-gray-500">Optional</span>
              </div>
            </CardContent>
          </Card>

          {/* Action Bar */}
          <Card className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden">
            <CardContent className="p-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex-1 text-left">
                <p className="text-xs font-bold text-deep-600 uppercase tracking-wider">Ready to apply?</p>
                <p className="text-xs text-gray-500">
                  Your profile will be used for project and squad matching. Update anytime.
                </p>
              </div>
              <Button
                onClick={save}
                disabled={saving || !role || selectedDomains.length === 0}
                className="w-full sm:w-auto bg-deep-600 text-white hover:bg-deep-700 disabled:bg-deep-200 disabled:text-deep-300 font-semibold py-3"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Saving...</span>
                  </div>
                ) : (
                  <>
                    <Save size={14} className="mr-2" />
                    Save Profile &amp; Get Matched
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
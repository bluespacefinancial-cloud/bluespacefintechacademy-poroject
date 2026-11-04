import { useEffect, useState } from 'react'
import { Award, CheckCircle, Save, Users } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
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
    else setMessage('Skills profile saved for placement matching.')
    setSaving(false)
  }

  const toggle = (items, value, setter, limit) => setter(items.includes(value) ? items.filter((item) => item !== value) : items.length < limit ? [...items, value] : items)
  return <div className="min-h-screen bg-gray-50"><div className="mb-6"><h1 className="text-2xl font-bold text-deep-600">Skills Profile</h1><p className="text-sm text-gray-500">Keep your role preferences and skills current for project matching.</p></div>{error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}{loading ? <p className="py-10 text-center text-sm text-gray-500">Loading profile...</p> : <div className="max-w-3xl space-y-6"><Card><CardHeader><CardTitle className="text-sm">Preferred role</CardTitle></CardHeader><CardContent className="grid gap-2 sm:grid-cols-3">{roles.map((item) => <Button key={item} variant={role === item ? 'default' : 'outline'} onClick={() => setRole(item)}><CheckCircle size={14} className="mr-2 opacity-70" />{item}</Button>)}</CardContent></Card><Card><CardHeader><CardTitle className="text-sm">Domain interests (up to two)</CardTitle></CardHeader><CardContent className="grid gap-2 sm:grid-cols-2">{domains.map((item) => <Button key={item} variant={selectedDomains.includes(item) ? 'default' : 'outline'} onClick={() => toggle(selectedDomains, item, setSelectedDomains, 2)}>{item}</Button>)}</CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Users size={15} /> Skills</CardTitle></CardHeader><CardContent className="grid gap-2 sm:grid-cols-2">{skills.map((item) => <Button key={item} variant={selectedSkills.includes(item) ? 'default' : 'outline'} className="justify-start" onClick={() => toggle(selectedSkills, item, setSelectedSkills, skills.length)}>{selectedSkills.includes(item) && <CheckCircle size={14} className="mr-2" />}{item}</Button>)}</CardContent></Card><Card><CardHeader><CardTitle className="text-sm">Additional notes</CardTitle></CardHeader><CardContent><textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} className="w-full rounded-md border p-3 text-sm" placeholder="Availability, preferred project context, or support needs" /></CardContent></Card><Button onClick={save} disabled={saving}><Save size={14} className="mr-2" />{saving ? 'Saving...' : 'Save profile'}</Button><div className="flex items-center gap-2 text-xs text-gray-500"><Award size={14} /> This profile is visible to authorised academy staff for placement matching.</div></div>}</div>
}

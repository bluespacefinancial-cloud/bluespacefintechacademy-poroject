/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { Search, Target } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { supabase } from '../lib/supabase'

const roles = ['Project Manager', 'Field Lead', 'UAT', 'Technical Specialist']
const statuses = ['matched', 'interviewing', 'placed', 'completed']
const emptyForm = { certification_id: '', role: roles[0], project_id: '', start_date: '', status: 'matched' }

export default function Placement() {
  const [placements, setPlacements] = useState([])
  const [certifications, setCertifications] = useState([])
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [{ data, error: placementError }, { data: userRows, error: usersError }, { data: certificationRows, error: certificationError }, { data: cohortRows, error: cohortError }] = await Promise.all([
      supabase.from('placements').select('*').order('created_at', { ascending: false }),
      supabase.from('users').select('id, name, email'),
      supabase.from('certifications').select('id, user_id, track, cohort_id, status').eq('status', 'certified'),
      supabase.from('cohorts').select('id, name'),
    ])
    for (const queryError of [placementError, usersError, certificationError, cohortError]) if (queryError) throw queryError
    const userMap = new Map((userRows || []).map((user) => [user.id, user]))
    const certificationMap = new Map((certificationRows || []).map((certification) => [certification.id, certification]))
    const cohortMap = new Map((cohortRows || []).map((cohort) => [cohort.id, cohort.name]))
    setUsers(userRows || []); setCertifications(certificationRows || [])
    setPlacements((data || []).map((placement) => {
      const certification = certificationMap.get(placement.certification_id)
      return { ...placement, fellow: userMap.get(placement.user_id), certification, cohortName: cohortMap.get(certification?.cohort_id) || 'Unknown cohort' }
    }))
  }

  useEffect(() => { load().catch((loadError) => setError(loadError.message || 'Unable to load placements')).finally(() => setLoading(false)) }, [])

  const createPlacement = async (event) => {
    event.preventDefault(); setError('')
    const certification = certifications.find((item) => String(item.id) === form.certification_id)
    if (!certification) { setError('Select a certified fellow'); return }
    const { error: createError } = await supabase.from('placements').insert({
      certification_id: certification.id, user_id: certification.user_id, role: form.role,
      project_id: form.project_id.trim() || null, start_date: form.start_date || null, status: form.status,
    })
    if (createError) { setError(createError.message); return }
    setForm(emptyForm); setShowCreate(false); await load()
  }

  const updatePlacement = async (id, field, value) => {
    const { error: updateError } = await supabase.from('placements').update({ [field]: value || null, updated_at: new Date().toISOString() }).eq('id', id)
    if (updateError) { setError(updateError.message); return }
    setPlacements((current) => current.map((placement) => placement.id === id ? { ...placement, [field]: value } : placement))
  }

  const availableCertifications = certifications.filter((certification) => !placements.some((placement) => placement.certification_id === certification.id))
  const filtered = useMemo(() => placements.filter((placement) => (!search || `${placement.fellow?.name || ''} ${placement.fellow?.email || ''} ${placement.role}`.toLowerCase().includes(search.toLowerCase())) && (filterStatus === 'all' || placement.status === filterStatus)), [placements, search, filterStatus])
  const placed = placements.filter((placement) => placement.status === 'placed').length

  return <div className="min-h-screen bg-gray-50"><div className="mb-6 flex items-center justify-between"><div><h1 className="text-2xl font-bold text-deep-600">Placement</h1><p className="text-sm text-gray-500">Track certified fellows through placement and follow-up.</p></div><Button onClick={() => setShowCreate((visible) => !visible)}><Target size={16} className="mr-2" />New placement</Button></div>{error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {showCreate && <Card className="mb-6"><CardHeader><CardTitle className="text-sm">Create placement</CardTitle></CardHeader><CardContent><form onSubmit={createPlacement} className="grid gap-3 md:grid-cols-5"><Select value={form.certification_id} onValueChange={(value) => setForm({ ...form, certification_id: value })}><SelectTrigger><SelectValue placeholder="Certified fellow" /></SelectTrigger><SelectContent>{availableCertifications.map((certification) => <SelectItem key={certification.id} value={String(certification.id)}>{users.find((user) => user.id === certification.user_id)?.name || 'Fellow'} · {certification.track}</SelectItem>)}</SelectContent></Select><select className="rounded border p-2 text-sm" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>{roles.map((role) => <option key={role}>{role}</option>)}</select><Input placeholder="Project or team" value={form.project_id} onChange={(event) => setForm({ ...form, project_id: event.target.value })} /><Input type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} /><Button type="submit">Create</Button></form></CardContent></Card>}
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3"><Card><CardContent className="p-4"><p className="text-2xl font-bold">{placements.length}</p><p className="text-xs uppercase text-gray-500">Placements</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-2xl font-bold">{placed}</p><p className="text-xs uppercase text-gray-500">Placed</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-2xl font-bold">{placements.filter((placement) => placement.checkin_30_days).length}</p><p className="text-xs uppercase text-gray-500">30-day check-ins</p></CardContent></Card></div>
    <div className="mb-5 flex gap-3"><div className="relative flex-1"><Search size={15} className="absolute left-3 top-2.5 text-gray-400" /><Input className="pl-9" placeholder="Search fellows or roles" value={search} onChange={(event) => setSearch(event.target.value)} /></div><Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-44"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div>
    {loading && <p className="py-10 text-center text-sm text-gray-500">Loading placements...</p>}{!loading && filtered.length === 0 && <p className="py-10 text-center text-sm text-gray-500">No placement records found.</p>}<div className="space-y-3">{filtered.map((placement) => <Card key={placement.id}><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-sm">{placement.fellow?.name || placement.fellow?.email || 'Unknown fellow'}</CardTitle><p className="text-xs text-gray-500">{placement.role} · {placement.cohortName}</p></div><Badge variant="outline">{placement.status}</Badge></CardHeader><CardContent className="grid gap-3 text-xs md:grid-cols-4"><label>Project<input className="mt-1 w-full rounded border p-2" value={placement.project_id || ''} onChange={(event) => setPlacements((current) => current.map((item) => item.id === placement.id ? { ...item, project_id: event.target.value } : item))} onBlur={(event) => updatePlacement(placement.id, 'project_id', event.target.value)} /></label><label>Role<select className="mt-1 w-full rounded border p-2" value={placement.role} onChange={(event) => updatePlacement(placement.id, 'role', event.target.value)}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label><label>Status<select className="mt-1 w-full rounded border p-2" value={placement.status} onChange={(event) => updatePlacement(placement.id, 'status', event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><div><span className="block">Start date</span><span className="mt-2 block">{placement.start_date || 'Not set'}</span></div></CardContent></Card>)}</div>
  </div>
}

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { Calendar, Clock, ExternalLink, Plus, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { supabase } from '../lib/supabase'
import { getCurrentProfile } from '../lib/profile'

const emptyForm = { title: '', cohort_id: '', starts_at: '', ends_at: '', meet_url: '', capacity: 15 }

export default function MentorClinics() {
  const [clinics, setClinics] = useState([])
  const [cohorts, setCohorts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const [{ data, error: clinicError }, { data: cohortRows, error: cohortError }] = await Promise.all([
      supabase.from('clinics').select('*, clinic_bookings(user_id, status)').order('starts_at'),
      supabase.from('cohorts').select('id, name').order('start_date'),
    ])
    if (clinicError) throw clinicError
    if (cohortError) throw cohortError
    setClinics(data || []); setCohorts(cohortRows || [])
  }
  useEffect(() => { load().catch((loadError) => setError(loadError.message || 'Unable to load clinics')).finally(() => setLoading(false)) }, [])

  const schedule = async (event) => {
    event.preventDefault(); setSaving(true); setError('')
    try {
      const profile = await getCurrentProfile()
      const { error: createError } = await supabase.from('clinics').insert({ ...form, cohort_id: Number(form.cohort_id), mentor_id: profile.id, created_by: profile.id, capacity: Number(form.capacity) })
      if (createError) throw createError
      setForm(emptyForm); setShowForm(false); await load()
    } catch (saveError) { setError(saveError.message || 'Unable to schedule clinic') } finally { setSaving(false) }
  }

  const book = async (clinicId) => {
    try {
      const profile = await getCurrentProfile()
      const { error: bookingError } = await supabase.from('clinic_bookings').upsert({ clinic_id: clinicId, user_id: profile.id, status: 'booked' }, { onConflict: 'clinic_id,user_id' })
      if (bookingError) throw bookingError
      await load()
    } catch (bookingError) { setError(bookingError.message || 'Unable to book clinic') }
  }

  return <div className="min-h-screen bg-gray-50"><div className="mb-6 flex items-start justify-between gap-4"><div><h1 className="text-2xl font-bold text-deep-600">Mentor Clinics</h1><p className="text-sm text-gray-500">Schedule and attend mentor office hours for fellows.</p></div><Button onClick={() => setShowForm((visible) => !visible)}><Plus size={15} className="mr-2" />Schedule clinic</Button></div>{error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}{showForm && <Card className="mb-6"><CardHeader><CardTitle className="text-sm">New clinic</CardTitle></CardHeader><CardContent><form onSubmit={schedule} className="grid gap-3 md:grid-cols-2"><Input placeholder="Clinic title" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /><select className="rounded border p-2 text-sm" required value={form.cohort_id} onChange={(event) => setForm({ ...form, cohort_id: event.target.value })}><option value="">Select cohort</option>{cohorts.map((cohort) => <option key={cohort.id} value={cohort.id}>{cohort.name}</option>)}</select><Input type="datetime-local" required value={form.starts_at} onChange={(event) => setForm({ ...form, starts_at: event.target.value })} /><Input type="datetime-local" required value={form.ends_at} onChange={(event) => setForm({ ...form, ends_at: event.target.value })} /><Input type="url" placeholder="Google Meet URL" value={form.meet_url} onChange={(event) => setForm({ ...form, meet_url: event.target.value })} /><Input type="number" min="1" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} /><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Schedule'}</Button></form></CardContent></Card>}<Card><CardHeader><CardTitle className="text-sm">Upcoming and recent clinics</CardTitle></CardHeader><CardContent className="space-y-3">{loading && <p className="text-sm text-gray-500">Loading clinics...</p>}{!loading && clinics.length === 0 && <p className="py-8 text-center text-sm text-gray-500">No clinics scheduled.</p>}{clinics.map((clinic) => { const bookings = clinic.clinic_bookings || []; return <div key={clinic.id} className="flex flex-col gap-3 rounded border p-4 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-2"><Calendar size={14} className="text-brand-600" /><p className="text-sm font-semibold">{clinic.title}</p><Badge variant="outline">{clinic.status}</Badge></div><p className="mt-1 text-xs text-gray-500"><Clock size={12} className="mr-1 inline" />{new Date(clinic.starts_at).toLocaleString()} · {bookings.length}/{clinic.capacity} booked</p></div><div className="flex gap-2">{clinic.meet_url && <a className="inline-flex items-center text-xs text-brand-700 hover:underline" href={clinic.meet_url} target="_blank" rel="noreferrer">Meet <ExternalLink size={12} className="ml-1" /></a>}<Button size="sm" variant="outline" onClick={() => book(clinic.id)}><Users size={12} className="mr-1" />Book</Button></div></div> })}</CardContent></Card></div>
}

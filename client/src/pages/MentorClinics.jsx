import { useCallback, useEffect, useState } from 'react'
import { Calendar, Clock, ExternalLink, Plus, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { supabase } from '../lib/supabase'

const emptyForm = { title: '', cohort_id: '', starts_at: '', ends_at: '', meet_url: '', capacity: '15' }

export default function MentorClinics() {
  const { user } = useAuth()
  const [clinics, setClinics] = useState([])
  const [cohorts, setCohorts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadData = useCallback(async () => {
    setError('')
    const [clinicResult, cohortResult] = await Promise.all([
      supabase.from('clinics').select('id, title, cohort_id, mentor_id, starts_at, ends_at, meet_url, capacity, status, attendee_count, cohorts(name)').order('starts_at'),
      supabase.from('cohorts').select('id, name').order('start_date', { ascending: true }),
    ])
    if (clinicResult.error) throw clinicResult.error
    if (cohortResult.error) throw cohortResult.error
    setClinics(clinicResult.data || [])
    setCohorts(cohortResult.data || [])
  }, [])

  useEffect(() => {
    let mounted = true
    Promise.resolve().then(loadData).catch((loadError) => mounted && setError(loadError.message || 'Unable to load clinic information.')).finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [loadData])

  async function scheduleClinic(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      if (!user?.id) throw new Error('Your academy profile is unavailable. Sign in again.')
      if (!form.cohort_id) throw new Error('Choose a cohort for this clinic.')
      if (new Date(form.ends_at) <= new Date(form.starts_at)) throw new Error('The end time must be after the start time.')
      const { error: insertError } = await supabase.from('clinics').insert({
        title: form.title.trim(),
        cohort_id: Number(form.cohort_id),
        mentor_id: user.id,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
        meet_url: form.meet_url.trim() || null,
        capacity: Math.max(1, Number(form.capacity) || 15),
      })
      if (insertError) throw insertError
      setForm(emptyForm)
      setShowForm(false)
      setMessage('Clinic scheduled.')
      await loadData()
    } catch (saveError) {
      setError(saveError.message || 'Unable to schedule this clinic.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="min-h-screen bg-gray-50">
    <div className="mb-6 flex items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-deep-600">Mentor Clinics</h1><p className="mt-1 text-sm text-gray-500">Schedule and manage office hours for your cohorts.</p></div>
      <Button onClick={() => setShowForm((open) => !open)}><Plus size={15} className="mr-2" />{showForm ? 'Close form' : 'Schedule clinic'}</Button>
    </div>
    {error && <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
    {showForm && <Card className="mb-6"><CardHeader><CardTitle className="text-sm">New clinic</CardTitle></CardHeader><CardContent>
      <form onSubmit={scheduleClinic} className="grid gap-3 md:grid-cols-2">
        <Input required maxLength={200} placeholder="Clinic title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        <Select required value={form.cohort_id} onValueChange={(cohort_id) => setForm({ ...form, cohort_id })}><SelectTrigger><SelectValue placeholder="Choose a cohort" /></SelectTrigger><SelectContent>{cohorts.map((cohort) => <SelectItem key={cohort.id} value={String(cohort.id)}>{cohort.name}</SelectItem>)}</SelectContent></Select>
        <label className="space-y-1 text-xs text-gray-600">Starts at<Input required type="datetime-local" value={form.starts_at} onChange={(event) => setForm({ ...form, starts_at: event.target.value })} /></label>
        <label className="space-y-1 text-xs text-gray-600">Ends at<Input required type="datetime-local" value={form.ends_at} onChange={(event) => setForm({ ...form, ends_at: event.target.value })} /></label>
        <Input type="url" placeholder="Google Meet link (optional)" value={form.meet_url} onChange={(event) => setForm({ ...form, meet_url: event.target.value })} />
        <Input type="number" min="1" max="500" required aria-label="Clinic capacity" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} />
        <div className="md:col-span-2"><Button type="submit" disabled={saving || !cohorts.length}>{saving ? 'Scheduling…' : 'Save clinic'}</Button></div>
      </form>
    </CardContent></Card>}
    <Card><CardHeader><CardTitle className="text-sm">Scheduled clinics</CardTitle></CardHeader><CardContent className="space-y-3">
      {loading ? <p className="text-sm text-gray-500">Loading clinics…</p> : clinics.length === 0 ? <p className="py-8 text-center text-sm text-gray-500">No clinics have been scheduled.</p> : clinics.map((clinic) => <article key={clinic.id} className="flex flex-col gap-3 rounded-md border border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="flex items-center gap-2"><h2 className="text-sm font-semibold text-deep-600">{clinic.title}</h2><Badge variant={clinic.status === 'scheduled' ? 'default' : 'outline'}>{clinic.status}</Badge></div><p className="mt-1 text-xs text-gray-500">{clinic.cohorts?.name || 'All cohorts'}</p><div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-600"><span className="inline-flex items-center gap-1"><Calendar size={13} />{new Date(clinic.starts_at).toLocaleDateString()}</span><span className="inline-flex items-center gap-1"><Clock size={13} />{new Date(clinic.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}–{new Date(clinic.ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><span className="inline-flex items-center gap-1"><Users size={13} />{clinic.attendee_count}/{clinic.capacity}</span></div></div>
        {clinic.meet_url && <a className="inline-flex items-center text-sm text-brand-700 hover:underline" href={clinic.meet_url} target="_blank" rel="noreferrer">Open meeting <ExternalLink size={13} className="ml-1" /></a>}
      </article>)}
    </CardContent></Card>
  </div>
}

import { useEffect, useState } from 'react'
import { Calendar, Clock, ExternalLink, Plus, Video } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { getCurrentProfile } from '../lib/profile'

const EMPTY_FORM = {
  title: '',
  cohort_id: '',
  starts_at: '',
  ends_at: '',
  meet_url: '',
  visibility: 'cohort',
}

export default function LiveClasses() {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [cohorts, setCohorts] = useState([])

  const canManage = ['Instructor', 'Administrator'].includes(user?.type)

  const loadClasses = async () => {
    const { data, error: loadError } = await supabase
      .from('live_classes')
      .select('id, title, starts_at, ends_at, visibility, status, meet_url')
      .order('starts_at', { ascending: true })

    if (loadError) throw loadError
    setClasses(data || [])
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        await loadClasses()
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Unable to load live classes')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const handleCreate = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
        const profile = await getCurrentProfile()
        if (!profile) throw new Error('You must be signed in to schedule a class')

      const { error: createError } = await supabase.from('live_classes').insert({
        ...form,
        cohort_id: form.cohort_id ? Number(form.cohort_id) : null,
        instructor_id: profile.id,
        created_by: profile.id,
      })

      if (createError) throw createError
      setForm(EMPTY_FORM)
      setShowForm(false)
      await loadClasses()
    } catch (createError) {
      setError(createError.message || 'Unable to schedule the class')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    supabase.from('cohorts').select('id, name').order('start_date').then(({ data, error: cohortError }) => {
      if (cohortError) setError(cohortError.message)
      setCohorts(data || [])
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-deep-600">Live Classes</h1>
          <p className="text-sm text-gray-500">Schedule Google Meet sessions and share them with the right cohort.</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowForm((visible) => !visible)}>
            <Plus size={16} className="mr-2" />
            Schedule class
          </Button>
        )}
      </div>

      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-sm">New live class</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Class title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <select className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" value={form.cohort_id} onChange={(e) => setForm({ ...form, cohort_id: e.target.value })} required>
                <option value="">Select cohort</option>
                {cohorts.map((cohort) => <option key={cohort.id} value={cohort.id}>{cohort.name}</option>)}
              </select>
              <Input placeholder="Google Meet URL (optional until connected)" value={form.meet_url} onChange={(e) => setForm({ ...form, meet_url: e.target.value })} type="url" />
              <Input value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} type="datetime-local" required />
              <Input value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} type="datetime-local" required />
              <select className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
                <option value="cohort">Cohort only</option>
                <option value="private">Private</option>
              </select>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save class'}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Upcoming and recent classes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-gray-500">Loading classes...</p>}
          {!loading && classes.length === 0 && <p className="py-8 text-center text-sm text-gray-400">No live classes scheduled yet.</p>}
          {classes.map((liveClass) => (
            <div key={liveClass.id} className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-white p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Video size={15} className="text-brand-600" />
                  <p className="text-sm font-semibold text-deep-600">{liveClass.title}</p>
                  <Badge variant="outline">{liveClass.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                  <span><Calendar size={12} className="mr-1 inline" />{new Date(liveClass.starts_at).toLocaleString()}</span>
                  <span><Clock size={12} className="mr-1 inline" />{liveClass.visibility === 'cohort' ? 'Cohort class' : 'Private class'}</span>
                </div>
              </div>
              {liveClass.meet_url && <a className="inline-flex items-center text-sm font-medium text-brand-700 hover:underline" href={liveClass.meet_url} target="_blank" rel="noreferrer">Open Meet <ExternalLink size={14} className="ml-1" /></a>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Calendar, Clock, Users, AlertCircle } from 'lucide.react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '../components/ui/select'
import { supabase } from '../lib/supabase'

const emptyForm = { title: '', cohort_id: '', starts_at: '', ends_at: '', meet_url: '', capacity: 15 }

export default function MentorClinics() {
  const [clinics, setClinics] = useState([])
  const [cohorts, setCohorts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadClinics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from('clinics')
        .select('*, mentors(name), cohorts(name)')
        .order('starts_at', { ascending: true })
      if (error) throw error
      setClinics(data || [])
    } catch (err) {
      setError(err.message || 'Unable to load clinics')
    } finally {
      setLoading(false)
    }
  }

  const loadCohorts = async () => {
    try {
      const { data, error } = await supabase.from('cohorts').select('id, name').order('start_date', { ascending: true })
      if (error) throw error
      setCohorts(data || [])
    } catch (err) {
      console.error('Error loading cohorts:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase
        .from('clinics')
        .insert({
          title: form.title,
          cohort_id: form.cohort_id,
          mentor_id: user.id,
          starts_at: form.starts_at,
          ends_at: form.ends_at,
          meet_url: form.meet_url,
          capacity: parseInt(form.capacity, 10),
        })
      if (error) throw error
      setForm(emptyForm)
      setShowForm(false)
      await loadClinics()
    } catch (err) {
      setError(err.message || 'Unable to schedule clinic')
    } finally {
      setSaving(false)
    }
  }

  const loadCohortsData = async () => {
    try {
      const { data, error } = await supabase.from('cohorts').select('id, name').order('start_date', { ascending: true })
      if (error) throw error
      setCohorts(data || [])
    } catch (err) {
      console.error('Error loading cohorts:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading clinics...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-deep-600 mb-1">Mentor Clinics</h1>
            <p className="text-sm text-gray-500">Schedule and attend mentor office hours for fellows.</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus size={14} className="mr-2" />
            Schedule clinic
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-bold">New Clinic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-500">Clinic Title</label>
                <Input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Clinic title" required />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-500">Cohort</label>
                <Select value={form.cohort_id} onValueChange={(v) => setForm({ ...form, cohort_id: v.value })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select cohort" />
                  </SelectTrigger>
                  <SelectContent>
                    {cohorts.map((cohort) => (
                      <SelectItem key={cohort.id} value={cohort.id}>{cohort.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-500">Start Date & Time</label>
                <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-500">End Date & Time</label>
                <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-500">Google Meet URL</label>
                <Input type="url" value={form.meet_url} onChange={(e) => setForm({ ...form, meet_url: e.target.value })} placeholder="https://meet.google.com/..." />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-500">Capacity</span>
                <Input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value, 10) || 1 })} placeholder="15" />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? 'Saving...' : 'Schedule Clinic'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      <div className="space-y-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Calendar size={14} className="mr-1.5" /> Upcoming Clinics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-400">
                <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-500 mt-2">Loading clinics...</p>
              </div>
            ) : clinics.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No upcoming clinics</p>
              </div>
            ) : (
              clinics.map((clinic) => (
                <Card key={clinic.id} className="p-3 border border-gray-100 bg-white hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-deep-600">{clinic.title}</p>
                      <p className="text-[10px] text-gray-500">{clinic.cohorts?.name || 'Unknown Cohort'} · {clinic.mentor_name || 'Mentor'}</p>
                    </div>
                    <Badge variant="default">{clinic.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} className="mr-0.5" />
                      <span>{new Date(clinic.starts_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="mr-0.5" />
                      <span>{new Date(clinic.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={12} className="mr-0.5" />
                      <span>{clinic.attendee_count || 0}/{clinic.capacity}</span>
                    </div>
                  </div>
                </Card>
              ))}
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { Calendar, Clock, ExternalLink, Plus, Users, Video, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { supabase } from '../lib/supabase'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import { getCurrentProfile } from '../lib/profile'

const emptyForm = { title: '', cohort_id: '', starts_at: '', ends_at: '', meet_url: '', capacity: '15' }

export default function MentorClinics() {
  const { user } = useAuth()
  const isStudent = user?.type === 'Student'
  const canManage = ['Instructor', 'Administrator'].includes(user?.type)

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
    try {
      const profile = await getCurrentProfile()
      if (!profile) return

      let clinicQuery = supabase
        .from('clinics')
        .select(`
          id, title, cohort_id, mentor_id, starts_at, ends_at, meet_url, capacity, status, attendee_count,
          cohorts(name)
        `)
        .order('starts_at', { ascending: true })

      if (isStudent) {
        // Find student's cohort
        const { data: enrolment } = await supabase
          .from('enrolments')
          .select('cohort_id')
          .eq('user_id', profile.id)
          .in('status', ['enrolled', 'active'])
          .maybeSingle()

        if (enrolment?.cohort_id) {
          clinicQuery = clinicQuery.eq('cohort_id', enrolment.cohort_id)
        }
      }

      const [clinicResult, cohortResult] = await Promise.all([
        clinicQuery,
        canManage
          ? supabase.from('cohorts').select('id, name').order('start_date', { ascending: true })
          : Promise.resolve({ data: [], error: null }),
      ])

      if (clinicResult.error) throw clinicResult.error
      if (cohortResult.error) throw cohortResult.error

      setClinics(clinicResult.data || [])
      setCohorts(cohortResult.data || [])
    } catch (err) {
      setError(err.message || 'Unable to load clinic information.')
    } finally {
      setLoading(false)
    }
  }, [isStudent, canManage])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function scheduleClinic(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      if (!user?.id) throw new Error('Your profile is unavailable. Sign in again.')
      if (!form.cohort_id) throw new Error('Choose a cohort for this clinic.')
      if (new Date(form.ends_at) <= new Date(form.starts_at)) {
        throw new Error('End time must be after the start time.')
      }

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
      setMessage('Clinic office hours scheduled.')
      await loadData()
    } catch (saveError) {
      setError(saveError.message || 'Unable to schedule this clinic.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      <DashboardHeader
        title="Mentor Clinics & Office Hours"
        subtitle={
          isStudent
            ? 'Join scheduled faculty office hours, get 1-on-1 code reviews, and resolve lab blockers.'
            : 'Schedule and host cohort office hours, code triage clinics, and 1-on-1 consultations.'
        }
        actions={
          canManage && (
            <Button
              size="sm"
              onClick={() => setShowForm((open) => !open)}
              className="bg-deep-600 text-white hover:bg-deep-700 text-xs font-semibold"
            >
              <Plus size={14} className="mr-1.5" />
              {showForm ? 'Cancel' : 'Schedule Clinic'}
            </Button>
          )
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
          <p className="font-semibold">Success</p>
          <p className="mt-0.5">{message}</p>
        </div>
      )}

      {canManage && showForm && (
        <Card className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Schedule New Clinic</h3>
            <p className="text-xs text-gray-500">Open an office hours session for fellows in your cohort</p>
          </div>
          <CardContent className="p-5">
            <form onSubmit={scheduleClinic} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Clinic Title</label>
                <Input
                  required
                  maxLength={200}
                  placeholder="e.g. ISO 8583 Parsing Q&A or Sprint Debugging"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Assigned Cohort</label>
                <Select
                  required
                  value={form.cohort_id}
                  onValueChange={(cohort_id) => setForm({ ...form, cohort_id })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select target cohort" />
                  </SelectTrigger>
                  <SelectContent>
                    {cohorts.map((cohort) => (
                      <SelectItem key={cohort.id} value={String(cohort.id)} className="text-xs">
                        {cohort.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Start Time</label>
                <Input
                  required
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">End Time</label>
                <Input
                  required
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Meeting URL (Google Meet / Zoom)</label>
                <Input
                  type="url"
                  placeholder="https://meet.google.com/xyz-abcd-efg"
                  value={form.meet_url}
                  onChange={(e) => setForm({ ...form, meet_url: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Attendee Capacity</label>
                <Input
                  type="number"
                  min="1"
                  max="500"
                  required
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="md:col-span-2 pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                  className="text-xs border-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving || !cohorts.length}
                  className="bg-deep-600 text-white hover:bg-deep-700 text-xs font-semibold"
                >
                  {saving ? 'Scheduling...' : 'Save Clinic Slot'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Clinics Schedule Card */}
      <Card className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900 leading-tight">Clinic Schedule</h3>
            <p className="mt-0.5 text-xs text-gray-500">Upcoming mentor office hours and consultations</p>
          </div>
          <Badge variant="outline" className="text-xs font-medium border-gray-200">
            {clinics.length} Available
          </Badge>
        </div>

        <CardContent className="p-5">
          {loading ? (
            <p className="py-12 text-center text-xs text-gray-500">Loading clinic schedule...</p>
          ) : clinics.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500 space-y-2">
              <Calendar size={28} className="mx-auto text-gray-300 mb-1" />
              <p className="font-semibold text-gray-800">No clinics currently scheduled</p>
              <p className="text-gray-400 max-w-sm mx-auto">
                {isStudent
                  ? 'Your cohort instructors will publish clinic hours ahead of weekly milestone submissions.'
                  : 'Click "Schedule Clinic" above to create an office hours session for your fellows.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {clinics.map((clinic) => {
                const startsAt = new Date(clinic.starts_at)
                const endsAt = new Date(clinic.ends_at)
                const isScheduled = clinic.status === 'scheduled'

                return (
                  <div
                    key={clinic.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 truncate">{clinic.title}</span>
                        <Badge
                          variant={isScheduled ? 'default' : 'outline'}
                          className="text-[10px] font-medium capitalize shrink-0"
                        >
                          {clinic.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-gray-500 mt-0.5">
                        {clinic.cohorts?.name || 'All Assigned Cohorts'}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1.5 font-medium text-gray-800">
                          <Calendar size={13} className="text-deep-600 shrink-0" />
                          {startsAt.toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-500">
                          <Clock size={13} className="text-deep-600 shrink-0" />
                          {startsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {endsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-500">
                          <Users size={13} className="text-deep-600 shrink-0" />
                          {clinic.attendee_count || 0}/{clinic.capacity} Attendees
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {clinic.meet_url ? (
                        <Button
                          asChild
                          size="sm"
                          className="bg-deep-600 text-white hover:bg-deep-700 text-xs font-semibold"
                        >
                          <a href={clinic.meet_url} target="_blank" rel="noreferrer">
                            <Video size={13} className="mr-1.5" />
                            Join Clinic Session
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No link attached</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Calendar, ExternalLink, Plus, Video, Users, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { VideoPlayer } from '../components/VideoPlayer'
import { getCurrentProfile } from '../lib/profile'

const EMPTY_FORM = {
  title: '',
  cohort_id: '',
  starts_at: '',
  ends_at: '',
  meet_url: '',
  visibility: 'cohort',
  is_offline: false,
  venue: '',
}

const STATUS_COLORS = {
  scheduled: 'bg-gray-50 text-gray-600',
  live: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  completed: 'bg-slate-50 text-slate-600 border-slate-100',
  cancelled: 'bg-red-50 text-red-700 border-red-100',
}

const STATUS_LABELS = {
  scheduled: 'Scheduled',
  live: 'Live Now',
  completed: 'Completed',
  cancelled: 'Cancelled',
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
  const [selectedClass, setSelectedClass] = useState(null)
  const [attendance, setAttendance] = useState({})

  const canManage = ['Instructor', 'Administrator'].includes(user?.type)

  const loadClasses = async () => {
    const { data, error: loadError } = await supabase
      .from('live_classes')
      .select('id, title, starts_at, ends_at, visibility, status, meet_url, is_offline, venue')
      .order('starts_at', { ascending: true })

    if (loadError) throw loadError
    setClasses(data || [])
  }

  const loadAttendance = async (classId) => {
    const { data, error } = await supabase
      .from('live_class_attendance')
      .select('user_id, status, joined_at')
      .eq('class_id', classId)

    if (!error) {
      const attendanceMap = {}
      data?.forEach((a) => {
        attendanceMap[a.user_id] = a.status
      })
      setAttendance((prev) => ({ ...prev, [classId]: attendanceMap }))
    }
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

  useEffect(() => {
    supabase.from('cohorts').select('id, name').order('start_date').then(({ data, error: cohortError }) => {
      if (cohortError) setError(cohortError.message)
      setCohorts(data || [])
    })
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

  const markAttendance = async (classId, userId, status) => {
    try {
      const { error } = await supabase.from('live_class_attendance').upsert({
        class_id: classId,
        user_id: userId,
        status: status,
        joined_at: new Date().toISOString(),
      })
      if (error) throw error
      await loadAttendance(classId)
    } catch (err) {
      setError(err.message || 'Unable to mark attendance')
    }
  }

  const openVideoPlayer = (liveClass) => {
    setSelectedClass(liveClass)
    loadAttendance(liveClass.id)
  }

  const closeVideoPlayer = () => {
    setSelectedClass(null)
  }

  if (selectedClass) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <button
                onClick={closeVideoPlayer}
                className="flex items-center gap-2 text-sm font-medium text-deep-600 hover:text-deep-700"
              >
                <RefreshCw size={16} className="rotate-180" />
                Back to classes
              </button>
              <h1 className="ml-4 text-2xl font-bold text-deep-600">{selectedClass.title}</h1>
            </div>
            {canManage && (
              <Button variant="outline" size="sm" onClick={() => loadAttendance(selectedClass.id)}>
                <RefreshCw size={14} className="mr-2" />
                Refresh attendance
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Video Player</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
                    <VideoPlayer
                      src={selectedClass.meet_url || ''}
                      title={selectedClass.title}
                    />
                  </div>
                </CardContent>
              </Card>

              {canManage && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-sm">Attendance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 text-left">
                            <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                            <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                            <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {Object.entries(attendance[selectedClass.id] || {}).map(([userId, status]) => (
                            <tr key={userId} className="hover:bg-gray-50">
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-7 w-7 rounded-full bg-deep-100 flex items-center justify-center text-xs font-bold text-deep-600">
                                    {userId.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-sm text-gray-700">Student {userId.slice(-4)}</span>
                                </div>
                              </td>
                              <td className="py-3">
                                <Badge variant={status === 'attended' ? 'secondary' : 'outline'}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </Badge>
                              </td>
                              <td className="py-3 text-xs text-gray-500">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-3">
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" onClick={() => markAttendance(selectedClass.id, userId, 'attended')}>
                                    Attended
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => markAttendance(selectedClass.id, userId, 'absent')}>
                                    Absent
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {Object.keys(attendance[selectedClass.id] || {}).length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-sm text-gray-400">
                                No attendance records yet. Mark students as they join.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Class Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <Badge className={STATUS_COLORS[selectedClass.status]}>
                      {STATUS_LABELS[selectedClass.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Type</span>
                    <span className="text-sm font-medium text-deep-600">
                      {selectedClass.is_offline ? 'Offline (In-person)' : 'Online'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Starts</span>
                    <span className="text-sm font-medium text-deep-600">
                      {new Date(selectedClass.starts_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ends</span>
                    <span className="text-sm font-medium text-deep-600">
                      {new Date(selectedClass.ends_at).toLocaleString()}
                    </span>
                  </div>
                  {selectedClass.is_offline && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Venue</span>
                      <span className="text-sm font-medium text-deep-600">{selectedClass.venue || 'Not specified'}</span>
                    </div>
                  )}
                  {!selectedClass.is_offline && selectedClass.meet_url && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Meet Link</span>
                      <a
                        href={selectedClass.meet_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-brand-600 hover:underline"
                      >
                        Open Google Meet
                      </a>
                    </div>
                  )}
                  <div className="pt-4">
                    <span className="text-xs font-semibold text-deep-600 uppercase tracking-wider">Attendees</span>
                    <p className="text-lg font-bold text-deep-600">
                      {Object.keys(attendance[selectedClass.id] || {}).length}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-deep-600">Live Classes</h1>
          <p className="text-sm text-gray-500">
            Schedule online and offline classes, share Google Meet links, and track attendance.
          </p>
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
              <Input
                placeholder="Class title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <select
                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                value={form.cohort_id}
                onChange={(e) => setForm({ ...form, cohort_id: e.target.value })}
                required
              >
                <option value="">Select cohort</option>
                {cohorts.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>{cohort.name}</option>
                ))}
              </select>
              <Input
                placeholder="Google Meet URL"
                value={form.meet_url}
                onChange={(e) => setForm({ ...form, meet_url: e.target.value })}
                type="url"
              />
              <Input
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                type="datetime-local"
                required
              />
              <Input
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                type="datetime-local"
                required
              />
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer mr-4">
                  <input
                    type="checkbox"
                    checked={form.is_offline}
                    onChange={(e) => setForm({ ...form, is_offline: e.target.checked })}
                  />
                  Offline class
                </label>
              </div>
              {!form.is_offline ? (
                <select
                  className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  value={form.visibility}
                  onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                >
                  <option value="cohort">Cohort only</option>
                  <option value="private">Private</option>
                </select>
              ) : (
                <Input
                  placeholder="Venue (e.g., Room A, Campus 2)"
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                />
              )}
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save class'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Upcoming and recent classes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-gray-500">Loading classes...</p>}
          {!loading && classes.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">No live classes scheduled yet.</p>
          )}
          {classes.map((liveClass) => (
            <div
              key={liveClass.id}
              className="cursor-pointer hover:bg-brand-50 transition-colors rounded-lg border border-gray-100 bg-white p-4 md:flex-row md:items-center md:justify-between"
              onClick={() => openVideoPlayer(liveClass)}
            >
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Video size={15} className="text-brand-600" />
                  <p className="text-sm font-semibold text-deep-600">{liveClass.title}</p>
                  <Badge variant="outline">{STATUS_LABELS[liveClass.status]}</Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                  <span>
                    <Calendar size={12} className="mr-1 inline" />
                    {new Date(liveClass.starts_at).toLocaleString()}
                  </span>
                  <span>
                    <Users size={12} className="mr-1 inline" />
                    {liveClass.is_offline ? 'Offline' : liveClass.visibility === 'cohort' ? 'Cohort' : 'Private'}
                  </span>
                </div>
              </div>
              {liveClass.meet_url && !liveClass.is_offline && (
                <a className="inline-flex items-center text-sm font-medium text-brand-700 hover:underline" href={liveClass.meet_url} target="_blank" rel="noreferrer">
                  Open Meet <ExternalLink size={14} className="ml-1" />
                </a>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

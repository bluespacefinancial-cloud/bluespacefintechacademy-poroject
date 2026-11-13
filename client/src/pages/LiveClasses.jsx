import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ExternalLink, Plus, Video, Users, RefreshCw, Clock, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/backend'
import { Button } from '../components/ui/button'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { VideoPlayer } from '../components/VideoPlayer'
import { getCurrentProfile } from '../lib/profile'
import LazyMentorClinics from './MentorClinics'

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
  scheduled: 'text-gray-600 border-gray-200',
  live: 'text-emerald-700 border-emerald-200',
  completed: 'text-slate-600 border-slate-200',
  cancelled: 'text-red-700 border-red-200',
}

const STATUS_LABELS = {
  scheduled: 'Scheduled',
  live: 'Live Now',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default function LiveClasses() {
  const { user } = useAuth()
  const isStudent = user?.type === 'Student'
  const [activeTab, setActiveTab] = useState('classes') // 'classes' | 'clinics'
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
    const { data, error: loadError } = await api
      .from('live_classes')
      .select('id, title, starts_at, ends_at, visibility, status, meet_url, is_offline, venue')
      .order('starts_at', { ascending: true })

    if (loadError) throw loadError
    setClasses(data || [])
  }

  const loadAttendance = async (classId) => {
    const { data, error } = await api
      .from('live_class_attendance')
      .select('user_id, status, joined_at')
      .eq('live_class_id', classId)

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
    api.from('cohorts').select('id, name').order('start_date').then(({ data, error: cohortError }) => {
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

      const { error: createError } = await api.from('live_classes').insert({
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
      const { error } = await api.from('live_class_attendance').upsert({
        live_class_id: classId,
        user_id: userId,
        status: status,
        joined_at: new Date().toISOString(),
      }, { onConflict: 'live_class_id,user_id' })
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
    const isRecorded = Boolean(
      selectedClass.recording_url ||
      (selectedClass.meet_url && (
        selectedClass.meet_url.includes('youtube.com') ||
        selectedClass.meet_url.includes('youtu.be') ||
        selectedClass.meet_url.endsWith('.mp4') ||
        selectedClass.meet_url.endsWith('.webm')
      ))
    )
    const videoSrc = selectedClass.recording_url || selectedClass.meet_url

    return (
      <div className="w-full space-y-6">
        <Breadcrumb items={[{ to: '/live-classes', label: isStudent ? 'Sessions & Clinics' : 'Live Classes' }, { label: selectedClass.title }]} />
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <button
                onClick={closeVideoPlayer}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                <ArrowLeft size={14} />
                Back to all classes
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{selectedClass.title}</h1>
            </div>
            {canManage && (
              <Button variant="outline" size="sm" onClick={() => loadAttendance(selectedClass.id)} className="border-border">
                <RefreshCw size={14} className="mr-2" />
                Refresh attendance
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {isRecorded ? (
                <Card className="border border-border overflow-hidden bg-card shadow-sm">
                  <CardHeader className="py-3 px-4 border-b border-border">
                    <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <Video size={14} className="text-blue-600 dark:text-blue-400" />
                      Class Recording & Playback
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="w-full aspect-video bg-black overflow-hidden">
                      <VideoPlayer
                        src={videoSrc}
                        title={selectedClass.title}
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Live Virtual Classroom Stage */
                <div className="w-full aspect-video rounded-xl border border-border bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-950 relative flex flex-col justify-between p-6 sm:p-8 overflow-hidden shadow-xl">
                  {/* Ambient background glows */}
                  <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Top Badge Row */}
                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {selectedClass.status === 'live' || selectedClass.status === 'in_progress' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                          Live Interactive Session
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm">
                          <Video size={13} />
                          Scheduled Virtual Masterclass
                        </span>
                      )}
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
                        <Clock size={12} className="text-blue-400" />
                        {new Date(selectedClass.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(selectedClass.ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <Badge variant="outline" className="border-slate-700 bg-slate-900/60 text-slate-300 text-[11px]">
                      {selectedClass.is_offline ? 'In-Person Venue' : 'Google Meet Video Call'}
                    </Badge>
                  </div>

                  {/* Center Stage Info */}
                  <div className="relative z-10 my-auto py-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 shadow-lg shadow-blue-500/10">
                      <Video size={28} />
                    </div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight max-w-2xl drop-shadow-sm">
                      {selectedClass.title}
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed line-clamp-2">
                      {selectedClass.description || 'Interactive live masterclass and technical Q&A session with BlueSPACE fintech faculty.'}
                    </p>
                  </div>

                  {/* Bottom Action Row */}
                  <div className="relative z-10 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                    {selectedClass.meet_url ? (
                      <a
                        href={selectedClass.meet_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Video size={18} />
                        Join Live Google Meet Room
                        <ExternalLink size={14} className="opacity-70" />
                      </a>
                    ) : selectedClass.is_offline ? (
                      <div className="text-sm text-slate-300">
                        Venue: <strong className="text-white">{selectedClass.venue || 'Academy Lab Campus'}</strong>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Meeting link will be published prior to class start.</span>
                    )}

                    <p className="text-[11px] text-slate-400">
                      Camera & microphone recommended for breakout exercises.
                    </p>
                  </div>
                </div>
              )}

              {canManage && (
                <Card className="mt-6 border border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-sm">Attendance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left">
                            <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Student</th>
                            <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                            <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined</th>
                            <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {Object.entries(attendance[selectedClass.id] || {}).map(([userId, status]) => (
                            <tr key={userId} className="hover:bg-muted/40">
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-7 w-7 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300">
                                    {userId.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-sm text-foreground">Student {userId.slice(-4)}</span>
                                </div>
                              </td>
                              <td className="py-3">
                                <Badge variant={status === 'attended' ? 'secondary' : 'outline'}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </Badge>
                              </td>
                              <td className="py-3 text-xs text-muted-foreground">
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
                              <td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
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
              <Card className="border border-border bg-card">
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="text-sm font-bold text-foreground">Class Details</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <Badge variant="outline" className={STATUS_COLORS[selectedClass.status] || 'border-border'}>
                      {STATUS_LABELS[selectedClass.status] || selectedClass.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Type</span>
                    <span className="text-xs font-semibold text-foreground">
                      {selectedClass.is_offline ? 'Offline (In-person)' : 'Online Virtual'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Starts</span>
                    <span className="text-xs font-medium text-foreground">
                      {new Date(selectedClass.starts_at).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Ends</span>
                    <span className="text-xs font-medium text-foreground">
                      {new Date(selectedClass.ends_at).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  {selectedClass.is_offline && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Venue</span>
                      <span className="text-xs font-medium text-foreground">{selectedClass.venue || 'Not specified'}</span>
                    </div>
                  )}
                  {!selectedClass.is_offline && selectedClass.meet_url && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Meet Link</span>
                      <a
                        href={selectedClass.meet_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        Open Google Meet
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  )}
                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attendees</span>
                    <span className="text-base font-bold text-foreground">
                      {Object.keys(attendance[selectedClass.id] || {}).length}
                    </span>
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
    <div className="w-full space-y-6">
      <Breadcrumb items={[{ label: isStudent ? 'Sessions & Clinics' : 'Live Classes' }]} />

      {/* Tabs navigation for Students */}
      {isStudent && (
        <div className="flex border-b border-border gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('classes')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'classes'
                ? 'border-deep-600 text-deep-600 dark:border-bluespace-400 dark:text-bluespace-300'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Video size={16} />
            Cohort Workshops & Live Classes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('clinics')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'clinics'
                ? 'border-deep-600 text-deep-600 dark:border-bluespace-400 dark:text-bluespace-300'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock size={16} />
            1-on-1 Mentor Clinics
          </button>
        </div>
      )}

      {activeTab === 'clinics' && isStudent ? (
        <LazyMentorClinics />
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="mb-1 text-2xl font-bold text-foreground">
                {isStudent ? 'Cohort Live Sessions' : 'Live Classes'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isStudent
                  ? 'Join interactive masterclasses, sprint reviews, and live Q&A sessions with faculty.'
                  : 'Schedule online and offline classes, share Google Meet links, and track attendance.'}
              </p>
            </div>
            {canManage && (
              <Button onClick={() => setShowForm((visible) => !visible)}>
                <Plus size={16} className="mr-2" />
                Schedule class
              </Button>
            )}
          </div>

      {error && <p className="mb-4 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 text-sm text-red-700 dark:text-red-400">{error}</p>}

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
                className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-deep-600"
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
                <label className="flex items-center gap-2 cursor-pointer mr-4 text-sm text-gray-700 dark:text-gray-300">
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
                  className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-deep-600"
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
          {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading classes...</p>}
          {!loading && classes.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">No live classes scheduled yet.</p>
          )}
          {classes.map((liveClass) => (
            <div
              key={liveClass.id}
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-4 md:flex-row md:items-center md:justify-between"
              onClick={() => openVideoPlayer(liveClass)}
            >
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Video size={15} className="text-brand-600 dark:text-blue-400" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{liveClass.title}</p>
                  <Badge variant="outline">{STATUS_LABELS[liveClass.status]}</Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
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
                <a className="inline-flex items-center text-sm font-medium text-brand-700 dark:text-blue-400 hover:underline" href={liveClass.meet_url} target="_blank" rel="noreferrer">
                  Open Meet <ExternalLink size={14} className="ml-1" />
                </a>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      </>
      )}
    </div>
  )
}

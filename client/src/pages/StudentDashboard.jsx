import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  BookOpen,
  Users,
  Calendar,
  ArrowRight,
  PlayCircle,
  Video,
  ExternalLink,
  CheckCircle2,
  Code2,
  FileText,
  Clock,
  Compass,
  GraduationCap,
  Sparkles,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { supabase } from '../lib/supabase'
import { getCurrentProfile } from '../lib/profile'
import WelcomeGuide from '../components/WelcomeGuide'
import DashboardHeader from '../components/dashboard/DashboardHeader'

const initialData = {
  profile: null,
  cohort: null,
  modules: [],
  lessons: [],
  progress: [],
  labs: [],
  submissions: [],
  attendance: [],
  squad: null,
  members: [],
  liveClasses: [],
}

export default function StudentDashboard({ user }) {
  const navigate = useNavigate()
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tourOpen, setTourOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const profile = await getCurrentProfile()
        if (!profile) throw new Error('Your academy profile could not be found.')
        const { data: enrolment, error: enrolmentError } = await supabase
          .from('enrolments')
          .select('cohort_id, track, squad_id')
          .eq('user_id', profile.id)
          .in('status', ['enrolled', 'active'])
          .maybeSingle()
        if (enrolmentError) throw enrolmentError
        if (!enrolment?.cohort_id) {
          if (!cancelled) setData({ ...initialData, profile })
          return
        }

        const [
          { data: cohort, error: cohortError },
          { data: modules, error: modulesError },
          { data: squad, error: squadError },
          { data: attendance, error: attendanceError },
          { data: submissions, error: submissionsError },
          { data: liveClasses, error: liveClassesError },
        ] = await Promise.all([
          supabase.from('cohorts').select('id, name, start_date, end_date').eq('id', enrolment.cohort_id).single(),
          supabase.from('modules').select('*').eq('cohort_id', enrolment.cohort_id).eq('is_published', true).order('week_start'),
          enrolment.squad_id ? supabase.from('squads').select('*').eq('id', enrolment.squad_id).single() : Promise.resolve({ data: null, error: null }),
          supabase.from('live_class_attendance').select('status, live_class_id').eq('user_id', profile.id),
          supabase.from('submissions').select('id, lab_id, assessment_id, score, status, submitted_at, feedback').eq('user_id', profile.id).order('submitted_at', { ascending: false }),
          supabase.from('live_classes').select('id, title, description, starts_at, ends_at, meet_url, status, is_offline, venue').eq('cohort_id', enrolment.cohort_id).gte('ends_at', new Date().toISOString()).order('starts_at', { ascending: true }).limit(2),
        ])
        if (cohortError) throw cohortError
        if (modulesError) throw modulesError
        if (squadError) throw squadError
        if (attendanceError) throw attendanceError
        if (submissionsError) throw submissionsError
        if (liveClassesError) throw liveClassesError

        const moduleIds = (modules || []).map((m) => m.id)
        const { data: lessons, error: lessonsError } = moduleIds.length
          ? await supabase.from('lessons').select('*').in('module_id', moduleIds).order('order_index')
          : { data: [], error: null }
        if (lessonsError) throw lessonsError

        const lessonIds = (lessons || []).map((l) => l.id)
        const [
          { data: progress, error: progressError },
          { data: labs, error: labsError },
        ] = await Promise.all([
          lessonIds.length ? supabase.from('lesson_progress').select('*').eq('user_id', profile.id).in('lesson_id', lessonIds) : Promise.resolve({ data: [], error: null }),
          lessonIds.length ? supabase.from('labs').select('id, lesson_id, title, due_date, max_score').in('lesson_id', lessonIds) : Promise.resolve({ data: [], error: null }),
        ])
        if (progressError) throw progressError
        if (labsError) throw labsError

        let members = []
        if (enrolment.squad_id) {
          const { data: memberEnrolments, error: membersError } = await supabase
            .from('enrolments')
            .select('user_id, track')
            .eq('squad_id', enrolment.squad_id)
          if (membersError) throw membersError
          const memberIds = (memberEnrolments || []).map((m) => m.user_id)
          if (memberIds.length) {
            const { data: profiles, error: profilesError } = await supabase.from('users').select('id, name, type').in('id', memberIds)
            if (profilesError) throw profilesError
            const tracks = new Map((memberEnrolments || []).map((m) => [m.user_id, m.track]))
            members = (profiles || []).map((p) => ({ ...p, track: tracks.get(p.id) }))
          }
        }

        if (!cancelled) {
          setData({
            profile,
            cohort,
            modules: modules || [],
            lessons: lessons || [],
            progress: progress || [],
            labs: labs || [],
            submissions: submissions || [],
            attendance: attendance || [],
            squad,
            members,
            liveClasses: liveClasses || [],
          })
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Unable to load your learning dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-medium text-gray-500">Loading your learning workspace...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p className="font-semibold">Unable to load dashboard</p>
        <p className="mt-1 text-xs">{error}</p>
      </div>
    )
  }

  // Calculate learning metrics
  const completedLessonIdSet = new Set(data.progress.filter((p) => p.is_completed).map((p) => p.lesson_id))
  const completedLessons = completedLessonIdSet.size
  const totalLessons = data.lessons.length
  const overallPercent = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0

  // Find active module & next incomplete lesson
  const currentModule = data.modules.find((mod) => {
    const modLessons = data.lessons.filter((l) => l.module_id === mod.id)
    return modLessons.some((l) => !completedLessonIdSet.has(l.id))
  }) || data.modules[0]

  const currentLessons = currentModule ? data.lessons.filter((l) => l.module_id === currentModule.id) : []
  const nextLesson = currentLessons.find((l) => !completedLessonIdSet.has(l.id)) || currentLessons[0]
  const currentModuleCompleted = currentLessons.filter((l) => completedLessonIdSet.has(l.id)).length
  const currentModulePercent = currentLessons.length ? Math.round((currentModuleCompleted / currentLessons.length) * 100) : 0

  // Next live class
  const nextLiveClass = data.liveClasses.length > 0 ? data.liveClasses[0] : null

  // Active tasks / labs needing action
  const submissionLabIdMap = new Map(data.submissions.map((s) => [s.lab_id, s]))
  const pendingLabs = data.labs
    .map((lab) => {
      const sub = submissionLabIdMap.get(lab.id)
      return {
        ...lab,
        status: sub?.status || 'not_submitted',
        score: sub?.score,
        feedback: sub?.feedback,
        submitted_at: sub?.submitted_at,
      }
    })
    .filter((l) => l.status !== 'graded')

  return (
    <div className="w-full space-y-6">
      {/* Dashboard Top Header & Progress Ribbon */}
      <DashboardHeader
        dataTour="student-header"
        title="My Learning Dashboard"
        subtitle={`${data.profile?.name || user?.name || user?.email || 'Fellow'} • ${data.profile?.track || 'Fintech Core'} Track • ${data.cohort?.name || 'Cohort 2026-A'}`}
        onStartTour={() => setTourOpen(true)}
        actions={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-white border border-gray-200/90 rounded-lg px-3 py-1.5 shadow-sm text-xs">
              <span className="font-semibold text-gray-900">{overallPercent}%</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">{completedLessons}/{totalLessons} lessons</span>
              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden ml-1">
                <div className="h-full bg-deep-600 rounded-full" style={{ width: `${overallPercent}%` }} />
              </div>
            </div>
            <Button asChild size="sm" className="bg-deep-600 text-white hover:bg-deep-700">
              <Link to="/my-learning">
                <BookOpen size={14} className="mr-1.5" />
                View Curriculum
              </Link>
            </Button>
          </div>
        }
      />

      {/* Primary Section: Continue Learning Hero (2/3) + Next Live Session (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RESUME LEARNING HERO CARD */}
        <Card data-tour="student-current-learning" className="lg:col-span-2 border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/40">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-deep-700 bg-deep-50 px-2.5 py-0.5 rounded border border-deep-100">
                  Active Module • Weeks {currentModule?.week_start || 1}-{currentModule?.week_end || 2}
                </span>
                <span className="text-xs text-gray-500 capitalize">
                  {currentModule?.stage ? currentModule.stage.replace('_', ' ') : 'Foundations'}
                </span>
              </div>
              <Badge variant="outline" className="text-[11px] font-medium border-gray-200 text-gray-700">
                {currentModuleCompleted}/{currentLessons.length} Completed
              </Badge>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {!currentModule ? (
                <div className="py-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-2">
                    <BookOpen size={18} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">No active module published</h3>
                  <p className="mt-1 text-xs text-gray-500">Your cohort syllabus will unlock as scheduled.</p>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 leading-tight">
                      {currentModule.title}
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-gray-500">
                      {currentModule.domain || 'Fintech Core Systems'} • Practical hands-on curriculum
                    </p>
                  </div>

                  {/* NEXT UP LESSON CALLOUT BOX */}
                  <div className="rounded-xl border border-gray-200/90 bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-deep-600/40 transition-colors">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-deep-50 border border-deep-100 flex items-center justify-center text-deep-600 shrink-0 mt-0.5">
                        <PlayCircle size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-deep-600">
                            Up Next
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={11} />
                            {nextLesson?.duration_minutes ? `${nextLesson.duration_minutes} min` : 'Self-paced'}
                          </span>
                        </div>
                        <p className="text-sm sm:text-base font-bold text-gray-900 truncate mt-0.5">
                          {nextLesson?.title || 'Start Coursework'}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => navigate(nextLesson ? `/lesson/${nextLesson.id}` : '/my-learning')}
                      className="bg-deep-600 text-white hover:bg-deep-700 font-semibold px-4 shrink-0 shadow-sm"
                    >
                      Resume Lesson
                      <ArrowRight size={14} className="ml-1.5" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Module Progress Bar Footer */}
          {currentModule && (
            <div className="px-5 sm:px-6 py-3.5 bg-gray-50/60 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-gray-500">
                Module Progress: <strong className="text-gray-900">{currentModulePercent}%</strong> ({currentModuleCompleted} of {currentLessons.length} lessons finished)
              </span>
              <div className="w-full sm:w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-deep-600 rounded-full transition-all duration-300"
                  style={{ width: `${currentModulePercent}%` }}
                />
              </div>
            </div>
          )}
        </Card>

        {/* NEXT LIVE SESSION CARD */}
        <Card data-tour="student-live-class" className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <h3 className="text-base font-bold text-gray-900 leading-tight">Live Session</h3>
              </div>
              <Button asChild variant="outline" size="sm" className="text-xs border-gray-200">
                <Link to="/live-classes">Calendar</Link>
              </Button>
            </div>

            <CardContent className="p-5 space-y-4">
              {nextLiveClass ? (
                <>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      Scheduled Workshop
                    </span>
                    <h4 className="text-base font-bold text-gray-900 leading-snug pt-1">
                      {nextLiveClass.title}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {nextLiveClass.description || 'Cohort live class and interactive Q&A session with faculty.'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar size={13} className="text-deep-600 shrink-0" />
                      <span className="font-semibold text-gray-900">
                        {new Date(nextLiveClass.starts_at).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(nextLiveClass.starts_at).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-500">
                      <Video size={13} className="text-deep-600 shrink-0" />
                      <span>{nextLiveClass.is_offline ? nextLiveClass.venue : 'Virtual Live Stream'}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    {nextLiveClass.meet_url ? (
                      <Button asChild className="w-full bg-deep-600 text-white hover:bg-deep-700 text-xs font-semibold">
                        <a href={nextLiveClass.meet_url} target="_blank" rel="noreferrer">
                          <Video size={14} className="mr-1.5" />
                          Join Live Stream
                        </a>
                      </Button>
                    ) : (
                      <Button asChild variant="outline" size="sm" className="w-full text-xs border-gray-200">
                        <Link to="/live-classes">View Session Details</Link>
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mx-auto">
                    <Calendar size={18} />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">No live sessions today</p>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Weekly live masterclasses and squad mentoring sessions are published ahead of schedule.
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-3 text-xs border-gray-200">
                    <Link to="/live-classes">View Class Schedule</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </div>

          <div className="px-5 py-3 bg-gray-50/60 border-t border-gray-100 text-center">
            <Link to="/mentor-clinics" className="text-xs font-semibold text-deep-600 hover:text-deep-700">
              Need 1-on-1 help? Book a Mentor Clinic →
            </Link>
          </div>
        </Card>
      </div>

      {/* Middle Section: Active Tasks & Labs (2/3) + My Squad (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ACTIONABLE TASKS & LABS */}
        <Card data-tour="student-tasks" className="lg:col-span-2 border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Active Tasks & Labs</h3>
              <p className="mt-0.5 text-xs text-gray-500">Hands-on coding exercises awaiting submission or grading</p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs border-gray-200">
              <Link to="/lab-workspace">
                Lab Workspace
                <ArrowRight size={13} className="ml-1.5" />
              </Link>
            </Button>
          </div>

          <CardContent className="p-5">
            {pendingLabs.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-1">
                  <CheckCircle2 size={18} />
                </div>
                <p className="text-sm font-semibold text-gray-900">You're all caught up!</p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  No pending lab assignments or required remediations. Keep progressing through the modules.
                </p>
                <Button asChild size="sm" variant="outline" className="mt-2 text-xs border-gray-200">
                  <Link to="/my-learning">Explore upcoming modules</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingLabs.slice(0, 4).map((lab) => {
                  const isSubmitted = lab.status === 'submitted'
                  return (
                    <div key={lab.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Code2 size={15} className="text-deep-600 shrink-0" />
                          <p className="text-sm font-semibold text-gray-900 truncate">{lab.title}</p>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span>Max score: {lab.max_score} pts</span>
                          {lab.due_date && (
                            <>
                              <span>•</span>
                              <span>Due {new Date(lab.due_date).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <Badge
                          variant={isSubmitted ? 'secondary' : 'outline'}
                          className="text-[11px] font-medium capitalize"
                        >
                          {isSubmitted ? 'Awaiting grading' : 'Pending submission'}
                        </Badge>
                        <Button asChild size="sm" variant="outline" className="h-8 px-3 text-xs border-gray-200 text-deep-600 hover:bg-deep-50">
                          <Link to="/lab-workspace">
                            {isSubmitted ? 'View Submission' : 'Submit Lab'}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* MY SQUAD CARD */}
        <Card data-tour="student-squad" className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-tight">My Squad</h3>
                <p className="mt-0.5 text-xs text-gray-500">Cohort collaborative unit</p>
              </div>
              <Button asChild variant="outline" size="sm" className="text-xs border-gray-200">
                <Link to="/my-squad">Squad Page</Link>
              </Button>
            </div>

            <CardContent className="p-5">
              {data.squad ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900">{data.squad.name}</p>
                    <span className="text-[11px] font-medium text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                      {data.members.length} teammates
                    </span>
                  </div>

                  <div className="divide-y divide-gray-100 pt-1">
                    {data.members.slice(0, 4).map((member) => (
                      <div key={member.id} className="flex items-center justify-between py-2.5 text-xs first:pt-0 last:pb-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-deep-50 border border-deep-100 flex items-center justify-center text-[10px] font-bold text-deep-700 shrink-0">
                            {member.name?.charAt(0)?.toUpperCase() || 'M'}
                          </div>
                          <span className="font-semibold text-gray-800 truncate">{member.name}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-normal capitalize shrink-0 ml-2">
                          {member.track || 'Student'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mx-auto">
                    <Users size={18} />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Squad forming</p>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    You will be grouped with cohort teammates for practical fintech sprint use-cases.
                  </p>
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-4 bg-gray-50/60 border-t border-gray-100">
            <Button asChild variant="outline" size="sm" className="w-full text-xs border-gray-200">
              <Link to="/my-squad">
                <Users size={13} className="mr-1.5" />
                Open Squad Workspace
              </Link>
            </Button>
          </div>
        </Card>
      </div>

      {/* Bottom Section: Academy Quick Launchpad */}
      <div data-tour="student-launchpad" className="space-y-3 pt-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
          Academy Launchpad
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/lab-workspace"
            className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm hover:border-deep-600/50 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-lg bg-deep-50 border border-deep-100 flex items-center justify-center text-deep-600 mb-3">
              <Code2 size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Lab Workspace</p>
              <p className="text-xs text-gray-500 mt-0.5">Submit & inspect code repositories</p>
            </div>
          </Link>

          <Link
            to="/live-classes"
            className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm hover:border-deep-600/50 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
              <Video size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Live Classes</p>
              <p className="text-xs text-gray-500 mt-0.5">Workshops, streams & recordings</p>
            </div>
          </Link>

          <Link
            to="/peer-reviews"
            className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm hover:border-deep-600/50 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-3">
              <Users size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Peer Reviews</p>
              <p className="text-xs text-gray-500 mt-0.5">Review teammate deliverables</p>
            </div>
          </Link>

          <Link
            to="/capstone"
            className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm hover:border-deep-600/50 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-3">
              <GraduationCap size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Capstone Project</p>
              <p className="text-xs text-gray-500 mt-0.5">Final graduation submission</p>
            </div>
          </Link>
        </div>
      </div>

      <WelcomeGuide
        role="Student"
        forceOpen={tourOpen}
        onClose={() => setTourOpen(false)}
      />
    </div>
  )
}

StudentDashboard.propTypes = {
  user: PropTypes.object,
}

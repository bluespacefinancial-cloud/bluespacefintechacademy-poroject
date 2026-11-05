import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { Activity, BookOpen, CheckCircle, Users, Calendar, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { supabase } from '../lib/supabase'
import { getCurrentProfile } from '../lib/profile'
import WelcomeGuide from '../components/WelcomeGuide'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import MetricCard from '../components/dashboard/MetricCard'

const initialData = {
  profile: null,
  cohort: null,
  modules: [],
  lessons: [],
  progress: [],
  submissions: [],
  attendance: [],
  squad: null,
  members: [],
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
        if (!profile) throw new Error('Your academy profile could not be found')
        const { data: enrolment, error: enrolmentError } = await supabase
          .from('enrolments')
          .select('cohort_id, track, squad_id')
          .eq('user_id', profile.id)
          .in('status', ['enrolled', 'active'])
          .maybeSingle()
        if (enrolmentError) throw enrolmentError
        if (!enrolment) {
          if (!cancelled) setData({ ...initialData, profile })
          return
        }

        const [
          { data: cohort, error: cohortError },
          { data: modules, error: modulesError },
          { data: squad, error: squadError },
          { data: attendance, error: attendanceError },
          { data: submissions, error: submissionsError },
        ] = await Promise.all([
          supabase.from('cohorts').select('id, name, start_date, end_date').eq('id', enrolment.cohort_id).single(),
          supabase.from('modules').select('*').eq('cohort_id', enrolment.cohort_id).eq('is_published', true).order('week_start'),
          enrolment.squad_id ? supabase.from('squads').select('*').eq('id', enrolment.squad_id).single() : Promise.resolve({ data: null, error: null }),
          supabase.from('live_class_attendance').select('status, live_class_id').eq('user_id', profile.id),
          supabase.from('submissions').select('score, status, submitted_at, lab_id, assessment_id').eq('user_id', profile.id).order('submitted_at', { ascending: false }),
        ])
        if (cohortError) throw cohortError
        if (modulesError) throw modulesError
        if (squadError) throw squadError
        if (attendanceError) throw attendanceError
        if (submissionsError) throw submissionsError

        const moduleIds = (modules || []).map((module) => module.id)
        const { data: lessons, error: lessonsError } = moduleIds.length
          ? await supabase.from('lessons').select('*').in('module_id', moduleIds).order('order_index')
          : { data: [], error: null }
        if (lessonsError) throw lessonsError
        const lessonIds = (lessons || []).map((lesson) => lesson.id)
        const { data: progress, error: progressError } = lessonIds.length
          ? await supabase.from('lesson_progress').select('*').eq('user_id', profile.id).in('lesson_id', lessonIds)
          : { data: [], error: null }
        if (progressError) throw progressError

        let members = []
        if (enrolment.squad_id) {
          const { data: memberEnrolments, error: membersError } = await supabase
            .from('enrolments')
            .select('user_id, track')
            .eq('squad_id', enrolment.squad_id)
          if (membersError) throw membersError
          const memberIds = (memberEnrolments || []).map((member) => member.user_id)
          if (memberIds.length) {
            const { data: profiles, error: profilesError } = await supabase.from('users').select('id, name, type').in('id', memberIds)
            if (profilesError) throw profilesError
            const tracks = new Map((memberEnrolments || []).map((member) => [member.user_id, member.track]))
            members = (profiles || []).map((profile) => ({ ...profile, track: tracks.get(profile.id) }))
          }
        }

        if (!cancelled) setData({ profile, cohort, modules: modules || [], lessons: lessons || [], progress: progress || [], submissions: submissions || [], attendance: attendance || [], squad, members })
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
        <p className="text-sm font-medium text-gray-500">Loading your learning dashboard...</p>
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

  const completedLessons = data.progress.filter((item) => item.is_completed).length
  const completion = data.lessons.length ? Math.round((completedLessons / data.lessons.length) * 100) : 0
  const attended = data.attendance.filter((item) => item.status === 'attended').length
  const attendance = data.attendance.length ? Math.round((attended / data.attendance.length) * 100) : null
  const graded = data.submissions.filter((item) => Number.isFinite(item.score))
  const grade = graded.length ? Math.round(graded.reduce((total, item) => total + item.score, 0) / graded.length) : null
  const currentModule = data.modules.find((module) => {
    const moduleLessons = data.lessons.filter((lesson) => lesson.module_id === module.id)
    return moduleLessons.some((lesson) => !data.progress.find((item) => item.lesson_id === lesson.id)?.is_completed)
  }) || data.modules[0]
  const currentLessons = currentModule ? data.lessons.filter((lesson) => lesson.module_id === currentModule.id) : []
  const currentCompleted = currentLessons.filter((lesson) => data.progress.find((item) => item.lesson_id === lesson.id)?.is_completed).length

  return (
    <div className="w-full space-y-6">
      <DashboardHeader
        dataTour="student-header"
        title="My Learning Dashboard"
        subtitle={`${data.profile?.name || user?.email || 'Fellow'} • ${data.profile?.track || 'Academy'} Track • ${data.cohort?.name || 'No cohort assigned'}`}
        onStartTour={() => setTourOpen(true)}
        actions={
          <Button asChild size="sm" className="bg-deep-600 text-white hover:bg-deep-700">
            <Link to="/my-learning">
              <BookOpen size={14} className="mr-1.5" />
              Go to My Learning
            </Link>
          </Button>
        }
      />

      {/* Metrics Grid */}
      <div data-tour="student-metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Course completion"
          value={`${completion}%`}
          icon={BookOpen}
          helper={`${completedLessons} of ${data.lessons.length} lessons completed`}
          to="/my-learning"
        />
        <MetricCard
          label="Class attendance"
          value={attendance === null ? 'No data' : `${attendance}%`}
          icon={Users}
          helper={data.attendance.length ? `${attended} of ${data.attendance.length} sessions attended` : 'No live sessions recorded'}
          to="/live-classes"
        />
        <MetricCard
          label="Average grade"
          value={grade === null ? 'Not graded' : `${grade}%`}
          icon={CheckCircle}
          helper={graded.length ? `${graded.length} evaluations scored` : 'No graded submissions yet'}
          to="/progress"
        />
        <MetricCard
          label="Lessons finished"
          value={`${completedLessons}/${data.lessons.length}`}
          icon={Activity}
          helper="Total completed lessons"
          to="/my-learning"
        />
      </div>

      {/* Current Learning + My Squad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card data-tour="student-current-learning" className="lg:col-span-2 border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Current learning</h3>
              <p className="mt-0.5 text-xs text-gray-500">Pick up where you left off</p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs border-gray-200">
              <Link to="/my-learning">
                View curriculum
                <ArrowRight size={13} className="ml-1.5" />
              </Link>
            </Button>
          </div>
          <CardContent className="p-5">
            {!currentModule ? (
              <div className="py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-2.5">
                  <BookOpen size={18} />
                </div>
                <p className="text-sm font-semibold text-gray-900">No published modules yet</p>
                <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                  Active learning modules will appear here as your cohort starts.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{currentModule.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {currentModule.stage ? currentModule.stage.replace('_', ' ') : 'Foundations'} • Weeks {currentModule.week_start}-{currentModule.week_end}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[11px] font-medium shrink-0 self-start sm:self-auto">
                    {currentCompleted}/{currentLessons.length} lessons complete
                  </Badge>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-deep-600 transition-all duration-300"
                    style={{
                      width: `${currentLessons.length ? (currentCompleted / currentLessons.length) * 100 : 0}%`,
                    }}
                  />
                </div>

                <div className="pt-1">
                  <Button size="sm" onClick={() => navigate('/my-learning')} className="bg-deep-600 text-white hover:bg-deep-700">
                    Continue learning
                    <ArrowRight size={13} className="ml-1.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Squad Card */}
        <Card data-tour="student-squad" className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">My squad</h3>
              <p className="mt-0.5 text-xs text-gray-500">Team collaboration unit</p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs border-gray-200">
              <Link to="/my-squad">View squad</Link>
            </Button>
          </div>
          <CardContent className="p-5">
            {data.squad ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{data.squad.name}</p>
                  <span className="text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                    {data.members.length} members
                  </span>
                </div>
                <div className="divide-y divide-gray-100 pt-1">
                  {data.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between py-2 text-xs first:pt-0 last:pb-0">
                      <span className="font-medium text-gray-800">{member.name}</span>
                      <Badge variant="outline" className="text-[10px] font-normal capitalize">
                        {member.track || 'Student'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-2.5">
                  <Users size={18} />
                </div>
                <p className="text-sm font-semibold text-gray-900">No squad assigned yet</p>
                <p className="mt-1 text-xs text-gray-500 max-w-xs mx-auto">
                  You will be grouped into a collaborative student squad shortly.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Deadlines & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-tour="student-deadlines" className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Upcoming deadlines</h3>
              <p className="mt-0.5 text-xs text-gray-500">Module milestones and schedules</p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs border-gray-200">
              <Link to="/my-learning">All modules</Link>
            </Button>
          </div>
          <CardContent className="p-5">
            {data.modules.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-2.5">
                  <Calendar size={18} />
                </div>
                <p className="text-sm font-semibold text-gray-900">No upcoming deadlines</p>
                <p className="mt-1 text-xs text-gray-500">Module milestones will show here once curriculum starts.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.modules.slice(0, 5).map((module) => (
                  <div key={module.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-gray-100 p-3.5 hover:border-gray-200 transition-colors bg-white">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{module.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Weeks {module.week_start}-{module.week_end} • {module.stage ? module.stage.replace('_', ' ') : 'Foundations'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={module.is_published ? 'secondary' : 'outline'} className="text-[11px] font-medium">
                        {module.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => navigate('/my-learning')} className="h-8 px-2.5 text-xs border-gray-200">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Recent activity</h3>
              <p className="mt-0.5 text-xs text-gray-500">Completed lessons and lab submissions</p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs border-gray-200">
              <Link to="/progress">View history</Link>
            </Button>
          </div>
          <CardContent className="p-5">
            {data.progress.length === 0 && data.submissions.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-2.5">
                  <CheckCircle size={18} />
                </div>
                <p className="text-sm font-semibold text-gray-900">No activity yet</p>
                <p className="mt-1 text-xs text-gray-500">Completed lessons and graded submissions will record here.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.progress.filter((item) => item.is_completed).slice(0, 3).map((item) => (
                  <div key={`lesson-${item.lesson_id}`} className="flex items-center justify-between py-2.5 text-xs first:pt-0">
                    <span className="font-medium text-gray-800">Lesson completed</span>
                    <span className="text-gray-500">{new Date(item.completed_at || item.updated_at).toLocaleDateString()}</span>
                  </div>
                ))}
                {data.submissions.slice(0, 3).map((item) => (
                  <div key={`submission-${item.lab_id || item.assessment_id}-${item.submitted_at}`} className="flex items-center justify-between py-2.5 text-xs last:pb-0">
                    <span className="font-medium text-gray-800 capitalize">Submission {item.status}</span>
                    <span className="text-gray-500">{new Date(item.submitted_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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

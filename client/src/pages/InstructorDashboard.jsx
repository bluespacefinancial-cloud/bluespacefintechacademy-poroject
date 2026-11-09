import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  ArrowRight,
  Users,
  Plus,
  CheckCircle2,
  Video,
  Calendar,
  Clock,
  MessageSquare,
  Award,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { getCurrentProfile } from '../lib/profile'
import { api } from '../lib/backend'
import WelcomeGuide from '../components/WelcomeGuide'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import MetricCard from '../components/dashboard/MetricCard'

const initialData = { profile: null, cohorts: [], squads: [], modules: [], submissions: [], liveClasses: [] }

export default function InstructorDashboard({ user }) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tourOpen, setTourOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const profile = await getCurrentProfile()
        if (!profile) throw new Error('Your instructor profile could not be found')
        const [cohortResult, squadResult, moduleResult] = await Promise.all([
          api.from('instructor_cohort_assignments').select('cohort_id').eq('instructor_id', profile.id),
          api.from('instructor_squad_assignments').select('squad_id').eq('instructor_id', profile.id),
          api.from('modules').select('id, title, stage, domain, track, cohort_id, is_published, week_start, week_end, created_by').order('updated_at', { ascending: false }),
        ])
        if (cohortResult.error) throw cohortResult.error
        if (squadResult.error) throw squadResult.error
        if (moduleResult.error) throw moduleResult.error

        const cohortIds = cohortResult.data.map((item) => item.cohort_id)
        const squadIds = squadResult.data.map((item) => item.squad_id)
        const modules = moduleResult.data.filter((item) => cohortIds.includes(item.cohort_id) || item.created_by === profile.id)
        const moduleIds = modules.map((item) => item.id)
        const [cohortRows, squadRows, lessonResult, liveClassResult] = await Promise.all([
          cohortIds.length ? api.from('cohorts').select('id, name, status').in('id', cohortIds) : Promise.resolve({ data: [], error: null }),
          squadIds.length ? api.from('squads').select('id, name, cohort_id').in('id', squadIds) : Promise.resolve({ data: [], error: null }),
          moduleIds.length ? api.from('lessons').select('id, module_id').in('module_id', moduleIds) : Promise.resolve({ data: [], error: null }),
          cohortIds.length ? api.from('live_classes').select('id, title, starts_at, ends_at, is_offline, venue, meet_url, cohort_id').in('cohort_id', cohortIds).eq('status', 'scheduled').order('starts_at', { ascending: true }) : Promise.resolve({ data: [], error: null }),
        ])
        if (cohortRows.error) throw cohortRows.error
        if (squadRows.error) throw squadRows.error
        if (lessonResult.error) throw lessonResult.error
        if (liveClassResult.error) throw liveClassResult.error

        const lessonIds = lessonResult.data.map((item) => item.id)
        const labResult = lessonIds.length
          ? await api.from('labs').select('id, lesson_id, title').in('lesson_id', lessonIds)
          : { data: [], error: null }
        if (labResult.error) throw labResult.error
        const labIds = labResult.data.map((item) => item.id)
        const submissionResult = labIds.length
          ? await api.from('submissions').select('id, lab_id, user_id, status, submitted_at').eq('status', 'submitted').in('lab_id', labIds).order('submitted_at', { ascending: false }).limit(6)
          : { data: [], error: null }
        if (submissionResult.error) throw submissionResult.error

        const studentIds = [...new Set(submissionResult.data.map((item) => item.user_id))]
        const [studentRows,] = studentIds.length
          ? await Promise.all([api.from('users').select('id, name').in('id', studentIds)])
          : [{ data: [], error: null }]
        if (studentRows.error) throw studentRows.error

        const lessonModules = new Map(lessonResult.data.map((item) => [item.id, item.module_id]))
        const labsById = new Map(labResult.data.map((item) => [item.id, item]))
        const studentsById = new Map(studentRows.data.map((item) => [item.id, item.name]))
        const submissions = submissionResult.data.map((item) => ({
          ...item,
          labTitle: labsById.get(item.lab_id)?.title || 'Lab submission',
          moduleTitle: modules.find((module) => module.id === lessonModules.get(labsById.get(item.lab_id)?.lesson_id))?.title || 'Assigned module',
          studentName: studentsById.get(item.user_id) || 'Student',
        }))

        if (!cancelled) setData({ profile, cohorts: cohortRows.data, squads: squadRows.data, modules, submissions, liveClasses: liveClassResult.data || [] })
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Unable to load instructor dashboard')
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
        <p className="text-sm font-medium text-gray-500">Loading your teaching dashboard...</p>
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

  const nextLiveClass = data.liveClasses.length > 0 ? data.liveClasses[0] : null

  return (
    <div className="w-full space-y-6">
      <DashboardHeader
        dataTour="instructor-header"
        title="Faculty Teaching Dashboard"
        subtitle={`Welcome back, ${data.profile?.name || user?.name || 'Instructor'}. Oversee your cohort evaluations, scheduled masterclasses, and squad mentorship.`}
        onStartTour={() => setTourOpen(true)}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="border-gray-200">
              <Link to="/labs-to-review">
                <ClipboardList size={14} className="mr-1.5" />
                Review Labs ({data.submissions.length})
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-gray-200">
              <Link to="/live-classes">
                <Calendar size={14} className="mr-1.5" />
                Live Schedule
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-deep-600 text-white hover:bg-deep-700">
              <Link to="/my-modules">
                <Plus size={14} className="mr-1.5" />
                Create Module
              </Link>
            </Button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div data-tour="instructor-metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Pending lab evaluations"
          value={data.submissions.length}
          icon={ClipboardList}
          helper="Submissions awaiting grades"
          to="/labs-to-review"
        />
        <MetricCard
          label="Assigned cohorts"
          value={data.cohorts.length}
          icon={GraduationCap}
          helper="Cohorts under instruction"
        />
        <MetricCard
          label="Mentored squads"
          value={data.squads.length}
          icon={Users}
          helper="Student collaborative teams"
          to="/squads"
        />
        <MetricCard
          label="Upcoming live classes"
          value={data.liveClasses.length}
          icon={Video}
          helper="Scheduled masterclasses"
          to="/live-classes"
        />
      </div>

      {/* Primary Section: Priority Grading Queue (2/3) + Next Live Teaching Session (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SUBMISSIONS WAITING FOR REVIEW */}
        <Card data-tour="instructor-reviews" className="lg:col-span-2 border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-tight">Priority Grading Queue</h3>
                <p className="mt-0.5 text-xs text-gray-500">Student lab exercises submitted and awaiting evaluation</p>
              </div>
              <Button asChild variant="outline" size="sm" className="text-xs border-gray-200">
                <Link to="/labs-to-review">
                  Review all
                  <ArrowRight size={13} className="ml-1.5" />
                </Link>
              </Button>
            </div>

            <CardContent className="p-5">
              {data.submissions.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-2">
                    <CheckCircle2 size={18} />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Grading queue is clear</p>
                  <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                    All student lab submissions have been reviewed. New submissions will appear here as fellows complete their exercises.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {data.submissions.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.labTitle}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span className="font-semibold text-gray-800">{item.studentName}</span>
                          <span>•</span>
                          <span className="truncate">{item.moduleTitle}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-gray-500">
                          {new Date(item.submitted_at).toLocaleDateString()}
                        </span>
                        <Button asChild size="sm" className="h-8 px-3 text-xs bg-deep-600 text-white hover:bg-deep-700">
                          <Link to="/labs-to-review">Grade</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </div>

          <div className="px-5 py-3 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Need to review cohort project deliverables?
            </span>
            <Link to="/project-review" className="font-semibold text-deep-600 hover:text-deep-700">
              Project Review Queue →
            </Link>
          </div>
        </Card>

        {/* UPCOMING LIVE TEACHING SESSION */}
        <Card className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Video size={16} className="text-deep-600" />
                <h3 className="text-base font-bold text-gray-900 leading-tight">Teaching Schedule</h3>
              </div>
              <Button asChild variant="outline" size="sm" className="text-xs border-gray-200">
                <Link to="/live-classes">Calendar</Link>
              </Button>
            </div>

            <CardContent className="p-5 space-y-4">
              {nextLiveClass ? (
                <>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                      Next Scheduled Class
                    </span>
                    <h4 className="text-base font-bold text-gray-900 leading-snug pt-1">
                      {nextLiveClass.title}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {cohortNamesFor(nextLiveClass, data.cohorts)}
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
                      <Button asChild className="w-full bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold">
                        <a href={nextLiveClass.meet_url} target="_blank" rel="noreferrer">
                          <Video size={14} className="mr-1.5" />
                          Launch Live Class
                        </a>
                      </Button>
                    ) : (
                      <Button asChild variant="outline" size="sm" className="w-full text-xs border-gray-200">
                        <Link to="/live-classes">View Class Roster</Link>
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mx-auto">
                    <Calendar size={18} />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">No classes scheduled today</p>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Schedule weekly cohort masterclasses or open office hours in the calendar.
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-3 text-xs border-gray-200">
                    <Link to="/live-classes">Schedule Class</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </div>

          <div className="px-5 py-3 bg-gray-50/60 border-t border-gray-100 text-center">
            <Link to="/mentor-clinics" className="text-xs font-semibold text-deep-600 hover:text-deep-700">
              Manage 1-on-1 Mentor Clinic Hours →
            </Link>
          </div>
        </Card>
      </div>

      {/* Secondary Section: Cohort Modules (2/3) + Faculty Toolkit (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card data-tour="instructor-modules" className="lg:col-span-2 border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Teaching Modules</h3>
              <p className="mt-0.5 text-xs text-gray-500">Curricula taught across your assigned cohorts</p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs border-gray-200">
              <Link to="/my-modules">
                All Modules
                <ArrowRight size={13} className="ml-1.5" />
              </Link>
            </Button>
          </div>
          <CardContent className="p-5">
            {data.modules.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-2.5">
                  <BookOpen size={18} />
                </div>
                <p className="text-sm font-semibold text-gray-900">No modules assigned yet</p>
                <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                  Cohort modules will appear here once assigned by the curriculum director, or you can author a custom module.
                </p>
                <Button asChild size="sm" className="mt-4 bg-deep-600 text-white hover:bg-deep-700">
                  <Link to="/my-modules">Author Module</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {data.modules.slice(0, 5).map((module) => (
                  <div
                    key={module.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-gray-100 p-3.5 hover:border-gray-200 transition-colors bg-white"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{module.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="capitalize">{module.stage ? module.stage.replaceAll('_', ' ') : 'Foundations'}</span>
                        <span>•</span>
                        <span>{module.domain || module.track || 'Fintech Core'}</span>
                        <span>•</span>
                        <span className="truncate">{cohortNamesFor(module, data.cohorts)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={module.is_published ? 'secondary' : 'outline'} className="text-[11px] font-medium">
                        {module.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Faculty Toolkit */}
        <Card data-tour="instructor-squads" className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-tight">Faculty Toolkit</h3>
                <p className="mt-0.5 text-xs text-gray-500">Quick actions for teaching operations</p>
              </div>
            </div>
            <CardContent className="p-4 space-y-2">
              <Link
                to="/labs-to-review"
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors bg-white text-xs font-semibold text-gray-800"
              >
                <div className="flex items-center gap-2.5">
                  <ClipboardList size={16} className="text-deep-600 shrink-0" />
                  <span>Grade Student Labs</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-medium">
                  {data.submissions.length} pending
                </Badge>
              </Link>

              <Link
                to="/project-review"
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors bg-white text-xs font-semibold text-gray-800"
              >
                <div className="flex items-center gap-2.5">
                  <Award size={16} className="text-deep-600 shrink-0" />
                  <span>Project Deliverables</span>
                </div>
                <ArrowRight size={13} className="text-gray-400" />
              </Link>

              <Link
                to="/mentor-clinics"
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors bg-white text-xs font-semibold text-gray-800"
              >
                <div className="flex items-center gap-2.5">
                  <Clock size={16} className="text-deep-600 shrink-0" />
                  <span>Mentor Clinic Hours</span>
                </div>
                <ArrowRight size={13} className="text-gray-400" />
              </Link>

              <Link
                to="/squads"
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors bg-white text-xs font-semibold text-gray-800"
              >
                <div className="flex items-center gap-2.5">
                  <Users size={16} className="text-deep-600 shrink-0" />
                  <span>Assigned Squads ({data.squads.length})</span>
                </div>
                <ArrowRight size={13} className="text-gray-400" />
              </Link>

              <Link
                to="/announcements"
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors bg-white text-xs font-semibold text-gray-800"
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare size={16} className="text-deep-600 shrink-0" />
                  <span>Post Cohort Announcement</span>
                </div>
                <ArrowRight size={13} className="text-gray-400" />
              </Link>
            </CardContent>
          </div>

          <div className="p-4 bg-gray-50/60 border-t border-gray-100">
            <Button asChild variant="outline" size="sm" className="w-full text-xs border-gray-200">
              <Link to="/squads">View Mentored Squads ({data.squads.length})</Link>
            </Button>
          </div>
        </Card>
      </div>

      <WelcomeGuide
        role="Instructor"
        forceOpen={tourOpen}
        onClose={() => setTourOpen(false)}
      />
    </div>
  )
}

function cohortNamesFor(item, cohorts) {
  return cohorts.find((cohort) => cohort.id === item.cohort_id)?.name || 'Cohort not assigned'
}

InstructorDashboard.propTypes = {
  user: PropTypes.object,
}

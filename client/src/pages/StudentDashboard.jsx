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
  CheckCircle2,
  Code2,
  Clock,
  Compass,
  Trophy,
  Lock,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { api } from '../lib/backend'
import { getCurrentProfile } from '../lib/profile'
import WelcomeGuide from '../components/WelcomeGuide'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import { getDeadlineInfo } from '../lib/deadlines'
import { AchievementBadge } from '../components/ui/achievement-badge'

const initialData = {
  profile: null,
  cohort: null,
  enrolment: null,
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
        const { data: enrolment, error: enrolmentError } = await api
          .from('enrolments')
          .select('cohort_id, track, squad_id')
          .eq('user_id', profile.id)
          .in('status', ['enrolled', 'active'])
          .order('created_at', { ascending: false })
          .limit(1)
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
          api.from('cohorts').select('id, name, start_date, end_date').eq('id', enrolment.cohort_id).single(),
          api.from('modules').select('*').eq('cohort_id', enrolment.cohort_id).eq('is_published', true).order('week_start'),
          enrolment.squad_id ? api.from('squads').select('*').eq('id', enrolment.squad_id).single() : Promise.resolve({ data: null, error: null }),
          api.from('live_class_attendance').select('status, live_class_id').eq('user_id', profile.id),
          api.from('submissions').select('id, lab_id, assessment_id, score, status, submitted_at, feedback').eq('user_id', profile.id).order('submitted_at', { ascending: false }),
          api.from('live_classes').select('id, title, description, starts_at, ends_at, meet_url, status, is_offline, venue').eq('cohort_id', enrolment.cohort_id).gte('ends_at', new Date().toISOString()).order('starts_at', { ascending: true }).limit(2),
        ])
        if (cohortError) throw cohortError
        if (modulesError) throw modulesError
        if (squadError) throw squadError
        if (attendanceError) throw attendanceError
        if (submissionsError) throw submissionsError
        if (liveClassesError) throw liveClassesError

        const moduleIds = (modules || []).map((m) => m.id)
        const { data: lessons, error: lessonsError } = moduleIds.length
          ? await api.from('lessons').select('*').in('module_id', moduleIds).order('order_index')
          : { data: [], error: null }
        if (lessonsError) throw lessonsError

        const lessonIds = (lessons || []).map((l) => l.id)
        const [
          { data: progress, error: progressError },
          { data: labs, error: labsError },
        ] = await Promise.all([
          lessonIds.length ? api.from('lesson_progress').select('*').eq('user_id', profile.id).in('lesson_id', lessonIds) : Promise.resolve({ data: [], error: null }),
          lessonIds.length ? api.from('labs').select('id, lesson_id, title, due_date, max_score').in('lesson_id', lessonIds) : Promise.resolve({ data: [], error: null }),
        ])
        if (progressError) throw progressError
        if (labsError) throw labsError

        let members = []
        if (enrolment.squad_id) {
          const { data: memberEnrolments, error: membersError } = await api
            .from('enrolments')
            .select('user_id, track')
            .eq('squad_id', enrolment.squad_id)
          if (membersError) throw membersError
          const memberIds = (memberEnrolments || []).map((m) => m.user_id)
          if (memberIds.length) {
            const { data: profiles, error: profilesError } = await api.from('users').select('id, name, type').in('id', memberIds)
            if (profilesError) throw profilesError
            const tracks = new Map((memberEnrolments || []).map((m) => [m.user_id, m.track]))
            members = (profiles || []).map((p) => ({ ...p, track: tracks.get(p.id) }))
          }
        }

        if (!cancelled) {
          // Resume surface: first incomplete lesson in the first incomplete
          // module, ordered by curriculum week -> order_index. Students must
          // finish week N before week N+1 unlocks.
          const completedLessonIdSet = new Set((progress || []).filter((p) => p.is_completed).map((p) => p.lesson_id))

          let resumeLesson = null
          let currentModule = null
          for (const mod of (modules || [])) {
            const modLessons = (lessons || []).filter((l) => l.module_id === mod.id).sort((a, b) => a.order_index - b.order_index)
            const firstIncomplete = modLessons.find((l) => !completedLessonIdSet.has(l.id))
            if (firstIncomplete) {
              resumeLesson = firstIncomplete
              currentModule = mod
              break
            }
          }
          // Fallback: if all complete, use the last module
          if (!resumeLesson && modules.length > 0) {
            currentModule = modules[modules.length - 1]
            const lastLessons = (lessons || []).filter((l) => l.module_id === currentModule.id).sort((a, b) => a.order_index - b.order_index)
            resumeLesson = lastLessons[lastLessons.length - 1] || null
          }

          setData({
            profile,
            cohort,
            enrolment,
            modules: modules || [],
            lessons: lessons || [],
            progress: progress || [],
            labs: labs || [],
            submissions: submissions || [],
            attendance: attendance || [],
            squad,
            members,
            liveClasses: liveClasses || [],
            resumeLesson,
            currentModule,
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

  // Active module comes from the load step (first module with an incomplete lesson,
  // ordered by week_start). Falls back to the first module.
  const currentModule = data.currentModule || data.modules[0]

  const currentLessons = currentModule ? data.lessons.filter((l) => l.module_id === currentModule.id) : []
  const resumeTarget = data.resumeLesson || currentLessons[0]
  const currentModuleCompleted = currentLessons.filter((l) => completedLessonIdSet.has(l.id)).length
  const currentModulePercent = currentLessons.length ? Math.round((currentModuleCompleted / currentLessons.length) * 100) : 0

  // Relevant modules for this student's enrolled track
  const studentTrack = data.enrolment?.track || data.profile?.track || ''
  const trackFilteredModules = data.modules.filter(
    (mod) => !mod.track || mod.track === 'All' || !studentTrack || mod.track.toLowerCase() === studentTrack.toLowerCase()
  )
  const modulesWithContent = trackFilteredModules.filter((mod) => data.lessons.some((l) => l.module_id === mod.id))
  const displayModules = modulesWithContent.length > 0 ? modulesWithContent : trackFilteredModules

  // Week-by-week progress for every module in curriculum order
  const weekProgress = displayModules.map((mod) => {
    const modLessons = data.lessons.filter((l) => l.module_id === mod.id)
    const modCompleted = modLessons.filter((l) => completedLessonIdSet.has(l.id)).length
    const modPercent = modLessons.length ? Math.round((modCompleted / modLessons.length) * 100) : 0
    const isComplete = modLessons.length > 0 && modCompleted === modLessons.length
    return {
      ...mod,
      lessons: modLessons,
      completed: modCompleted,
      total: modLessons.length,
      percent: modPercent,
      isComplete,
    }
  })

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

  // Achievement milestones
  const gradedLabsCount = data.submissions.filter((s) => s.status === 'graded' || (s.score !== null && s.score !== undefined)).length
  const attendanceCount = data.attendance.filter((a) => a.status === 'present').length

  const studentAchievements = [
    {
      id: 'ach-1',
      name: 'First Ledger Lab',
      trigger: 'metric',
      achievedAt: gradedLabsCount > 0 ? (data.submissions[0]?.submitted_at || '2026-11-01T10:00:00Z') : '2026-11-01T10:00:00Z',
      progress: 100,
      rarity: 88,
    },
    {
      id: 'ach-2',
      name: 'Idempotency Specialist',
      trigger: 'metric',
      achievedAt: completedLessons >= 2 ? '2026-11-03T14:30:00Z' : '2026-11-03T14:30:00Z',
      progress: 100,
      rarity: 42,
    },
    {
      id: 'ach-3',
      name: 'Live Masterclass Streak',
      trigger: 'streak',
      achievedAt: attendanceCount >= 2 ? '2026-11-05T18:00:00Z' : null,
      progress: Math.min(100, Math.max(33, Math.round(((attendanceCount || 1) / 3) * 100))),
      rarity: 28,
    },
    {
      id: 'ach-4',
      name: 'TrustNet Rails Certified',
      trigger: 'api',
      achievedAt: '2026-11-06T11:20:00Z',
      progress: 100,
      rarity: 18,
    },
    {
      id: 'ach-5',
      name: 'Samsub AML Engine Builder',
      trigger: 'metric',
      achievedAt: null,
      progress: 60,
      rarity: 12,
    },
    {
      id: 'ach-6',
      name: 'Capstone Finalist',
      trigger: 'metric',
      achievedAt: null,
      progress: 30,
      rarity: 6,
    },
  ]

  // If student has not been assigned to a cohort yet, show clear onboarding state
  if (!data.cohort) {
    return (
      <div className="w-full space-y-6">
        <DashboardHeader
          dataTour="student-header"
          title="Fellowship Dashboard"
          subtitle={`Welcome, ${data.profile?.name || user?.name || user?.email || 'Fellow'}. Your admission to BlueSPACE Fintech Academy is confirmed.`}
          onStartTour={() => setTourOpen(true)}
          actions={
            <Button asChild size="sm" className="bg-deep-600 text-white hover:bg-deep-700">
              <Link to="/skills-profile">
                <Compass size={14} className="mr-1.5" />
                Complete Skills Profile
              </Link>
            </Button>
          }
        />

        <div className="rounded-xl border border-gray-200/90 dark:border-gray-800 bg-card p-6 shadow-sm">
          <div className="max-w-2xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-deep-700 dark:text-deep-400 px-2.5 py-1 rounded border border-deep-100 dark:border-deep-900/60 dark:bg-deep-950/40">
              Cohort Placement in Progress
            </span>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-3 leading-tight">
              Welcome to the Academy
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Your fellowship account is active. Our academic team is currently finalizing cohort schedules, instructor assignments, and collaborative squad groupings. Once your cohort is activated, your weekly syllabus, live masterclasses, lab workspaces, and squad channels will unlock here automatically.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/skills-profile"
              className="rounded-lg border border-gray-200/90 dark:border-gray-800 p-4 hover:border-deep-600/40 dark:hover:border-deep-500/50 hover:shadow-sm transition-all bg-card flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-deep-50 dark:bg-deep-950/60 border border-deep-100 dark:border-deep-900/50 flex items-center justify-center text-deep-600 dark:text-deep-400 mb-3">
                  <Compass size={18} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">1. Update Skills Profile</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Share your technical background, programming proficiency, and career goals to help faculty group your squad.
                </p>
              </div>
              <span className="text-xs font-semibold text-deep-600 dark:text-deep-400 mt-4 flex items-center gap-1">
                Complete profile <ArrowRight size={12} />
              </span>
            </Link>

            <Link
              to="/partner-catalog"
              className="rounded-lg border border-gray-200/90 dark:border-gray-800 p-4 hover:border-deep-600/40 dark:hover:border-deep-500/50 hover:shadow-sm transition-all bg-card flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                  <BookOpen size={18} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">2. Explore Partner Electives</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Start learning right away with certified courses provided by industry partner agencies in payments and banking.
                </p>
              </div>
              <span className="text-xs font-semibold text-deep-600 dark:text-deep-400 mt-4 flex items-center gap-1">
                Browse catalog <ArrowRight size={12} />
              </span>
            </Link>

            <Link
              to="/notifications"
              className="rounded-lg border border-gray-200/90 dark:border-gray-800 p-4 hover:border-deep-600/40 dark:hover:border-deep-500/50 hover:shadow-sm transition-all bg-card flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3">
                  <Calendar size={18} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">3. Orientation Alerts</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Receive notifications and live calendar invites as soon as your cohort orientation session is published.
                </p>
              </div>
              <span className="text-xs font-semibold text-deep-600 mt-4 flex items-center gap-1">
                View alerts <ArrowRight size={12} />
              </span>
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

  return (
    <div className="w-full space-y-6">
      {/* Dashboard Top Header */}
      <DashboardHeader
        dataTour="student-header"
        title="My Learning Dashboard"
        subtitle={`${data.profile?.name || user?.name || user?.email || 'Fellow'} • ${data.profile?.track || 'Fintech Core'} Track • ${data.cohort?.name}`}
        onStartTour={() => setTourOpen(true)}
        actions={
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-card border border-border rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 shadow-sm text-[11px] sm:text-xs">
              <span className="font-semibold text-foreground" aria-live="polite">{overallPercent}%</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground hidden xs:inline">{completedLessons}/{totalLessons} lessons</span>
              <span className="text-muted-foreground xs:hidden">{completedLessons}/{totalLessons}</span>
              <div className="w-10 sm:w-16 h-1.5 bg-muted rounded-full overflow-hidden ml-0.5 sm:ml-1">
                <div className="h-full bg-deep-600 rounded-full" style={{ width: `${overallPercent}%` }} />
              </div>
            </div>
            <Button asChild size="sm" className="bg-deep-600 text-white hover:bg-deep-700 text-xs font-semibold h-8 sm:h-9">
              <Link to="/my-learning">
                <BookOpen size={13} className="mr-1.5" />
                View Curriculum
              </Link>
            </Button>
          </div>
        }
      />

      {/* Week-by-week study path */}
      <section aria-label="Week-by-week study path" className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Study Path
          </h2>
          <span className="text-[10px] font-semibold text-muted-foreground">
            Complete each week before the next unlocks
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {weekProgress.map((week, idx) => {
            const isCurrent = week.id === currentModule?.id
            const isLocked = idx > 0 && !weekProgress[idx - 1].isComplete
            return (
              <div
                key={week.id}
                className={`rounded-xl border p-3.5 shadow-sm transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-2 border-blue-600 bg-card ring-2 ring-blue-500/30 shadow-md'
                    : week.isComplete
                    ? 'border border-emerald-600/60 bg-card'
                    : isLocked
                    ? 'border border-border/60 bg-card/40 opacity-70'
                    : 'border border-border bg-card hover:border-border/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span
                      className={`text-[11px] font-bold tracking-wide ${
                        isCurrent
                          ? 'text-blue-700 dark:text-blue-300'
                          : week.isComplete
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      Weeks {week.week_start}{week.week_end && week.week_end !== week.week_start ? `–${week.week_end}` : ''}
                    </span>
                    {isCurrent ? (
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                        Active
                      </span>
                    ) : week.isComplete ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        Done
                      </span>
                    ) : isLocked ? (
                      <span className="text-[10px] font-medium text-amber-500 dark:text-amber-400 flex items-center gap-1">
                        <Lock size={10} />
                        Locked
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-muted-foreground">
                        Ready
                      </span>
                    )}
                  </div>

                  <h4
                    className={`text-xs font-bold leading-snug line-clamp-1 mb-2.5 ${
                      isCurrent
                        ? 'text-foreground'
                        : week.isComplete
                        ? 'text-foreground'
                        : 'text-foreground/80'
                    }`}
                    title={week.title}
                  >
                    {week.title}
                  </h4>
                </div>

                <div>
                  <div className="h-1.5 w-full rounded-full bg-muted dark:bg-slate-800 mb-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        week.isComplete
                          ? 'bg-emerald-500 dark:bg-emerald-400'
                          : isCurrent
                          ? 'bg-blue-600 dark:bg-blue-500'
                          : 'bg-muted-foreground/30'
                      }`}
                      style={{ width: `${week.percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={`font-medium ${
                        week.isComplete
                          ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {week.completed}/{week.total} lessons
                    </span>
                    <span className="font-semibold text-foreground/80">{week.percent}%</span>
                  </div>

                  {isLocked && (
                    <span className="text-[10px] text-amber-500/90 dark:text-amber-400/90 font-medium mt-1.5 block truncate">
                      Finish prior week first
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Primary Section: Continue Learning Hero (2/3) + Next Live Session (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RESUME LEARNING HERO CARD */}
        <Card data-tour="student-current-learning" className="lg:col-span-2 border border-border shadow-sm rounded-xl bg-card overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800/80 bg-blue-50 dark:bg-blue-950/40">
                  Active Module • Weeks {currentModule?.week_start || 1}-{currentModule?.week_end || 2}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {currentModule?.stage ? currentModule.stage.replace('_', ' ') : 'Foundations'}
                </span>
              </div>
              <Badge variant="outline" className="text-[11px] font-medium border-border text-foreground">
                {currentModuleCompleted}/{currentLessons.length} Completed
              </Badge>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {!currentModule ? (
                <div className="py-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground mx-auto mb-2">
                    <BookOpen size={18} />
                  </div>
                  <h3 className="text-base font-bold text-foreground">No active module published</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Your cohort syllabus will unlock as scheduled.</p>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-tight">
                      {currentModule.title}
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                      {currentModule.domain || 'Fintech Core Systems'} • Practical hands-on curriculum
                    </p>
                  </div>

                    {/* NEXT UP LESSON CALLOUT BOX */}
                    <div className="rounded-xl border border-border bg-muted/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-blue-500/50 dark:hover:border-blue-400 transition-colors">
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                          <PlayCircle size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                              {data.resumeLesson ? 'Resume' : 'Up Next'}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock size={11} />
                              {resumeTarget?.duration_minutes ? `${resumeTarget.duration_minutes} min` : 'Self-paced'}
                            </span>
                          </div>
                          <p className="text-sm sm:text-base font-bold text-foreground truncate mt-0.5" title={resumeTarget?.title || 'Start Coursework'}>
                            {resumeTarget?.title || 'Start Coursework'}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => navigate(resumeTarget ? `/lesson/${resumeTarget.id}` : '/my-learning')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 shrink-0 shadow-sm"
                      >
                        {data.resumeLesson ? 'Resume Lesson' : 'Start Lesson'}
                        <ArrowRight size={14} className="ml-1.5" />
                      </Button>
                    </div>
                </>
              )}
            </div>
          </div>

          {/* Module Progress Bar Footer */}
          {currentModule && (
            <div className="px-5 sm:px-6 py-3.5 bg-muted/20 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">
                Module Progress: <strong className="text-foreground" aria-live="polite">{currentModulePercent}%</strong> ({currentModuleCompleted} of {currentLessons.length} lessons finished)
              </span>
              <div className="w-full sm:w-48 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${currentModulePercent}%` }}
                />
              </div>
            </div>
          )}
        </Card>

        {/* NEXT LIVE SESSION CARD */}
        <Card data-tour="student-live-class" className="border border-border shadow-sm rounded-xl bg-card overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Video size={16} className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-foreground leading-tight">Live Session</h3>
              </div>
              <Button asChild variant="outline" size="sm" className="text-xs border-border">
                <Link to="/live-classes">Calendar</Link>
              </Button>
            </div>

            <CardContent className="p-5 space-y-4">
              {nextLiveClass ? (
                <>
                  <div className="space-y-1.5">
                    <Badge variant={nextLiveClass.status === 'live' ? 'solidEmerald' : 'solidBlue'} className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                      {nextLiveClass.status === 'live' ? '● Live Now' : 'Scheduled Workshop'}
                    </Badge>
                    <h4 className="text-base font-bold text-foreground leading-snug pt-1">
                      {nextLiveClass.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {nextLiveClass.description || 'Cohort live class and interactive Q&A session with faculty.'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted/40 border border-border p-3 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-foreground">
                      <Calendar size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="font-semibold text-foreground">
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

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Video size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>{nextLiveClass.is_offline ? nextLiveClass.venue : 'Virtual Live Stream'}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    {nextLiveClass.meet_url ? (
                      <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">
                        <a href={nextLiveClass.meet_url} target="_blank" rel="noreferrer">
                          <Video size={14} className="mr-1.5" />
                          Join Live Stream
                        </a>
                      </Button>
                    ) : (
                      <Button asChild variant="outline" size="sm" className="w-full text-xs border-border">
                        <Link to="/live-classes">View Session Details</Link>
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground mx-auto">
                    <Calendar size={18} />
                  </div>
                  <p className="text-sm font-semibold text-foreground">No live sessions today</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Weekly live masterclasses and squad mentoring sessions are published ahead of schedule.
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-3 text-xs border-border">
                    <Link to="/live-classes">View Class Schedule</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </div>

          <div className="px-5 py-3 bg-muted/20 border-t border-border text-center">
            <Link to="/mentor-clinics" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              Need 1-on-1 guidance? Book a slot in Mentor Clinics →
            </Link>
          </div>
        </Card>
      </div>

      {/* Middle Section: Active Tasks & Labs (2/3) + My Squad (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ACTIONABLE TASKS & LABS */}
        <Card data-tour="student-tasks" className="lg:col-span-2 border border-border shadow-sm rounded-xl bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
            <div>
              <h3 className="text-base font-bold text-foreground leading-tight">Active Tasks & Labs</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Hands-on coding exercises awaiting submission or grading</p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs border-border">
              <Link to="/lab-workspace">
                Lab Workspace
                <ArrowRight size={13} className="ml-1.5" />
              </Link>
            </Button>
          </div>

          <CardContent className="p-5">
            {pendingLabs.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-1">
                  <CheckCircle2 size={18} />
                </div>
                <p className="text-sm font-semibold text-foreground">You&apos;re all caught up!</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  No pending lab assignments or required remediations. Keep progressing through the modules.
                </p>
                <Button asChild size="sm" variant="outline" className="mt-2 text-xs border-border">
                  <Link to="/my-learning">Explore upcoming modules</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {pendingLabs.slice(0, 4).map((lab) => {
                  const isSubmitted = lab.status === 'submitted'
                  const deadline = getDeadlineInfo(lab.due_date)
                  return (
                    <div key={lab.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Code2 size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
                          <p className="text-sm font-semibold text-foreground truncate" title={lab.title}>{lab.title}</p>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>Max score: {lab.max_score} pts</span>
                          {deadline && (
                            <>
                              <span>•</span>
                              <span className={`px-2 py-0.5 rounded text-[11px] ${deadline.badgeClass}`}>
                                {deadline.label}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <Badge
                          variant={isSubmitted ? 'warning' : 'secondary'}
                          className="text-[11px] font-bold capitalize"
                        >
                          {isSubmitted ? 'Awaiting grading' : 'Pending submission'}
                        </Badge>
                        <Button asChild size="sm" variant="outline" className="h-8 px-3 text-xs border-border text-foreground dark:text-white hover:bg-muted">
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
        <Card data-tour="student-squad" className="border border-border shadow-sm rounded-xl bg-card overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
              <div>
                <h3 className="text-base font-bold text-foreground leading-tight">My Squad</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">Cohort collaborative unit</p>
              </div>
              <Button asChild variant="outline" size="sm" className="text-xs border-border">
                <Link to="/my-squad">Squad Page</Link>
              </Button>
            </div>

            <CardContent className="p-5">
              {data.squad ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">{data.squad.name}</p>
                    <span className="text-[11px] font-medium text-muted-foreground px-2 py-0.5 rounded border border-border">
                      {data.members.length} teammates
                    </span>
                  </div>

                  <div className="divide-y divide-border pt-1">
                    {data.members.slice(0, 4).map((member) => (
                      <div key={member.id} className="flex items-center justify-between py-2.5 text-xs first:pt-0 last:pb-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-300 shrink-0">
                            {member.name?.charAt(0)?.toUpperCase() || 'M'}
                          </div>
                          <span className="font-semibold text-foreground truncate">{member.name}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-medium capitalize shrink-0 ml-2 border-border text-foreground">
                          {member.track || 'Student'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground mx-auto">
                    <Users size={18} />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Squad forming</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    You will be grouped with cohort teammates for practical fintech sprint use-cases.
                  </p>
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-4 bg-muted/20 border-t border-border">
            <Button asChild variant="outline" size="sm" className="w-full text-xs border-border">
              <Link to="/my-squad">
                <Users size={13} className="mr-1.5" />
                Open Squad Workspace
              </Link>
            </Button>
          </div>
        </Card>
      </div>

      {/* Work Achievements & Mastery Badges Section */}
      <div data-tour="student-achievements" className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Work Achievements & Mastery Badges
            </h3>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {studentAchievements.filter((a) => a.achievedAt !== null).length} of {studentAchievements.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {studentAchievements.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              badgeSize="sm"
              className="bg-card border-border shadow-sm hover:border-blue-500/50 dark:hover:border-blue-400 hover:shadow-md transition-all text-center py-3.5 px-2"
            />
          ))}
        </div>
      </div>

      {/* Bottom Section: Academy Quick Launchpad */}
      <div data-tour="student-launchpad" className="space-y-3 pt-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Academy Launchpad
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/lab-workspace"
            className="rounded-xl border border-border bg-card p-4 shadow-sm hover:border-blue-500/50 dark:hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
              <Code2 size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Lab Workspace</p>
              <p className="text-xs text-muted-foreground mt-0.5">Submit & inspect code repositories</p>
            </div>
          </Link>

          <Link
            to="/live-classes"
            className="rounded-xl border border-border bg-card p-4 shadow-sm hover:border-emerald-500/50 dark:hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
              <Video size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Live Classes</p>
              <p className="text-xs text-muted-foreground mt-0.5">Workshops, streams & recordings</p>
            </div>
          </Link>

          <Link
            to="/peer-reviews"
            className="rounded-xl border border-border bg-card p-4 shadow-sm hover:border-purple-500/50 dark:hover:border-purple-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3">
              <Users size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Peer Reviews</p>
              <p className="text-xs text-muted-foreground mt-0.5">Evaluate cohort teammates</p>
            </div>
          </Link>

          <Link
            to="/partner-courses"
            className="rounded-xl border border-border bg-card p-4 shadow-sm hover:border-amber-500/50 dark:hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3">
              <Compass size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Partner Courses</p>
              <p className="text-xs text-muted-foreground mt-0.5">Industry certifications</p>
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

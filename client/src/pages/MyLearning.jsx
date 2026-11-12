import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Award,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Clock,
  Compass,
  Landmark,
  Layers,
  PlayCircle,
  Rocket,
  Server,
  Sparkles,
  Target,
  TrendingUp,
  Lock,
  ArrowRight,
} from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Book } from '../components/ui/book'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { SkeletonCard } from '../components/ui/skeleton-card'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/backend'
import { cn } from '../lib/utils'
import toast from 'react-hot-toast'

const STAGE_LABELS = {
  foundations: 'Foundations',
  domain_immersion: 'Domain Immersion',
  live_projects: 'Live Projects',
  certification: 'Certification',
}

const LESSON_TYPE_COLORS = {
  concept: 'text-deep-700 border-deep-200 dark:text-blue-400 dark:border-blue-900/50 dark:bg-blue-950/30',
  demonstration: 'text-deep-700 border-deep-200 dark:text-blue-400 dark:border-blue-900/50 dark:bg-blue-950/30',
  video: 'text-deep-700 border-deep-200 dark:text-blue-400 dark:border-blue-900/50 dark:bg-blue-950/30',
  audio: 'text-purple-700 border-purple-200 dark:text-purple-400 dark:border-purple-900/50 dark:bg-purple-950/30',
  lab: 'text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-900/50 dark:bg-emerald-950/30',
  assessment: 'text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-900/50 dark:bg-amber-950/30',
}

const MODULE_STATUS_LABELS = {
  completed: 'Completed',
  in_progress: 'In progress',
  not_started: 'Not started',
  locked: 'Locked',
}

const DOMAIN_COVERS = {
  FaaS: { color: '#0000cc', icon: Rocket },
  FinCore: { color: '#047857', icon: Landmark },
  FinOps: { color: '#b45309', icon: TrendingUp },
  FinInfra: { color: '#334155', icon: Server },
}

const STAGE_ICONS = {
  foundations: BookOpen,
  domain_immersion: Layers,
  live_projects: Rocket,
  certification: Award,
}

const FALLBACK_COVERS = [
  { color: '#0000cc', icon: BookOpen },
  { color: '#1e3a8a', icon: Layers },
  { color: '#0f766e', icon: Target },
  { color: '#7c2d12', icon: Compass },
  { color: '#4c1d95', icon: Sparkles },
]

const MODULE_BOOK_WIDTH = { sm: 132, md: 148, lg: 164 }

const getModuleCover = (module, index) => {
  if (module.domain && DOMAIN_COVERS[module.domain]) {
    return DOMAIN_COVERS[module.domain]
  }

  const stageIcon = STAGE_ICONS[module.stage]
  const fallback = FALLBACK_COVERS[index % FALLBACK_COVERS.length]
  return stageIcon ? { ...fallback, icon: stageIcon } : fallback
}

const formatTime = (minutes) => {
  if (!minutes) return '0 min'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function MyLearning() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [modules, setModules] = useState([])
  const [lessons, setLessons] = useState([])
  const [activeModuleId, setActiveModuleId] = useState(null)
  const [openingModuleId, setOpeningModuleId] = useState(null)
  const moduleDetailRef = useRef(null)
  const openTimerRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState({})
  const [overallStats, setOverallStats] = useState({
    completion: 0,
    attendance: 0,
    labsComplete: 0,
    currentGrade: 0,
  })

  useEffect(() => {
    loadData()
  }, [user?.id])

  useEffect(() => () => window.clearTimeout(openTimerRef.current), [])

  const loadData = async () => {
    try {
      if (!user?.id) { setLoading(false); return }
      const { data: enrolments } = await api
        .from('enrolments')
        .select('cohort_id, track, squad_id')
        .eq('user_id', user.id)
        .in('status', ['enrolled', 'active'])
      if (!enrolments || enrolments.length === 0) {
        setLoading(false)
        return
      }
      const enrolment = enrolments[0]
      // Modules ordered by week_start so the curriculum flows week 1 -> week N
      const { data: modulesData } = await api
        .from('modules')
        .select('*')
        .eq('cohort_id', enrolment.cohort_id)
        .eq('is_published', true)
        .order('week_start', { ascending: true })
      setModules(modulesData || [])
      const moduleIds = modulesData?.map(m => m.id) || []
      if (moduleIds.length > 0) {
        const { data: lessonsData } = await api
          .from('lessons')
          .select('*')
          .in('module_id', moduleIds)
          .order('module_id', { ascending: true })
          .order('order_index', { ascending: true })
        setLessons(lessonsData || [])
        const lessonIds = lessonsData?.map(l => l.id) || []
        const { data: progressData } = await api
          .from('lesson_progress')
          .select('*')
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds)
        const progressMap = {}
        progressData?.forEach(p => {
          progressMap[p.lesson_id] = p
        })
        setProgress(progressMap)
        const totalLessons = lessonsData.length
        const completedLessons = progressData?.filter(p => p.is_completed).length || 0
        const overallCompletion = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
        setOverallStats({
          completion: overallCompletion,
          attendance: 0,
          labsComplete: completedLessons,
          currentGrade: 0,
        })
      }
      // Active module = first incomplete module (gating: future modules locked)
      const firstIncomplete = (modulesData || []).find(m => {
        const modLessons = (lessons || []).filter(l => l.module_id === m.id)
        return modLessons.some(l => !progress[l.id]?.is_completed)
      }) || (modulesData?.[0]?.id || null)
      setActiveModuleId(firstIncomplete)
      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setLoading(false)
    }
  }

  const moduleComplete = (module) => {
    const modLessons = lessons.filter(l => l.module_id === module.id)
    return modLessons.length > 0 && modLessons.every(l => progress[l.id]?.is_completed)
  }

  const moduleLocked = (module, index) => {
    // First module is never locked; every later module is locked until the
    // immediately preceding module is 100% complete.
    if (index === 0) return false
    const prevModule = modules[index - 1]
    return !moduleComplete(prevModule)
  }

  const currentModule = modules.find(m => m.id === activeModuleId) || modules[0] || null
  const currentModuleIndex = modules.findIndex(m => m.id === activeModuleId)
  const currentModuleLessons = currentModule ? lessons.filter(l => l.module_id === currentModule.id) : []
  const nextIncompleteLesson = currentModuleLessons.find(l => !progress[l.id]?.is_completed)

  const handleOpenModule = (module) => {
    if (moduleLocked(module, modules.findIndex(m => m.id === module.id))) {
      const prevModule = modules[modules.findIndex(m => m.id === module.id) - 1]
      toast.error(`Complete Week ${prevModule?.week_start ?? ''}–${prevModule?.week_end ?? ''} first`)
      return
    }
    window.clearTimeout(openTimerRef.current)
    setOpeningModuleId(module.id)
    openTimerRef.current = window.setTimeout(() => {
      setActiveModuleId(module.id)
      setOpeningModuleId(null)
      window.requestAnimationFrame(() => {
        moduleDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }, 260)
  }

  const handleStartModule = () => {
    if (!currentModule) return
    const firstLesson = nextIncompleteLesson || currentModuleLessons[0]
    if (firstLesson) navigate(`/lesson/${firstLesson.id}`)
  }

  const handleLessonClick = (lesson) => {
    // Gate: lesson is locked if its module is not the current active module
    // or if a previous lesson in the same module is incomplete.
    const modIdx = modules.findIndex(m => m.id === lesson.module_id)
    if (moduleLocked(modules[modIdx], modIdx)) return
    const priorLessons = lessons
      .filter(l => l.module_id === lesson.module_id && l.order_index < lesson.order_index)
    const priorIncomplete = priorLessons.some(l => !progress[l.id]?.is_completed)
    if (priorIncomplete) {
      toast.error('Complete the previous lesson first')
      return
    }
    navigate(`/lesson/${lesson.id}`)
  }

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        <div className="mb-8">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-6">
            <Skeleton className="h-4 w-8" variant="rect" />
            <Skeleton className="h-4 w-1/3" variant="text" />
          </h2>
          <div className="flex flex-wrap items-start gap-x-8 gap-y-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-[132px] sm:w-[148px] lg:w-[164px]">
                <div className="h-40 w-full rounded-lg bg-muted animate-pulse mb-3" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-2/3" variant="text" />
                  <div className="h-1 w-full rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse mb-2" />
                  <Skeleton className="h-4 w-1/2" variant="text" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="scroll-mt-24 border-t border-gray-200/80 dark:border-gray-800 pt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Skeleton className="h-6 w-1/2" variant="text" />
                <Skeleton className="h-4 w-1/3" variant="text" />
              </div>
              <Skeleton className="h-8 w-20" variant="rect" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="animate-pulse cursor-pointer hover:border-brand-200 dark:hover:border-gray-700 transition-colors duration-150">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-8 w-8 rounded-md bg-muted animate-pulse shrink-0" />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <Skeleton className="h-4 w-2/3" variant="text" />
                        <Skeleton className="h-3 w-1/3" variant="text" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <Skeleton className="h-5 w-12 rounded-full" variant="rect" />
                      <Skeleton className="h-8 w-[72px]" variant="rect" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
        </div>
      </div>
    )
  }

  if (!modules || modules.length === 0) {
    return (
      <div className="w-full">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No modules found</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">You are not enrolled in any cohort yet.</p>
        </div>
      </div>
    )
  }

  const overallCompletion = overallStats.completion

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">My Learning</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your learning path flows week by week. Complete each week before the next unlocks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{overallCompletion}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Overall Completion</p>
              </div>
              <div className="h-8 w-8 rounded-full border-4 border-brand-600 border-t-transparent flex items-center justify-center">
                <ChevronRight size={14} className="text-brand-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{overallStats.labsComplete}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lessons Complete</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-blue-950/60 flex items-center justify-center">
                <BookOpen size={14} className="text-brand-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentModule?.domain ?? 'All'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Domain</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center">
                <PlayCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentModule ? `Week ${currentModule.week_start}` : 'Week 1'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Week</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center">
                <Clock size={14} className="text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <section aria-labelledby="course-modules-heading" className="mb-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="course-modules-heading"
                className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
              >
                <BookOpen size={14} />
                Course Modules
              </h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Work through each week in order. The next week unlocks when the current week is 100% complete.
              </p>
            </div>
            <span className="text-[11px] uppercase tracking-wide text-gray-400">
              {modules.length} {modules.length === 1 ? 'module' : 'modules'}
            </span>
          </div>

          <div className="flex flex-wrap items-start gap-x-8 gap-y-10">
            {modules.map((module, index) => {
              const moduleLessonsList = lessons.filter(l => l.module_id === module.id)
              const moduleLessonsCount = moduleLessonsList.length
              const moduleCompleted = moduleLessonsList.filter(
                (lesson) => progress[lesson.id]?.is_completed
              ).length
              const isLocked = moduleLocked(module, index)
              const isActive = module.id === activeModuleId
              const isOpening = module.id === openingModuleId
              const progressPercent =
                moduleLessonsCount > 0
                  ? Math.round((moduleCompleted / moduleLessonsCount) * 100)
                  : 0
              const cover = getModuleCover(module, index)
              const CoverIcon = cover.icon

              return (
                <div
                  key={module.id}
                  className="w-[132px] sm:w-[148px] lg:w-[164px]"
                >
                  <button
                    type="button"
                    onClick={() => handleOpenModule(module)}
                    disabled={isLocked}
                    aria-label={`Open module: ${module.title}`}
                    aria-pressed={isActive}
                    className={`book-button group block w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-600 focus-visible:ring-offset-4 focus-visible:ring-offset-gray-50 ${
                      isLocked
                        ? 'opacity-60 grayscale border-gray-200 dark:border-gray-700 cursor-not-allowed'
                        : isActive
                        ? 'rounded-lg ring-2 ring-deep-600 ring-offset-4 ring-offset-gray-50'
                        : ''
                    }`}
                  >
                    <Book
                      title={module.title}
                      width={MODULE_BOOK_WIDTH}
                      color={cover.color}
                      textColor="#111827"
                      variant="stripe"
                      isOpen={isOpening}
                      illustration={
                        <div className="flex h-full w-full items-end justify-end p-4 text-white/80">
                          <CoverIcon size={26} strokeWidth={1.5} aria-hidden="true" />
                          {isLocked && <Lock size={14} strokeWidth={2} className="absolute bottom-2 right-2" />}
                        </div>
                      }
                    />
                  </button>

                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        {STAGE_LABELS[module.stage] || module.stage}
                      </span>
                      <span className="shrink-0 text-[10px] text-gray-400">
                        {moduleCompleted}/{moduleLessonsCount}
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-deep-600"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="truncate text-[10px] text-gray-400">
                      {isLocked ? MODULE_STATUS_LABELS.locked : (() => {
                        const modCompleted = moduleLessonsList.filter(
                          (l) => progress[l.id]?.is_completed
                        ).length
                        if (moduleLessonsList.length > 0 && modCompleted === moduleLessonsList.length) return MODULE_STATUS_LABELS.completed
                        if (modCompleted > 0) return MODULE_STATUS_LABELS.in_progress
                        return MODULE_STATUS_LABELS.not_started
                      })()} ·{' '}
                      {module.domain || module.track || 'Academy'}
                      {` · Week ${module.week_start}${module.week_end !== module.week_start ? `-${module.week_end}` : ''}`}
                    </p>
                    {isLocked && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
                        Complete previous week to unlock
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {currentModule && (
          <div
            ref={moduleDetailRef}
            id="module-detail"
            className="scroll-mt-24 border-t border-gray-200/80 dark:border-gray-800 pt-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{currentModule.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {STAGE_LABELS[currentModule.stage]}
                  {currentModule.domain ? ` · ${currentModule.domain}` : ''}
                  {` · Week ${currentModule.week_start}${currentModule.week_end !== currentModule.week_start ? `-${currentModule.week_end}` : ''}`}
                </p>
              </div>
              <Button
                className="shrink-0"
                onClick={handleStartModule}
                disabled={currentModuleLessons.length === 0}
              >
                {currentModuleLessons.some((lesson) => progress[lesson.id]?.is_completed)
                  ? 'Continue Module'
                  : 'Start Module'}
              </Button>
            </div>
            <div className="space-y-3">
              {currentModuleLessons.map((lesson) => {
                const lessonProgress = progress[lesson.id]
                const isCompleted = lessonProgress?.is_completed || false
                const modIdx = modules.findIndex(m => m.id === lesson.module_id)
                const lessonLocked = moduleLocked(modules[modIdx], modIdx)
                const priorLessons = lessons
                  .filter(l => l.module_id === lesson.module_id && l.order_index < lesson.order_index)
                const priorIncomplete = priorLessons.some(l => !progress[l.id]?.is_completed)
                return (
                  <Card
                    key={lesson.id}
                    onClick={() => handleLessonClick(lesson)}
                    className={`cursor-pointer hover:border-brand-200 dark:hover:border-gray-700 transition-colors duration-150 ${
                      isCompleted ? 'border-brand-100 dark:border-blue-900/50 bg-brand-50/50 dark:bg-blue-950/20' : ''
                    } ${lessonLocked || priorIncomplete ? 'opacity-50' : ''}`}
                  >
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-8 w-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0">
                          {isCompleted ? (
                            <CheckCircle className="text-emerald-500" size={18} />
                          ) : lessonLocked || priorIncomplete ? (
                            <Lock size={18} className="text-amber-500" />
                          ) : (
                            <PlayCircle size={18} className="text-deep-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-sm font-semibold truncate text-gray-900 dark:text-white" title={lesson.title}>
                            {lesson.title}
                          </CardTitle>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            {formatTime(lesson.duration_minutes)}
                            {lessonLocked ? ' · Locked' : priorIncomplete ? ' · Previous lesson required' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <Badge
                          variant="outline"
                          className={cn(
                            'capitalize text-[11px] font-medium shrink-0',
                            LESSON_TYPE_COLORS[lesson.type] || 'text-gray-600 border-gray-200 dark:border-gray-700 dark:text-gray-300'
                          )}
                        >
                          {lesson.type}
                        </Badge>
                        {!lessonLocked && !priorIncomplete ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 min-w-[72px] text-xs font-semibold dark:border-gray-700 dark:hover:bg-gray-800"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleLessonClick(lesson)
                            }}
                          >
                            {isCompleted ? 'Review' : 'Start'}
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  )
}

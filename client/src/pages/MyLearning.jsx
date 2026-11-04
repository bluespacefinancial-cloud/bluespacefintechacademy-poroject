import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Clock, CheckCircle, ChevronRight, PlayCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { supabase } from '../lib/supabase'

const STAGE_LABELS = {
  foundations: 'Foundations',
  domain_immersion: 'Domain Immersion',
  live_projects: 'Live Projects',
  certification: 'Certification',
}

const LESSON_TYPE_COLORS = {
  concept: 'bg-blue-50 text-blue-700 border-blue-200',
  demonstration: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  video: 'bg-brand-50 text-brand-700 border-brand-200',
  audio: 'bg-purple-50 text-purple-700 border-purple-200',
  lab: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  assessment: 'bg-amber-50 text-amber-700 border-amber-200',
}

const formatTime = (minutes) => {
  if (!minutes) return '0 min'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function MyLearning() {
  const navigate = useNavigate()
  const [modules, setModules] = useState([])
  const [lessons, setLessons] = useState([])
  const [activeModuleId, setActiveModuleId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState({})
  const [overallStats, setOverallStats] = useState({
    overallCompletion: 0,
    attendance: 0,
    labsComplete: 0,
    currentGrade: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: enrolments } = await supabase
        .from('enrolments')
        .select('cohort_id, track, squad_id')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (!enrolments || enrolments.length === 0) {
        setLoading(false)
        return
      }

      const enrolment = enrolments[0]

      const { data: modulesData } = await supabase
        .from('modules')
        .select('*')
        .eq('cohort_id', enrolment.cohort_id)
        .order('created_at', { ascending: true })
      setModules(modulesData || [])

      const moduleIds = modulesData?.map(m => m.id) || []
      if (moduleIds.length > 0) {
        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('*')
          .in('module_id', moduleIds)
          .order('order_index', { ascending: true })
        setLessons(lessonsData || [])

        const { data: progressData } = await supabase
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
          overallCompletion,
          attendance: 0,
          labsComplete: completedLessons,
          currentGrade: 0,
        })
      }

      setActiveModuleId(modulesData?.[0]?.id || null)
      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setLoading(false)
    }
  }

  const currentModule = modules.find(m => m.id === activeModuleId) || modules[0] || null

  const handleLessonClick = (lesson) => {
    if (lesson.completed || lesson.status === 'locked') return
    navigate(`/lesson/${lesson.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading your learning...</span>
        </div>
      </div>
    )
  }

  if (!modules || modules.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-deep-600 mb-2">No modules found</h1>
          <p className="text-sm text-gray-500">You are not enrolled in any cohort yet.</p>
        </div>
      </div>
    )
  }

  const moduleLessons = lessons.filter(l => l.module_id === currentModule.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-deep-600 mb-2">My Learning</h1>
        <p className="text-sm text-gray-500">
          Your learning path through the BlueSPACE Fintech Academy framework
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-deep-600">{overallStats.overallCompletion}%</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Overall Completion</p>
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
                <p className="text-2xl font-bold text-deep-600">{overallStats.lessonsComplete}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Lessons Complete</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center">
                <BookOpen size={14} className="text-brand-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-deep-600">{currentModule?.domain || 'All'}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Current Domain</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <PlayCircle size={14} className="text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-deep-600">{currentModule?.week || 'Week 1'}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Current Week</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock size={14} className="text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <h2 className="text-sm font-semibold text-deep-600 mb-4 flex items-center gap-2">
          <BookOpen size={14} className="mr-1.5" />
          Course Modules
        </h2>
        <div className="space-y-3">
          {modules.map((module) => {
            const moduleLessonsCount = lessons.filter(l => l.module_id === module.id).length
            const moduleCompleted = moduleLessonsCount > 0
              ? lessons.filter(l => l.module_id === module.id).filter(l => progress[l.id]?.is_completed).length
              : 0
            const moduleStatus = moduleLessonsCount > 0 && moduleCompleted === moduleLessonsCount ? 'completed' :
              moduleLessonsCount > 0 && moduleCompleted > 0 ? 'in_progress' : 'locked'

            return <Card
                key={module.id}
                onClick={() => setActiveModuleId(module.id)}
                className={`cursor-pointer hover:border-brand-200 transition-colors duration-150 ${
                  moduleStatus === 'locked' ? 'opacity-75 pointer-events-none' : ''
                }`}
              >
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md flex items-center justify-center text-xs font-bold">
                      {moduleStatus === 'completed' ? (
                        <CheckCircle className="text-white" />
                      ) : moduleStatus === 'in_progress' ? (
                        <Clock className="text-brand-600" />
                      ) : (
                        <ChevronRight className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm">{module.title}</CardTitle>
                      <CardDescription className="text-[10px]">
                        {module.week} · {module.track} track
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={
                      moduleStatus === 'completed'
                        ? 'secondary'
                        : moduleStatus === 'in_progress'
                        ? 'default'
                        : 'outline'
                    }
                  >
                    {STAGE_LABELS[module.stage]}
                    {module.domain && ` · ${module.domain}`}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      {moduleStatus}
                    </span>
                    <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                      Open Module
                    </Button>
                  </div>
                  <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-600"
                      style={{ width: moduleLessonsCount > 0 ? `${Math.round((moduleCompleted / moduleLessonsCount) * 100)}%` : '0%' }}
                    />
                </div>
              </CardContent>
            </Card>
          })}
      </div>

      {currentModule && (
        <div className="lg:col-span-2 mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-deep-600">{currentModule.title}</h2>
              <p className="text-sm text-gray-500">
                {STAGE_LABELS[currentModule.stage]}{currentModule.domain ? ` · ${currentModule.domain}` : ''}
              </p>
            </div>
            <Button className="shrink-0">Start Module</Button>
          </div>
          <div className="space-y-3">
            {moduleLessons.map((lesson) => {
              const lessonProgress = progress[lesson.id]
              const isCompleted = lessonProgress?.is_completed || false
              return (
                <Card
                  key={lesson.id}
                  onClick={() => handleLessonClick(lesson)}
                  className={`cursor-pointer hover:border-brand-200 transition-colors duration-150 ${
                    isCompleted ? 'border-brand-100 bg-brand-50' : ''
                  }`}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-8 w-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="text-white" />
                        ) : (
                          <PlayCircle size={14} className="text-brand-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{lesson.title}</CardTitle>
                          <Badge className={LESSON_TYPE_COLORS[lesson.type]}>{LESSON_TYPE_LABELS[lesson.type]}</Badge>
                        </div>
                        <p className="text-[10px] text-gray-500">{formatTime(lesson.duration_minutes)}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                      {isCompleted ? 'Review' : 'Start'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

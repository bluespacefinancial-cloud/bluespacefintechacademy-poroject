import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Clock, CheckCircle, ChevronRight, PlayCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

const STAGE_LABELS = {
  foundations: 'Foundations',
  domain_immersion: 'Domain Immersion',
  live_projects: 'Live Projects',
  certification: 'Certification',
}

const MOCK_MODULES = [
  {
    id: 1,
    title: 'Fintech and Payments Fundamentals',
    stage: 'foundations',
    domain: null,
    week: 'Week 1',
    duration: '3 hours',
    lessons: 4,
    completed: 3,
    status: 'in_progress',
  },
  {
    id: 2,
    title: 'Regulation, Compliance and Risk Basics',
    stage: 'foundations',
    domain: null,
    week: 'Week 1',
    duration: '2 hours',
    lessons: 3,
    completed: 0,
    status: 'locked',
  },
  {
    id: 3,
    title: 'AI in the Factory',
    stage: 'foundations',
    domain: null,
    week: 'Week 2',
    duration: '2 hours',
    lessons: 2,
    completed: 0,
    status: 'locked',
  },
  {
    id: 4,
    title: 'FinCore: Ledger and Transaction Engineering',
    stage: 'domain_immersion',
    domain: 'FinCore',
    week: 'Weeks 5-6',
    duration: '4 hours',
    lessons: 5,
    completed: 0,
    status: 'locked',
  },
  {
    id: 5,
    title: 'FinOps: Reconciliation and Reporting Pipeline',
    stage: 'domain_immersion',
    domain: 'FinOps',
    week: 'Week 7',
    duration: '4 hours',
    lessons: 4,
    completed: 0,
    status: 'locked',
  },
  {
    id: 6,
    title: 'FinInfra: CI/CD, Cloud and Observability',
    stage: 'domain_immersion',
    domain: 'FinInfra',
    week: 'Week 8',
    duration: '4 hours',
    lessons: 5,
    completed: 0,
    status: 'locked',
  },
]

const MOCK_LESSONS = [
  {
    id: 1,
    title: 'Introduction to Fintech',
    type: 'video',
    duration: '45 min',
    completed: true,
    video_url: '/videos/intro-fintech.mp4',
  },
  {
    id: 2,
    title: 'Money Movement and Payments',
    type: 'video',
    duration: '60 min',
    completed: true,
    video_url: '/videos/money-movement.mp4',
  },
  {
    id: 3,
    title: 'Guided Lab: Payment Flow',
    type: 'lab',
    duration: '90 min',
    completed: true,
  },
  {
    id: 4,
    title: 'Foundations Assessment',
    type: 'assessment',
    duration: '30 min',
    completed: false,
  },
  {
    id: 5,
    title: 'FaaS API Design Overview',
    type: 'video',
    duration: '55 min',
    completed: false,
    video_url: '/videos/faas-api-design.mp4',
  },
  {
    id: 6,
    title: 'FinCore Ledger Concepts (Audio)',
    type: 'audio',
    duration: '35 min',
    completed: false,
    audio_url: '/audio/fincore-ledger.mp3',
  },
]

const LESSON_TYPE_LABELS = {
  concept: 'Concept Session',
  demonstration: 'Factory Demo',
  video: 'Video Lesson',
  audio: 'Audio Lesson',
  lab: 'Guided Lab',
  assessment: 'Assessment',
}

const LESSON_TYPE_COLORS = {
  concept: 'bg-blue-50 text-blue-700 border-blue-200',
  demonstration: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  video: 'bg-brand-50 text-brand-700 border-brand-200',
  audio: 'bg-purple-50 text-purple-700 border-purple-200',
  lab: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  assessment: 'bg-amber-50 text-amber-700 border-amber-200',
}

export default function MyLearning() {
  const navigate = useNavigate()
  const [activeModuleId, setActiveModuleId] = useState(1)

  const currentModule = MOCK_MODULES.find((m) => m.id === activeModuleId)

  const handleLessonClick = (lesson) => {
    if (lesson.completed || lesson.status === 'locked') return
    navigate(`/lesson/${lesson.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-deep-600 mb-2">My Learning</h1>
        <p className="text-sm text-gray-500">
          Your learning path through the BlueSPACE Fintech Academy framework
        </p>
      </div>

      {/* Progress overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-deep-600">65%</p>
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
                <p className="text-2xl font-bold text-deep-600">12/18</p>
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
                <p className="text-2xl font-bold text-deep-600">4/6</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Domains</p>
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
                <p className="text-2xl font-bold text-deep-600">Week 1</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Current Week</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock size={14} className="text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modules list */}
      <div className="lg:col-span-2">
        <h2 className="text-sm font-semibold text-deep-600 mb-4 flex items-center gap-2">
          <BookOpen size={14} className="mr-1.5" />
          Course Modules
        </h2>
        <div className="space-y-3">
          {MOCK_MODULES.map((module) => (
            <Card
              key={module.id}
              className={`cursor-pointer hover:border-brand-200 transition-colors duration-150 ${
                module.status === 'locked' ? 'opacity-75 pointer-events-none' : ''
              }`}
              onClick={() => {
                setActiveModuleId(module.id)
                navigate(`/learning/module/${module.id}`)
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md flex items-center justify-center text-xs font-bold">
                    {module.status === 'completed' ? (
                      <CheckCircle className="text-white" />
                    ) : module.status === 'in_progress' ? (
                      <Clock className="text-brand-600" />
                    ) : (
                      <ChevronRight className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-sm">{module.title}</CardTitle>
                    <CardDescription className="text-[10px]">
                      {module.week} · {module.duration} · {module.completed}/{module.lessons} lessons
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant={
                    module.status === 'completed'
                      ? 'secondary'
                      : module.status === 'in_progress'
                      ? 'default'
                      : 'outline'
                  }
                >
                  {STAGE_LABELS[module.stage]}
                  {module.domain && ` · ${module.domain}`}
                </Badge>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    {module.status}
                  </span>
                  <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                    Open Module
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Active module details */}
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
            {MOCK_LESSONS.filter((l) => l.id <= currentModule.id * 2).map((lesson) => (
              <Card
                key={lesson.id}
                onClick={() => handleLessonClick(lesson)}
                className={`cursor-pointer hover:border-brand-200 transition-colors duration-150 ${
                  lesson.completed ? 'border-brand-100 bg-brand-50' : ''
                }`}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-8 w-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0">
                      {lesson.completed ? (
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
                      <p className="text-[10px] text-gray-500">{lesson.duration}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                    {lesson.completed ? 'Review' : 'Start'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Clock,
  Award,
  FileText,
  CheckCircle2,
  BookOpen,
  AlertCircle,
  Trophy,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import { api } from '../lib/backend'
import { useAuth } from '../context/AuthContext'
import { AchievementBadge } from '../components/ui/achievement-badge'

const DOMAIN_COLORS = {
  FaaS: { text: 'text-brand-700', border: 'border-brand-200', fill: 'bg-brand-600' },
  FinCore: { text: 'text-emerald-700', border: 'border-emerald-200', fill: 'bg-emerald-600' },
  FinOps: { text: 'text-amber-700', border: 'border-amber-200', fill: 'bg-amber-600' },
  FinInfra: { text: 'text-slate-700', border: 'border-slate-200', fill: 'bg-slate-600' },
  General: { text: 'text-gray-700', border: 'border-gray-200', fill: 'bg-gray-600' },
}

const STAGES = [
  { key: 'foundations', label: 'Foundations', weeks: 'Weeks 1-4', desc: 'Fintech core fundamentals, financial APIs, and environment architecture.' },
  { key: 'domain_immersion', label: 'Domain Immersion', weeks: 'Weeks 5-8', desc: 'Specialized track dive: FaaS, FinCore, FinOps, or FinInfra systems.' },
  { key: 'live_projects', label: 'Live Projects', weeks: 'Weeks 9-12', desc: 'Squad-based live banking sprints and technical deliverable submissions.' },
  { key: 'certification', label: 'Certification', weeks: 'Weeks 13-16', desc: 'Capstone review, faculty panel assessment, and industry credentials.' },
]

export default function Progress() {
  const { user } = useAuth()
  const [cohortName, setCohortName] = useState('')
  const [domains, setDomains] = useState([])
  const [stages, setStages] = useState([])
  const [statCards, setStatCards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [user?.id])

  const loadData = async () => {
    try {
      if (!user?.id) {
        setLoading(false)
        return
      }

      const { data: enrolments } = await api
        .from('enrolments')
        .select('cohort_id, track, cohorts(name)')
        .eq('user_id', user.id)
        .in('status', ['enrolled', 'active'])

      const activeEnrolment = enrolments?.[0]
      if (activeEnrolment?.cohorts?.name) {
        setCohortName(activeEnrolment.cohorts.name)
      }

      const cohortIds = [...new Set((enrolments || []).map((e) => e.cohort_id).filter(Boolean))]
      if (!cohortIds.length) {
        setStatCards([
          { label: 'Overall Completion', value: '0%', icon: BarChart3, bg: 'bg-brand-50 text-brand-700 border-brand-100' },
          { label: 'Attendance', value: '0%', icon: Clock, bg: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          { label: 'Labs Complete', value: '0/0', icon: FileText, bg: 'bg-amber-50 text-amber-700 border-amber-100' },
          { label: 'Current Grade', value: 'N/A', icon: Award, bg: 'bg-slate-50 text-slate-700 border-slate-100' },
        ])
        setLoading(false)
        return
      }

      const { data: modules } = await api
        .from('modules')
        .select('*')
        .in('cohort_id', cohortIds)

      const moduleIds = modules?.map((m) => m.id) || []
      if (!moduleIds.length) {
        setStatCards([
          { label: 'Overall Completion', value: '0%', icon: BarChart3, bg: 'bg-brand-50 text-brand-700 border-brand-100' },
          { label: 'Attendance', value: '0%', icon: Clock, bg: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          { label: 'Labs Complete', value: '0/0', icon: FileText, bg: 'bg-amber-50 text-amber-700 border-amber-100' },
          { label: 'Current Grade', value: 'N/A', icon: Award, bg: 'bg-slate-50 text-slate-700 border-slate-100' },
        ])
        setLoading(false)
        return
      }

      const { data: lessons } = await api
        .from('lessons')
        .select('*')
        .in('module_id', moduleIds)

      const lessonIds = lessons?.map((l) => l.id) || []

      const { data: progress } = lessonIds.length
        ? await api
            .from('lesson_progress')
            .select('*')
            .eq('user_id', user.id)
            .in('lesson_id', lessonIds)
        : { data: [] }

      const moduleById = Object.fromEntries((modules || []).map((m) => [m.id, m]))
      const domainMap = {}
      lessons?.forEach((l) => {
        const domain = moduleById[l.module_id]?.domain || 'General'
        if (!domainMap[domain]) {
          domainMap[domain] = { total: 0, completed: 0 }
        }
        domainMap[domain].total++
        if (progress?.find((p) => p.lesson_id === l.id && p.is_completed)) {
          domainMap[domain].completed++
        }
      })

      const domainsData = Object.entries(domainMap).map(([domain, stats]) => ({
        key: domain,
        label: domain,
        passRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        enrollment: stats.total,
        completed: stats.completed,
      }))

      const stagesData = STAGES.map((stage) => {
        const stageModules = modules?.filter((m) => m.stage === stage.key) || []
        const stageLessonIds = stageModules.flatMap(
          (m) => lessons?.filter((l) => l.module_id === m.id).map((l) => l.id) || []
        )
        const stageCompleted = stageLessonIds.filter((lid) =>
          progress?.find((p) => p.lesson_id === lid && p.is_completed)
        ).length
        const stageStatus =
          stageLessonIds.length === 0
            ? 'pending'
            : stageCompleted === stageLessonIds.length
            ? 'completed'
            : stageCompleted > 0
            ? 'active'
            : 'pending'

        return {
          key: stage.key,
          label: stage.label,
          desc: stage.desc,
          status: stageStatus,
          weeks: stage.weeks,
          total: stageLessonIds.length,
          completed: stageCompleted,
        }
      })

      const totalLessons = lessons?.length || 0
      const completedLessons = progress?.filter((p) => p.is_completed).length || 0
      const overallCompletion = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

      const [{ data: attendance }, { data: gradedWork }] = await Promise.all([
        api.from('live_class_attendance').select('status').eq('user_id', user.id),
        api
          .from('submissions')
          .select('score')
          .eq('user_id', user.id)
          .eq('status', 'graded')
          .not('score', 'is', null),
      ])

      const attendanceRate = attendance?.length
        ? Math.round(
            (attendance.filter((item) => item.status === 'attended').length / attendance.length) * 100
          )
        : 0

      const currentGrade = gradedWork?.length
        ? `${Math.round(gradedWork.reduce((total, item) => total + item.score, 0) / gradedWork.length)}%`
        : 'N/A'

      setDomains(domainsData)
      setStages(stagesData)
      setStatCards([
        {
          label: 'Overall Completion',
          value: `${overallCompletion}%`,
          icon: BarChart3,
          bg: 'bg-brand-50 text-brand-700 border-brand-100',
        },
        {
          label: 'Class Attendance',
          value: `${attendanceRate}%`,
          icon: Clock,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        },
        {
          label: 'Lessons Completed',
          value: `${completedLessons}/${totalLessons}`,
          icon: FileText,
          bg: 'bg-amber-50 text-amber-700 border-amber-100',
        },
        {
          label: 'Average Grade',
          value: currentGrade,
          icon: Award,
          bg: 'bg-slate-50 text-slate-700 border-slate-100',
        },
      ])
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <DashboardHeader
          title="Progress & Milestones"
          subtitle="Track your curriculum completion, attendance, and domain proficiency."
        />
        <div className="min-h-[300px] flex items-center justify-center bg-white border border-gray-200/90 rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Loading progress data...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <DashboardHeader
        title="Progress & Milestones"
        subtitle={
          cohortName
            ? `${cohortName} • Track curriculum completion, attendance, and domain proficiency.`
            : 'Track your curriculum completion, attendance, and domain proficiency.'
        }
        actions={
          <Button asChild size="sm" className="bg-deep-600 text-white hover:bg-deep-700 text-xs font-semibold">
            <Link to="/my-learning">
              <BookOpen size={13} className="mr-1.5" />
              View Curriculum
            </Link>
          </Button>
        }
      />

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="border border-gray-200/90 dark:border-gray-800 shadow-sm bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${stat.bg}`}
              >
                <stat.icon size={18} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Achievement & Mastery Badges */}
      <Card className="border border-gray-200/90 dark:border-gray-800 shadow-sm bg-card overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-[#0000ff] dark:text-blue-400">
                <Trophy size={15} />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-gray-900 dark:text-white">
                  Achievement Badges & Milestones
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Recognition for technical deliverables, lab mastery, and partner coursework
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30">
              4 of 6 Earned
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                id: 'p-ach-1',
                name: 'First Ledger Lab',
                trigger: 'metric',
                achievedAt: '2026-11-01T10:00:00Z',
                progress: 100,
                rarity: 88,
              },
              {
                id: 'p-ach-2',
                name: 'Idempotency Specialist',
                trigger: 'metric',
                achievedAt: '2026-11-03T14:30:00Z',
                progress: 100,
                rarity: 42,
              },
              {
                id: 'p-ach-3',
                name: 'Live Masterclass Streak',
                trigger: 'streak',
                achievedAt: '2026-11-05T18:00:00Z',
                progress: 100,
                rarity: 28,
              },
              {
                id: 'p-ach-4',
                name: 'TrustNet Rails Certified',
                trigger: 'api',
                achievedAt: '2026-11-06T11:20:00Z',
                progress: 100,
                rarity: 18,
              },
              {
                id: 'p-ach-5',
                name: 'Samsub AML Engine Builder',
                trigger: 'metric',
                achievedAt: null,
                progress: 60,
                rarity: 12,
              },
              {
                id: 'p-ach-6',
                name: 'Capstone Finalist',
                trigger: 'metric',
                achievedAt: null,
                progress: 30,
                rarity: 6,
              },
            ].map((ach) => (
              <AchievementBadge
                key={ach.id}
                achievement={ach}
                badgeSize="sm"
                className="bg-card border-gray-200 dark:border-gray-800 shadow-sm hover:border-[#0000ff]/40 dark:hover:border-blue-500/50 hover:shadow-md transition-all text-center py-3.5 px-2"
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content: Domain Progress (2/3) + Learning Stages (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Domain Progress */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-gray-200/90 dark:border-gray-800 shadow-sm bg-card">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 size={15} className="text-deep-600 dark:text-blue-400" />
                    Fintech Domain Progress
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Completion rate across financial services domains in your cohort
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {domains.length} Domains
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {domains.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <AlertCircle size={18} className="text-gray-400 mx-auto" />
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">No active domain modules found</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Domain modules will appear here once faculty publish curriculum for your cohort.
                  </p>
                </div>
              ) : (
                domains.map((domain) => {
                  const style = DOMAIN_COLORS[domain.key] || DOMAIN_COLORS.General
                  return (
                    <div key={domain.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded border ${style.text} ${style.border}`}
                          >
                            {domain.label}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {domain.completed}/{domain.enrollment} lessons completed
                          </span>
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{domain.passRate}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${style.fill}`}
                          style={{ width: `${domain.passRate}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Quick Learning Note */}
          <div className="rounded-xl border border-gray-200/90 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 p-4 text-xs text-gray-600 dark:text-gray-300 flex items-start gap-3">
            <CheckCircle2 size={16} className="text-deep-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-gray-900 dark:text-white">Milestone Criteria</p>
              <p className="leading-relaxed">
                Progression to subsequent stages requires minimum 80% lesson completion, active squad sprint participation, and submission of assigned hands-on lab code.
              </p>
            </div>
          </div>
        </div>

        {/* Learning Stages Roadmap */}
        <div>
          <Card className="border border-gray-200/90 dark:border-gray-800 shadow-sm bg-card">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="text-sm font-bold text-gray-900 dark:text-white">
                Academy Stages
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                16-Week structured progression
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {stages.map((stage, i) => {
                const isCompleted = stage.status === 'completed'
                const isActive = stage.status === 'active'
                return (
                  <div
                    key={stage.key}
                    className={`rounded-xl border p-3.5 space-y-1.5 transition-colors ${
                      isActive
                        ? 'border-deep-600 dark:border-blue-500 bg-deep-50/30 dark:bg-blue-950/30'
                        : isCompleted
                        ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20'
                        : 'border-gray-200/90 dark:border-gray-800 bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isCompleted
                              ? 'bg-emerald-600 text-white'
                              : isActive
                              ? 'bg-deep-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {i + 1}
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{stage.label}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize font-medium ${
                          isCompleted
                            ? 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'
                            : isActive
                            ? 'text-deep-700 dark:text-blue-400 border-deep-200 dark:border-blue-900/60'
                            : 'text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-800'
                        }`}
                      >
                        {stage.status}
                      </Badge>
                    </div>

                    <p className="text-[11px] font-semibold text-deep-700 dark:text-blue-400">{stage.weeks}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">{stage.desc}</p>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

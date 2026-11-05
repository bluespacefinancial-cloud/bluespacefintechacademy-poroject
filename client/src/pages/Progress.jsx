import { useState, useEffect } from 'react'
import { BarChart3, Clock, Award, FileText } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const DOMAIN_COLORS = {
  FaaS: { bg: 'bg-brand-100', text: 'text-brand-700', border: 'border-brand-200', fill: 'bg-brand-500' },
  FinCore: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', fill: 'bg-emerald-500' },
  FinOps: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', fill: 'bg-amber-500' },
  FinInfra: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', fill: 'bg-slate-500' },
  General: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', fill: 'bg-gray-500' },
}

const STAGES = [
  { key: 'foundations', label: 'Foundations', weeks: 'Weeks 1–4' },
  { key: 'domain_immersion', label: 'Domain Immersion', weeks: 'Weeks 5–8' },
  { key: 'live_projects', label: 'Live Projects', weeks: 'Weeks 9–12' },
  { key: 'certification', label: 'Certification', weeks: 'Weeks 13–16' },
]

export default function Progress() {
  const { user } = useAuth()
  const [domains, setDomains] = useState([])
  const [stages, setStages] = useState([])
  const [statCards, setStatCards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [user?.id])

  const loadData = async () => {
    try {
      if (!user?.id) { setLoading(false); return }

      const { data: enrolments } = await supabase.from('enrolments').select('cohort_id, track').eq('user_id', user.id).in('status', ['enrolled', 'active'])
      const cohortIds = [...new Set((enrolments || []).map((enrolment) => enrolment.cohort_id))]
      if (!cohortIds.length) { setLoading(false); return }

      const { data: modules } = await supabase
        .from('modules')
        .select('*')
        .in('cohort_id', cohortIds)

      const moduleIds = modules?.map(m => m.id) || []

      if (!moduleIds.length) { setLoading(false); return }
      const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .in('module_id', moduleIds)

      const lessonIds = lessons?.map(l => l.id) || []

      const { data: progress } = lessonIds.length ? await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds) : { data: [] }

      const moduleById = Object.fromEntries((modules || []).map((module) => [module.id, module]))
      const domainMap = {}
      lessons?.forEach(l => {
        const domain = moduleById[l.module_id]?.domain || 'General'
        if (!domainMap[domain]) {
          domainMap[domain] = { total: 0, completed: 0 }
        }
        domainMap[domain].total++
        if (progress?.find(p => p.lesson_id === l.id && p.is_completed)) {
          domainMap[domain].completed++
        }
      })

      const domainsData = Object.entries(domainMap).map(([domain, stats]) => ({
        key: domain,
        label: domain,
        passRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        enrollment: stats.total,
        labsComplete: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      }))

      const stagesData = STAGES.map((stage) => {
        const stageModules = modules?.filter(m => m.stage === stage.key) || []
        const stageLessonIds = stageModules.flatMap(m =>
          lessons?.filter(l => l.module_id === m.id).map(l => l.id) || []
        )
        const stageCompleted = stageLessonIds.filter(lid =>
          progress?.find(p => p.lesson_id === lid && p.is_completed)
        ).length
        const stageStatus = stageLessonIds.length === 0
          ? 'pending'
          : stageCompleted === stageLessonIds.length
            ? 'completed'
            : stageCompleted > 0
              ? 'active'
              : 'pending'

        return {
          key: stage.key,
          label: stage.label,
          status: stageStatus,
          weeks: stage.weeks,
        }
      })

      const totalLessons = lessons?.length || 0
      const completedLessons = progress?.filter(p => p.is_completed).length || 0
      const overallCompletion = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
      const [{ data: attendance }, { data: gradedWork }] = await Promise.all([
        supabase.from('live_class_attendance').select('status').eq('user_id', user.id),
        supabase.from('submissions').select('score').eq('user_id', user.id).eq('status', 'graded').not('score', 'is', null),
      ])
      const attendanceRate = attendance?.length
        ? Math.round((attendance.filter((item) => item.status === 'attended').length / attendance.length) * 100)
        : 0
      const currentGrade = gradedWork?.length
        ? `${Math.round(gradedWork.reduce((total, item) => total + item.score, 0) / gradedWork.length)}%`
        : 'N/A'

      setDomains(domainsData)
      setStages(stagesData)
      setStatCards([
        { label: 'Overall Completion', value: `${overallCompletion}%`, icon: BarChart3, color: 'bg-brand-500' },
        { label: 'Attendance', value: `${attendanceRate}%`, icon: Clock, color: 'bg-emerald-500' },
        { label: 'Labs Complete', value: `${completedLessons}/${totalLessons}`, icon: FileText, color: 'bg-amber-500' },
        { label: 'Current Grade', value: currentGrade, icon: Award, color: 'bg-slate-500' },
      ])
      setLoading(false)
    } catch (err) {
      console.error('Error loading progress:', err)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading progress...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-deep-600 mb-2">Progress</h1>
        <p className="text-sm text-gray-500">
          Track your learning progress across domains and stages
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-deep-600">{stat.value}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
                </div>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center ${stat.color}">
                  <stat.icon size={16} className="text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart3 size={14} className="mr-1.5" />
                Domain Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {domains.map((domain) => (
                <div key={domain.key} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={DOMAIN_COLORS[domain.key].bg + ' ' + DOMAIN_COLORS[domain.key].text + ' ' + DOMAIN_COLORS[domain.key].border}>
                        {domain.label}
                      </Badge>
                      <span className="text-[10px] font-medium text-gray-500">
                        {domain.enrollment} enrolled
                      </span>
                    </div>
                    <span className="text-xs font-medium text-deep-600 w-8 text-right">
                      {domain.passRate}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out-expo ${DOMAIN_COLORS[domain.key].fill}`}
                      style={{ width: `${domain.passRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart3 size={14} className="mr-1.5" />
                Learning Stages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stages.map((stage, i) => (
                <div key={stage.key} className="flex flex-col gap-2 relative">
                  {i > 0 && (
                    <div className="absolute -top-1 left-0 w-full h-[2px] bg-gray-200" />
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 ${
                        stage.status === 'completed' ? 'bg-brand-600 text-white' :
                        stage.status === 'active' ? 'bg-brand-600 text-white' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {i + 1}
                      </div>
                      <span className={`text-xs font-medium ${
                        stage.status === 'completed' ? 'text-emerald-600' :
                        stage.status === 'active' ? 'text-brand-600' :
                        'text-gray-400'
                      }`}>
                        {stage.label}
                      </span>
                    </div>
                    <Badge variant={stage.status === 'completed' ? 'secondary' : stage.status === 'active' ? 'default' : 'outline'} className="text-[10px]">
                      {stage.status}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-gray-400">{stage.weeks}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

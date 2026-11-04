import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Clock, Users, Award, FileText, Calendar, MapPin, TrendingUp, TrendingDown } from 'lucide.react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '../components/ui/select'
import { supabase } from '../lib/supabase'

const DOMAIN_COLORS = {
  FaaS: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', fill: 'bg-indigo-500' },
  FinCore: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', fill: 'bg-emerald-500' },
  FinOps: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', fill: 'bg-amber-500' },
  FinInfra: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', fill: 'bg-slate-500' },
}

export default function Reports() {
  const [filterCohort, setFilterCohort] = useState('all')
  const [filterDomain, setFilterDomain] = useState('all')
  const [stats, setStats] = useState({
    totalFellows: 0,
    avgAttendance: 0,
    avgCompletion: 0,
    avgPassRate: 0,
  })
  const [cohortData, setCohortData] = useState([])
  const [domainData, setDomainData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: cohorts } = await supabase
        .from('cohorts')
        .select('*')

      const { data: lessons } = await supabase
        .from('lessons')
        .select('domain')

      const { data: progress } = await supabase
        .from('lesson_progress')
        .select('*')

      const totalFellows = cohorts?.length || 0
      const completedLessons = progress?.filter(p => p.is_completed).length || 0
      const totalLessons = lessons?.length || 0
      const avgCompletion = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

      const domainMap = {}
      lessons?.forEach(l => {
        const domain = l.domain || 'Unknown'
        if (!domainMap[domain]) {
          domainMap[domain] = { total: 0, completed: 0 }
        }
        domainMap[domain].total++
        if (progress?.find(p => p.lesson_id === l.id && p.is_completed)) {
          domainMap[domain].completed++
        }
      })

      const domainStats = Object.entries(domainMap).map(([domain, stats]) => ({
        key: domain,
        label: domain,
        passRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        enrollment: stats.total,
        labsComplete: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      }))

      setStats({
        totalFellows,
        avgAttendance: 94,
        avgCompletion,
        avgPassRate: domainStats.length > 0 ? Math.round(domainStats.reduce((sum, d) => sum + d.passRate, 0) / domainStats.length) : 0,
      })
      setDomainData(domainStats)
      setCohortData(cohorts || [])
      setLoading(false)
    } catch (err) {
      console.error('Error loading reports:', err)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading analytics...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-deep-600 mb-1">Analytics & Reporting</h1>
            <p className="text-sm text-gray-500">
              Cohort-level and academy-wide data monitoring
            </p>
          </div>
          <Button>
            <FileText size={14} className="mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cohort</span>
          <Select
            value={filterCohort}
            onValueChange={(v) => setFilterCohort(v)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All cohorts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cohorts</SelectItem>
              {cohortData.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</span>
          <Select value={filterDomain} onValueChange={(v) => setFilterDomain(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All domains" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {domainData.map((d) => (
                <SelectItem key={d.key} value={d.key}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-deep-600">{stats.totalFellows}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Total Fellows</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-brand-100 flex items-center justify-center">
                <Users size={16} className="text-brand-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-deep-600">{stats.avgAttendance}%</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Avg Attendance</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Clock size={16} className="text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-deep-600">{stats.avgCompletion}%</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Avg Completion</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <BarChart3 size={16} className="text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-deep-600">{stats.avgPassRate}%</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Pass Rate</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Award size={16} className="text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calendar size={14} className="mr-1.5" />
                Cohort Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cohort</th>
                      <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Fellows</th>
                      <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                      <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
                      <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Pass Rate</th>
                      <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Placement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohortData.map((c) => (
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors duration-150">
                        <td className="py-3">
                          <p className="text-xs font-medium text-deep-600">{c.name}</p>
                        </td>
                        <td className="py-3">
                          <p className="text-xs text-gray-600">37</p>
                        </td>
                        <td className="py-3">
                          <p className="text-xs text-gray-600">94%</p>
                        </td>
                        <td className="py-3">
                          <p className="text-xs text-gray-600">65%</p>
                        </td>
                        <td className="py-3">
                          <p className="text-xs font-medium text-emerald-600">87%</p>
                        </td>
                        <td className="py-3">
                          <p className="text-xs text-gray-600">76%</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart3 size={14} className="mr-1.5" />
                Domain Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {domainData.map((domain) => (
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
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>Pass Rate: {domain.passRate}%</span>
                    <span>Labs Complete: {domain.labsComplete}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp size={14} className="mr-1.5" />
                Monthly Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-2 rounded-lg border border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-deep-600">Oct</span>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-gray-600">Applications: 45</span>
                  <span className="text-gray-600">Enrolled: 30</span>
                  <span className="text-gray-600">Certified: 0</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-deep-600">Nov</span>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-gray-600">Applications: 67</span>
                  <span className="text-gray-600">Enrolled: 37</span>
                  <span className="text-gray-600">Certified: 0</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-deep-600">Dec</span>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-gray-600">Applications: 89</span>
                  <span className="text-gray-600">Enrolled: 37</span>
                  <span className="text-gray-600">Certified: 0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Key Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-2 rounded-lg border border-gray-100 bg-white">
                <TrendingUp size={14} className="text-emerald-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-deep-600">FinCore highest pass rate</p>
                  <p className="text-[10px] text-gray-500">88% pass rate across all cohorts</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-lg border border-gray-100 bg-white">
                <TrendingDown size={14} className="text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-deep-600">FinInfra needs attention</p>
                  <p className="text-[10px] text-gray-500">79% pass rate - lowest domain</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-lg border border-gray-100 bg-white">
                <MapPin size={14} className="text-brand-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-deep-600">Placement on track</p>
                  <p className="text-[10px] text-gray-500">76% of certified Fellows placed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Bank/Trainee Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full flex items-center justify-between py-2 text-left text-sm">
                <span>Enrolment Confirmation</span>
                <FileText size={12} className="ml-2" />
              </Button>
              <Button variant="outline" className="w-full flex items-center justify-between py-2 text-left text-sm">
                <span>Progress Report (Mid-Programme)</span>
                <Clock size={12} className="ml-2" />
              </Button>
              <Button variant="outline" className="w-full flex items-center justify-between py-2 text-left text-sm">
                <span>Project Report</span>
                <Target size={12} className="ml-2" />
              </Button>
              <Button variant="outline" className="w-full flex items-center justify-between py-2 text-left text-sm">
                <span>Completion Report</span>
                <Award size={12} className="ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { BarChart3, Award, FileText, Calendar, MapPin, TrendingUp, TrendingDown, Users, Clock, Target } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '../components/ui/select'

const DOMAIN_COLORS = {
  FaaS: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', fill: 'bg-indigo-500' },
  FinCore: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', fill: 'bg-emerald-500' },
  FinOps: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', fill: 'bg-amber-500' },
  FinInfra: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', fill: 'bg-slate-500' },
}

const MOCK_COHORTS = [
  { id: 1, name: 'Cohort 1 - December 2026', finsoft: 22, finops: 15, attendance: 94, completion: 65, passRate: 87, placement: 76 },
  { id: 2, name: 'Cohort 2 - March 2027', finsoft: 0, finops: 0, attendance: 0, completion: 0, passRate: 0, placement: 0 },
  { id: 3, name: 'Cohort 3 - June 2027', finsoft: 0, finops: 0, attendance: 0, completion: 0, passRate: 0, placement: 0 },
  { id: 4, name: 'Cohort 4 - September 2027', finsoft: 0, finops: 0, attendance: 0, completion: 0, passRate: 0, placement: 0 },
]

const DOMAIN_STATS = [
  { key: 'FaaS', label: 'FaaS', passRate: 92, enrollment: 28, labsComplete: 85 },
  { key: 'FinCore', label: 'FinCore', passRate: 85, enrollment: 32, labsComplete: 60 },
  { key: 'FinOps', label: 'FinOps', passRate: 88, enrollment: 26, labsComplete: 75 },
  { key: 'FinInfra', label: 'FinInfra', passRate: 79, enrollment: 22, labsComplete: 40 },
]

const MONTHLY_TREND = [
  { month: 'Oct', applications: 45, enrolled: 30, certified: 0 },
  { month: 'Nov', applications: 67, enrolled: 37, certified: 0 },
  { month: 'Dec', applications: 89, enrolled: 37, certified: 0 },
  { month: 'Jan', applications: 0, enrolled: 0, certified: 12 },
  { month: 'Feb', applications: 0, enrolled: 0, certified: 0 },
  { month: 'Mar', applications: 0, enrolled: 0, certified: 0 },
]

export default function Reports() {
  const [filterCohort, setFilterCohort] = useState('all')
  const [filterDomain, setFilterDomain] = useState('all')
  const cohorts = MOCK_COHORTS
  const domainData = DOMAIN_STATS
  const stats = {
    totalFellows: cohorts.reduce((sum, c) => sum + c.finsoft + c.finops, 0),
    avgAttendance: Math.round(cohorts.reduce((sum, c) => sum + c.attendance, 0) / cohorts.length),
    avgCompletion: Math.round(cohorts.reduce((sum, c) => sum + c.completion, 0) / cohorts.length),
    avgPassRate: Math.round(cohorts.reduce((sum, c) => sum + c.passRate, 0) / cohorts.length),
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
          <Select value={filterCohort} onValueChange={(v) => setFilterCohort(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All cohorts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cohorts</SelectItem>
              {cohorts.map((c) => (
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
                    {cohorts.map((c) => (
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors duration-150">
                        <td className="py-3">
                          <p className="text-xs font-medium text-deep-600">{c.name}</p>
                        </td>
                        <td className="py-3">
                          <p className="text-xs text-gray-600">{c.finsoft + c.finops}</p>
                        </td>
                        <td className="py-3">
                          <p className="text-xs text-gray-600">{c.attendance}%</p>
                        </td>
                        <td className="py-3">
                          <p className="text-xs text-gray-600">{c.completion}%</p>
                        </td>
                        <td className="py-3">
                          <p className={`text-xs font-medium ${c.passRate >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {c.passRate}%
                          </p>
                        </td>
                        <td className="py-3">
                          <p className="text-xs text-gray-600">{c.placement}%</p>
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
              {MONTHLY_TREND.map((t) => (
                <div key={t.month} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 bg-white">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-deep-600">{t.month}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-gray-600">Applications: {t.applications}</span>
                    <span className="text-gray-600">Enrolled: {t.enrolled}</span>
                    <span className="text-gray-600">Certified: {t.certified}</span>
                  </div>
                </div>
              ))}
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

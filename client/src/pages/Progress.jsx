import { BarChart3, Clock, Award, Calendar } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

const DOMAIN_COLORS = {
  FaaS: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', fill: 'bg-indigo-500' },
  FinCore: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', fill: 'bg-emerald-500' },
  FinOps: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', fill: 'bg-amber-500' },
  FinInfra: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', fill: 'bg-slate-500' },
}

const STAT_CARDS = [
  { label: 'Overall Completion', value: '65%', icon: BarChart3, color: 'bg-brand-600' },
  { label: 'Attendance', value: '94%', icon: Calendar, color: 'bg-emerald-500' },
  { label: 'Labs Complete', value: '4/6', icon: Clock, color: 'bg-amber-500' },
  { label: 'Current Grade', value: '86%', icon: Award, color: 'bg-slate-500' },
]

const DOMAINS = [
  { key: 'FaaS', label: 'FaaS', progress: 85, stage: 'Foundations' },
  { key: 'FinCore', label: 'FinCore', progress: 60, stage: 'Domain Immersion' },
  { key: 'FinOps', label: 'FinOps', progress: 75, stage: 'Domain Immersion' },
  { key: 'FinInfra', label: 'FinInfra', progress: 40, stage: 'Not Started' },
]

const STAGES = [
  { key: 'foundations', label: 'Foundations', status: 'completed', weeks: 'Weeks 1-3' },
  { key: 'domain_immersion', label: 'Domain Immersion', status: 'active', weeks: 'Weeks 4-8' },
  { key: 'live_projects', label: 'Live Projects', status: 'pending', weeks: 'Weeks 9-14' },
  { key: 'certification', label: 'Certification', status: 'pending', weeks: 'Weeks 15-16' },
]

export default function Progress() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-deep-600 mb-2">Progress</h1>
        <p className="text-sm text-gray-500">
          Track your learning progress across domains and stages
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-deep-600">{stat.value}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon size={16} className="text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Domain Progress */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart3 size={14} className="mr-1.5" />
                Domain Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {DOMAINS.map((domain) => (
                <div key={domain.key} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={DOMAIN_COLORS[domain.key].bg + ' ' + DOMAIN_COLORS[domain.key].text + ' ' + DOMAIN_COLORS[domain.key].border}>
                        {domain.label}
                      </Badge>
                      <span className="text-[10px] font-medium text-gray-500">
                        {domain.stage}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-deep-600 w-8 text-right">
                      {domain.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out-expo ${DOMAIN_COLORS[domain.key].fill}`}
                      style={{ width: `${domain.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Stage Tracker */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Learning Stages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {STAGES.map((stage, i) => (
                <div key={stage.key} className="flex flex-col gap-2 relative">
                  {i > 0 && (
                    <div className="absolute -top-1 left-0 w-full h-[2px] bg-gray-200" />
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 ${
                        stage.status === 'completed' ? 'bg-brand-600 text-white' :
                        stage.status === 'active' ? 'bg-brand-600 text-white animate-pulse' :
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
                    <Badge
                      variant={
                        stage.status === 'completed' ? 'secondary' :
                        stage.status === 'active' ? 'default' : 'outline'
                      }
                      className="text-[10px]"
                    >
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

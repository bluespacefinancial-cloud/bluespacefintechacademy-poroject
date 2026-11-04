import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '../components/ui/select'

const DOMAIN_COLORS = {
  FaaS: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  FinCore: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  FinOps: 'bg-amber-100 text-amber-700 border-amber-200',
  FinInfra: 'bg-slate-100 text-slate-700 border-slate-200',
}

const SUBMISSION_STATUS = {
  submitted: { label: 'Submitted', variant: 'default', color: 'text-brand-600' },
  graded: { label: 'Graded', variant: 'secondary', color: 'text-emerald-600' },
  remediation: { label: 'Remediation', variant: 'outline', color: 'text-amber-600' },
  failed: { label: 'Failed', variant: 'destructive', color: 'text-red-600' },
}

const MOCK_LABS = [
  {
    id: 1,
    title: 'Lab: Build a Simple Ledger with Double-Entry Postings',
    domain: 'FinCore',
    module: 'FinCore: Ledger and Transaction Engineering',
    student: 'Ada Okonkwo',
    track: 'Finsoft',
    squad: 'Squad Alpha',
    status: 'submitted',
    submittedAt: '2026-11-02 14:30',
    score: null,
    feedback: null,
  },
  {
    id: 2,
    title: 'Lab: Automate Reconciliation Pipeline',
    domain: 'FinOps',
    module: 'FinOps: Reconciliation and Reporting',
    student: 'Kwame Asante',
    track: 'Finsoft',
    squad: 'Squad Alpha',
    status: 'graded',
    submittedAt: '2026-11-01 10:15',
    score: 87,
    feedback: 'Well implemented. Consider adding idempotency checks.',
  },
  {
    id: 3,
    title: 'Lab: Partner API Onboarding Flow',
    domain: 'FaaS',
    module: 'FaaS: Partner-Ready APIs',
    student: 'Zainab Yusuf',
    track: 'Finsoft',
    squad: 'Squad Alpha',
    status: 'remediation',
    submittedAt: '2026-11-03 09:00',
    score: 62,
    feedback: 'Missing error handling for invalid partner credentials. Please revise.',
  },
  {
    id: 4,
    title: 'Lab: FinInfra CI/CD Pipeline',
    domain: 'FinInfra',
    module: 'FinInfra: CI/CD and Observability',
    student: 'Fatima Diallo',
    track: 'Finops',
    squad: 'Squad Alpha',
    status: 'submitted',
    submittedAt: '2026-11-03 08:45',
    score: null,
    feedback: null,
  },
]

export default function LabsToReview() {
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredLabs = MOCK_LABS.filter((l) => {
    if (filterStatus === 'all') return true
    return l.status === filterStatus
  })

  const pendingCount = MOCK_LABS.filter((l) => l.status === 'submitted').length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-deep-600 mb-1">Labs to Review</h1>
            <p className="text-sm text-gray-500">
              Review and grade student lab submissions
            </p>
          </div>
          {pendingCount > 0 && (
            <Badge variant="default">{pendingCount} pending</Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </span>
          <Select
            value={filterStatus}
            onValueChange={(value) => setFilterStatus(value)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="graded">Graded</SelectItem>
              <SelectItem value="remediation">Remediation</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">{MOCK_LABS.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Labs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">{pendingCount}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">{MOCK_LABS.filter(l => l.status === 'graded').length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Graded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">{MOCK_LABS.filter(l => l.status === 'remediation').length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Needs Remediation</p>
          </CardContent>
        </Card>
      </div>

      {/* Labs list */}
      <div className="space-y-3">
        {filteredLabs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText size={32} className="mx-auto mb-3 opacity-50" />
            <p>No labs found</p>
          </div>
        ) : (
          filteredLabs.map((lab) => {
            const status = SUBMISSION_STATUS[lab.status]
            return (
              <Card
                key={lab.id}
                className="cursor-pointer hover:border-brand-200 transition-colors duration-150"
                onClick={() => navigate(`/labs/${lab.id}/review`)}
              >
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0">
                      <FileText size={14} className="text-deep-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm">{lab.title}</CardTitle>
                      <CardDescription className="text-[10px]">
                        {lab.module} · {lab.domain}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={DOMAIN_COLORS[lab.domain]}>{lab.domain}</Badge>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-deep-600">Student</span>
                      <span className="text-xs text-gray-600">{lab.student}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-deep-600">Track</span>
                      <span className="text-xs text-gray-600">{lab.track}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-deep-600">Squad</span>
                      <span className="text-xs text-gray-600">{lab.squad}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-deep-600">Submitted</span>
                      <span className="text-xs text-gray-600">{lab.submittedAt}</span>
                    </div>
                    {lab.status === 'graded' && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-deep-600">Score</span>
                        <span className="text-xs font-bold text-emerald-600">{lab.score}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between pt-3">
                  <Badge variant={status.variant} className={status.color}>
                    {status.label}
                  </Badge>
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

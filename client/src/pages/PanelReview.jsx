import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, ClipboardList, Users } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '../components/ui/select'

const PANEL_STATUSES = {
  pending: { label: 'Pending Review', variant: 'outline', color: 'bg-gray-50 text-gray-600 border-gray-100' },
  in_review: { label: 'In Review', variant: 'default', color: 'bg-brand-50 text-brand-700 border-brand-100' },
  approved: { label: 'Approved', variant: 'secondary', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  rejected: { label: 'Rejected', variant: 'destructive', color: 'bg-red-50 text-red-700 border-red-100' },
  remediation: { label: 'Remediation Required', variant: 'outline', color: 'bg-amber-50 text-amber-700 border-amber-100' },
}

const MOCK_SUBMISSIONS = [
  {
    id: 1,
    fellow: 'Ada Okonkwo',
    track: 'Finsoft',
    squad: 'Squad Alpha',
    title: 'Capstone: Partner-Ready API',
    status: 'pending',
    submittedAt: '2027-04-10',
    panelReviewDate: null,
    score: null,
  },
  {
    id: 2,
    fellow: 'Kwame Asante',
    track: 'Finsoft',
    squad: 'Squad Beta',
    title: 'Capstone: Ledger Integration Service',
    status: 'in_review',
    submittedAt: '2027-04-09',
    panelReviewDate: '2027-04-14',
    score: null,
  },
  {
    id: 3,
    fellow: 'Zainab Yusuf',
    track: 'Finsoft',
    squad: 'Squad Alpha',
    title: 'Capstone: Payment Flow Automation',
    status: 'approved',
    submittedAt: '2027-04-08',
    panelReviewDate: '2027-04-12',
    score: 87,
  },
  {
    id: 4,
    fellow: 'Emeka Ndiaye',
    track: 'Finops',
    squad: 'Squad Alpha',
    title: 'Capstone: Reconciliation Pipeline',
    status: 'remediation',
    submittedAt: '2027-04-08',
    panelReviewDate: '2027-04-12',
    score: 62,
  },
]

export default function PanelReview() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filtered = MOCK_SUBMISSIONS.filter((s) => {
    const matchesSearch = s.fellow.toLowerCase().includes(search.toLowerCase()) ||
      s.title.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-deep-600 mb-1">Panel Review</h1>
            <p className="text-sm text-gray-500">
              Review capstone submissions and make certification decisions
            </p>
          </div>
          <Button>
            <ClipboardList size={16} className="mr-2" />
            Review Rubric
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Fellow or capstone title..."
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </span>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="remediation">Remediation Required</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">{MOCK_SUBMISSIONS.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">
              {MOCK_SUBMISSIONS.filter(s => s.status === 'pending').length}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">
              {MOCK_SUBMISSIONS.filter(s => s.status === 'approved').length}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">
              {MOCK_SUBMISSIONS.filter(s => s.status === 'remediation').length}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Remediation</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText size={32} className="mx-auto mb-3 opacity-50" />
            <p>No submissions found</p>
          </div>
        ) : (
          filtered.map((submission) => {
            const config = PANEL_STATUSES[submission.status]
            return (
              <Card
                key={submission.id}
                className="cursor-pointer hover:border-brand-200 transition-colors duration-150"
                onClick={() => navigate(`/panel-review/${submission.id}`)}
              >
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-deep-100 flex items-center justify-center text-xs font-bold text-deep-600 shrink-0">
                      {submission.fellow.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm">{submission.title}</CardTitle>
                      <CardDescription className="text-[10px]">
                        {submission.fellow} · {submission.track} · {submission.squad}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={config.color}>{config.label}</Badge>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-deep-600">Submitted</span>
                      <span className="text-xs text-gray-600">{submission.submittedAt}</span>
                    </div>
                    {submission.panelReviewDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-deep-600">Review Date</span>
                        <span className="text-xs text-gray-600">{submission.panelReviewDate}</span>
                      </div>
                    )}
                    {submission.score !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-deep-600">Panel Score</span>
                        <span className="text-xs font-bold text-brand-600">{submission.score}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between pt-3">
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/panel-review/${submission.id}`) }}>
                    Review
                  </Button>
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users size={14} className="mr-1.5" />
              Certification Rubric
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white">
              <div>
                <p className="text-xs font-medium text-deep-600">Technical Correctness</p>
                <p className="text-[10px] text-gray-500">Weight: 30%</p>
              </div>
              <span className="text-xs text-gray-600">30 pts</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white">
              <div>
                <p className="text-xs font-medium text-deep-600">Code Quality</p>
                <p className="text-[10px] text-gray-500">Weight: 25%</p>
              </div>
              <span className="text-xs text-gray-600">25 pts</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white">
              <div>
                <p className="text-xs font-medium text-deep-600">Documentation</p>
                <p className="text-[10px] text-gray-500">Weight: 15%</p>
              </div>
              <span className="text-xs text-gray-600">15 pts</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

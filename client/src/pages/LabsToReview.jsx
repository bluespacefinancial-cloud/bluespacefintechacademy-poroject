import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { Button } from '../components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/ui/card'
import { Input } from '../components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from '../components/ui/select'
import { api } from '../lib/backend'
import { Badge } from '../components/ui/badge'

const SUBMISSION_LABELS = {
  submitted: 'Submitted',
  graded: 'Graded',
  remediation: 'Remediation',
  failed: 'Failed',
}

const DOMAIN_COLORS = {
  FaaS: 'bg-deep-600 text-white font-semibold border-transparent',
  FinCore: 'bg-emerald-600 text-white font-semibold border-transparent',
  FinOps: 'bg-amber-500 text-slate-950 font-bold border-transparent',
  FinInfra: 'bg-slate-700 text-white font-semibold border-transparent',
  FinFra: 'bg-slate-700 text-white font-semibold border-transparent',
}

export default function LabsToReview() {
  const navigate = useNavigate()
  const [labs, setLabs] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLabs()
  }, [])

  const loadLabs = async () => {
    try {
      const { data: { user } } = await api.auth.getUser()
      if (!user) return

      const { data, error } = await api
        .from('submissions')
        .select(`
          *,
          labs (title, lessons (module_id, modules (title, domain))),
          users!submissions_user_id_fkey (id, name, email),
          squads (name)
        `)
        .order('submitted_at', { ascending: false })

      if (error) throw error

      const userIds = [...new Set((data || []).map((s) => s.user_id))]
      const trackMap = {}
      if (userIds.length > 0) {
        const { data: enrolments } = await api
          .from('enrolments')
          .select('user_id, track')
          .in('user_id', userIds)
        enrolments?.forEach((e) => { trackMap[e.user_id] = e.track })
      }

      const labsData = (data || []).map((submission) => ({
        id: submission.id,
        title: submission.labs?.title || 'Untitled Lab',
        domain: submission.labs?.lessons?.modules?.domain || 'General',
        module: submission.labs?.lessons?.modules?.title || 'Unknown Module',
        student: submission.users?.name || 'Unknown Student',
        track: trackMap[submission.user_id] || 'Unknown',
        squad: submission.squads?.name || 'Unassigned',
        status: submission.status,
        submittedAt: submission.submitted_at,
        score: submission.score,
        feedback: submission.feedback,
      }))

      setLabs(labsData)
    } catch (err) {
      console.error('Error loading labs:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = labs.filter((l) => {
    const matchesSearch = l.student.toLowerCase().includes(search.toLowerCase()) || l.track.toLowerCase().includes(search.toLowerCase())
    if (filterStatus === 'all') return matchesSearch
    return matchesSearch && l.status === filterStatus
  })

  const pendingCount = labs.filter((l) => l.status === 'submitted').length

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown'
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="w-full space-y-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Labs to Review</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Review and grade student lab submissions</p>
          </div>
          {pendingCount > 0 && (
            <Badge variant="solidAmber" className="font-bold text-xs">{pendingCount} pending</Badge>
          )}
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or track..."
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </span>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v)}>
            <SelectTrigger className="w-[140px]">
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{labs.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Labs</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600 dark:text-deep-400">{labs.filter((l) => l.status === 'submitted').length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pending Review</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{labs.filter((l) => l.status === 'graded').length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Graded</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{labs.filter((l) => l.status === 'remediation').length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Needs Remediation</p>
          </CardContent>
        </Card>
      </div>

      {loading ? <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Loading submissions…</p> : <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText size={32} className="mx-auto mb-3 opacity-50" />
            <p>No labs found</p>
          </div>
        ) : (
          filtered.map((lab) => (
            <Card
              key={lab.id}
              className="cursor-pointer hover:border-brand-200 dark:border-gray-800 dark:hover:border-gray-700 transition-colors duration-150"
              onClick={() => navigate(`/grading?submission=${lab.id}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-deep-50 dark:bg-deep-950/60 border border-deep-100 dark:border-deep-900/50 flex items-center justify-center text-xs font-bold shrink-0">
                    <FileText size={14} className="text-deep-600 dark:text-deep-400" />
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
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Student</span>
                    <span className="text-xs text-gray-900 dark:text-gray-100 font-medium">{lab.student}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Track</span>
                    <span className="text-xs text-gray-900 dark:text-gray-100 font-medium">{lab.track}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Squad</span>
                    <span className="text-xs text-gray-900 dark:text-gray-100 font-medium">{lab.squad}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Submitted</span>
                    <span className="text-xs text-gray-900 dark:text-gray-100">{formatDate(lab.submittedAt)}</span>
                  </div>
                  {lab.status === 'graded' && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Score</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{lab.score}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between pt-3">
                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                      {SUBMISSION_LABELS[lab.status] || lab.status}
                    </span>
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/grading?submission=${lab.id}`) }}>
                  Review
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from '../components/ui/select'
import { api } from '../lib/backend'

const ROLE_COLORS = {
  'Project Manager': 'text-brand-700 border-brand-200',
  'Field Lead': 'text-emerald-700 border-emerald-200',
  UAT: 'text-brand-700 border-brand-200',
  'Technical Specialist': 'text-amber-700 border-amber-200',
}

const PLACEMENT_STATUS = {
  matched: { label: 'Matched', variant: 'secondary', color: 'text-emerald-700 border-emerald-200' },
  interviewing: { label: 'Interviewing', variant: 'default', color: 'text-brand-700 border-brand-200' },
  placed: { label: 'Placed', variant: 'secondary', color: 'text-emerald-700 border-emerald-200' },
  completed: { label: 'Completed', variant: 'outline', color: 'text-gray-600 border-gray-200' },
}

export default function Placement() {
  const [placements, setPlacements] = useState([])
  const [search, setSearch] = useState('')
  const [filterTrack, setFilterTrack] = useState('all')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    api.from('placements').select('id, user_id, role, project_id, start_date, status, checkin_30_days, checkin_60_days, checkin_90_days, users(name, email), certifications(track, cohort_id, cohorts(name))').order('created_at', { ascending: false })
      .then(({ data, error: loadError }) => {
        if (!mounted) return
        if (loadError) setError(loadError.message)
        else setPlacements((data || []).map((row) => ({
          ...row,
          name: row.users?.name || row.users?.email || 'Fellow',
          track: row.certifications?.track || 'Unassigned',
          cohort: row.certifications?.cohorts?.name || 'Cohort unavailable',
          project: row.project_id,
          startDate: row.start_date,
          checkin30: Boolean(row.checkin_30_days),
          checkin60: Boolean(row.checkin_60_days),
          checkin90: Boolean(row.checkin_90_days),
        })))
        setLoading(false)
      })
      .catch((loadError) => { if (mounted) { setError(loadError.message || 'Unable to load placements.'); setLoading(false) } })
    return () => { mounted = false }
  }, [])

  const filtered = useMemo(() => placements.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesTrack = filterTrack === 'all' || p.track === filterTrack
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus
    const matchesRole = filterRole === 'all' || p.role === filterRole
    return matchesSearch && matchesTrack && matchesStatus && matchesRole
  }), [placements, search, filterTrack, filterStatus, filterRole])

  return (
    <div className="w-full space-y-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Placement</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Match certified Fellows to project roles and track placements
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Fellow name..."
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Track</span>
          <Select value={filterTrack} onValueChange={(v) => setFilterTrack(v)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All tracks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tracks</SelectItem>
              <SelectItem value="Finsoft">Finsoft</SelectItem>
              <SelectItem value="Finops">Finops</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Role</span>
          <Select value={filterRole} onValueChange={(v) => setFilterRole(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="Project Manager">Project Manager</SelectItem>
              <SelectItem value="Field Lead">Field Lead</SelectItem>
              <SelectItem value="UAT">UAT</SelectItem>
              <SelectItem value="Technical Specialist">Technical Specialist</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</span>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="matched">Matched</SelectItem>
              <SelectItem value="interviewing">Interviewing</SelectItem>
              <SelectItem value="placed">Placed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{placements.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Placements</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {placements.filter((p) => p.status === 'placed').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Placed</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600 dark:text-deep-400">
              {placements.filter((p) => p.status === 'matched').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Matched</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{placements.filter((p) => p.checkin30).length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">30-Day Check-ins</p>
          </CardContent>
        </Card>
      </div>

      {error && <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading && <p className="py-6 text-center text-sm text-gray-500">Loading placements…</p>}

      <div className="space-y-3">
        {!loading && filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Search size={32} className="mx-auto mb-3 opacity-50" />
            <p>No placements found</p>
          </div>
        ) : (
          filtered.map((placement) => {
            const config = PLACEMENT_STATUS[placement.status]
            return (
              <Card
                key={placement.id}
                className="cursor-pointer hover:border-brand-200 transition-colors duration-150"
              >
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-deep-100 flex items-center justify-center text-xs font-bold text-deep-600 shrink-0">
                      {placement.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm">{placement.name}</CardTitle>
                      <CardDescription className="text-[10px]">
                        {placement.track} &middot; {placement.cohort}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={config.color}>{config.label}</Badge>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-deep-600">Role</span>
                      <Badge className={ROLE_COLORS[placement.role] || 'text-gray-600'}>
                        {placement.role}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-deep-600">Project</span>
                      <span className="text-xs text-gray-600">{placement.project || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-deep-600">Start Date</span>
                      <span className="text-xs text-gray-600">{placement.startDate || 'TBD'}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 text-[10px]">
                    {placement.checkin30 && <span className="text-emerald-600 font-semibold">30d Done</span>}
                    {!placement.checkin30 && <span className="text-gray-400">30d -</span>}
                    {placement.checkin60 && <span className="text-emerald-600 font-semibold">60d Done</span>}
                    {!placement.checkin60 && <span className="text-gray-400">60d -</span>}
                    {placement.checkin90 && <span className="text-emerald-600 font-semibold">90d Done</span>}
                    {!placement.checkin90 && <span className="text-gray-400">90d -</span>}
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between pt-3">
                  <Badge variant="outline">{placement.status}</Badge>
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

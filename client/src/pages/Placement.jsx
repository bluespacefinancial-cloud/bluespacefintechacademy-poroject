import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Users, Clock, FileText, Search, Target } from 'lucide.react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '../components/ui/select'
import { supabase } from '../lib/supabase'

const ROLE_COLORS = {
  'Project Manager': 'bg-brand-100 text-brand-700 border-brand-200',
  'Field Lead': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  UAT: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Technical Specialist': 'bg-amber-100 text-amber-700 border-amber-200',
}

const PLACEMENT_STATUS = {
  matched: { label: 'Matched', variant: 'secondary', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  interviewing: { label: 'Interviewing', variant: 'default', color: 'bg-brand-50 text-brand-700 border-brand-100' },
  placed: { label: 'Placed', variant: 'secondary', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  pending: { label: 'Pending Match', variant: 'outline', color: 'bg-gray-50 text-gray-600 border-gray-100' },
}

const MOCK_PLACEMENTS = [
  {
    id: 1,
    fellow: 'Ada Okonkwo',
    track: 'Finsoft',
    cohort: 'Cohort 1 - December 2026',
    role: 'Technical Specialist',
    project: 'FinCore Ledger Integration',
    status: 'matched',
    matchScore: 92,
    startDate: '2027-04-16',
    checkin30: false,
    checkin60: false,
    checkin90: false,
  },
  {
    id: 2,
    fellow: 'Kwame Asante',
    track: 'Finsoft',
    cohort: 'Cohort 1 - December 2026',
    role: 'Project Manager',
    project: 'FaaS Partner API Onboarding',
    status: 'interviewing',
    matchScore: 88,
    startDate: null,
    checkin30: false,
    checkin60: false,
    checkin90: false,
  },
  {
    id: 3,
    fellow: 'Emeka Ndiaye',
    track: 'Finops',
    cohort: 'Cohort 1 - December 2026',
    role: 'Field Lead',
    project: 'FinOps Automated Reconciliation',
    status: 'placed',
    matchScore: 85,
    startDate: '2027-04-16',
    checkin30: true,
    checkin60: false,
    checkin90: false,
  },
  {
    id: 4,
    fellow: 'Fatima Diallo',
    track: 'Finops',
    cohort: 'Cohort 1 - December 2026',
    role: 'UAT',
    project: 'FinOps Reconciliation Testing',
    status: 'matched',
    matchScore: 81,
    startDate: '2027-04-16',
    checkin30: false,
    checkin60: false,
    checkin90: false,
  },
  {
    id: 5,
    fellow: 'Zainab Yusuf',
    track: 'Finsoft',
    cohort: 'Cohort 1 - December 2026',
    role: 'Technical Specialist',
    project: null,
    status: 'pending',
    matchScore: null,
    startDate: null,
    checkin30: false,
    checkin60: false,
    checkin90: false,
  },
]

export default function Placement() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterTrack, setFilterTrack] = useState('all')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const filtered = MOCK_PLACEMENTS.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesTrack = filterTrack === 'all' || p.track === filterTrack
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus
    const matchesRole = filterRole === 'all' || p.role === filterRole
    return matchesSearch && matchesTrack && matchesStatus && matchesRole
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-deep-600 mb-1">Placement</h1>
            <p className="text-sm text-gray-500">
              Match certified Fellows to project roles and track placements
            </p>
          </div>
          <Button>
            <Target size={16} className="mr-2" />
            New Match
          </Button>
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
              <SelectItem value="pending">Pending Match</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">{MOCK_PLACEMENTS.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Fellows</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">{MOCK_PLACEMENTS.filter((p) => p.status === 'placed').length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Placed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">{MOCK_PLACEMENTS.filter((p) => p.status === 'matched').length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Matched</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">{MOCK_PLACEMENTS.filter((p) => p.checkin30).length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">30-Day Check-ins</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
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
                onClick={() => navigate(`/placement/${placement.id}`)}
              >
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-deep-100 flex items-center justify-center text-xs font-bold text-deep-600 shrink-0">
                      {placement.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm">{placement.name}</CardTitle>
                      <CardDescription className="text-[10px]">{placement.track} · {placement.cohort}</CardDescription>
                    </div>
                  </div>
                  <Badge className={config.color}>{config.label}</Badge>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-deep-600">Role</span>
                      <Badge className={ROLE_COLORS[placement.role] || 'bg-gray-50 text-gray-600'}>{placement.role}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-deep-600">Project</span>
                      <span className="text-xs text-gray-600">{placement.project || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-deep-600">Match Score</span>
                      <span className="text-xs text-gray-600">{placement.matchScore || 'N/A'}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-deep-600">Start Date</span>
                      <span className="text-xs text-gray-600">{placement.startDate || 'TBD'}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 text-[10px]">
                    <span className="text-gray-400">30-</span>
                    <span className="text-gray-400">60-</span>
                    <span className="text-gray-400">90-</span>
                  </div>
                </div>
                <CardFooter className="flex items-center justify-between pt-3">
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/placement/${placement.id}`) }}>
                    Manage
                  </Button>
                </CardFooter>
              </Card>
            )}
          )}
        )}
      </div>
    </div>
  )
}

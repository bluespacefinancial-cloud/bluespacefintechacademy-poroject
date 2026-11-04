import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Clock, Activity, Award, Target, Plus, Search, Eye } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '../components/ui/select'

const TRACK_COLORS = {
  Finsoft: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  Finops: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const MOCK_SQUADS = [
  {
    id: 1,
    name: 'Squad Alpha',
    cohort: 'Cohort 1 - December 2026',
    useCase: 'FinCore Ledger Integration',
    members: 7,
    finsoftCount: 4,
    finopsCount: 3,
    sprint: 'Sprint 1 of 3',
    status: 'active',
    lead: 'Ada Okonkwo',
  },
  {
    id: 2,
    name: 'Squad Beta',
    cohort: 'Cohort 1 - December 2026',
    useCase: 'FaaS Partner API Onboarding',
    members: 7,
    finsoftCount: 4,
    finopsCount: 3,
    sprint: 'Sprint 1 of 3',
    status: 'active',
    lead: 'Kwame Asante',
  },
  {
    id: 3,
    name: 'Squad Gamma',
    cohort: 'Cohort 1 - December 2026',
    useCase: 'FinOps Automated Reconciliation',
    members: 6,
    finsoftCount: 3,
    finopsCount: 3,
    sprint: 'Sprint 2 of 3',
    status: 'active',
    lead: 'Zainab Yusuf',
  },
  {
    id: 4,
    name: 'Squad Delta',
    cohort: 'Cohort 2 - March 2027',
    useCase: 'FinInfra CI/CD Pipeline',
    members: 7,
    finsoftCount: 4,
    finopsCount: 3,
    sprint: 'Not Started',
    status: 'forming',
    lead: 'Fatima Diallo',
  },
]

export default function SquadManagement() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filtered = squads.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.useCase.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-deep-600 mb-1">Squad Management</h1>
            <p className="text-sm text-gray-500">Manage mixed-track squads for live project delivery</p>
          </div>
          <Button onClick={() => navigate('/squads/create')}>
            <Plus size={16} className="mr-2" />
            Create Squad
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by squad name or use case..."
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</span>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="forming">Forming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">{squads.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Squads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">{squads.filter((s) => s.status === 'active').length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">{squads.reduce((sum, s) => sum + s.members, 0)}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">{squads.filter((s) => s.status === 'active').reduce((sum, s) => sum + s.finsoftCount, 0)}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Finsoft Members</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users size={32} className="mx-auto mb-3 opacity-50" />
            <p>No squads found</p>
          </div>
        ) : 
          filtered.map((squad) => {
            return (
            <Card
              key={squad.id}
              className="cursor-pointer hover:border-brand-200 transition-colors duration-150"
              onClick={() => navigate(`/squads/${squad.id}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-deep-100 flex items-center justify-center text-xs font-bold text-deep-600 shrink-0">
                    {squad.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm">{squad.name}</CardTitle>
                    <CardDescription className="text-[10px]">{squad.cohort} · {squad.useCase}</CardDescription>
                  </div>
                </div>
                <Badge className={squad.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-100'}>{squad.status}</Badge>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-deep-600">Sprint</span>
                    <span className="text-xs text-gray-600">{squad.sprint}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-deep-600">Squad Lead</span>
                    <span className="text-xs text-gray-600">{squad.lead}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-deep-600">Members</span>
                    <span className="text-xs text-gray-600">{squad.finsoftCount} Finsoft + {squad.finopsCount} Finops</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Badge className={TRACK_COLORS.Finsoft}>{squad.finsoftCount} Finsoft</Badge>
                  <Badge className={TRACK_COLORS.Finops}>{squad.finopsCount} Finops</Badge>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between pt-3">
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/squads/${squad.id}/members`) }}>
                  <Users size={12} className="mr-1" />
                  View Members
                </Button>
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/squads/${squad.id}/sprints`) }}>
                  <Activity size={12} className="mr-1" />
                  Sprints
                </Button>
              </CardFooter>
            </Card>
            )
          })}
      </div>
    </div>
  )
}

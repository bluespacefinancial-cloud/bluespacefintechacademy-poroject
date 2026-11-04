import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, Plus } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '../components/ui/select'
import { supabase } from '../lib/supabase'

const DOMAIN_COLORS = {
  FaaS: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  FinCore: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  FinOps: 'bg-amber-100 text-amber-700 border-amber-200',
  FinInfra: 'bg-slate-100 text-slate-700 border-slate-200',
}

const STATUS_COLORS = {
  proposed: 'bg-gray-50 text-gray-600',
  qualified: 'bg-brand-50 text-brand-700 border-brand-100',
  assigned: 'bg-amber-50 text-amber-700 border-amber-100',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  archived: 'bg-slate-50 text-slate-600 border-slate-100',
}

export default function UseCaseAssignment() {
  const navigate = useNavigate()
  const [useCases, setUseCases] = useState([])
  const [search, setSearch] = useState('')
  const [filterDomain, setFilterDomain] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadUseCases = async () => {
      const [{ data, error: loadError }, { data: cohorts, error: cohortsError }, { data: squads, error: squadsError }] = await Promise.all([
        supabase.from('use_cases').select('*').order('created_at', { ascending: false }),
        supabase.from('cohorts').select('id, name'),
        supabase.from('squads').select('id, name'),
      ])
      if (loadError) throw loadError
      if (cohortsError) throw cohortsError
      if (squadsError) throw squadsError
      const cohortNames = new Map((cohorts || []).map((cohort) => [cohort.id, cohort.name]))
      const squadNames = new Map((squads || []).map((squad) => [squad.id, squad.name]))
      setUseCases((data || []).map((item) => ({
        ...item,
        cohort: cohortNames.get(item.cohort_id) || 'Unassigned cohort',
        squad: squadNames.get(item.squad_id) || null,
        sandboxAccess: item.sandbox_access,
        anonymisedData: item.anonymised_data,
      })))
    }
    loadUseCases().catch((loadError) => setError(loadError.message || 'Unable to load use cases')).finally(() => setLoading(false))
  }, [])

  const filtered = useCases.filter((u) => {
    const matchesSearch = u.title.toLowerCase().includes(search.toLowerCase()) ||
      (u.stakeholder || '').toLowerCase().includes(search.toLowerCase())
    const domainMatch = filterDomain === 'all' || u.domain === filterDomain
    const statusMatch = filterStatus === 'all' || u.status === filterStatus
    return matchesSearch && domainMatch && statusMatch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-deep-600 mb-1">Use Case Assignment</h1>
            <p className="text-sm text-gray-500">
              Assign live Factory use cases to squads for project delivery
            </p>
          </div>
          <Button onClick={() => navigate('/use-cases/create')}>
            <Plus size={16} className="mr-2" />
            Add Use Case
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or stakeholder..."
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</span>
          <Select value={filterDomain} onValueChange={(v) => setFilterDomain(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All domains" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              <SelectItem value="FaaS">FaaS</SelectItem>
              <SelectItem value="FinCore">FinCore</SelectItem>
              <SelectItem value="FinOps">FinOps</SelectItem>
              <SelectItem value="FinInfra">FinInfra</SelectItem>
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
              <SelectItem value="proposed">Proposed</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">{useCases.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Use Cases</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">
              {useCases.filter((u) => u.status === 'assigned').length}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Assigned to Squads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">
              {useCases.filter((u) => u.status === 'proposed').length}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Proposed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">
              {useCases.filter((u) => u.sandboxAccess).length}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Sandbox Access</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {loading && <p className="py-8 text-center text-sm text-gray-500">Loading use cases...</p>}
        {!loading && filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Target size={32} className="mx-auto mb-3 opacity-50" />
            <p>No use cases found</p>
          </div>
        ) :
          filtered.map((useCase) => (
            <Card
              key={useCase.id}
              className="cursor-pointer hover:border-brand-200 transition-colors duration-150"
              onClick={() => navigate(`/use-cases/${useCase.id}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0">
                    <Target size={14} className="text-deep-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm">{useCase.title}</CardTitle>
                    <CardDescription className="text-[10px]">{useCase.cohort} · {useCase.domain}</CardDescription>
                  </div>
                </div>
                <Badge className={DOMAIN_COLORS[useCase.domain]}>{useCase.domain}</Badge>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-deep-600">Stakeholder</span>
                    <span className="text-xs text-gray-600">{useCase.stakeholder}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-deep-600">Assigned Squad</span>
                    <span className="text-xs text-gray-600">{useCase.squad || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-deep-600">Sandbox</span>
                    <span className="text-xs text-gray-600">{useCase.sandboxAccess ? 'Enabled' : 'Not enabled'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-deep-600">Data</span>
                    <span className="text-xs text-gray-600">{useCase.anonymisedData ? 'Anonymised' : 'Real'}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between pt-3">
                <Badge className={STATUS_COLORS[useCase.status] || 'bg-gray-50 text-gray-600'}>
                  {useCase.status.charAt(0).toUpperCase() + useCase.status.slice(1)}
                </Badge>
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/use-cases/${useCase.id}/assign`) }}>
                  Assign Squad
                </Button>
              </CardFooter>
            </Card>
          ))}
      </div>
    </div>
  )
}

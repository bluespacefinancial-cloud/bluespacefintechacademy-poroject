import { useEffect, useState } from 'react'
import { Target, Plus, Edit3, X, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
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

const DOMAIN_COLORS = {
  FaaS: 'text-brand-700 border-brand-200',
  FinCore: 'text-emerald-700 border-emerald-200',
  FinOps: 'text-amber-700 border-amber-200',
  FinInfra: 'text-slate-700 border-slate-200',
}

const STATUS_COLORS = {
  proposed: 'text-gray-600 border-gray-200',
  qualified: 'text-brand-700 border-brand-200',
  assigned: 'text-amber-700 border-amber-200',
  completed: 'text-emerald-700 border-emerald-200',
  archived: 'text-slate-600 border-slate-200',
}

export default function UseCaseAssignment() {
  const [useCases, setUseCases] = useState([])
  const [search, setSearch] = useState('')
  const [filterDomain, setFilterDomain] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadUseCases = async () => {
      const [{ data, error: loadError }, { data: cohorts, error: cohortsError }, { data: squads, error: squadsError }] = await Promise.all([
        api.from('use_cases').select('*').order('created_at', { ascending: false }),
        api.from('cohorts').select('id, name'),
        api.from('squads').select('id, name'),
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

  const startEdit = (useCase) => {
    setEditForm({
      title: useCase.title,
      stakeholder: useCase.stakeholder,
      domain: useCase.domain,
      status: useCase.status,
      sandbox_access: useCase.sandbox_access,
      anonymised_data: useCase.anonymised_data,
    })
    setEditingId(useCase.id)
    setError('')
    setMessage('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
    setError('')
    setMessage('')
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    setSaving(editingId)
    setError('')
    try {
      const { error: updateError } = await api
        .from('use_cases')
        .update({
          title: editForm.title,
          stakeholder: editForm.stakeholder,
          domain: editForm.domain,
          status: editForm.status,
          sandbox_access: editForm.sandbox_access,
          anonymised_data: editForm.anonymised_data,
        })
        .eq('id', editingId)
      if (updateError) throw updateError
      setMessage('Use case updated')
      setEditingId(null)
      const loadUseCases = async () => {
        const [{ data, error: loadError }, { data: cohorts, error: cohortsError }, { data: squads, error: squadsError }] = await Promise.all([
          api.from('use_cases').select('*').order('created_at', { ascending: false }),
          api.from('cohorts').select('id, name'),
          api.from('squads').select('id, name'),
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
      await loadUseCases()
    } catch (saveError) {
      setError(saveError.message || 'Unable to update use case')
    } finally {
      setSaving(null)
    }
  }

  const deleteUseCase = async (id) => {
    if (!window.confirm('Delete this use case? This cannot be undone.')) return
    try {
      const { error: delError } = await api.from('use_cases').delete().eq('id', id)
      if (delError) throw delError
      setMessage('Use case deleted')
      const loadUseCases = async () => {
        const [{ data, error: loadError }, { data: cohorts, error: cohortsError }, { data: squads, error: squadsError }] = await Promise.all([
          api.from('use_cases').select('*').order('created_at', { ascending: false }),
          api.from('cohorts').select('id, name'),
          api.from('squads').select('id, name'),
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
      await loadUseCases()
    } catch (delError) {
      setError(delError.message || 'Unable to delete use case')
    }
  }

  const createUseCase = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const { error: createError } = await api.from('use_cases').insert({
        title: editForm.title || 'New Use Case',
        stakeholder: editForm.stakeholder,
        domain: editForm.domain,
        status: editForm.status || 'proposed',
        sandbox_access: editForm.sandbox_access,
        anonymised_data: editForm.anonymised_data,
      })
      if (createError) throw createError
      setMessage('Use case created')
      setEditForm({})
      setEditingId(null)
      const loadUseCases = async () => {
        const [{ data, error: loadError }, { data: cohorts, error: cohortsError }, { data: squads, error: squadsError }] = await Promise.all([
          api.from('use_cases').select('*').order('created_at', { ascending: false }),
          api.from('cohorts').select('id, name'),
          api.from('squads').select('id, name'),
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
      await loadUseCases()
    } catch (createError) {
      setError(createError.message || 'Unable to create use case')
    }
  }

  const assignSquad = async (useCaseId, squadId) => {
    if (!squadId) return
    setSaving(useCaseId)
    try {
      const { error: assignError } = await api
        .from('use_cases')
        .update({ squad_id: Number(squadId) })
        .eq('id', useCaseId)
      if (assignError) throw assignError
      setMessage('Squad assigned')
      const loadUseCases = async () => {
        const [{ data, error: loadError }, { data: cohorts, error: cohortsError }, { data: squads, error: squadsError }] = await Promise.all([
          api.from('use_cases').select('*').order('created_at', { ascending: false }),
          api.from('cohorts').select('id, name'),
          api.from('squads').select('id, name'),
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
      await loadUseCases()
    } catch (assignError) {
      setError(assignError.message || 'Unable to assign squad')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Use Case Assignment</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Assign live Factory use cases to squads for project delivery
            </p>
          </div>
          {editingId ? (
            <Button variant="outline" size="sm" onClick={cancelEdit}>
              <X size={14} /> Cancel
            </Button>
          ) : (
            <Button onClick={() => { setEditForm({ domain: 'FaaS', status: 'proposed', sandbox_access: false, anonymised_data: true }); setEditingId('new'); setError(''); setMessage('') }}>
              <Plus size={16} className="mr-2" />
              Add Use Case
            </Button>
          )}
        </div>
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}

      {editingId === 'new' ? (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={createUseCase} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-deep-600 mb-1">Title</label>
                  <Input type="text" required value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="e.g. Build automated ledger" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-deep-600 mb-1">Stakeholder</label>
                  <Input type="text" value={editForm.stakeholder} onChange={(e) => setEditForm({ ...editForm, stakeholder: e.target.value })} placeholder="e.g. FinCore Domain Lead" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-deep-600 mb-1">Domain</label>
                  <Select value={editForm.domain} onValueChange={(v) => setEditForm({ ...editForm, domain: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={editForm.domain || 'Select'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FaaS">FaaS</SelectItem>
                      <SelectItem value="FinCore">FinCore</SelectItem>
                      <SelectItem value="FinOps">FinOps</SelectItem>
                      <SelectItem value="FinInfra">FinInfra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-deep-600 mb-1">Status</label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={editForm.status || 'Select'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proposed">Proposed</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <label className="text-xs font-medium text-deep-600 mr-2">Sandbox Access</label>
                  <Select value={String(editForm.sandbox_access)} onValueChange={(v) => setEditForm({ ...editForm, sandbox_access: v === 'true' })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={editForm.sandbox_access ? 'Enabled' : 'Disabled'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Enabled</SelectItem>
                      <SelectItem value="false">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <label className="text-xs font-medium text-deep-600 mr-2">Anonymised Data</label>
                  <Select value={String(editForm.anonymised_data)} onValueChange={(v) => setEditForm({ ...editForm, anonymised_data: v === 'true' })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={editForm.anonymised_data ? 'Yes' : 'No'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit">Add Use Case</Button>
                <Button variant="outline" type="button" onClick={cancelEdit}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

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
        <Card className="dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{useCases.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Use Cases</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {useCases.filter((u) => u.status === 'assigned').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assigned to Squads</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600 dark:text-blue-400">
              {useCases.filter((u) => u.status === 'proposed').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Proposed</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {useCases.filter((u) => u.sandboxAccess).length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sandbox Access</p>
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
              className={`cursor-pointer hover:border-brand-200 transition-colors duration-150 ${editingId === useCase.id ? 'bg-brand-50' : ''}`}
            >
              {editingId === useCase.id ? (
                <>
                  <td colSpan={6} className="p-4">
                    <Card>
                      <CardContent className="p-4">
                        <form onSubmit={saveEdit} className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-4">
                            <div>
                              <label className="block text-xs font-medium text-deep-600 mb-1">Title</label>
                              <Input type="text" required value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-deep-600 mb-1">Stakeholder</label>
                              <Input type="text" value={editForm.stakeholder} onChange={(e) => setEditForm({ ...editForm, stakeholder: e.target.value })} />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-deep-600 mb-1">Domain</label>
                              <Select value={editForm.domain} onValueChange={(v) => setEditForm({ ...editForm, domain: v })}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={editForm.domain} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="FaaS">FaaS</SelectItem>
                                  <SelectItem value="FinCore">FinCore</SelectItem>
                                  <SelectItem value="FinOps">FinOps</SelectItem>
                                  <SelectItem value="FinInfra">FinInfra</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-deep-600 mb-1">Status</label>
                              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={editForm.status} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="proposed">Proposed</SelectItem>
                                  <SelectItem value="qualified">Qualified</SelectItem>
                                  <SelectItem value="assigned">Assigned</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-end">
                              <label className="text-xs font-medium text-deep-600 mr-2">Sandbox Access</label>
                              <Select value={String(editForm.sandbox_access)} onValueChange={(v) => setEditForm({ ...editForm, sandbox_access: v === 'true' })}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={editForm.sandbox_access ? 'Enabled' : 'Disabled'} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">Enabled</SelectItem>
                                  <SelectItem value="false">Disabled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-end">
                              <label className="text-xs font-medium text-deep-600 mr-2">Anonymised Data</label>
                              <Select value={String(editForm.anonymised_data)} onValueChange={(v) => setEditForm({ ...editForm, anonymised_data: v === 'true' })}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={editForm.anonymised_data ? 'Yes' : 'No'} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">Yes</SelectItem>
                                  <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex gap-3 mt-2">
                            <Button type="submit" disabled={saving === useCase.id}>{saving === useCase.id ? 'Saving...' : 'Save'}</Button>
                            <Button variant="outline" type="button" onClick={cancelEdit}>Cancel</Button>
                            <Button variant="destructive" type="button" onClick={() => deleteUseCase(useCase.id)}>Delete</Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </td>
                </>
              )
              : (
                <>
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
                    <Badge className={STATUS_COLORS[useCase.status] || 'text-gray-600'}>
                      {useCase.status.charAt(0).toUpperCase() + useCase.status.slice(1)}
                    </Badge>
                    <div className="flex gap-2">
                      <Select
                        value={useCase.squad || ''}
                        onValueChange={(v) => assignSquad(useCase.id, v || null)}
                        className="w-[150px]"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={useCase.squad || 'Select squad'} />
                        </SelectTrigger>
                        <SelectContent>
                          {useCases.filter(uc => uc.id !== useCase.id).map((uc) => {
                            if (uc.squad) {
                              return <SelectItem key={`squad-${uc.squad}`} value={uc.squad}>{uc.squad}</SelectItem>
                            }
                            return null
                          })}
                          {/* Also fetch all squads for assignment */}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); startEdit(useCase) }}>
                        <Edit3 size={12} />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); deleteUseCase(useCase.id) }}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </CardFooter>
                </>
              )}
            </Card>
          ))}
      </div>
    </div>
  )
}

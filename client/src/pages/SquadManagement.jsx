/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { Plus, Users } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { api } from '../lib/backend'
import { useAuth } from '../context/AuthContext'

export default function SquadManagement() {
  const { user } = useAuth()
  const canManage = user?.type === 'Administrator'
  const [squads, setSquads] = useState([])
  const [cohorts, setCohorts] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', cohort_id: '' })
  const [memberChoices, setMemberChoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    const [{ data, error: squadError }, { data: cohortRows, error: cohortError }, { data: enrolments, error: enrolmentError }, { data: users, error: usersError }] = await Promise.all([
      api.from('squads').select('*').order('created_at', { ascending: false }),
      api.from('cohorts').select('id, name'),
      api.from('enrolments').select('squad_id, cohort_id, track, user_id'),
      api.from('users').select('id, name'),
    ])
    if (squadError) throw squadError
    if (cohortError) throw cohortError
    if (enrolmentError) throw enrolmentError
    if (usersError) throw usersError
    const cohortMap = new Map((cohortRows || []).map((item) => [item.id, item.name]))
    const userMap = new Map((users || []).map((item) => [item.id, item.name]))
    setCohorts(cohortRows || [])
    setMemberChoices((enrolments || []).filter((item) => !item.squad_id).map((item) => ({ ...item, name: userMap.get(item.user_id) || `Student ${item.user_id}` })))
    setSquads((data || []).map((squad) => {
      const members = (enrolments || []).filter((item) => item.squad_id === squad.id)
      return { ...squad, cohortName: cohortMap.get(squad.cohort_id) || 'Unknown cohort', members, leadName: userMap.get(squad.squad_lead_id) || 'Not assigned', finsoft: members.filter((item) => item.track === 'Finsoft').length, finops: members.filter((item) => item.track === 'Finops').length }
    }))
  }

  useEffect(() => { load().catch((loadError) => setError(loadError.message || 'Unable to load squads')).finally(() => setLoading(false)) }, [])

  const createSquad = async (event) => {
    event.preventDefault()
    if (!canManage) { setError('Only administrators can create squads.'); return }
    setError('')
    const { data: created, error: createError } = await api
      .from('squads')
      .insert({ name: form.name.trim(), cohort_id: Number(form.cohort_id) })
      .select('id')
      .maybeSingle()
    if (createError) { setError(createError.message); return }
    if (!created) { setError('Squad was not created. Your account may not have permission to manage squads.'); return }
    setForm({ name: '', cohort_id: '' }); setShowCreate(false); await load()
  }

  const assignMember = async (squadId, userId) => {
    if (!userId) return
    if (!canManage) { setError('Only administrators can assign squad members.'); return }
    setError('')
    const { data: updated, error: assignError } = await api
      .from('enrolments')
      .update({ squad_id: Number(squadId), updated_at: new Date().toISOString() })
      .eq('user_id', Number(userId))
      .in('status', ['enrolled', 'active'])
      .select('user_id')
      .maybeSingle()
    if (assignError) { setError(assignError.message); return }
    if (!updated) { setError('No enrolment was updated. Your account may not have permission to change squad assignments.'); return }
    await load()
  }

  const filtered = useMemo(() => squads.filter((squad) => (!search || `${squad.name} ${squad.cohortName}`.toLowerCase().includes(search.toLowerCase())) && (status === 'all' || (squad.members.length ? 'active' : 'forming') === status)), [squads, search, status])
  const totalMembers = squads.reduce((sum, squad) => sum + squad.members.length, 0)

  return (
    <div className="w-full space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Squad Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage live project squads and their enrolments.</p>
        </div>
        {canManage && <Button onClick={() => setShowCreate(!showCreate)}><Plus size={16} className="mr-2" />Create Squad</Button>}
      </div>
      {!canManage && (
        <p className="mb-4 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-card p-3 text-sm text-gray-600 dark:text-gray-300">
          Read-only view. Squad creation and member assignment are restricted to administrators.
        </p>
      )}
      {error && <p className="mb-4 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
      {showCreate && canManage && (
        <Card className="mb-6 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-sm">Create squad</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createSquad} className="grid gap-3 md:grid-cols-3">
              <Input placeholder="Squad name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              <Select value={form.cohort_id} onValueChange={(value) => setForm({ ...form, cohort_id: value })}>
                <SelectTrigger className="dark:border-gray-800"><SelectValue placeholder="Select cohort" /></SelectTrigger>
                <SelectContent>
                  {cohorts.map((cohort) => <SelectItem key={cohort.id} value={String(cohort.id)}>{cohort.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="submit">Create</Button>
            </form>
          </CardContent>
        </Card>
      )}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{squads.length}</p>
            <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Squads</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{squads.filter((squad) => squad.members.length).length}</p>
            <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Active squads</p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-800">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600 dark:text-blue-400">{totalMembers}</p>
            <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Members</p>
          </CardContent>
        </Card>
      </div>
      <div className="mb-5 flex gap-3">
        <Input placeholder="Search squads or cohorts" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40 dark:border-gray-800"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="forming">Forming</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {loading && <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Loading squads...</p>}
      {!loading && filtered.length === 0 && <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">No squads found.</p>}
      <div className="space-y-3">
        {filtered.map((squad) => (
          <Card key={squad.id} className="dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">{squad.name}</CardTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400">{squad.cohortName} · Lead: {squad.leadName}</p>
              </div>
              <Badge variant="outline">{squad.members.length ? 'Active' : 'Forming'}</Badge>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                <Users size={14} /> {squad.members.length} members <Badge variant="outline">{squad.finsoft} Finsoft</Badge><Badge variant="outline">{squad.finops} Finops</Badge>
              </div>
              {canManage ? (
                <select
                  className="w-full rounded border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2 text-xs"
                  value=""
                  onChange={(event) => assignMember(squad.id, event.target.value)}
                >
                  <option value="">Assign an unassigned enrolment...</option>
                  {memberChoices.filter((member) => member.cohort_id === squad.cohort_id).map((member) => (
                    <option key={member.user_id} value={member.user_id}>{member.name} · {member.track}</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">Member assignment is managed by administrators.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

import { useEffect, useState, useRef } from 'react'
import { Search, Edit3, X, Trash2, Plus } from 'lucide-react'
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

const STATUS_COLORS = {
  enrolled: 'text-gray-600 border-gray-200',
  active: 'text-brand-700 border-brand-200',
  completed: 'text-emerald-700 border-emerald-200',
  withdrawn: 'text-red-700 border-red-200',
  suspended: 'text-amber-700 border-amber-200',
}

const STATUS_LABELS = {
  enrolled: 'Enrolled',
  active: 'Active',
  completed: 'Completed',
  withdrawn: 'Withdrawn',
  suspended: 'Suspended',
}

export default function Enrolments() {
  const [enrolments, setEnrolments] = useState([])
  const [search, setSearch] = useState('')
  const [filterTrack, setFilterTrack] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [total, setTotal] = useState(0)
  const prevFilters = useRef(`${search}|${filterTrack}|${filterStatus}`)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadEnrolments()
  }, [search, filterTrack, filterStatus, page, pageSize])

  const loadEnrolments = async () => {
    const currentFilters = `${search}|${filterTrack}|${filterStatus}`
    if (currentFilters !== prevFilters.current) {
      prevFilters.current = currentFilters
      setPage(1)
    }

    try {
      const from = (page - 1) * pageSize
      const to = page * pageSize - 1
      let q = api
        .from('enrolments')
        .select(
          `
          *,
          users (
            name,
            email
          ),
          cohorts (
            name
          ),
          squads (
            name
          )
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(from, to)

      if (filterTrack !== 'all') {
        q = q.eq('track', filterTrack)
      }

      if (filterStatus !== 'all') {
        q = q.eq('status', filterStatus)
      }

      if (search.trim()) {
        const term = `%${search.trim()}%`
        q = q.or(`users.name.ilike.${term},users.email.ilike.${term}`)
      }

      const { data, error, count } = await q

      if (error) throw error

      const dataWithNames = (data || []).map((e) => ({
        id: e.id,
        name: e.users?.name || 'Unknown',
        email: e.users?.email || 'Unknown',
        cohort: e.cohorts?.name || 'Unknown',
        track: e.track,
        squad: e.squads?.name || 'Unassigned',
        status: e.status,
        enrolledAt: e.created_at,
      }))

      setEnrolments(dataWithNames)
      setTotal(count ?? 0)
    } catch (err) {
      console.error('Error loading enrolments:', err)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const startIndex = (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, total)

  const filtered = enrolments.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase())
    const matchesTrack = filterTrack === 'all' || e.track === filterTrack
    const matchesStatus = filterStatus === 'all' || e.status === filterStatus
    return matchesSearch && matchesTrack && matchesStatus
  })

  const startEdit = (enrolment) => {
    setEditForm({
      track: enrolment.track,
      status: enrolment.status,
    })
    setEditingId(enrolment.id)
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
        .from('enrolments')
        .update({
          track: editForm.track,
          status: editForm.status,
        })
        .eq('id', editingId)
      if (updateError) throw updateError
      setMessage('Enrolment updated')
      setEditingId(null)
      await loadEnrolments()
    } catch (saveError) {
      setError(saveError.message || 'Unable to update enrolment')
    } finally {
      setSaving(null)
    }
  }

  const deleteEnrolment = async (id) => {
    if (!window.confirm('Delete this enrolment? This cannot be undone.')) return
    try {
      const { error: delError } = await api.from('enrolments').delete().eq('id', id)
      if (delError) throw delError
      setMessage('Enrolment deleted')
      await loadEnrolments()
    } catch (delError) {
      setError(delError.message || 'Unable to delete enrolment')
    }
  }

  const createEnrolment = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const { error: createError } = await api.from('enrolments').insert({
        user_id: Number(editForm.user_id),
        cohort_id: Number(editForm.cohort_id),
        track: editForm.track,
        status: editForm.status || 'enrolled',
      })
      if (createError) throw createError
      setMessage('Enrolment created')
      setEditForm({})
      setEditingId(null)
      await loadEnrolments()
    } catch (createError) {
      setError(createError.message || 'Unable to create enrolment')
    }
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Enrolments</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage trainee enrolments and track assignments
            </p>
          </div>
          {editingId ? (
            <Button variant="outline" size="sm" onClick={cancelEdit}>
              <X size={14} /> Cancel
            </Button>
          ) : (
            <Button onClick={() => { setEditForm({ track: 'Finsoft', status: 'enrolled' }); setEditingId('new'); setError(''); setMessage('') }}>
              <Plus size={16} className="mr-2" />
              Add Trainee
            </Button>
          )}
        </div>
      </div>

      {error && <p role="alert" className="mb-4 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 text-sm text-red-700 dark:text-red-400">{error}</p>}
      {message && <p role="status" className="mb-4 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-3 text-sm text-emerald-700 dark:text-emerald-400">{message}</p>}

      {editingId === 'new' ? (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={createEnrolment} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-deep-600 mb-1">User ID</label>
                  <Input type="number" required value={editForm.user_id || ''} onChange={(e) => setEditForm({ ...editForm, user_id: e.target.value })} placeholder="e.g. 1" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-deep-600 mb-1">Cohort ID</label>
                  <Input type="number" required value={editForm.cohort_id || ''} onChange={(e) => setEditForm({ ...editForm, cohort_id: e.target.value })} placeholder="e.g. 1" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-deep-600 mb-1">Track</label>
                  <Select value={editForm.track} onValueChange={(v) => setEditForm({ ...editForm, track: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={editForm.track || 'Select'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Finsoft">Finsoft</SelectItem>
                      <SelectItem value="Finops">Finops</SelectItem>
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
                      <SelectItem value="enrolled">Enrolled</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="withdrawn">Withdrawn</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit">Add Trainee</Button>
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
            placeholder="Search by name or email..."
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Track</span>
          <Select value={filterTrack} onValueChange={(value) => setFilterTrack(value)}>
            <SelectTrigger className="w-[140px]">
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
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</span>
          <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="enrolled">Enrolled</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{enrolments.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Enrolments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {enrolments.filter((e) => e.track === 'Finsoft').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Finsoft</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {enrolments.filter((e) => e.track === 'Finops').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Finops</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {enrolments.filter((e) => e.status === 'active').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Search size={32} className="mx-auto mb-3 opacity-50" />
            <p>No enrolments found</p>
          </div>
        ) :
          filtered.map((enrolment) => (
            <Card
              key={enrolment.id}
              className={`cursor-pointer hover:border-brand-200 dark:hover:border-gray-700 transition-colors duration-150 ${editingId === enrolment.id ? 'bg-deep-50/50 dark:bg-deep-950/40' : ''}`}
            >
              {editingId === enrolment.id ? (
                <>
                  <td colSpan={6} className="p-4">
                    <Card>
                      <CardContent className="p-4">
                        <form onSubmit={saveEdit} className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-4">
                            <div>
                              <label className="block text-xs font-medium text-deep-600 mb-1">Student</label>
                              <Input type="text" disabled value={enrolment.name} />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-deep-600 mb-1">Track</label>
                              <Select value={editForm.track} onValueChange={(v) => setEditForm({ ...editForm, track: v })}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={editForm.track} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Finsoft">Finsoft</SelectItem>
                                  <SelectItem value="Finops">Finops</SelectItem>
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
                                  <SelectItem value="enrolled">Enrolled</SelectItem>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                                  <SelectItem value="suspended">Suspended</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-deep-600 mb-1">Squad</label>
                              <Input type="text" disabled value={enrolment.squad} />
                            </div>
                          </div>
                          <div className="flex gap-3 mt-2">
                            <Button type="submit" disabled={saving === enrolment.id}>{saving === enrolment.id ? 'Saving...' : 'Save'}</Button>
                            <Button variant="outline" type="button" onClick={cancelEdit}>Cancel</Button>
                            <Button variant="destructive" type="button" onClick={() => deleteEnrolment(enrolment.id)}>Delete</Button>
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
                      <div className="h-8 w-8 rounded-full bg-deep-100 flex items-center justify-center text-xs font-bold text-deep-600 shrink-0">
                        {enrolment.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm">{enrolment.name}</CardTitle>
                        <CardDescription className="text-[10px]">{enrolment.email}</CardDescription>
                      </div>
                    </div>
                    <Badge className={STATUS_COLORS[enrolment.status] || 'text-gray-600'}>{STATUS_LABELS[enrolment.status]}</Badge>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-deep-600">Cohort</span>
                        <span className="text-xs text-gray-600">{enrolment.cohort}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-deep-600">Track</span>
                        <span className="text-xs text-gray-600">{enrolment.track}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-deep-600">Squad</span>
                        <span className="text-xs text-gray-600">{enrolment.squad}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-deep-600">Enrolled</span>
                        <span className="text-xs text-gray-600">{new Date(enrolment.enrolledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between pt-3">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); startEdit(enrolment) }}>
                      <Edit3 size={12} />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); deleteEnrolment(enrolment.id) }}>
                      <Trash2 size={12} />
                    </Button>
                  </CardFooter>
                </>
              )}
            </Card>
          ))}
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {startIndex}–{endIndex} of {total} enrolments
          </p>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Prev
            </Button>
            {[...Array(totalPages)].map((_, i) => {
              const p = i + 1
              const show =
                p === 1 ||
                p === totalPages ||
                (p >= page - 2 && p <= page + 2)
              if (!show) return null
              if (p === page - 3 || p === page + 3) {
                return (
                  <span key={p} className="text-xs text-gray-400 px-2">
                    …
                  </span>
                )
              }
              return (
                <Button
                  key={p}
                  size="sm"
                  variant={page === p ? 'default' : 'outline'}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              )
            })}
            <Button
              size="sm"
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

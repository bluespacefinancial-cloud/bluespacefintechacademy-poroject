import { useEffect, useState } from 'react'
import { Plus, Edit3, Eye, X, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { api } from '../lib/backend'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from '../components/ui/select'
import { Input } from '../components/ui/input'

const STATUS_COLORS = {
  planned: 'text-gray-600 border-gray-200',
  active: 'text-brand-700 border-brand-200',
  completed: 'text-emerald-700 border-emerald-200',
  archived: 'text-slate-600 border-slate-200',
}

const STATUS_LABELS = {
  planned: 'Planned',
  active: 'Active',
  completed: 'Completed',
  archived: 'Archived',
}

export default function Cohorts() {
  const [cohorts, setCohorts] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadCohorts()
  }, [])

  const loadCohorts = async () => {
    try {
      const { data, error } = await api
        .from('cohorts')
        .select('*')
        .order('start_date', { ascending: true })

      if (error) throw error
      setCohorts(data || [])
    } catch (err) {
      console.error('Error loading cohorts:', err)
    }
  }

  const filteredCohorts = cohorts.filter((c) => {
    if (filterStatus === 'all') return true
    return c.status === filterStatus
  })

  const startEdit = (cohort) => {
    setEditForm({
      name: cohort.name,
      start_date: cohort.start_date,
      end_date: cohort.end_date,
      capacity: String(cohort.capacity || ''),
      status: cohort.status,
      track_finsoft: Boolean(cohort.track_finsoft),
      track_finops: Boolean(cohort.track_finops),
    })
    setEditingId(cohort.id)
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
        .from('cohorts')
        .update({
          name: editForm.name,
          start_date: editForm.start_date,
          end_date: editForm.end_date,
          capacity: Number(editForm.capacity) || 0,
          status: editForm.status,
          track_finsoft: editForm.track_finsoft,
          track_finops: editForm.track_finops,
        })
        .eq('id', editingId)
      if (updateError) throw updateError
      setMessage('Cohort updated')
      setEditingId(null)
      await loadCohorts()
    } catch (saveError) {
      setError(saveError.message || 'Unable to update cohort')
    } finally {
      setSaving(null)
    }
  }

  const deleteCohort = async (id) => {
    if (!window.confirm('Delete this cohort? This cannot be undone.')) return
    try {
      const { error: delError } = await api.from('cohorts').delete().eq('id', id)
      if (delError) throw delError
      setMessage('Cohort deleted')
      await loadCohorts()
    } catch (delError) {
      setError(delError.message || 'Unable to delete cohort')
    }
  }

  const createCohort = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const { error: createError } = await api.from('cohorts').insert({
        name: editForm.name || 'New Cohort',
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        capacity: Number(editForm.capacity) || 0,
        status: editForm.status || 'planned',
        track_finsoft: editForm.track_finsoft,
        track_finops: editForm.track_finops,
      })
      if (createError) throw createError
      setMessage('Cohort created')
      setEditForm({})
      setEditingId(null)
      await loadCohorts()
    } catch (createError) {
      setError(createError.message || 'Unable to create cohort')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-deep-600 mb-1">Cohorts</h1>
            <p className="text-sm text-gray-500">
              Manage quarterly cohorts and enrolment capacity
            </p>
          </div>
          {editingId ? (
            <Button variant="outline" size="sm" onClick={cancelEdit}>
              <X size={14} /> Cancel
            </Button>
          ) : (
            <Button onClick={() => { setEditForm({}); setEditingId('new'); setError(''); setMessage('') }}>
              <Plus size={16} className="mr-2" />
              Create Cohort
            </Button>
          )}
        </div>
      </div>

      {error && <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}

      {editingId === 'new' && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={createCohort} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-deep-600 mb-1">Cohort Name</label>
                  <Input type="text" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="e.g. Dec 2026 Intake" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-deep-600 mb-1">Start Date</label>
                  <Input type="date" required value={editForm.start_date} onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-deep-600 mb-1">End Date</label>
                  <Input type="date" value={editForm.end_date} onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-deep-600 mb-1">Capacity</label>
                  <Input type="number" value={editForm.capacity} onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })} placeholder="e.g. 50" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-deep-600 mb-1">Status</label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={editForm.status || 'Select'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <label className="text-xs font-medium text-deep-600 mb-1 mr-2">Tracks</label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editForm.track_finsoft} onChange={(e) => setEditForm({ ...editForm, track_finsoft: e.target.checked })} /> Finsoft
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editForm.track_finops} onChange={(e) => setEditForm({ ...editForm, track_finops: e.target.checked })} /> Finops
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit">Save Cohort</Button>
                <Button variant="outline" type="button" onClick={cancelEdit}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">{cohorts.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Cohorts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">
              {cohorts.filter(c => c.status === 'active').length}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">
              {cohorts.reduce((sum, c) => sum + c.capacity, 0)}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Capacity</p>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cohort</th>
              <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
              <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
              <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tracks</th>
              <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCohorts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  No cohorts found
                </td>
              </tr>
            ) : (
              filteredCohorts.map((cohort) => (
                <tr
                  key={cohort.id}
                  className={`border-b border-gray-50 hover:bg-gray-50 transition-colors duration-150 ${editingId === cohort.id ? 'bg-brand-50' : ''}`}
                >
                  {editingId === cohort.id ? (
                    <td colSpan={6} className="p-4">
                      <Card>
                        <CardContent className="p-4">
                          <form onSubmit={saveEdit} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-4">
                              <div>
                                <label className="block text-xs font-medium text-deep-600 mb-1">Cohort Name</label>
                                <Input type="text" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-deep-600 mb-1">Start Date</label>
                                <Input type="date" value={editForm.start_date} onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })} />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-deep-600 mb-1">End Date</label>
                                <Input type="date" value={editForm.end_date} onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })} />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-deep-600 mb-1">Capacity</label>
                                <Input type="number" value={editForm.capacity} onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })} />
                              </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <label className="block text-xs font-medium text-deep-600 mb-1">Status</label>
                                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder={editForm.status} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="planned">Planned</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-end">
                                <label className="text-xs font-medium text-deep-600 mb-1 mr-2">Tracks</label>
                                <div className="flex gap-3">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={editForm.track_finsoft} onChange={(e) => setEditForm({ ...editForm, track_finsoft: e.target.checked })} /> Finsoft
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={editForm.track_finops} onChange={(e) => setEditForm({ ...editForm, track_finops: e.target.checked })} /> Finops
                                  </label>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-3 mt-2">
                              <Button type="submit" disabled={saving === cohort.id}>{saving === cohort.id ? 'Saving...' : 'Save'}</Button>
                              <Button variant="outline" type="button" onClick={cancelEdit}>Cancel</Button>
                              <Button variant="destructive" type="button" onClick={() => deleteCohort(cohort.id)}>Delete</Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    </td>
                  ) : (
                    <>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-deep-100 flex items-center justify-center text-xs font-bold text-deep-600">
                            {cohort.id}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-deep-600">{cohort.name}</p>
                            <p className="text-[10px] text-gray-500">
                              Kickoff: {cohort.kickoff_date || cohort.start_date}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col gap-1">
                          <p className="text-xs text-gray-600">
                            {new Date(cohort.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            → {new Date(cohort.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="text-xs text-gray-600">{cohort.capacity}</p>
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          {cohort.track_finsoft && (
                            <Badge className="text-brand-700 border-brand-200 text-[10px]">Finsoft</Badge>
                          )}
                          {cohort.track_finops && (
                            <Badge className="text-emerald-700 border-emerald-200 text-[10px]">Finops</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge className={STATUS_COLORS[cohort.status] || 'text-gray-600'}>
                          {STATUS_LABELS[cohort.status]}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(cohort)}>
                            <Edit3 size={12} />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { }}>
                            <Eye size={12} />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteCohort(cohort.id)}>
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

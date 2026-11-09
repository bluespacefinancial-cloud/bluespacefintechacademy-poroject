import { useState, useEffect } from 'react'
import { BookOpen, Plus, Edit3, Eye, X } from 'lucide-react'
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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from '../components/ui/select'
import { Input } from '../components/ui/input'
import { api } from '../lib/backend'

const STAGE_COLORS = {
  foundations: 'text-brand-600',
  domain_immersion: 'text-emerald-600',
  live_projects: 'text-amber-600',
  certification: 'text-slate-600',
}

const STAGE_LABELS = {
  foundations: 'Foundations',
  domain_immersion: 'Domain Immersion',
  live_projects: 'Live Projects',
  certification: 'Certification',
}

const DOMAIN_COLORS = {
  FaaS: 'text-brand-700 border-brand-200',
  FinCore: 'text-emerald-700 border-emerald-200',
  FinOps: 'text-amber-700 border-amber-200',
  FinInfra: 'text-slate-700 border-slate-200',
}

export default function Curriculum() {
  const [modules, setModules] = useState([])
  const [filterStage, setFilterStage] = useState('all')
  const [filterTrack, setFilterTrack] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadModules()
  }, [])

  const loadModules = async () => {
    try {
      const { data, error } = await api
        .from('modules')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      setModules(data || [])
    } catch (err) {
      console.error('Error loading modules:', err)
    }
  }

  const filtered = modules.filter((m) => {
    const stageMatch = filterStage === 'all' || m.stage === filterStage
    const trackMatch = filterTrack === 'all' || m.track === filterTrack
    return stageMatch && trackMatch
  })

  const startEdit = (module) => {
    setEditForm({
      title: module.title,
      stage: module.stage,
      track: module.track,
      domain: module.domain,
      week: module.week,
      status: module.status,
    })
    setEditingId(module.id)
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
        .from('modules')
        .update({
          title: editForm.title,
          stage: editForm.stage,
          track: editForm.track,
          domain: editForm.domain,
          week: editForm.week,
          status: editForm.status,
        })
        .eq('id', editingId)
      if (updateError) throw updateError
      setMessage('Module updated')
      setEditingId(null)
      await loadModules()
    } catch (saveError) {
      setError(saveError.message || 'Unable to update module')
    } finally {
      setSaving(null)
    }
  }

  const deleteModule = async (id) => {
    if (!window.confirm('Delete this module? This cannot be undone.')) return
    try {
      const { error: delError } = await api.from('modules').delete().eq('id', id)
      if (delError) throw delError
      setMessage('Module deleted')
      await loadModules()
    } catch (delError) {
      setError(delError.message || 'Unable to delete module')
    }
  }

  const createModule = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const { error: createError } = await api.from('modules').insert({
        title: editForm.title || 'New Module',
        stage: editForm.stage || 'foundations',
        track: editForm.track || 'All',
        domain: editForm.domain,
        week: editForm.week,
        status: editForm.status || 'draft',
      })
      if (createError) throw createError
      setMessage('Module created')
      setEditForm({})
      setEditingId(null)
      await loadModules()
    } catch (createError) {
      setError(createError.message || 'Unable to create module')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-deep-600 mb-1">Curriculum</h1>
            <p className="text-sm text-gray-500">
              Manage course modules across the four-stage framework
            </p>
          </div>
          {editingId ? (
            <Button variant="outline" size="sm" onClick={cancelEdit}>
              <X size={14} /> Cancel
            </Button>
          ) : (
            <Button onClick={() => { setEditForm({ stage: 'foundations', track: 'All', status: 'draft' }); setEditingId('new'); setError(''); setMessage('') }}>
              <Plus size={16} className="mr-2" />
              Create Module
            </Button>
          )}
        </div>
      </div>

      {error && <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}

      {editingId === 'new' ? (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={createModule} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-deep-600 mb-1">Module Title</label>
                  <Input type="text" required value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="e.g. Introduction to FinCore" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-deep-600 mb-1">Stage</label>
                  <Select value={editForm.stage} onValueChange={(v) => setEditForm({ ...editForm, stage: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={editForm.stage || 'Select'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="foundations">Foundations</SelectItem>
                      <SelectItem value="domain_immersion">Domain Immersion</SelectItem>
                      <SelectItem value="live_projects">Live Projects</SelectItem>
                      <SelectItem value="certification">Certification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-deep-600 mb-1">Track</label>
                  <Select value={editForm.track} onValueChange={(v) => setEditForm({ ...editForm, track: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={editForm.track || 'Select'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Finsoft">Finsoft</SelectItem>
                      <SelectItem value="Finops">Finops</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <label className="block text-xs font-medium text-deep-600 mb-1">Week</label>
                  <Input type="text" value={editForm.week} onChange={(e) => setEditForm({ ...editForm, week: e.target.value })} placeholder="e.g. Week 1" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-deep-600 mb-1">Status</label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={editForm.status || 'Select'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit">Create Module</Button>
                <Button variant="outline" type="button" onClick={cancelEdit}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Stage
          </span>
          <Select value={filterStage} onValueChange={(value) => setFilterStage(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="foundations">Foundations</SelectItem>
              <SelectItem value="domain_immersion">Domain Immersion</SelectItem>
              <SelectItem value="live_projects">Live Projects</SelectItem>
              <SelectItem value="certification">Certification</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Track</span>
          <Select value={filterTrack} onValueChange={(value) => setFilterTrack(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All tracks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tracks</SelectItem>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Finsoft">Finsoft</SelectItem>
              <SelectItem value="Finops">Finops</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">{modules.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Modules</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">
              {modules.filter((m) => m.status === 'published').length}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">
              {modules.filter((m) => m.status === 'draft').length}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Draft</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <BookOpen size={32} className="mx-auto mb-3 opacity-50" />
            <p>No modules found</p>
          </div>
        ) :
          filtered.map((module) => (
            <Card
              key={module.id}
              className={`cursor-pointer hover:border-brand-200 transition-colors duration-150 ${editingId === module.id ? 'bg-brand-50' : ''}`}
            >
              {editingId === module.id ? (
                <>
                  <td colSpan={6} className="p-4">
                    <Card>
                      <CardContent className="p-4">
                        <form onSubmit={saveEdit} className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-4">
                            <div>
                              <label className="block text-xs font-medium text-deep-600 mb-1">Module Title</label>
                              <Input type="text" required value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-deep-600 mb-1">Stage</label>
                              <Select value={editForm.stage} onValueChange={(v) => setEditForm({ ...editForm, stage: v })}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={editForm.stage} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="foundations">Foundations</SelectItem>
                                  <SelectItem value="domain_immersion">Domain Immersion</SelectItem>
                                  <SelectItem value="live_projects">Live Projects</SelectItem>
                                  <SelectItem value="certification">Certification</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-deep-600 mb-1">Track</label>
                              <Select value={editForm.track} onValueChange={(v) => setEditForm({ ...editForm, track: v })}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={editForm.track} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="All">All</SelectItem>
                                  <SelectItem value="Finsoft">Finsoft</SelectItem>
                                  <SelectItem value="Finops">Finops</SelectItem>
                                </SelectContent>
                              </Select>
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
                              <label className="block text-xs font-medium text-deep-600 mb-1">Week</label>
                              <Input type="text" value={editForm.week} onChange={(e) => setEditForm({ ...editForm, week: e.target.value })} />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-deep-600 mb-1">Status</label>
                              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={editForm.status} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="draft">Draft</SelectItem>
                                  <SelectItem value="published">Published</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex gap-3 mt-2">
                            <Button type="submit" disabled={saving === module.id}>{saving === module.id ? 'Saving...' : 'Save'}</Button>
                            <Button variant="outline" type="button" onClick={cancelEdit}>Cancel</Button>
                            <Button variant="destructive" type="button" onClick={() => deleteModule(module.id)}>Delete</Button>
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
                        <BookOpen size={14} className="text-deep-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm">{module.title}</CardTitle>
                        <CardDescription className="text-[10px]">
                          {module.week} · {module.track} track
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={module.status === 'published' ? 'secondary' : 'outline'}>
                      {module.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-medium ${STAGE_COLORS[module.stage] || 'text-gray-500'} uppercase tracking-wider`}>
                        {STAGE_LABELS[module.stage]}
                        {module.domain && ` · ${module.domain}`}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); startEdit(module) }}>
                          <Edit3 size={12} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={(e) => e.stopPropagation()}>
                          <Eye size={12} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between pt-3">
                    <span className="text-[10px] text-gray-400">
                      {module.created_by || 'Admin'} · {module.created_at?.slice(0, 10)}
                    </span>
                    {module.domain && (
                      <Badge className={DOMAIN_COLORS[module.domain]}>{module.domain}</Badge>
                    )}
                  </CardFooter>
                </>
              )}
            </Card>
          ))}
      </div>
    </div>
  )
}

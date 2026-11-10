import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  Eye,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/backend'
import { Breadcrumb } from '../components/ui/breadcrumb'
import toast from 'react-hot-toast'

const STAGE_OPTIONS = [
  { value: 'foundations', label: 'Foundations' },
  { value: 'domain_immersion', label: 'Domain Immersion' },
  { value: 'live_projects', label: 'Live Projects' },
  { value: 'certification', label: 'Certification' },
]

const DOMAIN_OPTIONS = ['FaaS', 'FinCore', 'FinOps', 'FinInfra']
const TRACK_OPTIONS = ['Finsoft', 'Finops', 'All']

const LESSON_TYPES = [
  { value: 'video', label: 'Video lecture' },
  { value: 'audio', label: 'Audio lesson' },
  { value: 'concept', label: 'Concept' },
  { value: 'demonstration', label: 'Demonstration' },
  { value: 'lab', label: 'Lab' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'standup', label: 'Stand-up' },
  { value: 'sprint_review', label: 'Sprint review' },
  { value: 'retrospective', label: 'Retrospective' },
]

const LESSON_TYPE_LABELS = Object.fromEntries(LESSON_TYPES.map((item) => [item.value, item.label]))

const emptyModuleForm = {
  title: '',
  description: '',
  cohort_id: '',
  stage: 'foundations',
  domain: 'none',
  track: 'All',
  week_start: 1,
  week_end: 1,
  is_published: false,
}

const emptyLessonForm = {
  title: '',
  type: 'video',
  duration_minutes: 60,
  media_provider: 'auto',
  video_url: '',
  audio_url: '',
  content_url: '',
  caption_url: '',
  is_required: true,
  order_index: 0,
}

const emptyLabForm = {
  title: '',
  instructions: '',
  starter_code: '',
  due_date: '',
  max_score: 100,
}

export default function ModuleEditor() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isNew = !moduleId
  const userId = user?.id
  const userType = user?.type

  const [cohorts, setCohorts] = useState([])
  const [module, setModule] = useState(null)
  const [lessons, setLessons] = useState([])
  const [labsByLesson, setLabsByLesson] = useState({})
  const [labEditorLessonId, setLabEditorLessonId] = useState(null)
  const [labForm, setLabForm] = useState(emptyLabForm)
  const [savingLab, setSavingLab] = useState(false)
  const [form, setForm] = useState(emptyModuleForm)
  const [lessonForm, setLessonForm] = useState(emptyLessonForm)
  const [editingLessonId, setEditingLessonId] = useState(null)
  const [lessonEditorOpen, setLessonEditorOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingLesson, setSavingLesson] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadCohorts = useCallback(async () => {
    if (!userId) return []
    const { data: cohortRows, error: cohortError } = await api
      .from('cohorts')
      .select('id, name, status')
      .order('start_date', { ascending: false })
    if (cohortError) throw cohortError

    if (userType !== 'Instructor') return cohortRows || []

    const { data: assignments, error: assignmentError } = await api
      .from('instructor_cohort_assignments')
      .select('cohort_id')
      .eq('instructor_id', userId)
    if (assignmentError) throw assignmentError

    const allowed = new Set((assignments || []).map((row) => row.cohort_id))
    return (cohortRows || []).filter((cohort) => allowed.has(cohort.id))
  }, [userId, userType])

  const loadModule = useCallback(async () => {
    if (isNew) return
    const { data, error: moduleError } = await api
      .from('modules')
      .select('*')
      .eq('id', Number(moduleId))
      .single()
    if (moduleError) throw moduleError
    setModule(data)
    setForm({
      title: data.title || '',
      description: data.description || '',
      cohort_id: String(data.cohort_id),
      stage: data.stage,
      domain: data.domain || 'none',
      track: data.track || 'All',
      week_start: data.week_start,
      week_end: data.week_end,
      is_published: Boolean(data.is_published),
    })

    const { data: lessonRows, error: lessonError } = await api
      .from('lessons')
      .select('*')
      .eq('module_id', Number(moduleId))
      .order('order_index', { ascending: true })
    if (lessonError) throw lessonError
    setLessons(lessonRows || [])

    const lessonIds = (lessonRows || []).map((lesson) => lesson.id)
    if (lessonIds.length === 0) {
      setLabsByLesson({})
      return
    }
    const { data: labRows, error: labError } = await api
      .from('labs')
      .select('id, lesson_id, title, instructions, starter_code, due_date, max_score')
      .in('lesson_id', lessonIds)
      .order('id', { ascending: true })
    if (labError) throw labError
    const grouped = {}
    for (const lab of labRows || []) {
      if (!grouped[lab.lesson_id]) grouped[lab.lesson_id] = lab
    }
    setLabsByLesson(grouped)
  }, [isNew, moduleId])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [cohortRows] = await Promise.all([loadCohorts(), loadModule()])
        if (!cancelled) setCohorts(cohortRows)
        if (!cancelled && isNew && cohortRows.length === 1) {
          setForm((current) => ({ ...current, cohort_id: String(cohortRows[0].id) }))
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Unable to load this module')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [isNew, loadCohorts, loadModule])

  const selectedCohort = useMemo(
    () => cohorts.find((cohort) => String(cohort.id) === String(form.cohort_id)),
    [cohorts, form.cohort_id]
  )

  const validate = () => {
    if (!form.title.trim()) return 'A module title is required.'
    if (!form.cohort_id) return 'Choose the cohort this module belongs to.'
    if (!Number(form.week_start) || Number(form.week_start) < 1) return 'Week start must be 1 or later.'
    if (!Number(form.week_end) || Number(form.week_end) < Number(form.week_start)) {
      return 'Week end cannot be earlier than week start.'
    }
    if (form.is_published && lessons.length === 0) {
      return 'Add at least one lesson before publishing.'
    }
    return ''
  }

  const payload = () => ({
    title: form.title.trim(),
    description: form.description.trim() || null,
    cohort_id: Number(form.cohort_id),
    stage: form.stage,
    domain: form.domain === 'none' ? null : form.domain,
    track: form.track,
    week_start: Number(form.week_start),
    week_end: Number(form.week_end),
    is_published: Boolean(form.is_published),
    updated_at: new Date().toISOString(),
  })

  const saveModule = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (isNew && form.is_published) {
      setError('Create the module as a draft, add its lessons, then publish.')
      return
    }

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    try {
      if (isNew) {
        const { data, error: createError } = await api
          .from('modules')
          .insert({ ...payload(), created_by: user?.id ?? 0 })
          .select()
          .single()
        if (createError) throw createError
        setMessage('Module created. Add its lessons below.')
        toast.success('Module created')
        navigate(`/modules/${data.id}`, { replace: true })
      } else {
        const { error: updateError } = await api
          .from('modules')
          .update(payload())
          .eq('id', module.id)
        if (updateError) throw updateError
        setModule((current) => ({ ...current, ...payload() }))
        setMessage('Module saved.')
        toast.success('Module saved')
      }
    } catch (saveError) {
      setError(saveError.message || 'Unable to save this module')
      toast.error('Unable to save module')
    } finally {
      setSaving(false)
    }
  }

  const togglePublished = async () => {
    if (!module) return
    const next = !module.is_published
    if (next && lessons.length === 0) {
      setError('Add at least one lesson before publishing.')
      return
    }
    setError('')
    setMessage('')
    const { error: updateError } = await api
      .from('modules')
      .update({ is_published: next, updated_at: new Date().toISOString() })
      .eq('id', module.id)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setModule((current) => ({ ...current, is_published: next }))
    setForm((current) => ({ ...current, is_published: next }))
    setMessage(next ? 'Module published to students.' : 'Module returned to draft.')
    toast.success(next ? 'Module published' : 'Module returned to draft')
  }

  const deleteModule = async () => {
    if (!module) return
    if (!window.confirm('Delete this module and its lessons? This cannot be undone.')) return
    setError('')
    // `lessons.module_id` has no cascade, so the lessons go first.
    const { error: lessonError } = await api.from('lessons').delete().eq('module_id', module.id)
    if (lessonError) {
      setError(lessonError.message)
      toast.error('Unable to delete module')
      return
    }
    const { error: deleteError } = await api.from('modules').delete().eq('id', module.id)
    if (deleteError) {
      setError(deleteError.message)
      toast.error('Unable to delete module')
      return
    }
    toast.success('Module deleted')
    navigate('/my-modules', { replace: true })
  }

  const openNewLesson = () => {
    setEditingLessonId(null)
    setLessonForm({ ...emptyLessonForm, order_index: lessons.length })
    setLessonEditorOpen(true)
    setError('')
  }

  const openEditLesson = (lesson) => {
    setEditingLessonId(lesson.id)
    setLessonForm({
      title: lesson.title || '',
      type: lesson.type || 'video',
      duration_minutes: lesson.duration_minutes ?? 60,
      media_provider: lesson.media_provider || 'auto',
      video_url: lesson.video_url || '',
      audio_url: lesson.audio_url || '',
      content_url: lesson.content_url || '',
      caption_url: lesson.caption_url || '',
      is_required: Boolean(lesson.is_required),
      order_index: lesson.order_index ?? 0,
    })
    setLessonEditorOpen(true)
    setError('')
  }

  const saveLesson = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!lessonForm.title.trim()) {
      setError('A lesson title is required.')
      return
    }
    setSavingLesson(true)

    const lessonPayload = {
      module_id: module.id,
      title: lessonForm.title.trim(),
      type: lessonForm.type,
      duration_minutes: Number(lessonForm.duration_minutes) || 60,
      media_provider: lessonForm.media_provider || 'auto',
      video_url: lessonForm.video_url.trim() || null,
      audio_url: lessonForm.audio_url.trim() || null,
      content_url: lessonForm.content_url.trim() || null,
      caption_url: lessonForm.caption_url.trim() || null,
      is_required: Boolean(lessonForm.is_required),
      order_index: Number(lessonForm.order_index) || 0,
      created_by: user?.id ?? 0,
      updated_at: new Date().toISOString(),
    }

    try {
      if (editingLessonId) {
        const { data, error: updateError } = await api
          .from('lessons')
          .update(lessonPayload)
          .eq('id', editingLessonId)
          .select()
          .single()
        if (updateError) throw updateError
        setLessons((current) => current.map((lesson) => (lesson.id === editingLessonId ? data : lesson)))
        setMessage('Lesson saved.')
        toast.success('Lesson saved')
      } else {
        const { data, error: createError } = await api
          .from('lessons')
          .insert(lessonPayload)
          .select()
          .single()
        if (createError) throw createError
        setLessons((current) => [...current, data])
        setMessage('Lesson added.')
        toast.success('Lesson added')
      }
      setLessonEditorOpen(false)
      setEditingLessonId(null)
      setLessonForm(emptyLessonForm)
    } catch (lessonError) {
      setError(lessonError.message || 'Unable to save this lesson')
      toast.error('Unable to save lesson')
    } finally {
      setSavingLesson(false)
    }
  }

  const deleteLesson = async (lesson) => {
    if (!window.confirm(`Delete “${lesson.title}”?${labsByLesson[lesson.id] ? ' Its lab will be removed too.' : ''}`)) return
    setError('')
    // `labs.lesson_id` has no cascade, so an attached lab goes first.
    const { error: labDeleteError } = await api.from('labs').delete().eq('lesson_id', lesson.id)
    if (labDeleteError) {
      setError(labDeleteError.message)
      toast.error('Unable to delete lesson')
      return
    }
    const { error: deleteError } = await api.from('lessons').delete().eq('id', lesson.id)
    if (deleteError) {
      setError(deleteError.message)
      toast.error('Unable to delete lesson')
      return
    }
    setLessons((current) => current.filter((item) => item.id !== lesson.id))
    setLabsByLesson((current) => {
      const next = { ...current }
      delete next[lesson.id]
      return next
    })
    if (labEditorLessonId === lesson.id) setLabEditorLessonId(null)
    setMessage('Lesson deleted.')
    toast.success('Lesson deleted')
  }

  const moveLesson = async (lesson, direction) => {
    const index = lessons.findIndex((item) => item.id === lesson.id)
    const swapIndex = index + direction
    if (index < 0 || swapIndex < 0 || swapIndex >= lessons.length) return

    const neighbour = lessons[swapIndex]
    setError('')
    const updates = await Promise.all([
      api.from('lessons').update({ order_index: swapIndex }).eq('id', lesson.id),
      api.from('lessons').update({ order_index: index }).eq('id', neighbour.id),
    ])
    const failed = updates.find((result) => result.error)
    if (failed) {
      setError(failed.error.message)
      toast.error('Unable to reorder lesson')
      return
    }
    setLessons((current) => current.map((item) => {
      if (item.id === lesson.id) return { ...item, order_index: swapIndex }
      if (item.id === neighbour.id) return { ...item, order_index: index }
      return item
    }))
  }

  const openLabEditor = (lesson) => {
    const existing = labsByLesson[lesson.id]
    setLabEditorLessonId(lesson.id)
    setLabForm(existing ? {
      title: existing.title || '',
      instructions: existing.instructions || '',
      starter_code: existing.starter_code || '',
      due_date: existing.due_date ? String(existing.due_date).slice(0, 10) : '',
      max_score: existing.max_score ?? 100,
    } : emptyLabForm)
    setError('')
    setMessage('')
  }

  const saveLab = async (event) => {
    event.preventDefault()
    const lessonId = labEditorLessonId
    if (!lessonId) return
    setError('')
    setMessage('')
    if (!labForm.title.trim() || !labForm.instructions.trim()) {
      setError('A lab needs both a title and instructions.')
      return
    }
    setSavingLab(true)

    const payload = {
      lesson_id: lessonId,
      title: labForm.title.trim(),
      instructions: labForm.instructions.trim(),
      starter_code: labForm.starter_code.trim() || null,
      due_date: labForm.due_date || null,
      max_score: Number(labForm.max_score) || 100,
      created_by: user?.id ?? 0,
      updated_at: new Date().toISOString(),
    }

    try {
      const existing = labsByLesson[lessonId]
      const query = existing
        ? api.from('labs').update(payload).eq('id', existing.id)
        : api.from('labs').insert(payload)
      const { data, error: labError } = await query
        .select('id, lesson_id, title, instructions, starter_code, due_date, max_score')
        .single()
      if (labError) throw labError
      setLabsByLesson((current) => ({ ...current, [lessonId]: data }))
      setLabEditorLessonId(null)
      setLabForm(emptyLabForm)
      setMessage(existing ? 'Lab updated.' : 'Lab attached to lesson.')
      toast.success(existing ? 'Lab updated' : 'Lab attached')
    } catch (labError) {
      setError(labError.message || 'Unable to save this lab')
      toast.error('Unable to save lab')
    } finally {
      setSavingLab(false)
    }
  }

  const deleteLab = async (lesson) => {
    const existing = labsByLesson[lesson.id]
    if (!existing) return
    if (!window.confirm(`Remove the lab “${existing.title}” from this lesson?`)) return
    setError('')
    const { error: labError } = await api.from('labs').delete().eq('id', existing.id)
    if (labError) {
      setError(labError.message)
      toast.error('Unable to remove lab')
      return
    }
    setLabsByLesson((current) => {
      const next = { ...current }
      delete next[lesson.id]
      return next
    })
    if (labEditorLessonId === lesson.id) setLabEditorLessonId(null)
    setMessage('Lab removed.')
    toast.success('Lab removed')
  }

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-deep-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-gray-500">Loading module…</span>
        </div>
      </div>
    )
  }

  if (!isNew && !module) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Module not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            This module either does not exist or is outside the cohorts you are assigned to.
          </p>
          <Button asChild variant="outline">
            <Link to="/my-modules">Back to My Modules</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { to: '/my-modules', label: 'My Modules' },
          { label: isNew ? 'New module' : (module?.title || form.title || 'Untitled module') },
        ]}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <Link
            to="/my-modules"
            className="mt-1 w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
            aria-label="Back to My Modules"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {isNew ? 'New module' : 'Module editor'}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 truncate">
              {isNew ? 'Create module' : form.title || 'Untitled module'}
            </h1>
            {!isNew && (
              <p className="mt-1 text-sm text-gray-500">
                {selectedCohort?.name || 'Unassigned cohort'} · Weeks {form.week_start}–{form.week_end}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isNew && (
            <Badge variant={module?.is_published ? 'secondary' : 'outline'}>
              {module?.is_published ? 'Published' : 'Draft'}
            </Badge>
          )}
          {!isNew && (
            <Button variant="outline" size="sm" onClick={togglePublished}>
              {module?.is_published ? 'Unpublish' : 'Publish'}
            </Button>
          )}
          <Button type="submit" form="module-form" size="sm" disabled={saving}>
            <Save size={14} className="mr-1.5" />
            {saving ? 'Saving…' : isNew ? 'Create module' : 'Save changes'}
          </Button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Module details</CardTitle>
          <CardDescription>Where this module sits in the programme.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="module-form" onSubmit={saveModule} className="space-y-4">
            <div>
              <label htmlFor="module-title" className="mb-1 block text-sm font-medium text-deep-600">Title</label>
              <Input
                id="module-title"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="e.g. FinCore: Ledger Engineering"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="module-cohort" className="mb-1 block text-sm font-medium text-deep-600">Cohort</label>
                <Select value={form.cohort_id} onValueChange={(value) => setForm({ ...form, cohort_id: value })}>
                  <SelectTrigger id="module-cohort" className="w-full">
                    <SelectValue placeholder="Select cohort" />
                  </SelectTrigger>
                  <SelectContent>
                    {cohorts.map((cohort) => (
                      <SelectItem key={cohort.id} value={String(cohort.id)}>{cohort.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {cohorts.length === 0 && (
                  <p className="mt-1 text-xs text-amber-700">
                    You are not assigned to a cohort yet. Ask an administrator.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="module-stage" className="mb-1 block text-sm font-medium text-deep-600">Stage</label>
                <Select value={form.stage} onValueChange={(value) => setForm({ ...form, stage: value })}>
                  <SelectTrigger id="module-stage" className="w-full">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_OPTIONS.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>{stage.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="module-domain" className="mb-1 block text-sm font-medium text-deep-600">Domain</label>
                <Select value={form.domain} onValueChange={(value) => setForm({ ...form, domain: value })}>
                  <SelectTrigger id="module-domain" className="w-full">
                    <SelectValue placeholder="No domain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No domain</SelectItem>
                    {DOMAIN_OPTIONS.map((domain) => (
                      <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="module-track" className="mb-1 block text-sm font-medium text-deep-600">Track</label>
                <Select value={form.track} onValueChange={(value) => setForm({ ...form, track: value })}>
                  <SelectTrigger id="module-track" className="w-full">
                    <SelectValue placeholder="Select track" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRACK_OPTIONS.map((track) => (
                      <SelectItem key={track} value={track}>{track}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:max-w-sm">
              <div>
                <label htmlFor="module-week-start" className="mb-1 block text-sm font-medium text-deep-600">Week start</label>
                <Input
                  id="module-week-start"
                  type="number"
                  min="1"
                  value={form.week_start}
                  onChange={(event) => setForm({ ...form, week_start: event.target.value })}
                />
              </div>
              <div>
                <label htmlFor="module-week-end" className="mb-1 block text-sm font-medium text-deep-600">Week end</label>
                <Input
                  id="module-week-end"
                  type="number"
                  min="1"
                  value={form.week_end}
                  onChange={(event) => setForm({ ...form, week_end: event.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="module-description" className="mb-1 block text-sm font-medium text-deep-600">Description</label>
              <Textarea
                id="module-description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="What this module covers and why it matters."
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {!isNew && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm">Lessons</CardTitle>
              <CardDescription>{lessons.length} lesson{lessons.length === 1 ? '' : 's'} in this module.</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={openNewLesson}>
              <Plus size={14} className="mr-1.5" />
              Add lesson
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {lessons.length === 0 && !lessonEditorOpen && (
              <div className="py-10 text-center text-gray-400">
                <BookOpen size={28} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">No lessons yet. Add the first one to start building this module.</p>
              </div>
            )}

            {lessons.map((lesson, index) => (
              <div key={lesson.id} className="space-y-3">
                <div
                  className="flex flex-col gap-3 rounded-lg border border-gray-200/90 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="mt-0.5 w-6 text-center text-[11px] font-semibold text-gray-400">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{lesson.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {LESSON_TYPE_LABELS[lesson.type] || lesson.type} · {lesson.duration_minutes} min
                      {lesson.is_required ? ' · Required' : ' · Optional'}
                    </p>
                    {labsByLesson[lesson.id] && (
                      <Badge variant="secondary" className="mt-1.5 text-[10px]">
                        <ClipboardList size={10} className="mr-1" />
                        {labsByLesson[lesson.id].title}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant={labsByLesson[lesson.id] ? 'ghost' : 'outline'}
                    onClick={() => (labEditorLessonId === lesson.id
                      ? setLabEditorLessonId(null)
                      : openLabEditor(lesson))}
                    aria-label={labsByLesson[lesson.id] ? `Edit lab for ${lesson.title}` : `Attach lab to ${lesson.title}`}
                    title={labsByLesson[lesson.id] ? 'Edit lab' : 'Attach lab'}
                  >
                    <ClipboardList size={13} className="mr-1" />
                    {labsByLesson[lesson.id] ? 'Lab' : 'Attach lab'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moveLesson(lesson, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${lesson.title} up`}
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moveLesson(lesson, 1)}
                    disabled={index === lessons.length - 1}
                    aria-label={`Move ${lesson.title} down`}
                  >
                    ↓
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/lesson/${lesson.id}`} aria-label={`Preview ${lesson.title}`}>
                      <Eye size={13} className="mr-1" />
                      Preview
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEditLesson(lesson)} aria-label={`Edit ${lesson.title}`}>
                    <Pencil size={13} className="mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteLesson(lesson)} aria-label={`Delete ${lesson.title}`}>
                    <Trash2 size={13} className="text-red-600" />
                  </Button>
                </div>
                </div>

                {labEditorLessonId === lesson.id && (
                  <form onSubmit={saveLab} className="space-y-3 rounded-lg border border-deep-200 bg-deep-50/40 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClipboardList size={15} className="text-deep-600" />
                        <p className="text-sm font-semibold text-gray-900">
                          {labsByLesson[lesson.id] ? 'Edit lab' : 'Attach a lab'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setLabEditorLessonId(null); setLabForm(emptyLabForm) }}
                        className="rounded p-1 text-gray-500 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-deep-600"
                        aria-label="Close lab editor"
                      >
                        <X size={15} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Attached to <span className="font-medium text-gray-700">{lesson.title}</span>. Students see this in their lab workspace.
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="sm:col-span-2">
                        <label htmlFor={`lab-title-${lesson.id}`} className="mb-1 block text-xs font-medium text-deep-600">Lab title</label>
                        <Input
                          id={`lab-title-${lesson.id}`}
                          value={labForm.title}
                          onChange={(event) => setLabForm({ ...labForm, title: event.target.value })}
                          placeholder="e.g. Build a settlement reconciliation sheet"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor={`lab-due-${lesson.id}`} className="mb-1 block text-xs font-medium text-deep-600">Due date</label>
                        <Input
                          id={`lab-due-${lesson.id}`}
                          type="date"
                          value={labForm.due_date}
                          onChange={(event) => setLabForm({ ...labForm, due_date: event.target.value })}
                        />
                      </div>
                      <div>
                        <label htmlFor={`lab-score-${lesson.id}`} className="mb-1 block text-xs font-medium text-deep-600">Max score</label>
                        <Input
                          id={`lab-score-${lesson.id}`}
                          type="number"
                          min="1"
                          value={labForm.max_score}
                          onChange={(event) => setLabForm({ ...labForm, max_score: event.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor={`lab-instructions-${lesson.id}`} className="mb-1 block text-xs font-medium text-deep-600">Instructions</label>
                      <Textarea
                        id={`lab-instructions-${lesson.id}`}
                        value={labForm.instructions}
                        onChange={(event) => setLabForm({ ...labForm, instructions: event.target.value })}
                        placeholder="What students should build, the inputs to use, and how it will be marked."
                        className="min-h-[110px] text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor={`lab-starter-${lesson.id}`} className="mb-1 block text-xs font-medium text-deep-600">Starter code or template (optional)</label>
                      <Textarea
                        id={`lab-starter-${lesson.id}`}
                        value={labForm.starter_code}
                        onChange={(event) => setLabForm({ ...labForm, starter_code: event.target.value })}
                        placeholder="Paste starter code, a spreadsheet template link, or a starting query."
                        className="min-h-[80px] font-mono text-xs"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      {labsByLesson[lesson.id] ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteLab(lesson)}
                          disabled={savingLab}
                        >
                          <Trash2 size={13} className="mr-1.5 text-red-600" />
                          Remove lab
                        </Button>
                      ) : <span />}
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => { setLabEditorLessonId(null); setLabForm(emptyLabForm) }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={savingLab}>
                          {savingLab ? 'Saving…' : labsByLesson[lesson.id] ? 'Save lab' : 'Attach lab'}
                        </Button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            ))}

            {lessonEditorOpen && (
              <form onSubmit={saveLesson} className="space-y-3 rounded-lg border border-deep-200 bg-deep-50/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">
                    {editingLessonId ? 'Edit lesson' : 'New lesson'}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setLessonEditorOpen(false); setEditingLessonId(null) }}
                    className="rounded p-1 text-gray-500 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-deep-600"
                    aria-label="Close lesson editor"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="lesson-title" className="mb-1 block text-xs font-medium text-deep-600">Title</label>
                    <Input
                      id="lesson-title"
                      value={lessonForm.title}
                      onChange={(event) => setLessonForm({ ...lessonForm, title: event.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lesson-type" className="mb-1 block text-xs font-medium text-deep-600">Type</label>
                    <Select value={lessonForm.type} onValueChange={(value) => setLessonForm({ ...lessonForm, type: value })}>
                      <SelectTrigger id="lesson-type" className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {LESSON_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="lesson-duration" className="mb-1 block text-xs font-medium text-deep-600">Duration (min)</label>
                    <Input
                      id="lesson-duration"
                      type="number"
                      min="1"
                      value={lessonForm.duration_minutes}
                      onChange={(event) => setLessonForm({ ...lessonForm, duration_minutes: event.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:max-w-md">
                  <div>
                    <label htmlFor="lesson-provider" className="mb-1 block text-xs font-medium text-deep-600">Media provider</label>
                    <Select
                      value={lessonForm.media_provider}
                      onValueChange={(value) => setLessonForm({ ...lessonForm, media_provider: value })}
                    >
                      <SelectTrigger id="lesson-provider" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-detect from URL</SelectItem>
                        <SelectItem value="youtube">YouTube (unlisted)</SelectItem>
                        <SelectItem value="self">Self-hosted file</SelectItem>
                        <SelectItem value="none">No media</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="self-end pb-2 text-[11px] leading-snug text-gray-500">
                    Lectures normally use an unlisted YouTube link. Keep only audio, captions and short assets on your own storage.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="lesson-video" className="mb-1 block text-xs font-medium text-deep-600">Video URL</label>
                    <Input
                      id="lesson-video"
                      type="url"
                      value={lessonForm.video_url}
                      onChange={(event) => setLessonForm({ ...lessonForm, video_url: event.target.value })}
                      placeholder="YouTube or hosted video"
                    />
                  </div>
                  <div>
                    <label htmlFor="lesson-audio" className="mb-1 block text-xs font-medium text-deep-600">Audio URL</label>
                    <Input
                      id="lesson-audio"
                      type="url"
                      value={lessonForm.audio_url}
                      onChange={(event) => setLessonForm({ ...lessonForm, audio_url: event.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="lesson-content" className="mb-1 block text-xs font-medium text-deep-600">Reading or resource URL</label>
                    <Input
                      id="lesson-content"
                      type="url"
                      value={lessonForm.content_url}
                      onChange={(event) => setLessonForm({ ...lessonForm, content_url: event.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="lesson-caption" className="mb-1 block text-xs font-medium text-deep-600">Caption URL</label>
                    <Input
                      id="lesson-caption"
                      type="url"
                      value={lessonForm.caption_url}
                      onChange={(event) => setLessonForm({ ...lessonForm, caption_url: event.target.value })}
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={lessonForm.is_required}
                    onChange={(event) => setLessonForm({ ...lessonForm, is_required: event.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-deep-600 focus-visible:ring-2 focus-visible:ring-deep-600"
                  />
                  Required for completion
                </label>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => { setLessonEditorOpen(false); setEditingLessonId(null) }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={savingLesson}>
                    {savingLesson ? 'Saving…' : editingLessonId ? 'Save lesson' : 'Add lesson'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {!isNew && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={deleteModule}>
            <Trash2 size={14} className="mr-1.5 text-red-600" />
            Delete module
          </Button>
        </div>
      )}
    </div>
  )
}

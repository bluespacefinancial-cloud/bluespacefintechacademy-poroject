/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react'
import { BookOpen, Plus, Send, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { api } from '../lib/backend'
import MediaUpload from '../components/MediaUpload'

const STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'In review',
  under_review: 'In review',
  changes_requested: 'Changes requested',
  approved: 'Approved',
  published: 'Published',
  rejected: 'Rejected',
  archived: 'Archived',
}

const EDITABLE_STATUSES = ['draft', 'changes_requested']

const emptyCourseForm = {
  title: '',
  description: '',
  thumbnail_url: '',
  certificate_title: 'Partner Course Certificate',
  partner_logo_url: '',
  track: 'All',
}

const emptyLessonForm = {
  title: '',
  description: '',
  type: 'video',
  media_provider: 'auto',
  video_url: '',
  audio_url: '',
  thumbnail_url: '',
  caption_url: '',
  content_url: '',
}

export default function PartnerCourses() {
  const [partner, setPartner] = useState(null)
  const [courses, setCourses] = useState([])
  const [selected, setSelected] = useState(null)
  const [lessons, setLessons] = useState([])
  const [form, setForm] = useState(emptyCourseForm)
  const [lesson, setLesson] = useState(emptyLessonForm)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingLesson, setSavingLesson] = useState(false)

  const loadCourses = useCallback(async (partnerId) => {
    const { data: courseRows, error: courseError } = await api
      .from('partner_courses')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
    if (courseError) throw courseError
    setCourses(courseRows || [])
    return courseRows || []
  }, [])

  const loadLessons = useCallback(async (courseId) => {
    const { data, error: lessonError } = await api
      .from('partner_course_lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })
    if (lessonError) throw lessonError
    setLessons(data || [])
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data: partnerId, error: partnerIdError } = await api.rpc('current_partner_id')
      if (partnerIdError) throw partnerIdError
      if (!partnerId) {
        setPartner(null)
        setCourses([])
        return
      }
      const [{ data: partnerRow, error: partnerError }, courseRows] = await Promise.all([
        api.from('partners').select('*').eq('id', partnerId).single(),
        loadCourses(partnerId),
      ])
      if (partnerError) throw partnerError
      setPartner(partnerRow)
      if (courseRows.length > 0) setSelected(courseRows[0])
    }

    load()
      .catch((loadError) => setError(loadError.message || 'Unable to load partner courses'))
      .finally(() => setLoading(false))
  }, [loadCourses])

  useEffect(() => {
    if (!selected?.id) {
      setLessons([])
      return
    }
    loadLessons(selected.id).catch((lessonError) => {
      setError(lessonError.message || 'Unable to load this course’s lessons')
    })
  }, [selected?.id, loadLessons])

  const createCourse = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)
    try {
      const baseSlug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'course'
      const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`
      const { data: created, error: createError } = await api
        .from('partner_courses')
        .insert({
          title: form.title.trim(),
          description: form.description.trim(),
          thumbnail_url: form.thumbnail_url.trim() || null,
          certificate_title: form.certificate_title.trim() || 'Partner Course Certificate',
          partner_logo_url: form.partner_logo_url.trim() || null,
          partner_id: partner.id,
          status: 'draft',
          track: form.track || 'All',
          slug: uniqueSlug,
        })
        .select()
        .single()
      if (createError) throw createError
      setCourses((current) => [created, ...current])
      setSelected(created)
      setForm(emptyCourseForm)
      setMessage('Course draft created. Add its lessons, then submit it for review.')
    } catch (createError) {
      setError(createError.message || 'Unable to create this course')
    } finally {
      setSaving(false)
    }
  }

  const selectCourse = (course) => {
    setSelected(course)
    setError('')
    setMessage('')
  }

  const addLesson = async (event) => {
    event.preventDefault()
    if (!selected) return
    setError('')
    setMessage('')
    setSavingLesson(true)
    try {
      const lessonType = lesson.type || 'video'
      if (lessonType === 'video' && !lesson.video_url.trim()) {
        throw new Error('Add a video URL or upload a video file before adding this lesson.')
      }
      if (lessonType === 'audio' && !lesson.audio_url.trim()) {
        throw new Error('Upload an audio file before adding this lesson.')
      }
      if (lessonType === 'text' && !lesson.description.trim()) {
        throw new Error('Write the lesson text before adding this lesson.')
      }

      const nextIndex = lessons.reduce((max, item) => Math.max(max, item.order_index ?? 0), -1) + 1
      const { data: created, error: lessonError } = await api
        .from('partner_course_lessons')
        .insert({
          course_id: selected.id,
          title: lesson.title.trim(),
          description: lesson.description.trim() || null,
          type: lessonType,
          media_provider: lessonType === 'text' ? 'none' : (lesson.media_provider || 'auto'),
          video_url: lessonType === 'video' ? lesson.video_url.trim() || null : null,
          audio_url: lessonType === 'audio' ? lesson.audio_url.trim() || null : null,
          thumbnail_url: lesson.thumbnail_url.trim() || null,
          caption_url: lesson.caption_url.trim() || null,
          content_url: lesson.content_url.trim() || null,
          order_index: nextIndex,
          // Lessons stay unpublished until an administrator publishes the course.
          is_published: false,
        })
        .select()
        .single()
      if (lessonError) throw lessonError
      setLessons((current) => [...current, created])
      setLesson(emptyLessonForm)
      setMessage('Lesson added.')
    } catch (lessonError) {
      setError(lessonError.message || 'Unable to add this lesson')
    } finally {
      setSavingLesson(false)
    }
  }

  const deleteLesson = async (item) => {
    if (!window.confirm(`Delete “${item.title}”?`)) return
    setError('')
    const { error: deleteError } = await api.from('partner_course_lessons').delete().eq('id', item.id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    setLessons((current) => current.filter((entry) => entry.id !== item.id))
    setMessage('Lesson deleted.')
  }

  const submit = async () => {
    if (!selected) return
    if (lessons.length === 0) {
      setError('Add at least one lesson before submitting this course for review.')
      return
    }
    setError('')
    setMessage('')
    setSaving(true)
    try {
      // The database stamps the submission and clears any previous reviewer notes.
      const { error: submitError } = await api
        .from('partner_courses')
        .update({ status: 'submitted' })
        .eq('id', selected.id)
      if (submitError) throw submitError
      await loadCourses(partner.id)
      setSelected({ ...selected, status: 'submitted' })
      setMessage('Course submitted. The academy will review it shortly.')
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit this course')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="py-12 text-center text-sm text-gray-500">Loading partner course studio…</p>
  }

  if (!partner) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Partner Course Studio</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage courses for academy students.</p>
        </div>
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agency link needed</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            An academy administrator must connect your partner account to an agency before you can create courses.
          </CardContent>
        </Card>
      </div>
    )
  }

  const canEdit = selected ? EDITABLE_STATUSES.includes(selected.status) : false

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Partner Course Studio</h1>
        <p className="mt-1 text-sm text-gray-500">
          {partner.name} can prepare courses for academy approval.
        </p>
      </div>

      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">New course draft</CardTitle>
            <CardDescription>Drafts stay private until you submit them.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createCourse} className="space-y-3">
              <div>
                <label htmlFor="course-title" className="mb-1 block text-xs font-semibold text-foreground">Course title</label>
                <Input
                  id="course-title"
                  placeholder="e.g. Payments Operations in Practice"
                  required
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                />
              </div>
              <div>
                <label htmlFor="course-description" className="mb-1 block text-xs font-semibold text-foreground">Description</label>
                <Textarea
                  id="course-description"
                  placeholder="What students will be able to do after this course."
                  required
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  className="min-h-[90px] text-sm"
                />
              </div>
              <div>
                <label htmlFor="course-thumbnail" className="mb-1 block text-xs font-semibold text-foreground">Thumbnail URL</label>
                <Input
                  id="course-thumbnail"
                  type="url"
                  placeholder="https://…"
                  value={form.thumbnail_url}
                  onChange={(event) => setForm({ ...form, thumbnail_url: event.target.value })}
                />
                <div className="mt-2">
                  <MediaUpload
                    kind="image"
                    label="Upload thumbnail"
                    value={form.thumbnail_url}
                    helper="Landscape, 1200×675"
                    onUploaded={(asset) => setForm((current) => ({ ...current, thumbnail_url: asset.url }))}
                    onClear={() => setForm((current) => ({ ...current, thumbnail_url: '' }))}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="course-partner-logo" className="mb-1 block text-xs font-semibold text-foreground">Partner logo URL</label>
                <Input
                  id="course-partner-logo"
                  type="url"
                  placeholder="https://…"
                  value={form.partner_logo_url}
                  onChange={(event) => setForm({ ...form, partner_logo_url: event.target.value })}
                />
                <div className="mt-2">
                  <MediaUpload
                    kind="image"
                    label="Upload partner logo"
                    value={form.partner_logo_url}
                    helper="Square or wide, transparent PNG works best"
                    onUploaded={(asset) => setForm((current) => ({ ...current, partner_logo_url: asset.url }))}
                    onClear={() => setForm((current) => ({ ...current, partner_logo_url: '' }))}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="course-certificate" className="mb-1 block text-xs font-semibold text-foreground">Certificate title</label>
                <Input
                  id="course-certificate"
                  value={form.certificate_title}
                  onChange={(event) => setForm({ ...form, certificate_title: event.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">Target fellowship track</label>
                <Select
                  value={form.track}
                  onValueChange={(val) => setForm({ ...form, track: val })}
                >
                  <SelectTrigger className="w-full text-sm" aria-label="Target track">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Tracks (Cross-functional)</SelectItem>
                    <SelectItem value="Finsoft">Finsoft (Engineering & Architecture)</SelectItem>
                    <SelectItem value="Finops">Finops (Operations & Treasury)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={saving}>
                <Plus size={14} className="mr-2" />
                {saving ? 'Creating…' : 'Create draft'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Your courses</CardTitle>
            <CardDescription>{courses.length} course{courses.length === 1 ? '' : 's'}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {courses.map((course) => (
              <button
                type="button"
                key={course.id}
                onClick={() => selectCourse(course)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selected?.id === course.id ? 'border-deep-300 bg-deep-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <p className="truncate text-sm font-medium text-gray-900" title={course.title}>{course.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {STATUS_LABELS[course.status] || course.status}
                  </Badge>
                  {course.rejection_reason && (
                    <span className="truncate text-[10px] text-amber-700">Changes requested</span>
                  )}
                </div>
              </button>
            ))}
            {courses.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-500">No course drafts yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{selected ? selected.title : 'Lessons'}</CardTitle>
            <CardDescription>
              {selected
                ? `${lessons.length} lesson${lessons.length === 1 ? '' : 's'} · ${STATUS_LABELS[selected.status] || selected.status}`
                : 'Select a course to manage its lessons.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {selected && selected.status === 'changes_requested' && selected.rejection_reason && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <span className="font-semibold">Academy notes: </span>
                {selected.rejection_reason}
              </div>
            )}

            {selected && !canEdit && (
              <p className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
                {selected.status === 'published'
                  ? 'This course is published. Contact the academy to make changes.'
                  : 'This course is with the academy for review.'}
              </p>
            )}

            {selected && lessons.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between gap-2 rounded-md border border-gray-200 p-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-5 text-center text-[10px] font-semibold text-gray-400">{index + 1}</span>
                  <p className="truncate text-xs text-gray-800" title={item.title}>{item.title}</p>
                </div>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteLesson(item)}
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 size={13} className="text-red-600" />
                  </Button>
                )}
              </div>
            ))}

            {selected && lessons.length === 0 && (
              <div className="py-6 text-center text-gray-400">
                <BookOpen size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">No lessons yet.</p>
              </div>
            )}

            {canEdit && (
              <form onSubmit={addLesson} className="space-y-2 rounded-lg border border-deep-200 bg-deep-50/40 p-3">
                <p className="text-xs font-semibold text-gray-900">Add a lesson</p>
                <Input
                  placeholder="Lesson title"
                  required
                  value={lesson.title}
                  onChange={(event) => setLesson({ ...lesson, title: event.target.value })}
                  className="text-sm"
                />
                <Textarea
                  placeholder={lesson.type === 'text' ? 'Lesson body (shown as the reading)' : 'Short description'}
                  value={lesson.description}
                  onChange={(event) => setLesson({ ...lesson, description: event.target.value })}
                  className={lesson.type === 'text' ? 'min-h-[140px] text-sm' : 'min-h-[60px] text-sm'}
                />
                <Select
                  value={lesson.type}
                  onValueChange={(value) => setLesson({ ...lesson, type: value })}
                >
                  <SelectTrigger className="w-full text-sm" aria-label="Lesson type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video lesson</SelectItem>
                    <SelectItem value="audio">Audio lesson</SelectItem>
                    <SelectItem value="text">Reading lesson</SelectItem>
                  </SelectContent>
                </Select>

                {lesson.type === 'video' && (
                  <>
                    <Input
                      type="url"
                      placeholder="Video URL (YouTube unlisted or hosted)"
                      value={lesson.video_url}
                      onChange={(event) => setLesson({ ...lesson, video_url: event.target.value })}
                      className="text-sm"
                    />
                    <Select
                      value={lesson.media_provider}
                      onValueChange={(value) => setLesson({ ...lesson, media_provider: value })}
                    >
                      <SelectTrigger className="w-full text-sm" aria-label="Video source">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-detect from URL</SelectItem>
                        <SelectItem value="youtube">YouTube (unlisted)</SelectItem>
                        <SelectItem value="self">Self-hosted file</SelectItem>
                        <SelectItem value="none">No media</SelectItem>
                      </SelectContent>
                    </Select>
                    <MediaUpload
                      kind="video"
                      label="Upload video file"
                      value={lesson.video_url}
                      helper="MP4 or WebM, max 200 MB"
                      onUploaded={(asset) => setLesson((current) => ({ ...current, video_url: asset.url, media_provider: 'self' }))}
                      onClear={() => setLesson((current) => ({ ...current, video_url: '', media_provider: 'auto' }))}
                    />
                  </>
                )}

                {lesson.type === 'audio' && (
                  <MediaUpload
                    kind="audio"
                    label="Audio file"
                    value={lesson.audio_url}
                    helper="MP3, M4A, WAV or OGG, max 50 MB"
                    onUploaded={(asset) => setLesson((current) => ({ ...current, audio_url: asset.url }))}
                    onClear={() => setLesson((current) => ({ ...current, audio_url: '' }))}
                  />
                )}

                <MediaUpload
                  kind="image"
                  label={lesson.type === 'text' ? 'Cover image (optional)' : 'Lesson thumbnail (optional)'}
                  value={lesson.thumbnail_url}
                  onUploaded={(asset) => setLesson((current) => ({ ...current, thumbnail_url: asset.url }))}
                  onClear={() => setLesson((current) => ({ ...current, thumbnail_url: '' }))}
                />

                {lesson.type !== 'text' && (
                  <MediaUpload
                    kind="caption"
                    label="Captions (optional)"
                    value={lesson.caption_url}
                    helper="WebVTT or SRT"
                    onUploaded={(asset) => setLesson((current) => ({ ...current, caption_url: asset.url }))}
                    onClear={() => setLesson((current) => ({ ...current, caption_url: '' }))}
                  />
                )}

                <Input
                  type="url"
                  placeholder={lesson.type === 'text' ? 'Extra resource URL (optional)' : 'Reading or resource URL'}
                  value={lesson.content_url}
                  onChange={(event) => setLesson({ ...lesson, content_url: event.target.value })}
                  className="text-sm"
                />
                <Button type="submit" size="sm" variant="outline" disabled={savingLesson}>
                  <Plus size={13} className="mr-1.5" />
                  {savingLesson ? 'Adding…' : 'Add lesson'}
                </Button>
              </form>
            )}

            {canEdit && (
              <Button size="sm" onClick={submit} disabled={saving} className="w-full">
                <Send size={13} className="mr-1.5" />
                {saving ? 'Submitting…' : 'Submit for review'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

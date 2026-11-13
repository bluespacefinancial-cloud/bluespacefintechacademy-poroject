/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react'
import { BookOpen, Plus, Send, Trash2, Link as LinkIcon, Upload, Video, Radio, ShieldCheck, CheckCircle2, Clock } from 'lucide-react'
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

const STATUS_VARIANTS = {
  draft: 'secondary',
  submitted: 'warning',
  under_review: 'warning',
  changes_requested: 'destructive',
  approved: 'success',
  published: 'success',
  rejected: 'destructive',
  archived: 'secondary',
}

const EDITABLE_STATUSES = ['draft', 'changes_requested']

const emptyCourseForm = {
  title: '',
  description: '',
  media_source: 'link', // 'link' | 'upload'
  video_url: '',
  media_provider: 'youtube', // 'youtube' | 'vimeo' | 'self' | 'auto'
  thumbnail_url: '',
  certificate_title: 'Partner Course Certificate',
  partner_logo_url: '',
  track: 'All',
}

const emptyLessonForm = {
  title: '',
  description: '',
  type: 'video',
  media_source: 'link', // 'link' | 'upload'
  media_provider: 'youtube',
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
      if (courseRows?.length) {
        setSelected(courseRows[0])
      }
    }

    load()
      .catch((loadError) => setError(loadError.message || 'Unable to load partner data'))
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
      const resolvedProvider = form.media_source === 'upload' ? 'self' : (form.media_provider || 'auto')
      
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
          video_url: form.video_url.trim() || null,
          media_provider: resolvedProvider,
          slug: uniqueSlug,
        })
        .select()
        .single()
      if (createError) throw createError

      // Automatically initialize lesson 1 if course video was provided
      if (form.video_url.trim()) {
        const { data: newLesson, error: lessonError } = await api
          .from('partner_course_lessons')
          .insert({
            course_id: created.id,
            title: `${form.title.trim()}: Course Overview & Introduction`,
            description: form.description.trim() || 'Introductory video lecture and curriculum walkthrough.',
            type: 'video',
            media_provider: resolvedProvider,
            video_url: form.video_url.trim(),
            thumbnail_url: form.thumbnail_url.trim() || null,
            order_index: 1,
            is_published: true,
          })
          .select()
          .single()

        if (!lessonError && newLesson) {
          setLessons([newLesson])
        }
      }

      setCourses((current) => [created, ...current])
      setSelected(created)
      setForm(emptyCourseForm)
      setMessage('Course draft created successfully! You can now add more lessons or submit for academy review.')
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
        throw new Error('Please provide an external video link or upload a self-hosted video file.')
      }
      if (lessonType === 'audio' && !lesson.audio_url.trim()) {
        throw new Error('Please upload an audio file before adding this lesson.')
      }
      if (lessonType === 'text' && !lesson.description.trim()) {
        throw new Error('Please provide the reading body text before adding this lesson.')
      }

      const resolvedProvider = lessonType === 'text' 
        ? 'none' 
        : lesson.media_source === 'upload' 
        ? 'self' 
        : (lesson.media_provider || 'auto')

      const nextIndex = lessons.reduce((max, item) => Math.max(max, item.order_index ?? 0), -1) + 1
      const { data: created, error: lessonError } = await api
        .from('partner_course_lessons')
        .insert({
          course_id: selected.id,
          title: lesson.title.trim(),
          description: lesson.description.trim() || null,
          type: lessonType,
          media_provider: resolvedProvider,
          video_url: lessonType === 'video' ? lesson.video_url.trim() || null : null,
          audio_url: lessonType === 'audio' ? lesson.audio_url.trim() || null : null,
          thumbnail_url: lesson.thumbnail_url.trim() || null,
          caption_url: lesson.caption_url.trim() || null,
          content_url: lesson.content_url.trim() || null,
          order_index: nextIndex,
          is_published: false,
        })
        .select()
        .single()
      if (lessonError) throw lessonError
      setLessons((current) => [...current, created])
      setLesson(emptyLessonForm)
      setMessage('Lesson added successfully.')
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
      const { error: submitError } = await api
        .from('partner_courses')
        .update({ status: 'submitted' })
        .eq('id', selected.id)
      if (submitError) throw submitError
      await loadCourses(partner.id)
      setSelected({ ...selected, status: 'submitted' })
      setMessage('Course submitted. The academy team will review it shortly.')
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit this course')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Loading partner course studio…</p>
  }

  if (!partner) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Partner Course Studio</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage courses for academy students.</p>
        </div>
        {error && <p role="alert" className="rounded-md bg-rose-600 p-3 text-sm text-white font-medium">{error}</p>}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Agency link needed</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            An academy administrator must connect your partner account to an agency before you can create courses.
          </CardContent>
        </Card>
      </div>
    )
  }

  const canEdit = selected ? EDITABLE_STATUSES.includes(selected.status) : false

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Partner Course Studio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {partner.name} can author, upload, and publish verified fintech curricula.
          </p>
        </div>
        <Badge variant="solidEmerald" className="w-fit flex items-center gap-1.5 py-1 px-3">
          <ShieldCheck size={14} />
          Verified Academy Partner
        </Badge>
      </div>

      {error && <p role="alert" className="rounded-md bg-rose-600 p-3 text-sm text-white font-semibold">{error}</p>}
      {message && <p role="status" className="rounded-md bg-emerald-600 p-3 text-sm text-white font-semibold">{message}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* NEW COURSE DRAFT FORM */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-bold text-foreground">New course draft</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Drafts stay private until you submit them for academy review.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={createCourse} className="space-y-4">
              <div>
                <label htmlFor="course-title" className="mb-1 block text-xs font-bold text-foreground">Course title *</label>
                <Input
                  id="course-title"
                  placeholder="e.g. Real-Time Fraud Prevention & AML Pipelines"
                  required
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  className="text-xs"
                />
              </div>

              <div>
                <label htmlFor="course-description" className="mb-1 block text-xs font-bold text-foreground">Course description *</label>
                <Textarea
                  id="course-description"
                  placeholder="What students will learn and build in this industry-grade course."
                  required
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  className="min-h-[85px] text-xs"
                />
              </div>

              {/* COURSE MEDIA DELIVERY SELECTOR: LINK VS SELF-HOSTED */}
              <div className="space-y-2.5 rounded-xl border border-border bg-muted/40 p-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Video size={14} className="text-deep-600" />
                    Course Media Delivery *
                  </label>
                  <span className="text-[10px] text-muted-foreground font-medium">Link or Upload</span>
                </div>
                
                {/* Clean Segmented Toggle */}
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-card p-1 border border-border text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, media_source: 'link', media_provider: 'youtube' })}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
                      form.media_source === 'link'
                        ? 'bg-deep-600 text-white font-bold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <LinkIcon size={13} />
                    External Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, media_source: 'upload', media_provider: 'self' })}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
                      form.media_source === 'upload'
                        ? 'bg-deep-600 text-white font-bold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Upload size={13} />
                    Direct Upload
                  </button>
                </div>

                {form.media_source === 'link' ? (
                  <div className="space-y-2 pt-1">
                    <Input
                      id="course-video-url"
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=... or Vimeo URL"
                      value={form.video_url}
                      onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                      className="text-xs"
                    />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Stream Provider</span>
                      <select
                        aria-label="Media provider"
                        value={form.media_provider}
                        onChange={(e) => setForm({ ...form, media_provider: e.target.value })}
                        className="rounded border border-border bg-card px-2 py-1 text-xs text-foreground font-medium"
                      >
                        <option value="youtube">YouTube (unlisted / public)</option>
                        <option value="vimeo">Vimeo</option>
                        <option value="auto">Auto-detect from URL</option>
                        <option value="self">Hosted MP4 / HLS stream</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="pt-1">
                    <MediaUpload
                      kind="video"
                      label="Upload course video"
                      value={form.video_url}
                      helper="MP4 or WebM · max 500 MB · Direct cloud storage"
                      onUploaded={(asset) => setForm((c) => ({ ...c, video_url: asset.url, media_provider: 'self' }))}
                      onClear={() => setForm((c) => ({ ...c, video_url: '' }))}
                    />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="course-thumbnail" className="mb-1 block text-xs font-bold text-foreground">Course Thumbnail</label>
                <Input
                  id="course-thumbnail"
                  type="url"
                  placeholder="https://… or upload below"
                  value={form.thumbnail_url}
                  onChange={(event) => setForm({ ...form, thumbnail_url: event.target.value })}
                  className="text-xs mb-2"
                />
                <MediaUpload
                  kind="image"
                  label="Upload thumbnail file"
                  value={form.thumbnail_url}
                  helper="Landscape, 1200×675 · max 5 MB"
                  onUploaded={(asset) => setForm((current) => ({ ...current, thumbnail_url: asset.url }))}
                  onClear={() => setForm((current) => ({ ...current, thumbnail_url: '' }))}
                />
              </div>

              <div>
                <label htmlFor="course-partner-logo" className="mb-1 block text-xs font-bold text-foreground">Partner Logo</label>
                <Input
                  id="course-partner-logo"
                  type="url"
                  placeholder="https://… or upload below"
                  value={form.partner_logo_url}
                  onChange={(event) => setForm({ ...form, partner_logo_url: event.target.value })}
                  className="text-xs mb-2"
                />
                <MediaUpload
                  kind="image"
                  label="Upload partner logo"
                  value={form.partner_logo_url}
                  helper="Square or wide, transparent PNG works best"
                  onUploaded={(asset) => setForm((current) => ({ ...current, partner_logo_url: asset.url }))}
                  onClear={() => setForm((current) => ({ ...current, partner_logo_url: '' }))}
                />
              </div>

              <div>
                <label htmlFor="course-certificate" className="mb-1 block text-xs font-bold text-foreground">Certificate Title</label>
                <Input
                  id="course-certificate"
                  value={form.certificate_title}
                  onChange={(event) => setForm({ ...form, certificate_title: event.target.value })}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-foreground">Target Fellowship Track</label>
                <Select
                  value={form.track}
                  onValueChange={(val) => setForm({ ...form, track: val })}
                >
                  <SelectTrigger className="w-full text-xs" aria-label="Target track">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Tracks (Cross-functional)</SelectItem>
                    <SelectItem value="Finsoft">Finsoft (Architecture & Engineering)</SelectItem>
                    <SelectItem value="Finops">FinOps (Treasury, Settlement, Compliance & AML)</SelectItem>
                    <SelectItem value="Finfra">FinFra (AI, Data Infrastructure, Cyber Resilience)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={saving} className="w-full bg-deep-600 hover:bg-deep-700 text-white font-bold text-xs py-2.5">
                <Plus size={14} className="mr-2" />
                {saving ? 'Creating Draft…' : 'Create Course Draft'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* YOUR COURSES LIST */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-bold text-foreground">Your Courses</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">{courses.length} course{courses.length === 1 ? '' : 's'} authored by your organization.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5">
            {courses.map((course) => {
              const isSelected = selected?.id === course.id
              const variant = STATUS_VARIANTS[course.status] || 'secondary'
              return (
                <button
                  type="button"
                  key={course.id}
                  onClick={() => selectCourse(course)}
                  className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? 'border-deep-600 bg-muted/60 ring-1 ring-deep-500/50 shadow-xs'
                      : 'border-border bg-card hover:bg-muted/30'
                  }`}
                >
                  <p className="truncate text-sm font-bold text-foreground" title={course.title}>{course.title}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <Badge variant={variant} className="text-[10px] font-semibold uppercase tracking-wider">
                      {STATUS_LABELS[course.status] || course.status}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Track: {course.track || 'All'}
                    </span>
                  </div>
                  {course.rejection_reason && (
                    <p className="mt-2 text-[10px] text-rose-500 font-semibold truncate">Notes: {course.rejection_reason}</p>
                  )}
                </button>
              )
            })}
            {courses.length === 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground">No course drafts created yet. Fill out the draft form to get started.</p>
            )}
          </CardContent>
        </Card>

        {/* LESSON EDITOR & SUBMISSION */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-bold text-foreground truncate">{selected ? selected.title : 'Course Lessons'}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {selected
                ? `${lessons.length} lesson${lessons.length === 1 ? '' : 's'} · Status: ${STATUS_LABELS[selected.status] || selected.status}`
                : 'Select a course to inspect and upload its lessons.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {selected && selected.status === 'changes_requested' && selected.rejection_reason && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
                <span className="font-bold">Academy review notes: </span>
                {selected.rejection_reason}
              </div>
            )}

            {selected && !canEdit && (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground flex items-center gap-2">
                {selected.status === 'published' ? (
                  <>
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span>This course is live and published. Students in eligible tracks can access it directly.</span>
                  </>
                ) : (
                  <>
                    <Clock size={14} className="text-amber-500 shrink-0" />
                    <span>This course is under review by the academy leadership.</span>
                  </>
                )}
              </div>
            )}

            {/* Existing Lessons List */}
            {selected && lessons.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-2.5 shadow-xs">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-5 text-center text-[10px] font-bold text-muted-foreground">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground" title={item.title}>{item.title}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">
                      {item.type} {item.media_provider ? `· ${item.media_provider}` : ''}
                    </p>
                  </div>
                </div>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteLesson(item)}
                    aria-label={`Delete ${item.title}`}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-7 w-7 p-0"
                  >
                    <Trash2 size={13} />
                  </Button>
                )}
              </div>
            ))}

            {selected && lessons.length === 0 && (
              <div className="py-6 text-center text-muted-foreground">
                <BookOpen size={24} className="mx-auto mb-2 opacity-50 text-muted-foreground" />
                <p className="text-xs">No lessons added yet. Use the form below.</p>
              </div>
            )}

            {/* ADD A LESSON FORM */}
            {canEdit && (
              <form onSubmit={addLesson} className="space-y-3 rounded-xl border border-border bg-muted/30 p-3.5">
                <p className="text-xs font-bold text-foreground">Add a lesson</p>
                <Input
                  placeholder="Lesson title"
                  required
                  value={lesson.title}
                  onChange={(event) => setLesson({ ...lesson, title: event.target.value })}
                  className="text-xs"
                />
                <Textarea
                  placeholder={lesson.type === 'text' ? 'Lesson reading body text' : 'Short description / objectives'}
                  value={lesson.description}
                  onChange={(event) => setLesson({ ...lesson, description: event.target.value })}
                  className={lesson.type === 'text' ? 'min-h-[120px] text-xs' : 'min-h-[55px] text-xs'}
                />
                
                <Select
                  value={lesson.type}
                  onValueChange={(value) => setLesson({ ...lesson, type: value })}
                >
                  <SelectTrigger className="w-full text-xs" aria-label="Lesson type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video lesson</SelectItem>
                    <SelectItem value="audio">Audio lesson</SelectItem>
                    <SelectItem value="text">Reading lesson</SelectItem>
                  </SelectContent>
                </Select>

                {lesson.type === 'video' && (
                  <div className="space-y-2 rounded-lg border border-border bg-card p-2.5">
                    {/* Link vs Self-Hosted Upload for Lesson */}
                    <div className="grid grid-cols-2 gap-1 rounded bg-muted p-0.5 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setLesson({ ...lesson, media_source: 'link', media_provider: 'youtube' })}
                        className={`flex items-center justify-center gap-1.5 py-1 rounded transition-all text-xs ${
                          (lesson.media_source || 'link') === 'link'
                            ? 'bg-deep-600 text-white font-bold shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <LinkIcon size={12} />
                        External Link
                      </button>
                      <button
                        type="button"
                        onClick={() => setLesson({ ...lesson, media_source: 'upload', media_provider: 'self' })}
                        className={`flex items-center justify-center gap-1.5 py-1 rounded transition-all text-xs ${
                          lesson.media_source === 'upload'
                            ? 'bg-deep-600 text-white font-bold shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Upload size={12} />
                        Self-Hosted
                      </button>
                    </div>

                    {(lesson.media_source || 'link') === 'link' ? (
                      <div className="space-y-2 pt-1">
                        <Input
                          type="url"
                          placeholder="Video URL (YouTube or Vimeo)"
                          value={lesson.video_url}
                          onChange={(event) => setLesson({ ...lesson, video_url: event.target.value })}
                          className="text-xs"
                        />
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Platform</span>
                          <select
                            aria-label="Video provider"
                            value={lesson.media_provider}
                            onChange={(e) => setLesson({ ...lesson, media_provider: e.target.value })}
                            className="rounded border border-border bg-card px-2 py-0.5 text-xs text-foreground"
                          >
                            <option value="youtube">YouTube</option>
                            <option value="vimeo">Vimeo</option>
                            <option value="auto">Auto-detect</option>
                            <option value="self">Hosted stream</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1">
                        <MediaUpload
                          kind="video"
                          label="Upload video file"
                          value={lesson.video_url}
                          helper="MP4 or WebM, max 500 MB"
                          onUploaded={(asset) => setLesson((current) => ({ ...current, video_url: asset.url, media_provider: 'self' }))}
                          onClear={() => setLesson((current) => ({ ...current, video_url: '', media_provider: 'auto' }))}
                        />
                      </div>
                    )}
                  </div>
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

                <Button type="submit" size="sm" disabled={savingLesson} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs">
                  <Plus size={13} className="mr-1.5" />
                  {savingLesson ? 'Adding Lesson…' : 'Add Lesson to Course'}
                </Button>
              </form>
            )}

            {canEdit && (
              <Button size="sm" onClick={submit} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5">
                <Send size={13} className="mr-1.5" />
                {saving ? 'Submitting…' : 'Submit Course for Review'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

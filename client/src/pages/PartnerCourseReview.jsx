/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react'
import { CheckCircle, Clock, XCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Textarea } from '../components/ui/textarea'
import { api } from '../lib/backend'
import { getCurrentProfile } from '../lib/profile'

const REVIEW_STATUSES = ['submitted', 'under_review', 'changes_requested', 'approved']

const STATUS_LABELS = {
  submitted: 'Awaiting review',
  under_review: 'Under review',
  changes_requested: 'Changes requested',
  approved: 'Approved · ready to publish',
}

function formatDate(value) {
  if (!value) return null
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function PartnerCourseReview() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [rejectionDraft, setRejectionDraft] = useState({})

  const load = useCallback(async () => {
    const { data, error: loadError } = await api
      .from('partner_courses')
      .select('*, partners(name, logo_url), partner_course_lessons(id, title, is_published)')
      .in('status', REVIEW_STATUSES)
      .order('submitted_at', { ascending: true })
    if (loadError) throw loadError
    setCourses(data || [])
  }, [])

  useEffect(() => {
    load()
      .catch((loadError) => setError(loadError.message || 'Unable to load course reviews'))
      .finally(() => setLoading(false))
  }, [load])

  const decide = async (course, status) => {
    setError('')
    setMessage('')

    const reason = (rejectionDraft[course.id] || '').trim()
    if (status === 'changes_requested' && !reason) {
      setError('Describe the changes the partner needs to make before returning the course.')
      return
    }

    setBusyId(course.id)
    try {
      const profile = await getCurrentProfile()
      const now = new Date().toISOString()
      const patch = status === 'published'
        ? {
            status,
            approved_at: course.approved_at || now,
            published_at: now,
            approved_by: profile?.id ?? null,
            rejection_reason: null,
          }
        : { status, rejection_reason: reason || null }

      const { error: updateError } = await api
        .from('partner_courses')
        .update({ ...patch, updated_at: now })
        .eq('id', course.id)
      if (updateError) throw updateError

      setRejectionDraft((current) => {
        const next = { ...current }
        delete next[course.id]
        return next
      })
      setMessage(status === 'published' ? `“${course.title}” is now published to students.` : `“${course.title}” was returned to the partner with your notes.`)
      await load()
    } catch (updateError) {
      setError(updateError.message || 'Unable to update this course')
    } finally {
      setBusyId(null)
    }
  }

  const pendingCount = courses.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Partner course review</h1>
        <p className="mt-1 text-sm text-gray-500">
          Approve partner content before students can access it. Publishing also publishes the course lessons.
        </p>
      </div>

      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}

      {loading && <p className="py-12 text-center text-sm text-gray-500">Loading course reviews…</p>}

      {!loading && pendingCount === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            <CheckCircle size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No partner courses are waiting for review.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {!loading && courses.map((course) => {
          const lessonCount = course.partner_course_lessons?.length || 0
          const publishedLessons = (course.partner_course_lessons || []).filter((lesson) => lesson.is_published).length
          const busy = busyId === course.id
          const submitted = formatDate(course.submitted_at)

          return (
            <Card key={course.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  {course.partners?.logo_url && (
                    <img
                      src={course.partners.logo_url}
                      alt=""
                      className="h-10 w-10 shrink-0 object-contain"
                    />
                  )}
                  <div className="min-w-0">
                    <CardTitle className="truncate text-sm">{course.title}</CardTitle>
                    <CardDescription className="text-[11px]">
                      {course.partners?.name || 'Partner'} · {lessonCount} lesson{lessonCount === 1 ? '' : 's'}
                      {publishedLessons > 0 && ` (${publishedLessons} live)`}
                      {submitted && ` · submitted ${submitted}`}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={course.status === 'approved' ? 'secondary' : 'outline'} className="shrink-0">
                  {STATUS_LABELS[course.status] || course.status}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4">
                {course.description && (
                  <p className="max-w-3xl whitespace-pre-line text-sm text-gray-600">{course.description}</p>
                )}

                {course.status === 'changes_requested' && course.rejection_reason && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    <span className="font-semibold">Returned to partner: </span>
                    {course.rejection_reason}
                  </div>
                )}

                {lessonCount === 0 && (
                  <p className="text-xs text-amber-700">
                    This course has no lessons yet. Publishing it would give students an empty course.
                  </p>
                )}

                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor={`rejection-${course.id}`}
                      className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600"
                    >
                      <Clock size={12} />
                      Notes for the partner (required when requesting changes)
                    </label>
                    <Textarea
                      id={`rejection-${course.id}`}
                      value={rejectionDraft[course.id] || ''}
                      onChange={(event) => setRejectionDraft({ ...rejectionDraft, [course.id]: event.target.value })}
                      placeholder="e.g. Please add the assessment rubric and a caption file for lesson 2."
                      className="min-h-[70px] text-sm"
                    />
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => decide(course, 'changes_requested')}
                      disabled={busy}
                    >
                      <XCircle size={14} className="mr-1" />
                      Request changes
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => decide(course, 'published')}
                      disabled={busy || lessonCount === 0}
                      title={lessonCount === 0 ? 'Add at least one lesson before publishing' : undefined}
                    >
                      <CheckCircle size={14} className="mr-1" />
                      {busy ? 'Publishing…' : 'Approve and publish'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

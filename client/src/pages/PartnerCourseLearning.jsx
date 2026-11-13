import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle, Circle } from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { api } from '../lib/backend'
import { getCurrentProfile } from '../lib/profile'
import MediaPlayer from '../components/MediaPlayer'
import { Breadcrumb } from '../components/ui/breadcrumb'

/**
 * Partner course player.
 *
 * Partner lessons are video-shaped (no audio/text variants yet), so they are
 * normalised to the MediaPlayer contract. Progress lives in
 * `partner_course_progress` rather than `lesson_progress`; that store has a
 * different shape, so MediaPlayer gets an explicit adapter. This gives partner
 * students the same resume, 90%-watch completion and playback controls as
 * academy lessons instead of the old manual "mark complete" button.
 */
export default function PartnerCourseLearning() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [profile, setProfile] = useState(null)
  const [progress, setProgress] = useState([])
  const [selectedLessonId, setSelectedLessonId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const currentProfile = await getCurrentProfile()
        if (!currentProfile) {
          throw new Error('Your session has expired. Please sign in again.')
        }

        // Explicit columns. RLS already limits students to published lessons in
        // published courses for their cohort; the client filter below keeps the
        // page correct even if that policy is ever relaxed for another role.
        const { data: courseRow, error: courseError } = await api
          .from('partner_courses')
          .select('id, title, description, thumbnail_url, partners(name, logo_url), partner_course_lessons(id, title, description, video_url, content_url, order_index, is_published)')
          .eq('id', courseId)
          .single()
        if (courseError) throw courseError

        const { data: progressRows, error: progressError } = await api
          .from('partner_course_progress')
          .select('lesson_id, is_completed, completion_percentage, last_position_seconds')
          .eq('course_id', courseId)
          .eq('user_id', currentProfile.id)
        if (progressError) throw progressError

        const lessons = (courseRow.partner_course_lessons || [])
          .filter((lesson) => lesson.is_published)
          .sort((a, b) => a.order_index - b.order_index)

        if (cancelled) return
        setCourse({ ...courseRow, partner_course_lessons: lessons })
        setProfile(currentProfile)
        setProgress(progressRows || [])
        setSelectedLessonId((current) => {
          if (current && lessons.some((lesson) => lesson.id === current)) return current
          const firstIncomplete = lessons.find(
            (lesson) => !(progressRows || []).some((item) => item.lesson_id === lesson.id && item.is_completed),
          )
          return firstIncomplete?.id ?? lessons[0]?.id ?? null
        })
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || 'This course is not available to your account yet.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [courseId])

  const progressAdapter = useMemo(() => ({
    async load(userId, lessonId) {
      const { data, error: loadError } = await api
        .from('partner_course_progress')
        .select('is_completed, completion_percentage')
        .eq('course_id', Number(courseId))
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .maybeSingle()
      if (loadError || !data) return null
      return data
    },
    async save({ userId, lessonId, percent, completed, position }) {
      await api.from('partner_course_progress').upsert({
        course_id: Number(courseId),
        lesson_id: lessonId,
        user_id: userId,
        completion_percentage: percent,
        is_completed: completed,
        last_position_seconds: position,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'lesson_id,user_id' })
    },
  }), [courseId])

  const handleComplete = async (lessonId) => {
    const next = [
      ...progress.filter((item) => item.lesson_id !== lessonId),
      { lesson_id: lessonId, is_completed: true, completion_percentage: 100 },
    ]
    setProgress(next)

    const published = course?.partner_course_lessons || []
    if (!profile || published.length === 0) return

    const allDone = published.every((lesson) =>
      next.some((item) => item.lesson_id === lesson.id && item.is_completed),
    )
    if (!allDone) return

    const { error: certificateError } = await api.rpc('issue_partner_certificate', {
      p_user_id: profile.id,
      p_course_id: Number(courseId),
      p_final_grade: 100,
    })
    if (certificateError) {
      setError(certificateError.message)
      return
    }
    setMessage('Course complete — your certificate has been issued.')
  }

  if (loading) {
    return <p className="py-12 text-center text-sm text-gray-500">Loading course…</p>
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card>
          <CardContent className="space-y-3 p-6 text-center">
            <p className="text-sm font-semibold text-gray-900">This course isn’t available yet</p>
            <p className="text-sm text-gray-600">
              {error || 'You need an active enrolment in a published course to open it.'}
            </p>
            <Link to="/partner-catalog" className="text-sm font-semibold text-deep-600 hover:text-deep-700">
              Back to the partner catalog
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const lessons = course.partner_course_lessons || []
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) || null
  const isVideoLesson = Boolean(selectedLesson?.video_url && selectedLesson.video_url.trim() !== '')
  const playerLesson = isVideoLesson
    ? {
        ...selectedLesson,
        duration_minutes: 0,
        media_provider: selectedLesson.media_provider || 'youtube',
      }
    : null
  const isTextLesson = selectedLesson && !isVideoLesson
  const completedCount = lessons.filter((lesson) =>
    progress.some((item) => item.lesson_id === lesson.id && item.is_completed),
  ).length
  const isDone = (lessonId) => progress.some((item) => item.lesson_id === lessonId && item.is_completed)

  return (
    <div className="w-full space-y-6">
      <Breadcrumb
        items={[
          { to: '/partner-catalog', label: 'Partner Catalog' },
          { label: course?.title || 'Course' },
        ]}
      />
      <div className="flex items-center gap-3">
        {course.partners?.logo_url && (
          <img
            src={course.partners.logo_url}
            alt=""
            className="h-12 w-12 object-contain rounded-lg border border-gray-200 dark:border-gray-800 p-1 bg-white dark:bg-gray-800 shrink-0"
          />
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{course.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {course.partners?.name}
            {lessons.length > 0 ? ` · ${completedCount}/${lessons.length} lessons complete` : ''}
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-3 text-sm text-emerald-700 dark:text-emerald-300">
          {message}
        </p>
      )}

      {lessons.length === 0 ? (
        <Card className="dark:bg-card dark:border-border">
          <CardContent className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            This course has no published lessons yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3 w-full">
          <div className="space-y-4 lg:col-span-2">
            {playerLesson ? (
              <MediaPlayer
                key={playerLesson.id}
                lesson={playerLesson}
                user={profile}
                onComplete={handleComplete}
                progressAdapter={progressAdapter}
              />
            ) : isTextLesson ? (
              <Card className="dark:bg-card dark:border-border">
                <CardContent className="space-y-3 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedLesson.title}</h2>
                  <div className="whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    {selectedLesson.description || 'This reading lesson has no text yet.'}
                  </div>
                  <Button
                    size="sm"
                    variant={isDone(selectedLesson.id) ? 'secondary' : 'default'}
                    disabled={isDone(selectedLesson.id)}
                    onClick={() => handleComplete(selectedLesson.id)}
                  >
                    {isDone(selectedLesson.id) ? 'Completed' : 'Mark as read'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="dark:bg-card dark:border-border">
                <CardContent className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  Select a lesson to begin.
                </CardContent>
              </Card>
            )}

            {selectedLesson?.content_url && (
              <a
                href={selectedLesson.content_url}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-sm font-semibold text-deep-600 hover:text-deep-700 dark:text-deep-400 dark:hover:text-deep-300"
              >
                Open the lesson resource
              </a>
            )}

            {!isTextLesson && selectedLesson?.description && (
              <p className="whitespace-pre-line text-sm text-gray-600 dark:text-gray-400">{selectedLesson.description}</p>
            )}
          </div>

          <aside className="space-y-4">
            <Card className="dark:bg-card dark:border-border">
              <CardContent className="space-y-1 p-3">
                <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Lessons
                </p>
                {lessons.map((lesson, index) => {
                  const done = isDone(lesson.id)
                  const active = lesson.id === selectedLessonId
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => setSelectedLessonId(lesson.id)}
                      className={`flex w-full items-start gap-2 rounded-md p-2 text-left transition-colors ${
                        active
                          ? 'bg-deep-50 dark:bg-deep-950/40 text-deep-700 dark:text-deep-300 font-medium'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {done ? (
                        <CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle size={16} className="mt-0.5 shrink-0 text-gray-300 dark:text-gray-600" />
                      )}
                      <span className="min-w-0">
                        <span className="block text-[10px] font-medium text-gray-400 dark:text-gray-500">Lesson {index + 1}</span>
                        <span className="block truncate text-xs" title={lesson.title}>{lesson.title}</span>
                      </span>
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, Code2, BookOpen } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import MediaPlayer from '../components/MediaPlayer'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/backend'
import { getCurrentProfile } from '../lib/profile'

export default function LessonPlayer() {
  const navigate = useNavigate()
  const { lessonId } = useParams()
  const { user } = useAuth()
  const [lesson, setLesson] = useState(null)
  const [moduleLessons, setModuleLessons] = useState([])
  const [attachedLab, setAttachedLab] = useState(null)
  const [labSubmission, setLabSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)
  const [savingProgress, setSavingProgress] = useState(false)

  const loadLesson = async () => {
    if (!lessonId) return
    try {
      setLoading(true)
      const { data, error } = await api
        .from('lessons')
        .select('*')
        .eq('id', parseInt(lessonId))
        .single()

      if (error || !data) {
        setLoading(false)
        return
      }
      setLesson(data)

      const profile = await getCurrentProfile()

      // Concurrently fetch sibling lessons, progress, and attached lab
      const [siblingResult, progressResult, labResult] = await Promise.all([
        api
          .from('lessons')
          .select('id, title, order_index, duration_minutes, type')
          .eq('module_id', data.module_id)
          .order('order_index', { ascending: true }),
        profile
          ? api
              .from('lesson_progress')
              .select('is_completed, completion_percentage')
              .eq('user_id', profile.id)
              .eq('lesson_id', parseInt(lessonId))
              .maybeSingle()
          : Promise.resolve({ data: null }),
        api
          .from('labs')
          .select('id, title, max_score, due_date')
          .eq('lesson_id', data.id)
          .maybeSingle(),
      ])

      setModuleLessons(siblingResult.data || [])
      if (progressResult.data) {
        setCompleted(progressResult.data.is_completed || false)
      } else {
        setCompleted(false)
      }

      if (labResult.data) {
        setAttachedLab(labResult.data)
        if (profile) {
          const { data: subData } = await api
            .from('submissions')
            .select('id, status, score, feedback, submitted_at')
            .eq('lab_id', labResult.data.id)
            .eq('user_id', profile.id)
            .maybeSingle()
          setLabSubmission(subData || null)
        }
      } else {
        setAttachedLab(null)
        setLabSubmission(null)
      }
    } catch (err) {
      console.error('Error loading lesson:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Loading flag is set synchronously before the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLesson()
  }, [lessonId])

  const handleLessonComplete = (_lessonId) => {
    setCompleted(true)
  }

  const markCompleteAndNavigate = async (targetLessonId) => {
    try {
      setSavingProgress(true)
      // Previewing staff move between lessons without writing student progress.
      if (!isPreview) {
        const profile = await getCurrentProfile()
        if (profile && lesson) {
          await api.from('lesson_progress').upsert(
            {
              user_id: profile.id,
              lesson_id: lesson.id,
              is_completed: true,
              completion_percentage: 100,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,lesson_id' }
          )
          setCompleted(true)
        }
      }
      if (targetLessonId) {
        navigate(`/lesson/${targetLessonId}`)
      } else {
        navigate(backTarget)
      }
    } catch (err) {
      console.error('Error completing lesson:', err)
    } finally {
      setSavingProgress(false)
    }
  }

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (loading || !lesson) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-deep-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-gray-500">Loading lesson workspace...</span>
        </div>
      </div>
    )
  }

  const isVideo = lesson.type === 'video'
  // Instructors and administrators preview lessons; they never accrue progress.
  const isPreview = Boolean(user?.type) && user.type !== 'Student'
  const backTarget = isPreview ? '/my-modules' : '/my-learning'
  const currentIndex = moduleLessons.findIndex((l) => l.id === lesson.id)
  const prevLesson = currentIndex > 0 ? moduleLessons[currentIndex - 1] : null
  const nextLesson = currentIndex >= 0 && currentIndex < moduleLessons.length - 1 ? moduleLessons[currentIndex + 1] : null

  return (
    <div className="w-full space-y-6">
      {/* Top Header & Breadcrumbs Bar */}
      <div className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(backTarget)}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
            title={isPreview ? 'Return to module editor' : 'Return to curriculum'}
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-semibold text-deep-700">Lesson {lesson.order_index} of {moduleLessons.length}</span>
              <span>•</span>
              <span className="capitalize">{isVideo ? 'Video Lecture' : 'Audio Lesson'}</span>
              <span>•</span>
              <span>{formatTime(lesson.duration_minutes * 60)}</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate mt-0.5">
              {lesson.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Badge
            variant={isPreview ? 'outline' : completed ? 'secondary' : 'outline'}
            className="text-xs font-medium"
          >
            {isPreview ? 'Staff preview' : completed ? 'Completed' : 'In Progress'}
          </Badge>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <Link to={backTarget}>
              <BookOpen size={13} className="mr-1.5" />
              {isPreview ? 'My Modules' : 'Syllabus'}
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Grid: Media Canvas & Attached Lab (2/3) + Sidebar (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Main Media Player */}
          <Card className="overflow-hidden border border-gray-200/90 shadow-sm rounded-xl bg-white">
            <div className="p-0">
              <MediaPlayer lesson={lesson} user={user} onComplete={handleLessonComplete} readOnly={isPreview} />
            </div>
          </Card>

          {/* Attached Lab Exercise Box (if lab exists for this lesson) */}
          {attachedLab && (
            <Card className="border border-deep-600/30 shadow-sm rounded-xl bg-deep-50/20 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-deep-100 bg-deep-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-deep-600 text-white flex items-center justify-center shrink-0">
                    <Code2 size={15} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Attached Practical Lab</h3>
                    <p className="text-[11px] text-gray-500">Hands-on deliverable for this lesson</p>
                  </div>
                </div>
                <Badge
                  variant={!isPreview && labSubmission?.status === 'graded' ? 'secondary' : 'outline'}
                  className="text-[11px] font-medium"
                >
                  {isPreview
                    ? 'Preview'
                    : labSubmission?.status === 'graded'
                    ? `Graded: ${labSubmission.score}/${attachedLab.max_score}`
                    : labSubmission?.status === 'submitted'
                    ? 'Submitted · In Review'
                    : 'Pending Submission'}
                </Badge>
              </div>

              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{attachedLab.title}</h4>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>Worth: {attachedLab.max_score} pts</span>
                    {attachedLab.due_date && (
                      <>
                        <span>•</span>
                        <span>Due: {new Date(attachedLab.due_date).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                  {labSubmission?.feedback && (
                    <div className="mt-2 rounded-lg bg-white border border-gray-100 p-2.5 text-xs text-gray-600">
                      <strong className="text-gray-900 font-semibold">Faculty Feedback: </strong>
                      {labSubmission.feedback}
                    </div>
                  )}
                </div>

                <Button
                  asChild
                  size="sm"
                  className="bg-deep-600 text-white hover:bg-deep-700 text-xs font-semibold shrink-0"
                >
                  <Link to={isPreview ? '/grading' : '/lab-workspace'}>
                    <Code2 size={13} className="mr-1.5" />
                    {isPreview ? 'Review submissions' : labSubmission ? 'View Submission' : 'Open Lab Workspace'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Lesson Details Card */}
          <Card className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Lesson Overview</h3>
            </div>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-500">Format</span>
                <span className="font-semibold text-gray-900 capitalize">{lesson.type || 'Lecture'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-500">Duration</span>
                <span className="font-semibold text-gray-900">{formatTime(lesson.duration_minutes * 60)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-500">Status</span>
                <span className="font-semibold text-gray-900">{isPreview ? 'Preview' : completed ? 'Completed' : 'In Progress'}</span>
              </div>
              {lesson.description && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-600 leading-relaxed">{lesson.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bottom Lesson Navigation Bar */}
          <div className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm flex items-center justify-between gap-3">
            <div>
              {prevLesson ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/lesson/${prevLesson.id}`)}
                  className="text-xs border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  <ChevronLeft size={14} className="mr-1" />
                  Previous Lesson
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(backTarget)}
                  className="text-xs border-gray-200 text-gray-500"
                >
                  <BookOpen size={13} className="mr-1.5" />
                  {isPreview ? 'My Modules' : 'Curriculum'}
                </Button>
              )}
            </div>

            <div>
              {nextLesson ? (
                <Button
                  size="sm"
                  onClick={() => markCompleteAndNavigate(nextLesson.id)}
                  disabled={savingProgress}
                  className="bg-deep-600 text-white hover:bg-deep-700 text-xs font-semibold"
                >
                  {isPreview || completed ? 'Next Lesson' : 'Complete & Next'}
                  <ChevronRight size={14} className="ml-1" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => markCompleteAndNavigate(null)}
                  disabled={savingProgress}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold"
                >
                  <CheckCircle2 size={14} className="mr-1.5" />
                  {isPreview ? 'Back to module' : 'Finish Module'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Module Syllabus Track */}
        <div className="space-y-5">
          <Card className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 leading-tight">Module Lessons</h3>
              <p className="mt-0.5 text-xs text-gray-500">{moduleLessons.length} lessons in this module</p>
            </div>
            <CardContent className="p-3">
              <div className="divide-y divide-gray-100">
                {moduleLessons.map((l, index) => {
                  const isCurrent = l.id === lesson.id
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => navigate(`/lesson/${l.id}`)}
                      className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-lg text-left transition-colors text-xs ${
                        isCurrent
                          ? 'bg-deep-50 border border-deep-100 font-semibold text-deep-900'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isCurrent ? 'bg-deep-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="truncate">{l.title}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {l.duration_minutes ? `${l.duration_minutes}m` : ''}
                      </span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Support / Feedback Box */}
          <Card className="border border-gray-200/90 shadow-sm rounded-xl bg-white p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Need assistance?
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              If you have questions about this lesson&apos;s API integration or encounter bug issues during the practical lab, reach out in your squad workspace or book a clinic slot with faculty.
            </p>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full text-xs border-gray-200 text-deep-600 hover:bg-deep-50"
            >
              <Link to="/my-squad">Squad Workspace</Link>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}

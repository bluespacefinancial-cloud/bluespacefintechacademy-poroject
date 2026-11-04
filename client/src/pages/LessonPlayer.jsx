import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, FileText } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import MediaPlayer from '../components/MediaPlayer'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function LessonPlayer() {
  const navigate = useNavigate()
  const { lessonId } = useParams()
  const { user } = useAuth()
  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)

  const loadLesson = async () => {
    if (!lessonId) return
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', parseInt(lessonId))
        .single()

      if (error || !data) {
        setLoading(false)
        return
      }
      setLesson(data)

      // Load progress
      const { data: progress } = await supabase
        .from('lesson_progress')
        .select('is_completed, completion_percentage')
        .eq('user_id', user.id)
        .eq('lesson_id', parseInt(lessonId))
        .single()

      if (progress) {
        setCompleted(progress.is_completed || false)
      }
    } catch {
      setLoading(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      await loadLesson()
    })()
  }, [lessonId])

  const handleLessonComplete = (_lessonId) => {
    setCompleted(true)
  }

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (loading || !lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading lesson...</span>
        </div>
      </div>
    )
  }

  const isVideo = lesson.type === 'video'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-deep-600 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-deep-600">{lesson.title}</h1>
            <p className="text-xs text-gray-500">
              Lesson {lesson.order_index} • {isVideo ? 'Video' : 'Audio'} • {formatTime(lesson.duration_minutes * 60)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={completed ? 'secondary' : 'default'}
            className="text-[10px]"
          >
            {completed ? 'Completed' : 'Incomplete'}
          </Badge>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-deep-600 text-white rounded-md text-sm font-medium hover:bg-deep-700 transition-colors"
          >
            Back to Course
          </button>
        </div>
      </div>

      <div className="p-4 lg:p-6 max-w-3xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Media Player */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardHeader className="p-0">
                <MediaPlayer lesson={lesson} user={user} onComplete={handleLessonComplete} />
              </CardHeader>
            </Card>

            {/* Lesson Description */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Lesson Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-deep-600">Type</span>
                  <Badge className={isVideo ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-amber-100 text-amber-700 border-amber-200'}>
                    {isVideo ? 'Video Lesson' : 'Audio Lesson'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-deep-600">Duration</span>
                  <span className="text-xs text-gray-600">{formatTime(lesson.duration_minutes * 60)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-deep-600">Status</span>
                  <Badge variant={completed ? 'secondary' : 'outline'} className="text-[10px]">
                    {completed ? 'Completed' : 'Not Started'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-deep-600">Required</span>
                  <span className="text-xs text-gray-600">Yes</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Quick Actions */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant={completed ? 'secondary' : 'default'}
                  className="w-full"
                  onClick={() => navigate(-1)}
                >
                  {completed ? 'Rewatch Lesson' : 'Play Lesson'}
                </Button>
                <Button variant="outline" className="w-full">
                  <FileText size={14} className="mr-2" />
                  View Transcript
                </Button>
                <Button variant="outline" className="w-full">
                  <Clock size={14} className="mr-2" />
                  Mark as Complete
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-deep-600">Completion</span>
                  <span className="text-xs font-bold text-deep-600">{Math.round(lesson.duration_minutes > 0 ? (completed ? 100 : 0) : 0)}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-600"
                    style={{ width: completed ? '100%' : '0%' }}
                  />
                </div>
                <p className="text-[10px] text-gray-500 text-center">
                  {completed ? 'Lesson completed successfully' : 'Start watching to track progress'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

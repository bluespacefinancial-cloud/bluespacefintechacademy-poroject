import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, PlayCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { supabase } from '../lib/supabase'

export default function PartnerCourseLearning() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [progress, setProgress] = useState([])
  const [error, setError] = useState('')
  useEffect(() => {
    const load = async () => {
      const { data: courseData, error: courseError } = await supabase.from('partner_courses').select('*, partners(name, logo_url), partner_course_lessons(*)').eq('id', courseId).single()
      if (courseError) throw courseError
      const { data: user } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('users').select('id').eq('email', user.user.email).single()
      const { data: progressData, error: progressError } = await supabase.from('partner_course_progress').select('*').eq('course_id', courseId).eq('user_id', profile.id)
      if (progressError) throw progressError
      setCourse(courseData); setProgress(progressData || [])
    }
    load().catch((loadError) => setError(loadError.message || 'Unable to load course'))
  }, [courseId])
  const complete = async (lessonId) => {
    const { data: user } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('id').eq('email', user.user.email).single()
    const { error: saveError } = await supabase.from('partner_course_progress').upsert({ course_id: Number(courseId), lesson_id: lessonId, user_id: profile.id, completion_percentage: 100, is_completed: true }, { onConflict: 'lesson_id,user_id' })
    if (saveError) { setError(saveError.message); return }
    const nextProgress = [...progress.filter((item) => item.lesson_id !== lessonId), { lesson_id: lessonId, is_completed: true }]
    setProgress(nextProgress)
    const publishedLessons = (course?.partner_course_lessons || []).filter((item) => item.is_published)
    if (publishedLessons.length > 0 && publishedLessons.every((item) => nextProgress.some((itemProgress) => itemProgress.lesson_id === item.id && itemProgress.is_completed))) {
      const { error: certificateError } = await supabase.rpc('issue_partner_certificate', { p_user_id: profile.id, p_course_id: Number(courseId), p_final_grade: 100 })
      if (certificateError) setError(certificateError.message)
    }
  }
  return <div className="min-h-screen bg-gray-50"><div className="mb-6 flex items-center gap-3">{course?.partners?.logo_url && <img src={course.partners.logo_url} alt="" className="h-12 w-12 object-contain" />}<div><h1 className="text-2xl font-bold text-deep-600">{course?.title || 'Partner course'}</h1><p className="text-sm text-gray-500">{course?.partners?.name}</p></div></div>{error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="space-y-3">{(course?.partner_course_lessons || []).sort((a, b) => a.order_index - b.order_index).map((lesson) => { const done = progress.some((item) => item.lesson_id === lesson.id && item.is_completed); return <Card key={lesson.id}><CardHeader><CardTitle className="text-sm">{lesson.title}</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-gray-600">{lesson.description}</p>{lesson.video_url && <a className="flex items-center gap-2 text-sm text-brand-700 hover:underline" href={lesson.video_url} target="_blank" rel="noreferrer"><PlayCircle size={16} />Open lesson video</a>}{lesson.content_url && <a className="text-sm text-brand-700 hover:underline" href={lesson.content_url} target="_blank" rel="noreferrer">Open lesson resource</a>}<Button variant={done ? 'secondary' : 'outline'} onClick={() => complete(lesson.id)} disabled={done}>{done ? <><CheckCircle size={14} className="mr-2" />Completed</> : 'Mark lesson complete'}</Button></CardContent></Card> })}</div></div>
}

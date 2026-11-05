import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Award, BookOpen, CheckCircle, Clock, Users } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { supabase } from '../lib/supabase'
import { getCurrentProfile } from '../lib/profile'
import WelcomeGuide from '../components/WelcomeGuide'

const initialData = {
  profile: null,
  cohort: null,
  modules: [],
  lessons: [],
  progress: [],
  submissions: [],
  attendance: [],
  squad: null,
  members: [],
}

export default function StudentDashboard({ user }) {
  const navigate = useNavigate()
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const profile = await getCurrentProfile()
        if (!profile) throw new Error('Your academy profile could not be found')
        const { data: enrolment, error: enrolmentError } = await supabase
          .from('enrolments')
          .select('cohort_id, track, squad_id')
          .eq('user_id', profile.id)
          .in('status', ['enrolled', 'active'])
          .maybeSingle()
        if (enrolmentError) throw enrolmentError
        if (!enrolment) {
          if (!cancelled) setData({ ...initialData, profile })
          return
        }

        const [
          { data: cohort, error: cohortError },
          { data: modules, error: modulesError },
          { data: squad, error: squadError },
          { data: attendance, error: attendanceError },
          { data: submissions, error: submissionsError },
        ] = await Promise.all([
          supabase.from('cohorts').select('id, name, start_date, end_date').eq('id', enrolment.cohort_id).single(),
          supabase.from('modules').select('*').eq('cohort_id', enrolment.cohort_id).eq('is_published', true).order('week_start'),
          enrolment.squad_id ? supabase.from('squads').select('*').eq('id', enrolment.squad_id).single() : Promise.resolve({ data: null, error: null }),
          supabase.from('live_class_attendance').select('status, live_class_id').eq('user_id', profile.id),
          supabase.from('submissions').select('score, status, submitted_at, lab_id, assessment_id').eq('user_id', profile.id).order('submitted_at', { ascending: false }),
        ])
        if (cohortError) throw cohortError
        if (modulesError) throw modulesError
        if (squadError) throw squadError
        if (attendanceError) throw attendanceError
        if (submissionsError) throw submissionsError

        const moduleIds = (modules || []).map((module) => module.id)
        const { data: lessons, error: lessonsError } = moduleIds.length
          ? await supabase.from('lessons').select('*').in('module_id', moduleIds).order('order_index')
          : { data: [], error: null }
        if (lessonsError) throw lessonsError
        const lessonIds = (lessons || []).map((lesson) => lesson.id)
        const { data: progress, error: progressError } = lessonIds.length
          ? await supabase.from('lesson_progress').select('*').eq('user_id', profile.id).in('lesson_id', lessonIds)
          : { data: [], error: null }
        if (progressError) throw progressError

        let members = []
        if (enrolment.squad_id) {
          const { data: memberEnrolments, error: membersError } = await supabase
            .from('enrolments')
            .select('user_id, track')
            .eq('squad_id', enrolment.squad_id)
          if (membersError) throw membersError
          const memberIds = (memberEnrolments || []).map((member) => member.user_id)
          if (memberIds.length) {
            const { data: profiles, error: profilesError } = await supabase.from('users').select('id, name, type').in('id', memberIds)
            if (profilesError) throw profilesError
            const tracks = new Map((memberEnrolments || []).map((member) => [member.user_id, member.track]))
            members = (profiles || []).map((profile) => ({ ...profile, track: tracks.get(profile.id) }))
          }
        }

        if (!cancelled) setData({ profile, cohort, modules: modules || [], lessons: lessons || [], progress: progress || [], submissions: submissions || [], attendance: attendance || [], squad, members })
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Unable to load your learning dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">Loading your learning dashboard...</div>
  if (error) return <div className="min-h-screen bg-gray-50 p-6"><p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p></div>

  const completedLessons = data.progress.filter((item) => item.is_completed).length
  const completion = data.lessons.length ? Math.round((completedLessons / data.lessons.length) * 100) : 0
  const attended = data.attendance.filter((item) => item.status === 'attended').length
  const attendance = data.attendance.length ? Math.round((attended / data.attendance.length) * 100) : null
  const graded = data.submissions.filter((item) => Number.isFinite(item.score))
  const grade = graded.length ? Math.round(graded.reduce((total, item) => total + item.score, 0) / graded.length) : null
  const currentModule = data.modules.find((module) => {
    const moduleLessons = data.lessons.filter((lesson) => lesson.module_id === module.id)
    return moduleLessons.some((lesson) => !data.progress.find((item) => item.lesson_id === lesson.id)?.is_completed)
  }) || data.modules[0]
  const currentLessons = currentModule ? data.lessons.filter((lesson) => lesson.module_id === currentModule.id) : []
  const currentCompleted = currentLessons.filter((lesson) => data.progress.find((item) => item.lesson_id === lesson.id)?.is_completed).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-bold text-deep-600">My Learning Dashboard</h1>
        <p className="text-sm text-gray-500">{data.profile?.name || user?.email} · {data.profile?.track || 'Academy'} Track · {data.cohort?.name || 'No cohort assigned'}</p>
      </div>
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          ['Course Completion', `${completion}%`, BookOpen, 'bg-brand-100 text-brand-600'],
          ['Attendance', attendance === null ? 'No data' : `${attendance}%`, Clock, 'bg-emerald-100 text-emerald-600'],
          ['Current Grade', grade === null ? 'Not graded' : `${grade}%`, Award, 'bg-slate-100 text-slate-600'],
          ['Lessons Complete', `${completedLessons}/${data.lessons.length}`, Activity, 'bg-amber-100 text-amber-600'],
        ].map(([label, value, Icon, color]) => <Card key={label}><CardContent className="flex items-center justify-between p-4"><div><p className="text-2xl font-bold text-deep-600">{value}</p><p className="text-xs uppercase tracking-wider text-gray-500">{label}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}><Icon size={16} /></div></CardContent></Card>)}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><BookOpen size={14} /> Current Learning</CardTitle></CardHeader>
          <CardContent>
            {!currentModule ? <p className="text-sm text-gray-500">No published modules are available for your cohort.</p> : <div className="space-y-4">
              <div className="flex items-center justify-between"><div><p className="font-medium text-deep-600">{currentModule.title}</p><p className="text-xs text-gray-500">{currentModule.stage} · Weeks {currentModule.week_start}-{currentModule.week_end}</p></div><Badge variant="secondary">{currentCompleted}/{currentLessons.length} complete</Badge></div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${currentLessons.length ? (currentCompleted / currentLessons.length) * 100 : 0}%` }} /></div>
              <Button size="sm" onClick={() => navigate('/my-learning')}>Continue learning</Button>
            </div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Users size={14} /> My Squad</CardTitle></CardHeader>
          <CardContent>{data.squad ? <div className="space-y-3"><p className="font-medium text-deep-600">{data.squad.name}</p>{data.members.map((member) => <div key={member.id} className="flex items-center justify-between text-xs"><span>{member.name}</span><Badge variant="outline">{member.track || 'Student'}</Badge></div>)}</div> : <p className="text-sm text-gray-500">You have not been assigned to a squad yet.</p>}</CardContent>
        </Card>
      </div>
      <Card className="mt-6"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><CheckCircle size={14} /> Recent activity</CardTitle></CardHeader><CardContent>{data.progress.length === 0 && data.submissions.length === 0 ? <p className="text-sm text-gray-500">Your learning activity will appear here as you complete lessons and submit work.</p> : <div className="space-y-2">{data.progress.filter((item) => item.is_completed).slice(0, 5).map((item) => <div key={`lesson-${item.lesson_id}`} className="flex justify-between text-xs"><span>Lesson completed</span><span className="text-gray-500">{new Date(item.completed_at || item.updated_at).toLocaleDateString()}</span></div>)}{data.submissions.slice(0, 5).map((item) => <div key={`submission-${item.lab_id || item.assessment_id}-${item.submitted_at}`} className="flex justify-between text-xs"><span>Submission {item.status}</span><span className="text-gray-500">{new Date(item.submitted_at).toLocaleDateString()}</span></div>)}</div>}</CardContent></Card>
      <WelcomeGuide role="Student" />
    </div>
  )
}

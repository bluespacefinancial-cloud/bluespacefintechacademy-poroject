import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, BookOpen, CheckCircle, Clock, Search, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { api } from '../lib/backend'

const INACTIVE_DAYS = 7

const daysSince = (date) => {
  if (!date) return null
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
}

const formatActivity = (date) => {
  const days = daysSince(date)
  if (days === null) return 'No activity'
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

export default function StudentMonitoring() {
  const [students, setStudents] = useState([])
  const [cohorts, setCohorts] = useState([])
  const [filterCohort, setFilterCohort] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [
          { data: users, error: usersError },
          { data: enrolments, error: enrolmentsError },
          { data: cohortRows, error: cohortsError },
          { data: squads, error: squadsError },
          { data: modules, error: modulesError },
          { data: lessons, error: lessonsError },
          { data: progress, error: progressError },
          { data: submissions, error: submissionsError },
          { data: attendance, error: attendanceError },
        ] = await Promise.all([
          api.from('users').select('id, name, email, type, is_active, last_login_at').eq('type', 'Student').order('name'),
          api.from('enrolments').select('id, user_id, cohort_id, track, squad_id, status'),
          api.from('cohorts').select('id, name, status').order('start_date'),
          api.from('squads').select('id, name'),
          api.from('modules').select('id, cohort_id, is_published'),
          api.from('lessons').select('id, module_id'),
          api.from('lesson_progress').select('user_id, lesson_id, completion_percentage, is_completed, updated_at, completed_at'),
          api.from('submissions').select('user_id, status, score, submitted_at, updated_at'),
          api.from('live_class_attendance').select('user_id, status, joined_at, left_at'),
        ])

        for (const queryError of [usersError, enrolmentsError, cohortsError, squadsError, modulesError, lessonsError, progressError, submissionsError, attendanceError]) {
          if (queryError) throw queryError
        }

        const cohortMap = new Map((cohortRows || []).map((cohort) => [cohort.id, cohort]))
        const squadMap = new Map((squads || []).map((squad) => [squad.id, squad.name]))
        const lessonIdsByCohort = new Map()
        ;(lessons || []).forEach((lesson) => {
          const module = (modules || []).find((item) => item.id === lesson.module_id)
          if (module?.is_published) {
            lessonIdsByCohort.set(module.cohort_id, [...(lessonIdsByCohort.get(module.cohort_id) || []), lesson.id])
          }
        })

        const rows = (users || []).map((student) => {
          const enrolment = (enrolments || []).find((item) => item.user_id === student.id)
          const cohort = enrolment ? cohortMap.get(enrolment.cohort_id) : null
          const studentProgress = (progress || []).filter((item) => item.user_id === student.id)
          const publishedLessonIds = new Set(lessonIdsByCohort.get(enrolment?.cohort_id) || [])
          const relevantProgress = studentProgress.filter((item) => publishedLessonIds.has(item.lesson_id))
          const studentSubmissions = (submissions || []).filter((item) => item.user_id === student.id)
          const studentAttendance = (attendance || []).filter((item) => item.user_id === student.id)
          const activityDates = [
            student.last_login_at,
            ...studentProgress.map((item) => item.updated_at || item.completed_at),
            ...studentSubmissions.map((item) => item.updated_at || item.submitted_at),
            ...studentAttendance.map((item) => item.joined_at || item.left_at),
          ].filter(Boolean).sort((a, b) => new Date(b) - new Date(a))
          const graded = studentSubmissions.filter((item) => Number.isFinite(item.score))
          const attended = studentAttendance.filter((item) => item.status === 'attended').length
          const completion = publishedLessonIds.size
            ? Math.round((relevantProgress.filter((item) => item.is_completed).length / publishedLessonIds.size) * 100)
            : 0
          const activityDate = activityDates[0] || null
          const inactive = !activityDate || daysSince(activityDate) >= INACTIVE_DAYS
          const atRisk = inactive || (enrolment?.status === 'suspended') || (studentSubmissions.some((item) => item.status === 'remediation'))

          return {
            ...student,
            cohortId: enrolment?.cohort_id || null,
            cohortName: cohort?.name || 'Not enrolled',
            track: enrolment?.track || 'Unassigned',
            squadName: squadMap.get(enrolment?.squad_id) || 'Unassigned',
            enrolmentStatus: enrolment?.status || 'Not enrolled',
            completion,
            attendance: studentAttendance.length ? Math.round((attended / studentAttendance.length) * 100) : null,
            averageGrade: graded.length ? Math.round(graded.reduce((sum, item) => sum + item.score, 0) / graded.length) : null,
            submissions: studentSubmissions.length,
            pendingSubmissions: studentSubmissions.filter((item) => ['submitted', 'remediation'].includes(item.status)).length,
            activityDate,
            inactive,
            atRisk,
          }
        })

        if (!cancelled) {
          setCohorts(cohortRows || [])
          setStudents(rows)
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Unable to load student monitoring data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const filteredStudents = useMemo(() => students.filter((student) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [student.name, student.email, student.track, student.cohortName, student.squadName].some((value) => value?.toLowerCase().includes(query))
    const matchesCohort = filterCohort === 'all' || String(student.cohortId) === filterCohort
    const matchesStatus = filterStatus === 'all'
      || (filterStatus === 'at_risk' && student.atRisk)
      || (filterStatus === 'active' && !student.inactive)
      || (filterStatus === 'inactive' && student.inactive)
    return matchesSearch && matchesCohort && matchesStatus
  }), [students, search, filterCohort, filterStatus])

  const metrics = {
    total: students.length,
    active: students.filter((student) => !student.inactive).length,
    atRisk: students.filter((student) => student.atRisk).length,
    averageCompletion: students.length ? Math.round(students.reduce((sum, student) => sum + student.completion, 0) / students.length) : 0,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-deep-600">Student Monitoring</h1>
        <p className="text-sm text-gray-500">Track learning activity, progress, attendance and intervention needs across the academy.</p>
      </div>
      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          ['Students', metrics.total, Users, 'text-brand-600 bg-brand-100'],
          ['Active this week', metrics.active, Activity, 'text-emerald-600 bg-emerald-100'],
          ['At risk', metrics.atRisk, AlertTriangle, 'text-amber-600 bg-amber-100'],
          ['Average completion', `${metrics.averageCompletion}%`, CheckCircle, 'text-brand-600 bg-brand-100'],
        ].map(([label, value, Icon, color]) => <Card key={label}><CardContent className="flex items-center justify-between p-4"><div><p className="text-2xl font-bold text-deep-600">{value}</p><p className="text-xs uppercase tracking-wider text-gray-500">{label}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}><Icon size={16} /></div></CardContent></Card>)}
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><BookOpen size={14} /> Learning activity</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_160px]">
            <div className="relative"><Search size={15} className="absolute left-3 top-2.5 text-gray-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search students, cohorts, tracks or squads" className="pl-9" /></div>
            <Select value={filterCohort} onValueChange={setFilterCohort}><SelectTrigger><SelectValue placeholder="All cohorts" /></SelectTrigger><SelectContent><SelectItem value="all">All Cohorts</SelectItem>{cohorts.map((cohort) => <SelectItem key={cohort.id} value={String(cohort.id)}>{cohort.name}</SelectItem>)}</SelectContent></Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger><SelectValue placeholder="All activity" /></SelectTrigger><SelectContent><SelectItem value="all">All Activity</SelectItem><SelectItem value="active">Active this week</SelectItem><SelectItem value="inactive">Inactive 7+ days</SelectItem><SelectItem value="at_risk">At risk</SelectItem></SelectContent></Select>
          </div>
          {loading && <p className="py-12 text-center text-sm text-gray-500">Loading student activity...</p>}
          {!loading && filteredStudents.length === 0 && <p className="py-12 text-center text-sm text-gray-500">No students match the current filters.</p>}
          {!loading && filteredStudents.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-xs"><thead><tr className="border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-500"><th className="px-3 py-3">Student</th><th className="px-3 py-3">Cohort / Track</th><th className="px-3 py-3">Squad</th><th className="px-3 py-3">Completion</th><th className="px-3 py-3">Attendance</th><th className="px-3 py-3">Grade</th><th className="px-3 py-3">Submissions</th><th className="px-3 py-3">Last activity</th><th className="px-3 py-3">Status</th></tr></thead><tbody>{filteredStudents.map((student) => <tr key={student.id} className="border-b border-gray-50 last:border-0"><td className="px-3 py-3"><p className="font-medium text-deep-600">{student.name || 'Unnamed student'}</p><p className="text-[10px] text-gray-400">{student.email}</p></td><td className="px-3 py-3"><p>{student.cohortName}</p><p className="text-[10px] text-gray-400">{student.track}</p></td><td className="px-3 py-3">{student.squadName}</td><td className="px-3 py-3"><div className="flex items-center gap-2"><div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${student.completion}%` }} /></div><span>{student.completion}%</span></div></td><td className="px-3 py-3">{student.attendance === null ? 'N/A' : `${student.attendance}%`}</td><td className="px-3 py-3">{student.averageGrade === null ? 'N/A' : `${student.averageGrade}%`}</td><td className="px-3 py-3">{student.submissions}{student.pendingSubmissions > 0 && <span className="ml-1 text-amber-600">({student.pendingSubmissions} pending)</span>}</td><td className="px-3 py-3"><span className={student.inactive ? 'font-medium text-amber-700' : 'text-gray-600'}>{formatActivity(student.activityDate)}</span></td><td className="px-3 py-3"><Badge className={student.atRisk ? 'text-amber-700 border-amber-200' : 'text-emerald-700 border-emerald-200'}>{student.atRisk ? 'Needs attention' : 'On track'}</Badge></td></tr>)}</tbody></table></div>}
        </CardContent>
      </Card>
      <p className="mt-4 flex items-center gap-2 text-[11px] text-gray-500"><Clock size={13} /> At-risk status includes no recorded activity for {INACTIVE_DAYS}+ days, suspended enrolments or remediation submissions.</p>
    </div>
  )
}

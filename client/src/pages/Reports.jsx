import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Users, Clock, Award, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Button } from '../components/ui/button'
import { api } from '../lib/backend'
import { exportToCSV } from '../lib/csv'
import { Breadcrumb } from '../components/ui/breadcrumb'

export default function Reports() {
  const [rows, setRows] = useState([])
  const [cohorts, setCohorts] = useState([])
  const [cohortId, setCohortId] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [{ data: users, error: usersError }, { data: enrolments, error: enrolmentsError }, { data: cohortRows, error: cohortsError }, { data: progress, error: progressError }, { data: submissions, error: submissionsError }, { data: attendance, error: attendanceError }] = await Promise.all([
          api.from('users').select('id, name, type').eq('type', 'Student'),
          api.from('enrolments').select('user_id, cohort_id, track'),
          api.from('cohorts').select('id, name').order('start_date'),
          api.from('lesson_progress').select('user_id, is_completed, completion_percentage, updated_at'),
          api.from('submissions').select('user_id, score, status'),
          api.from('live_class_attendance').select('user_id, status'),
        ])
        if (cancelled) return
        for (const queryError of [usersError, enrolmentsError, cohortsError, progressError, submissionsError, attendanceError]) if (queryError) throw queryError
        const cohortMap = new Map((cohortRows || []).map((cohort) => [cohort.id, cohort.name]))
        setCohorts(cohortRows || [])
        setRows((users || []).map((user) => {
          const enrolment = (enrolments || []).find((item) => item.user_id === user.id)
          const userProgress = (progress || []).filter((item) => item.user_id === user.id)
          const userSubmissions = (submissions || []).filter((item) => item.user_id === user.id)
          const userAttendance = (attendance || []).filter((item) => item.user_id === user.id)
          return {
            ...user,
            cohortId: enrolment?.cohort_id,
            cohortName: cohortMap.get(enrolment?.cohort_id) || 'Not enrolled',
            track: enrolment?.track || 'Unassigned',
            completion: userProgress.length ? Math.round(userProgress.reduce((sum, item) => sum + Number(item.completion_percentage || 0), 0) / userProgress.length) : 0,
            attendance: userAttendance.length ? Math.round((userAttendance.filter((item) => item.status === 'attended').length / userAttendance.length) * 100) : null,
            passRate: userSubmissions.length ? Math.round((userSubmissions.filter((item) => ['passed', 'graded'].includes(item.status) && Number(item.score) >= 70).length / userSubmissions.length) * 100) : null,
          }
        }))
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Unable to load reports')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => rows.filter((row) => cohortId === 'all' || String(row.cohortId) === cohortId), [rows, cohortId])
  const average = (field) => {
    const values = filtered.map((row) => row[field]).filter((value) => value !== null && value !== undefined)
    return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null
  }
  const tracks = [...new Set(filtered.map((row) => row.track))]

  const handleExportCSV = () => {
    const csvRows = filtered.map((row) => ({
      'Student ID': row.student_id || row.id,
      Name: row.name || '',
      Email: row.email || '',
      Track: row.track,
      Cohort: row.cohortName,
      'Completion %': row.completion,
      'Attendance %': row.attendance === null ? 'N/A' : row.attendance,
      'Pass Rate %': row.passRate === null ? 'N/A' : row.passRate,
    }))
    exportToCSV(csvRows, 'bluespace-student-reports')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb items={[{ label: 'Analytics & Reports' }]} />
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-deep-600">Analytics & Reporting</h1>
          <p className="text-sm text-gray-500">Live academy performance derived from student activity.</p>
        </div>
        <Button
          type="button"
          onClick={handleExportCSV}
          disabled={loading || filtered.length === 0}
          size="sm"
          className="bg-deep-600 text-white hover:bg-deep-700 text-xs font-semibold flex items-center gap-1.5"
        >
          <Download size={13} className="mr-1.5" />
          Export CSV
        </Button>
      </div>
      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mb-6">
        <Select value={cohortId} onValueChange={setCohortId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="All cohorts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cohorts</SelectItem>
            {cohorts.map((cohort) => (
              <SelectItem key={cohort.id} value={String(cohort.id)}>
                {cohort.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        {[['Students', filtered.length, Users], ['Completion', average('completion') === null ? 'N/A' : `${average('completion')}%`, BarChart3], ['Attendance', average('attendance') === null ? 'N/A' : `${average('attendance')}%`, Clock], ['Pass rate', average('passRate') === null ? 'N/A' : `${average('passRate')}%`, Award]].map(([label, value, Icon]) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs uppercase text-gray-500">{label}</p>
              </div>
              <Icon size={18} className="text-brand-600" />
            </CardContent>
          </Card>
        ))}
      </div>
      {loading && <p className="py-10 text-center text-sm text-gray-500">Loading reports...</p>}
      {!loading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Student performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2">
              {tracks.map((track) => (
                <Badge key={track} variant="outline">
                  {track}: {filtered.filter((row) => row.track === track).length}
                </Badge>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead>
                  <tr className="border-b text-[10px] uppercase text-gray-500">
                    <th className="px-3 py-3">Student</th>
                    <th className="px-3 py-3">Cohort</th>
                    <th className="px-3 py-3">Track</th>
                    <th className="px-3 py-3">Completion</th>
                    <th className="px-3 py-3">Attendance</th>
                    <th className="px-3 py-3">Pass rate</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} className="border-b border-gray-50">
                      <td className="px-3 py-3">{row.name || row.email}</td>
                      <td className="px-3 py-3">{row.cohortName}</td>
                      <td className="px-3 py-3">{row.track}</td>
                      <td className="px-3 py-3">{row.completion}%</td>
                      <td className="px-3 py-3">{row.attendance === null ? 'N/A' : `${row.attendance}%`}</td>
                      <td className="px-3 py-3">{row.passRate === null ? 'N/A' : `${row.passRate}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

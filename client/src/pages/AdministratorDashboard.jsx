import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { Users, GraduationCap, ClipboardList, Briefcase, ArrowRight, Shield } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { api } from '../lib/backend'
import WelcomeGuide from '../components/WelcomeGuide'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import MetricCard from '../components/dashboard/MetricCard'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart as RechartsBarChart, Bar,
  PieChart as RechartsPieChart, Pie, Cell,
} from 'recharts'

const COLORS = ['#0000FF', '#C5A059', '#16233B', '#2B3A5F', '#B98A3F', '#9CA3AF']

const emptyData = { activeCohorts: 0, activeFellows: 0, pendingApplications: 0, partnerReviews: 0, cohorts: [], applications: [], courses: [], completionTrend: [], cohortEnrollment: [], lessonTypes: [] }

export default function AdministratorDashboard({ user }) {
  const [data, setData] = useState(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tourOpen, setTourOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const [cohortCount, fellowCount, applicationCount, courseCount, cohorts, applications, courses, progressRows, enrolmentRows, lessonRows] = await Promise.all([
          api.from('cohorts').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          api.from('enrolments').select('id', { count: 'exact', head: true }).in('status', ['enrolled', 'active']),
          api.from('academy_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          api.from('partner_courses').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'under_review']),
          api.from('cohorts').select('id, name, status, start_date, capacity').in('status', ['active', 'planned']).order('start_date').limit(5),
          api.from('academy_applications').select('id, name, email, requested_role, track, created_at').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
          api.from('partner_courses').select('id, title, status, submitted_at').in('status', ['submitted', 'under_review']).order('submitted_at', { ascending: true }).limit(5),
          api.from('lesson_progress').select('user_id, lesson_id, is_completed, updated_at').gte('updated_at', thirtyDaysAgo).order('updated_at', { ascending: false }).limit(1000),
          api.from('enrolments').select('cohort_id, status').in('status', ['enrolled', 'active']),
          api.from('lessons').select('type'),
        ])
        const failure = [cohortCount, fellowCount, applicationCount, courseCount, cohorts, applications, courses, progressRows, enrolmentRows, lessonRows].find((item) => item.error)
        if (failure?.error) throw failure.error

        // Completion trend: group completed lessons by date over last 30 days
        const progressData = progressRows.data || []
        const byDate = new Map()
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        for (let i = 29; i >= 0; i--) {
          const d = new Date(today)
          d.setDate(today.getDate() - i)
          const key = d.toISOString().slice(0, 10)
          byDate.set(key, { date: key, completions: 0, total: 0 })
        }
        for (const row of progressData) {
          const key = row.updated_at ? row.updated_at.slice(0, 10) : null
          if (!key || !byDate.has(key)) continue
          const entry = byDate.get(key)
          entry.total += 1
          if (row.is_completed) entry.completions += 1
        }
        const completionTrend = Array.from(byDate.values()).map((entry) => ({
          date: entry.date,
          rate: entry.total === 0 ? 0 : Math.round((entry.completions / entry.total) * 100),
        }))

        // Cohort enrollment: count active fellows per cohort
        const enrolmentData = enrolmentRows.data || []
        const cohortMap = new Map((cohorts.data || []).map((c) => [c.id, c.name]))
        const cohortCounts = new Map()
        for (const row of enrolmentData) {
          const cid = row.cohort_id
          cohortCounts.set(cid, (cohortCounts.get(cid) || 0) + 1)
        }
        const cohortEnrollment = Array.from(cohortCounts.entries()).map(([cid, count]) => ({
          cohort: cohortMap.get(cid) || 'Unknown',
          fellows: count,
        })).sort((a, b) => b.fellows - a.fellows)

        // Lesson type distribution
        const lessonData = lessonRows.data || []
        const typeCounts = new Map()
        for (const row of lessonData) {
          typeCounts.set(row.type, (typeCounts.get(row.type) || 0) + 1)
        }
        const lessonTypes = Array.from(typeCounts.entries()).map(([type, count]) => ({
          name: type.replace('_', ' '),
          value: count,
        }))

        if (!cancelled) setData({
          activeCohorts: cohortCount.count || 0,
          activeFellows: fellowCount.count || 0,
          pendingApplications: applicationCount.count || 0,
          partnerReviews: courseCount.count || 0,
          cohorts: cohorts.data || [],
          applications: applications.data || [],
          courses: courses.data || [],
          completionTrend,
          cohortEnrollment,
          lessonTypes,
        })
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Unable to load academy operations')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-medium text-gray-500">Loading academy operations...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-800 dark:text-red-300">
        <p className="font-semibold">Unable to load academy operations</p>
        <p className="mt-1 text-xs">{error}</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <DashboardHeader
        dataTour="admin-header"
        title="Academy operations"
        subtitle={`Welcome, ${user?.name || 'Administrator'}. Review admissions, track cohorts, and oversee partner curriculum.`}
        onStartTour={() => setTourOpen(true)}
        actions={
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="outline" className="border-border">
              <Link to="/applications">
                <ClipboardList size={14} className="mr-1.5" />
                Review applications
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-border">
              <Link to="/audit-log">
                <Shield size={14} className="mr-1.5" />
                Audit log
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-deep-600 text-white hover:bg-deep-700">
              <Link to="/cohorts">Manage cohorts</Link>
            </Button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div data-tour="admin-metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Active cohorts"
          value={data.activeCohorts}
          icon={GraduationCap}
          helper="Running academy cohorts"
          to="/cohorts"
        />
        <MetricCard
          label="Current fellows"
          value={data.activeFellows}
          icon={Users}
          helper="Enrolled active students"
          to="/enrolments"
        />
        <MetricCard
          label="Applications to review"
          value={data.pendingApplications}
          icon={ClipboardList}
          helper="Pending candidate queue"
          to="/applications"
        />
        <MetricCard
          label="Partner course reviews"
          value={data.partnerReviews}
          icon={Briefcase}
          helper="Curricula awaiting approval"
          to="/partner-course-review"
        />
      </div>

      {/* Grid: Applications + Partner Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-tour="admin-applications" className="border border-border shadow-sm rounded-xl bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
            <div>
              <h3 className="text-base font-bold text-foreground leading-tight">Pending applications</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Candidate applications awaiting admissions decision</p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs border-border">
              <Link to="/applications">
                Open queue
                <ArrowRight size={13} className="ml-1.5" />
              </Link>
            </Button>
          </div>
          <CardContent className="p-5">
            {data.applications.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground mx-auto mb-2.5">
                  <ClipboardList size={18} />
                </div>
                <p className="text-sm font-semibold text-foreground">No applications waiting</p>
                <p className="mt-1 text-xs text-muted-foreground">All student and partner applications have been reviewed.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.applications.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border p-3 hover:border-deep-600/30 dark:hover:border-bluespace-400 transition-colors bg-card">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">
                        {item.email}{item.track ? ` • ${item.track}` : ''}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[11px] font-medium shrink-0 capitalize border-border">
                      {item.requested_role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-tour="admin-partner-reviews" className="border border-border shadow-sm rounded-xl bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
            <div>
              <h3 className="text-base font-bold text-foreground leading-tight">Partner course reviews</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Partner courses submitted for curriculum audit</p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs border-border">
              <Link to="/partner-course-review">
                Review courses
                <ArrowRight size={13} className="ml-1.5" />
              </Link>
            </Button>
          </div>
          <CardContent className="p-5">
            {data.courses.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground mx-auto mb-2.5">
                  <Briefcase size={18} />
                </div>
                <p className="text-sm font-semibold text-foreground">No partner courses to review</p>
                <p className="mt-1 text-xs text-muted-foreground">No pending partner submissions at this time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.courses.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border p-3 hover:border-deep-600/30 dark:hover:border-bluespace-400 transition-colors bg-card">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.submitted_at ? `Submitted ${new Date(item.submitted_at).toLocaleDateString()}` : 'Date unavailable'}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[11px] font-medium shrink-0 capitalize border-border">
                      {item.status ? item.status.replace('_', ' ') : 'under review'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cohorts Card */}
      <Card data-tour="admin-cohorts" className="border border-border shadow-sm rounded-xl bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div>
            <h3 className="text-base font-bold text-foreground leading-tight">Upcoming and active cohorts</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Cohort scheduling, enrollment statuses, and capacities</p>
          </div>
          <Button asChild variant="outline" size="sm" className="text-xs border-border">
            <Link to="/cohorts">
              Manage cohorts
              <ArrowRight size={13} className="ml-1.5" />
            </Link>
          </Button>
        </div>
        <CardContent className="p-5">
          {data.cohorts.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground mx-auto mb-2.5">
                <GraduationCap size={18} />
              </div>
              <p className="text-sm font-semibold text-foreground">No active or planned cohorts</p>
              <p className="mt-1 text-xs text-muted-foreground">Create a cohort to begin enrolling students.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.cohorts.map((cohort) => (
                <div key={cohort.id} className="flex items-center justify-between rounded-lg border border-border p-3.5 hover:border-deep-600/30 dark:hover:border-bluespace-400 transition-colors bg-card">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{cohort.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Starts {new Date(`${cohort.start_date}T00:00:00`).toLocaleDateString()} • Capacity {cohort.capacity}
                    </p>
                  </div>
                  <Badge variant={cohort.status === 'active' ? 'secondary' : 'outline'} className="text-[11px] font-medium capitalize shrink-0 ml-2 border-border">
                    {cohort.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics */}
      <Card data-tour="admin-analytics" className="border border-border shadow-sm rounded-xl bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div>
            <h3 className="text-base font-bold text-foreground leading-tight">Academy analytics</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Completion trends, cohort enrollment, and lesson mix over the last 30 days</p>
          </div>
        </div>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.completionTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'currentColor' }} interval={5} />
                  <YAxis domain={[0, 100]} label={{ value: 'Completion rate (%)', position: 'insideLeft', angle: -90, fill: 'currentColor' }} tickFormatter={(v) => `${v}%`} tick={{ fill: 'currentColor' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                  <Line type="monotone" dataKey="rate" stroke="#0000FF" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-[300px]">
              <RechartsBarChart data={data.cohortEnrollment.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="cohort" tick={{ fontSize: 10, fill: 'currentColor' }} />
                <YAxis label={{ value: 'Fellows', position: 'insideLeft', angle: -90, fill: 'currentColor' }} tick={{ fill: 'currentColor' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                <Bar dataKey="fellows" fill="#C5A059" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </div>
            <div className="h-[300px] flex items-center justify-center">
              <RechartsPieChart width={300} height={300}>
                <Pie
                  data={data.lessonTypes}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={60}
                  fill="#888"
                  label
                >
                  {data.lessonTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
              </RechartsPieChart>
            </div>
          </div>
          {data.completionTrend.length === 0 && data.cohortEnrollment.length === 0 && data.lessonTypes.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No activity data available yet.
            </div>
          )}
        </CardContent>
      </Card>

      <WelcomeGuide
        role="Administrator"
        forceOpen={tourOpen}
        onClose={() => setTourOpen(false)}
      />
    </div>
  )
}

AdministratorDashboard.propTypes = {
  user: PropTypes.object,
}

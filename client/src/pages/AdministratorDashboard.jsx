import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { Users, GraduationCap, ClipboardList, Briefcase, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { supabase } from '../lib/supabase'
import WelcomeGuide from '../components/WelcomeGuide'

const emptyData = { activeCohorts: 0, activeFellows: 0, pendingApplications: 0, partnerReviews: 0, cohorts: [], applications: [], courses: [] }

function Metric({ label, value, Icon }) {
  return <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-2xl font-bold text-deep-600">{value}</p><p className="text-sm text-gray-500">{label}</p></div><Icon size={19} className="text-deep-600" /></CardContent></Card>
}
Metric.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.node.isRequired, Icon: PropTypes.elementType.isRequired }

export default function AdministratorDashboard({ user }) {
  const [data, setData] = useState(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [cohortCount, fellowCount, applicationCount, courseCount, cohorts, applications, courses] = await Promise.all([
          supabase.from('cohorts').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('enrolments').select('id', { count: 'exact', head: true }).in('status', ['enrolled', 'active']),
          supabase.from('academy_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('partner_courses').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'under_review']),
          supabase.from('cohorts').select('id, name, status, start_date, capacity').in('status', ['active', 'planned']).order('start_date').limit(5),
          supabase.from('academy_applications').select('id, name, email, requested_role, track, created_at').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
          supabase.from('partner_courses').select('id, title, status, submitted_at').in('status', ['submitted', 'under_review']).order('submitted_at', { ascending: true }).limit(5),
        ])
        const failure = [cohortCount, fellowCount, applicationCount, courseCount, cohorts, applications, courses].find((item) => item.error)
        if (failure?.error) throw failure.error
        if (!cancelled) setData({
          activeCohorts: cohortCount.count || 0,
          activeFellows: fellowCount.count || 0,
          pendingApplications: applicationCount.count || 0,
          partnerReviews: courseCount.count || 0,
          cohorts: cohorts.data || [],
          applications: applications.data || [],
          courses: courses.data || [],
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

  if (loading) return <p className="py-12 text-center text-sm text-gray-500">Loading academy operations...</p>
  if (error) return <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>

  return (
    <>
      <div className="space-y-6">
        <header><h1 className="text-2xl font-bold text-deep-600">Academy operations</h1><p className="mt-1 text-sm text-gray-500">Welcome, {user?.name || 'Administrator'}. Review admissions, cohorts, and partner content.</p></header>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Active cohorts" value={data.activeCohorts} Icon={GraduationCap} />
          <Metric label="Current fellows" value={data.activeFellows} Icon={Users} />
          <Metric label="Applications to review" value={data.pendingApplications} Icon={ClipboardList} />
          <Metric label="Partner courses to review" value={data.partnerReviews} Icon={Briefcase} />
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Pending applications</CardTitle><Button asChild variant="outline" size="sm"><Link to="/applications">Open queue <ArrowRight size={14} className="ml-2" /></Link></Button></CardHeader>
            <CardContent className="space-y-3">{data.applications.length === 0 ? <p className="text-sm text-gray-500">No applications are waiting for review.</p> : data.applications.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 border-b pb-3 last:border-0"><div><p className="text-sm font-medium text-deep-600">{item.name}</p><p className="text-xs text-gray-500">{item.email}{item.track ? ` · ${item.track}` : ''}</p></div><Badge variant="outline">{item.requested_role}</Badge></div>)}</CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Partner course reviews</CardTitle><Button asChild variant="outline" size="sm"><Link to="/partner-course-review">Review courses <ArrowRight size={14} className="ml-2" /></Link></Button></CardHeader>
            <CardContent className="space-y-3">{data.courses.length === 0 ? <p className="text-sm text-gray-500">No partner courses are waiting for review.</p> : data.courses.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 border-b pb-3 last:border-0"><div><p className="text-sm font-medium text-deep-600">{item.title}</p><p className="text-xs text-gray-500">{item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : 'Submission date unavailable'}</p></div><Badge variant="outline">{item.status.replace('_', ' ')}</Badge></div>)}</CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Upcoming cohorts</CardTitle><Button asChild variant="outline" size="sm"><Link to="/cohorts">Manage cohorts <ArrowRight size={14} className="ml-2" /></Link></Button></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">{data.cohorts.length === 0 ? <p className="text-sm text-gray-500">No active or planned cohorts have been created.</p> : data.cohorts.map((cohort) => <div key={cohort.id} className="flex items-center justify-between rounded-md border p-3"><div><p className="text-sm font-medium text-deep-600">{cohort.name}</p><p className="text-xs text-gray-500">Starts {new Date(`${cohort.start_date}T00:00:00`).toLocaleDateString()} · Capacity {cohort.capacity}</p></div><Badge variant={cohort.status === 'active' ? 'secondary' : 'outline'}>{cohort.status}</Badge></div>)}</CardContent>
        </Card>
      </div>
      <WelcomeGuide role="Administrator" />
    </>
  )
}

AdministratorDashboard.propTypes = { user: PropTypes.object }

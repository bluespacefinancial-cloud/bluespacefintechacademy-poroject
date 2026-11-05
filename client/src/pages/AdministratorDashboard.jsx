import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { Users, GraduationCap, ClipboardList, Briefcase, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { supabase } from '../lib/supabase'
import WelcomeGuide from '../components/WelcomeGuide'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import MetricCard from '../components/dashboard/MetricCard'

const emptyData = { activeCohorts: 0, activeFellows: 0, pendingApplications: 0, partnerReviews: 0, cohorts: [], applications: [], courses: [] }

export default function AdministratorDashboard({ user }) {
  const [data, setData] = useState(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tourOpen, setTourOpen] = useState(false)

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

  if (loading) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-medium text-gray-500">Loading academy operations...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p className="font-semibold">Unable to load academy operations</p>
        <p className="mt-1 text-xs">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        dataTour="admin-header"
        title="Academy operations"
        subtitle={`Welcome, ${user?.name || 'Administrator'}. Review admissions, track cohorts, and oversee partner curriculum.`}
        onStartTour={() => setTourOpen(true)}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="border-gray-200">
              <Link to="/applications">
                <ClipboardList size={14} className="mr-1.5" />
                Review applications
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
        <Card data-tour="admin-applications" className="border border-gray-200/90 shadow-sm rounded-xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <CardTitle className="text-base font-bold text-gray-900">Pending applications</CardTitle>
              <p className="mt-0.5 text-xs text-gray-500">Candidate applications awaiting admissions decision</p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs border-gray-200">
              <Link to="/applications">
                Open queue
                <ArrowRight size={13} className="ml-1.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {data.applications.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center">
                <p className="text-sm font-medium text-gray-900">No applications waiting</p>
                <p className="mt-1 text-xs text-gray-500">All student and partner applications have been reviewed.</p>
              </div>
            ) : (
              data.applications.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-gray-100 p-3 hover:border-gray-200 transition-colors bg-white">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500 truncate">
                      {item.email}{item.track ? ` • ${item.track}` : ''}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[11px] font-medium shrink-0 capitalize">
                    {item.requested_role}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card data-tour="admin-partner-reviews" className="border border-gray-200/90 shadow-sm rounded-xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <CardTitle className="text-base font-bold text-gray-900">Partner course reviews</CardTitle>
              <p className="mt-0.5 text-xs text-gray-500">Partner courses submitted for curriculum audit</p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs border-gray-200">
              <Link to="/partner-course-review">
                Review courses
                <ArrowRight size={13} className="ml-1.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {data.courses.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center">
                <p className="text-sm font-medium text-gray-900">No partner courses to review</p>
                <p className="mt-1 text-xs text-gray-500">No pending partner submissions at this time.</p>
              </div>
            ) : (
              data.courses.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-gray-100 p-3 hover:border-gray-200 transition-colors bg-white">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {item.submitted_at ? `Submitted ${new Date(item.submitted_at).toLocaleDateString()}` : 'Date unavailable'}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[11px] font-medium shrink-0 capitalize">
                    {item.status ? item.status.replace('_', ' ') : 'under review'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cohorts Card */}
      <Card data-tour="admin-cohorts" className="border border-gray-200/90 shadow-sm rounded-xl bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <CardTitle className="text-base font-bold text-gray-900">Upcoming and active cohorts</CardTitle>
            <p className="mt-0.5 text-xs text-gray-500">Cohort scheduling, enrollment statuses, and capacities</p>
          </div>
          <Button asChild variant="outline" size="sm" className="text-xs border-gray-200">
            <Link to="/cohorts">
              Manage cohorts
              <ArrowRight size={13} className="ml-1.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-5">
          {data.cohorts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center">
              <p className="text-sm font-medium text-gray-900">No active or planned cohorts</p>
              <p className="mt-1 text-xs text-gray-500">Create a cohort to begin enrolling students.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.cohorts.map((cohort) => (
                <div key={cohort.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3.5 hover:border-gray-200 transition-colors bg-white">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{cohort.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Starts {new Date(`${cohort.start_date}T00:00:00`).toLocaleDateString()} • Capacity {cohort.capacity}
                    </p>
                  </div>
                  <Badge variant={cohort.status === 'active' ? 'secondary' : 'outline'} className="text-[11px] font-medium capitalize shrink-0 ml-2">
                    {cohort.status}
                  </Badge>
                </div>
              ))}
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

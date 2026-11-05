import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { BookOpen, Clock, CheckCircle, Plus, ArrowRight, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { supabase } from '../lib/supabase'
import WelcomeGuide from '../components/WelcomeGuide'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import MetricCard from '../components/dashboard/MetricCard'

const emptyData = { partner: null, courses: [], linked: false }

export default function PartnerDashboard({ user }) {
  const [data, setData] = useState(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tourOpen, setTourOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const { data: partnerId, error: partnerIdError } = await supabase.rpc('current_partner_id')
        if (partnerIdError) throw partnerIdError
        if (!partnerId) {
          if (!cancelled) setData({ ...emptyData, linked: false })
          return
        }
        const [{ data: partner, error: partnerError }, { data: courses, error: coursesError }] = await Promise.all([
          supabase.from('partners').select('id, name, status').eq('id', partnerId).maybeSingle(),
          supabase.from('partner_courses').select('id, title, status, submitted_at, updated_at').eq('partner_id', partnerId).order('updated_at', { ascending: false }),
        ])
        if (partnerError) throw partnerError
        if (coursesError) throw coursesError
        if (!cancelled) setData({ partner, courses: courses || [], linked: Boolean(partner) })
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Unable to load partner workspace')
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
        <p className="text-sm font-medium text-gray-500">Loading partner workspace...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p className="font-semibold">Unable to load partner workspace</p>
        <p className="mt-1 text-xs">{error}</p>
      </div>
    )
  }

  if (!data.linked) {
    return (
      <div className="w-full space-y-6">
        <DashboardHeader
          title="Partner dashboard"
          subtitle={`Welcome, ${user?.name || 'Partner'}.`}
        />
        <Card className="border border-gray-200/90 shadow-sm rounded-xl bg-white w-full overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Agency connection required</h3>
              <p className="text-xs text-gray-500">Account pending organization assignment</p>
            </div>
          </div>
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Your partner account is not linked to a registered partner agency yet. An academy administrator must connect your account before you can create and publish courses.
            </p>
            <p className="text-xs text-gray-500">
              Once linked, this dashboard will show your course drafts, reviews in progress, and published fintech curricula.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const count = (statuses) => data.courses.filter((course) => statuses.includes(course.status)).length

  return (
    <div className="w-full space-y-6">
      <DashboardHeader
        dataTour="partner-header"
        title="Partner dashboard"
        subtitle={`${data.partner?.name || 'Partner Agency'} • Manage course authoring, review requests, and academy distributions.`}
        onStartTour={() => setTourOpen(true)}
        actions={
          <Button
            data-tour="partner-action"
            asChild
            size="sm"
            className="bg-deep-600 text-white hover:bg-deep-700"
          >
            <Link to="/partner-courses">
              <Plus size={14} className="mr-1.5" />
              Open course studio
            </Link>
          </Button>
        }
      />

      {/* Metric Cards Row */}
      <div data-tour="partner-metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Total courses"
          value={data.courses.length}
          icon={BookOpen}
          helper="All registered curricula"
          to="/partner-courses"
        />
        <MetricCard
          label="Drafts in progress"
          value={count(['draft', 'changes_requested'])}
          icon={Plus}
          helper="Drafts or changes requested"
          to="/partner-courses"
        />
        <MetricCard
          label="In academy review"
          value={count(['submitted', 'under_review'])}
          icon={Clock}
          helper="Awaiting administrator review"
          to="/partner-courses"
        />
        <MetricCard
          label="Published courses"
          value={count(['published'])}
          icon={CheckCircle}
          helper="Live for enrolled fellows"
          to="/partner-catalog"
        />
      </div>

      {/* Main Grid: Courses + Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course List Card */}
        <Card data-tour="partner-courses" className="lg:col-span-2 border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Your courses</h3>
              <p className="mt-0.5 text-xs text-gray-500">Authored curricula and their review status</p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs border-gray-200">
              <Link to="/partner-courses">
                Manage courses
                <ArrowRight size={13} className="ml-1.5" />
              </Link>
            </Button>
          </div>
          <CardContent className="p-5">
            {data.courses.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-2.5">
                  <BookOpen size={18} />
                </div>
                <p className="text-sm font-semibold text-gray-900">No courses authored yet</p>
                <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                  Create your first course draft in the studio and submit it for academy curriculum review.
                </p>
                <Button asChild size="sm" className="mt-4 bg-deep-600 text-white hover:bg-deep-700">
                  <Link to="/partner-courses">Create your first course</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {data.courses.slice(0, 6).map((course) => {
                  const statusLabel = course.status ? course.status.replace('_', ' ') : 'draft'
                  return (
                    <div
                      key={course.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-gray-100 p-3.5 hover:border-gray-200 transition-colors bg-white"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{course.title}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          Updated {new Date(course.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge
                          variant={course.status === 'published' ? 'secondary' : 'outline'}
                          className="text-[11px] font-medium capitalize"
                        >
                          {statusLabel}
                        </Badge>
                        <Button asChild size="sm" variant="outline" className="h-8 px-2.5 text-xs border-gray-200 text-deep-600 hover:bg-deep-50">
                          <Link to="/partner-courses">Edit</Link>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Studio Guidelines Card */}
        <Card className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900 leading-tight">Publishing checklist</h3>
            <p className="mt-0.5 text-xs text-gray-500">Academy curriculum standards</p>
          </div>
          <CardContent className="p-5 space-y-4 text-xs text-gray-600">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-deep-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Practical fintech focus</p>
                <p className="mt-0.5 text-gray-500">Ensure all modules include real-world banking, payments, or infrastructure applications.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-deep-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Hands-on lab tasks</p>
                <p className="mt-0.5 text-gray-500">Attach code repositories or clear evaluation criteria for each practical assignment.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-deep-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Review SLA</p>
                <p className="mt-0.5 text-gray-500">Academy staff review submitted courses within 5 business days.</p>
              </div>
            </div>

            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="w-full text-xs border-gray-200">
                <Link to="/partner-courses">
                  <FileText size={13} className="mr-1.5" />
                  Open Course Studio
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <WelcomeGuide
        role="Partner"
        forceOpen={tourOpen}
        onClose={() => setTourOpen(false)}
      />
    </div>
  )
}

PartnerDashboard.propTypes = {
  user: PropTypes.object,
}

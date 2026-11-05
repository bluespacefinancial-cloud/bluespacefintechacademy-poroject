import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { BookOpen, Clock, CheckCircle, Plus, ArrowRight, ShieldAlert, FileText, CheckCircle2, AlertCircle, Award } from 'lucide-react'
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
          label="Changes requested"
          value={count(['changes_requested'])}
          icon={AlertCircle}
          helper="Needs partner revision"
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
          helper="Live in academy catalog"
          to="/partner-courses"
        />
      </div>

      {/* Main Grid: Courses + Studio Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course List Card */}
        <Card data-tour="partner-courses" className="lg:col-span-2 border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-tight">Course Studio & Curricula</h3>
                <p className="mt-0.5 text-xs text-gray-500">Authored fintech programs and academy review statuses</p>
              </div>
              <Button asChild variant="outline" size="sm" className="text-xs border-gray-200">
                <Link to="/partner-courses">
                  Open studio
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
                    const isChangesRequested = course.status === 'changes_requested'
                    const isPublished = course.status === 'published'
                    const isSubmitted = course.status === 'submitted' || course.status === 'under_review'
                    const statusLabel = course.status ? course.status.replace('_', ' ') : 'draft'

                    return (
                      <div
                        key={course.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3.5 transition-colors bg-white ${
                          isChangesRequested
                            ? 'border-amber-200 bg-amber-50/20'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900 truncate">{course.title}</p>
                            {isChangesRequested && (
                              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 shrink-0">
                                Action Required
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Updated {new Date(course.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge
                            variant={isPublished ? 'secondary' : 'outline'}
                            className="text-[11px] font-medium capitalize"
                          >
                            {statusLabel}
                          </Badge>
                          <Button asChild size="sm" variant="outline" className="h-8 px-3 text-xs border-gray-200 text-deep-600 hover:bg-deep-50">
                            <Link to="/partner-courses">
                              {isChangesRequested ? 'Revise Draft' : 'Open in Studio'}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </div>

          <div className="px-5 py-3 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Need to add video lectures or resources to an existing course?
            </span>
            <Link to="/partner-courses" className="font-semibold text-deep-600 hover:text-deep-700">
              Edit Lessons in Studio →
            </Link>
          </div>
        </Card>

        {/* Studio Operations & Guidelines Card */}
        <Card className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 leading-tight">Curriculum Accreditation</h3>
              <p className="mt-0.5 text-xs text-gray-500">Standards for publishing to academy fellows</p>
            </div>
            <CardContent className="p-5 space-y-4 text-xs text-gray-600">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-deep-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Industry-Grounded Syllabus</p>
                  <p className="mt-0.5 text-gray-500">Structure modules around hands-on banking, mobile money, digital payments, or fintech security workflows.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Award size={16} className="text-deep-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Automated Certification</p>
                  <p className="mt-0.5 text-gray-500">Fellows who complete 100% of your course lessons earn verified credentials co-branded with your agency.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock size={16} className="text-deep-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Review Turnaround</p>
                  <p className="mt-0.5 text-gray-500">Submitted courses undergo technical review by academy staff within 3 to 5 business days.</p>
                </div>
              </div>
            </CardContent>
          </div>

          <div className="p-4 bg-gray-50/60 border-t border-gray-100">
            <Button asChild size="sm" className="w-full text-xs bg-deep-600 text-white hover:bg-deep-700 font-semibold">
              <Link to="/partner-courses">
                <Plus size={13} className="mr-1.5" />
                Author New Course Draft
              </Link>
            </Button>
          </div>
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

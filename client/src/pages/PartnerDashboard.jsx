import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  BookOpen,
  ClipboardList,
  Users,
  ArrowRight,
  Plus,
  Briefcase,
  FileText,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { getCurrentProfile } from '../lib/profile'
import { api } from '../lib/backend'
import WelcomeGuide from '../components/WelcomeGuide'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import MetricCard from '../components/dashboard/MetricCard'
import { EmptyState } from '../components/ui/empty-state'

const emptyData = {
  profile: null,
  courses: [],
  drafts: 0,
  submitted: 0,
  published: 0,
  totalEnrolments: 0,
}

export default function PartnerDashboard({ user }) {
  const [data, setData] = useState(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tourOpen, setTourOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const profile = await getCurrentProfile()
        if (!profile) throw new Error('Your partner profile could not be found')
        if (!profile.partner_id) throw new Error('Your account is not linked to a partner organisation')

        const courseResult = await api
          .from('partner_courses')
          .select('id, title, status, submitted_at, created_at')
          .eq('partner_id', profile.partner_id)
          .order('created_at', { ascending: false })
        if (courseResult.error) throw courseResult.error

        const courses = courseResult.data || []
        const courseIds = courses.map((course) => course.id)

        // Keep the learner count scoped to this partner's courses. RLS is
        // scoped as well, but the explicit filter makes the intent local.
        let totalEnrolments = 0
        if (courseIds.length) {
          const enrolmentResult = await api
            .from('partner_course_enrolments')
            .select('id', { count: 'exact', head: true })
            .in('course_id', courseIds)
          if (enrolmentResult.error) throw enrolmentResult.error
          totalEnrolments = enrolmentResult.count || 0
        }

        const drafts = courses.filter((c) => c.status === 'draft').length
        const submitted = courses.filter((c) => c.status === 'submitted' || c.status === 'under_review').length
        const published = courses.filter((c) => c.status === 'published').length

        if (!cancelled) {
          setData({
            profile,
            courses,
            drafts,
            submitted,
            published,
            totalEnrolments,
          })
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Unable to load partner dashboard')
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
        <p className="text-sm font-medium text-gray-500">Loading your partner studio...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p className="font-semibold">Unable to load dashboard</p>
        <p className="mt-1 text-xs">{error}</p>
      </div>
    )
  }

  const recentCourses = data.courses.slice(0, 5)

  return (
    <div className="w-full space-y-6">
      <DashboardHeader
        dataTour="partner-header"
        title="Partner Course Studio"
        subtitle={`Welcome back, ${data.profile?.name || user?.name || 'Partner'}. Manage your organisation’s courses, drafts and submissions for review.`}
        onStartTour={() => setTourOpen(true)}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="bg-deep-600 text-white hover:bg-deep-700">
              <Link to="/partner-courses">
                <Plus size={14} className="mr-1.5" />
                New Course
              </Link>
            </Button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div data-tour="partner-metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Your courses"
          value={data.courses.length}
          icon={BookOpen}
          helper="Courses owned by your organisation"
          to="/partner-courses"
        />
        <MetricCard
          label="Drafts"
          value={data.drafts}
          icon={FileText}
          helper="Unpublished course drafts"
          to="/partner-courses"
        />
        <MetricCard
          label="Submitted for review"
          value={data.submitted}
          icon={ClipboardList}
          helper="Awaiting academy approval"
          to="/partner-courses"
        />
        <MetricCard
          label="Student enrolments"
          value={data.totalEnrolments}
          icon={Users}
          helper="Learners across your courses"
        />
      </div>

      {/* Recent Courses */}
      <Card data-tour="partner-courses" className="border border-gray-200/90 dark:border-gray-800 shadow-sm rounded-xl bg-card overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">Recent courses</h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Courses owned by your organisation</p>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0 text-xs border-gray-200 dark:border-gray-800">
            <Link to="/partner-courses">
              Open course studio
              <ArrowRight size={13} className="ml-1.5" />
            </Link>
          </Button>
        </div>
        <CardContent className="p-5">
          {recentCourses.length === 0 ? (
            <div className="py-16 text-center">
              <EmptyState
                icon={Briefcase}
                title="No courses yet"
                description="Create your first course in the Course Studio to begin offering partner electives to academy fellows."
                action={
                  <Button asChild size="sm" className="bg-deep-600 text-white hover:bg-deep-700">
                    <Link to="/partner-courses">
                      <Plus size={14} className="mr-1.5" />
                      Create course
                    </Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="space-y-3">
              {recentCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-gray-100 dark:border-gray-800 p-3 hover:border-gray-200 dark:hover:border-gray-700 transition-colors bg-white dark:bg-gray-900/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={course.title}>{course.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(course.created_at).toLocaleDateString()} ·{' '}
                      {course.status.replace('_', ' ')}
                    </p>
                  </div>
                  <Badge
                    variant={
                      course.status === 'published'
                        ? 'secondary'
                        : course.status === 'draft'
                        ? 'outline'
                        : 'default'
                    }
                    className="text-[11px] font-medium shrink-0 capitalize"
                  >
                    {course.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card data-tour="partner-actions" className="border border-gray-200/90 dark:border-gray-800 shadow-sm rounded-xl bg-card overflow-hidden flex flex-col justify-between">
        <div>
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">Studio actions</h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Quick actions for partner course operations</p>
          </div>
          <CardContent className="p-4 space-y-2">
            <Link
              to="/partner-courses"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-colors bg-white dark:bg-gray-900/40 text-xs font-semibold text-gray-800 dark:text-gray-200"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen size={16} className="text-deep-600 dark:text-deep-400 shrink-0" />
                <span>Course Studio</span>
              </div>
              <ArrowRight size={13} className="text-gray-400" />
            </Link>

            <Link
              to="/partner-organisation"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-colors bg-white dark:bg-gray-900/40 text-xs font-semibold text-gray-800 dark:text-gray-200"
            >
              <div className="flex items-center gap-2.5">
                <Users size={16} className="text-deep-600 dark:text-deep-400 shrink-0" />
                <span>Organisation Profile</span>
              </div>
              <ArrowRight size={13} className="text-gray-400" />
            </Link>
          </CardContent>
        </div>
        <div className="p-4 bg-gray-50/60 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-800">
          <Button asChild variant="outline" size="sm" className="w-full text-xs border-gray-200 dark:border-gray-800">
            <Link to="/partner-courses">View All Courses ({data.courses.length})</Link>
          </Button>
        </div>
      </Card>

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

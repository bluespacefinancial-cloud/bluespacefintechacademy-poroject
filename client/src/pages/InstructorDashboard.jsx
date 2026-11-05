import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { BookOpen, ClipboardList, GraduationCap, ArrowRight, Users, Plus, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { getCurrentProfile } from '../lib/profile'
import { supabase } from '../lib/supabase'
import WelcomeGuide from '../components/WelcomeGuide'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import MetricCard from '../components/dashboard/MetricCard'

const initialData = { profile: null, cohorts: [], squads: [], modules: [], submissions: [] }

export default function InstructorDashboard({ user }) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tourOpen, setTourOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const profile = await getCurrentProfile()
        if (!profile) throw new Error('Your instructor profile could not be found')
        const [cohortResult, squadResult, moduleResult] = await Promise.all([
          supabase.from('instructor_cohort_assignments').select('cohort_id').eq('instructor_id', profile.id),
          supabase.from('instructor_squad_assignments').select('squad_id').eq('instructor_id', profile.id),
          supabase.from('modules').select('id, title, stage, domain, track, cohort_id, is_published, week_start, week_end, created_by').order('updated_at', { ascending: false }),
        ])
        if (cohortResult.error) throw cohortResult.error
        if (squadResult.error) throw squadResult.error
        if (moduleResult.error) throw moduleResult.error

        const cohortIds = cohortResult.data.map((item) => item.cohort_id)
        const squadIds = squadResult.data.map((item) => item.squad_id)
        const modules = moduleResult.data.filter((item) => cohortIds.includes(item.cohort_id) || item.created_by === profile.id)
        const moduleIds = modules.map((item) => item.id)
        const [cohortRows, squadRows, lessonResult] = await Promise.all([
          cohortIds.length ? supabase.from('cohorts').select('id, name, status').in('id', cohortIds) : Promise.resolve({ data: [], error: null }),
          squadIds.length ? supabase.from('squads').select('id, name, cohort_id').in('id', squadIds) : Promise.resolve({ data: [], error: null }),
          moduleIds.length ? supabase.from('lessons').select('id, module_id').in('module_id', moduleIds) : Promise.resolve({ data: [], error: null }),
        ])
        if (cohortRows.error) throw cohortRows.error
        if (squadRows.error) throw squadRows.error
        if (lessonResult.error) throw lessonResult.error

        const lessonIds = lessonResult.data.map((item) => item.id)
        const labResult = lessonIds.length
          ? await supabase.from('labs').select('id, lesson_id, title').in('lesson_id', lessonIds)
          : { data: [], error: null }
        if (labResult.error) throw labResult.error
        const labIds = labResult.data.map((item) => item.id)
        const submissionResult = labIds.length
          ? await supabase.from('submissions').select('id, lab_id, user_id, status, submitted_at').eq('status', 'submitted').in('lab_id', labIds).order('submitted_at', { ascending: false }).limit(6)
          : { data: [], error: null }
        if (submissionResult.error) throw submissionResult.error

        const studentIds = [...new Set(submissionResult.data.map((item) => item.user_id))]
        const [studentRows,] = studentIds.length
          ? await Promise.all([supabase.from('users').select('id, name').in('id', studentIds)])
          : [{ data: [], error: null }]
        if (studentRows.error) throw studentRows.error

        const lessonModules = new Map(lessonResult.data.map((item) => [item.id, item.module_id]))
        const labsById = new Map(labResult.data.map((item) => [item.id, item]))
        const studentsById = new Map(studentRows.data.map((item) => [item.id, item.name]))
        const submissions = submissionResult.data.map((item) => ({
          ...item,
          labTitle: labsById.get(item.lab_id)?.title || 'Lab submission',
          moduleTitle: modules.find((module) => module.id === lessonModules.get(labsById.get(item.lab_id)?.lesson_id))?.title || 'Assigned module',
          studentName: studentsById.get(item.user_id) || 'Student',
        }))

        if (!cancelled) setData({ profile, cohorts: cohortRows.data, squads: squadRows.data, modules, submissions })
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Unable to load instructor dashboard')
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
        <p className="text-sm font-medium text-gray-500">Loading your teaching dashboard...</p>
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

  const publishedModules = data.modules.filter((item) => item.is_published).length

  return (
    <div className="space-y-6">
      <DashboardHeader
        dataTour="instructor-header"
        title="Teaching dashboard"
        subtitle={`Welcome back, ${data.profile?.name || user?.name || 'Instructor'}. Oversee your assigned cohorts, authored modules, and student evaluations.`}
        onStartTour={() => setTourOpen(true)}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="border-gray-200">
              <Link to="/labs-to-review">
                <ClipboardList size={14} className="mr-1.5" />
                Review labs
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-deep-600 text-white hover:bg-deep-700">
              <Link to="/my-modules">
                <Plus size={14} className="mr-1.5" />
                Create module
              </Link>
            </Button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div data-tour="instructor-metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Assigned cohorts"
          value={data.cohorts.length}
          icon={GraduationCap}
          helper="Cohorts assigned to you"
        />
        <MetricCard
          label="Managed modules"
          value={data.modules.length}
          icon={BookOpen}
          helper="Total authored or assigned"
          to="/my-modules"
        />
        <MetricCard
          label="Published modules"
          value={publishedModules}
          icon={CheckCircle2}
          helper={`${data.modules.length - publishedModules} unpublished drafts`}
          to="/my-modules"
        />
        <MetricCard
          label="Pending lab reviews"
          value={data.submissions.length}
          icon={ClipboardList}
          helper="Student submissions to grade"
          to="/labs-to-review"
        />
      </div>

      {/* Main Content Grid: Modules & Squads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card data-tour="instructor-modules" className="lg:col-span-2 border border-gray-200/90 shadow-sm rounded-xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <CardTitle className="text-base font-bold text-gray-900">Your teaching modules</CardTitle>
              <p className="mt-0.5 text-xs text-gray-500">Modules from your assigned cohorts and modules you created</p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs border-gray-200">
              <Link to="/my-modules">
                Open modules
                <ArrowRight size={13} className="ml-1.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {data.modules.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center">
                <BookOpen size={24} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-semibold text-gray-900">No modules assigned yet</p>
                <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                  Your academy administrator can assign cohort modules, or you can create one from scratch.
                </p>
                <Button asChild size="sm" className="mt-4 bg-deep-600 text-white hover:bg-deep-700">
                  <Link to="/my-modules">Create a module</Link>
                </Button>
              </div>
            ) : (
              data.modules.slice(0, 6).map((module) => (
                <div
                  key={module.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-gray-100 p-3.5 hover:border-gray-200 transition-colors bg-white"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{module.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="capitalize">{module.stage ? module.stage.replaceAll('_', ' ') : 'Foundations'}</span>
                      <span>•</span>
                      <span>{module.domain || module.track || 'Fintech Core'}</span>
                      <span>•</span>
                      <span className="truncate">{cohortNamesFor(module, data.cohorts)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={module.is_published ? 'secondary' : 'outline'} className="text-[11px] font-medium">
                      {module.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Assigned Squads */}
        <Card data-tour="instructor-squads" className="border border-gray-200/90 shadow-sm rounded-xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <CardTitle className="text-base font-bold text-gray-900">Assigned squads</CardTitle>
              <p className="mt-0.5 text-xs text-gray-500">Student squads in your cohorts</p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs border-gray-200">
              <Link to="/squads">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {data.squads.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center">
                <Users size={22} className="mx-auto text-gray-400 mb-1.5" />
                <p className="text-sm font-medium text-gray-900">No squads assigned</p>
                <p className="mt-1 text-xs text-gray-500">
                  Your administrator will assign squads to your mentoring queue.
                </p>
              </div>
            ) : (
              data.squads.map((squad) => (
                <div key={squad.id} className="rounded-lg border border-gray-100 p-3 hover:border-gray-200 transition-colors bg-white">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900 truncate">{squad.name}</p>
                    <span className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                      Squad
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {cohortNamesFor({ cohort_id: squad.cohort_id }, data.cohorts)}
                  </p>
                </div>
              ))
            )}
            {data.squads.length > 0 && (
              <Button asChild variant="outline" size="sm" className="w-full text-xs border-gray-200 mt-2">
                <Link to="/squads">Manage all squads</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Submissions Waiting for Review */}
      <Card data-tour="instructor-reviews" className="border border-gray-200/90 shadow-sm rounded-xl bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <CardTitle className="text-base font-bold text-gray-900">Submissions waiting for review</CardTitle>
            <p className="mt-0.5 text-xs text-gray-500">Student lab exercises submitted and awaiting grading</p>
          </div>
          <Button asChild variant="outline" size="sm" className="text-xs border-gray-200">
            <Link to="/labs-to-review">
              Review labs
              <ArrowRight size={13} className="ml-1.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-5">
          {data.submissions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center">
              <CheckCircle2 size={24} className="mx-auto text-emerald-600 mb-2" />
              <p className="text-sm font-semibold text-gray-900">All submissions up to date</p>
              <p className="mt-1 text-xs text-gray-500">No lab submissions are currently waiting for your review.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.submissions.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.labTitle}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{item.studentName}</span>
                      <span>•</span>
                      <span className="truncate">{item.moduleTitle}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-500">
                      Submitted {new Date(item.submitted_at).toLocaleDateString()}
                    </span>
                    <Button asChild size="sm" variant="outline" className="h-8 px-3 text-xs border-gray-200 text-deep-600 hover:bg-deep-50">
                      <Link to="/labs-to-review">Review</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <WelcomeGuide
        role="Instructor"
        forceOpen={tourOpen}
        onClose={() => setTourOpen(false)}
      />
    </div>
  )
}

function cohortNamesFor(item, cohorts) {
  return cohorts.find((cohort) => cohort.id === item.cohort_id)?.name || 'Cohort not assigned'
}

InstructorDashboard.propTypes = {
  user: PropTypes.object,
}

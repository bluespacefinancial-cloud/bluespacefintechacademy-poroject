import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { BookOpen, ClipboardList, GraduationCap, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { getCurrentProfile } from '../lib/profile'
import { supabase } from '../lib/supabase'
import WelcomeGuide from '../components/WelcomeGuide'

const initialData = { profile: null, cohorts: [], squads: [], modules: [], submissions: [] }

function Metric({ label, value, Icon }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div><p className="text-2xl font-bold text-deep-600">{value}</p><p className="text-sm text-gray-500">{label}</p></div>
        <Icon size={19} className="text-deep-600" />
      </CardContent>
    </Card>
  )
}
Metric.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.node.isRequired, Icon: PropTypes.elementType.isRequired }

export default function InstructorDashboard({ user }) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  if (loading) return <p className="py-12 text-center text-sm text-gray-500">Loading your teaching dashboard...</p>
  if (error) return <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>

  const publishedModules = data.modules.filter((item) => item.is_published).length
  return (
    <>
      <header><h1 className="text-2xl font-bold text-deep-600">Teaching dashboard</h1><p className="mt-1 text-sm text-gray-500">Welcome, {data.profile?.name || user?.name}. Here are your assigned cohorts, modules and reviews.</p></header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Assigned cohorts" value={data.cohorts.length} Icon={GraduationCap} />
        <Metric label="Managed modules" value={data.modules.length} Icon={BookOpen} />
        <Metric label="Published modules" value={publishedModules} Icon={BookOpen} />
        <Metric label="Pending lab reviews" value={data.submissions.length} Icon={ClipboardList} />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between"><div><CardTitle className="text-base">Your teaching modules</CardTitle><p className="text-sm text-gray-500">Modules from your assigned cohorts and modules you created.</p></div><Button asChild variant="outline" size="sm"><Link to="/my-modules">Open modules <ArrowRight size={14} className="ml-2" /></Link></Button></CardHeader>
          <CardContent className="space-y-3">
            {data.modules.length === 0 ? <p className="text-sm text-gray-500">No modules are assigned yet. Your academy administrator can assign a cohort, or you can create a module.</p> : data.modules.slice(0, 6).map((module) => <div key={module.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"><div><p className="text-sm font-medium text-deep-600">{module.title}</p><p className="text-xs text-gray-500">{module.stage.replaceAll('_', ' ')} · {module.domain || module.track || 'Foundations'} · {cohortNamesFor(module, data.cohorts)}</p></div><Badge variant={module.is_published ? 'secondary' : 'outline'}>{module.is_published ? 'Published' : 'Draft'}</Badge></div>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Assigned squads</CardTitle></CardHeader>
          <CardContent className="space-y-3">{data.squads.length === 0 ? <p className="text-sm text-gray-500">No squads have been assigned to you yet.</p> : data.squads.map((squad) => <div key={squad.id} className="rounded-md border p-3"><p className="text-sm font-medium">{squad.name}</p><p className="text-xs text-gray-500">{cohortNamesFor({ cohort_id: squad.cohort_id }, data.cohorts)}</p></div>)}<Button asChild variant="outline" size="sm" className="w-full"><Link to="/squads">View squads</Link></Button></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Submissions waiting for review</CardTitle><Button asChild variant="outline" size="sm"><Link to="/labs-to-review">Review labs <ArrowRight size={14} className="ml-2" /></Link></Button></CardHeader>
        <CardContent className="space-y-2">{data.submissions.length === 0 ? <p className="text-sm text-gray-500">No lab submissions are waiting for your review.</p> : data.submissions.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 last:border-0"><div><p className="text-sm font-medium">{item.labTitle}</p><p className="text-xs text-gray-500">{item.studentName} · {item.moduleTitle}</p></div><p className="text-xs text-gray-500">{new Date(item.submitted_at).toLocaleDateString()}</p></div>)}</CardContent>
      </Card>
      <WelcomeGuide role="Instructor" />
    </>
  )
}

function cohortNamesFor(item, cohorts) {
  return cohorts.find((cohort) => cohort.id === item.cohort_id)?.name || 'Cohort not assigned'
}

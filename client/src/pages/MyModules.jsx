import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Eye, Plus } from 'lucide-react'
import { Button } from '../components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from '../components/ui/select'
import { api } from '../lib/backend'

const STAGE_LABELS = {
  foundations: 'Foundations',
  domain_immersion: 'Domain Immersion',
  live_projects: 'Live Projects',
  certification: 'Certification',
}

export default function MyModules() {
  const navigate = useNavigate()
  const [modules, setModules] = useState([])
  const [filterStage, setFilterStage] = useState('all')
  const [filterTrack, setFilterTrack] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadModules = async () => {
    const [{ data, error: loadError }, { data: cohorts, error: cohortsError }, { data: lessons, error: lessonsError }] = await Promise.all([
      api.from('modules').select('*').order('created_at', { ascending: false }),
      api.from('cohorts').select('id, name'),
      api.from('lessons').select('id, module_id'),
    ])
    if (loadError) throw loadError
    if (cohortsError) throw cohortsError
    if (lessonsError) throw lessonsError
    const cohortNames = new Map((cohorts || []).map((cohort) => [cohort.id, cohort.name]))
    const lessonCounts = (lessons || []).reduce((counts, lesson) => counts.set(lesson.module_id, (counts.get(lesson.module_id) || 0) + 1), new Map())
    setModules((data || []).map((module) => ({
      ...module,
      cohortName: cohortNames.get(module.cohort_id) || 'Unassigned cohort',
      lessonCount: lessonCounts.get(module.id) || 0,
    })))
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        await loadModules()
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Unable to load modules')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const togglePublished = async (module) => {
    const { error: updateError } = await api
      .from('modules')
      .update({ is_published: !module.is_published, updated_at: new Date().toISOString() })
      .eq('id', module.id)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setModules((current) => current.map((item) => item.id === module.id
      ? { ...item, is_published: !item.is_published }
      : item))
  }

  const filteredModules = modules.filter((module) =>
    (filterStage === 'all' || module.stage === filterStage)
    && (filterTrack === 'all' || module.track === filterTrack)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-deep-600">My Modules</h1>
          <p className="text-sm text-gray-500">Build and manage course modules for the academy</p>
        </div>
        <Button onClick={() => navigate('/modules/create')}><Plus size={16} className="mr-2" />Create Module</Button>
      </div>
      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mb-6 flex gap-4">
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All stages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {Object.entries(STAGE_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTrack} onValueChange={setFilterTrack}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="All tracks" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tracks</SelectItem>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Finsoft">Finsoft</SelectItem>
            <SelectItem value="Finops">Finops</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        {loading && <p className="py-8 text-center text-sm text-gray-500">Loading modules...</p>}
        {!loading && filteredModules.length === 0 && <div className="py-12 text-center text-gray-400"><Eye size={32} className="mx-auto mb-3 opacity-50" /><p>No modules found</p></div>}
        {!loading && filteredModules.map((module) => (
          <Card key={module.id} className="cursor-pointer hover:border-brand-200" onClick={() => navigate(`/modules/${module.id}`)}>
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <BookOpen size={16} className="text-deep-600" />
                <div><CardTitle className="text-sm">{module.title}</CardTitle><CardDescription className="text-[10px]">{module.cohortName} · {module.lessonCount} lessons · {module.track || 'All'} track</CardDescription></div>
              </div>
              <Badge variant={module.is_published ? 'secondary' : 'outline'}>{module.is_published ? 'published' : 'draft'}</Badge>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-medium uppercase tracking-wider">{STAGE_LABELS[module.stage] || module.stage}{module.domain && ` · ${module.domain}`}</span>
                <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); togglePublished(module) }}>
                  {module.is_published ? 'Unpublish' : 'Publish'}
                </Button>
              </div>
            </CardContent>
            <CardFooter className="pt-3"><span className="text-[10px] text-gray-400">Weeks {module.week_start}-{module.week_end}</span></CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

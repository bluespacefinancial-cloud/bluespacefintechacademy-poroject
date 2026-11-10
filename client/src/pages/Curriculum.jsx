import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Plus } from 'lucide-react'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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

export default function Curriculum() {
  const navigate = useNavigate()
  const [modules, setModules] = useState([])
  const [filterStage, setFilterStage] = useState('all')
  const [filterTrack, setFilterTrack] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadModules = useCallback(async () => {
    const [
      { data, error: loadError },
      { data: cohorts, error: cohortError },
      { data: lessons, error: lessonError },
    ] = await Promise.all([
      api.from('modules').select('*').order('created_at', { ascending: true }),
      api.from('cohorts').select('id, name'),
      api.from('lessons').select('id, module_id'),
    ])
    if (loadError) throw loadError
    if (cohortError) throw cohortError
    if (lessonError) throw lessonError

    const cohortNames = new Map((cohorts || []).map((cohort) => [cohort.id, cohort.name]))
    const lessonCounts = (lessons || []).reduce(
      (counts, lesson) => counts.set(lesson.module_id, (counts.get(lesson.module_id) || 0) + 1),
      new Map()
    )

    setModules((data || []).map((module) => ({
      ...module,
      cohortName: cohortNames.get(module.cohort_id) || 'Unassigned cohort',
      lessonCount: lessonCounts.get(module.id) || 0,
    })))
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        await loadModules()
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Unable to load the curriculum')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [loadModules])

  const filtered = modules.filter((module) => (
    (filterStage === 'all' || module.stage === filterStage)
    && (filterTrack === 'all' || (module.track || 'All') === filterTrack)
  ))

  const publishedCount = modules.filter((module) => module.is_published).length
  const draftCount = modules.length - publishedCount

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Curriculum</h1>
          <p className="mt-1 text-sm text-gray-500">
            Every module across the four-stage framework. Open a module to edit its lessons.
          </p>
        </div>
        <Button onClick={() => navigate('/modules/create')} className="shrink-0">
          <Plus size={16} className="mr-2" />
          Create module
        </Button>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-gray-900">{modules.length}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total modules</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-emerald-600">{publishedCount}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-gray-500">{draftCount}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Draft</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-[180px]" aria-label="Filter by stage">
            <SelectValue placeholder="All stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {Object.entries(STAGE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterTrack} onValueChange={setFilterTrack}>
          <SelectTrigger className="w-[150px]" aria-label="Filter by track">
            <SelectValue placeholder="All tracks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tracks</SelectItem>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Finsoft">Finsoft</SelectItem>
            <SelectItem value="Finops">Finops</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {loading && (
          <p className="py-8 text-center text-sm text-gray-500">Loading the curriculum…</p>
        )}

        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <BookOpen size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No modules match these filters.</p>
          </div>
        )}

        {!loading && filtered.map((module) => (
          <Card
            key={module.id}
            className="cursor-pointer transition-colors hover:border-deep-200"
            onClick={() => navigate(`/modules/${module.id}`)}
          >
            <CardHeader className="flex flex-row items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <BookOpen size={16} className="shrink-0 text-deep-600" />
                <div className="min-w-0">
                  <CardTitle className="truncate text-sm">{module.title}</CardTitle>
                  <CardDescription className="text-[11px]">
                    {module.cohortName} · Weeks {module.week_start}–{module.week_end} · {module.lessonCount} lesson{module.lessonCount === 1 ? '' : 's'}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={module.is_published ? 'secondary' : 'outline'}>
                {module.is_published ? 'Published' : 'Draft'}
              </Badge>
            </CardHeader>
            <CardContent className="flex items-center justify-between pt-0 pb-3">
              <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                {STAGE_LABELS[module.stage] || module.stage}
                {module.domain && ` · ${module.domain}`}
                {module.track && ` · ${module.track} track`}
              </span>
              <span className="text-[11px] text-gray-400">Open module →</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Plus, Edit3, Eye } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '../components/ui/select'
import { supabase } from '../lib/supabase'

const STAGE_COLORS = {
  foundations: 'text-brand-600',
  domain_immersion: 'text-emerald-600',
  live_projects: 'text-amber-600',
  certification: 'text-slate-600',
}

const STAGE_LABELS = {
  foundations: 'Foundations',
  domain_immersion: 'Domain Immersion',
  live_projects: 'Live Projects',
  certification: 'Certification',
}

const DOMAIN_COLORS = {
  FaaS: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  FinCore: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  FinOps: 'bg-amber-100 text-amber-700 border-amber-200',
  FinInfra: 'bg-slate-100 text-slate-700 border-slate-200',
}

export default function Curriculum() {
  const navigate = useNavigate()
  const [modules, setModules] = useState([])
  const [filterStage, setFilterStage] = useState('all')
  const [filterTrack, setFilterTrack] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadModules()
  }, [])

  const loadModules = async () => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      setModules(data || [])
    } catch (err) {
      console.error('Error loading modules:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = modules.filter((m) => {
    const stageMatch = filterStage === 'all' || m.stage === filterStage
    const trackMatch = filterTrack === 'all' || m.track === filterTrack
    return stageMatch && trackMatch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-deep-600 mb-1">Curriculum</h1>
            <p className="text-sm text-gray-500">
              Manage course modules across the four-stage framework
            </p>
          </div>
          <Button onClick={() => navigate('/curriculum/create')}>
            <Plus size={16} className="mr-2" />
            Create Module
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Stage
          </span>
          <Select value={filterStage} onValueChange={(value) => setFilterStage(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="foundations">Foundations</SelectItem>
              <SelectItem value="domain_immersion">Domain Immersion</SelectItem>
              <SelectItem value="live_projects">Live Projects</SelectItem>
              <SelectItem value="certification">Certification</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Track</span>
          <Select value={filterTrack} onValueChange={(value) => setFilterTrack(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All tracks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tracks</SelectItem>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Finsoft">Finsoft</SelectItem>
              <SelectItem value="Finops">Finops</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">{modules.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Modules</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">
              {modules.filter((m) => m.status === 'published').length}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">
              {modules.filter((m) => m.status === 'draft').length}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Draft</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <BookOpen size={32} className="mx-auto mb-3 opacity-50" />
            <p>No modules found</p>
          </div>
        ) : (
          filtered.map((module) => (
            <Card
              key={module.id}
              className="cursor-pointer hover:border-brand-200 transition-colors duration-150"
              onClick={() => navigate(`/curriculum/${module.id}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0">
                    <BookOpen size={14} className="text-deep-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm">{module.title}</CardTitle>
                    <CardDescription className="text-[10px]">
                      {module.week} · {module.track} track
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={module.status === 'published' ? 'secondary' : 'outline'}>
                  {module.status}
                </Badge>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-medium ${STAGE_COLORS[module.stage] || 'text-gray-500'} uppercase tracking-wider`}>
                    {STAGE_LABELS[module.stage]}
                    {module.domain && ` · ${module.domain}`}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/curriculum/${module.id}/edit`) }}>
                      <Edit3 size={12} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={(e) => e.stopPropagation()}>
                      <Eye size={12} />
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between pt-3">
                <span className="text-[10px] text-gray-400">
                  {module.created_by || 'Admin'} · {module.created_at?.slice(0, 10)}
                </span>
                {module.domain && (
                  <Badge className={DOMAIN_COLORS[module.domain]}>{module.domain}</Badge>
                )}
              </CardFooter>
            </Card>
          ))}
        )}
      </div>
    </div>
  )
}

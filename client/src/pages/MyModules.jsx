import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Plus, Edit3, Trash2, Eye } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

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

const MOCK_MODULES = [
  {
    id: 1,
    title: 'Fintech and Payments Fundamentals',
    stage: 'foundations',
    domain: null,
    track: 'All',
    week: 'Week 1',
    lessons: 4,
    status: 'published',
    createdBy: 'Academy Team Lead',
    updatedAt: '2026-11-01',
  },
  {
    id: 2,
    title: 'Regulation, Compliance and Risk Basics',
    stage: 'foundations',
    domain: null,
    track: 'All',
    week: 'Week 1',
    lessons: 3,
    status: 'published',
    createdBy: 'Academy Team Lead',
    updatedAt: '2026-11-01',
  },
  {
    id: 3,
    title: 'AI in the Factory',
    stage: 'foundations',
    domain: null,
    track: 'All',
    week: 'Week 2',
    lessons: 2,
    status: 'draft',
    createdBy: 'Finsoft Track Lead',
    updatedAt: '2026-11-02',
  },
  {
    id: 4,
    title: 'FinCore: Ledger and Transaction Engineering',
    stage: 'domain_immersion',
    domain: 'FinCore',
    track: 'Finsoft',
    week: 'Weeks 5-6',
    lessons: 5,
    status: 'published',
    createdBy: 'FinCore Domain Lead',
    updatedAt: '2026-11-03',
  },
  {
    id: 5,
    title: 'FinOps: Reconciliation and Reporting Pipeline',
    stage: 'domain_immersion',
    domain: 'FinOps',
    track: 'Finops',
    week: 'Week 7',
    lessons: 4,
    status: 'draft',
    createdBy: 'FinOps Domain Lead',
    updatedAt: '2026-11-03',
  },
]

export default function MyModules() {
  const navigate = useNavigate()
  const [filterStage, setFilterStage] = useState('all')
  const [filterTrack, setFilterTrack] = useState('all')

  const filteredModules = MOCK_MODULES.filter((m) => {
    const stageMatch = filterStage === 'all' || m.stage === filterStage
    const trackMatch = filterTrack === 'all' || m.track === filterTrack
    return stageMatch && trackMatch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-deep-600 mb-1">My Modules</h1>
            <p className="text-sm text-gray-500">
              Build and manage course modules for the academy
            </p>
          </div>
          <Button onClick={() => navigate('/modules/create')}>
            <Plus size={16} className="mr-2" />
            Create Module
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Stage
          </span>
          <Select
            value={filterStage}
            onValueChange={(value) => setFilterStage(value)}
          >
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
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Track
          </span>
          <Select
            value={filterTrack}
            onValueChange={(value) => setFilterTrack(value)}
          >
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

      {/* Modules list */}
      <div className="space-y-3">
        {filteredModules.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Eye size={32} className="mx-auto mb-3 opacity-50" />
            <p>No modules found</p>
          </div>
        ) : (
          filteredModules.map((module) => (
            <Card
              key={module.id}
              className="cursor-pointer hover:border-brand-200 transition-colors duration-150"
              onClick={() => navigate(`/modules/${module.id}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0">
                    <BookOpen size={14} className="text-deep-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm">{module.title}</CardTitle>
                    <CardDescription className="text-[10px]">
                      {module.week} · {module.lessons} lessons · {module.track} track
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
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/modules/${module.id}/edit`) }}>
                      <Edit3 size={12} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation() }}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between pt-3">
                <span className="text-[10px] text-gray-400">
                  {module.createdBy} · {module.updatedAt}
                </span>
                <Badge variant={module.status === 'published' ? 'secondary' : 'outline'}>
                  {module.status}
                </Badge>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Users, Clock, Target, Activity, Award } from 'lucide.react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { supabase } from '../lib/supabase'

const ROLE_COLORS = {
  'Squad Lead': 'bg-brand-100 text-brand-700 border-brand-200',
  'UAT Lead': 'bg-amber-100 text-amber-700 border-amber-200',
  'Technical Specialist': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Operations Lead': 'bg-slate-100 text-slate-700 border-slate-200',
}

export default function MySquad() {
  const navigate = useNavigate()
  const [squads, setSquads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSquads()
  }, [])

  const loadSquads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('squads')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      const squadsData = (data || []).map((squad) => ({
        id: squad.id,
        name: squad.name,
        cohort: squad.cohort_id,
        members: squad.members_count || 5,
        finsoftCount: squad.finsoft_count || 0,
        finopsCount: squad.finops_count || 0,
        sprint: squad.current_sprint || 'Sprint 1 of 3',
        status: squad.status || 'active',
        lead: squad.squad_lead_name || 'Unassigned',
      }))

      setSquads(squadsData)
    } catch (err) {
      console.error('Error loading squads:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading squads...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-deep-600 mb-1">My Squads</h1>
            <p className="text-sm text-gray-500">
              Manage mixed-track squads for live project delivery
            </p>
          </div>
          <Button onClick={() => navigate('/squads/create')}>
            <Plus size={16} className="mr-2" />
            Create Squad
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">{squads.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Squads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">
              {squads.filter((s) => s.status === 'active').length}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">
              {squads.reduce((sum, s) => sum + s.members, 0)}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">
              {squads.filter((s) => s.status === 'active').reduce((sum, s) => sum + s.finsoftCount, 0)}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Finsoft Members</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {squads.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users size={32} className="mx-auto mb-3 opacity-50" />
            <p>No squads found</p>
          </div>
        ) : (
          squads.map((squad) => (
            <Card
              key={squad.id}
              className="cursor-pointer hover:border-brand-200 transition-colors duration-150"
              onClick={() => navigate(`/squads/${squad.id}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-deep-100 flex items-center justify-center text-xs font-bold text-deep-600 shrink-0">
                    {squad.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm">{squad.name}</CardTitle>
                    <CardDescription className="text-[10px]">
                      {squad.cohort}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={squad.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-100'}>
                  {squad.status}
                </Badge>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-deep-600">Sprint</span>
                    <span className="text-xs text-gray-600">{squad.sprint}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-deep-600">Squad Lead</span>
                    <span className="text-xs text-gray-600">{squad.lead}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-deep-600">Members</span>
                    <span className="text-xs text-gray-600">
                      {squad.finsoftCount} Finsoft + {squad.finopsCount} Finops
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                    {squad.finsoftCount} Finsoft
                  </Badge>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    {squad.finopsCount} Finops
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between pt-3">
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/squads/${squad.id}/members`) }}>
                  <Users size={12} className="mr-1" />
                  View Members
                </Button>
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/squads/${squad.id}/sprints`) }}>
                  <Activity size={12} className="mr-1" />
                  Sprints
                </Button>
              </CardFooter>
            </Card>
          ))}
        )}
      </div>
    </div>
  )
}

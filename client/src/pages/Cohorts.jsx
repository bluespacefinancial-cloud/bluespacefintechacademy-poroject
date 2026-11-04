import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit3, Eye } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { supabase } from '../lib/supabase'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '../components/ui/select'

const STATUS_COLORS = {
  planned: 'bg-gray-50 text-gray-600',
  active: 'bg-brand-50 text-brand-700 border-brand-100',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  archived: 'bg-slate-50 text-slate-600 border-slate-100',
}

const STATUS_LABELS = {
  planned: 'Planned',
  active: 'Active',
  completed: 'Completed',
  archived: 'Archived',
}

export default function Cohorts() {
  const navigate = useNavigate()
  const [cohorts, setCohorts] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    loadCohorts()
  }, [])

  const loadCohorts = async () => {
    try {
      const { data, error } = await supabase
        .from('cohorts')
        .select('*')
        .order('start_date', { ascending: true })

      if (error) throw error
      setCohorts(data || [])
    } catch (err) {
      console.error('Error loading cohorts:', err)
    }
  }

  const filteredCohorts = cohorts.filter((c) => {
    if (filterStatus === 'all') return true
    return c.status === filterStatus
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-deep-600 mb-1">Cohorts</h1>
            <p className="text-sm text-gray-500">
              Manage quarterly cohorts and enrolment capacity
            </p>
          </div>
          <Button onClick={() => navigate('/cohorts/create')}>
            <Plus size={16} className="mr-2" />
            Create Cohort
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </span>
          <Select
            value={filterStatus}
            onValueChange={(value) => setFilterStatus(value)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">{cohorts.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Cohorts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">
              {cohorts.filter(c => c.status === 'active').length}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">
              {cohorts.reduce((sum, c) => sum + c.capacity, 0)}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Capacity</p>
          </CardContent>
        </Card>
      </div>

      {/* Cohorts table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cohort</th>
              <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
              <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
              <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tracks</th>
              <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCohorts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  No cohorts found
                </td>
              </tr>
            ) : (
              filteredCohorts.map((cohort) => (
                <tr
                  key={cohort.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                  onClick={() => navigate(`/cohorts/${cohort.id}`)}
                >
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-deep-100 flex items-center justify-center text-xs font-bold text-deep-600">
                        {cohort.id}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-deep-600">{cohort.name}</p>
                        <p className="text-[10px] text-gray-500">
                          Kickoff: {cohort.kickoff_date || cohort.start_date}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-gray-600">
                        {new Date(cohort.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        → {new Date(cohort.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </td>
                  <td className="py-4">
                    <p className="text-xs text-gray-600">{cohort.capacity}</p>
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      {cohort.track_finsoft && (
                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[10px]">Finsoft</Badge>
                      )}
                      {cohort.track_finops && (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px]">Finops</Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-4">
                    <Badge className={STATUS_COLORS[cohort.status] || 'bg-gray-50 text-gray-600'}>
                      {STATUS_LABELS[cohort.status]}
                    </Badge>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/cohorts/${cohort.id}/edit`) }}>
                        <Edit3 size={12} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation() }}>
                        <Eye size={12} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

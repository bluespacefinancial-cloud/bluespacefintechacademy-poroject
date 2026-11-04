import { useState } from 'react'
import { Users, FileText, Search, Edit3 } from 'lucide.react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '../components/ui/select'
import { supabase } from '../lib/supabase'

const STATUS_COLORS = {
  enrolled: 'bg-gray-50 text-gray-600',
  active: 'bg-brand-50 text-brand-700 border-brand-100',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  withdrawn: 'bg-red-50 text-red-700 border-red-100',
  suspended: 'bg-amber-50 text-amber-700 border-amber-100',
}

const STATUS_LABELS = {
  enrolled: 'Enrolled',
  active: 'Active',
  completed: 'Completed',
  withdrawn: 'Withdrawn',
  suspended: 'Suspended',
}

export default function Enrolments() {
  const navigate = useNavigate()
  const [enrolments, setEnrolments] = useState([])
  const [search, setSearch] = useState('')
  const [filterTrack, setFilterTrack] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEnrolments()
  }, [])

  const loadEnrolments = async () => {
    try {
      const { data, error } = await supabase
        .from('enrolments')
        .select(`
          *,
          users (
            name,
            email,
            track
          ),
          cohorts (
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const dataWithNames = (data || []).map((e) => ({
        id: e.id,
        name: e.users?.name || 'Unknown',
        email: e.users?.email || 'Unknown',
        cohort: e.cohorts?.name || 'Unknown',
        track: e.users?.track || e.track,
        squad: e.squad_id ? 'Squad Alpha' : 'Unassigned',
        status: e.status,
        enrolledAt: e.created_at,
      }))

      setEnrolments(dataWithNames)
    } catch (err) {
      console.error('Error loading enrolments:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = enrolments.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase())
    const matchesTrack = filterTrack === 'all' || e.track === filterTrack
    const matchesStatus = filterStatus === 'all' || e.status === filterStatus
    return matchesSearch && matchesTrack && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-deep-600 mb-1">Enrolments</h1>
            <p className="text-sm text-gray-500">
              Manage trainee enrolments and track assignments
            </p>
          </div>
          <Button onClick={() => navigate('/enrolments/create')}>
            <Users size={16} className="mr-2" />
            Add Trainee
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Track</span>
          <Select value={filterTrack} onValueChange={(value) => setFilterTrack(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All tracks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tracks</SelectItem>
              <SelectItem value="Finsoft">Finsoft</SelectItem>
              <SelectItem value="Finops">Finops</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</span>
          <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="enrolled">Enrolled</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">{enrolments.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Enrolments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">
              {enrolments.filter((e) => e.track === 'Finsoft').length}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Finsoft</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">
              {enrolments.filter((e) => e.track === 'Finops').length}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Finops</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-deep-600">
              {enrolments.filter((e) => e.status === 'active').length}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Active</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Search size={32} className="mx-auto mb-3 opacity-50" />
            <p>No enrolments found</p>
          </div>
        ) : (
          filtered.map((enrolment) => (
            <Card
              key={enrolment.id}
              className="cursor-pointer hover:border-brand-200 transition-colors duration-150"
              onClick={() => navigate(`/enrolments/${enrolment.id}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-deep-100 flex items-center justify-center text-xs font-bold text-deep-600 shrink-0">
                    {enrolment.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm">{enrolment.name}</CardTitle>
                    <CardDescription className="text-[10px]">{enrolment.email}</CardDescription>
                  </div>
                </div>
                <Badge className={STATUS_COLORS[enrolment.status] || 'bg-gray-50 text-gray-600'}>
                  {STATUS_LABELS[enrolment.status]}
                </Badge>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-deep-600">Cohort</span>
                    <span className="text-xs text-gray-600">{enrolment.cohort}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-deep-600">Track</span>
                    <span className="text-xs text-gray-600">{enrolment.track}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-deep-600">Squad</span>
                    <span className="text-xs text-gray-600">{enrolment.squad}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-deep-600">Enrolled</span>
                    <span className="text-xs text-gray-600">{new Date(enrolment.enrolledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between pt-3">
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/enrolments/${enrolment.id}/edit`) }}>
                  <Edit3 size={12} />
                </Button>
                <Badge variant="secondary" className="text-[10px]">{enrolment.squad}</Badge>
              </CardFooter>
            </Card>
          ))}
        )}
      </div>
    </div>
  )
}

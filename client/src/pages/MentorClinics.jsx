import { useState } from 'react'
import { Calendar, Clock, Users, AlertCircle, FileText } from 'lucide.react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { supabase } from '../lib/supabase'

export default function MentorClinics() {
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClinics()
  }, [])

  const loadClinics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('scheduled_at', { ascending: true })

      if (error) throw error

      const clinicsData = (data || []).map((c) => ({
        id: c.id,
        title: c.title,
        mentor: c.mentor_name || 'Domain Lead',
        date: c.scheduled_at,
        time: c.scheduled_at ? new Date(c.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'TBD',
        type: c.type || 'Domain-specific',
        attendees: c.attendee_count || 0,
        capacity: c.capacity || 15,
        status: c.status || 'upcoming',
      }))

      setClinics(clinicsData)
    } catch (err) {
      console.error('Error loading clinics:', err)
    } finally {
      setLoading(false)
    }
  }

  const upcomingClinics = clinics.filter((c) => c.status === 'upcoming')
  const completedClinics = clinics.filter((c) => c.status === 'completed')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-deep-600 mb-1">Mentor Clinics</h1>
        <p className="text-sm text-gray-500">
          Schedule and manage mentor office hours for Fellows
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calendar size={14} className="mr-1.5" />
                Upcoming Clinics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingClinics.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No upcoming clinics</p>
                </div>
              ) : (
                clinics.filter((c) => c.status === 'upcoming').map((clinic) => (
                  <Card
                    key={clinic.id}
                    className="p-3 border border-gray-100 bg-white hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-deep-600">{clinic.title}</p>
                        <p className="text-[10px] text-gray-500">{clinic.type} · {clinic.mentor}</p>
                      </div>
                      <Badge variant="default">{clinic.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="mr-0.5" />
                        <span>{new Date(clinic.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="mr-0.5" />
                        <span>{clinic.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={12} className="mr-0.5" />
                        <span>{clinic.attendees}/{clinic.capacity}</span>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full">
                <Calendar size={14} className="mr-2" />
                Schedule Clinic
              </Button>
              <Button variant="outline" className="w-full">
                <Users size={14} className="mr-2" />
                View All Mentors
              </Button>
              <Button variant="outline" className="w-full">
                <AlertCircle size={14} className="mr-2" />
                Clinic Requests
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText size={14} className="mr-1.5" />
                Recently Completed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {completedClinics.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No completed clinics</p>
                </div>
              ) : (
                clinics.filter((c) => c.status === 'completed').map((clinic) => (
                  <Card key={clinic.id} className="p-3 border border-gray-100 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-deep-600">{clinic.title}</p>
                        <p className="text-[10px] text-gray-500">{clinic.mentor}</p>
                      </div>
                      <Badge variant="secondary">Completed</Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {clinic.attendees} attendees / {clinic.capacity} capacity
                    </div>
                  </Card>
                ))}
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

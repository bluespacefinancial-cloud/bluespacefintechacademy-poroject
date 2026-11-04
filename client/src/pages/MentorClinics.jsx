import { Calendar, Clock, Users, FileText, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'

const MOCK_CLINICS = [
  {
    id: 1,
    title: 'FinCore Domain Clinic',
    mentor: 'FinCore Domain Lead',
    date: '2026-11-05',
    time: '10:00 AM - 11:00 AM WAT',
    type: 'Domain-specific',
    attendees: 12,
    capacity: 15,
    status: 'upcoming',
  },
  {
    id: 2,
    title: 'FaaS API Design Clinic',
    mentor: 'FaaS Domain Lead',
    date: '2026-11-05',
    time: '2:00 PM - 3:00 PM WAT',
    type: 'Domain-specific',
    attendees: 8,
    capacity: 15,
    status: 'upcoming',
  },
  {
    id: 3,
    title: 'Squad Stand-up: Alpha',
    mentor: 'Cohort Coordinator',
    date: '2026-11-06',
    time: '10:00 AM - 10:30 AM WAT',
    type: 'Squad',
    attendees: 5,
    capacity: 7,
    status: 'upcoming',
  },
  {
    id: 4,
    title: 'FinOps Reconciliation Clinic',
    mentor: 'FinOps Domain Lead',
    date: '2026-11-07',
    time: '11:00 AM - 12:00 PM WAT',
    type: 'Domain-specific',
    attendees: 6,
    capacity: 15,
    status: 'upcoming',
  },
  {
    id: 5,
    title: 'Git Workflow Clinic',
    mentor: 'Finsoft Track Lead',
    date: '2026-11-04',
    time: '3:00 PM - 4:00 PM WAT',
    type: 'Foundations',
    attendees: 18,
    capacity: 20,
    status: 'completed',
  },
]

export default function MentorClinics() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-deep-600 mb-1">Mentor Clinics</h1>
        <p className="text-sm text-gray-500">
          Schedule and manage mentor office hours for Fellows
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming clinics */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calendar size={14} className="mr-1.5" />
                Upcoming Clinics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_CLINICS.filter((c) => c.status === 'upcoming').map((clinic) => (
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
                      <span>{clinic.date}</span>
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
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Completed clinics */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText size={14} className="mr-1.5" />
                Recently Completed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_CLINICS.filter((c) => c.status === 'completed').map((clinic) => (
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
            </CardContent>
          </Card>

          {/* Quick actions */}
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
      </div>
    </div>
  )
}

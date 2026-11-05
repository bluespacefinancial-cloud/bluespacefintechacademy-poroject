import { Link } from 'react-router-dom'
import { ArrowRight, ShieldAlert } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { useAuth } from '../context/AuthContext'
import StudentDashboard from './StudentDashboard'
import InstructorDashboard from './InstructorDashboard'
import AdministratorDashboard from './AdministratorDashboard'
import PartnerDashboard from './PartnerDashboard'

export default function Dashboard() {
  const { user } = useAuth()

  if (user?.type === 'Student') return <StudentDashboard user={user} />
  if (user?.type === 'Instructor') return <InstructorDashboard user={user} />
  if (user?.type === 'Administrator') return <AdministratorDashboard user={user} />
  if (user?.type === 'Partner') return <PartnerDashboard user={user} />

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <ShieldAlert className="text-amber-600" size={24} />
        <CardTitle className="text-lg">Dashboard access is not set up</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600">Your account does not have an academy role yet. Contact an academy administrator for help.</p>
        <Button asChild variant="outline"><Link to="/student-login">Return to sign in <ArrowRight size={14} className="ml-2" /></Link></Button>
      </CardContent>
    </Card>
  )
}

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AlertCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'

export default function Unauthorized() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-500 mb-3" />
          <CardTitle>Unauthorized</CardTitle>
          <CardDescription>
            You do not have permission to access this page. Your role ({user?.type}) is not authorized for this resource.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => navigate('/design-system')}>
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

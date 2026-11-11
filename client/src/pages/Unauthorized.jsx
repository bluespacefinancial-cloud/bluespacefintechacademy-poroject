import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AlertCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardDescription, CardContent } from '../components/ui/card'

export default function Unauthorized() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-500 mb-3" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Unauthorized</h1>
          <CardDescription>
            You do not have permission to access this page. Your role ({user?.type}) is not
            authorized for this resource.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardDescription, CardContent } from '../components/ui/card'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-500 mb-3" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Page not found</h1>
          <CardDescription>
            The page you requested doesn&rsquo;t exist or may have moved.
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

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, PlayCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { api } from '../lib/backend'

export default function PartnerCatalog() {
  const [courses, setCourses] = useState([])
  const [error, setError] = useState('')
  const navigate = useNavigate()
  useEffect(() => {
    const load = async () => {
      const { data, error: loadError } = await api.from('partner_courses').select('*, partners(name, logo_url), partner_course_lessons(id)').eq('status', 'published').order('published_at', { ascending: false })
      if (loadError) throw loadError
      setCourses(data || [])
    }
    load().catch((loadError) => setError(loadError.message || 'Unable to load partner courses'))
  }, [])
  const enrol = async (courseId) => {
    const { data: user } = await api.auth.getUser()
    const { data: profile } = await api.from('users').select('id').eq('email', user.user.email).single()
    const { error: enrolError } = await api.from('partner_course_enrolments').upsert({ course_id: courseId, user_id: profile.id, status: 'active' }, { onConflict: 'course_id,user_id' })
    if (enrolError) setError(enrolError.message)
    else navigate(`/partner-course/${courseId}`)
  }
  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Partner Courses</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Learn from approved BlueSPACE partner agencies.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="border border-border bg-card shadow-sm flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center gap-3">
                {course.partners?.logo_url && (
                  <img src={course.partners.logo_url} alt="" className="h-10 w-10 rounded object-contain bg-muted/40 p-1 border border-border" />
                )}
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">{course.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">{course.partners?.name}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 flex-1 flex flex-col justify-between">
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{course.description}</p>
              <div className="pt-2 flex flex-col gap-3">
                <Badge variant="outline" className="w-fit text-[11px] border-border text-muted-foreground">
                  {course.partner_course_lessons?.length || 0} lessons
                </Badge>
                <Button className="w-full bg-deep-600 hover:bg-deep-700 text-white font-semibold shadow-sm" onClick={() => enrol(course.id)}>
                  <PlayCircle size={15} className="mr-2 text-white shrink-0" />
                  <span>Start course</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {courses.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
            <BookOpen className="mx-auto mb-2 text-muted-foreground/60" size={24} />
            No approved partner courses are published yet.
          </div>
        )}
      </div>
    </div>
  )
}

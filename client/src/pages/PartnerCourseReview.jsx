/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { api } from '../lib/backend'

export default function PartnerCourseReview() {
  const [courses, setCourses] = useState([])
  const [error, setError] = useState('')
  const load = async () => {
    const { data, error: loadError } = await api.from('partner_courses').select('*, partners(name, logo_url), partner_course_lessons(id, title)').in('status', ['submitted', 'under_review', 'changes_requested']).order('submitted_at')
    if (loadError) throw loadError
    setCourses(data || [])
  }
  useEffect(() => { load().catch((loadError) => setError(loadError.message || 'Unable to load course reviews')) }, [])
  const decide = async (course, status) => {
    const { error: updateError } = await api.from('partner_courses').update({ status, approved_at: status === 'approved' ? new Date().toISOString() : null, published_at: status === 'approved' ? new Date().toISOString() : null }).eq('id', course.id)
    if (updateError) setError(updateError.message); else await load()
  }
  return <div className="min-h-screen bg-gray-50"><div className="mb-6"><h1 className="text-2xl font-bold text-deep-600">Partner Course Review</h1><p className="text-sm text-gray-500">Approve partner content before students can access it.</p></div>{error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="space-y-4">{courses.map((course) => <Card key={course.id}><CardHeader className="flex flex-row items-center justify-between"><div className="flex items-center gap-3">{course.partners?.logo_url && <img src={course.partners.logo_url} alt="" className="h-10 w-10 object-contain" />}<div><CardTitle className="text-sm">{course.title}</CardTitle><p className="text-xs text-gray-500">{course.partners?.name} · {course.partner_course_lessons?.length || 0} lessons</p></div></div><Badge variant="outline">{course.status}</Badge></CardHeader><CardContent className="flex items-center justify-between gap-3"><p className="max-w-2xl text-sm text-gray-600">{course.description}</p><div className="flex gap-2"><Button onClick={() => decide(course, 'approved')}><CheckCircle size={14} className="mr-1" />Approve and publish</Button><Button variant="outline" onClick={() => decide(course, 'changes_requested')}><XCircle size={14} className="mr-1" />Request changes</Button></div></CardContent></Card>)}{courses.length === 0 && <p className="py-12 text-center text-sm text-gray-500">No partner courses are waiting for review.</p>}</div></div>
}

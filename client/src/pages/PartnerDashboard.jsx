import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { BookOpen, Clock, CheckCircle, Plus, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { supabase } from '../lib/supabase'

const emptyData = { partner: null, courses: [], linked: false }

function Metric({ label, value, Icon }) {
  return <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-2xl font-bold text-deep-600">{value}</p><p className="text-sm text-gray-500">{label}</p></div><Icon size={19} className="text-deep-600" /></CardContent></Card>
}
Metric.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.node.isRequired, Icon: PropTypes.elementType.isRequired }

export default function PartnerDashboard({ user }) {
  const [data, setData] = useState(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const { data: partnerId, error: partnerIdError } = await supabase.rpc('current_partner_id')
        if (partnerIdError) throw partnerIdError
        if (!partnerId) {
          if (!cancelled) setData({ ...emptyData, linked: false })
          return
        }
        const [{ data: partner, error: partnerError }, { data: courses, error: coursesError }] = await Promise.all([
          supabase.from('partners').select('id, name, status').eq('id', partnerId).maybeSingle(),
          supabase.from('partner_courses').select('id, title, status, submitted_at, updated_at').eq('partner_id', partnerId).order('updated_at', { ascending: false }),
        ])
        if (partnerError) throw partnerError
        if (coursesError) throw coursesError
        if (!cancelled) setData({ partner, courses: courses || [], linked: Boolean(partner) })
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Unable to load partner workspace')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) return <p className="py-12 text-center text-sm text-gray-500">Loading partner workspace...</p>
  if (error) return <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>

  if (!data.linked) return (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-bold text-deep-600">Partner dashboard</h1><p className="mt-1 text-sm text-gray-500">Welcome, {user?.name || 'partner'}.</p></header>
      <Card><CardHeader><CardTitle className="text-base">Agency link needed</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-gray-600">Your partner account is not linked to an agency yet. An academy administrator must connect your account before you can create and manage courses.</p><p className="text-sm text-gray-500">Once linked, this dashboard will show your course drafts, reviews, and published content.</p></CardContent></Card>
    </div>
  )

  const count = (statuses) => data.courses.filter((course) => statuses.includes(course.status)).length
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-bold text-deep-600">Partner dashboard</h1><p className="mt-1 text-sm text-gray-500">{data.partner.name} · Manage courses and academy reviews.</p></div><Button asChild className="bg-deep-600 text-white hover:bg-deep-700"><Link to="/partner-courses"><Plus size={15} className="mr-2" />Open course studio</Link></Button></header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total courses" value={data.courses.length} Icon={BookOpen} />
        <Metric label="Drafts" value={count(['draft', 'changes_requested'])} Icon={Plus} />
        <Metric label="In review" value={count(['submitted', 'under_review'])} Icon={Clock} />
        <Metric label="Published" value={count(['published'])} Icon={CheckCircle} />
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Your courses</CardTitle><Button asChild variant="outline" size="sm"><Link to="/partner-courses">Manage courses <ArrowRight size={14} className="ml-2" /></Link></Button></CardHeader>
        <CardContent className="space-y-3">{data.courses.length === 0 ? <div className="rounded-md border border-dashed p-6 text-center"><p className="text-sm font-medium text-deep-600">No courses yet</p><p className="mt-1 text-sm text-gray-500">Create a course draft and submit it for academy review.</p><Button asChild size="sm" className="mt-4 bg-deep-600 text-white hover:bg-deep-700"><Link to="/partner-courses">Create your first course</Link></Button></div> : data.courses.slice(0, 6).map((course) => <div key={course.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"><div><p className="text-sm font-medium text-deep-600">{course.title}</p><p className="text-xs text-gray-500">Updated {new Date(course.updated_at).toLocaleDateString()}</p></div><Badge variant={course.status === 'published' ? 'secondary' : 'outline'}>{course.status.replace('_', ' ')}</Badge></div>)}</CardContent>
      </Card>
    </div>
  )
}

PartnerDashboard.propTypes = { user: PropTypes.object }

import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { emailService } from '../lib/emailService'

export default function ApplicationReview() {
  const [applications, setApplications] = useState([])
  const [cohorts, setCohorts] = useState([])
  const [cohortId, setCohortId] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [{ data: applicationData, error: applicationError }, { data: cohortData, error: cohortError }] = await Promise.all([
      supabase.from('academy_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('cohorts').select('id, name, status').in('status', ['planned', 'active']).order('start_date'),
    ])
    if (applicationError || cohortError) throw applicationError || cohortError
    setApplications(applicationData || [])
    setCohorts(cohortData || [])
    if (!cohortId && cohortData?.[0]) setCohortId(String(cohortData[0].id))
    setLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load().catch((error) => {
        toast.error(error.message || 'Unable to load applications')
        setLoading(false)
      })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const review = async (application, decision) => {
    if (decision === 'approved' && application.requested_role === 'Student' && !cohortId) {
      toast.error('Choose a cohort before approving a student')
      return
    }
    const reviewReason = decision === 'rejected' ? 'Application was not approved by the academy team.' : null
    const { error } = await supabase.rpc('review_academy_application', {
      p_application_id: application.id,
      p_decision: decision,
      p_cohort_id: decision === 'approved' && application.requested_role === 'Student' ? Number(cohortId) : null,
      p_track: decision === 'approved' && application.requested_role === 'Student' ? application.track : null,
      p_reason: reviewReason,
    })
    if (error) {
      toast.error(error.message)
      return
    }
    const notification = await emailService.sendApplicationStatusEmail(
      application.email,
      application.name,
      decision,
      reviewReason,
    )
    if (notification.success) {
      toast.success(`Application ${decision}; email sent`)
    } else {
      toast.error(`Application ${decision}, but the email could not be sent: ${notification.error}`)
    }
    load().catch((loadError) => toast.error(loadError.message))
  }

  if (loading) return <div className="py-12 text-center text-sm text-gray-500">Loading applications...</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-deep-600">Applications</h1>
        <p className="text-sm text-gray-500">Review student, teacher and partner applications in one queue.</p>
      </div>
      <Card className="mb-6">
        <CardContent className="flex items-center gap-3 p-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Student approval cohort</label>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={cohortId} onChange={(event) => setCohortId(event.target.value)}>
            <option value="">Select cohort</option>
            {cohorts.map((cohort) => <option key={cohort.id} value={cohort.id}>{cohort.name}</option>)}
          </select>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {applications.length === 0 && <p className="py-12 text-center text-sm text-gray-500">No applications yet.</p>}
        {applications.map((application) => (
          <Card key={application.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">{application.name}</CardTitle>
                <p className="text-sm text-gray-500">{application.email}{application.organisation ? ` · ${application.organisation}` : ''}</p>
              </div>
              <Badge>{application.status}</Badge>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
              <p className="text-xs text-gray-500">{application.requested_role}{application.track ? ` · ${application.track}` : ''}</p>
              {application.status === 'pending' && <div className="flex gap-2"><Button size="sm" onClick={() => review(application, 'approved')}><Check size={14} className="mr-1" /> Approve</Button><Button size="sm" variant="outline" onClick={() => review(application, 'rejected')}><X size={14} className="mr-1" /> Reject</Button></div>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

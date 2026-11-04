import { useEffect, useState } from 'react'
import { Award, CheckCircle, FileText, Target } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { supabase } from '../lib/supabase'
import { getCurrentProfile } from '../lib/profile'

export default function CapstoneSubmission() {
  const [assessment, setAssessment] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [repoUrl, setRepoUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getCurrentProfile()
        const { data: enrolment, error: enrolmentError } = await supabase.from('enrolments').select('cohort_id').eq('user_id', profile.id).in('status', ['enrolled', 'active']).maybeSingle()
        if (enrolmentError) throw enrolmentError
        if (!enrolment) return
        const { data: assessments, error: assessmentError } = await supabase.from('assessments').select('*, modules!inner(cohort_id)').eq('type', 'capstone').eq('modules.cohort_id', enrolment.cohort_id).order('created_at', { ascending: false }).limit(1)
        if (assessmentError) throw assessmentError
        const current = assessments?.[0]
        setAssessment(current || null)
        if (current) {
          const { data, error: submissionError } = await supabase.from('submissions').select('*').eq('user_id', profile.id).eq('assessment_id', current.id).order('created_at', { ascending: false })
          if (submissionError) throw submissionError
          setSubmissions(data || [])
        }
      } catch (loadError) { setError(loadError.message || 'Unable to load capstone') } finally { setLoading(false) }
    }
    load()
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    if (!assessment || !repoUrl) return
    setSaving(true); setError(''); setMessage('')
    const profile = await getCurrentProfile()
    const contentUrl = demoUrl ? `${repoUrl}\nDemo: ${demoUrl}\n${notes}` : `${repoUrl}\n${notes}`
    const { data, error: submitError } = await supabase.from('submissions').insert({ user_id: profile.id, assessment_id: assessment.id, content_url: contentUrl, status: 'submitted', submitted_at: new Date().toISOString() }).select().single()
    if (submitError) setError(submitError.message)
    else { setSubmissions((current) => [data, ...current]); setMessage('Capstone submitted for review.'); setRepoUrl(''); setDemoUrl(''); setNotes('') }
    setSaving(false)
  }

  const latest = submissions[0]
  return <div className="min-h-screen bg-gray-50"><div className="mb-6 flex items-center justify-between"><div><h1 className="text-2xl font-bold text-deep-600">Capstone Submission</h1><p className="text-sm text-gray-500">Submit your track deliverable for certification review.</p></div>{latest && <Badge variant="outline">{latest.status}</Badge>}</div>{error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}{loading && <p className="py-10 text-center text-sm text-gray-500">Loading capstone...</p>}{!loading && !assessment && <Card><CardContent className="py-12 text-center text-sm text-gray-500">No capstone assessment has been published for your cohort yet.</CardContent></Card>}{assessment && <div className="grid gap-6 lg:grid-cols-3"><Card className="lg:col-span-2"><CardHeader><CardTitle className="text-sm">{assessment.title}</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><label className="block text-xs font-medium">Repository URL<Input type="url" required value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} placeholder="https://github.com/..." /></label><label className="block text-xs font-medium">Demo URL (optional)<Input type="url" value={demoUrl} onChange={(event) => setDemoUrl(event.target.value)} /></label><label className="block text-xs font-medium">Notes<textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 w-full rounded-md border p-2 text-sm" /></label><Button type="submit" disabled={saving || latest?.status === 'submitted'}>{saving ? 'Submitting...' : latest?.status === 'submitted' ? 'Submitted' : 'Submit for review'}</Button></form></CardContent></Card><Card><CardHeader><CardTitle className="text-sm">Certification pathway</CardTitle></CardHeader><CardContent className="space-y-4 text-xs text-gray-500"><p><CheckCircle size={15} className="mr-2 inline text-emerald-600" />Panel review follows submission.</p><p><Target size={15} className="mr-2 inline text-indigo-600" />Skills profile supports placement.</p><p><Award size={15} className="mr-2 inline text-amber-600" />Certificate follows approval.</p><p><FileText size={15} className="mr-2 inline text-slate-600" />{submissions.length} submission version{submissions.length === 1 ? '' : 's'} recorded.</p></CardContent></Card></div>}</div>
}

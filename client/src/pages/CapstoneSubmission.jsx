import { useEffect, useState } from 'react'
import { Award, CheckCircle, FileText, Target } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { api } from '../lib/backend'
import { getCurrentProfile } from '../lib/profile'
import { Breadcrumb } from '../components/ui/breadcrumb'

export default function CapstoneSubmission() {
  const [assessment, setAssessment] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [repoUrl, setRepoUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getCurrentProfile()
        const { data: enrolment, error: enrolmentError } = await api.from('enrolments').select('cohort_id').eq('user_id', profile.id).in('status', ['enrolled', 'active']).maybeSingle()
        if (enrolmentError) throw enrolmentError
        if (!enrolment) return
        const { data: assessments, error: assessmentError } = await api.from('assessments').select('*, modules!inner(cohort_id)').eq('type', 'capstone').eq('modules.cohort_id', enrolment.cohort_id).order('created_at', { ascending: false }).limit(1)
        if (assessmentError) throw assessmentError
        const current = assessments?.[0]
        setAssessment(current || null)
        if (current) {
          const { data, error: submissionError } = await api.from('submissions').select('*').eq('user_id', profile.id).eq('assessment_id', current.id).order('created_at', { ascending: false })
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
    const contentUrl = `${repoUrl}\n${notes}`
    const { data, error: submitError } = await api.from('submissions').insert({ user_id: profile.id, assessment_id: assessment.id, content_url: contentUrl, status: 'submitted', submitted_at: new Date().toISOString() }).select().single()
    if (submitError) setError(submitError.message)
    else { setSubmissions((current) => [data, ...current]); setMessage('Capstone submitted for review.'); setRepoUrl(''); setNotes('') }
    setSaving(false)
  }

  const latest = submissions[0]
  return (
    <div className="w-full space-y-6">
      <Breadcrumb items={[{ label: 'Capstone Submission' }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Capstone Submission</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Submit your track deliverable for certification review.
          </p>
        </div>
        {latest && <Badge variant="outline">{latest.status}</Badge>}
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      {message && (
        <p className="mb-4 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          {message}
        </p>
      )}

      {loading && <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Loading capstone...</p>}

      {!loading && !assessment && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            No capstone assessment has been published for your cohort yet.
          </CardContent>
        </Card>
      )}

      {assessment && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">{assessment.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Repository URL
                  <Input
                    type="url"
                    required
                    value={repoUrl}
                    onChange={(event) => setRepoUrl(event.target.value)}
                    placeholder="https://github.com/..."
                    className="mt-1"
                  />
                </label>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Notes
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-deep-600"
                    placeholder="Key architectural choices, deployment links, or notes for the faculty panel."
                  />
                </label>
                <Button type="submit" disabled={saving || latest?.status === 'submitted'}>
                  {saving ? 'Submitting...' : latest?.status === 'submitted' ? 'Submitted' : 'Submit for review'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Certification pathway</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-gray-500 dark:text-gray-400">
              <p className="flex items-center gap-2">
                <CheckCircle size={15} className="text-emerald-600 shrink-0" />
                <span>Panel review follows submission.</span>
              </p>
              <p className="flex items-center gap-2">
                <Target size={15} className="text-brand-600 shrink-0" />
                <span>Skills profile supports placement.</span>
              </p>
              <p className="flex items-center gap-2">
                <Award size={15} className="text-amber-600 shrink-0" />
                <span>Certificate follows approval.</span>
              </p>
              <p className="flex items-center gap-2">
                <FileText size={15} className="text-slate-600 shrink-0" />
                <span>{submissions.length} submission version{submissions.length === 1 ? '' : 's'} recorded.</span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

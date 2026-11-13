import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { api } from '../lib/backend'
import { getCurrentProfile } from '../lib/profile'

const SUBMISSION_STATUS_CONFIG = {
  submitted: { label: 'Submitted', variant: 'default', color: 'text-brand-600' },
  graded: { label: 'Graded', variant: 'secondary', color: 'text-emerald-600' },
  remediation: { label: 'Remediation Required', variant: 'outline', color: 'text-amber-600' },
  failed: { label: 'Failed', variant: 'destructive', color: 'text-red-600' },
}

export default function SubmissionFeedback() {
  const navigate = useNavigate()
  const { submissionId } = useParams()
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSubmission()
  }, [submissionId])

  const loadSubmission = async () => {
    if (!submissionId) return
    try {
      const { data, error } = await api
        .from('submissions')
        .select(`
          *,
          labs (title, lessons (module_id, modules (domain))),
          assessments (title, module_id),
          users!submissions_user_id_fkey (name, email)
        `)
        .eq('id', submissionId)
        .single()

      if (error) throw error
      setSubmission(data)
    } catch (err) {
      setError(err.message || 'Unable to load submission')
    } finally {
      setLoading(false)
    }
  }

  const submitRemediation = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const profile = await getCurrentProfile()
      if (!profile) throw new Error('Profile not found')

      const { error: updateError } = await api
        .from('submissions')
        .update({
          status: 'submitted',
          content_url: e.target.elements['remediation_url'].value || submission.content_url,
          submitted_at: new Date().toISOString(),
          feedback: null, // Clear old feedback on resubmission
        })
        .eq('id', submissionId)

      if (updateError) throw updateError

      setSubmission({ ...submission, status: 'submitted', feedback: null })
    } catch (updateError) {
      setError(updateError.message || 'Unable to resubmit')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !submission) {
    return (
      <div className="w-full py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-deep-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Loading submission...</span>
        </div>
      </div>
    )
  }

  const statusConfig = SUBMISSION_STATUS_CONFIG[submission.status] || { label: submission.status, variant: 'secondary', color: 'text-gray-600' }
  const isLab = !!submission.labs
  const itemTitle = submission.labs?.title || submission.assessments?.title || 'Unknown Assignment'
  const itemDomain = submission.labs?.lessons?.modules?.domain || ''

  return (
    <div className="w-full space-y-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-medium text-deep-600 dark:text-deep-400 hover:text-deep-700 dark:hover:text-deep-300"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <h1 className="ml-4 text-2xl font-bold text-gray-900 dark:text-white">Submission Feedback</h1>
          </div>
          <Badge variant={statusConfig.variant} className={statusConfig.color}>
            {statusConfig.label}
          </Badge>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {itemTitle} • {isLab ? 'Lab' : 'Assessment'} {itemDomain ? `· ${itemDomain}` : ''}
        </p>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="max-w-2xl mx-auto p-4 lg:p-6">
        {/* Submission Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Submission Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-deep-600">Title</span>
              <span className="text-sm font-medium text-gray-700">{itemTitle}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-deep-600">Type</span>
              <span className="text-sm text-gray-600">{isLab ? 'Lab Workspace' : 'Assessment'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-deep-600">Domain</span>
              <span className="text-sm text-gray-600">{itemDomain || 'General'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-deep-600">Student</span>
              <span className="text-sm text-gray-600">{submission.users?.name || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-deep-600">Submitted</span>
              <span className="text-sm text-gray-600">{submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-deep-600">Score</span>
              <span className={`text-sm font-bold ${submission.score ? 'text-emerald-600' : 'text-gray-600'}`}>
                {submission.score !== null && submission.score !== undefined ? `${submission.score}` : 'Not graded'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-deep-600">Content URL</span>
              <a
                href={submission.content_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-brand-600 hover:underline break-all"
              >
                {submission.content_url || 'No URL provided'}
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Section */}
        {submission.status === 'graded' || submission.status === 'remediation' || submission.status === 'failed' ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Instructor Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-emerald-50 rounded-lg border border-emerald-100 p-4">
                <p className="text-sm text-emerald-800 whitespace-pre-wrap">{submission.feedback || 'No detailed feedback provided.'}</p>
              </div>
              {submission.graded_at && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-500">Graded on</span>
                  <span className="text-xs text-gray-500">{new Date(submission.graded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-deep-600">Current Status</span>
                <Badge variant={statusConfig.variant} className={statusConfig.color}>
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                {submission.status === 'submitted'
                  ? 'Your submission is pending review. Your instructor will grade it soon.'
                  : submission.status === 'remediation'
                  ? 'Your submission needs remediation. Please review the feedback and resubmit.'
                  : submission.status === 'failed'
                  ? 'Your submission did not meet the requirements. Please review and resubmit.'
                  : 'Your submission has been received.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Resubmission Form (for remediation/failed status) */}
        {(submission.status === 'remediation' || submission.status === 'failed') && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Resubmit Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Please address the feedback above and resubmit your work.
              </p>
              <form onSubmit={submitRemediation} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-deep-600 uppercase tracking-wider">Repository / Content URL</label>
                  <Input
                    type="url"
                    name="remediation_url"
                    value={submission.content_url || ''}
                    onChange={() => {}}
                    placeholder="https://github.com/yourusername/repo"
                    required
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-deep-600 uppercase tracking-wider">Notes (optional)</label>
                  <Textarea
                    name="remediation_notes"
                    placeholder="Any notes for your instructor about this resubmission..."
                    rows={3}
                    disabled={saving}
                  />
                </div>
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? 'Resubmitting...' : 'Resubmit Assignment'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BarChart3, Save } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { supabase } from '../lib/supabase'
import { getCurrentProfile } from '../lib/profile'

const statusLabels = {
  submitted: 'Submitted',
  graded: 'Graded',
  remediation: 'Remediation',
  passed: 'Passed',
  failed: 'Failed',
}

export default function Grading() {
  const [submissions, setSubmissions] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [searchParams] = useSearchParams()

  const loadSubmissions = async () => {
    const { data, error: loadError } = await supabase
      .from('submissions')
      .select('id, user_id, lab_id, assessment_id, status, score, feedback, content_url, submitted_at, users(name, email), labs(title), assessments(title)')
      .order('submitted_at', { ascending: false })
    if (loadError) throw loadError
    setSubmissions(data || [])
    const requestedId = Number(searchParams.get('submission'))
    if (requestedId && data?.some((submission) => submission.id === requestedId)) {
      const requested = data.find((submission) => submission.id === requestedId)
      setSelectedId(requested.id)
      setScore(requested.score ?? '')
      setFeedback(requested.feedback || '')
    }
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        await loadSubmissions()
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Unable to load submissions')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [searchParams])

  const selectSubmission = (submission) => {
    setSelectedId(submission.id)
    setScore(submission.score ?? '')
    setFeedback(submission.feedback || '')
    setSaved(false)
  }

  const saveGrade = async () => {
    if (!selectedId || score === '' || Number(score) < 0 || Number(score) > 100) {
      setError('Enter a score between 0 and 100 before saving')
      return
    }
    setSaving(true)
    setError('')
    const status = Number(score) >= 70 ? 'passed' : 'remediation'
    const profile = await getCurrentProfile()
    const { data, error: updateError } = await supabase
      .from('submissions')
      .update({
        score: Number(score),
        feedback: feedback.trim() || null,
        status,
        graded_by: profile?.id || null,
        graded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedId)
      .select('id, status, score, feedback, graded_at')
      .single()
    if (updateError) {
      setError(updateError.message)
    } else {
      setSubmissions((current) => current.map((submission) => submission.id === selectedId ? { ...submission, ...data } : submission))
      setSaved(true)
    }
    setSaving(false)
  }

  const selected = submissions.find((submission) => submission.id === selectedId)
  const gradedCount = submissions.filter((submission) => Number.isFinite(submission.score)).length
  const average = gradedCount ? Math.round(submissions.filter((submission) => Number.isFinite(submission.score)).reduce((total, submission) => total + submission.score, 0) / gradedCount) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-deep-600">Grading Console</h1>
        <p className="text-sm text-gray-500">Review real student submissions, record scores and provide feedback.</p>
      </div>
      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {saved && <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">Grade saved successfully.</p>}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-2xl font-bold text-deep-600">{submissions.length}</p><p className="text-xs uppercase tracking-wider text-gray-500">Submissions</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold text-deep-600">{gradedCount}</p><p className="text-xs uppercase tracking-wider text-gray-500">Graded</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold text-deep-600">{average === null ? 'N/A' : `${average}%`}</p><p className="text-xs uppercase tracking-wider text-gray-500">Average Score</p></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Student submissions</CardTitle></CardHeader>
          <CardContent className="space-y-2 p-3">
            {loading && <p className="p-4 text-sm text-gray-500">Loading submissions...</p>}
            {!loading && submissions.length === 0 && <p className="p-4 text-sm text-gray-500">No submissions are waiting for review.</p>}
            {submissions.map((submission) => <button key={submission.id} type="button" onClick={() => selectSubmission(submission)} className={`w-full rounded-lg border p-3 text-left ${selectedId === submission.id ? 'border-brand-300 bg-brand-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}>
              <div className="flex items-center justify-between gap-2"><p className="truncate text-xs font-medium text-deep-600">{submission.users?.name || submission.users?.email || 'Student'}</p><Badge variant="outline">{statusLabels[submission.status] || submission.status}</Badge></div>
              <p className="mt-1 truncate text-[10px] text-gray-500">{submission.labs?.title || submission.assessments?.title || 'Assessment submission'}</p>
              <p className="mt-1 text-[10px] text-gray-400">{submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'No date'}</p>
            </button>)}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">{selected ? `Grade: ${selected.users?.name || 'Student'}` : 'Select a submission'}</CardTitle></CardHeader>
          {selected ? <><CardContent className="space-y-4">
            <div className="rounded-lg border border-gray-100 bg-white p-3"><p className="text-xs font-medium text-deep-600">{selected.labs?.title || selected.assessments?.title || 'Assessment submission'}</p><p className="mt-1 text-xs text-gray-500">{selected.content_url || 'No submission link provided.'}</p></div>
            <div className="flex items-center gap-3"><label htmlFor="score" className="text-xs font-medium text-deep-600">Score</label><Input id="score" type="number" min="0" max="100" value={score} onChange={(event) => setScore(event.target.value)} className="w-24" placeholder="0-100" /><span className="text-xs text-gray-500">Pass mark: 70</span></div>
            <div><label htmlFor="feedback" className="mb-2 block text-xs font-medium text-deep-600">Feedback</label><textarea id="feedback" value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={5} className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm" placeholder="Add clear feedback for the student" /></div>
          </CardContent><CardFooter className="justify-end"><Button onClick={saveGrade} disabled={saving}><Save size={14} className="mr-2" />{saving ? 'Saving...' : 'Save grade'}</Button></CardFooter></> : <CardContent className="py-16 text-center text-sm text-gray-500"><BarChart3 size={24} className="mx-auto mb-2 text-gray-400" />Choose a submission to review.</CardContent>}
        </Card>
      </div>
    </div>
  )
}

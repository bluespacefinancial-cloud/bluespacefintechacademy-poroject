import { useCallback, useEffect, useState } from 'react'
import { CheckCircle, ClipboardList, Save } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { supabase } from '../lib/supabase'

export default function Grading() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [submissions, setSubmissions] = useState([])
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadSubmissions = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from('submissions')
      .select('id, user_id, lab_id, assessment_id, status, content_url, score, feedback, submitted_at, labs(title, max_score), assessments(title, max_score), users(name, email)')
      .in('status', ['submitted', 'graded', 'remediation'])
      .order('submitted_at', { ascending: false })
    if (loadError) throw loadError
    const rows = data || []
    setSubmissions(rows)
    const requestedId = Number(searchParams.get('submission'))
    const current = rows.find((row) => row.id === requestedId) || rows[0] || null
    setSelected(current)
    setScore(current?.score === null || current?.score === undefined ? '' : String(current.score))
    setFeedback(current?.feedback || '')
  }, [searchParams])

  useEffect(() => {
    let mounted = true
    Promise.resolve().then(loadSubmissions).catch((loadError) => mounted && setError(loadError.message || 'Unable to load submissions.')).finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [loadSubmissions])

  function choose(submission) {
    setSelected(submission)
    setScore(submission.score === null || submission.score === undefined ? '' : String(submission.score))
    setFeedback(submission.feedback || '')
    setMessage('')
    setError('')
  }

  async function saveGrade(status) {
    if (!selected) return
    const numericScore = Number(score)
    const maxScore = selected.labs?.max_score || selected.assessments?.max_score || 100
    if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > maxScore) {
      setError(`Enter a score between 0 and ${maxScore}.`)
      return
    }
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const { data, error: updateError } = await supabase.from('submissions').update({
        score: numericScore,
        feedback: feedback.trim() || null,
        status,
        graded_by: user.id,
        graded_at: new Date().toISOString(),
      }).eq('id', selected.id).select('id, user_id, lab_id, assessment_id, status, content_url, score, feedback, submitted_at, labs(title, max_score), assessments(title, max_score), users(name, email)').single()
      if (updateError) throw updateError
      setSubmissions((previous) => previous.map((row) => row.id === data.id ? data : row))
      setSelected(data)
      setMessage(status === 'graded' ? 'Grade saved.' : 'Remediation requested.')
    } catch (saveError) {
      setError(saveError.message || 'Unable to save this grade.')
    } finally {
      setSaving(false)
    }
  }

  const title = (item) => item.labs?.title || item.assessments?.title || 'Submission'
  return <div className="min-h-screen bg-gray-50">
    <div className="mb-6"><h1 className="text-2xl font-bold text-deep-600">Grading Console</h1><p className="mt-1 text-sm text-gray-500">Review student work and record scores and feedback.</p></div>
    {error && <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p role="status" className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
    {loading ? <p className="py-12 text-center text-sm text-gray-500">Loading submissions…</p> : <div className="grid gap-5 lg:grid-cols-3">
      <Card><CardHeader><CardTitle className="text-sm">Submissions ({submissions.length})</CardTitle></CardHeader><CardContent className="space-y-2">{submissions.length === 0 ? <p className="text-sm text-gray-500">No submissions are ready for review.</p> : submissions.map((item) => <button key={item.id} type="button" onClick={() => choose(item)} className={`w-full rounded-md border p-3 text-left ${selected?.id === item.id ? 'border-brand-300 bg-brand-50' : 'border-gray-100 hover:bg-gray-50'}`}><span className="block text-sm font-medium text-deep-600">{title(item)}</span><span className="mt-1 block text-xs text-gray-500">{item.users?.name || item.users?.email || 'Student'}</span><Badge variant="outline" className="mt-2">{item.status}</Badge></button>)}</CardContent></Card>
      <Card className="lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><ClipboardList size={16} />{selected ? title(selected) : 'Select a submission'}</CardTitle></CardHeader><CardContent>{selected ? <div className="space-y-4"><p className="text-sm text-gray-600">Submitted by {selected.users?.name || selected.users?.email || 'Student'}</p>{selected.content_url && <a href={selected.content_url} target="_blank" rel="noreferrer" className="break-all text-sm text-brand-700 underline">Open submitted work</a>}<Input type="number" min="0" max={selected.labs?.max_score || selected.assessments?.max_score || 100} value={score} onChange={(event) => setScore(event.target.value)} placeholder="Score" aria-label="Score" /><textarea rows={5} value={feedback} onChange={(event) => setFeedback(event.target.value)} className="w-full rounded-md border p-3 text-sm" placeholder="Feedback for the student" aria-label="Feedback" /><div className="flex flex-wrap gap-2"><Button disabled={saving} onClick={() => saveGrade('graded')}><Save size={14} className="mr-2" />{saving ? 'Saving…' : 'Save grade'}</Button><Button variant="outline" disabled={saving} onClick={() => saveGrade('remediation')}><CheckCircle size={14} className="mr-2" />Request remediation</Button></div></div> : <p className="py-12 text-center text-sm text-gray-500">Select a submission to review.</p>}</CardContent></Card>
    </div>}
  </div>
}

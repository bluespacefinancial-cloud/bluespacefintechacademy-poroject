/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, FileText } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { supabase } from '../lib/supabase'

const label = { submitted: 'Pending review', graded: 'Reviewed', passed: 'Approved', failed: 'Rejected', remediation: 'Remediation' }

export default function PanelReview() {
  const [submissions, setSubmissions] = useState([])
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [issuing, setIssuing] = useState(false)
  const [issued, setIssued] = useState(false)

  const load = async () => {
    const [{ data, error: submissionError }, { data: users, error: usersError }, { data: assessments, error: assessmentError }] = await Promise.all([
      supabase.from('submissions').select('*').not('assessment_id', 'is', null).order('submitted_at', { ascending: false }),
      supabase.from('users').select('id, name, email'),
      supabase.from('assessments').select('id, title').eq('type', 'capstone'),
    ])
    if (submissionError) throw submissionError
    if (usersError) throw usersError
    if (assessmentError) throw assessmentError
    const userMap = new Map((users || []).map((user) => [user.id, user]))
    const assessmentMap = new Map((assessments || []).map((assessment) => [assessment.id, assessment.title]))
    setSubmissions((data || []).map((item) => ({ ...item, fellow: userMap.get(item.user_id), title: assessmentMap.get(item.assessment_id) || 'Assessment submission' })))
  }
  useEffect(() => { load().catch((loadError) => setError(loadError.message || 'Unable to load reviews')).finally(() => setLoading(false)) }, [])

  const choose = (submission) => { setSelected(submission); setScore(submission.score ?? ''); setFeedback(submission.feedback || '') }
  const save = async (status) => {
    if (!selected || score === '') { setError('Enter a score before saving the review'); return }
    const { data, error: updateError } = await supabase.from('submissions').update({ score: Number(score), feedback: feedback.trim() || null, status, graded_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', selected.id).select().single()
    if (updateError) { setError(updateError.message); return }
    setSubmissions((current) => current.map((item) => item.id === selected.id ? { ...item, ...data } : item)); setSelected({ ...selected, ...data })
  }
  const issueCertificate = async () => {
    if (!selected || selected.status !== 'passed') return
    setIssuing(true); setError('')
    try {
      const { data: assessment, error: assessmentError } = await supabase.from('assessments').select('module_id, modules(cohort_id)').eq('id', selected.assessment_id).single()
      if (assessmentError) throw assessmentError
      const { data: enrolment, error: enrolmentError } = await supabase.from('enrolments').select('cohort_id, track').eq('user_id', selected.user_id).in('status', ['enrolled', 'active', 'completed']).order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (enrolmentError) throw enrolmentError
      const cohortId = enrolment?.cohort_id || assessment.modules?.cohort_id
      if (!cohortId) throw new Error('The student does not have a cohort for certification')
      const { data: certification, error: upsertError } = await supabase.from('certifications').upsert({ user_id: selected.user_id, cohort_id: cohortId, track: enrolment?.track || 'Finsoft', status: 'pending', final_grade: Number(score) }, { onConflict: 'user_id,cohort_id,track' }).select('id').single()
      if (upsertError) throw upsertError
      const { error: issueError } = await supabase.rpc('issue_certificate', { p_certification_id: certification.id })
      if (issueError) throw issueError
      setIssued(true)
    } catch (issueError) { setError(issueError.message || 'Unable to issue certificate') } finally { setIssuing(false) }
  }
  const filtered = useMemo(() => submissions.filter((item) => (!search || `${item.fellow?.name || ''} ${item.title}`.toLowerCase().includes(search.toLowerCase())) && (filter === 'all' || item.status === filter)), [submissions, search, filter])

  return <div className="min-h-screen bg-gray-50"><div className="mb-6"><h1 className="text-2xl font-bold text-deep-600">Panel Review</h1><p className="text-sm text-gray-500">Review live capstone submissions and record certification decisions.</p></div>{error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}{issued && <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">Certificate issued and available for verification.</p>}<div className="mb-5 flex gap-3"><Input placeholder="Search fellow or assessment" value={search} onChange={(event) => setSearch(event.target.value)} /><Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="submitted">Pending</SelectItem><SelectItem value="passed">Approved</SelectItem><SelectItem value="remediation">Remediation</SelectItem><SelectItem value="failed">Rejected</SelectItem></SelectContent></Select></div><div className="grid gap-6 lg:grid-cols-3"><Card><CardHeader><CardTitle className="text-sm">Submissions ({submissions.length})</CardTitle></CardHeader><CardContent className="space-y-2">{loading && <p className="text-sm text-gray-500">Loading...</p>}{!loading && filtered.length === 0 && <p className="text-sm text-gray-500">No capstone submissions found.</p>}{filtered.map((item) => <button key={item.id} type="button" onClick={() => { choose(item); setIssued(false) }} className={`w-full rounded border p-3 text-left ${selected?.id === item.id ? 'border-brand-300 bg-brand-50' : 'border-gray-100'}`}><p className="text-xs font-medium">{item.fellow?.name || item.fellow?.email || 'Student'}</p><p className="text-[10px] text-gray-500">{item.title}</p><Badge variant="outline" className="mt-2">{label[item.status] || item.status}</Badge></button>)}</CardContent></Card><Card className="lg:col-span-2"><CardHeader><CardTitle className="text-sm">{selected ? `${selected.fellow?.name || 'Student'} · ${selected.title}` : 'Select a submission'}</CardTitle></CardHeader>{selected ? <CardContent className="space-y-4"><p className="rounded border p-3 text-xs text-gray-600">{selected.content_url || 'No deliverable URL provided.'}</p><Input type="number" min="0" max="100" placeholder="Score 0-100" value={score} onChange={(event) => setScore(event.target.value)} /><textarea rows={5} value={feedback} onChange={(event) => setFeedback(event.target.value)} className="w-full rounded border p-2 text-sm" placeholder="Panel feedback" /><div className="flex flex-wrap gap-2"><Button onClick={() => save('passed')}>Approve</Button><Button variant="outline" onClick={() => save('remediation')}>Request remediation</Button><Button variant="destructive" onClick={() => save('failed')}>Reject</Button>{selected.status === 'passed' && <Button variant="secondary" onClick={issueCertificate} disabled={issuing || issued}>{issued ? 'Certificate issued' : issuing ? 'Issuing...' : 'Issue certificate'}</Button>}</div></CardContent> : <CardContent className="py-16 text-center text-sm text-gray-500"><ClipboardList size={24} className="mx-auto mb-2" />Choose a capstone submission to review.</CardContent>}</Card></div><p className="mt-4 text-xs text-gray-500"><FileText size={13} className="mr-1 inline" />Panel decisions are stored on the submission record and feed certification readiness.</p></div>
}

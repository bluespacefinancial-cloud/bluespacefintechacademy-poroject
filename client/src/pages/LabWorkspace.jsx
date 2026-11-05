import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BookOpen, ExternalLink, FileText, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { supabase } from '../lib/supabase'

export default function LabWorkspace() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [labs, setLabs] = useState([])
  const [submissions, setSubmissions] = useState({})
  const [urls, setUrls] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadLabs() {
      if (!supabase || !user?.id) {
        setError('Your academy profile is not available. Sign in again to continue.')
        setLoading(false)
        return
      }
      try {
        const { data: enrolments, error: enrolmentError } = await supabase
          .from('enrolments')
          .select('cohort_id, track')
          .eq('user_id', user.id)
          .in('status', ['enrolled', 'active'])
        if (enrolmentError) throw enrolmentError
        const cohortIds = [...new Set((enrolments || []).map((item) => item.cohort_id))]
        if (!cohortIds.length) {
          if (!cancelled) setLabs([])
          return
        }

        const { data: modules, error: modulesError } = await supabase
          .from('modules')
          .select('id, cohort_id, track, title, domain')
          .in('cohort_id', cohortIds)
        if (modulesError) throw modulesError
        const moduleIds = (modules || [])
          .filter((module) => !module.track || module.track === 'All' || enrolments.some((entry) => entry.cohort_id === module.cohort_id && entry.track === module.track))
          .map((module) => module.id)
        if (!moduleIds.length) {
          if (!cancelled) setLabs([])
          return
        }

        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('id, title, module_id')
          .in('module_id', moduleIds)
          .eq('type', 'lab')
        if (lessonsError) throw lessonsError
        const lessonIds = (lessons || []).map((lesson) => lesson.id)
        if (!lessonIds.length) {
          if (!cancelled) setLabs([])
          return
        }

        const { data: labRows, error: labsError } = await supabase
          .from('labs')
          .select('id, lesson_id, title, instructions, starter_code, due_date, max_score')
          .in('lesson_id', lessonIds)
          .order('created_at', { ascending: false })
        if (labsError) throw labsError
        const lessonById = Object.fromEntries((lessons || []).map((lesson) => [lesson.id, lesson]))
        const moduleById = Object.fromEntries((modules || []).map((module) => [module.id, module]))
        const visibleLabs = (labRows || []).map((lab) => {
          const lesson = lessonById[lab.lesson_id]
          return { ...lab, lesson, module: moduleById[lesson?.module_id] }
        })
        if (!visibleLabs.length) {
          if (!cancelled) setLabs([])
          return
        }
        const { data: submissionRows, error: submissionError } = await supabase
          .from('submissions')
          .select('id, lab_id, status, content_url, score, feedback, submitted_at')
          .eq('user_id', user.id)
          .in('lab_id', visibleLabs.map((lab) => lab.id))
          .order('submitted_at', { ascending: false })
        if (submissionError) throw submissionError
        const latest = {}
        for (const submission of submissionRows || []) {
          if (!latest[submission.lab_id]) latest[submission.lab_id] = submission
        }
        if (!cancelled) {
          setLabs(visibleLabs)
          setSubmissions(latest)
          setUrls(Object.fromEntries(Object.values(latest).map((item) => [item.lab_id, item.content_url || ''])))
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Unable to load your labs.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadLabs()
    return () => { cancelled = true }
  }, [user?.id])

  const orderedLabs = useMemo(() => labs, [labs])

  async function submitLab(event, lab) {
    event.preventDefault()
    setSaving(lab.id)
    setError('')
    setMessage('')
    try {
      const payload = {
        user_id: user.id,
        lab_id: lab.id,
        status: 'submitted',
        content_url: urls[lab.id]?.trim(),
        submitted_at: new Date().toISOString(),
      }
      const request = supabase.from('submissions').insert(payload)
      const { data, error: submitError } = await request.select('id, lab_id, status, content_url, score, feedback, submitted_at').single()
      if (submitError) throw submitError
      setSubmissions((previous) => ({ ...previous, [lab.id]: data }))
      setMessage(`Submitted “${lab.title}” for review.`)
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit this lab.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-deep-600">Lab Workspace</h1>
          <p className="mt-1 text-sm text-gray-500">Complete and submit the labs assigned to your cohort.</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/my-learning')}><ArrowLeft size={14} className="mr-2" />My learning</Button>
      </div>
      {error && <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
      {loading ? <p className="py-12 text-center text-sm text-gray-500">Loading your labs…</p> : orderedLabs.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><BookOpen className="mx-auto mb-3 text-gray-400" size={24} /><p className="text-sm text-gray-600">No labs are assigned to your active cohort yet.</p></CardContent></Card>
      ) : <div className="grid gap-4 lg:grid-cols-2">
        {orderedLabs.map((lab) => {
          const submission = submissions[lab.id]
          return <Card key={lab.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div><CardTitle className="flex items-center gap-2 text-base"><FileText size={16} />{lab.title}</CardTitle><p className="mt-1 text-xs text-gray-500">{lab.module?.title || lab.lesson?.title}{lab.module?.domain ? ` · ${lab.module.domain}` : ''}</p></div>
              <Badge variant={submission?.status === 'graded' ? 'secondary' : submission?.status === 'submitted' ? 'default' : 'outline'}>{submission?.status || 'Not submitted'}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {lab.instructions && <details><summary className="cursor-pointer text-sm font-medium text-brand-700">Read instructions</summary><div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">{lab.instructions}</div></details>}
              {lab.starter_code && <details><summary className="cursor-pointer text-sm font-medium text-brand-700">View starter code</summary><pre className="mt-3 max-h-64 overflow-auto rounded bg-gray-900 p-3 text-xs text-gray-100">{lab.starter_code}</pre></details>}
              {submission?.feedback && <div className="rounded bg-gray-50 p-3 text-sm text-gray-700"><strong>Reviewer feedback:</strong> {submission.feedback}</div>}
              {submission?.score !== null && submission?.score !== undefined && <p className="text-sm font-medium text-emerald-700">Score: {submission.score}/{lab.max_score}</p>}
              <form onSubmit={(event) => submitLab(event, lab)} className="space-y-3">
                <Input type="url" required value={urls[lab.id] || ''} onChange={(event) => setUrls((previous) => ({ ...previous, [lab.id]: event.target.value }))} placeholder="https://github.com/you/your-lab" aria-label={`Repository URL for ${lab.title}`} />
                <Button type="submit" disabled={saving === lab.id || submission?.status === 'graded'}><Send size={14} className="mr-2" />{saving === lab.id ? 'Submitting…' : submission?.status === 'submitted' ? 'Update submission' : 'Submit for review'}</Button>
                {lab.due_date && <a className="ml-3 inline-flex items-center gap-1 text-xs text-gray-500" href={urls[lab.id] || undefined}><ExternalLink size={12} />Due {new Date(lab.due_date).toLocaleDateString()}</a>}
              </form>
            </CardContent>
          </Card>
        })}
      </div>}
    </div>
  )
}

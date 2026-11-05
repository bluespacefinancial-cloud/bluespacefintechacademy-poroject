import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, ExternalLink, FileText, Send } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { supabase } from '../lib/supabase'
import { getCurrentProfile } from '../lib/profile'

export default function LabWorkspace() {
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
    const load = async () => {
      try {
        const profile = await getCurrentProfile()
        if (!profile) throw new Error('Your academy profile could not be found.')
        const { data: enrolment, error: enrolmentError } = await supabase
          .from('enrolments')
          .select('cohort_id, track')
          .eq('user_id', profile.id)
          .in('status', ['enrolled', 'active'])
          .maybeSingle()
        if (enrolmentError) throw enrolmentError
        if (!enrolment?.cohort_id) {
          if (!cancelled) setLabs([])
          return
        }

        const { data: moduleRows, error: moduleError } = await supabase
          .from('modules')
          .select('id, title, domain, stage')
          .eq('cohort_id', enrolment.cohort_id)
          .eq('is_published', true)
        if (moduleError) throw moduleError
        const moduleIds = (moduleRows || []).map((module) => module.id)
        if (!moduleIds.length) {
          if (!cancelled) setLabs([])
          return
        }

        const { data: lessonRows, error: lessonError } = await supabase
          .from('lessons')
          .select('id, module_id, title')
          .in('module_id', moduleIds)
        if (lessonError) throw lessonError
        const lessonIds = (lessonRows || []).map((lesson) => lesson.id)
        if (!lessonIds.length) {
          if (!cancelled) setLabs([])
          return
        }

        const { data: labRows, error: labError } = await supabase
          .from('labs')
          .select('id, lesson_id, title, instructions, starter_code, max_score, due_date')
          .in('lesson_id', lessonIds)
        if (labError) throw labError

        const { data: submissionRows, error: submissionError } = await supabase
          .from('submissions')
          .select('id, lab_id, status, content_url, score, feedback, submitted_at')
          .eq('user_id', profile.id)
          .in('lab_id', (labRows || []).map((lab) => lab.id))
        if (submissionError) throw submissionError

        const modulesById = new Map((moduleRows || []).map((module) => [module.id, module]))
        const lessonsById = new Map((lessonRows || []).map((lesson) => [lesson.id, lesson]))
        const enrichedLabs = (labRows || []).map((lab) => {
          const lesson = lessonsById.get(lab.lesson_id)
          const module = lesson ? modulesById.get(lesson.module_id) : null
          return { ...lab, lesson, module }
        })
        const submissionMap = {}
        const urlMap = {}
        ;(submissionRows || []).forEach((item) => {
          submissionMap[item.lab_id] = item
          if (item.content_url) urlMap[item.lab_id] = item.content_url
        })

        if (!cancelled) {
          setLabs(enrichedLabs)
          setSubmissions(submissionMap)
          setUrls(urlMap)
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Unable to load your labs.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const orderedLabs = [...labs].sort((first, second) => {
    if (!first.due_date && !second.due_date) return 0
    if (!first.due_date) return 1
    if (!second.due_date) return -1
    return new Date(first.due_date) - new Date(second.due_date)
  })

  const submitLab = async (event, lab) => {
    event.preventDefault()
    setSaving(lab.id)
    setError('')
    setMessage('')
    try {
      const profile = await getCurrentProfile()
      if (!profile) throw new Error('Your session has expired.')
      const existing = submissions[lab.id]
      const payload = {
        lab_id: lab.id,
        user_id: profile.id,
        content_url: urls[lab.id]?.trim(),
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      }

      const request = existing?.id
        ? supabase.from('submissions').update(payload).eq('id', existing.id)
        : supabase.from('submissions').insert(payload)
      const { data, error: submitError } = await request.select('id, lab_id, status, content_url, score, feedback, submitted_at').single()
      if (submitError) throw submitError
      setSubmissions((previous) => ({ ...previous, [lab.id]: data }))
      setMessage(`Submitted "${lab.title}" for review.`)
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit this lab.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 leading-tight">Lab Workspace</h1>
          <p className="mt-1 text-sm text-gray-500">Complete and submit the hands-on labs assigned to your active cohort.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/my-learning')} className="border-gray-200 shrink-0">
          <ArrowLeft size={14} className="mr-1.5" />
          My learning
        </Button>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}

      {loading ? (
        <div className="py-20 text-center">
          <p className="text-sm font-medium text-gray-500">Loading your labs...</p>
        </div>
      ) : orderedLabs.length === 0 ? (
        <Card className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden">
          <div className="py-16 text-center px-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-3">
              <BookOpen size={20} />
            </div>
            <h3 className="text-base font-bold text-gray-900">No labs assigned yet</h3>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-500 leading-relaxed">
              Hands-on lab exercises will appear here as your cohort progresses through each learning module.
            </p>
            <div className="mt-5">
              <Button size="sm" onClick={() => navigate('/my-learning')} className="bg-deep-600 text-white hover:bg-deep-700">
                Go to My Learning
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {orderedLabs.map((lab) => {
            const submission = submissions[lab.id]
            return (
              <Card key={lab.id} className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden">
                <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100">
                  <div className="min-w-0 flex-1">
                    <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 truncate">
                      <FileText size={16} className="text-deep-600 shrink-0" />
                      {lab.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 truncate">
                      {lab.module?.title || lab.lesson?.title}{lab.module?.domain ? ` • ${lab.module.domain}` : ''}
                    </p>
                  </div>
                  <Badge variant={submission?.status === 'graded' ? 'secondary' : submission?.status === 'submitted' ? 'default' : 'outline'} className="text-[11px] font-medium shrink-0 capitalize">
                    {submission?.status || 'Not submitted'}
                  </Badge>
                </div>
                <CardContent className="p-5 space-y-4">
                  {lab.instructions && (
                    <details className="rounded-lg border border-gray-100 p-3 bg-gray-50/50">
                      <summary className="cursor-pointer text-xs font-semibold text-deep-600 hover:text-deep-700">
                        Read instructions
                      </summary>
                      <div className="mt-3 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-gray-600">
                        {lab.instructions}
                      </div>
                    </details>
                  )}
                  {lab.starter_code && (
                    <details className="rounded-lg border border-gray-100 p-3 bg-gray-50/50">
                      <summary className="cursor-pointer text-xs font-semibold text-deep-600 hover:text-deep-700">
                        View starter code
                      </summary>
                      <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100 font-mono">
                        {lab.starter_code}
                      </pre>
                    </details>
                  )}
                  {submission?.feedback && (
                    <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-3.5 text-xs sm:text-sm text-gray-800">
                      <p className="font-semibold text-deep-900 mb-1">Reviewer feedback</p>
                      <p className="text-gray-700">{submission.feedback}</p>
                    </div>
                  )}
                  {submission?.score !== null && submission?.score !== undefined && (
                    <p className="text-xs sm:text-sm font-semibold text-emerald-700">
                      Score: {submission.score}/{lab.max_score}
                    </p>
                  )}
                  <form onSubmit={(event) => submitLab(event, lab)} className="space-y-3 pt-2">
                    <Input
                      type="url"
                      required
                      value={urls[lab.id] || ''}
                      onChange={(event) => setUrls((previous) => ({ ...previous, [lab.id]: event.target.value }))}
                      placeholder="https://github.com/your-username/your-lab"
                      aria-label={`Repository URL for ${lab.title}`}
                      className="text-xs sm:text-sm"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Button type="submit" size="sm" disabled={saving === lab.id || submission?.status === 'graded'} className="bg-deep-600 text-white hover:bg-deep-700">
                        <Send size={13} className="mr-1.5" />
                        {saving === lab.id ? 'Submitting...' : submission?.status === 'submitted' ? 'Update submission' : 'Submit for review'}
                      </Button>
                      {lab.due_date && (
                        <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                          <ExternalLink size={12} />
                          Due {new Date(lab.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

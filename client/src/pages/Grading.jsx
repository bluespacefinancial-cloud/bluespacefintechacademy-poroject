import { useCallback, useEffect, useState } from 'react'
import { ClipboardList, Save, Search, ExternalLink, Code2, AlertCircle } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { api } from '../lib/backend'
import DashboardHeader from '../components/dashboard/DashboardHeader'

const RUBRIC_PRESETS = [
  {
    label: '+ Modular Code',
    text: 'Clean, modular structure. Code is well-organized and follows idiomatic patterns.',
  },
  {
    label: '+ Edge Cases',
    text: 'Good core logic, but please add validation and error handling for edge cases and malformed payloads.',
  },
  {
    label: '+ Security / Env',
    text: 'Security alert: Ensure API credentials and database keys are never hardcoded; load via environment variables.',
  },
  {
    label: '+ Unit Tests',
    text: 'Please add automated unit test cases to verify transaction boundaries and calculation correctness.',
  },
]

export default function Grading() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [submissions, setSubmissions] = useState([])
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const [tab, setTab] = useState('pending') // 'pending' | 'all'
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadSubmissions = useCallback(async () => {
    try {
      const { data, error: loadError } = await api
        .from('submissions')
        .select(`
          id, user_id, lab_id, assessment_id, status, content_url, score, feedback, submitted_at,
          labs(title, max_score), assessments(title, max_score),
          users!submissions_user_id_fkey(name, email)
        `)
        .in('status', ['submitted', 'graded', 'remediation'])
        .order('submitted_at', { ascending: false })

      if (loadError) throw loadError
      const rows = data || []
      setSubmissions(rows)

      const requestedId = Number(searchParams.get('submission'))
      if (requestedId) {
        const found = rows.find((r) => r.id === requestedId)
        if (found) {
          choose(found)
          return
        }
      }

      // Default to first pending or first overall
      const firstPending = rows.find((r) => r.status === 'submitted') || rows[0] || null
      if (firstPending) {
        choose(firstPending)
      }
    } catch (err) {
      setError(err.message || 'Unable to load submissions.')
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    // Loading flag is set synchronously before the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSubmissions()
  }, [loadSubmissions])

  function choose(sub) {
    setSelected(sub)
    setScore(sub.score === null || sub.score === undefined ? '' : String(sub.score))
    setFeedback(sub.feedback || '')
    setMessage('')
    setError('')
  }

  function appendPreset(presetText) {
    setFeedback((prev) => {
      const trimmed = prev.trim()
      if (!trimmed) return presetText
      return `${trimmed}\n\n${presetText}`
    })
  }

  async function saveGrade(newStatus) {
    if (!selected) return
    const numericScore = Number(score)
    const maxScore = selected.labs?.max_score || selected.assessments?.max_score || 100

    if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > maxScore) {
      setError(`Score must be between 0 and ${maxScore}.`)
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const { data, error: updateError } = await api
        .from('submissions')
        .update({
          score: numericScore,
          feedback: feedback.trim() || null,
          status: newStatus,
          graded_by: user.id,
          graded_at: new Date().toISOString(),
        })
        .eq('id', selected.id)
        .select(`
          id, user_id, lab_id, assessment_id, status, content_url, score, feedback, submitted_at,
          labs(title, max_score), assessments(title, max_score),
          users!submissions_user_id_fkey(name, email)
        `)
        .single()

      if (updateError) throw updateError

      setSubmissions((prev) => prev.map((row) => (row.id === data.id ? data : row)))
      setSelected(data)
      setMessage(newStatus === 'graded' ? 'Grade and evaluation recorded successfully.' : 'Remediation requested from student.')
    } catch (saveError) {
      setError(saveError.message || 'Unable to record grade.')
    } finally {
      setSaving(false)
    }
  }

  const title = (item) => item?.labs?.title || item?.assessments?.title || 'Lab Deliverable'
  const maxScore = selected?.labs?.max_score || selected?.assessments?.max_score || 100

  const pendingSubmissions = submissions.filter((s) => s.status === 'submitted')
  const displayedSubmissions = submissions
    .filter((s) => (tab === 'pending' ? s.status === 'submitted' : true))
    .filter((s) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      const studentName = s.users?.name?.toLowerCase() || ''
      const studentEmail = s.users?.email?.toLowerCase() || ''
      const labTitle = title(s).toLowerCase()
      return studentName.includes(q) || studentEmail.includes(q) || labTitle.includes(q)
    })

  return (
    <div className="w-full space-y-6">
      <DashboardHeader
        title="Evaluation & Grading Center"
        subtitle="Review student code deliverables, inspect Git repositories, and provide rubric-aligned feedback."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-gray-200 text-gray-700 bg-white px-3 py-1 text-xs">
              {pendingSubmissions.length} Pending Review
            </Badge>
          </div>
        }
      />

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <p className="font-semibold">Error</p>
          <p className="mt-0.5">{error}</p>
        </div>
      )}

      {message && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
          <p className="font-semibold">Success</p>
          <p className="mt-0.5">{message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Submissions Queue (1/3) */}
        <Card className="border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden flex flex-col justify-between">
          <div>
            {/* Tab Controls & Search */}
            <div className="p-4 border-b border-gray-100 space-y-3 bg-gray-50/40">
              <div className="flex rounded-lg bg-gray-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setTab('pending')}
                  className={`flex-1 py-1.5 rounded-md text-center transition-all ${
                    tab === 'pending'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Pending ({pendingSubmissions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTab('all')}
                  className={`flex-1 py-1.5 rounded-md text-center transition-all ${
                    tab === 'all'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  All ({submissions.length})
                </button>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by student or lab..."
                  className="pl-8 text-xs h-8 border-gray-200 bg-white"
                />
              </div>
            </div>

            {/* Submissions List */}
            <CardContent className="p-2 max-h-[calc(100vh-280px)] overflow-y-auto space-y-1.5">
              {loading ? (
                <p className="py-12 text-center text-xs text-gray-500">Loading evaluation queue...</p>
              ) : displayedSubmissions.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500">
                  <ClipboardList size={24} className="mx-auto text-gray-300 mb-2" />
                  <p className="font-semibold text-gray-700">No submissions found</p>
                  <p className="mt-0.5 text-gray-400">
                    {tab === 'pending' ? 'All student submissions have been graded.' : 'No matching records found.'}
                  </p>
                </div>
              ) : (
                displayedSubmissions.map((sub) => {
                  const isSelected = selected?.id === sub.id
                  const isGraded = sub.status === 'graded'
                  const isRemediation = sub.status === 'remediation'

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => choose(sub)}
                      className={`w-full text-left p-3 rounded-lg border transition-all text-xs ${
                        isSelected
                          ? 'border-deep-600 bg-deep-50/30 shadow-sm'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/60 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-gray-900 truncate">{title(sub)}</span>
                        <Badge
                          variant={isGraded ? 'secondary' : isRemediation ? 'outline' : 'default'}
                          className={`text-[10px] capitalize shrink-0 ${
                            isRemediation ? 'text-amber-700 border-amber-200' : ''
                          }`}
                        >
                          {sub.status}
                        </Badge>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-gray-500">
                        <span className="truncate">{sub.users?.name || sub.users?.email || 'Student'}</span>
                        <span className="text-[10px]">
                          {new Date(sub.submitted_at).toLocaleDateString()}
                        </span>
                      </div>

                      {isGraded && (
                        <div className="mt-1.5 flex items-center gap-1 font-semibold text-emerald-700 text-[11px]">
                          <span>Score: {sub.score}/{sub.labs?.max_score || 100}</span>
                        </div>
                      )}
                    </button>
                  )
                })
              )}
            </CardContent>
          </div>
        </Card>

        {/* Right Column: Grading Console & Rubric (2/3) */}
        <Card className="lg:col-span-2 border border-gray-200/90 shadow-sm rounded-xl bg-white overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/40">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-deep-50 border border-deep-100 flex items-center justify-center text-deep-600 shrink-0">
                  <Code2 size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 truncate">
                    {selected ? title(selected) : 'Select a submission'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selected ? `Student: ${selected.users?.name || selected.users?.email}` : 'Choose from the left queue to evaluate'}
                  </p>
                </div>
              </div>

              {selected?.content_url && (
                <Button asChild size="sm" variant="outline" className="text-xs border-gray-200 shrink-0">
                  <a href={selected.content_url} target="_blank" rel="noreferrer">
                    <ExternalLink size={13} className="mr-1.5 text-deep-600" />
                    Open Repository
                  </a>
                </Button>
              )}
            </div>

            <CardContent className="p-5">
              {!selected ? (
                <div className="py-20 text-center text-sm text-gray-500">
                  <ClipboardList size={32} className="mx-auto text-gray-300 mb-2" />
                  <p>Select a student deliverable from the queue to start review.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Submission Details Bar */}
                  <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-gray-500">Submitted: </span>
                      <strong className="text-gray-900">
                        {new Date(selected.submitted_at).toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-500">Max Points: </span>
                      <strong className="text-gray-900">{maxScore} pts</strong>
                    </div>
                    <div>
                      <span className="text-gray-500">Current Status: </span>
                      <Badge variant="outline" className="capitalize text-[11px] ml-1">
                        {selected.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Score Input */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Awarded Score (0 to {maxScore})
                    </label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min="0"
                        max={maxScore}
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        placeholder={`e.g. ${maxScore}`}
                        className="w-36 font-bold text-sm"
                      />
                      <span className="text-xs text-gray-500 font-medium">/ {maxScore} points</span>
                    </div>
                  </div>

                  {/* Rubric Feedback Presets */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                        Instructor Feedback & Rubric Guidance
                      </label>
                      <span className="text-[11px] text-gray-500">Click a preset to insert</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2.5">
                      {RUBRIC_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => appendPreset(preset.text)}
                          className="px-2.5 py-1 rounded-md border border-gray-200 bg-white text-[11px] font-semibold text-gray-700 hover:border-deep-600 hover:text-deep-700 hover:bg-deep-50/30 transition-all shadow-2xs"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={6}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Write constructive evaluation notes, point deductions, or praise for clean fintech implementation..."
                      className="w-full rounded-lg border border-gray-200 p-3 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-deep-600"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </div>

          {selected && (
            <div className="p-4 bg-gray-50/60 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-gray-500">
                Evaluation will be visible to the student in their Lab Workspace.
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={() => saveGrade('remediation')}
                  className="text-xs border-amber-200 text-amber-700 hover:bg-amber-50"
                >
                  <AlertCircle size={13} className="mr-1.5" />
                  Request Remediation
                </Button>

                <Button
                  size="sm"
                  disabled={saving}
                  onClick={() => saveGrade('graded')}
                  className="bg-deep-600 text-white hover:bg-deep-700 text-xs font-semibold"
                >
                  <Save size={13} className="mr-1.5" />
                  {saving ? 'Saving...' : 'Submit Grade'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

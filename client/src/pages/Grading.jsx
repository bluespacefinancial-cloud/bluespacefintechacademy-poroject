import { useCallback, useEffect, useState } from 'react'
import { ClipboardList, Save, Search, ExternalLink, Code2, AlertCircle } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { api } from '../lib/backend'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import toast from 'react-hot-toast'

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
  const [bulkSelected, setBulkSelected] = useState(new Set())

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

  function toggleBulkSelect(subId) {
    setBulkSelected((prev) => {
      const next = new Set(prev)
      if (next.has(subId)) next.delete(subId)
      else next.add(subId)
      return next
    })
  }

  function toggleBulkSelectAll() {
    const allIds = new Set(displayedSubmissions.map((s) => s.id))
    if (bulkSelected.size === displayedSubmissions.length && displayedSubmissions.length > 0) {
      setBulkSelected(new Set())
    } else {
      setBulkSelected(allIds)
    }
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
      toast.success(newStatus === 'graded' ? 'Grade recorded' : 'Remediation requested')
    } catch (saveError) {
      setError(saveError.message || 'Unable to record grade.')
      toast.error('Unable to record grade')
    } finally {
      setSaving(false)
    }
  }

  async function bulkGrade(newStatus) {
    const ids = Array.from(bulkSelected)
    if (ids.length === 0) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const results = await Promise.all(
        ids.map((id) =>
          api
            .from('submissions')
            .update({ status: newStatus, graded_by: user.id, graded_at: new Date().toISOString() })
            .eq('id', id)
        )
      )
      const failed = results.find((r) => r.error)
      if (failed) throw failed.error
      setSubmissions((prev) =>
        prev.map((row) => (bulkSelected.has(row.id) ? { ...row, status: newStatus } : row))
      )
      setBulkSelected(new Set())
      setMessage(
        newStatus === 'graded'
          ? `${ids.length} submission(s) graded.`
          : `${ids.length} submission(s) sent for remediation.`
      )
      toast.success(
        newStatus === 'graded' ? 'Bulk grade recorded' : 'Bulk remediation requested'
      )
    } catch (bulkError) {
      setError(bulkError.message || 'Bulk action failed')
      toast.error('Bulk action failed')
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
      <Breadcrumb items={[{ label: 'Evaluation & Grading' }]} />
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

      {/* Bulk Action Bar */}
      {bulkSelected.size > 0 && (
        <div className="rounded-xl border border-deep-200 bg-deep-50 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
          <span className="text-xs font-bold text-deep-700">
            {bulkSelected.size} submission(s) selected
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => bulkGrade('graded')} disabled={saving} className="bg-deep-600 text-white hover:bg-deep-700 text-xs font-semibold">
              <Save size={12} className="mr-1.5" />
              Bulk Grade
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulkGrade('remediation')} disabled={saving} className="border-amber-200 text-amber-700 hover:bg-amber-50 text-xs font-semibold">
              <AlertCircle size={12} className="mr-1.5" />
              Bulk Remediate
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Submissions Queue (1/3) */}
        <Card className="border border-border shadow-sm rounded-xl bg-card overflow-hidden flex flex-col justify-between">
          <div>
            {/* Tab Controls & Search */}
            <div className="p-4 border-b border-border space-y-3 bg-muted/20">
              <div className="flex rounded-lg bg-muted p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setTab('pending')}
                  className={`flex-1 py-1.5 rounded-md text-center transition-all ${
                    tab === 'pending'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Pending ({pendingSubmissions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTab('all')}
                  className={`flex-1 py-1.5 rounded-md text-center transition-all ${
                    tab === 'all'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All ({submissions.length})
                </button>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by student or lab..."
                  className="pl-8 text-xs h-8 border-border bg-background text-foreground"
                />
              </div>
            </div>

            {/* Submissions List */}
            <CardContent className="p-2 max-h-[calc(100vh-280px)] overflow-y-auto space-y-1.5">
              {bulkSelected.size > 0 && (
                <div className="flex items-center justify-between px-3 py-2 text-xs border-b border-border bg-muted/20">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={bulkSelected.size === displayedSubmissions.length && displayedSubmissions.length > 0}
                      onChange={toggleBulkSelectAll}
                      className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-muted-foreground font-medium">
                      {bulkSelected.size === displayedSubmissions.length ? 'Deselect all' : 'Select all visible'}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setBulkSelected(new Set())}
                    className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Clear selection
                  </button>
                </div>
              )}
              {loading ? (
                <p className="py-12 text-center text-xs text-muted-foreground">Loading evaluation queue...</p>
              ) : displayedSubmissions.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  <ClipboardList size={24} className="mx-auto text-muted-foreground/60 mb-2" />
                  <p className="font-semibold text-foreground">No submissions found</p>
                  <p className="mt-0.5 text-muted-foreground">
                    {tab === 'pending' ? 'All student submissions have been graded.' : 'No matching records found.'}
                  </p>
                </div>
              ) : (
                displayedSubmissions.map((sub) => {
                  const isSelected = selected?.id === sub.id
                  const isBulkSelected = bulkSelected.has(sub.id)
                  const isGraded = sub.status === 'graded'
                  const isRemediation = sub.status === 'remediation'

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => choose(sub)}
                      className={`w-full text-left p-3 rounded-lg border transition-all text-xs ${
                        isSelected
                          ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm ring-1 ring-blue-500/40'
                          : 'border-border hover:border-gray-300 dark:hover:border-slate-700 hover:bg-muted/50 bg-card'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isBulkSelected}
                            onChange={(e) => {
                              e.stopPropagation()
                              toggleBulkSelect(sub.id)
                            }}
                            className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-bold text-foreground truncate">{title(sub)}</span>
                        </div>
                        <Badge
                          variant={isGraded ? 'secondary' : isRemediation ? 'outline' : 'default'}
                          className={`text-[10px] capitalize shrink-0 ${
                            isRemediation ? 'text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/30' : ''
                          }`}
                        >
                          {sub.status}
                        </Badge>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-muted-foreground">
                        <span className="truncate">{sub.users?.name || sub.users?.email || 'Student'}</span>
                        <span className="text-[10px]">
                          {new Date(sub.submitted_at).toLocaleDateString()}
                        </span>
                      </div>

                      {isGraded && (
                        <div className="mt-1.5 flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 text-[11px]">
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
        <Card className="lg:col-span-2 border border-border shadow-sm rounded-xl bg-card overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Code2 size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-foreground truncate">
                    {selected ? title(selected) : 'Select a submission'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selected ? `Student: ${selected.users?.name || selected.users?.email}` : 'Choose from the left queue to evaluate'}
                  </p>
                </div>
              </div>

              {selected?.content_url && (
                <Button asChild size="sm" variant="outline" className="text-xs border-border bg-card hover:bg-muted/60 text-foreground shrink-0">
                  <a href={selected.content_url} target="_blank" rel="noreferrer">
                    <ExternalLink size={13} className="mr-1.5 text-blue-600 dark:text-blue-400" />
                    Open Repository
                  </a>
                </Button>
              )}
            </div>

            <CardContent className="p-5">
              {!selected ? (
                <div className="py-20 text-center text-sm text-muted-foreground">
                  <ClipboardList size={32} className="mx-auto text-muted-foreground/60 mb-2" />
                  <p>Select a student deliverable from the queue to start review.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Submission Details Bar */}
                  <div className="rounded-lg border border-border bg-muted/30 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Submitted: </span>
                      <strong className="text-foreground">
                        {new Date(selected.submitted_at).toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max Points: </span>
                      <strong className="text-foreground">{maxScore} pts</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Current Status: </span>
                      <Badge variant="outline" className="capitalize text-[11px] ml-1 border-border">
                        {selected.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Score Input */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
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
                        className="w-36 font-bold text-sm border-input bg-background text-foreground"
                      />
                      <span className="text-xs text-muted-foreground font-medium">/ {maxScore} points</span>
                    </div>
                  </div>

                  {/* Rubric Feedback Presets */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-foreground">
                        Instructor Feedback & Rubric Guidance
                      </label>
                      <span className="text-[11px] text-muted-foreground">Click a preset to insert</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2.5">
                      {RUBRIC_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => appendPreset(preset.text)}
                          className="px-2.5 py-1 rounded-md border border-border bg-card dark:bg-slate-900/80 text-[11px] font-semibold text-foreground hover:border-blue-500/60 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-muted/50 transition-all shadow-2xs"
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
                      className="w-full rounded-lg border border-input bg-background p-3 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-600 text-foreground"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </div>

          {selected && (
            <div className="p-4 bg-muted/20 border-t border-border flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                Evaluation will be visible to the student in their Lab Workspace.
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={() => saveGrade('remediation')}
                  className="text-xs border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                >
                  <AlertCircle size={13} className="mr-1.5" />
                  Request Remediation
                </Button>

                <Button
                  size="sm"
                  disabled={saving}
                  onClick={() => saveGrade('graded')}
                  className="bg-blue-600 text-white hover:bg-blue-500 text-xs font-semibold"
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

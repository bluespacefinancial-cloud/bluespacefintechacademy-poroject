/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, ClipboardList } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { api } from '../lib/backend'

export default function ProjectReview() {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const [filter, setFilter] = useState('submitted')
  const [error, setError] = useState('')

  const load = async () => {
    const { data, error: loadError } = await api.from('sprint_deliverables').select('*, users!sprint_deliverables_user_id_fkey(name, email), sprints(sprint_number, use_cases(title))').order('created_at', { ascending: false })
    if (loadError) throw loadError
    setItems(data || [])
  }
  useEffect(() => { load().catch((loadError) => setError(loadError.message || 'Unable to load project evidence')) }, [])

  const choose = (item) => { setSelected(item); setScore(item.score ?? ''); setFeedback(item.feedback || '') }
  const review = async (status) => {
    if (!selected || score === '') { setError('Enter a score before reviewing'); return }
    const { data, error: reviewError } = await api.rpc('review_sprint_deliverable', { p_deliverable_id: selected.id, p_score: Number(score), p_feedback: feedback.trim(), p_status: status })
    if (reviewError) { setError(reviewError.message); return }
    setItems((current) => current.map((item) => item.id === selected.id ? { ...item, ...data } : item)); setSelected({ ...selected, ...data })
  }
  const filtered = useMemo(() => items.filter((item) => filter === 'all' || item.status === filter), [items, filter])

  return (
    <div className="w-full space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Review</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Review sprint evidence and provide project feedback.</p>
      </div>
      {error && <p className="mb-4 rounded bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50">{error}</p>}
      <div className="mb-4 flex gap-2">
        <select
          className="rounded border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2 text-sm"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="submitted">Pending review</option>
          <option value="accepted">Accepted</option>
          <option value="remediation">Remediation</option>
          <option value="all">All evidence</option>
        </select>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-sm">Deliverables ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => choose(item)}
                className={`w-full rounded border p-3 text-left transition-colors ${
                  selected?.id === item.id
                    ? 'border-deep-600 bg-deep-50 dark:border-deep-500 dark:bg-deep-950/40'
                    : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                }`}
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.users?.name || item.users?.email || 'Student'} · Sprint {item.sprints?.sprint_number}
                </p>
                <Badge variant="outline" className="mt-2">{item.status}</Badge>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No deliverables in this status.</p>}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-sm">{selected?.title || 'Select a deliverable'}</CardTitle>
          </CardHeader>
          {selected ? (
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">{selected.description}</p>
              {selected.evidence_url && (
                <a className="text-sm text-deep-600 dark:text-blue-400 hover:underline" href={selected.evidence_url} target="_blank" rel="noreferrer">
                  Open evidence
                </a>
              )}
              <Input type="number" min="0" max="100" placeholder="Score" value={score} onChange={(event) => setScore(event.target.value)} />
              <textarea
                rows={4}
                className="w-full rounded border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2 text-sm"
                placeholder="Feedback"
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={() => review('accepted')}>
                  <CheckCircle size={14} className="mr-1" />
                  Accept
                </Button>
                <Button variant="outline" onClick={() => review('remediation')}>Request remediation</Button>
              </div>
            </CardContent>
          ) : (
            <CardContent className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
              <ClipboardList size={24} className="mx-auto mb-2" />
              Select evidence to review.
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { api } from '../lib/backend'
import { getCurrentProfile } from '../lib/profile'

export default function PeerReview() {
  const [reviews, setReviews] = useState([])
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      const profile = await getCurrentProfile()
      const { data, error: loadError } = await api.from('peer_reviews').select('*, submissions(content_url, users!submissions_user_id_fkey(name), labs(title), assessments(title))').eq('reviewer_id', profile.id).order('created_at', { ascending: false })
      if (loadError) throw loadError
      setReviews(data || [])
    }
    load().catch((loadError) => setError(loadError.message || 'Unable to load peer reviews'))
  }, [])

  const choose = (review) => { setSelected(review); setScore(review.score ?? ''); setFeedback(review.feedback || '') }
  const submit = async () => {
    if (!selected || score === '') { setError('Enter a score before submitting'); return }
    const { data, error: updateError } = await api.from('peer_reviews').update({ score: Number(score), feedback: feedback.trim(), status: 'submitted', updated_at: new Date().toISOString() }).eq('id', selected.id).select().single()
    if (updateError) { setError(updateError.message); return }
    setReviews((current) => current.map((item) => item.id === selected.id ? { ...item, ...data } : item)); setSelected({ ...selected, ...data }); setMessage('Peer review submitted.')
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Peer Reviews</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Review assigned work and provide constructive feedback.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      {message && (
        <p className="mb-4 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          {message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Assigned reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reviews.map((review) => (
              <button
                key={review.id}
                type="button"
                onClick={() => choose(review)}
                className={`w-full rounded border p-3 text-left transition-colors ${
                  selected?.id === review.id
                    ? 'border-brand-300 dark:border-blue-500 bg-brand-50/50 dark:bg-blue-950/40'
                    : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                }`}
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {review.submissions?.labs?.title || review.submissions?.assessments?.title || 'Submission'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">By {review.submissions?.users?.name || 'Student'}</p>
                <Badge variant="outline" className="mt-2">{review.status}</Badge>
              </button>
            ))}
            {reviews.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No peer reviews assigned.</p>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageSquare size={15} />
              {selected ? 'Complete review' : 'Select a review'}
            </CardTitle>
          </CardHeader>
          {selected ? (
            <CardContent className="space-y-4">
              <p className="rounded border border-gray-200 dark:border-gray-800 p-3 text-xs text-gray-600 dark:text-gray-300 bg-gray-50/50 dark:bg-gray-900/40">
                {selected.submissions?.content_url || 'No evidence URL provided.'}
              </p>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="Score"
                value={score}
                onChange={(event) => setScore(event.target.value)}
              />
              <textarea
                rows={5}
                className="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-deep-600"
                placeholder="Constructive feedback"
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
              />
              <Button onClick={submit} disabled={selected.status === 'submitted'}>
                <Send size={14} className="mr-2" />
                Submit review
              </Button>
            </CardContent>
          ) : (
            <CardContent className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
              Choose an assigned review.
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}

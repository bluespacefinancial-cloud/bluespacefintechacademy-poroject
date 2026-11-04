/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { supabase } from '../lib/supabase'
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
      const { data, error: loadError } = await supabase.from('peer_reviews').select('*, submissions(content_url, users(name), labs(title), assessments(title))').eq('reviewer_id', profile.id).order('created_at', { ascending: false })
      if (loadError) throw loadError
      setReviews(data || [])
    }
    load().catch((loadError) => setError(loadError.message || 'Unable to load peer reviews'))
  }, [])

  const choose = (review) => { setSelected(review); setScore(review.score ?? ''); setFeedback(review.feedback || '') }
  const submit = async () => {
    if (!selected || score === '') { setError('Enter a score before submitting'); return }
    const { data, error: updateError } = await supabase.from('peer_reviews').update({ score: Number(score), feedback: feedback.trim(), status: 'submitted', updated_at: new Date().toISOString() }).eq('id', selected.id).select().single()
    if (updateError) { setError(updateError.message); return }
    setReviews((current) => current.map((item) => item.id === selected.id ? { ...item, ...data } : item)); setSelected({ ...selected, ...data }); setMessage('Peer review submitted.')
  }

  return <div className="min-h-screen bg-gray-50"><div className="mb-6"><h1 className="text-2xl font-bold text-deep-600">Peer Reviews</h1><p className="text-sm text-gray-500">Review assigned work and provide constructive feedback.</p></div>{error && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p className="mb-4 rounded bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}<div className="grid gap-6 lg:grid-cols-3"><Card><CardHeader><CardTitle className="text-sm">Assigned reviews</CardTitle></CardHeader><CardContent className="space-y-2">{reviews.map((review) => <button key={review.id} type="button" onClick={() => choose(review)} className={`w-full rounded border p-3 text-left ${selected?.id === review.id ? 'border-brand-300 bg-brand-50' : 'border-gray-100'}`}><p className="text-sm">{review.submissions?.labs?.title || review.submissions?.assessments?.title || 'Submission'}</p><p className="text-xs text-gray-500">By {review.submissions?.users?.name || 'Student'}</p><Badge variant="outline" className="mt-2">{review.status}</Badge></button>)}{reviews.length === 0 && <p className="text-sm text-gray-500">No peer reviews assigned.</p>}</CardContent></Card><Card className="lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><MessageSquare size={15} />{selected ? 'Complete review' : 'Select a review'}</CardTitle></CardHeader>{selected ? <CardContent className="space-y-4"><p className="rounded border p-3 text-xs text-gray-600">{selected.submissions?.content_url || 'No evidence URL provided.'}</p><Input type="number" min="0" max="100" placeholder="Score" value={score} onChange={(event) => setScore(event.target.value)} /><textarea rows={5} className="w-full rounded border p-2 text-sm" placeholder="Constructive feedback" value={feedback} onChange={(event) => setFeedback(event.target.value)} /><Button onClick={submit} disabled={selected.status === 'submitted'}><Send size={14} className="mr-2" />Submit review</Button></CardContent> : <CardContent className="py-16 text-center text-sm text-gray-500">Choose an assigned review.</CardContent>}</Card></div></div>
}

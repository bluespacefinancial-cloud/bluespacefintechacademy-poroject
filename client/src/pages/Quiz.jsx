import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, Save, Send } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { supabase } from '../lib/supabase'
import { getCurrentProfile } from '../lib/profile'

export default function Quiz() {
  const { assessmentId } = useParams()
  const [assessment, setAssessment] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [attempt, setAttempt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getCurrentProfile()
        const [{ data: assessmentRow, error: assessmentError }, { data: questionRows, error: questionsError }, { data: attempts, error: attemptsError }] = await Promise.all([
          supabase.from('assessments').select('*').eq('id', assessmentId).single(),
          supabase.from('assessment_questions').select('*').eq('assessment_id', assessmentId).order('order_index'),
          supabase.from('assessment_attempts').select('*').eq('assessment_id', assessmentId).eq('user_id', profile.id).order('started_at', { ascending: false }).limit(1),
        ])
        for (const queryError of [assessmentError, questionsError, attemptsError]) if (queryError) throw queryError
        const current = attempts?.[0]
        setAssessment(assessmentRow); setQuestions(questionRows || []); setAttempt(current || null); setAnswers(current?.answers || {})
      } catch (loadError) { setError(loadError.message || 'Unable to load quiz') } finally { setLoading(false) }
    }
    load()
  }, [assessmentId])

  const saveAttempt = async (status = 'in_progress') => {
    const profile = await getCurrentProfile()
    const payload = { assessment_id: Number(assessmentId), user_id: profile.id, answers, status, submitted_at: status === 'submitted' ? new Date().toISOString() : null }
    const query = attempt
      ? supabase.from('assessment_attempts').update(payload).eq('id', attempt.id).select().single()
      : supabase.from('assessment_attempts').insert(payload).select().single()
    const { data, error: saveError } = await query
    if (saveError) throw saveError
    setAttempt(data); return data
  }

  const submit = async () => {
    setSaving(true); setError(''); setMessage('')
    try { await saveAttempt('submitted'); setMessage('Quiz submitted. Your result will appear after grading.') }
    catch (submitError) { setError(submitError.message || 'Unable to submit quiz') } finally { setSaving(false) }
  }

  const answer = (questionId, value) => setAnswers((current) => ({ ...current, [questionId]: value }))
  return <div className="min-h-screen bg-gray-50"><div className="mb-6"><h1 className="text-2xl font-bold text-deep-600">{assessment?.title || 'Quiz'}</h1><p className="text-sm text-gray-500">Complete the assessment and submit when ready.</p></div>{error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}{loading ? <p className="py-10 text-center text-sm text-gray-500">Loading quiz...</p> : <div className="max-w-3xl space-y-4">{attempt?.status === 'graded' && <Card><CardContent className="flex items-center justify-between p-4"><span className="text-sm">Result</span><Badge variant={attempt.score >= (assessment?.pass_mark || 70) ? 'secondary' : 'outline'}>{attempt.score}%</Badge></CardContent></Card>}{questions.map((question, index) => <Card key={question.id}><CardHeader><CardTitle className="text-sm">{index + 1}. {question.prompt}</CardTitle></CardHeader><CardContent>{question.question_type === 'short_answer' ? <Input value={answers[question.id] || ''} onChange={(event) => answer(question.id, event.target.value)} disabled={attempt?.status === 'submitted' || attempt?.status === 'graded'} /> : <div className="space-y-2">{(question.options || []).map((option) => <label key={option} className="flex cursor-pointer items-center gap-2 rounded border p-3 text-sm"><input type={question.question_type === 'multiple_choice' ? 'checkbox' : 'radio'} name={`question-${question.id}`} checked={question.question_type === 'multiple_choice' ? (answers[question.id] || []).includes(option) : answers[question.id] === option} onChange={() => answer(question.id, question.question_type === 'multiple_choice' ? ((answers[question.id] || []).includes(option) ? answers[question.id].filter((item) => item !== option) : [...(answers[question.id] || []), option]) : option)} disabled={attempt?.status === 'submitted' || attempt?.status === 'graded'} />{option}</label>)}</div>}</CardContent></Card>)}{questions.length === 0 && <Card><CardContent className="py-10 text-center text-sm text-gray-500">No questions have been published for this assessment.</CardContent></Card>}{attempt?.status !== 'submitted' && attempt?.status !== 'graded' && <div className="flex gap-2"><Button variant="outline" onClick={() => saveAttempt()}><Save size={14} className="mr-2" />Save progress</Button><Button onClick={submit} disabled={saving}><Send size={14} className="mr-2" />{saving ? 'Submitting...' : 'Submit quiz'}</Button></div>}<p className="flex items-center gap-2 text-xs text-gray-500"><CheckCircle size={14} /> Pass mark: {assessment?.pass_mark || 70}%</p></div>}</div>
}

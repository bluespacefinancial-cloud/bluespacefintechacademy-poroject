import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { supabase } from '../lib/supabase'

const empty = { prompt: '', question_type: 'single_choice', options: '', correct_answer: '', points: 1 }
export default function QuizManagement() {
  const [assessments, setAssessments] = useState([])
  const [assessmentId, setAssessmentId] = useState('')
  const [questions, setQuestions] = useState([])
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => { supabase.from('assessments').select('id, title, type').in('type', ['quiz', 'domain_assessment']).order('created_at', { ascending: false }).then(({ data, error: queryError }) => { if (queryError) setError(queryError.message); setAssessments(data || []) }) }, [])
  useEffect(() => { if (!assessmentId) return; supabase.from('assessment_questions').select('*').eq('assessment_id', assessmentId).order('order_index').then(({ data, error: queryError }) => { if (queryError) setError(queryError.message); setQuestions(data || []) }) }, [assessmentId])
  const addQuestion = async (event) => {
    event.preventDefault(); setError(''); setMessage('')
    const options = form.question_type === 'short_answer' ? [] : form.options.split('\n').map((item) => item.trim()).filter(Boolean)
    const { data, error: saveError } = await supabase.from('assessment_questions').insert({ assessment_id: Number(assessmentId), prompt: form.prompt.trim(), question_type: form.question_type, options, correct_answer: form.correct_answer.trim() || null, points: Number(form.points), order_index: questions.length }).select().single()
    if (saveError) setError(saveError.message)
    else { setQuestions((current) => [...current, data]); setForm(empty); setMessage('Question added.') }
  }
  return <div className="min-h-screen bg-gray-50"><div className="mb-6"><h1 className="text-2xl font-bold text-deep-600">Quiz Authoring</h1><p className="text-sm text-gray-500">Create assessment questions for student attempts.</p></div>{error && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p className="mb-4 rounded bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}<Card className="mb-6"><CardHeader><CardTitle className="text-sm">Assessment</CardTitle></CardHeader><CardContent><Select value={assessmentId} onValueChange={setAssessmentId}><SelectTrigger><SelectValue placeholder="Select assessment" /></SelectTrigger><SelectContent>{assessments.map((assessment) => <SelectItem key={assessment.id} value={String(assessment.id)}>{assessment.title}</SelectItem>)}</SelectContent></Select></CardContent></Card>{assessmentId && <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle className="text-sm">Add question</CardTitle></CardHeader><CardContent><form onSubmit={addQuestion} className="space-y-3"><textarea required rows={3} placeholder="Question prompt" value={form.prompt} onChange={(event) => setForm({ ...form, prompt: event.target.value })} className="w-full rounded border p-2 text-sm" /><Select value={form.question_type} onValueChange={(value) => setForm({ ...form, question_type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="single_choice">Single choice</SelectItem><SelectItem value="multiple_choice">Multiple choice</SelectItem><SelectItem value="short_answer">Short answer</SelectItem></SelectContent></Select>{form.question_type !== 'short_answer' && <textarea required rows={4} placeholder="One option per line" value={form.options} onChange={(event) => setForm({ ...form, options: event.target.value })} className="w-full rounded border p-2 text-sm" />}<Input placeholder="Correct answer (exact option or answer)" value={form.correct_answer} onChange={(event) => setForm({ ...form, correct_answer: event.target.value })} /><Input type="number" min="1" value={form.points} onChange={(event) => setForm({ ...form, points: event.target.value })} /><Button type="submit"><Plus size={14} className="mr-2" />Add question</Button></form></CardContent></Card><Card><CardHeader><CardTitle className="text-sm">Questions ({questions.length})</CardTitle></CardHeader><CardContent className="space-y-2">{questions.map((question, index) => <div key={question.id} className="rounded border p-3"><p className="text-sm">{index + 1}. {question.prompt}</p><p className="mt-1 text-xs text-gray-500">{question.question_type} · {question.points} point{question.points === 1 ? '' : 's'}</p></div>)}</CardContent></Card></div>}</div>
}

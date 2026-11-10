import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, Save, Send } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { api } from '../lib/backend'
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
          api.from('assessments').select('*').eq('id', assessmentId).single(),
          // correct_answer is intentionally not selectable by students; see
          // lms/database/08_column_grants.sql.
          api.from('assessment_questions').select('id, assessment_id, prompt, question_type, options, points, order_index').eq('assessment_id', assessmentId).order('order_index'),
          api.from('assessment_attempts').select('*').eq('assessment_id', assessmentId).eq('user_id', profile.id).order('started_at', { ascending: false }).limit(1),
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
      ? api.from('assessment_attempts').update(payload).eq('id', attempt.id).select().single()
      : api.from('assessment_attempts').insert(payload).select().single()
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
  return (
    <div className="w-full space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{assessment?.title || 'Quiz'}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Complete the assessment and submit when ready.</p>
      </div>
      {error && <p className="mb-4 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
      {message && <p className="mb-4 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-3 text-sm text-emerald-700 dark:text-emerald-300">{message}</p>}
      {loading ? (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Loading quiz...</p>
      ) : (
        <div className="max-w-3xl space-y-4">
          {attempt?.status === 'graded' && (
            <Card className="dark:border-gray-800">
              <CardContent className="flex items-center justify-between p-4">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Result</span>
                <Badge variant={attempt.score >= (assessment?.pass_mark || 70) ? 'secondary' : 'outline'}>
                  {attempt.score}%
                </Badge>
              </CardContent>
            </Card>
          )}
          {questions.map((question, index) => (
            <Card key={question.id} className="dark:border-gray-800">
              <CardHeader>
                <CardTitle className="text-sm">{index + 1}. {question.prompt}</CardTitle>
              </CardHeader>
              <CardContent>
                {question.question_type === 'short_answer' ? (
                  <Input
                    value={answers[question.id] || ''}
                    onChange={(event) => answer(question.id, event.target.value)}
                    disabled={attempt?.status === 'submitted' || attempt?.status === 'graded'}
                  />
                ) : (
                  <div className="space-y-2">
                    {(question.options || []).map((option) => (
                      <label
                        key={option}
                        className="flex cursor-pointer items-center gap-2 rounded border border-gray-200 dark:border-gray-800 p-3 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-850/60"
                      >
                        <input
                          type={question.question_type === 'multiple_choice' ? 'checkbox' : 'radio'}
                          name={`question-${question.id}`}
                          checked={
                            question.question_type === 'multiple_choice'
                              ? (answers[question.id] || []).includes(option)
                              : answers[question.id] === option
                          }
                          onChange={() =>
                            answer(
                              question.id,
                              question.question_type === 'multiple_choice'
                                ? (answers[question.id] || []).includes(option)
                                  ? answers[question.id].filter((item) => item !== option)
                                  : [...(answers[question.id] || []), option]
                                : option
                            )
                          }
                          disabled={attempt?.status === 'submitted' || attempt?.status === 'graded'}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {questions.length === 0 && (
            <Card className="dark:border-gray-800">
              <CardContent className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                No questions have been published for this assessment.
              </CardContent>
            </Card>
          )}
          {attempt?.status !== 'submitted' && attempt?.status !== 'graded' && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => saveAttempt()}>
                <Save size={14} className="mr-2" />
                Save progress
              </Button>
              <Button onClick={submit} disabled={saving}>
                <Send size={14} className="mr-2" />
                {saving ? 'Submitting...' : 'Submit quiz'}
              </Button>
            </div>
          )}
          <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <CheckCircle size={14} /> Pass mark: {assessment?.pass_mark || 70}%
          </p>
        </div>
      )}
    </div>
  )
}

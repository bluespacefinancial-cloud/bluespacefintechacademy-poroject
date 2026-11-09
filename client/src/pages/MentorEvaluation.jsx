import { useEffect, useState } from 'react'
import { CheckCircle, Save } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { api } from '../lib/backend'
import { getCurrentProfile } from '../lib/profile'

export default function MentorEvaluation() {
  const [students, setStudents] = useState([])
  const [sprints, setSprints] = useState([])
  const [form, setForm] = useState({ sprint_id: '', user_id: '', score: '', feedback: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      const profile = await getCurrentProfile()
      const [{ data: assignments, error: assignmentError }, { data: sprintRows, error: sprintError }] = await Promise.all([
        api.from('instructor_squad_assignments').select('squad_id').eq('instructor_id', profile.id),
        api.from('sprints').select('id, sprint_number, squad_id, use_cases(title)').order('sprint_number'),
      ])
      if (assignmentError) throw assignmentError
      if (sprintError) throw sprintError
      const squadIds = (assignments || []).map((item) => item.squad_id)
      const visibleSprints = (sprintRows || []).filter((sprint) => !squadIds.length || squadIds.includes(sprint.squad_id))
      setSprints(visibleSprints)
      const { data: enrolments, error: enrolmentError } = await api.from('enrolments').select('user_id, squad_id, users(name, email)').in('squad_id', visibleSprints.map((item) => item.squad_id))
      if (enrolmentError) throw enrolmentError
      setStudents(enrolments || [])
    }
    load().catch((loadError) => setError(loadError.message || 'Unable to load evaluation roster')).finally(() => setLoading(false))
  }, [])

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setMessage('')
    try {
      const mentor = await getCurrentProfile()
      const { error: saveError } = await api.from('mentor_evaluations').upsert({ sprint_id: Number(form.sprint_id), user_id: Number(form.user_id), mentor_id: mentor.id, score: Number(form.score), feedback: form.feedback.trim() || null, updated_at: new Date().toISOString() }, { onConflict: 'sprint_id,user_id,mentor_id' })
      if (saveError) throw saveError
      setMessage('Mentor evaluation saved.')
    } catch (saveError) { setError(saveError.message || 'Unable to save evaluation') } finally { setSaving(false) }
  }

  return <div className="min-h-screen bg-gray-50"><div className="mb-6"><h1 className="text-2xl font-bold text-deep-600">Mentor Evaluation</h1><p className="text-sm text-gray-500">Record contribution scores and feedback for assigned project squads.</p></div>{error && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p className="mb-4 rounded bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}<Card className="max-w-2xl"><CardHeader><CardTitle className="text-sm">Evaluate fellow contribution</CardTitle></CardHeader><CardContent>{loading ? <p className="text-sm text-gray-500">Loading evaluation roster...</p> : <form onSubmit={save} className="space-y-4"><select required className="w-full rounded border p-2 text-sm" value={form.sprint_id} onChange={(event) => setForm({ ...form, sprint_id: event.target.value })}><option value="">Select sprint</option>{sprints.map((sprint) => <option key={sprint.id} value={sprint.id}>Sprint {sprint.sprint_number} · {sprint.use_cases?.title || 'Project'}</option>)}</select><select required className="w-full rounded border p-2 text-sm" value={form.user_id} onChange={(event) => setForm({ ...form, user_id: event.target.value })}><option value="">Select fellow</option>{students.filter((student) => !form.sprint_id || sprints.find((sprint) => String(sprint.id) === form.sprint_id)?.squad_id === student.squad_id).map((student) => <option key={student.user_id} value={student.user_id}>{student.users?.name || student.users?.email}</option>)}</select><Input required type="number" min="0" max="100" placeholder="Score 0-100" value={form.score} onChange={(event) => setForm({ ...form, score: event.target.value })} /><textarea required rows={5} className="w-full rounded border p-2 text-sm" placeholder="Feedback and development notes" value={form.feedback} onChange={(event) => setForm({ ...form, feedback: event.target.value })} /><Button type="submit" disabled={saving}><Save size={14} className="mr-2" />{saving ? 'Saving...' : 'Save evaluation'}</Button></form>}</CardContent></Card><p className="mt-4 flex items-center gap-2 text-xs text-gray-500"><CheckCircle size={14} /> Evaluations contribute to live-project performance records.</p></div>
}

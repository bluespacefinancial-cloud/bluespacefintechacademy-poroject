/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { CheckCircle, Plus, Target } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { api } from '../lib/backend'
import { getCurrentProfile } from '../lib/profile'

export default function ProjectWorkspace() {
  const [sprints, setSprints] = useState([])
  const [selected, setSelected] = useState(null)
  const [deliverables, setDeliverables] = useState([])
  const [form, setForm] = useState({ title: '', description: '', evidence_url: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    const profile = await getCurrentProfile()
    const { data: enrolment, error: enrolmentError } = await api
      .from('enrolments')
      .select('squad_id')
      .eq('user_id', profile.id)
      .in('status', ['enrolled', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (enrolmentError) throw enrolmentError
    if (!enrolment?.squad_id) return
    const { data, error: sprintError } = await api.from('sprints').select('*, use_cases(title, domain), sprint_deliverables(*)').eq('squad_id', enrolment.squad_id).order('sprint_number')
    if (sprintError) throw sprintError
    setSprints(data || [])
    if (data?.[0]) { setSelected(data[0]); setDeliverables(data[0].sprint_deliverables || []) }
  }
  useEffect(() => { load().catch((loadError) => setError(loadError.message || 'Unable to load project workspace')).finally(() => setLoading(false)) }, [])

  const choose = (sprint) => { setSelected(sprint); setDeliverables(sprint.sprint_deliverables || []) }
  const submit = async (event) => {
    event.preventDefault(); setError(''); setMessage('')
    const profile = await getCurrentProfile()
    const { data, error: submitError } = await api.from('sprint_deliverables').insert({ sprint_id: selected.id, user_id: profile.id, ...form, status: 'submitted', submitted_at: new Date().toISOString() }).select().single()
    if (submitError) setError(submitError.message)
    else { setDeliverables((current) => [data, ...current]); setForm({ title: '', description: '', evidence_url: '' }); setMessage('Deliverable submitted for mentor review.') }
  }

  return (
    <div className="w-full space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Workspace</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Submit sprint evidence and track live project delivery.</p>
      </div>
      {error && <p className="mb-4 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
      {message && <p className="mb-4 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-3 text-sm text-emerald-700 dark:text-emerald-300">{message}</p>}
      {loading ? (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Loading project workspace...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-sm">Sprints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sprints.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No sprints assigned to your squad.</p>}
              {sprints.map((sprint) => (
                <button
                  key={sprint.id}
                  type="button"
                  onClick={() => choose(sprint)}
                  className={`w-full rounded border p-3 text-left transition-colors ${
                    selected?.id === sprint.id
                      ? 'border-deep-600 bg-deep-50 dark:border-deep-500 dark:bg-deep-950/40'
                      : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Sprint {sprint.sprint_number}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {sprint.use_cases?.title || 'Live project'} · {sprint.status}
                  </p>
                  <Badge variant="outline" className="mt-2">{sprint.start_date} - {sprint.end_date}</Badge>
                </button>
              ))}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target size={15} />
                {selected ? `Sprint ${selected.sprint_number} deliverables` : 'Select a sprint'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selected && (
                <>
                  <form onSubmit={submit} className="mb-6 space-y-3">
                    <Input placeholder="Deliverable title" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
                    <textarea
                      rows={3}
                      placeholder="What was delivered?"
                      required
                      value={form.description}
                      onChange={(event) => setForm({ ...form, description: event.target.value })}
                      className="w-full rounded border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2 text-sm"
                    />
                    <Input type="url" placeholder="Evidence URL (repository, demo, document)" value={form.evidence_url} onChange={(event) => setForm({ ...form, evidence_url: event.target.value })} />
                    <Button type="submit"><Plus size={14} className="mr-2" />Submit deliverable</Button>
                  </form>
                  <div className="space-y-2">
                    {deliverables.map((item) => (
                      <div key={item.id} className="rounded border border-gray-100 dark:border-gray-800 p-3 bg-white dark:bg-gray-900/40">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                          <Badge variant="outline">{item.status}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                        {item.evidence_url && (
                          <a className="mt-1 block text-xs text-deep-600 dark:text-blue-400 hover:underline" href={item.evidence_url} target="_blank" rel="noreferrer">
                            Open evidence
                          </a>
                        )}
                        {item.score !== null && (
                          <p className="mt-2 text-xs text-gray-700 dark:text-gray-300">
                            <CheckCircle size={12} className="mr-1 inline text-emerald-600 dark:text-emerald-400" />
                            Score: {item.score}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

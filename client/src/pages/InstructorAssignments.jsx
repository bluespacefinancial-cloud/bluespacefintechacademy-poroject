/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { supabase } from '../lib/supabase'

export default function InstructorAssignments() {
  const [instructors, setInstructors] = useState([])
  const [cohorts, setCohorts] = useState([])
  const [squads, setSquads] = useState([])
  const [cohortAssignments, setCohortAssignments] = useState([])
  const [squadAssignments, setSquadAssignments] = useState([])
  const [instructorId, setInstructorId] = useState('')
  const [cohortId, setCohortId] = useState('')
  const [squadId, setSquadId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [{ data: instructorRows, error: instructorError }, { data: cohortRows, error: cohortError }, { data: squadRows, error: squadError }, { data: cohortLinks, error: cohortLinkError }, { data: squadLinks, error: squadLinkError }] = await Promise.all([
      supabase.from('users').select('id, name, email').eq('type', 'Instructor').order('name'),
      supabase.from('cohorts').select('id, name').order('start_date', { ascending: false }),
      supabase.from('squads').select('id, name, cohort_id').order('name'),
      supabase.from('instructor_cohort_assignments').select('id, instructor_id, cohort_id'),
      supabase.from('instructor_squad_assignments').select('id, instructor_id, squad_id'),
    ])
    if (instructorError || cohortError || squadError || cohortLinkError || squadLinkError) {
      throw instructorError || cohortError || squadError || cohortLinkError || squadLinkError
    }
    setInstructors(instructorRows || [])
    setCohorts(cohortRows || [])
    setSquads(squadRows || [])
    setCohortAssignments(cohortLinks || [])
    setSquadAssignments(squadLinks || [])
  }

  useEffect(() => { load().catch((loadError) => setError(loadError.message || 'Unable to load assignments')).finally(() => setLoading(false)) }, [])

  const addAssignment = async (table, values, reset) => {
    if (Object.values(values).some((value) => !value)) return
    setError('')
    const { error: insertError } = await supabase.from(table).insert(values)
    if (insertError) { setError(insertError.code === '23505' ? 'That assignment already exists.' : insertError.message); return }
    reset()
    await load()
  }

  const removeAssignment = async (table, id) => {
    setError('')
    const { error: deleteError } = await supabase.from(table).delete().eq('id', id)
    if (deleteError) { setError(deleteError.message); return }
    await load()
  }

  const instructorName = (id) => {
    const instructor = instructors.find((item) => item.id === id)
    return instructor?.name || instructor?.email || `Instructor ${id}`
  }
  const cohortName = (id) => cohorts.find((item) => item.id === id)?.name || `Cohort ${id}`
  const squadName = (id) => squads.find((item) => item.id === id)?.name || `Squad ${id}`

  return <div className="min-h-screen bg-gray-50">
    <div className="mb-6"><h1 className="text-2xl font-bold text-deep-600">Instructor Assignments</h1><p className="text-sm text-gray-500">Control which cohorts and squads each instructor can support.</p></div>
    {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-sm">Assign a cohort</CardTitle></CardHeader><CardContent className="space-y-3">
        <Select value={instructorId} onValueChange={setInstructorId}><SelectTrigger><SelectValue placeholder="Select instructor" /></SelectTrigger><SelectContent>{instructors.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name || item.email}</SelectItem>)}</SelectContent></Select>
        <Select value={cohortId} onValueChange={setCohortId}><SelectTrigger><SelectValue placeholder="Select cohort" /></SelectTrigger><SelectContent>{cohorts.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select>
        <Button onClick={() => addAssignment('instructor_cohort_assignments', { instructor_id: Number(instructorId), cohort_id: Number(cohortId) }, () => { setInstructorId(''); setCohortId('') })}>Add cohort assignment</Button>
        <div className="space-y-2 pt-3">{cohortAssignments.map((item) => <div key={item.id} className="flex items-center justify-between rounded border bg-white p-2 text-sm"><span>{instructorName(item.instructor_id)} · {cohortName(item.cohort_id)}</span><Button variant="ghost" size="icon" onClick={() => removeAssignment('instructor_cohort_assignments', item.id)} aria-label="Remove cohort assignment"><Trash2 size={15} /></Button></div>)}</div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">Assign a squad</CardTitle></CardHeader><CardContent className="space-y-3">
        <Select value={instructorId} onValueChange={setInstructorId}><SelectTrigger><SelectValue placeholder="Select instructor" /></SelectTrigger><SelectContent>{instructors.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name || item.email}</SelectItem>)}</SelectContent></Select>
        <Select value={squadId} onValueChange={setSquadId}><SelectTrigger><SelectValue placeholder="Select squad" /></SelectTrigger><SelectContent>{squads.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select>
        <Button onClick={() => addAssignment('instructor_squad_assignments', { instructor_id: Number(instructorId), squad_id: Number(squadId) }, () => { setInstructorId(''); setSquadId('') })}>Add squad assignment</Button>
        <div className="space-y-2 pt-3">{squadAssignments.map((item) => <div key={item.id} className="flex items-center justify-between rounded border bg-white p-2 text-sm"><span>{instructorName(item.instructor_id)} · {squadName(item.squad_id)}</span><Button variant="ghost" size="icon" onClick={() => removeAssignment('instructor_squad_assignments', item.id)} aria-label="Remove squad assignment"><Trash2 size={15} /></Button></div>)}</div>
      </CardContent></Card>
    </div>
    {!loading && !instructors.length && <p className="mt-6 rounded-md bg-amber-50 p-3 text-sm text-amber-800">No instructor profiles are available to assign.</p>}
  </div>
}

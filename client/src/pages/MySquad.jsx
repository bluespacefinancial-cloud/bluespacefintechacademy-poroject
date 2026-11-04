import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { supabase } from '../lib/supabase'
import { getCurrentProfile } from '../lib/profile'

export default function MySquad() {
  const [squad, setSquad] = useState(null)
  const [members, setMembers] = useState([])
  const [cohort, setCohort] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getCurrentProfile()
        const { data: enrolment, error: enrolmentError } = await supabase.from('enrolments').select('squad_id, cohort_id').eq('user_id', profile.id).in('status', ['enrolled', 'active']).maybeSingle()
        if (enrolmentError) throw enrolmentError
        if (!enrolment?.squad_id) return
        const [{ data: squadRow, error: squadError }, { data: roster, error: rosterError }, { data: cohortRow, error: cohortError }] = await Promise.all([
          supabase.from('squads').select('*').eq('id', enrolment.squad_id).single(),
          supabase.from('enrolments').select('user_id, track, users!inner(id, name, email)').eq('squad_id', enrolment.squad_id),
          supabase.from('cohorts').select('name').eq('id', enrolment.cohort_id).maybeSingle(),
        ])
        if (squadError) throw squadError
        if (rosterError) throw rosterError
        if (cohortError) throw cohortError
        setSquad(squadRow); setMembers(roster || []); setCohort(cohortRow?.name || '')
      } catch (loadError) { setError(loadError.message || 'Unable to load your squad') } finally { setLoading(false) }
    }
    load()
  }, [])

  return <div className="min-h-screen bg-gray-50"><div className="mb-6"><h1 className="text-2xl font-bold text-deep-600">My Squad</h1><p className="text-sm text-gray-500">Your live project team and cohort assignment.</p></div>{error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}{loading && <p className="py-10 text-center text-sm text-gray-500">Loading squad...</p>}{!loading && !squad && <Card><CardContent className="py-12 text-center text-sm text-gray-500">You are not assigned to a squad yet.</CardContent></Card>}{squad && <div className="grid gap-6 lg:grid-cols-3"><Card className="lg:col-span-2"><CardHeader><CardTitle className="text-sm">{squad.name}</CardTitle><p className="text-xs text-gray-500">{cohort}</p></CardHeader><CardContent><div className="mb-4 flex items-center gap-2 text-xs text-gray-500"><Users size={15} /> {members.length} members</div><div className="space-y-2">{members.map((member) => <div key={member.user_id} className="flex items-center justify-between rounded border p-3"><div><p className="text-sm">{member.users?.name || member.users?.email || 'Student'}</p><p className="text-xs text-gray-500">{member.track || 'Track not set'}</p></div>{member.user_id === squad.squad_lead_id && <Badge variant="outline">Squad lead</Badge>}</div>)}</div></CardContent></Card><Card><CardHeader><CardTitle className="text-sm">Squad status</CardTitle></CardHeader><CardContent className="space-y-3 text-xs text-gray-500"><p><Badge variant="outline">{members.length ? 'Active' : 'Forming'}</Badge></p><p>Use case and sprint assignments will appear here when staff publish them.</p></CardContent></Card></div>}</div>
}

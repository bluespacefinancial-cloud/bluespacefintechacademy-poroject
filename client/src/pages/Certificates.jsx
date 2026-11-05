import { useEffect, useState } from 'react'
import { Award, Download, ExternalLink } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { supabase } from '../lib/supabase'

const statusStyle = {
  certified: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  pending: 'bg-brand-50 text-brand-700 border-brand-100',
  remediation: 'bg-amber-50 text-amber-700 border-amber-100',
  deferred: 'bg-gray-50 text-gray-600 border-gray-100',
}

export default function Certificates() {
  const { user } = useAuth()
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!user?.id) {
        setError('Your academy profile is unavailable. Sign in again.')
        setLoading(false)
        return
      }
      const { data, error: loadError } = await supabase
        .from('certifications')
        .select('id, cohort_id, track, status, final_grade, certificate_url, created_at, cohorts(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (!mounted) return
      if (loadError) setError(loadError.message)
      else setCertificates(data || [])
      setLoading(false)
    }
    load().catch((loadError) => { if (mounted) { setError(loadError.message || 'Unable to load certificates.'); setLoading(false) } })
    return () => { mounted = false }
  }, [user?.id])

  return <div className="min-h-screen bg-gray-50">
    <div className="mb-6"><h1 className="text-2xl font-bold text-deep-600">Certificates</h1><p className="mt-1 text-sm text-gray-500">Your certification progress and issued credentials.</p></div>
    {error && <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {loading ? <p className="py-12 text-center text-sm text-gray-500">Loading certificates…</p> : certificates.length === 0 ? <Card><CardContent className="py-12 text-center text-sm text-gray-500">No certification records are available yet.</CardContent></Card> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {certificates.map((certificate) => <Card key={certificate.id}>
        <CardHeader className="flex flex-row items-start justify-between gap-3"><div className="flex items-center gap-3"><div className="rounded-lg bg-brand-50 p-2 text-brand-700"><Award size={20} /></div><div><CardTitle className="text-sm">BlueSPACE {certificate.track} Certificate</CardTitle><p className="mt-1 text-xs text-gray-500">{certificate.cohorts?.name || 'Academy cohort'}</p></div></div><Badge variant="outline" className={statusStyle[certificate.status] || ''}>{certificate.status}</Badge></CardHeader>
        <CardContent className="space-y-3 text-sm">
          {certificate.final_grade !== null && certificate.final_grade !== undefined && <p className="flex justify-between"><span className="text-gray-500">Final grade</span><strong>{certificate.final_grade}%</strong></p>}
          {certificate.created_at && <p className="flex justify-between"><span className="text-gray-500">Record date</span><span>{new Date(certificate.created_at).toLocaleDateString()}</span></p>}
          {certificate.certificate_url ? <Button asChild className="w-full"><a href={certificate.certificate_url} target="_blank" rel="noreferrer"><Download size={14} className="mr-2" />Open certificate <ExternalLink size={13} className="ml-2" /></a></Button> : <p className="text-xs text-gray-500">Your certificate link will appear here once it has been issued.</p>}
        </CardContent>
      </Card>)}
    </div>}
  </div>
}

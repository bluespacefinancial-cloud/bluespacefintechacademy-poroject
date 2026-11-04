import { useEffect, useState } from 'react'
import { Award, Clock, FileText, Download, Users, Target } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { supabase } from '../lib/supabase'

const STATUS = {
  certified: ['Certified', 'secondary', 'bg-emerald-50 text-emerald-700 border-emerald-100'],
  pending: ['In Progress', 'default', 'bg-brand-50 text-brand-700 border-brand-100'],
  remediation: ['Remediation Required', 'outline', 'bg-amber-50 text-amber-700 border-amber-100'],
  deferred: ['Deferred', 'outline', 'bg-gray-50 text-gray-600 border-gray-100'],
}

export default function Certificates() {
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCertificates = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser()
        if (!authData.user?.email) throw new Error('You must be signed in to view certificates')
        const { data: profile, error: profileError } = await supabase.from('users').select('id').eq('email', authData.user.email).single()
        if (profileError) throw profileError
        const [{ data, error: certificateError }, { data: cohorts, error: cohortsError }] = await Promise.all([
          supabase.from('certifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
          supabase.from('cohorts').select('id, name'),
        ])
        if (certificateError) throw certificateError
        if (cohortsError) throw cohortsError
        const cohortNames = new Map((cohorts || []).map((cohort) => [cohort.id, cohort.name]))
        setCertificates((data || []).map((certificate) => ({ ...certificate, cohortName: cohortNames.get(certificate.cohort_id) || 'Academy certification' })))
      } catch (loadError) {
        setError(loadError.message || 'Unable to load certificates')
      } finally {
        setLoading(false)
      }
    }
    loadCertificates()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6"><h1 className="mb-2 text-2xl font-bold text-deep-600">Certificates</h1><p className="text-sm text-gray-500">Your BlueSPACE Fellow certifications and credentials</p></div>
      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading && <p className="py-12 text-center text-sm text-gray-500">Loading certificates...</p>}
      {!loading && certificates.length === 0 && <Card><CardContent className="py-12 text-center text-sm text-gray-500">No certification records are available yet.</CardContent></Card>}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {certificates.map((certificate) => {
          const [label, variant, color] = STATUS[certificate.status] || STATUS.pending
          return <Card key={certificate.id} className={certificate.status === 'certified' ? 'border-emerald-200 shadow-sm' : ''}>
            <CardHeader className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-500"><Award size={16} /></div><Badge variant={variant} className={color}>{label}</Badge></CardHeader>
            <CardContent className="space-y-4">
              <div><CardTitle className="text-sm">BlueSPACE Fellow - {certificate.track} Track</CardTitle><p className="text-[10px] text-gray-500">{certificate.cohortName}</p></div>
              {certificate.final_grade !== null && <div className="flex justify-between"><span className="text-xs font-medium">Final Grade</span><span className="text-sm font-bold text-brand-600">{certificate.final_grade}%</span></div>}
              {certificate.certificate_url && <div className="flex justify-between"><span className="text-xs font-medium">Certificate file</span><a className="text-xs text-brand-700 hover:underline" href={certificate.certificate_url} target="_blank" rel="noreferrer">Open</a></div>}
              {certificate.verification_token && <div className="flex justify-between"><span className="text-xs font-medium">Verification</span><a className="text-xs text-brand-700 hover:underline" href={`/verify-certificate/${certificate.verification_token}`}>Verify certificate</a></div>}
            </CardContent>
            <CardFooter className="pt-4">{certificate.certificate_url ? <Button variant="outline" size="sm" className="w-full" onClick={() => window.open(certificate.certificate_url, '_blank')}><Download size={14} className="mr-2" />Download</Button> : <Button variant="outline" size="sm" className="w-full" disabled>Not Available</Button>}</CardFooter>
          </Card>
        })}
      </div>
      <Card className="mt-8"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Users size={14} /> About BlueSPACE Fellow Certification</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex items-center gap-3"><Target size={16} className="text-indigo-600" /><p className="text-xs text-gray-500">Certification eligibility is managed by academy staff after programme completion and review.</p></div><div className="flex items-center gap-3"><Clock size={16} className="text-amber-600" /><p className="text-xs text-gray-500">Certification records remain available in your student profile.</p></div><div className="flex items-center gap-3"><FileText size={16} className="text-slate-600" /><p className="text-xs text-gray-500">Certified fellows may proceed to the placement pathway.</p></div></CardContent></Card>
    </div>
  )
}

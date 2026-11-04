import { useEffect, useState } from 'react'
import { Award, CheckCircle, XCircle } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { supabase } from '../lib/supabase'

export default function CertificateVerify() {
  const { token } = useParams()
  const [certificate, setCertificate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    supabase.rpc('verify_certificate', { p_token: token }).maybeSingle().then(({ data, error: queryError }) => { if (queryError) setError(queryError.message); setCertificate(data); setLoading(false) })
  }, [token])
  return <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6"><Card className="w-full max-w-lg"><CardHeader className="text-center"><Award size={38} className="mx-auto mb-2 text-brand-600" /><CardTitle>BlueSPACE Certificate Verification</CardTitle></CardHeader><CardContent>{loading ? <p className="text-center text-sm text-gray-500">Verifying certificate...</p> : certificate ? <div className="space-y-3 text-center"><CheckCircle size={30} className="mx-auto text-emerald-600" /><Badge variant="secondary">Valid certificate</Badge><p className="text-lg font-semibold">{certificate.fellow_name || 'BlueSPACE Fellow'}</p><p className="text-sm text-gray-500">{certificate.track} Track · {certificate.cohort_name}</p><p className="text-xs text-gray-500">Certificate number: {certificate.certificate_number}</p><p className="text-xs text-gray-500">Issued: {certificate.issued_at ? new Date(certificate.issued_at).toLocaleDateString() : 'Not recorded'}</p></div> : <div className="space-y-3 text-center"><XCircle size={30} className="mx-auto text-red-600" /><p className="font-semibold">Certificate not found or revoked</p><p className="text-sm text-gray-500">{error || 'The verification link is not valid.'}</p></div>}</CardContent></Card></div>
}

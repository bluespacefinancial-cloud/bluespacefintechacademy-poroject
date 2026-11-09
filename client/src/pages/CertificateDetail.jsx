import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/backend'
import ProfessionalCertificate from '../components/certificate/ProfessionalCertificate'

export default function CertificateDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [cert, setCert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function load() {
      if (!id) return
      setLoading(true)
      setError('')

      try {
        const { data, error: queryError } = await api
          .from('certifications')
          .select(`
            id, cohort_id, track, status, final_grade, certificate_url, created_at,
            certificate_number, verification_token, issued_at, certificate_title,
            partner_name, partner_logo_url, bluespace_logo_url,
            cohorts(name)
          `)
          .eq('id', id)
          .maybeSingle()

        if (queryError) throw queryError
        if (!isMounted) return

        if (!data) {
          setError('Certificate record not found.')
        } else {
          setCert(data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load certificate.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [id])

  return (
    <div className="min-h-screen bg-slate-100/70 py-6 sm:py-8 px-4 sm:px-6 print:bg-white print:p-0">
      {/* Subtle Top Utility Bar (Hidden on print) */}
      <div className="print:hidden max-w-5xl mx-auto mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/certificates')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-slate-200/60 cursor-pointer"
        >
          <ArrowLeft size={13} className="text-slate-400" />
          <span>Back to Certificates</span>
        </button>

        <span className="text-[11px] font-mono text-slate-400">
          Ref: #{cert?.certificate_number || id}
        </span>
      </div>

      <div className="max-w-5xl mx-auto print:max-w-none print:m-0">
        {loading && (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-semibold text-gray-700">Loading certificate…</p>
          </div>
        )}

        {!loading && (error || !cert) && (
          <Card className="border border-red-200 shadow-sm bg-white text-center py-12">
            <CardContent className="space-y-4">
              <p className="text-sm text-red-600 font-semibold">{error || 'Certificate not found'}</p>
              <Button asChild variant="outline" size="sm">
                <Link to="/certificates">Return to Certificates</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && cert && (
          <div className="space-y-6">
            <ProfessionalCertificate
              fellowName={user?.name || 'BlueSPACE Fellow'}
              studentId={user?.student_id || 'BS-2026-0042'}
              track={cert.track}
              cohortName={cert.cohorts?.name || 'Cohort 1 - December 2026'}
              certificateNumber={
                cert.certificate_number || `BSA-2026-${String(cert.id).padStart(6, '0')}`
              }
              verificationToken={
                cert.verification_token ||
                cert.certificate_url?.split('/').pop() ||
                'a0000000-0000-0000-0000-000000000001'
              }
              issuedAt={cert.issued_at || cert.created_at}
              finalGrade={cert.final_grade}
              certificateTitle={cert.certificate_title}
              partnerName={cert.partner_name}
              partnerLogoUrl={cert.partner_logo_url}
              bluespaceLogoUrl={cert.bluespace_logo_url || '/logo-dark.png'}
              showActions={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}

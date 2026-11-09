import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Award, CheckCircle2, FileCheck2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
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
        const { data, error: queryError } = await supabase
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
    <div className="min-h-screen bg-gray-50/60 pb-16 print:bg-white print:p-0">
      {/* Top Bar (Hidden on print) */}
      <div className="print:hidden max-w-5xl mx-auto mb-6 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/certificates')}
          className="text-xs font-medium border-gray-200 hover:bg-gray-100 flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          Back to Certificates
        </Button>

        <span className="text-xs font-mono font-medium text-gray-500">
          Certificate #{cert?.certificate_number || id}
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

            {/* Verification Metadata Box */}
            <div className="print:hidden bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5 mb-3">
                <FileCheck2 size={16} className="text-[#0000ff]" />
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                  Official Verification Details
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 text-[10px] uppercase font-semibold block">Track</span>
                  <span className="font-semibold text-gray-900">{cert.track} Engineering</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] uppercase font-semibold block">Cohort</span>
                  <span className="font-semibold text-gray-900">{cert.cohorts?.name || 'Cohort 1'}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] uppercase font-semibold block">Certificate Ref</span>
                  <span className="font-mono font-bold text-brand-600">{cert.certificate_number}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] uppercase font-semibold block">Status</span>
                  <span className="font-semibold text-emerald-700 capitalize">{cert.status}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

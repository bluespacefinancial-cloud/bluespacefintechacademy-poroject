import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Award,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  FileCheck2,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { supabase } from '../lib/supabase'
import ProfessionalCertificate from '../components/certificate/ProfessionalCertificate'

export default function CertificateVerify() {
  const { token } = useParams()
  const [certificate, setCertificate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function verify() {
      setLoading(true)
      setError('')

      try {
        const { data, error: rpcError } = await supabase
          .rpc('verify_certificate', { p_token: token })
          .maybeSingle()

        if (rpcError) throw rpcError

        if (!isMounted) return

        if (!data) {
          setError('Certificate not found or has been revoked.')
          setCertificate(null)
        } else {
          setCertificate(data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to verify certificate link.')
          setCertificate(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (token) {
      verify()
    } else {
      setError('No certificate token provided.')
      setLoading(false)
    }

    return () => {
      isMounted = false
    }
  }, [token])

  return (
    <div className="min-h-screen bg-gray-50/60 pb-16 print:bg-white print:p-0">
      {/* Top Navigation Bar (Hidden during print) */}
      <header className="print:hidden border-b border-gray-200/90 bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-gray-900 hover:text-[#0000FF] transition-colors">
            <ArrowLeft size={16} />
            <img src="/logo-dark.png" alt="BlueSPACE Academy" className="h-6 w-auto" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 hidden sm:inline">
              Fintech Academy Registry
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/student-login">
              <Button variant="outline" size="sm" className="text-xs border-gray-200">
                Academy Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 print:p-0 print:m-0 print:max-w-none">
        
        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-semibold text-gray-700">Verifying credential against registry...</p>
            <p className="text-xs text-gray-400 font-mono">Token: {token}</p>
          </div>
        )}

        {/* Error / Revoked State */}
        {!loading && (error || !certificate) && (
          <div className="max-w-xl mx-auto py-12">
            <Card className="border border-red-200 shadow-sm bg-white overflow-hidden text-center">
              <div className="bg-red-50 p-6 border-b border-red-100">
                <XCircle size={44} className="text-red-500 mx-auto mb-2" />
                <h2 className="text-lg font-bold text-red-900">Certificate Verification Failed</h2>
                <p className="text-xs text-red-700 mt-1">
                  The requested certificate could not be validated in the BlueSPACE registry.
                </p>
              </div>
              <CardContent className="p-6 space-y-4 text-xs text-gray-600">
                <p>
                  {error || 'This certificate record does not exist, has expired, or has been revoked by the examination board.'}
                </p>
                <div className="p-3 bg-gray-50 rounded font-mono text-[11px] text-gray-600 break-all">
                  Verification Token: {token}
                </div>
                <div className="pt-2 flex justify-center gap-3">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/">Return to Academy Home</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Successful Verification: Full Certificate & Metadata */}
        {!loading && certificate && (
          <div className="space-y-6">
            
            {/* Verification Status Banner (Hidden during print) */}
            <div className="print:hidden bg-white border border-emerald-200/90 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={22} className="text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-gray-900">
                      Official Verified Credential
                    </h2>
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                      Active
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    This certificate is authentic, issued by BlueSPACE Fintech Academy, and recorded in the official academy registry.
                  </p>
                </div>
              </div>

              <div className="text-xs font-mono text-gray-500 sm:text-right shrink-0">
                <span>Verified at: </span>
                <span className="font-semibold text-gray-900">{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* The Professional Certificate UI */}
            <ProfessionalCertificate
              fellowName={certificate.fellow_name}
              track={certificate.track}
              cohortName={certificate.cohort_name}
              certificateNumber={certificate.certificate_number}
              verificationToken={token}
              issuedAt={certificate.issued_at}
              showActions={true}
            />

            {/* Verification Record (Hidden during print) */}
            <div className="print:hidden bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileCheck2 size={16} className="text-brand-600" />
                  <h3 className="text-sm font-bold text-gray-900">
                    Registry Record
                  </h3>
                </div>
                <span className="text-[11px] text-gray-500 font-mono">
                  Official Verification Record
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                  <span className="text-gray-500 text-[10px] uppercase font-semibold">Recipient</span>
                  <p className="font-bold text-gray-900">{certificate.fellow_name}</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                  <span className="text-gray-500 text-[10px] uppercase font-semibold">Specialization Track</span>
                  <p className="font-bold text-gray-900">{certificate.track} Engineering</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                  <span className="text-gray-500 text-[10px] uppercase font-semibold">Cohort</span>
                  <p className="font-bold text-gray-900">{certificate.cohort_name}</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                  <span className="text-gray-500 text-[10px] uppercase font-semibold">Certificate Number</span>
                  <p className="font-bold font-mono text-brand-600">{certificate.certificate_number}</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                  <span className="text-gray-500 text-[10px] uppercase font-semibold">Date of Issuance</span>
                  <p className="font-bold text-gray-900">
                    {certificate.issued_at ? new Date(certificate.issued_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Recorded in Session'}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                  <span className="text-gray-500 text-[10px] uppercase font-semibold">Verification Token</span>
                  <p className="font-mono text-[10px] text-gray-700 truncate">{token}</p>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  )
}

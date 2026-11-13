import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, XCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { api } from '../lib/backend'
import ProfessionalCertificate from '../components/certificate/ProfessionalCertificate'
import { Breadcrumb } from '../components/ui/breadcrumb'

export default function CertificateVerify() {
  const { token } = useParams()
  const [certificate, setCertificate] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))
  const [error, setError] = useState(token ? '' : 'No certificate token provided.')

  useEffect(() => {
    let isMounted = true

    async function verify() {
      setLoading(true)
      setError('')

      try {
        const { data, error: rpcError } = await api
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
          setError(err.message || 'Unable to verify certificate.')
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
    }

    return () => {
      isMounted = false
    }
  }, [token])

  return (
    <div className="min-h-screen bg-gray-50/70 dark:bg-gray-950 pb-12 print:bg-white print:p-0 text-gray-900 dark:text-white">
      <Breadcrumb items={[{ to: '/certificates', label: 'Certificates' }, { label: 'Verify Certificate' }]} />
      {/* Minimal Top Header (Hidden on print) */}
      <header className="print:hidden border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300 hover:text-deep-600 dark:hover:text-deep-400 transition-colors">
            <ArrowLeft size={16} />
            <img src="/logo-dark.png" alt="BlueSPACE Academy" className="h-6 w-auto" />
          </Link>

          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
            Official Credential Verification
          </span>
        </div>
      </header>

      {/* Main Content: Clean Certificate Presentation */}
      <main className="max-w-5xl mx-auto px-4 pt-6 sm:pt-8 print:p-0 print:m-0 print:max-w-none">
        {loading && (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold text-gray-600">Verifying certificate…</p>
          </div>
        )}

        {!loading && (error || !certificate) && (
          <div className="max-w-md mx-auto py-16">
            <Card className="border border-red-200 shadow-sm bg-white text-center p-6 space-y-4">
              <XCircle size={36} className="text-red-500 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900">Certificate Verification Failed</h3>
                <p className="text-xs text-gray-500">{error || 'This certificate link is invalid or has been revoked.'}</p>
              </div>
              <Button asChild variant="outline" size="sm" className="text-xs">
                <Link to="/">Back to Home</Link>
              </Button>
            </Card>
          </div>
        )}

        {!loading && certificate && (
          <div className="space-y-4">
            <ProfessionalCertificate
              fellowName={certificate.fellow_name}
              track={certificate.track}
              cohortName={certificate.cohort_name}
              certificateNumber={certificate.certificate_number}
              verificationToken={token}
              issuedAt={certificate.issued_at}
              showActions={true}
            />
          </div>
        )}
      </main>
    </div>
  )
}

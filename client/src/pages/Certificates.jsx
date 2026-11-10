import { useEffect, useState } from 'react'
import { Award, ExternalLink, Eye, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent } from '../components/ui/dialog'
import { api } from '../lib/backend'
import ProfessionalCertificate from '../components/certificate/ProfessionalCertificate'
import { Breadcrumb } from '../components/ui/breadcrumb'

const statusStyle = {
  certified: 'text-emerald-700 border-emerald-200 bg-emerald-50',
  pending: 'text-brand-700 border-brand-200 bg-brand-50',
  remediation: 'text-amber-700 border-amber-200 bg-amber-50',
  deferred: 'text-gray-600 border-gray-200 bg-gray-50',
}

export default function Certificates() {
  const { user } = useAuth()
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCert, setSelectedCert] = useState(null)
  const [popupOpen, setPopupOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!user?.id) {
        setError('Your academy profile is unavailable. Sign in again.')
        setLoading(false)
        return
      }
      const { data, error: loadError } = await api
        .from('certifications')
        .select(`
          id, cohort_id, track, status, final_grade, certificate_url, created_at,
          certificate_number, verification_token, issued_at, certificate_title,
          partner_name, partner_logo_url, bluespace_logo_url,
          cohorts(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!mounted) return
      if (loadError) {
        setError(loadError.message)
      } else {
        setCertificates(data || [])
      }
      setLoading(false)
    }

    load().catch((loadError) => {
      if (mounted) {
        setError(loadError.message || 'Unable to load certificates.')
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [user?.id])

  const handleOpenCertificatePopup = (cert) => {
    setSelectedCert(cert)
    setPopupOpen(true)
  }

  return (
    <div className="w-full space-y-6">
      <Breadcrumb items={[{ label: 'Certificates' }]} />
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <Award className="text-[#0000ff] dark:text-blue-400" size={26} />
            Academic Certificates
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Official graduation diplomas, specialization certificates, and verification links.
          </p>
        </div>

        {certificates.filter((c) => c.status === 'certified').length > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs font-semibold text-brand-700 dark:text-blue-300">
            <CheckCircle2 size={14} className="text-[#0000ff] dark:text-blue-400" />
            <span>
              {certificates.filter((c) => c.status === 'certified').length} Active Certificate
              {certificates.filter((c) => c.status === 'certified').length === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading your academic credentials…</p>
        </div>
      ) : certificates.length === 0 ? (
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-card">
          <CardContent className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0000ff] dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-100 dark:border-blue-900/50">
              <Award size={26} />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">No Certification Records Yet</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
              Academic certificates are awarded upon achieving required coursework completion, passing all distributed ledger labs, and successfully defending your capstone project before the technical panel.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {certificates.map((certificate) => {
            const isCertified = certificate.status === 'certified'
            const certTitle = certificate.certificate_title || `BlueSPACE ${certificate.track} Certificate`
            const certNumber = certificate.certificate_number || `BSA-2026-${String(certificate.id).padStart(6, '0')}`

            return (
              <Card
                key={certificate.id}
                className="border border-gray-200 dark:border-gray-800 shadow-sm bg-card hover:border-gray-300 dark:hover:border-gray-700 transition-all flex flex-col justify-between"
              >
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-blue-50 dark:bg-blue-950/60 p-2.5 text-[#0000ff] dark:text-blue-400 shrink-0 border border-blue-100 dark:border-blue-900/50">
                      <Award size={22} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                        {certTitle}
                      </CardTitle>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {certificate.cohorts?.name || 'Academy Cohort'}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`capitalize text-[10px] font-semibold ${statusStyle[certificate.status] || ''}`}
                  >
                    {certificate.status}
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-4 pt-1 text-xs">
                  {/* Metadata Box */}
                  <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">Certificate No</span>
                      <span className="font-mono font-bold text-gray-900 dark:text-white">{certNumber}</span>
                    </div>

                    {certificate.final_grade !== null && certificate.final_grade !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400">Final Grade</span>
                        <span className="font-bold text-brand-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/50">
                          {certificate.final_grade}%
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">Specialization</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{certificate.track} Track</span>
                    </div>

                    {certificate.issued_at && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400">Issued On</span>
                        <span>{new Date(certificate.issued_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-1">
                    {isCertified ? (
                      <>
                        {/* View Certificate Button: strictly adopting the system blue color */}
                        <Button
                          onClick={() => handleOpenCertificatePopup(certificate)}
                          className="w-full text-xs font-semibold bg-[#0000ff] hover:bg-[#0000cc] text-white shadow-sm"
                        >
                          <Eye size={14} className="mr-2" />
                          View Certificate
                        </Button>

                        {certificate.certificate_url && (
                          <Button
                            asChild
                            variant="outline"
                            className="w-full text-xs font-medium border-gray-200 hover:bg-gray-50 text-gray-700"
                          >
                            <a href={certificate.certificate_url} target="_blank" rel="noreferrer">
                              <ExternalLink size={13} className="mr-1.5" />
                              Public Verification Link
                            </a>
                          </Button>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-500 italic text-center py-2">
                        Certificate link and verification will unlock upon panel approval.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Clean Popup Modal for Viewing Certificate */}
      <Dialog open={popupOpen} onOpenChange={setPopupOpen}>
        <DialogContent className="max-w-5xl p-4 sm:p-6 bg-white border-none shadow-2xl overflow-y-auto max-h-[92vh]">
          {selectedCert && (
            <div className="space-y-4">
              <ProfessionalCertificate
                fellowName={user?.name || 'BlueSPACE Fellow'}
                studentId={user?.student_id || 'BS-2026-0042'}
                track={selectedCert.track}
                cohortName={selectedCert.cohorts?.name || 'Cohort 1 - December 2026'}
                certificateNumber={
                  selectedCert.certificate_number ||
                  `BSA-2026-${String(selectedCert.id).padStart(6, '0')}`
                }
                verificationToken={
                  selectedCert.verification_token ||
                  selectedCert.certificate_url?.split('/').pop() ||
                  'a0000000-0000-0000-0000-000000000001'
                }
                issuedAt={selectedCert.issued_at || selectedCert.created_at}
                finalGrade={selectedCert.final_grade}
                certificateTitle={selectedCert.certificate_title}
                partnerName={selectedCert.partner_name}
                partnerLogoUrl={selectedCert.partner_logo_url}
                bluespaceLogoUrl={selectedCert.bluespace_logo_url || '/logo-dark.png'}
                showActions={true}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

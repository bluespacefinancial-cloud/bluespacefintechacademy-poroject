import { useState } from 'react'
import { Award, FileText, Download } from 'lucide.react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { supabase } from '../lib/supabase'

const CERTIFICATE_TEMPLATES = {
  FaaS: {
    title: 'BlueSPACE Fellow Certification - Finsoft Track',
    subtitle: 'Certified Fintech Software Developer & DevOps Engineer',
    description: 'This certifies that the recipient has successfully completed the Finsoft Fellows program, demonstrating proficiency in financial software engineering, API design, ledger engineering, CI/CD pipelines, and cloud platforms as run in the BlueSPACE AI Fintech Factory domains: FaaS, FinCore, FinOps and FinInfra.',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    accentColor: '#4f46e5',
    bgColor: '#eff6ff',
  },
  Finops: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    fill: 'bg-amber-500',
    label: 'FinOps',
    title: 'BlueSPACE Fellow Certification - Finops Track',
    subtitle: 'Certified Finance Operations Professional',
    description: 'This certifies that the recipient has successfully completed the Finops Fellows program, demonstrating proficiency in financial operations automation, reconciliation, settlement, reporting, controls, and exceptions handling with AI support as run in the BlueSPACE AI Fintech Factory domains: FaaS, FinCore, FinOps and FinInfra.',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    accentColor: '#f59e0b',
    bgColor: '#fef3c7',
  },
}

export default function Certificates() {
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)

  const loadCertificates = async () => {
    try {
      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const transformed = (data || []).map((c) => ({
        id: c.id,
        title: c.title || `${c.track} Certification`,
        track: c.track,
        status: c.status || 'certified',
        date: c.created_at,
        grade: c.final_grade,
        certificateId: c.id,
        downloadUrl: null,
      }))

      setCertificates(transformed)
    } catch (err) {
      console.error('Error loading certifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCertificates()
  }, [])

  const downloadCertificate = async (certificationId) => {
    try {
      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .eq('id', certificationId)
        .single()

      if (error) throw error

      const certificateData = {
        recipient: 'Student Name',
        track: data.track,
        certification: `${data.track} Certification`,
        date: c.created_at,
        skillsProfile: c.skills_profile || {},
      }

      const pdfContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <style>
            @page {
              size: letter;
              margin: 0.5in;
            }
            body {
              font-family: 'Georgia', serif;
              padding: 1cm;
              background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
              color: #1e293b;
              min-height: 100vh;
              padding: 40px;
              background-image: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            }
            .border {
              border: 4px solid #1e3a8a;
              padding: 30px;
              position: relative;
              background: white;
              min-height: calc(100vh - 80px);
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            .title {
              font-size: 36px;
              font-weight: bold;
              color: #1e3a8a;
              margin-bottom: 10px;
            }
            .subtitle {
              font-size: 18px;
              color: #64748b;
              margin-bottom: 20px;
            }
            .description {
              font-size: 14px;
              line-height: 1.6;
              color: #64748b;
              margin-bottom: 30px;
            }
            .certificate-details {
              margin-bottom: 40px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 14px;
            }
            .label {
              font-weight: bold;
              color: #64748b;
            }
            .value {
              font-weight: bold;
              color: #1e293b;
            }
            .signature-section {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
            }
            .signature-line {
              width: 200px;
              border-bottom: 1px solid #94a3b8;
              padding-bottom: 10px;
              margin-top: 20px;
            }
            .signature-label {
              font-size: 11px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-top: 5px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="border">
            <div class="header">
              <div class="title">BlueSPACE Fintech Academy</div>
              <div class="subtitle">Certificate of Completion</div>
            </div>
            <div class="certificate-details">
              <div class="detail-row">
                <span class="label">Name:</span>
                <span class="value">Student Name</span>
              </div>
              <div class="detail-row">
                <span class="label">Track:</span>
                <span class="value">${data.track}</span>
              </div>
              <div class="detail-row">
                <span class="label">Certification:</span>
                <span class="value">${c.track} Fellowship Certification</span>
              </div>
              <div class="detail-row">
                <span class="label">Date:</span>
                <span class="value">${new Date(c.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="detail-row">
                <span class="label">Certificate ID:</span>
                <span class="value">${c.id}</span>
              </div>
            </div>
            <div class="signature-section">
              <div>
                <div class="signature-line"></div>
                <div class="signature-label">Academy Director</div>
              </div>
              <div class="signature-line"></div>
              <div class="signature-label">Date</div>
            </div>
            <div class="footer">
              BlueSPACE Fintech Academy &copy; ${new Date().getFullYear()}
            </div>
          </div>
        </body>
        </html>
      `

      // Generate PDF using window.print()
      const printWindow = window.open('', '_blank')
      printWindow.document.write(pdfContent)
      printWindow.document.close()
      printWindow.print()
    } catch (err) {
      console.error('Error generating PDF:', err)
      alert('Failed to generate certificate PDF. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-deep-600 mb-2">Certificates</h1>
        <p className="text-sm text-gray-500">
          Your BlueSPACE Fellow certifications and credentials
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {certificates.map((cert) => (
          <Card
            key={cert.id}
            className={cert.status === 'certified' ? 'border-emerald-200 shadow-sm' : ''}
          >
            <CardHeader className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold ${cert.status === 'certified' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}">
                <Award size={16} />
              </div>
              <Badge variant={cert.status === 'certified' ? 'secondary' : 'default'} className={cert.status === 'certified' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-600 border-gray-100'}>
                {cert.label}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <CardTitle className="text-sm">{cert.title}</CardTitle>
                <p className="text-[10px] text-gray-500">{cert.track} Track</p>
              </div>
              {cert.grade && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-deep-600">Final Grade</span>
                  <span className="text-sm font-bold text-brand-600">{cert.grade}</span>
                </div>
              )}
              {cert.date && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-deep-600">Certified On</span>
                  <span className="text-xs text-gray-500">{new Date(cert.date).toLocaleDateString()}</span>
                </div>
              )}
              {cert.certificateId && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-deep-600">Certificate ID</span>
                  <span className="text-xs font-mono text-gray-600">{cert.certificateId}</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-4">
              {cert.downloadUrl ? (
                <Button variant="outline" size="sm" className="w-full" onClick={() => window.open(cert.downloadUrl, '_blank')}>
                  <Download size={14} className="mr-2" />
                  Download PDF
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="w-full" disabled>
                  Not Available
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

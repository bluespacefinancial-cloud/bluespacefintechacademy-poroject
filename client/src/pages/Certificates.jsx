import { useState, useEffect } from 'react'
import { Award, FileText, Download } from 'lucide.react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { supabase } from '../lib/supabase'

const CERTIFICATE_TEMPLATES = {
  Finsoft: {
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
        downloadUrl: c.download_url,
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
                {cert.status}
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

import { useState } from 'react'
import { Award, FileText, Download } from 'lucide.react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { supabase } from '../lib/supabase'

const CERTIFICATE_STATUSES = {
  certified: { label: 'Certified', variant: 'secondary', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  in_progress: { label: 'In Progress', variant: 'default', color: 'bg-brand-50 text-brand-700 border-brand-100' },
  remediation: { label: 'Remediation', variant: 'outline', color: 'text-amber-600' },
  not_started: { label: 'Not Started', variant: 'outline', color: 'bg-gray-50 text-gray-600 border-gray-100' },
}

const MOCK_CERTIFICATES = [
  {
    id: 1,
    title: 'BlueSPACE Fellow - Finsoft Track',
    track: 'Finsoft',
    status: 'certified',
    date: '2027-04-16',
    grade: '87%',
    certificateId: 'BS-FS-2027-001',
    downloadUrl: '#',
  },
  {
    id: 2,
    title: 'Domain Assessment: FinCore',
    track: 'Finsoft',
    status: 'certified',
    date: '2027-02-15',
    grade: '82%',
    certificateId: 'BS-DC-FC-2027-001',
    downloadUrl: '#',
  },
]

export default function Certificates() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-deep-600 mb-2">Certificates</h1>
        <p className="text-sm text-gray-500">
          Your BlueSPACE Fellow certifications and credentials
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_CERTIFICATES.map((cert) => {
          const config = CERTIFICATE_STATUSES[cert.status]
          return (
            <Card key={cert.id} className={cert.status === 'certified' ? 'border-emerald-200 shadow-sm' : ''}>
              <CardHeader className="flex items-center justify-between">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold ${cert.status === 'certified' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  <Award size={16} />
                </div>
                <Badge variant={config.variant} className={cert.color}>
                  {config.label}
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
          )}
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { FileText, Upload, CheckCircle, Target, Award } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'

const CAPSTONE_STATUSES = {
  draft: { label: 'Draft', variant: 'outline' },
  submitted: { label: 'Submitted', variant: 'default' },
  under_review: { label: 'Under Review', variant: 'default' },
  passed: { label: 'Passed', variant: 'secondary' },
  failed: { label: 'Failed', variant: 'destructive' },
  remediation: { label: 'Remediation Required', variant: 'outline' },
}

const MOCK_CAPSTONE = {
  id: 1,
  title: 'Capstone: Automated Reconciliation Pipeline',
  track: 'Finops',
  squad: 'Squad Alpha',
  status: 'draft',
  deliverableType: 'Automated operating process',
  submittedAt: null,
  score: null,
  feedback: null,
  panelReviewDate: null,
  requirements: [
    'Working service/process deployed to sandbox',
    'Source code in GitHub repository',
    'Documentation and README',
    'Test results and validation',
    'Demo video or live demonstration',
  ],
}

export default function CapstoneSubmission() {
  const [repoUrl, setRepoUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [submissionStatus, setSubmissionStatus] = useState('draft')

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmissionStatus('submitted')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-deep-600 mb-1">Capstone Submission</h1>
            <p className="text-sm text-gray-500">
              Submit your track deliverable for certification review
            </p>
          </div>
          <Badge className={CAPSTONE_STATUSES[submissionStatus].variant === 'outline' ? 'bg-slate-50 text-slate-600 border-slate-100' : 'bg-brand-50 text-brand-700 border-brand-100'}>
            {CAPSTONE_STATUSES[submissionStatus].label}
          </Badge>
        </div>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Capstone Deliverable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-medium text-deep-600">Track</span>
              <Badge className={MOCK_CAPSTONE.track === 'Finsoft' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}>
                {MOCK_CAPSTONE.track} Fellows
              </Badge>
            </div>
            <div className="space-y-2">
              <span className="text-xs font-medium text-deep-600">Deliverable Type</span>
              <p className="text-xs text-gray-600">{MOCK_CAPSTONE.deliverableType}</p>
            </div>
            <div className="space-y-2">
              <span className="text-xs font-medium text-deep-600">Squad</span>
              <p className="text-xs text-gray-600">{MOCK_CAPSTONE.squad}</p>
            </div>
            <div className="space-y-2">
              <span className="text-xs font-medium text-deep-600">Requirements</span>
              <ul className="space-y-1 text-xs text-gray-600 list-disc list-inside">
                {MOCK_CAPSTONE.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Submit Your Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-500">
                  GitHub Repository URL
                </label>
                <div className="relative">
                  <Input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/yourusername/capstone-project"
                    required
                  />
                  <Upload size={16} className="absolute right-2 top-1/2 -mt-2 text-gray-400" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-500">
                  Demo / Live Deployment URL (optional)
                </label>
                <Input
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://your-capstone.vercel.app"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-500">
                  Notes to Panel (optional)
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-deep-600 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
                  placeholder="Any context for the review panel..."
                />
              </div>
              <Button type="submit" className="w-full" disabled={!repoUrl}>
                {submissionStatus === 'submitted' ? 'Submitted' : 'Submit for Review'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileText size={14} className="mr-1.5" />
              Submission History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white">
              <div>
                <p className="text-xs font-medium text-deep-600">Draft Submission</p>
                <p className="text-[10px] text-gray-500">Not yet submitted</p>
              </div>
              <Badge variant="outline">Draft</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">About Certification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle size={16} className="text-emerald-600" />
              <div className="flex-1">
                <p className="text-xs font-medium text-deep-600">Panel Review</p>
                <p className="text-[10px] text-gray-500">Reviewed by BlueSPACE domain leads</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Target size={16} className="text-indigo-600" />
              <div className="flex-1">
                <p className="text-xs font-medium text-deep-600">Skills Profile</p>
                <p className="text-[10px] text-gray-500">Used for project placement matching</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Award size={16} className="text-amber-600" />
              <div className="flex-1">
                <p className="text-xs font-medium text-deep-600">Certificate</p>
                <p className="text-[10px] text-gray-500">BlueSPACE Fellow certification</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Certification Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <div className="flex-1">
                <p className="text-xs font-medium text-deep-600">Capstone Submission</p>
                <p className="text-[10px] text-gray-500">Not yet submitted</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <div className="flex-1">
                <p className="text-xs font-medium text-deep-600">Panel Review</p>
                <p className="text-[10px] text-gray-500">Pending submission</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <div className="flex-1">
                <p className="text-xs font-medium text-deep-600">Certification</p>
                <p className="text-[10px] text-gray-500">Pending panel review</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

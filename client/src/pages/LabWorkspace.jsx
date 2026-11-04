import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Upload, CheckCircle, AlertCircle, FileText } from 'lucide.react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { supabase } from '../lib/supabase'

const DOMAIN_COLORS = {
  FaaS: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  FinCore: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  FinOps: 'bg-amber-100 text-amber-700 border-amber-200',
  FinInfra: 'bg-slate-100 text-slate-700 border-slate-200',
}

export default function LabWorkspace() {
  const navigate = useNavigate()
  const [submissionUrl, setSubmissionUrl] = useState('')
  const [submissionStatus, setSubmissionStatus] = useState('draft')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [ledgerEntries, setLedgerEntries] = useState([
    { transactionId: 'TX-001', account: 'Cash', debit: 100, credit: 0 },
    { transactionId: 'TX-001', account: 'Revenue', debit: 0, credit: 100 },
  ])
  const [ledgerMessage, setLedgerMessage] = useState('')

  const lab = {
    id: 1,
    title: 'Guided Lab: Build a Simple Ledger with Double-Entry Postings',
    domain: 'FinCore',
    module: 'FinCore: Ledger and Transaction Engineering',
    week: 'Weeks 5-6',
    duration: '90 minutes',
    dueDate: '2027-01-15',
    instructions: `# Lab Objective

Implement a simple double-entry ledger with balance checks. This lab will help you understand:
- How financial transactions are recorded using double-entry bookkeeping
- How to maintain data integrity with idempotency
- How to validate postings against balance rules

## Requirements

1. Create a Ledger class with \`post(transaction)\` method
2. Implement double-entry validation (debits must equal credits)
3. Add balance check queries per account
4. Handle idempotency - same transaction ID should not post twice
5. Write unit tests for all operations

## Starter Code

\`\`\`javascript
class Ledger {
  constructor() {
    this.accounts = new Map()
    this.transactions = new Map()
  }

  post(transaction) {
    // Your implementation here
  }

  getBalance(accountId) {
    // Your implementation here
  }

  validate() {
    // Your implementation here
  }
}
\`\`\`

## Submission

Submit your solution as a GitHub repository link or upload your code files.
    `,
    starterCode: `class Ledger {
  constructor() {
    this.accounts = new Map()
    this.transactions = new Map()
  }

  post(transaction) {
    // TODO: Implement double-entry posting
  }

  getBalance(accountId) {
    // TODO: Implement balance check
  }

  validate() {
    // TODO: Implement validation
  }
}`,
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmissionStatus('submitted')
  }

  const validateLedger = () => {
    const ids = ledgerEntries.map((entry) => entry.transactionId.trim()).filter(Boolean)
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)
    const debits = ledgerEntries.reduce((total, entry) => total + Number(entry.debit || 0), 0)
    const credits = ledgerEntries.reduce((total, entry) => total + Number(entry.credit || 0), 0)
    const invalidAmounts = ledgerEntries.some((entry) => Number(entry.debit || 0) < 0 || Number(entry.credit || 0) < 0 || (Number(entry.debit || 0) > 0 && Number(entry.credit || 0) > 0))
    if (!ledgerEntries.length || duplicateIds.length || invalidAmounts || Math.round(debits * 100) !== Math.round(credits * 100)) {
      setLedgerMessage(`Validation failed: debits ${debits.toFixed(2)} / credits ${credits.toFixed(2)}. Each transaction must balance and each line must contain either a debit or credit.`)
      return
    }
    setLedgerMessage(`Lab validated: ${ledgerEntries.length} entries balance at ${debits.toFixed(2)}.`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-deep-600 mb-1">Lab Workspace</h1>
          <p className="text-sm text-gray-500">Guided lab: {lab.title}</p>
        </div>
        <Button onClick={() => navigate('/my-learning')}>
          ← Back to Learning
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lab Instructions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0">
                  <FileText size={14} className="text-deep-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm">{lab.title}</CardTitle>
                  <CardDescription className="text-[10px]">{lab.module} · {lab.domain}</CardDescription>
                  <div className="mt-2">
                    <CardDescription className="text-xs text-gray-500">{lab.week} · {lab.duration}</CardDescription>
                    <Badge className={DOMAIN_COLORS[lab.domain]}>{lab.domain}</Badge>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">{lab.status}</Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="prose prose-sm text-gray-600 max-w-none">
                {lab.instructions.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) {
                    return <h3 key={i} className="text-base font-bold text-deep-600 mt-4 mb-2">{line.slice(2)}</h3>
                  }
                  if (line.startsWith('## ')) {
                    return <h4 key={i} className="text-sm font-semibold text-deep-600 mt-3 mb-1">{line.slice(3)}</h4>
                  }
                  if (line.startsWith('### ')) {
                    return <h5 key={i} className="text-xs font-semibold text-deep-600 mt-2 mb-1">{line.slice(4)}</h5>
                  }
                  if (line.startsWith('```')) return null
                  if (line.trim() === '') return <p key={i} className="mb-2" />
                  return <p key={i} className="mb-2 leading-relaxed">{line}</p>
                })}
              </div>

              <div className="mt-6 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
                <h4 className="text-xs font-semibold text-deep-600 mb-3 uppercase tracking-wider">Starter Code</h4>
                <pre className="bg-white p-3 rounded-md text-xs overflow-x-auto font-mono text-gray-600 border border-gray-100">{lab.starterCode}</pre>
              </div>
              <div className="mt-6 rounded-lg border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-deep-600">Squad</span>
                  <Badge variant="outline">Squad Alpha</Badge>
                </div>
                <div className="space-y-3">
                  {ledgerEntries.map((entry, i) => (
                    <div key={entry.transactionId} className="flex items-center gap-2">
                      <Input type="text" value={entry.transactionId} onChange={(e) => setLedgerEntries(labs.map((l, idx) => idx === i ? { ...l, transactionId: e.target.value } : l))} placeholder="Transaction ID" />
                      <Input type="text" value={entry.account} onChange={(e) => setLedgerEntries(labs.map((l, idx) => idx === i ? { ...l, account: e.target.value } : l))} placeholder="Account" />
                      <Input type="number" value={entry.debit} onChange={(e) => setLedgerEntries(labs.map((l, idx) => idx === i ? { ...l, debit: parseFloat(e.target.value || 0) } : l))} placeholder="Debit" />
                      <Input type="number" value={entry.credit} onChange={(e) => setLedgerEntries(labs.map((l, idx) => idx === i ? { ...l, credit: e.target.value } : l))} placeholder="Credit" />
                      <Button size="sm" variant="outline" onClick={() => setLedgerEntries(labs.filter((_, idx) => idx !== i))}>
                        <X size={14} className="text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <div className="mt-2 flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setLedgerEntries([...labs, { transactionId: '', account: '', debit: 0, credit: 0 }])}>
                      <Plus size={14} className="mr-1" />
                      Add entry
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Submission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-deep-600">Repository URL</label>
              <Input type="url" value={submissionUrl} onChange={(e) => setSubmissionUrl(e.target.value)} placeholder="https://github.com/username/lab-repo" placeholder="https://github.com/yourusername/lab-solution" />
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="outline" disabled={!submissionUrl || uploading} onClick={handleSubmit}>
                {submissionStatus === 'submitted' ? 'Submitted' : 'Submit Lab'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Lab Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-deep-600">Module</span>
              <span className="text-xs text-gray-600">{lab.module}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-deep-600">Domain</span>
              <Badge className={DOMAIN_COLORS[lab.domain]}>{lab.domain}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-deep-600">Week</span>
              <span className="text-xs text-gray-600">{lab.week}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-deep-600">Duration</span>
              <span className="text-xs text-gray-600">{lab.duration}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-deep-600">Due Date</span>
                <span className="text-xs text-gray-600">{lab.dueDate}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

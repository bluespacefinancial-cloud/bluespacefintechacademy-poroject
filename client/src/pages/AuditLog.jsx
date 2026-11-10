import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Download, RefreshCw, Search, Shield } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { api } from '../lib/backend'

const SEVERITY_VARIANTS = {
  INFO: 'secondary',
  WARNING: 'destructive',
  CRITICAL: 'destructive',
}

const ENTITY_LABELS = {
  users: 'Users',
  cohorts: 'Cohorts',
  enrolments: 'Enrolments',
  modules: 'Modules',
  lessons: 'Lessons',
  labs: 'Labs',
  assessments: 'Assessments',
  announcements: 'Announcements',
  partners: 'Partner agencies',
  partner_courses: 'Partner courses',
  partner_course_lessons: 'Partner course lessons',
  instructor_cohort_assignments: 'Instructor assignments',
  certifications: 'Certifications',
  placements: 'Placements',
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function actionLabel(action) {
  if (!action) return ''
  const [, verb] = action.split('.')
  if (!verb) return action
  return verb.charAt(0).toUpperCase() + verb.slice(1)
}

function toCsv(rows) {
  const headers = ['created_at', 'severity', 'action', 'entity_type', 'entity_id', 'description', 'user_name', 'user_role', 'changed']
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const lines = rows.map((row) => [
    row.created_at,
    row.severity,
    row.action,
    row.entity_type,
    row.entity_id,
    row.description,
    row.user_name,
    row.user_role,
    Array.isArray(row.metadata?.changed) ? row.metadata.changed.join('; ') : '',
  ].map(escape).join(','))
  return [headers.join(','), ...lines].join('\n')
}

export default function AuditLog() {
  const [entries, setEntries] = useState([])
  const [search, setSearch] = useState('')
  const [severity, setSeverity] = useState('all')
  const [entityType, setEntityType] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadEntries = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const { data, error: loadError } = await api
        .from('audit_logs')
        .select('id, user_id, user_name, user_role, action, entity_type, entity_id, description, metadata, severity, created_at')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(300)
      if (loadError) throw loadError
      setEntries(data || [])
    } catch (loadError) {
      setError(loadError.message || 'Unable to load the audit log')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Loading flag is set before the request resolves; this is a one-shot fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEntries()
  }, [loadEntries])

  const entityTypes = useMemo(
    () => [...new Set(entries.map((entry) => entry.entity_type).filter(Boolean))].sort(),
    [entries]
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return entries.filter((entry) => {
      if (severity !== 'all' && entry.severity !== severity) return false
      if (entityType !== 'all' && entry.entity_type !== entityType) return false
      if (!term) return true
      return [entry.description, entry.action, entry.user_name, entry.user_role, entry.entity_type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    })
  }, [entries, search, severity, entityType])

  const warningCount = entries.filter((entry) => entry.severity !== 'INFO').length

  const downloadCsv = () => {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            <Shield size={24} className="text-deep-600" />
            Audit Log
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            A read-only record of changes to curriculum, people and partner content.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadCsv} disabled={filtered.length === 0}>
            <Download size={14} className="mr-1.5" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={loadEntries} disabled={loading}>
            <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Loaded entries</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{entries.length}</p>
            <p className="mt-0.5 text-[11px] text-gray-500">Most recent 300 changes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Warnings</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-gray-900">
              {warningCount}
              {warningCount > 0 && <AlertTriangle size={18} className="text-amber-600" />}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-500">Deletes, role and status changes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Showing</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{filtered.length}</p>
            <p className="mt-0.5 text-[11px] text-gray-500">After the current filters</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-sm">Recent activity</CardTitle>
              <CardDescription>Entries cannot be edited or deleted from the application.</CardDescription>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:items-center">
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search description or actor"
                  className="pl-8 text-sm sm:w-56"
                  aria-label="Search audit entries"
                />
              </div>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="w-full text-sm sm:w-36" aria-label="Filter by severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All severities</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger className="w-full text-sm sm:w-48" aria-label="Filter by record type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All record types</SelectItem>
                  {entityTypes.map((entity) => (
                    <SelectItem key={entity} value={entity}>{ENTITY_LABELS[entity] || entity}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && <p role="alert" className="m-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {loading && <p className="px-4 py-12 text-center text-sm text-gray-500">Loading audit entries…</p>}
          {!loading && !error && filtered.length === 0 && (
            <div className="px-4 py-12 text-center text-gray-400">
              <Shield size={28} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No entries match these filters.</p>
            </div>
          )}

          <div className="divide-y divide-gray-100">
            {!loading && filtered.map((entry) => {
              const changed = Array.isArray(entry.metadata?.changed) ? entry.metadata.changed : []
              return (
                <div key={entry.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={SEVERITY_VARIANTS[entry.severity] || 'secondary'} className="text-[10px]">
                        {entry.severity || 'INFO'}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900">{entry.description}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {actionLabel(entry.action)}
                      {' · '}
                      {ENTITY_LABELS[entry.entity_type] || entry.entity_type || 'Record'}
                      {entry.entity_id !== null && entry.entity_id !== undefined && ` #${entry.entity_id}`}
                      {' · '}
                      {formatDate(entry.created_at)}
                    </p>
                    {changed.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {changed.map((field) => (
                          <span key={field} className="rounded border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-600">
                            {field}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-xs sm:text-right">
                    <p className="font-medium text-gray-900">{entry.user_name || 'System'}</p>
                    <p className="text-gray-500">{entry.user_role || 'service'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

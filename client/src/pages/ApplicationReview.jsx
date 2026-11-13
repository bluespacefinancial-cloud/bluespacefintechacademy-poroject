import { useEffect, useState, useMemo } from 'react'
import { Check, X, Search, RefreshCw, Clock, CheckCircle2, XCircle, GraduationCap, Briefcase, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../lib/backend'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { emailService } from '../lib/emailService'

export default function ApplicationReview() {
  const [applications, setApplications] = useState([])
  const [cohorts, setCohorts] = useState([])
  const [globalCohortId, setGlobalCohortId] = useState('')
  const [selectedCohorts, setSelectedCohorts] = useState({})
  const [statusFilter, setStatusFilter] = useState('pending')
  const [roleFilter, setRoleFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [submittingId, setSubmittingId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [{ data: applicationData, error: applicationError }, { data: cohortData, error: cohortError }] = await Promise.all([
        api.from('academy_applications').select('*').order('created_at', { ascending: false }),
        api.from('cohorts').select('id, name, status').in('status', ['planned', 'active']).order('start_date'),
      ])
      if (applicationError || cohortError) throw applicationError || cohortError
      setApplications(applicationData || [])
      setCohorts(cohortData || [])
      if (!globalCohortId && cohortData?.[0]) {
        setGlobalCohortId(String(cohortData[0].id))
      }
    } catch (error) {
      toast.error(error.message || 'Unable to load applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const counts = useMemo(() => {
    return {
      all: applications.length,
      pending: applications.filter((a) => a.status === 'pending').length,
      approved: applications.filter((a) => a.status === 'approved').length,
      rejected: applications.filter((a) => a.status === 'rejected').length,
    }
  }, [applications])

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter
      const matchesRole = roleFilter === 'All' || app.requested_role === roleFilter
      const query = searchQuery.trim().toLowerCase()
      const matchesQuery =
        !query ||
        app.name?.toLowerCase().includes(query) ||
        app.email?.toLowerCase().includes(query) ||
        app.track?.toLowerCase().includes(query) ||
        app.organisation?.toLowerCase().includes(query)
      return matchesStatus && matchesRole && matchesQuery
    })
  }, [applications, statusFilter, roleFilter, searchQuery])

  const handleCohortChange = (applicationId, cohortId) => {
    setSelectedCohorts((prev) => ({ ...prev, [applicationId]: cohortId }))
  }

  const review = async (application, decision) => {
    const targetCohortId = selectedCohorts[application.id] || globalCohortId
    if (decision === 'approved' && application.requested_role === 'Student' && !targetCohortId) {
      toast.error('Choose a cohort before approving a student')
      return
    }

    setSubmittingId(application.id)
    try {
      const reviewReason = decision === 'rejected' ? 'Application was not approved by the academy team.' : null
      const { error } = await api.rpc('review_academy_application', {
        p_application_id: application.id,
        p_decision: decision,
        p_cohort_id: decision === 'approved' && application.requested_role === 'Student' ? Number(targetCohortId) : null,
        p_track: decision === 'approved' && application.requested_role === 'Student' ? application.track : null,
        p_reason: reviewReason,
      })
      if (error) throw error

      // Send status update email with verified production HTTPS logo
      const notification = await emailService.sendApplicationStatusEmail(
        application.email,
        application.name,
        decision,
        reviewReason,
        application.requested_role,
      )

      if (notification.success) {
        toast.success(`Application ${decision}; notification email sent`)
      } else {
        toast.success(`Application ${decision}`)
        console.warn('Status email notice:', notification.error)
      }
      await load()
    } catch (err) {
      toast.error(err.message || `Failed to ${decision} application`)
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admissions & Applications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review candidate applications, assign fellowship cohorts, and approve admissions decisions.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="shrink-0 gap-2 border-border">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Queue
        </Button>
      </div>

      {/* Global Controls Card */}
      <Card className="border border-border bg-card shadow-sm">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  statusFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Clock size={13} />
                Pending ({counts.pending})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('approved')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  statusFilter === 'approved'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CheckCircle2 size={13} />
                Approved ({counts.approved})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('rejected')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  statusFilter === 'rejected'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <XCircle size={13} />
                Rejected ({counts.rejected})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-foreground text-background shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({counts.all})
              </button>
            </div>

            {/* Default Cohort Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="default-cohort" className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                Default cohort:
              </label>
              <select
                id="default-cohort"
                className="h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-600"
                value={globalCohortId}
                onChange={(e) => setGlobalCohortId(e.target.value)}
              >
                <option value="">Select a cohort</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search & Role Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-border">
            <div className="sm:col-span-2 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search candidates by name, email, track, or organisation…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-background border-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                aria-label="Filter by role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-600"
              >
                <option value="All">All Roles</option>
                <option value="Student">Students Only</option>
                <option value="Instructor">Instructors Only</option>
                <option value="Partner">Partners Only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <Card className="border border-border bg-card">
            <CardContent className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground mx-auto mb-3">
                <UserCheck size={20} />
              </div>
              <p className="text-base font-semibold text-foreground">No applications found</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery
                  ? 'No candidate matches your search terms. Try clearing the search filters.'
                  : `There are currently no applications marked as ${statusFilter}.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((app) => {
            const isPending = app.status === 'pending'
            const isApproved = app.status === 'approved'
            const isRejected = app.status === 'rejected'
            const activeCohortForApp = selectedCohorts[app.id] || globalCohortId

            return (
              <Card
                key={app.id}
                className={`border transition-colors ${
                  isPending ? 'border-amber-500/40 bg-card' : 'border-border bg-card/80'
                }`}
              >
                <CardHeader className="p-4 sm:p-5 pb-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base font-bold text-foreground">{app.name}</CardTitle>
                      {app.requested_role === 'Student' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-deep-600 text-white">
                          <GraduationCap size={12} /> Student
                        </span>
                      )}
                      {app.requested_role === 'Instructor' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-white dark:bg-slate-700">
                          <UserCheck size={12} /> Instructor
                        </span>
                      )}
                      {app.requested_role === 'Partner' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-700 text-white">
                          <Briefcase size={12} /> Partner
                        </span>
                      )}
                      {app.track && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold border border-border bg-muted text-foreground">
                          {app.track} Track
                        </span>
                      )}
                    </div>
                    <CardDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>{app.email}</span>
                      {app.phone && <span>&middot; {app.phone}</span>}
                      {app.organisation && <span>&middot; Org: {app.organisation}</span>}
                      {app.created_at && (
                        <span>
                          &middot; Applied {new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </CardDescription>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {isPending && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-600 text-white shadow-xs">
                        <Clock size={12} /> Pending Review
                      </span>
                    )}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-600 text-white shadow-xs">
                        <CheckCircle2 size={12} /> Approved
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-600 text-white shadow-xs">
                        <XCircle size={12} /> Rejected
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
                  {/* Detailed Candidate Submission Info */}
                  {app.requested_role === 'Student' && app.motivation && (
                    <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
                      <span className="font-bold text-foreground block mb-1">Learning Goals & Motivation:</span>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{app.motivation}</p>
                    </div>
                  )}

                  {app.requested_role === 'Instructor' && (
                    <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs space-y-2">
                      <div>
                        <span className="font-bold text-foreground">Teaching Domains: </span>
                        <span className="text-muted-foreground">
                          {(app.teaching_domains || []).join(', ') || 'Not specified'}
                        </span>
                      </div>
                      {app.teaching_experience && (
                        <div>
                          <span className="font-bold text-foreground block mb-0.5">Experience & Technical Background:</span>
                          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{app.teaching_experience}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {app.requested_role === 'Partner' && (
                    <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs space-y-2">
                      <div className="flex flex-wrap gap-4">
                        {app.organisation && (
                          <div>
                            <span className="font-bold text-foreground">Organisation: </span>
                            <span className="text-muted-foreground">{app.organisation}</span>
                          </div>
                        )}
                        {app.partnership_focus && (
                          <div>
                            <span className="font-bold text-foreground">Focus: </span>
                            <span className="text-muted-foreground">{app.partnership_focus}</span>
                          </div>
                        )}
                        {app.website && (
                          <div>
                            <span className="font-bold text-foreground">Website: </span>
                            <a
                              href={app.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-deep-600 hover:underline dark:text-bluespace-300"
                            >
                              {app.website}
                            </a>
                          </div>
                        )}
                      </div>
                      {app.partnership_details && (
                        <div>
                          <span className="font-bold text-foreground block mb-0.5">Partnership Contribution:</span>
                          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{app.partnership_details}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions for Pending Applications */}
                  {isPending && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border">
                      {app.requested_role === 'Student' ? (
                        <div className="flex items-center gap-2">
                          <label htmlFor={`cohort-select-${app.id}`} className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                            Enrol in cohort:
                          </label>
                          <select
                            id={`cohort-select-${app.id}`}
                            value={activeCohortForApp}
                            onChange={(e) => handleCohortChange(app.id, e.target.value)}
                            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-600"
                          >
                            <option value="">Select cohort...</option>
                            {cohorts.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          Approving will activate this {app.requested_role.toLowerCase()}&apos;s academy account.
                        </div>
                      )}

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button
                          size="sm"
                          disabled={submittingId === app.id}
                          onClick={() => review(app, 'approved')}
                          className="bg-deep-600 hover:bg-deep-700 text-white font-semibold text-xs h-8 px-3.5 shadow-sm"
                        >
                          <Check size={14} className="mr-1.5" />
                          {submittingId === app.id ? 'Processing…' : 'Approve Application'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={submittingId === app.id}
                          onClick={() => review(app, 'rejected')}
                          className="text-xs h-8 px-3 text-rose-600 border-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-900/50 dark:hover:bg-rose-950/30"
                        >
                          <X size={14} className="mr-1.5" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Decision summary for non-pending */}
                  {!isPending && (
                    <div className="text-[11px] text-muted-foreground pt-1 flex items-center justify-between">
                      <span>
                        Decision recorded on{' '}
                        {app.reviewed_at ? new Date(app.reviewed_at).toLocaleString() : 'recently'}
                      </span>
                      {app.review_reason && <span>Reason: {app.review_reason}</span>}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

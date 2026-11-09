/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Target,
  CheckCircle,
  ExternalLink,
  FileText,
  Calendar,
  AlertCircle,
  Briefcase,
  ShieldCheck,
  Send,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import { api } from '../lib/backend'
import { getCurrentProfile } from '../lib/profile'

export default function MySquad() {
  const [activeTab, setActiveTab] = useState('deliverables') // 'deliverables' | 'roster'
  const [squad, setSquad] = useState(null)
  const [cohort, setCohort] = useState('')
  const [members, setMembers] = useState([])
  const [sprints, setSprints] = useState([])
  const [selectedSprint, setSelectedSprint] = useState(null)
  const [deliverables, setDeliverables] = useState([])
  const [form, setForm] = useState({ title: '', description: '', evidence_url: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadData = async () => {
    try {
      setError('')
      const profile = await getCurrentProfile()
      const { data: enrolment, error: enrolmentError } = await api
        .from('enrolments')
        .select('squad_id, cohort_id')
        .eq('user_id', profile.id)
        .in('status', ['enrolled', 'active'])
        .maybeSingle()

      if (enrolmentError) throw enrolmentError
      if (!enrolment?.squad_id) {
        setSquad(null)
        setLoading(false)
        return
      }

      const [
        { data: squadRow, error: squadError },
        { data: roster, error: rosterError },
        { data: cohortRow, error: cohortError },
        { data: sprintRows, error: sprintError },
      ] = await Promise.all([
        api.from('squads').select('*').eq('id', enrolment.squad_id).single(),
        api
          .from('enrolments')
          .select('user_id, track, users!inner(id, name, email)')
          .eq('squad_id', enrolment.squad_id),
        api.from('cohorts').select('name').eq('id', enrolment.cohort_id).maybeSingle(),
        api
          .from('sprints')
          .select('*, use_cases(title, domain), sprint_deliverables(*)')
          .eq('squad_id', enrolment.squad_id)
          .order('sprint_number'),
      ])

      if (squadError) throw squadError
      if (rosterError) throw rosterError
      if (cohortError) throw cohortError
      if (sprintError) throw sprintError

      setSquad(squadRow)
      setMembers(roster || [])
      setCohort(cohortRow?.name || '')
      setSprints(sprintRows || [])

      if (sprintRows && sprintRows.length > 0) {
        const defaultSprint = sprintRows.find((s) => s.status === 'active') || sprintRows[0]
        setSelectedSprint(defaultSprint)
        setDeliverables(defaultSprint.sprint_deliverables || [])
      }
    } catch (loadError) {
      setError(loadError.message || 'Unable to load squad workspace')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSelectSprint = (sprint) => {
    setSelectedSprint(sprint)
    setDeliverables(sprint.sprint_deliverables || [])
    setError('')
    setMessage('')
  }

  const handleSubmitDeliverable = async (event) => {
    event.preventDefault()
    if (!selectedSprint) return
    setError('')
    setMessage('')
    setSubmitting(true)

    try {
      const profile = await getCurrentProfile()
      const payload = {
        sprint_id: selectedSprint.id,
        user_id: profile.id,
        title: form.title.trim(),
        description: form.description.trim(),
        evidence_url: form.evidence_url.trim() || null,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      }

      const { data, error: submitError } = await api
        .from('sprint_deliverables')
        .insert(payload)
        .select()
        .single()

      if (submitError) throw submitError

      setDeliverables((current) => [data, ...current])
      setForm({ title: '', description: '', evidence_url: '' })
      setMessage('Deliverable submitted successfully for mentor review.')
    } catch (submitErr) {
      setError(submitErr.message || 'Failed to submit deliverable')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <DashboardHeader
          title="Squad Workspace"
          subtitle="Collaborative live project delivery, team roster, and sprint evidence."
        />
        <div className="min-h-[300px] flex items-center justify-center bg-white border border-gray-200/90 rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Loading squad workspace...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!squad) {
    return (
      <div className="w-full space-y-6">
        <DashboardHeader
          title="Squad Workspace"
          subtitle="Collaborative live project delivery, team roster, and sprint evidence."
        />
        <Card className="border border-gray-200/90 shadow-sm bg-white">
          <CardContent className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-deep-50 border border-deep-100 flex items-center justify-center text-deep-600 mx-auto">
              <Users size={22} />
            </div>
            <h3 className="text-base font-bold text-gray-900">No Squad Assigned Yet</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Fellows are grouped into multi-disciplinary squads during Weeks 5-8 ahead of the live fintech use-case sprints. You will receive an alert once staff confirm your squad assignment.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Button asChild variant="outline" size="sm" className="border-gray-200 text-xs">
                <Link to="/dashboard">Back to Dashboard</Link>
              </Button>
              <Button asChild size="sm" className="bg-deep-600 text-white hover:bg-deep-700 text-xs">
                <Link to="/my-learning">Continue Learning</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeSprint = sprints.find((s) => s.status === 'active')
  const completedDeliverables = deliverables.filter((d) => d.score !== null)

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <DashboardHeader
        title="Squad Workspace"
        subtitle={`${squad.name} • ${cohort || 'Cohort'} • Team collaboration and sprint delivery`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-gray-200 font-medium">
              <Users size={12} className="mr-1 text-deep-600" />
              {members.length} Fellows
            </Badge>
            {activeSprint && (
              <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700 font-medium">
                Active Sprint {activeSprint.sprint_number}
              </Badge>
            )}
          </div>
        }
      />

      {/* Alerts */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-start gap-2">
          <CheckCircle size={15} className="shrink-0 mt-0.5 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center border-b border-gray-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('deliverables')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'deliverables'
              ? 'border-deep-600 text-deep-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Target size={16} />
          Sprint Deliverables & Evidence
          <span className="text-[11px] font-bold text-gray-600">
            {sprints.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'roster'
              ? 'border-deep-600 text-deep-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users size={16} />
          Team Roster & Roles
          <span className="text-[11px] font-bold text-gray-600">
            {members.length}
          </span>
        </button>
      </div>

      {/* TAB 1: SPRINT DELIVERABLES & EVIDENCE */}
      {activeTab === 'deliverables' && (
        <div className="space-y-6">
          {sprints.length === 0 ? (
            <Card className="border border-gray-200/90 bg-white shadow-sm">
              <CardContent className="py-12 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mx-auto">
                  <Target size={18} />
                </div>
                <p className="text-sm font-bold text-gray-900">No Sprints Published Yet</p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Live project use cases and sprint milestones will be released during the project phase.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sprint Selector Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Project Sprints
                  </h3>
                  <span className="text-[11px] text-gray-400">{sprints.length} Total</span>
                </div>

                <div className="space-y-2.5">
                  {sprints.map((sprint) => {
                    const isSelected = selectedSprint?.id === sprint.id
                    return (
                      <button
                        key={sprint.id}
                        type="button"
                        onClick={() => handleSelectSprint(sprint)}
                        className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                          isSelected
                            ? 'border-deep-600 bg-deep-50/40 shadow-sm'
                            : 'border-gray-200/90 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-bold ${isSelected ? 'text-deep-700' : 'text-gray-900'}`}>
                            Sprint {sprint.sprint_number}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] capitalize font-medium ${
                              sprint.status === 'active'
                                ? 'text-emerald-700 border-emerald-200'
                                : sprint.status === 'completed'
                                ? 'text-gray-600 border-gray-200'
                                : 'text-slate-600 border-slate-200'
                            }`}
                          >
                            {sprint.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                          {sprint.use_cases?.title || 'Live Fintech Architecture Sprint'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-gray-500">
                          <Calendar size={12} className="text-gray-400" />
                          <span>
                            {sprint.start_date} to {sprint.end_date}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Sprint Workspace & Evidence Submissions */}
              <div className="lg:col-span-2 space-y-6">
                {selectedSprint ? (
                  <>
                    {/* Submit Deliverable Form */}
                    <Card className="border border-gray-200/90 shadow-sm bg-white">
                      <CardHeader className="pb-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                              <Target size={15} className="text-deep-600" />
                              Submit Sprint {selectedSprint.sprint_number} Deliverable
                            </CardTitle>
                            <CardDescription className="text-xs text-gray-500 mt-0.5">
                              {selectedSprint.use_cases?.title
                                ? `${selectedSprint.use_cases.title} • Domain: ${selectedSprint.use_cases.domain || 'Fintech'}`
                                : 'Submit code repository, deployed endpoint, or architectural evidence'}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="text-[10px] uppercase font-semibold text-deep-700 border-deep-200">
                            Sprint {selectedSprint.sprint_number}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-5">
                        <form onSubmit={handleSubmitDeliverable} className="space-y-3.5">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Deliverable Title <span className="text-red-500">*</span>
                            </label>
                            <Input
                              placeholder="e.g. Ledger Schema Migration, Kafka Event Consumer, API Sandbox"
                              required
                              value={form.title}
                              onChange={(e) => setForm({ ...form, title: e.target.value })}
                              className="text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Deliverable Description & Technical Notes <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              rows={3}
                              placeholder="Describe what was built, key architectural decisions, test coverage, and any known limitations..."
                              required
                              value={form.description}
                              onChange={(e) => setForm({ ...form, description: e.target.value })}
                              className="w-full rounded-lg border border-gray-200 p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-deep-600 focus:border-deep-600"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Evidence URL (GitHub PR, Repository, Postman Collection, or Demo)
                            </label>
                            <Input
                              type="url"
                              placeholder="https://github.com/organization/repo or https://demo.bluespace.tech"
                              value={form.evidence_url}
                              onChange={(e) => setForm({ ...form, evidence_url: e.target.value })}
                              className="text-xs font-mono"
                            />
                          </div>

                          <div className="flex justify-end pt-1">
                            <Button
                              type="submit"
                              disabled={submitting}
                              size="sm"
                              className="bg-deep-600 text-white hover:bg-deep-700 text-xs font-semibold"
                            >
                              <Send size={13} className="mr-1.5" />
                              {submitting ? 'Submitting...' : 'Submit Deliverable'}
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>

                    {/* Submitted Deliverables List */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Sprint {selectedSprint.sprint_number} Deliverables ({deliverables.length})
                        </h4>
                        <span className="text-[11px] text-gray-400">
                          {completedDeliverables.length} graded
                        </span>
                      </div>

                      {deliverables.length === 0 ? (
                        <div className="rounded-xl border border-gray-200/90 bg-white p-8 text-center space-y-1.5">
                          <FileText size={18} className="text-gray-400 mx-auto mb-1" />
                          <p className="text-xs font-bold text-gray-800">No deliverables submitted yet for this sprint</p>
                          <p className="text-[11px] text-gray-500">
                            Use the form above to submit your pull request, architecture diagram, or demo link.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {deliverables.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h5 className="text-sm font-bold text-gray-900">{item.title}</h5>
                                  <p className="text-[11px] text-gray-400 mt-0.5">
                                    Submitted{' '}
                                    {item.submitted_at
                                      ? new Date(item.submitted_at).toLocaleDateString(undefined, {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                        })
                                      : 'Recently'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {item.score !== null ? (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                      <CheckCircle size={12} />
                                      {item.score}/100
                                    </span>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] capitalize text-amber-700 border-amber-200">
                                      {item.status || 'Under Review'}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                                {item.description}
                              </p>

                              {item.evidence_url && (
                                <div className="pt-1">
                                  <a
                                    href={item.evidence_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-deep-600 hover:text-deep-700 hover:underline"
                                  >
                                    <ExternalLink size={13} />
                                    <span>Open Live Evidence</span>
                                  </a>
                                </div>
                              )}

                              {item.feedback && (
                                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-xs space-y-1 mt-2">
                                  <p className="font-semibold text-gray-800 flex items-center gap-1">
                                    <ShieldCheck size={13} className="text-deep-600" />
                                    Faculty Reviewer Feedback:
                                  </p>
                                  <p className="text-gray-600 leading-relaxed">{item.feedback}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <Card className="border border-gray-200/90 bg-white">
                    <CardContent className="py-12 text-center text-xs text-gray-500">
                      Select a sprint from the left column to view its deliverables.
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TEAM ROSTER & ROLES */}
      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border border-gray-200/90 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-gray-900">{squad.name}</CardTitle>
                  <CardDescription className="text-xs text-gray-500 mt-0.5">
                    {cohort} • Multi-disciplinary fintech delivery unit
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-semibold text-gray-700">
                  {members.length} Members
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {members.map((member) => {
                const isLead = member.user_id === squad.squad_lead_id
                return (
                  <div
                    key={member.user_id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-gray-200/90 bg-white gap-3 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-deep-50 border border-deep-100 flex items-center justify-center text-xs font-bold text-deep-700 shrink-0">
                        {member.users?.name?.charAt(0)?.toUpperCase() || 'F'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900">
                            {member.users?.name || 'Fellow'}
                          </p>
                          {isLead && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded text-amber-800 border border-amber-200">
                              Squad Lead
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                          {member.users?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <Badge variant="outline" className="text-xs font-medium capitalize border-gray-200 text-gray-700">
                        {member.track || 'Fintech Core'}
                      </Badge>
                      <Button asChild variant="outline" size="sm" className="text-xs border-gray-200 h-8 px-2.5">
                        <a href={`mailto:${member.users?.email}`}>Contact</a>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Squad Status & Info */}
          <div className="space-y-4">
            <Card className="border border-gray-200/90 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Briefcase size={15} className="text-deep-600" />
                  Squad Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs text-gray-600">
                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <span className="text-gray-500">Cohort</span>
                  <span className="font-semibold text-gray-900">{cohort || 'Fintech Academy'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <span className="text-gray-500">Squad Unit</span>
                  <span className="font-semibold text-gray-900">{squad.name}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <span className="text-gray-500">Status</span>
                  <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-200">
                    {members.length > 0 ? 'Active' : 'Forming'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500">Sprints Assigned</span>
                  <span className="font-semibold text-gray-900">{sprints.length}</span>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-xl border border-gray-200/90 bg-gray-50/60 p-4 space-y-2 text-xs text-gray-600">
              <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                <Users size={14} className="text-deep-600" />
                Collaboration Norms
              </p>
              <p className="leading-relaxed">
                Squad leads coordinate sprint standups, PR reviews, and live demo rehearsal before mentor clinic checkpoints.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

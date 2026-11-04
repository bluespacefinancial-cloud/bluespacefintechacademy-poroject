import { BookOpen, Users, Clock, Target, GraduationCap, MapPin, FileText, ClipboardList } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { useAuth } from '../context/AuthContext'
import StudentDashboard from './StudentDashboard'
import PartnerCourses from './PartnerCourses'

export default function Dashboard() {
  const { user } = useAuth()

  const isStudent = user?.type === 'Student'
  const isInstructor = user?.type === 'Instructor'
  const isAdmin = user?.type === 'Administrator'
  const isPartner = user?.type === 'Partner'

  if (isStudent) {
    return <StudentDashboard user={user} />
    /* return (
      <div className="min-h-screen bg-gray-50">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-deep-600 mb-1">My Learning Dashboard</h1>
              <p className="text-sm text-gray-500">
                {user?.name} · {user?.track || ''} Track · Cohort 1 - December 2026
              </p>
            </div>
          </div>
        </div>

        {// Stat Cards - Student Metrics }
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-deep-600">65%</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Course Completion</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-brand-100 flex items-center justify-center">
                  <BookOpen size={16} className="text-brand-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-deep-600">94%</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Attendance</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Clock size={16} className="text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-deep-600">86%</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Current Grade</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Award size={16} className="text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-deep-600">4/6</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Labs Complete</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Activity size={16} className="text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {// Current Course }
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BookOpen size={14} className="mr-1.5" />
                  Current Module: FinCore Ledger Engineering
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-deep-600">Domain Immersion · FinCore</p>
                    <p className="text-[10px] text-gray-500">Weeks 5-6 · 5 lessons · 4 completed</p>
                  </div>
                  <Badge variant="secondary">In Progress</Badge>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: '80%' }} />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="flex-1">
                    Resume Learning
                  </Button>
                  <Button size="sm" className="flex-1">
                    View Labs
                  </Button>
                </div>
              </CardContent>
            </Card>

            {// Upcoming Deadlines }
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <AlertCircle size={14} className="mr-1.5" />
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-deep-600">FinCore Lab Submission</p>
                    <p className="text-[10px] text-gray-500">Double-entry ledger postings</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-deep-600">Jan 15, 2027</p>
                    <Badge variant="outline" className="text-[10px]">3 days left</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-deep-600">FaaS Lab Submission</p>
                    <p className="text-[10px] text-gray-500">Partner API onboarding flow</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-amber-600">Jan 22, 2027</p>
                    <Badge variant="outline" className="text-[10px]">10 days left</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {// Right Column - Squad + Progress }
          <div className="lg:col-span-1">
            {// My Squad }
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Users size={14} className="mr-1.5" />
                  My Squad: Squad Alpha
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded-lg border border-gray-100 bg-white">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-deep-100 flex items-center justify-center text-[10px] font-bold text-deep-600">
                      AO
                    </div>
                    <span className="text-xs text-gray-600">Ada Okonkwo (Lead)</span>
                  </div>
                  <Badge className="bg-brand-100 text-brand-700 text-[10px]">Squad Lead</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border border-gray-100 bg-white">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-600">
                      KA
                    </div>
                    <span className="text-xs text-gray-600">Kwame Asante</span>
                  </div>
                  <Badge className="bg-indigo-100 text-indigo-700 text-[10px]">Tech Specialist</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border border-gray-100 bg-white">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-600">
                      FD
                    </div>
                    <span className="text-xs text-gray-600">Fatima Diallo</span>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700 text-[10px]">UAT Lead</Badge>
                </div>
              </CardContent>
            </Card>

            {// Domain Progress }
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Domain Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {['FaaS', 'FinCore', 'FinOps', 'FinInfra'].map((domain, i) => (
                  <div key={domain} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={DOMAIN_COLORS[domain]}>{domain}</Badge>
                      </div>
                      <span className="text-xs font-medium text-deep-600 w-8 text-right">
                        {[85, 60, 75, 40][i]}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out-expo ${
                          i === 0 ? 'bg-brand-600' : i === 1 ? 'bg-emerald-500' : i === 2 ? 'bg-amber-500' : 'bg-slate-500'
                        }`}
                        style={{ width: `${[85, 60, 75, 40][i]}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  ) */
  }

  if (isPartner) {
    return <PartnerCourses />
  }

  // ==================== INSTRUCTOR DASHBOARD ====================
  if (isInstructor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-deep-600 mb-1">Teaching Dashboard</h1>
              <p className="text-sm text-gray-500">
                {user?.name} · {user?.type} · {user?.track || ''} Track Lead
              </p>
            </div>
          </div>
        </div>

        {/* Stat Cards - Instructor Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-deep-600">12</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Modules Published</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-brand-100 flex items-center justify-center">
                  <BookOpen size={16} className="text-brand-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-deep-600">4</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Labs to Review</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <FileText size={16} className="text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-deep-600">8</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Pending Grades</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <ClipboardList size={16} className="text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-deep-600">3</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Active Squads</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Users size={16} className="text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Modules */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BookOpen size={14} className="mr-1.5" />
                  My Modules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-deep-600">FinCore: Ledger Engineering</p>
                    <p className="text-[10px] text-gray-500">Domain Immersion · Weeks 5-6 · Published</p>
                  </div>
                  <Badge variant="secondary">Published</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-deep-600">FinOps: Reconciliation Pipeline</p>
                    <p className="text-[10px] text-gray-500">Domain Immersion · Week 7 · Draft</p>
                  </div>
                  <Badge variant="outline">Draft</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-deep-600">FaaS: Partner-Ready APIs</p>
                    <p className="text-[10px] text-gray-500">Domain Immersion · Week 4 · Published</p>
                  </div>
                  <Badge variant="secondary">Published</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Labs Pending Review */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileText size={14} className="mr-1.5" />
                  Labs Pending Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-deep-600">Lab: Double-Entry Ledger</p>
                    <p className="text-[10px] text-gray-500">Ada Okonkwo · Squad Alpha · Submitted 2 days ago</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-[10px]">
                    Review
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-deep-600">Lab: API Onboarding Flow</p>
                    <p className="text-[10px] text-gray-500">Kwame Asante · Squad Beta · Submitted 1 day ago</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-[10px]">
                    Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full flex items-center justify-between py-3 text-left text-sm">
                  <span>Review Labs</span>
                  <FileText size={14} className="ml-2" />
                </Button>
                <Button variant="outline" className="w-full flex items-center justify-between py-3 text-left text-sm">
                  <span>Grade Submissions</span>
                  <ClipboardList size={14} className="ml-2" />
                </Button>
                <Button variant="outline" className="w-full flex items-center justify-between py-3 text-left text-sm">
                  <span>Schedule Clinic</span>
                  <Clock size={14} className="ml-2" />
                </Button>
                <Button variant="outline" className="w-full flex items-center justify-between py-3 text-left text-sm">
                  <span>Post Announcement</span>
                  <MapPin size={14} className="ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Clinics */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Upcoming Clinics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-deep-600">FinCore Domain Clinic</p>
                    <p className="text-[10px] text-gray-500">Today, 2:00 PM WAT</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">Today</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-deep-600">FaaS API Design Clinic</p>
                    <p className="text-[10px] text-gray-500">Tomorrow, 10:00 AM WAT</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">Tomorrow</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  )
  }

  // ==================== ADMINISTRATOR DASHBOARD ====================
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-deep-600 mb-1">Academy Dashboard</h1>
              <p className="text-sm text-gray-500">
                {user?.name} · {user?.type} · Academy Operations
              </p>
            </div>
          </div>
        </div>

        {/* Stat Cards - Admin Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-deep-600">2</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Active Cohorts</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-brand-100 flex items-center justify-center">
                  <GraduationCap size={16} className="text-brand-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-deep-600">37</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Total Fellows</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Users size={16} className="text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-deep-600">4</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Use Cases</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Target size={16} className="text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-deep-600">76%</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Placement Rate</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <MapPin size={16} className="text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cohort Overview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <GraduationCap size={14} className="mr-1.5" />
                  Cohort Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-deep-600">Cohort 1 - December 2026</p>
                    <p className="text-[10px] text-gray-500">37 Fellows · 22 Finsoft + 15 Finops</p>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-deep-600">Cohort 2 - March 2027</p>
                    <p className="text-[10px] text-gray-500">Planned intake · 40 capacity</p>
                  </div>
                  <Badge variant="outline">Planned</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-deep-600">Cohort 3 - June 2027</p>
                    <p className="text-[10px] text-gray-500">Scheduled · 40 capacity</p>
                  </div>
                  <Badge variant="outline">Scheduled</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Use Case Pipeline */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Target size={14} className="mr-1.5" />
                  Live Use Case Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-deep-600">FinCore Ledger Integration</p>
                    <p className="text-[10px] text-gray-500">Cohort 1 · Qualified · Sandbox: Enabled</p>
                  </div>
                  <Badge className="bg-brand-50 text-brand-700 border-brand-100 text-[10px]">Qualified</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-deep-600">FaaS Partner API Onboarding</p>
                    <p className="text-[10px] text-gray-500">Cohort 1 · Assigned to Squad Beta</p>
                  </div>
                  <Badge className="bg-amber-50 text-amber-700 border-amber-100 text-[10px]">Assigned</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-deep-600">FinOps Automated Reconciliation</p>
                    <p className="text-[10px] text-gray-500">Cohort 2 · Proposed · Pending review</p>
                  </div>
                  <Badge className="bg-gray-50 text-gray-600 border-gray-100 text-[10px]">Proposed</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Enrolment + Placement */}
          <div className="lg:col-span-1">
            {/* Enrolment by Track */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold">Enrolment by Track</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">Finsoft</Badge>
                    <span className="text-xs font-medium text-deep-600 w-8 text-right">22</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-brand-600" style={{ width: '55%' }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Finops</Badge>
                    <span className="text-xs font-medium text-deep-600 w-8 text-right">15</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: '45%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Placement Status */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Placement Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-deep-600">Placed</span>
                  <span className="text-xs font-bold text-emerald-600">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-deep-600">Matched</span>
                  <span className="text-xs font-bold text-brand-600">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-deep-600">Pending</span>
                  <span className="text-xs font-bold text-gray-600">1</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-3">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: '76%' }} />
                </div>
                <p className="text-[10px] text-gray-500 text-center">76% placement rate</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  )

}
}

import { Users, Clock, Target, Activity } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'

const ROLE_COLORS = {
  'Squad Lead': 'bg-brand-100 text-brand-700',
  'UAT Lead': 'bg-emerald-100 text-emerald-700',
  'Technical Specialist': 'bg-indigo-100 text-indigo-700',
  'Operations Lead': 'bg-amber-100 text-amber-700',
}

const SQUAD_MEMBERS = [
  { id: 1, name: 'Ada Okonkwo', role: 'Squad Lead', track: 'Finsoft', avatar: 'AO', status: 'active' },
  { id: 2, name: 'Kwame Asante', role: 'Technical Specialist', track: 'Finsoft', avatar: 'KA', status: 'active' },
  { id: 3, name: 'Zainab Yusuf', role: 'Technical Specialist', track: 'Finsoft', avatar: 'ZY', status: 'active' },
  { id: 4, name: 'Emeka Ndiaye', role: 'Operations Lead', track: 'Finops', avatar: 'EN', status: 'active' },
  { id: 5, name: 'Fatima Diallo', role: 'UAT Lead', track: 'Finops', avatar: 'FD', status: 'active' },
]

export default function MySquad() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-deep-600 mb-2">My Squad</h1>
        <p className="text-sm text-gray-500">
          Squad Alpha - Mixed Finsoft & Finops Fellows
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Squad Roster */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={14} className="mr-1.5" />
                <CardTitle className="text-sm font-bold">Squad Roster</CardTitle>
              </div>
              <Badge variant="secondary">5 Members</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {SQUAD_MEMBERS.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-deep-100 flex items-center justify-center text-xs font-bold text-deep-600 shrink-0">
                      {member.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-deep-600 truncate">{member.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{member.track} Fellow</p>
                    </div>
                    <Badge className={ROLE_COLORS[member.role]}>
                      {member.role}
                    </Badge>
                  </div>
                  <span className={`text-[10px] font-medium ${member.status === 'active' ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {member.status}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Squad Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity size={14} className="mr-1.5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-white">
                <div className="h-6 w-6 rounded-full bg-brand-100 flex items-center justify-center">
                  <Target size={12} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-deep-600">Sprint 1 Review Completed</p>
                  <p className="text-[10px] text-gray-500">Live use case: FinCore Ledger Integration</p>
                </div>
                <span className="text-[10px] text-gray-400">2 days ago</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-white">
                <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Clock size={12} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-deep-600">Squad Stand-up</p>
                  <p className="text-[10px] text-gray-500">Tue & Thu, 10:00 AM WAT</p>
                </div>
                <span className="text-[10px] text-gray-400">Today</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-white">
                <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center">
                  <Users size={12} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-deep-600">Mentor Clinic Scheduled</p>
                  <p className="text-[10px] text-gray-500">FinCore Domain Lead</p>
                </div>
                <span className="text-[10px] text-gray-400">Tomorrow</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Squad Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Squad Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-medium text-deep-600">Squad Name</span>
                <p className="text-xs text-gray-600">Squad Alpha</p>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-medium text-deep-600">Cohort</span>
                <p className="text-xs text-gray-600">Cohort 1 - December 2026</p>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-medium text-deep-600">Track Mix</span>
                <div className="flex gap-2">
                  <Badge className="bg-indigo-100 text-indigo-700">3 Finsoft</Badge>
                  <Badge className="bg-emerald-100 text-emerald-700">2 Finops</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-medium text-deep-600">Current Sprint</span>
                <p className="text-xs text-gray-600">Sprint 1 of 3</p>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-medium text-deep-600">Live Use Case</span>
                <p className="text-xs text-gray-600">FinCore: Ledger Integration</p>
              </div>
            </CardContent>
            <CardFooter className="pt-4">
              <Button variant="outline" className="w-full">
                View Squad Details
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

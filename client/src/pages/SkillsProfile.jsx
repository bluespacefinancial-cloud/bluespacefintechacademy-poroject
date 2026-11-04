import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, CheckCircle, Award } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'

const ROLE_OPTIONS = [
  { value: 'Project Manager', label: 'Project Manager' },
  { value: 'Field Lead', label: 'Field Lead' },
  { value: 'UAT', label: 'UAT' },
  { value: 'Technical Specialist', label: 'Technical Specialist' },
  { value: 'not_sure', label: 'Not Sure Yet' },
]

const DOMAIN_OPTIONS = [
  { value: 'FaaS', label: 'FaaS' },
  { value: 'FinCore', label: 'FinCore' },
  { value: 'FinOps', label: 'FinOps' },
  { value: 'FinInfra', label: 'FinInfra' },
]

const SKILL_CATEGORIES = [
  { name: 'Technical Skills', skills: ['API Design', 'Ledger Engineering', 'CI/CD', 'Reconciliation', 'Reporting', 'Cloud Platforms'] },
  { name: 'Domain Knowledge', skills: ['FaaS', 'FinCore', 'FinOps', 'FinInfra'] },
  { name: 'Soft Skills', skills: ['Project Management', 'Stakeholder Communication', 'UAT', 'Team Leadership'] },
]

export default function SkillsProfile() {
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedDomains, setSelectedDomains] = useState([])
  const [profileCompleted, setProfileCompleted] = useState(false)
  const navigate = useNavigate()

  const handleSave = () => {
    setProfileCompleted(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-deep-600 mb-1">Skills Profile</h1>
        <p className="text-sm text-gray-500">
          Complete your profile for project placement matching
        </p>
      </div>

      {profileCompleted ? (
        <div className="text-center py-20">
          <Award size={48} className="mx-auto mb-4 text-emerald-500" />
          <h2 className="text-xl font-bold text-deep-600 mb-2">Profile Saved</h2>
          <p className="text-gray-500 mb-6">Your skills profile has been saved and will be used for placement matching.</p>
          <Button onClick={() => navigate('/placement')}>
            View Placement Opportunities
          </Button>
        </div>
      ) : (
        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Role Preference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ROLE_OPTIONS.map((role) => (
                  <Button
                    key={role.value}
                    variant={selectedRole === role.value ? 'default' : 'outline'}
                    className="w-full justify-start text-sm"
                    onClick={() => setSelectedRole(role.value)}
                  >
                    {selectedRole === role.value && <CheckCircle size={14} className="mr-2" />}
                    {role.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Domain Interests (select up to two)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DOMAIN_OPTIONS.map((domain) => (
                  <Button
                    key={domain.value}
                    variant={selectedDomains.includes(domain.value) ? 'default' : 'outline'}
                    className="w-full justify-start text-sm"
                    onClick={() => {
                      if (selectedDomains.includes(domain.value)) {
                        setSelectedDomains(selectedDomains.filter(d => d !== domain.value))
                      } else if (selectedDomains.length < 2) {
                        setSelectedDomains([...selectedDomains, domain.value])
                      }
                    }}
                  >
                    {selectedDomains.includes(domain.value) && <CheckCircle size={14} className="mr-2" />}
                    {domain.label}
                  </Button>
                ))}
              </div>
              {selectedDomains.length === 2 && (
                <p className="text-[10px] text-emerald-600 font-medium">Maximum two domains selected</p>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users size={14} className="mr-1.5" />
                Skill Self-Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {SKILL_CATEGORIES.map((category) => (
                <div key={category.name} className="space-y-2">
                  <p className="text-xs font-semibold text-deep-600 uppercase tracking-wider">{category.name}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {category.skills.map((skill) => (
                      <Button
                        key={skill}
                        variant="outline"
                        className="w-full justify-start text-xs p-2"
                        onClick={() => {}}
                      >
                        {skill}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSave}
              className="w-full"
              disabled={!selectedRole || selectedDomains.length === 0}
            >
              Save Profile
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

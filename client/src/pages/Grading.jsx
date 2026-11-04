import { useState } from 'react'
import { BarChart3 } from 'lucide.react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { supabase } from '../lib/supabase'

const ASSESSMENT_COMPONENTS = [
  { key: 'attendance', label: 'Attendance & Participation', weight: '10%' },
  { key: 'labs', label: 'Domain Labs & Assessments', weight: '25%' },
  { key: 'project', label: 'Live Project Contribution', weight: '40%' },
  { key: 'capstone', label: 'Capstone & Panel Review', weight: '25%' },
]

const MOCK_STUDENTS = [
  { id: 1, name: 'Ada Okonkwo', track: 'Finsoft', squad: 'Squad Alpha', attendance: 95, labs: 82, project: 88, capstone: null, status: 'in_progress' },
  { id: 2, name: 'Kwame Asante', track: 'Finsoft', squad: 'Squad Alpha', attendance: 92, labs: 87, project: 91, capstone: null, status: 'in_progress' },
  { id: 3, name: 'Zainab Yusuf', track: 'Finsoft', squad: 'Squad Alpha', attendance: 88, labs: 76, project: 79, capstone: null, status: 'at_risk' },
  { id: 4, name: 'Emeka Ndiaye', track: 'Finops', squad: 'Squad Alpha', attendance: 96, labs: 90, project: 85, capstone: null, status: 'in_progress' },
  { id: 5, name: 'Fatima Diallo', track: 'Finops', squad: 'Squad Alpha', attendance: 90, labs: 84, project: 82, capstone: null, status: 'in_progress' },
]

export default function Grading() {
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [grades, setGrades] = useState({})

  const student = selectedStudent ? MOCK_STUDENTS.find((s) => s.id === selectedStudent) : null
  const finalGrade = student && grades.attendance && grades.labs && grades.project && grades.capstone
    ? (
        (parseFloat(grades.attendance) * 0.1 +
          parseFloat(grades.labs) * 0.25 +
          parseFloat(grades.project) * 0.4 +
          parseFloat(grades.capstone) * 0.25
        ).toFixed(1)
      )
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-deep-600 mb-1">Grading Console</h1>
        <p className="text-sm text-gray-500">
          Record assessment scores and calculate final grades
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Students</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
              {MOCK_STUDENTS.map((s) => {
                const isSelected = selectedStudent === s.id
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStudent(s.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                      isSelected ? 'bg-brand-50 border-brand-200' : 'bg-white border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-deep-600 truncate">{s.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{s.track} · {s.squad}</p>
                    </div>
                    <Badge variant={s.status === 'at_risk' ? 'outline' : 'secondary'} className="text-[10px]">
                      {s.status === 'at_risk' ? 'At Risk' : 'Active'}
                    </Badge>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {selectedStudent && student && (
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold">Grade: {student.name}</CardTitle>
                <Badge variant="secondary">{student.track} · {student.squad}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ASSESSMENT_COMPONENTS.map((component) => (
                    <div key={component.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white">
                      <div>
                        <p className="text-xs font-medium text-deep-600">{component.label}</p>
                        <p className="text-[10px] text-gray-500">Weight: {component.weight}</p>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={grades[component.key] || ''}
                        onChange={(e) => setGrades({ ...grades, [component.key]: e.target.value })}
                        placeholder="0-100"
                        className="w-[80px]"
                      />
                    </div>
                  ))}
                </div>
                {finalGrade !== null && (
                  <div className="mt-4 p-3 rounded-lg border border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-deep-600">Final Grade</span>
                      <span className="text-sm font-bold text-brand-600">{finalGrade}</span>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setGrades({})}>
                  Reset
                </Button>
                <Button onClick={() => alert('Grades saved!')}>
                  Save Grades
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 size={14} className="mr-1.5" />
              Assessment Weights (per Academy Framework)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ASSESSMENT_COMPONENTS.map((component) => (
              <div key={component.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-brand-100 flex items-center justify-center">
                    <BarChart3 size={12} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-deep-600">{component.label}</p>
                    <p className="text-[10px] text-gray-500">Component of final grade</p>
                  </div>
                </div>
                <Badge className="bg-brand-50 text-brand-700 border-brand-100">{component.weight}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

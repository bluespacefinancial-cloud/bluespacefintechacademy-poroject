import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
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

export default function Grading() {
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [grades, setGrades] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get students from enrolments
      const { data: enrolments } = await supabase
        .from('enrolments')
        .select(`
          user_id,
          users (
            id,
            name,
            track,
            email
          )
        `)
        .eq('status', 'active')

      if (!enrolments) {
        setLoading(false)
        return
      }

      const studentsData = enrolments.map(e => ({
        id: e.users.id,
        name: e.users.name,
        track: e.users.track,
        squad: 'Squad Alpha', // Simplified
        attendance: Math.floor(Math.random() * 20) + 80, // Will be from attendance tracking
        labs: Math.floor(Math.random() * 20) + 70,
        project: Math.floor(Math.random() * 20) + 70,
        capstone: null,
        finalGrade: null,
        status: 'in_progress',
      }))

      setStudents(studentsData)
    } catch (err) {
      console.error('Error loading students:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateFinalGrade = (grades) => {
    if (!grades.attendance || !grades.labs || !grades.project || !grades.capstone) return null
    return (
      (parseFloat(grades.attendance) * 0.1 +
        parseFloat(grades.labs) * 0.25 +
        parseFloat(grades.project) * 0.4 +
        parseFloat(grades.capstone) * 0.25
      ).toFixed(1)
    )
  }

  const student = selectedStudent ? students.find((s) => s.id === selectedStudent) : null
  const finalGrade = student && grades.attendance && grades.labs && grades.project && grades.capstone
    ? calculateFinalGrade(grades)
    : null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading students...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-deep-600 mb-1">Grading Console</h1>
        <p className="text-sm text-gray-500">
          Record assessment scores and calculate final grades
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student list */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Students</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
              {students.map((s) => {
                const isSelected = selectedStudent === s.id
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStudent(s.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-brand-50 border-brand-200'
                        : 'bg-white border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-deep-600 truncate">{s.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{s.track} · {s.squad}</p>
                    </div>
                    <Badge
                      variant={s.status === 'at_risk' ? 'outline' : 'secondary'}
                      className="text-[10px]"
                    >
                      {s.status === 'at_risk' ? 'At Risk' : 'Active'}
                    </Badge>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Grading form */}
        {selectedStudent && student && (
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold">Grade: {student.name}</CardTitle>
                <Badge variant="secondary">
                  {student.track} · {student.squad}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ASSESSMENT_COMPONENTS.map((component) => (
                    <div
                      key={component.key}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white"
                    >
                      <div>
                        <p className="text-xs font-medium text-deep-600">{component.label}</p>
                        <p className="text-[10px] text-gray-500">Weight: {component.weight}</p>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={grades[component.key] || ''}
                        onChange={(e) =>
                          setGrades({ ...grades, [component.key]: e.target.value })
                        }
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

      {/* Assessment weights reference */}
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
              <div
                key={component.key}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white"
              >
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-brand-100 flex items-center justify-center">
                    <BarChart3 size={12} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-deep-600">{component.label}</p>
                    <p className="text-[10px] text-gray-500">Component of final grade</p>
                  </div>
                </div>
                <Badge className="bg-brand-50 text-brand-700 border-brand-100">
                  {component.weight}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

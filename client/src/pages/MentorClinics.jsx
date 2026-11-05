import { useState, useEffect } from 'react'
import { Calendar, Clock, Users, AlertCircle } from 'lucide.react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '../components/ui/select'
import { supabase } from '../lib/supabase'

const emptyForm = { title: '', cohort_id: '', starts_at: '', ends_at: '', meet_url: '', capacity: 15 }

export default function MentorClinics() {
  const [clinics, setClinics] = useState([])
  const [cohorts, setCohorts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadClinics = async () => {
    try {
      const { data } = await supabase.from('clinics').select('*').order('starts_at', { ascending: true })
      setClinics(data || [])
    } catch {
      // ignore error
    } finally {
      setLoading(false)
    }
  }

  const loadCohorts = async () => {
    try {
      const { data } = await supabase.from('cohorts').select('id, name').order('start_date', { ascending: true })
      setCohorts(data || [])
    } catch (err) {
      console.error('Error loading cohorts:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('clinics').insert({
        title: form.title,
        cohort_id: form.cohort_id,
        mentor_id: user.id,
        starts_at: form.starts_at,
        ends_at: form.ends_at,
        meet_url: form.meet_url,
        capacity: parseInt(form.capacity, 10),
      })
      if (error) throw error
      setForm(emptyForm)
      setShowForm(false)
      await loadClinics()
    } catch (err) {
      setError(err.message || 'Unable to schedule clinic')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-deep-600 mb-1">Mentor Clinics</h1>
            <p className="text-sm text-gray-500">Schedule and attend mentor office hours for Fellows</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus size={16} className="mr-2" />
            Schedule clinic
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between py-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calendar size={14} className="mr-1.5" />
                Upcoming Clinics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {clinics.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No upcoming clinics</p>
                </div>
              ) : (
                clinics.map((clinic) => (
                  <Card key={clinic.id} className="p-3 border border-gray-100 bg-white hover:bg-gray-50 transition-colors duration-150">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-deep-600">{clinic.title}</p>
                        <p className="text-[10px] text-gray-500">{clinic.cohort?.name || ''} · {clinic.mentor_name || 'Mentor'}</p>
                      </div>
                      <Badge variant="default">{clinic.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="mr-0.5" />
                        <span>{new Date(clinic.starts_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="mr-0.5" />
                        <span>{new Date(clinic.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={12} className="mr-0.5" />
                        <span>{clinic.attendee_count || 0}/{clinic.capacity}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Clock size={14} className="mr-1.5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full">
                  <Calendar size={14} className="mr-2" />
                  Schedule Clinic
                </Button>
                <Button variant="outline" className="w-full">
                  <Users size={14} className="mr-2" />
                  View All Mentors
                </Button>
                <Button variant="outline" className="w-full">
                  <AlertCircle size={14} className="mr-2" />
                  Clinic Requests
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

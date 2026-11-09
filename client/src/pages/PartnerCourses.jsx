/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { Plus, Send, BookOpen } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { api } from '../lib/backend'

export default function PartnerCourses() {
  const [partner, setPartner] = useState(null)
  const [courses, setCourses] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', thumbnail_url: '', certificate_title: 'Partner Course Certificate', partner_logo_url: '' })
  const [lesson, setLesson] = useState({ title: '', description: '', video_url: '', content_url: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const { data: partnerId, error: partnerIdError } = await api.rpc('current_partner_id')
    if (partnerIdError) throw partnerIdError
    if (!partnerId) {
      setPartner(null)
      setCourses([])
      return
    }
    const [{ data: partnerRow, error: partnerError }, { data: courseRows, error: courseError }] = await Promise.all([
      api.from('partners').select('*').eq('id', partnerId).single(),
      api.from('partner_courses').select('*').eq('partner_id', partnerId).order('created_at', { ascending: false }),
    ])
    if (partnerError || courseError) throw partnerError || courseError
    setPartner(partnerRow); setCourses(courseRows || [])
  }
  useEffect(() => { load().catch((loadError) => setError(loadError.message || 'Unable to load partner courses')).finally(() => setLoading(false)) }, [])

  const createCourse = async (event) => {
    event.preventDefault(); setError(''); setMessage('')
    const { data: created, error: createError } = await api.from('partner_courses').insert({ ...form, partner_id: partner.id, created_by: null, status: 'draft' }).select().single()
    if (createError) { setError(createError.message); return }
    setCourses((current) => [created, ...current]); setSelected(created); setForm({ title: '', description: '', thumbnail_url: '', certificate_title: 'Partner Course Certificate', partner_logo_url: '' }); setMessage('Course draft created')
  }
  const addLesson = async (event) => {
    event.preventDefault(); if (!selected) return
    const { data: created, error: lessonError } = await api.from('partner_course_lessons').insert({ ...lesson, course_id: selected.id, is_published: true, order_index: 0 }).select().single()
    if (lessonError) { setError(lessonError.message); return }
    setSelected({ ...selected, lessons: [...(selected.lessons || []), created] }); setLesson({ title: '', description: '', video_url: '', content_url: '' })
  }
  const submit = async () => {
    if (!selected) return
    const { error: submitError } = await api.from('partner_courses').update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', selected.id)
    if (submitError) { setError(submitError.message); return }
    setCourses((current) => current.map((course) => course.id === selected.id ? { ...course, status: 'submitted' } : course)); setSelected({ ...selected, status: 'submitted' }); setMessage('Course submitted for academy review')
  }
  if (loading) return <p className="py-12 text-center text-sm text-gray-500">Loading partner course studio...</p>
  if (!partner) return <div className="space-y-4"><div><h1 className="text-2xl font-bold text-deep-600">Partner Course Studio</h1><p className="text-sm text-gray-500">Create and manage courses for academy students.</p></div>{error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}<Card><CardHeader><CardTitle className="text-base">Agency link needed</CardTitle></CardHeader><CardContent className="text-sm text-gray-600">An academy administrator must connect your partner account to an agency before you can create courses.</CardContent></Card></div>
  return <div className="min-h-screen bg-gray-50"><div className="mb-6"><h1 className="text-2xl font-bold text-deep-600">Partner Course Studio</h1><p className="text-sm text-gray-500">{partner?.name || 'Partner'} can prepare courses for academy approval.</p></div>{error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}<div className="grid gap-6 lg:grid-cols-3"><Card><CardHeader><CardTitle className="text-sm">New course draft</CardTitle></CardHeader><CardContent><form onSubmit={createCourse} className="space-y-3"><Input placeholder="Course title" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /><textarea className="w-full rounded border p-2 text-sm" placeholder="Course description" required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /><Input placeholder="Partner logo URL" value={form.partner_logo_url} onChange={(event) => setForm({ ...form, partner_logo_url: event.target.value })} /><Input placeholder="Certificate title" value={form.certificate_title} onChange={(event) => setForm({ ...form, certificate_title: event.target.value })} /><Button type="submit"><Plus size={14} className="mr-2" />Create draft</Button></form></CardContent></Card><Card><CardHeader><CardTitle className="text-sm">Your courses</CardTitle></CardHeader><CardContent className="space-y-2">{courses.map((course) => <button type="button" key={course.id} onClick={() => setSelected(course)} className={`w-full rounded border p-3 text-left ${selected?.id === course.id ? 'border-brand-300 bg-brand-50' : ''}`}><p className="text-sm font-medium">{course.title}</p><Badge variant="outline">{course.status}</Badge></button>)}{courses.length === 0 && <p className="text-sm text-gray-500">No course drafts yet.</p>}</CardContent></Card><Card><CardHeader><CardTitle className="text-sm">{selected?.title || 'Select a course'}</CardTitle></CardHeader><CardContent>{selected ? <div className="space-y-4"><p className="text-xs text-gray-500">{selected.description}</p><form onSubmit={addLesson} className="space-y-2"><Input placeholder="Lesson title" required value={lesson.title} onChange={(event) => setLesson({ ...lesson, title: event.target.value })} /><Input placeholder="Video URL" value={lesson.video_url} onChange={(event) => setLesson({ ...lesson, video_url: event.target.value })} /><Input placeholder="Reading or resource URL" value={lesson.content_url} onChange={(event) => setLesson({ ...lesson, content_url: event.target.value })} /><Button type="submit" variant="outline"><Plus size={14} className="mr-2" />Add lesson</Button></form><Button onClick={submit} disabled={!['draft', 'changes_requested'].includes(selected.status)}><Send size={14} className="mr-2" />Submit for review</Button></div> : <div className="py-12 text-center text-sm text-gray-500"><BookOpen className="mx-auto mb-2" size={24} />Choose a course to add lessons.</div>}</CardContent></Card></div></div>
}

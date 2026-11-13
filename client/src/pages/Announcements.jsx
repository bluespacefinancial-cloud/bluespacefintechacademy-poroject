import { useCallback, useEffect, useState } from 'react'
import { Bell, CheckCircle, Pin, PinOff, Plus, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { api } from '../lib/backend'
import { useAuth } from '../context/AuthContext'
import { Breadcrumb } from '../components/ui/breadcrumb'

const TYPE_LABELS = {
  announcement: 'Announcement',
  reminder: 'Reminder',
  update: 'Update',
}

const AUDIENCE_LABELS = {
  all: 'Everyone',
  finsoft: 'Finsoft track',
  finops: 'Finops track',
}

const emptyForm = {
  title: '',
  content: '',
  type: 'announcement',
  audience: 'all',
  pinned: false,
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

export default function Announcements() {
  const { user } = useAuth()
  const role = user?.type
  const isStaff = role === 'Instructor' || role === 'Administrator'

  const [announcements, setAnnouncements] = useState([])
  const [readIds, setReadIds] = useState(new Set())
  const [form, setForm] = useState(emptyForm)
  const [composerOpen, setComposerOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadAnnouncements = useCallback(async () => {
    const { data, error: loadError } = await api
      .from('announcements')
      .select('*, users!announcements_author_id_fkey(name)')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (loadError) throw loadError
    setAnnouncements(data || [])
  }, [])

  const loadReadState = useCallback(async () => {
    if (!user?.id || isStaff) return
    const { data, error: readError } = await api
      .from('announcement_reads')
      .select('announcement_id')
      .eq('user_id', user.id)
    if (readError) return
    setReadIds(new Set((data || []).map((row) => row.announcement_id)))
  }, [user, isStaff])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        await Promise.all([loadAnnouncements(), loadReadState()])
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Unable to load announcements')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [loadAnnouncements, loadReadState])

  const canManage = (announcement) => role === 'Administrator' || announcement.author_id === user?.id

  const createAnnouncement = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!form.title.trim() || !form.content.trim()) {
      setError('A title and a message are both required.')
      return
    }
    setSaving(true)
    try {
      const { data, error: createError } = await api
        .from('announcements')
        .insert({
          title: form.title.trim(),
          content: form.content.trim(),
          type: form.type,
          audience: form.audience,
          pinned: Boolean(form.pinned),
          author_id: user.id,
        })
        .select('*, users!announcements_author_id_fkey(name)')
        .single()
      if (createError) throw createError
      setAnnouncements((current) => [data, ...current])
      setForm(emptyForm)
      setComposerOpen(false)
      setMessage('Announcement published.')
    } catch (createError) {
      setError(createError.message || 'Unable to publish this announcement')
    } finally {
      setSaving(false)
    }
  }

  const togglePinned = async (announcement) => {
    setError('')
    setBusyId(announcement.id)
    const { error: updateError } = await api
      .from('announcements')
      .update({ pinned: !announcement.pinned, updated_at: new Date().toISOString() })
      .eq('id', announcement.id)
    setBusyId(null)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setAnnouncements((current) => current.map((item) => (
      item.id === announcement.id ? { ...item, pinned: !item.pinned } : item
    )))
  }

  const deleteAnnouncement = async (announcement) => {
    if (!window.confirm(`Delete “${announcement.title}”?`)) return
    setError('')
    setBusyId(announcement.id)
    const { error: deleteError } = await api.from('announcements').delete().eq('id', announcement.id)
    setBusyId(null)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    setAnnouncements((current) => current.filter((item) => item.id !== announcement.id))
    setMessage('Announcement deleted.')
  }

  const markAsRead = async (announcement) => {
    if (isStaff || readIds.has(announcement.id)) return
    setReadIds((current) => new Set([...current, announcement.id]))
    const { error: readError } = await api
      .from('announcement_reads')
      .insert({ announcement_id: announcement.id, user_id: user.id })
    if (readError && readError.code !== '23505') {
      setReadIds((current) => {
        const next = new Set(current)
        next.delete(announcement.id)
        return next
      })
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Announcements' }]} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Announcements</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isStaff
              ? 'Share updates with a cohort track or the whole academy.'
              : 'Academy announcements and important updates.'}
          </p>
        </div>
        {isStaff && !composerOpen && (
          <Button onClick={() => { setComposerOpen(true); setError(''); setMessage('') }} className="shrink-0">
            <Plus size={16} className="mr-2" />
            New announcement
          </Button>
        )}
      </div>

      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}

      {isStaff && composerOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">New announcement</CardTitle>
            <CardDescription>Pinned announcements stay at the top of the list.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createAnnouncement} className="space-y-4">
              <div>
                <label htmlFor="announcement-title" className="mb-1 block text-xs font-semibold text-foreground">Title</label>
                <Input
                  id="announcement-title"
                  required
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="e.g. Sprint 2 demos move to Thursday"
                />
              </div>
              <div>
                <label htmlFor="announcement-content" className="mb-1 block text-xs font-semibold text-foreground">Message</label>
                <Textarea
                  id="announcement-content"
                  required
                  value={form.content}
                  onChange={(event) => setForm({ ...form, content: event.target.value })}
                  placeholder="What changed, who it affects, and what students should do."
                  className="min-h-[110px] text-sm"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:max-w-lg">
                <div>
                  <label htmlFor="announcement-type" className="mb-1 block text-xs font-semibold text-foreground">Type</label>
                  <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                    <SelectTrigger id="announcement-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="announcement-audience" className="mb-1 block text-xs font-semibold text-foreground">Audience</label>
                  <Select value={form.audience} onValueChange={(value) => setForm({ ...form, audience: value })}>
                    <SelectTrigger id="announcement-audience" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(AUDIENCE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(event) => setForm({ ...form, pinned: event.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-deep-600 focus-visible:ring-2 focus-visible:ring-deep-600"
                />
                Pin to the top
              </label>
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Publishing…' : 'Publish announcement'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setComposerOpen(false); setForm(emptyForm); setError('') }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && <p className="py-12 text-center text-sm text-gray-500">Loading announcements…</p>}

      {!loading && announcements.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            <Bell size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No announcements yet.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {!loading && announcements.map((announcement) => {
          const isRead = readIds.has(announcement.id)
          const manageable = isStaff && canManage(announcement)
          const authorName = announcement.users?.name

          return (
            <Card
              key={announcement.id}
              onClick={() => markAsRead(announcement)}
              className={`p-4 transition-colors ${
                announcement.pinned ? 'border-deep-200 bg-deep-50/40' : ''
              } ${!isStaff && !isRead ? 'border-l-4 border-l-deep-600' : 'border-l-4 border-l-transparent'}`}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-sm">{announcement.title}</CardTitle>
                    {announcement.pinned && (
                      <Badge variant="secondary" className="text-[10px]">
                        <Pin size={10} className="mr-1" />
                        Pinned
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-1 text-[11px]">
                    {TYPE_LABELS[announcement.type] || announcement.type}
                    {' · '}
                    {AUDIENCE_LABELS[announcement.audience] || announcement.audience}
                    {authorName && ` · ${authorName}`}
                    {announcement.created_at && ` · ${formatDate(announcement.created_at)}`}
                  </CardDescription>
                </div>

                {manageable && (
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(event) => { event.stopPropagation(); togglePinned(announcement) }}
                      disabled={busyId === announcement.id}
                      aria-label={announcement.pinned ? 'Unpin announcement' : 'Pin announcement'}
                      title={announcement.pinned ? 'Unpin' : 'Pin'}
                    >
                      {announcement.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(event) => { event.stopPropagation(); deleteAnnouncement(announcement) }}
                      disabled={busyId === announcement.id}
                      aria-label="Delete announcement"
                      title="Delete"
                    >
                      <Trash2 size={14} className="text-red-600" />
                    </Button>
                  </div>
                )}

                {!isStaff && isRead && (
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    <CheckCircle size={10} className="mr-1" />
                    Read
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="py-2">
                <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{announcement.content}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

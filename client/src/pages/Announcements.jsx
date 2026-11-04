import { useState, useEffect } from 'react'
import { MapPin, Bell, Users } from 'lucide.react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '../components/ui/select'
import { supabase } from '../lib/supabase'

const TYPE_CONFIG = {
  announcement: { label: 'Announcement', variant: 'default', color: 'bg-brand-50 text-brand-700 border-brand-100' },
  reminder: { label: 'Reminder', variant: 'default', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  update: { label: 'Update', variant: 'default', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newAudience, setNewAudience] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch (err) {
      console.error('Error loading announcements:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newTitle || !newContent) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('announcements')
        .insert({
          title: newTitle,
          content: newContent,
          audience: newAudience,
          author_name: user.user_metadata?.full_name || user.email,
          author_id: user.id,
          pinned: false,
          created_at: new Date().toISOString(),
        })

      if (error) throw error
      setNewTitle('')
      setNewContent('')
      setNewAudience('all')
      await loadAnnouncements()
    } catch (err) {
      console.error('Error creating announcement:', err)
      alert('Failed to create announcement')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading announcements...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-deep-600 mb-1">Announcements</h1>
            <p className="text-sm text-gray-500">
              Communicate with Fellows across cohorts
            </p>
          </div>
          <Button>
            <MapPin size={16} className="mr-2" />
            New Announcement
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold">Create New Announcement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-500">
                Title
              </label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter announcement title"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-500">
                Content
              </label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Enter announcement content"
                required
                rows={3}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-deep-600 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-500">
                Audience
              </label>
              <Select
                value={newAudience}
                onValueChange={(value) => setNewAudience(value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fellows</SelectItem>
                  <SelectItem value="finsoft">Finsoft Fellows</SelectItem>
                  <SelectItem value="finops">Finops Fellows</SelectItem>
                  <SelectItem value="cohort1">Cohort 1 Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              Publish Announcement
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-3">
        {announcements.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Bell size={32} className="mx-auto mb-3 opacity-50" />
            <p>No announcements yet</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <Card
              key={announcement.id}
              className={`cursor-pointer hover:border-brand-200 transition-colors duration-150 ${
                announcement.pinned ? 'border-brand-200 bg-brand-50' : ''
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  {announcement.pinned && (
                    <Badge variant="outline" className="text-[10px] mr-2">Pinned</Badge>
                  )}
                  <Badge className={TYPE_CONFIG[announcement.type].color}>{TYPE_CONFIG[announcement.type].label}</Badge>
                </div>
                <span className="text-[10px] text-gray-400">
                  {new Date(announcement.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="space-y-2">
                  <CardTitle className="text-sm">{announcement.title}</CardTitle>
                  <p className="text-sm text-gray-600">{announcement.content}</p>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between pt-3">
                <div className="flex items-center gap-3">
                  <Users size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{announcement.audience}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Bell size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{announcement.author_name}</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        )}
      </div>
    </div>
  )
}

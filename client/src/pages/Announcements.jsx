import { useState, useEffect } from 'react'
import { Bell, Users, Eye, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { supabase } from '../lib/supabase'
import { getCurrentProfile } from '../lib/profile'

const TYPE_CONFIG = {
  announcement: { label: 'Announcement', variant: 'default', color: 'bg-brand-50 text-brand-700 border-brand-100' },
  reminder: { label: 'Reminder', variant: 'default', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  update: { label: 'Update', variant: 'default', color: 'bg-brand-50 text-brand-700 border-brand-100' },
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [readAnnouncements, setReadAnnouncements] = useState(new Set())

  useEffect(() => {
    loadAnnouncements()
    loadReadState()
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

  const loadReadState = async () => {
    const profile = await getCurrentProfile()
    if (!profile) return

    try {
      const { data } = await supabase
        .from('announcement_reads')
        .select('announcement_id')
        .eq('user_id', profile.id)

      if (data) {
        setReadAnnouncements(new Set(data.map((d) => d.announcement_id)))
      }
    } catch {
      // announcement_reads table may not exist yet
    }
  }

  const markAsRead = (announcementId) => {
    if (readAnnouncements.has(announcementId)) return
    const profile = getCurrentProfile()
    if (!profile) return
    profile.then((p) => {
      if (!p) return
      supabase
        .from('announcement_reads')
        .insert({ announcement_id: announcementId, user_id: p.id })
        .then(() => {
          setReadAnnouncements((prev) => new Set([...prev, announcementId]))
        })
        .catch(() => {
          // Ignore - table may not exist
        })
    })
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
              Academy announcements and important updates
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {announcements.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Bell size={32} className="mx-auto mb-3 opacity-50" />
            <p>No announcements yet</p>
          </div>
        ) :
          announcements.map((announcement) => {
            const isRead = readAnnouncements.has(announcement.id)
            const typeConfig = TYPE_CONFIG[announcement.type] || TYPE_CONFIG.announcement

            return (
              <Card
                key={announcement.id}
                onClick={() => markAsRead(announcement.id)}
                className={`cursor-pointer hover:border-brand-200 transition-colors duration-150 p-4 ${
                  announcement.pinned ? 'border-brand-200 bg-brand-50' : ''
                } ${!isRead ? 'border-l-4 border-brand-600 bg-white' : 'border-l-4 border-transparent bg-gray-50'}`}
              >
                <CardHeader className="flex flex-row items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    {announcement.pinned && (
                      <Badge variant="outline" className="text-[10px] mr-2">Pinned</Badge>
                    )}
                    <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {new Date(announcement.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </CardHeader>
                <CardContent className="pt-2 pb-2">
                  <div className="space-y-2">
                    <CardTitle className="text-sm font-semibold">{announcement.title}</CardTitle>
                    <p className="text-sm text-gray-600">{announcement.content}</p>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <Users size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-500">{announcement.audience}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {!isRead ? (
                      <Eye size={12} className="text-gray-400" />
                    ) : (
                      <CheckCircle size={12} className="text-emerald-500" />
                    )}
                    <span className="text-xs text-gray-500">{isRead ? 'Read' : 'Unread'}</span>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
      </div>
    </div>
  )
}

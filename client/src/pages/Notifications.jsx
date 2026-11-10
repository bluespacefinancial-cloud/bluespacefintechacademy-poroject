/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { api } from '../lib/backend'
import { getCurrentProfile } from '../lib/profile'
import { humaniseNotificationType } from '../lib/notifications'

const PAGE_SIZE = 50

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [markingAll, setMarkingAll] = useState(false)

  const load = useCallback(async () => {
    const profile = await getCurrentProfile()
    if (!profile) return
    const { data, error: loadError } = await api
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
    if (loadError) throw loadError
    setNotifications(data || [])
  }, [])

  const loadInitial = useCallback(async () => {
    try {
      await load()
    } catch (loadError) {
      setError(loadError.message || 'Unable to load notifications')
    } finally {
      setLoading(false)
    }
  }, [load])

  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  const markRead = async (notification) => {
    setError('')
    const { error: updateError } = await api
      .from('notifications')
      .update({ is_read: 1, updated_at: new Date().toISOString() })
      .eq('id', notification.id)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, is_read: 1 } : item))
  }

  const markAllRead = async () => {
    const unread = notifications.filter((item) => !item.is_read)
    if (!unread.length) return
    setMarkingAll(true)
    setError('')
    const { error: updateError } = await api
      .from('notifications')
      .update({ is_read: 1, updated_at: new Date().toISOString() })
      .in('id', unread.map((item) => item.id))
    setMarkingAll(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setNotifications((current) => current.map((item) => ({ ...item, is_read: 1 })))
  }

  const unreadCount = notifications.filter((item) => !item.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">Updates about your academy activity.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={markingAll}>
            <Check size={14} className="mr-1.5" />
            {markingAll ? 'Marking…' : `Mark all read (${unreadCount})`}
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading && <p className="py-8 text-center text-sm text-gray-500">Loading notifications…</p>}

          {!loading && notifications.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <Bell size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No notifications yet.</p>
            </div>
          )}

          {!loading && notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start justify-between gap-4 rounded-lg border p-3 transition-colors ${
                notification.is_read ? 'border-gray-200/90 bg-white' : 'border-deep-200 bg-deep-50'
              }`}
            >
              <div className="flex min-w-0 gap-3">
                <Bell size={16} className="mt-0.5 shrink-0 text-deep-600" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {humaniseNotificationType(notification.type)}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{notification.data}</p>
                  <p className="mt-1.5 text-[11px] text-gray-400">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {notification.is_read ? (
                <Badge variant="outline" className="shrink-0">Read</Badge>
              ) : (
                <Button size="sm" variant="outline" onClick={() => markRead(notification)} className="shrink-0">
                  <Check size={13} className="mr-1" />
                  Mark read
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

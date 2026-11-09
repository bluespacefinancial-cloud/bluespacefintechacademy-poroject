/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { api } from '../lib/backend'
import { getCurrentProfile } from '../lib/profile'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    const profile = await getCurrentProfile()
    const { data, error: loadError } = await api.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(50)
    if (loadError) throw loadError
    setNotifications(data || [])
  }
  useEffect(() => { load().catch((loadError) => setError(loadError.message || 'Unable to load notifications')).finally(() => setLoading(false)) }, [])

  const markRead = async (notification) => {
    const { error: updateError } = await api.from('notifications').update({ is_read: 1, updated_at: new Date().toISOString() }).eq('id', notification.id)
    if (updateError) { setError(updateError.message); return }
    setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, is_read: 1 } : item))
  }

  return <div className="min-h-screen bg-gray-50"><div className="mb-6"><h1 className="text-2xl font-bold text-deep-600">Notifications</h1><p className="text-sm text-gray-500">Updates about your academy activity.</p></div>{error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}<Card><CardHeader><CardTitle className="text-sm">Recent updates</CardTitle></CardHeader><CardContent className="space-y-2">{loading && <p className="text-sm text-gray-500">Loading notifications...</p>}{!loading && notifications.length === 0 && <p className="py-10 text-center text-sm text-gray-500">No notifications yet.</p>}{notifications.map((notification) => <div key={notification.id} className={`flex items-start justify-between gap-4 rounded border p-3 ${notification.is_read ? 'bg-white' : 'bg-brand-50'}`}><div className="flex gap-3"><Bell size={16} className="mt-1 text-brand-600" /><div><p className="text-sm font-medium">{notification.type}</p><p className="mt-1 text-xs text-gray-600">{typeof notification.data === 'string' ? notification.data : JSON.stringify(notification.data)}</p><p className="mt-1 text-[10px] text-gray-400">{new Date(notification.created_at).toLocaleString()}</p></div></div>{!notification.is_read && <Button size="sm" variant="outline" onClick={() => markRead(notification)}><Check size={13} className="mr-1" />Read</Button>}{notification.is_read && <Badge variant="outline">Read</Badge>}</div>)}</CardContent></Card></div>
}

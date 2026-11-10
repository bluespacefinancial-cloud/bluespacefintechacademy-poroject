import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCircle2, Calendar, Video, FileText, ExternalLink } from 'lucide-react'
import { api } from '../../lib/backend'
import { humaniseNotificationType, notificationRoute } from '../../lib/notifications'
import { useAuth } from '../../context/AuthContext'

export default function NotificationDropdown() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  const loadNotifications = async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const { data, error } = await api
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15)

      if (error) throw error
      const items = data || []
      setNotifications(items)
      const unread = items.filter((n) => n.is_read === 0 || !n.is_read).length
      setUnreadCount(unread)
    } catch {
      // silently fail in background
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // The first fetch flips the loading flag synchronously before awaiting.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotifications()
    // Periodic refresh every 60s
    const timer = setInterval(loadNotifications, 60000)
    return () => clearInterval(timer)
  }, [user?.id])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const markAsRead = async (notification, event) => {
    if (event) event.stopPropagation()
    try {
      await api
        .from('notifications')
        .update({ is_read: 1, updated_at: new Date().toISOString() })
        .eq('id', notification.id)

      setNotifications((prev) =>
        prev.map((item) => (item.id === notification.id ? { ...item, is_read: 1 } : item))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {
      // ignore
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => n.is_read === 0 || !n.is_read).map((n) => n.id)
      if (!unreadIds.length) return

      await api
        .from('notifications')
        .update({ is_read: 1, updated_at: new Date().toISOString() })
        .in('id', unreadIds)

      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: 1 })))
      setUnreadCount(0)
    } catch {
      // ignore
    }
  }

  const handleNotificationClick = async (item) => {
    if (item.is_read === 0 || !item.is_read) {
      await markAsRead(item)
    }
    setOpen(false)
    navigate(notificationRoute(item.type, user?.type))
  }

  const getIcon = (type) => {
    const t = (type || '').toLowerCase()
    if (t.includes('grade') || t.includes('score')) {
      return <CheckCircle2 size={15} className="text-emerald-600" />
    }
    if (t.includes('clinic')) {
      return <Calendar size={15} className="text-deep-600" />
    }
    if (t.includes('class') || t.includes('live')) {
      return <Video size={15} className="text-blue-600" />
    }
    if (t.includes('lab')) {
      return <FileText size={15} className="text-amber-600" />
    }
    return <Bell size={15} className="text-gray-500" />
  }

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return ''
    const now = new Date()
    const past = new Date(timestamp)
    const diffMs = now - past
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={open}
        className={`p-2 rounded-lg border transition-colors relative flex items-center justify-center ${
          open
            ? 'bg-deep-50 border-deep-200 text-deep-700'
            : 'bg-gray-50/80 border-gray-200/80 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <Bell size={17} className="shrink-0" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1 min-w-[16px] h-4 flex items-center justify-center rounded-full shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Overlay Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200/90 rounded-2xl shadow-xl z-50 overflow-hidden animate-sheet-up">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-deep-700 border border-deep-200 px-2 py-0.2 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-deep-600 hover:text-deep-700 hover:underline flex items-center gap-1"
              >
                <Check size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center space-y-1.5 px-4">
                <Bell size={20} className="text-gray-300 mx-auto" />
                <p className="text-xs font-bold text-gray-800">All caught up</p>
                <p className="text-[11px] text-gray-400">
                  New submissions, grading notes, and clinic invites will appear here.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isUnread = item.is_read === 0 || !item.is_read
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 text-left ${
                      isUnread ? 'bg-deep-50/20 hover:bg-deep-50/40' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200/70 flex items-center justify-center shrink-0 mt-0.5">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs truncate ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {humaniseNotificationType(item.type)}
                        </p>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {formatTimeAgo(item.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5 leading-relaxed">
                        {item.data}
                      </p>
                    </div>
                    {isUnread && (
                      <span
                        className="w-2 h-2 rounded-full bg-deep-600 shrink-0 mt-2"
                        title="Unread"
                      />
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-gray-50/70 border-t border-gray-100 text-center">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-deep-600 hover:text-deep-700 hover:underline inline-flex items-center gap-1"
            >
              <span>View full notification history</span>
              <ExternalLink size={11} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

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
            ? 'bg-brand-50 dark:bg-blue-950/60 border-brand-200 dark:border-blue-800 text-brand-700 dark:text-blue-300'
            : 'bg-card border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground'
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
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden animate-sheet-up">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-brand-700 dark:text-blue-300 border border-brand-200 dark:border-blue-800/60 bg-brand-50/50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-brand-600 dark:text-blue-400 hover:text-brand-700 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
              >
                <Check size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center space-y-1.5 px-4">
                <Bell size={20} className="text-muted-foreground/40 mx-auto" />
                <p className="text-xs font-bold text-foreground">All caught up</p>
                <p className="text-[11px] text-muted-foreground">
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
                      isUnread ? 'bg-brand-50/20 dark:bg-blue-950/30 hover:bg-brand-50/40 dark:hover:bg-blue-900/40' : 'hover:bg-muted/40'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border flex items-center justify-center shrink-0 mt-0.5 text-foreground">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs truncate ${isUnread ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                          {humaniseNotificationType(item.type)}
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatTimeAgo(item.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                        {item.data}
                      </p>
                    </div>
                    {isUnread && (
                      <span
                        className="w-2 h-2 rounded-full bg-brand-600 dark:bg-blue-400 shrink-0 mt-2"
                        title="Unread"
                      />
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-muted/30 border-t border-border text-center">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-brand-600 dark:text-blue-400 hover:text-brand-700 dark:hover:text-blue-300 hover:underline inline-flex items-center gap-1"
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

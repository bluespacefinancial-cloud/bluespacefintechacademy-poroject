import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Bell,
  BookOpen,
  ClipboardList,
  FileText,
  Search,
  School,
  Video,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../ui/dialog'
import { Input } from '../ui/input'
import { api } from '../../lib/backend'
import { useAuth } from '../../context/AuthContext'

const DEBOUNCE_MS = 250
const RESULT_LIMIT = 4

const GROUPS = {
  modules: { label: 'Modules', icon: BookOpen },
  lessons: { label: 'Lessons', icon: FileText },
  labs: { label: 'Labs', icon: ClipboardList },
  live_classes: { label: 'Live classes', icon: Video },
  clinics: { label: 'Mentor clinics', icon: Activity },
  partner_courses: { label: 'Partner courses', icon: School },
  announcements: { label: 'Announcements', icon: Bell },
}

function hrefFor(table, row, role) {
  switch (table) {
    case 'modules':
      return role === 'Student' ? '/my-learning' : `/modules/${row.id}`
    case 'lessons':
      return `/lesson/${row.id}`
    case 'labs':
      return role === 'Student' ? '/lab-workspace' : '/grading'
    case 'live_classes':
      return '/live-classes'
    case 'clinics':
      return '/mentor-clinics'
    case 'partner_courses':
      if (role === 'Partner') return '/partner-courses'
      if (role === 'Administrator') return '/partner-course-review'
      return `/partner-course/${row.id}`
    case 'announcements':
      return '/announcements'
    default:
      return '/'
  }
}

/**
 * Tables a role can meaningfully search. RLS still filters every result, so
 * an unexpected row cannot leak: this list only keeps the query count down.
 */
function searchTargets(role) {
  if (role === 'Student') {
    return ['modules', 'lessons', 'labs', 'live_classes', 'clinics', 'partner_courses', 'announcements']
  }
  if (role === 'Partner') {
    return ['partner_courses']
  }
  return ['modules', 'lessons', 'labs', 'live_classes', 'clinics', 'partner_courses', 'announcements']
}

export default function GlobalSearch({ open, onOpenChange }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const role = user?.type || 'Student'
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const flatResults = useMemo(
    () => results.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label }))),
    [results]
  )

  // Closing the palette resets it, so reopening always starts clean.
  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) {
      setQuery('')
      setResults([])
      setError('')
      setActiveIndex(0)
    }
    onOpenChange(nextOpen)
  }

  useEffect(() => {
    if (!open) return undefined

    let cancelled = false
    const timer = window.setTimeout(async () => {
      const trimmed = query.trim()
      setError('')

      if (trimmed.length < 2) {
        setResults([])
        setActiveIndex(0)
        setLoading(false)
        return
      }

      setLoading(true)
      const pattern = `%${trimmed.replace(/[%_]/g, (match) => `\\${match}`)}%`
      try {
        const settled = await Promise.allSettled(
          searchTargets(role).map(async (table) => {
            const { data, error: queryError } = await api
              .from(table)
              .select('id, title')
              .ilike('title', pattern)
              .limit(RESULT_LIMIT)
            if (queryError) throw queryError
            return { table, rows: data || [] }
          })
        )

        if (cancelled) return

        settled.forEach((entry, idx) => {
          if (entry.status === 'rejected') {
            console.warn(`Search failed for ${searchTargets(role)[idx]}:`, entry.reason)
          }
        })

        const groups = settled
          .filter((entry) => entry.status === 'fulfilled')
          .map((entry) => {
            const { table, rows } = entry.value
            if (!rows.length) return null
            const meta = GROUPS[table]
            return {
              key: table,
              label: meta.label,
              icon: meta.icon,
              items: rows.map((row) => ({
                id: `${table}-${row.id}`,
                label: row.title,
                href: hrefFor(table, row, role),
              })),
            }
          })
          .filter(Boolean)

        setResults(groups)
        setActiveIndex(0)
        if (!groups.length) {
          const failed = settled.filter((entry) => entry.status === 'rejected')
          setError(failed.length === settled.length ? 'Search is unavailable right now.' : '')
        }
      } catch (searchError) {
        if (!cancelled) setError(searchError.message || 'Search is unavailable right now.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query, open, role])

  const go = (href) => {
    handleOpenChange(false)
    navigate(href)
  }

  const handleKeyDown = (event) => {
    if (!flatResults.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % flatResults.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + flatResults.length) % flatResults.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const target = flatResults[activeIndex]
      if (target) go(target.href)
    }
  }

  const trimmed = query.trim()

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl gap-0 p-0 overflow-hidden border border-border bg-card shadow-2xl">
        <DialogTitle className="sr-only">Search the academy</DialogTitle>
        <DialogDescription className="sr-only">
          Search modules, lessons, labs, classes and partner courses.
        </DialogDescription>

        <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-muted/20">
          <Search size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search modules, lessons, labs, classes…"
            className="h-9 border-0 px-0 text-sm bg-transparent text-foreground placeholder:text-muted-foreground shadow-none focus-visible:ring-0"
            aria-label="Search the academy"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-blue-600"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {trimmed.length < 2 && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              Type at least two characters to search.
            </p>
          )}

          {trimmed.length >= 2 && loading && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">Searching…</p>
          )}

          {trimmed.length >= 2 && !loading && error && (
            <p role="alert" className="px-3 py-6 text-center text-xs text-red-600 dark:text-red-400">{error}</p>
          )}

          {trimmed.length >= 2 && !loading && !error && flatResults.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No matches for “{trimmed}”.
            </p>
          )}

          {!loading && results.map((group) => {
            const GroupIcon = group.icon
            return (
              <div key={group.key} className="mb-1 last:mb-0">
                <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const index = flatResults.findIndex((entry) => entry.id === item.id)
                    const isActive = index === activeIndex
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => go(item.href)}
                          onMouseEnter={() => setActiveIndex(index)}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 ${
                            isActive
                              ? 'bg-blue-600/15 dark:bg-blue-500/20 text-foreground ring-1 ring-blue-500/40'
                              : 'hover:bg-muted/50 text-foreground'
                          }`}
                        >
                          <GroupIcon
                            size={15}
                            className={`shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{item.label}</span>
                          <ArrowRight
                            size={13}
                            className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground/40'}
                            aria-hidden="true"
                          />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-4 border-t border-border px-4 py-2.5 text-[10px] text-muted-foreground bg-muted/20">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] shadow-xs">↑</kbd>
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] shadow-xs">↓</kbd>
            to navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] shadow-xs">Enter</kbd>
            to open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] shadow-xs">Esc</kbd>
            to close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { Outlet, Navigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Search, GraduationCap } from 'lucide-react'
import Sidebar from './Sidebar'
import GlobalSearch from './GlobalSearch'
import NotificationDropdown from '../notifications/NotificationDropdown'
import { SkipLink } from '../ui/accessibility'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/backend'
import { DarkModeToggle } from '../ui/dark-mode-toggle'
import { PageContainer } from './page-container'
import { BackToTop } from '../ui/back-to-top'
import { KeyboardShortcutsPanel } from '../ui/keyboard-shortcuts-panel'

export default function AppLayout() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [cohortName, setCohortName] = useState(null)
  const mainRef = useRef(null)
  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform)

  // Command palette shortcut: Cmd/Ctrl + K, and "/" when not typing.
  useEffect(() => {
    const onKeyDown = (event) => {
      const { target } = event
      const isTyping = target instanceof HTMLElement
        && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((open) => !open)
      } else if (event.key === '/' && !isTyping) {
        event.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Fetch current user cohort
  useEffect(() => {
    let cancelled = false
    const fetchCohort = async () => {
      if (!user?.id || !api) return
      try {
        const { data } = await api
          .from('enrolments')
          .select('cohorts(name)')
          .eq('user_id', user.id)
          .in('status', ['enrolled', 'active'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (!cancelled && data?.cohorts?.name) {
          setCohortName(data.cohorts.name)
        }
      } catch {
        // non-blocking
      }
    }
    fetchCohort()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  // Keyboard listeners: Ctrl+K / Cmd+K for global search, Shift+? for shortcuts
  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((prev) => !prev)
      } else if (event.shiftKey && event.key === '/') {
        event.preventDefault()
        setShortcutsOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  if (!user) return <Navigate to="/login" />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <SkipLink />
      <Sidebar open={sidebarOpen} onOpen={() => setSidebarOpen(true)} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <header className="h-14 bg-white border-b border-gray-200/80 flex items-center justify-between px-4 sm:px-5 lg:px-6 sticky top-0 z-30 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center lg:hidden mr-1">
              <img src="/logo-dark.png" alt="BlueSPACE" className="h-6 w-auto dark:hidden" />
              <img src="/logo-white.png" alt="BlueSPACE" className="h-6 w-auto hidden dark:block" />
            </div>

            {/* Global Search */}
            <div className="hidden lg:flex items-center w-72 max-w-sm">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="relative w-full flex items-center gap-2 pl-9 pr-3 py-1.5 text-xs text-left bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-600 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600"
                aria-label="Search the academy"
                aria-haspopup="dialog"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-400" size={15} aria-hidden="true" />
                <span className="text-gray-400 truncate dark:text-gray-300">Search modules, labs, clinics…</span>
                <kbd className="ml-auto hidden xl:inline-flex items-center gap-0.5 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-gray-400 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {isMac ? '⌘ K' : 'Ctrl K'}
                </kbd>
              </button>
            </div>

            {/* Top Navigation Right: Cohort + Notifications */}
            <div className="flex items-center gap-3 ml-auto">
              {cohortName && (
                <span
                  className="hidden sm:flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 font-medium truncate max-w-[220px]"
                  title={cohortName}
                >
                  <GraduationCap size={13} className="text-deep-600 dark:text-deep-400 shrink-0" />
                  {cohortName}
                </span>
              )}

              {/* Mobile Search Button */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Search academy"
              >
                <Search size={17} />
              </button>

              {/* Notification Dropdown */}
              <div className="flex items-center shrink-0">
                <NotificationDropdown />
              </div>

              {/* Theme toggle */}
              <DarkModeToggle className="ml-2" />
            </div>
          </div>
        </header>

        <main id="main-content" ref={mainRef} className="flex-1 w-full min-w-0 px-4 sm:px-5 lg:px-6 py-6 pb-24 lg:pb-10 overflow-y-auto">
          <PageContainer>
            <Outlet />
          </PageContainer>
        </main>

      {/* Back to Top */}
      <BackToTop containerRef={mainRef} />
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Keyboard Shortcuts Panel */}
      <KeyboardShortcutsPanel
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        isMac={isMac}
      />
    </div>
  )
}

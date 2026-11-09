import { Outlet, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Search, GraduationCap } from 'lucide-react'
import Sidebar from './Sidebar'
import NotificationDropdown from '../notifications/NotificationDropdown'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/backend'

export default function AppLayout() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [cohortName, setCohortName] = useState(null)

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

  if (!user) return <Navigate to="/login" />

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar open={sidebarOpen} onOpen={() => setSidebarOpen(true)} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <header className="h-14 bg-white border-b border-gray-200/80 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center lg:hidden mr-1">
              <img src="/logo-dark.png" alt="BlueSPACE" className="h-6 w-auto" />
            </div>

            {/* Global Search Bar */}
            <div className="hidden lg:flex items-center w-72 max-w-sm">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type="text"
                  placeholder="Search modules, labs, clinics..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-deep-600 focus:border-deep-600 outline-none transition-all placeholder:text-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Top Navigation Right: Cohort + Notifications */}
            <div className="flex items-center gap-3 ml-auto">
              {cohortName && (
                <span
                  className="hidden sm:flex items-center gap-1 text-xs text-gray-600 font-medium truncate max-w-[220px]"
                  title={cohortName}
                >
                  <GraduationCap size={13} className="text-deep-600 shrink-0" />
                  {cohortName}
                </span>
              )}

              {/* Notification Dropdown */}
              <div className="flex items-center shrink-0">
                <NotificationDropdown />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { Outlet, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Search, Calendar, Clock, GraduationCap } from 'lucide-react'
import Sidebar from './Sidebar'
import NotificationDropdown from '../notifications/NotificationDropdown'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function AppLayout() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [cohortName, setCohortName] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Real-time clock update (every 30s)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  // Fetch current user cohort
  useEffect(() => {
    let cancelled = false
    const fetchCohort = async () => {
      if (!user?.id || !supabase) return
      try {
        const { data } = await supabase
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

  const formattedDate = currentTime.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const formattedTime = currentTime.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })

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

            {/* Top Navigation Center / Right Status: Date & Time, ID, Cohort */}
            <div className="flex items-center gap-3 ml-auto">
              {/* Date & Live Time */}
              <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-gray-50/80 px-2.5 py-1.5 rounded-lg border border-gray-100">
                <Calendar size={13} className="text-gray-400 shrink-0" />
                <span>{formattedDate}</span>
                <span className="text-gray-300">•</span>
                <Clock size={13} className="text-gray-400 shrink-0" />
                <span>{formattedTime}</span>
              </div>

              {/* ID & Cohort Pill (no duplicate user name) */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200/90 text-xs">
                {user.student_id ? (
                  <span className="font-mono font-bold text-gray-900 tracking-tight">
                    {user.student_id}
                  </span>
                ) : (
                  <span className="font-mono text-gray-500 text-[11px]">
                    {user.type === 'Student' ? 'ID Pending' : user.type}
                  </span>
                )}
                {cohortName ? (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1 text-gray-600 font-medium truncate max-w-[180px]" title={cohortName}>
                      <GraduationCap size={13} className="text-deep-600 shrink-0" />
                      {cohortName}
                    </span>
                  </>
                ) : user.type === 'Student' ? (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-400 text-[11px]">Placement in Progress</span>
                  </>
                ) : null}
              </div>

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
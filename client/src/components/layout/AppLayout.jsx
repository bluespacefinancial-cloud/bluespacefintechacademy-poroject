import { Outlet, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { Search, Bell } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAuth } from '../../context/AuthContext'

export default function AppLayout() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  if (!user) return <Navigate to="/login" />

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar open={sidebarOpen} onOpen={() => setSidebarOpen(true)} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <header className="h-14 bg-white border-b border-gray-200/80 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center lg:hidden mr-3">
              <img src="/logo-dark.png" alt="BlueSPACE" className="h-6 w-auto" />
            </div>

            {/* Global Search Bar */}
            <div className="hidden lg:flex items-center w-96 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="search"
                  placeholder="Search labs, assessments, cohorts..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-brand-500 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* User Profile & Actions */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-deep-50 border border-deep-100/80 flex items-center justify-center text-xs font-bold text-deep-700 shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-gray-900 leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-gray-500 capitalize leading-tight">
                    {user?.type}{user?.student_id ? ` • ${user.student_id}` : ''}
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <button className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors relative">
                  <Bell size={16} className="shrink-0" />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white" />
                </button>
              </div>
              <button className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 017 7z" />
                </svg>
              </button>
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
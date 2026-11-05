import { Outlet, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './Sidebar'
import { useAuth } from '../../context/AuthContext'

export default function AppLayout() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) return <Navigate to="/login" />

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar open={sidebarOpen} onOpen={() => setSidebarOpen(true)} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <header className="h-14 bg-white border-b border-gray-200/80 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center lg:hidden mr-3">
            <img src="/logo-dark.png" alt="BlueSPACE" className="h-6 w-auto" />
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-deep-50 border border-deep-100/80 flex items-center justify-center text-xs font-bold text-deep-700 shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-900 leading-tight">{user?.name}</p>
              <p className="text-[11px] text-gray-500 capitalize leading-tight">{user?.type}</p>
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

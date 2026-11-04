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

      <div className="flex-1 flex flex-col min-w-0 lg:pl-60">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center lg:hidden mr-3">
            <img src="/logo-dark.png" alt="BlueSPACE" className="h-6 w-auto" />
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-full bg-deep-100 flex items-center justify-center text-xs font-bold text-deep-600">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-deep-600">{user?.name}</p>
              <p className="text-[10px] text-gray-400">{user?.type}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-6 pt-14 lg:pt-6 overflow-auto pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/backend'
import { Badge } from '../ui/badge'
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  Activity,
  Target,
  LogOut,
  X,
  ClipboardList,
  BarChart3,
  MapPin,
  MoreHorizontal,
  CheckCircle,
  FileText,
  Video,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Shield,
  GraduationCap as SchoolIcon,
  Monitor,
  User,
  Award,
} from 'lucide-react'

const sidebarGroups = {
  Student: [
    {
      category: 'Coursework',
      icon: BookOpen,
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', shortLabel: 'Dashboard', ariaLabel: 'Dashboard' },
        { to: '/my-learning', icon: BookOpen, label: 'Curriculum & Labs', shortLabel: 'Curriculum', ariaLabel: 'Curriculum and Labs' },
        { to: '/partner-catalog', icon: SchoolIcon, label: 'Partner Courses', shortLabel: 'Partners', ariaLabel: 'Partner Courses' },
      ],
    },
    {
      category: 'Community & Faculty',
      icon: Users,
      items: [
        { to: '/live-classes', icon: Video, label: 'Sessions & Clinics', shortLabel: 'Sessions', ariaLabel: 'Live Sessions and Mentor Clinics' },
        { to: '/my-squad', icon: Users, label: 'Squad Workspace', shortLabel: 'Squad', ariaLabel: 'Squad Workspace' },
        { to: '/announcements', icon: MapPin, label: 'Announcements', shortLabel: 'Updates', ariaLabel: 'Announcements' },
      ],
    },
    {
      category: 'Credentials',
      icon: Shield,
      items: [
        { to: '/certificates', icon: Award, label: 'Capstone & Certificates', shortLabel: 'Capstone', ariaLabel: 'Capstone and Certificates' },
      ],
    },
  ],
  Instructor: [
    {
      category: 'Teaching',
      icon: SchoolIcon,
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', shortLabel: 'Dashboard', ariaLabel: 'Dashboard' },
        { to: '/my-modules', icon: BookOpen, label: 'My Modules', shortLabel: 'Modules', ariaLabel: 'My Modules' },
        { to: '/grading', icon: ClipboardList, label: 'Evaluation & Grading', shortLabel: 'Grading', ariaLabel: 'Evaluation & Grading' },
        { to: '/student-monitoring', icon: Activity, label: 'Student Monitoring', shortLabel: 'Monitoring', ariaLabel: 'Student Monitoring' },
      ],
    },
    {
      category: 'Classes & Clinics',
      icon: Monitor,
      items: [
        { to: '/live-classes', icon: Video, label: 'Live Classes', shortLabel: 'Classes', ariaLabel: 'Live Classes' },
        { to: '/mentor-clinics', icon: Activity, label: 'Mentor Clinics', shortLabel: 'Clinics', ariaLabel: 'Mentor Clinics' },
        { to: '/capstone', icon: FileText, label: 'Capstone', shortLabel: 'Capstone', ariaLabel: 'Capstone' },
        { to: '/panel-review', icon: ClipboardList, label: 'Panel Review', shortLabel: 'Panels', ariaLabel: 'Panel Review' },
        { to: '/mentor-evaluation', icon: CheckCircle, label: 'Mentor Evaluation', shortLabel: 'Evaluation', ariaLabel: 'Mentor Evaluation' },
      ],
    },
    {
      category: 'Community',
      icon: Users,
      items: [
        { to: '/squads', icon: Target, label: 'Squads', shortLabel: 'Squads', ariaLabel: 'Squads' },
        { to: '/announcements', icon: MapPin, label: 'Announcements', shortLabel: 'Updates', ariaLabel: 'Announcements' },
        { to: '/project-review', icon: ClipboardList, label: 'Project Review', shortLabel: 'Projects', ariaLabel: 'Project Review' },
      ],
    },
  ],
  Partner: [
    {
      category: 'Courses',
      icon: SchoolIcon,
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', shortLabel: 'Dashboard', ariaLabel: 'Dashboard' },
        { to: '/partner-courses', icon: BookOpen, label: 'Course Studio', shortLabel: 'Studio', ariaLabel: 'Course Studio' },
        { to: '/partner-organisation', icon: Briefcase, label: 'Organisation', shortLabel: 'Org', ariaLabel: 'Organisation Profile' },
      ],
    },
    {
      category: 'Community',
      icon: Users,
      items: [
        { to: '/announcements', icon: MapPin, label: 'Announcements', shortLabel: 'Updates', ariaLabel: 'Announcements' },
      ],
    },
  ],
  Administrator: [
    {
      category: 'Academy',
      icon: SchoolIcon,
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', shortLabel: 'Dashboard', ariaLabel: 'Dashboard' },
        { to: '/user-management', icon: Users, label: 'User Management', shortLabel: 'Users', ariaLabel: 'User Management' },
        { to: '/cohorts', icon: GraduationCap, label: 'Cohorts', shortLabel: 'Cohorts', ariaLabel: 'Cohorts' },
        { to: '/enrolments', icon: Users, label: 'Enrolments', shortLabel: 'Enrolments', ariaLabel: 'Enrolments' },
        { to: '/instructor-assignments', icon: User, label: 'Instructor Assignments', shortLabel: 'Instructors', ariaLabel: 'Instructor Assignments' },
        { to: '/applications', icon: ClipboardList, label: 'Applications', shortLabel: 'Applications', ariaLabel: 'Applications' },
        { to: '/curriculum', icon: BookOpen, label: 'Curriculum', shortLabel: 'Curriculum', ariaLabel: 'Curriculum' },
      ],
    },
    {
      category: 'Partners',
      icon: Briefcase,
      items: [
        { to: '/partner-management', icon: Briefcase, label: 'Partner Agencies', shortLabel: 'Partners', ariaLabel: 'Partner Agencies' },
        { to: '/partner-course-review', icon: ClipboardList, label: 'Partner Course Review', shortLabel: 'Review', ariaLabel: 'Partner Course Review' },
        { to: '/use-case-assignment', icon: Target, label: 'Use Cases', shortLabel: 'Cases', ariaLabel: 'Use Cases' },
        { to: '/placement', icon: MapPin, label: 'Placement', shortLabel: 'Placement', ariaLabel: 'Placement' },
      ],
    },
    {
      category: 'Operations',
      icon: Monitor,
      items: [
        { to: '/squads', icon: Target, label: 'Squads', shortLabel: 'Squads', ariaLabel: 'Squads' },
        { to: '/reports', icon: BarChart3, label: 'Reports', shortLabel: 'Reports', ariaLabel: 'Reports' },
        { to: '/audit-log', icon: Shield, label: 'Audit Log', shortLabel: 'Audit', ariaLabel: 'Audit Log' },
        { to: '/student-monitoring', icon: Activity, label: 'Student Monitoring', shortLabel: 'Monitoring', ariaLabel: 'Student Monitoring' },
        { to: '/live-classes', icon: Video, label: 'Live Classes', shortLabel: 'Classes', ariaLabel: 'Live Classes' },
        { to: '/announcements', icon: MapPin, label: 'Announcements', shortLabel: 'Updates', ariaLabel: 'Announcements' },
      ],
    },
    {
      category: 'Capstone & Review',
      icon: FileText,
      items: [
        { to: '/capstone', icon: FileText, label: 'Capstone', shortLabel: 'Capstone', ariaLabel: 'Capstone' },
        { to: '/panel-review', icon: ClipboardList, label: 'Panel Review', shortLabel: 'Panels', ariaLabel: 'Panel Review' },
      ],
    },
  ],
}

export default function Sidebar({ open, onOpen, onClose }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const groups = sidebarGroups[user?.type] || sidebarGroups.Student
  const SIDEBAR_STORAGE_KEY = 'bluespace:sidebar:openCategories'

  const loadOpenCategories = () => {
    try {
      const raw = localStorage.getItem(SIDEBAR_STORAGE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  const [openCategories, setOpenCategories] = useState(loadOpenCategories)
  const [unreadCount, setUnreadCount] = useState(0)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(openCategories))
    } catch {
      // localStorage unavailable or quota exceeded; state still works in memory
    }
  }, [openCategories, SIDEBAR_STORAGE_KEY])

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : (user?.email?.[0]?.toUpperCase() || 'U')

  useEffect(() => {
    let cancelled = false
    const loadUnreadCount = async () => {
      if (!user) return
      try {
        const { count, error } = await api
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', 0)
        if (error) throw error
        if (!cancelled) setUnreadCount(count || 0)
      } catch {
        // silently fail - notification count is non-critical
      }
    }
    loadUnreadCount()
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false)
      }
    }
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [profileMenuOpen])

  const isCategoryOpen = (category) => openCategories[category] ?? true
  const toggleCategory = (category) => {
    setOpenCategories((prev) => ({ ...prev, [category]: !prev[category] }))
  }

  return (
    <>
      <a href="#main-content" className="absolute -top-48 left-0 bg-brand-600 text-white px-4 py-2 z-50 transform -translate-y-full transition-all duration-200 focus:translate-y-0 focus:outline-none">
        Skip to main content
      </a>

      <aside data-tour="tour-sidebar" className="hidden lg:flex fixed top-0 left-0 z-50 h-screen w-64 bg-[#0B0F19] text-white flex-col border-r border-slate-800/80">
        {/* Brand Logo Header */}
        <div className="flex items-center h-16 px-5 border-b border-slate-800/80 shrink-0">
          <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
            <img
              src="/logo-white.png"
              alt="BlueSPACE Fintech Academy"
              className="h-7 w-auto transition-opacity group-hover:opacity-90"
            />
          </NavLink>
        </div>

        <nav aria-label="Main navigation" className="p-3 space-y-2 flex-1 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.category} data-tour={`tour-sidebar-${group.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`} className="mb-2">
              <button
                onClick={() => toggleCategory(group.category)}
                className="flex items-center justify-between w-full px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider transition-colors hover:text-slate-200"
              >
                <span>{group.category}</span>
                <ChevronDown size={13} className={`transition-transform duration-200 text-slate-500 ${isCategoryOpen(group.category) ? 'rotate-180' : ''}`} />
              </button>
              <nav className={`space-y-0.5 mt-1 ${isCategoryOpen(group.category) ? '' : 'hidden'}`}>
                {group.items.map((item) => {
                  const active = location.pathname === item.to ||
                    (item.to === '/my-learning' && (location.pathname === '/lab-workspace' || location.pathname.startsWith('/lesson/'))) ||
                    (item.to === '/partner-catalog' && location.pathname.startsWith('/partner-course/')) ||
                    (item.to === '/live-classes' && location.pathname === '/mentor-clinics') ||
                    (item.to === '/my-squad' && location.pathname === '/peer-reviews') ||
                    (item.to === '/certificates' && (location.pathname === '/capstone' || location.pathname.startsWith('/certificate/')))
                  const itemTourTag = `tour-nav-${item.to.replace(/^\//, '').replace(/[^a-z0-9]/g, '-') || 'dashboard'}`
                  const badgeCount = item.to === '/notifications' ? unreadCount : null
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      data-tour={itemTourTag}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        active
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                      aria-current={active ? 'page' : undefined}
                    >
                      <item.icon size={16} aria-hidden="true" className={active ? 'text-white' : 'text-slate-400'} />
                      <span>{item.label}</span>
                      {badgeCount && badgeCount > 0 && (
                        <Badge variant="outline" className="text-[10px] font-bold text-red-600 border-red-200 shrink-0 ml-1">
                          {badgeCount}
                        </Badge>
                      )}
                    </NavLink>
                  )
                })}
              </nav>
            </div>
          ))}
        </nav>

        {/* User Profile & Slide-Up Menu Trigger */}
        <div ref={profileMenuRef} className="relative p-3 border-t border-slate-800/80 shrink-0">
          {/* Slide-Up Popover Menu */}
          {profileMenuOpen && (
            <div
              role="menu"
              aria-label="User profile and settings"
              className="absolute bottom-full left-3 right-3 mb-2 bg-[#131926] border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 animate-sheet-up divide-y divide-slate-800/80"
            >
              {/* User Identity Card */}
              <div className="px-3 py-2.5">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Fellow'}</p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email || ''}</p>
                <p className="text-[11px] text-slate-500 mt-1.5 truncate">
                  {user?.type || 'Student'}
                  {user?.student_id ? ` · ${user.student_id}` : ''}
                </p>
              </div>

              {/* Menu Actions */}
              <div className="py-1.5 space-y-0.5">
                <NavLink
                  to="/profile-settings"
                  onClick={() => setProfileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <User size={15} className="text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block leading-tight">Profile & Showcase</span>
                    <span className="block text-[10px] text-slate-500 truncate mt-0.5">Bio, photo & public portfolio</span>
                  </div>
                </NavLink>

                <NavLink
                  to="/profile-settings?tab=skills"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  <Target size={15} className="text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block leading-tight">Skills & Domains</span>
                    <span className="block text-[10px] text-slate-500 truncate mt-0.5">Fintech tracks & competencies</span>
                  </div>
                </NavLink>

                <NavLink
                  to="/profile-settings?tab=security"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  <Shield size={15} className="text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block leading-tight">Account & Security</span>
                    <span className="block text-[10px] text-slate-500 truncate mt-0.5">Password, contact & privacy</span>
                  </div>
                </NavLink>
              </div>

              {/* Sign Out */}
              <div className="pt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false)
                    logout()
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={15} className="shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* Trigger Button */}
          <button
            type="button"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            className={`flex items-center gap-3 w-full p-2 rounded-xl text-left transition-colors border ${
              profileMenuOpen
                ? 'bg-slate-800/90 border-slate-700 text-white shadow-inner'
                : 'border-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white'
            }`}
            aria-expanded={profileMenuOpen}
            aria-haspopup="menu"
          >
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-brand-600/30 border border-brand-500/40 text-brand-300 font-bold text-xs flex items-center justify-center">
                {userInitials}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate leading-tight">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.type || 'Student'} • Account</p>
            </div>

            <ChevronUp
              size={15}
              className={`text-slate-400 transition-transform duration-200 shrink-0 ${
                profileMenuOpen ? 'rotate-180 text-white' : ''
              }`}
            />
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (5 buttons max) */}
      {(() => {
        const allNavItems = groups.flatMap((g) => g.items)
        const hasMore = allNavItems.length > 5
        const visibleNavItems = hasMore ? allNavItems.slice(0, 4) : allNavItems.slice(0, 5)

        return (
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#0B0F19] border-t border-gray-200 dark:border-slate-800/80 flex items-stretch shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] pb-[env(safe-area-inset-bottom)]">
            {visibleNavItems.map((item) => {
              const active = location.pathname === item.to
              const badgeCount = item.to === '/notifications' ? unreadCount : null
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex-1 basis-0 min-w-0 flex flex-col items-center justify-center py-2 px-1 text-[10px] font-medium transition-colors ${
                    active ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <div className="relative">
                    {Icon && <Icon size={19} className="shrink-0" />}
                    {badgeCount && badgeCount > 0 && (
                      <span className="absolute -top-1 -right-2.5 bg-red-600 text-white text-[9px] font-bold px-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full">
                        {badgeCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] truncate max-w-full mt-0.5 leading-tight" title={item.shortLabel || item.label}>
                    {item.shortLabel || item.label}
                  </span>
                </NavLink>
              )
            })}
            {hasMore && (
              <button
                onClick={onOpen}
                className="flex-1 basis-0 min-w-0 flex flex-col items-center justify-center py-2 px-1 text-center text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 transition-colors"
                aria-label="More options"
              >
                <div className="relative">
                  <MoreHorizontal size={19} className="shrink-0" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2.5 bg-red-600 text-white text-[9px] font-bold px-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium truncate max-w-full mt-0.5 leading-tight" title="More">
                  More
                </span>
              </button>
            )}
          </nav>
        )
      })()}

      {/* Mobile "More" Slide-up Drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" onClick={onClose} />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#0F172A] border-t border-gray-200 dark:border-slate-800 rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col animate-sheet-up pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800/80 shrink-0">
              <span className="text-sm font-bold text-gray-900 dark:text-white">Academy Menu</span>
              <button onClick={onClose} className="p-1.5 text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white rounded-md transition-colors">
                <X size={20} />
                <span className="sr-only">Close menu</span>
              </button>
            </div>

            <nav className="p-3 space-y-1 overflow-y-auto" aria-label="More options">
              {groups.flatMap((g) => g.items).length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-400 dark:text-slate-500">No additional items</p>
              ) : (
                groups.flatMap((g) => g.items).map((item) => {
                  const active = location.pathname === item.to
                  const badgeCount = item.to === '/notifications' ? unreadCount : null
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        active
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold'
                          : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {Icon && <Icon size={18} className={active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-400'} />}
                        <span>{item.label}</span>
                      </div>
                      {badgeCount && badgeCount > 0 && (
                        <Badge variant="outline" className="text-[10px] font-bold text-red-600 border-red-200 dark:border-red-900/50">
                          {badgeCount}
                        </Badge>
                      )}
                    </NavLink>
                  )
                })
              )}
            </nav>

            <div className="p-3 border-t border-gray-100 dark:border-slate-800/80 shrink-0 space-y-1">
              <NavLink
                to="/profile-settings"
                onClick={onClose}
                className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors"
              >
                <User size={16} className="text-gray-500 dark:text-slate-400" />
                <span>Profile & Settings</span>
              </NavLink>
              <button
                onClick={() => { onClose(); logout() }}
                className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

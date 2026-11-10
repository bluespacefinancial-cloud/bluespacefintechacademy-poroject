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
  ListPlus,
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
      category: 'Learning',
      icon: BookOpen,
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', ariaLabel: 'Dashboard' },
        { to: '/my-learning', icon: BookOpen, label: 'My Learning', ariaLabel: 'My Learning' },
        { to: '/lab-workspace', icon: ClipboardList, label: 'Lab Workspace', ariaLabel: 'Lab Workspace' },
        { to: '/progress', icon: Activity, label: 'Progress & Milestones', ariaLabel: 'Progress and Milestones' },
      ],
    },
    {
      category: 'Classes & Clinics',
      icon: Monitor,
      items: [
        { to: '/live-classes', icon: Video, label: 'Live Classes', ariaLabel: 'Live Classes' },
        { to: '/mentor-clinics', icon: Activity, label: 'Mentor Clinics', ariaLabel: 'Mentor Clinics' },
      ],
    },
    {
      category: 'Collaboration',
      icon: Users,
      items: [
        { to: '/my-squad', icon: Users, label: 'Squad Workspace', ariaLabel: 'Squad Workspace' },
        { to: '/peer-reviews', icon: ClipboardList, label: 'Peer Reviews', ariaLabel: 'Peer Reviews' },
        { to: '/partner-catalog', icon: SchoolIcon, label: 'Partner Courses', ariaLabel: 'Partner Catalog' },
        { to: '/announcements', icon: MapPin, label: 'Announcements', ariaLabel: 'Announcements' },
      ],
    },
    {
      category: 'Credentials & Portfolio',
      icon: Shield,
      items: [
        { to: '/capstone', icon: FileText, label: 'Capstone Project', ariaLabel: 'Capstone Project' },
        { to: '/certificates', icon: Award, label: 'Certificates', ariaLabel: 'Certificates' },
      ],
    },
  ],
  Instructor: [
    {
      category: 'Teaching',
      icon: SchoolIcon,
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', ariaLabel: 'Dashboard' },
        { to: '/my-modules', icon: BookOpen, label: 'My Modules', ariaLabel: 'My Modules' },
        { to: '/grading', icon: ClipboardList, label: 'Evaluation & Grading', ariaLabel: 'Evaluation & Grading' },
        { to: '/student-monitoring', icon: Activity, label: 'Student Monitoring', ariaLabel: 'Student Monitoring' },
        { to: '/quiz-management', icon: ListPlus, label: 'Quiz Authoring', ariaLabel: 'Quiz Authoring' },
      ],
    },
    {
      category: 'Classes & Clinics',
      icon: Monitor,
      items: [
        { to: '/live-classes', icon: Video, label: 'Live Classes', ariaLabel: 'Live Classes' },
        { to: '/mentor-clinics', icon: Activity, label: 'Mentor Clinics', ariaLabel: 'Mentor Clinics' },
        { to: '/capstone', icon: FileText, label: 'Capstone', ariaLabel: 'Capstone' },
        { to: '/panel-review', icon: ClipboardList, label: 'Panel Review', ariaLabel: 'Panel Review' },
        { to: '/mentor-evaluation', icon: CheckCircle, label: 'Mentor Evaluation', ariaLabel: 'Mentor Evaluation' },
      ],
    },
    {
      category: 'Community',
      icon: Users,
      items: [
        { to: '/squads', icon: Target, label: 'Squads', ariaLabel: 'Squads' },
        { to: '/announcements', icon: MapPin, label: 'Announcements', ariaLabel: 'Announcements' },
        { to: '/project-review', icon: ClipboardList, label: 'Project Review', ariaLabel: 'Project Review' },
      ],
    },
  ],
  Partner: [
    {
      category: 'Courses',
      icon: SchoolIcon,
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', ariaLabel: 'Dashboard' },
        { to: '/partner-courses', icon: BookOpen, label: 'Course Studio', ariaLabel: 'Course Studio' },
        { to: '/partner-catalog', icon: SchoolIcon, label: 'Partner Catalog', ariaLabel: 'Partner Catalog' },
      ],
    },
    {
      category: 'Community',
      icon: Users,
      items: [
        { to: '/announcements', icon: MapPin, label: 'Announcements', ariaLabel: 'Announcements' },
      ],
    },
  ],
  Administrator: [
    {
      category: 'Academy',
      icon: SchoolIcon,
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', ariaLabel: 'Dashboard' },
        { to: '/user-management', icon: Users, label: 'User Management', ariaLabel: 'User Management' },
        { to: '/cohorts', icon: GraduationCap, label: 'Cohorts', ariaLabel: 'Cohorts' },
        { to: '/enrolments', icon: Users, label: 'Enrolments', ariaLabel: 'Enrolments' },
        { to: '/applications', icon: ClipboardList, label: 'Applications', ariaLabel: 'Applications' },
        { to: '/curriculum', icon: BookOpen, label: 'Curriculum', ariaLabel: 'Curriculum' },
      ],
    },
    {
      category: 'Partners',
      icon: Briefcase,
      items: [
        { to: '/partner-management', icon: Briefcase, label: 'Partner Agencies', ariaLabel: 'Partner Agencies' },
        { to: '/partner-course-review', icon: ClipboardList, label: 'Partner Course Review', ariaLabel: 'Partner Course Review' },
        { to: '/use-case-assignment', icon: Target, label: 'Use Cases', ariaLabel: 'Use Cases' },
        { to: '/placement', icon: MapPin, label: 'Placement', ariaLabel: 'Placement' },
      ],
    },
    {
      category: 'Operations',
      icon: Monitor,
      items: [
        { to: '/squads', icon: Target, label: 'Squads', ariaLabel: 'Squads' },
        { to: '/reports', icon: BarChart3, label: 'Reports', ariaLabel: 'Reports' },
        { to: '/audit-log', icon: Shield, label: 'Audit Log', ariaLabel: 'Audit Log' },
        { to: '/student-monitoring', icon: Activity, label: 'Student Monitoring', ariaLabel: 'Student Monitoring' },
        { to: '/live-classes', icon: Video, label: 'Live Classes', ariaLabel: 'Live Classes' },
        { to: '/announcements', icon: MapPin, label: 'Announcements', ariaLabel: 'Announcements' },
        { to: '/quiz-management', icon: ListPlus, label: 'Quiz Authoring', ariaLabel: 'Quiz Authoring' },
      ],
    },
    {
      category: 'Capstone & Review',
      icon: FileText,
      items: [
        { to: '/capstone', icon: FileText, label: 'Capstone', ariaLabel: 'Capstone' },
        { to: '/panel-review', icon: ClipboardList, label: 'Panel Review', ariaLabel: 'Panel Review' },
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
                  const active = location.pathname === item.to
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

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex items-stretch shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
        {groups.flatMap((g) => g.items).slice(0, 5).map((item) => {
          const active = location.pathname === item.to
          const badgeCount = item.to === '/notifications' ? unreadCount : null
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex-none flex flex-col items-center justify-center py-2 px-1 text-[10px] font-medium transition-colors ${
                active ? 'text-deep-600 font-bold' : 'text-gray-500 hover:text-gray-800'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <div className="relative">
                <item.icon size={19} className="shrink-0" />
                {badgeCount && badgeCount > 0 && (
                  <span className="absolute -top-1 -right-2.5 bg-red-600 text-white text-[9px] font-bold px-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full">
                    {badgeCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] truncate max-w-full mt-0.5 leading-tight">{item.shortLabel || item.label}</span>
            </NavLink>
          )
        })}
        {groups.flatMap((g) => g.items).length > 5 && (
          <button
            onClick={onOpen}
            className="flex-none flex flex-col items-center justify-center py-2 px-1 text-center text-gray-500 hover:text-gray-800 transition-colors min-w-0"
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
            <span className="text-[10px] font-medium truncate max-w-full mt-0.5 leading-tight">More</span>
          </button>
        )}
      </nav>

      {/* Mobile "More" Slide-up Drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col animate-sheet-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <span className="text-sm font-bold text-deep-600">Academy Menu</span>
              <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-deep-600 rounded-md">
                <X size={20} />
                <span className="visually-hidden">Close menu</span>
              </button>
            </div>

            <nav className="p-3 space-y-1 overflow-y-auto" aria-label="More options">
              {groups.flatMap((g) => g.items).length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-400">No additional items</p>
              ) : (
                groups.flatMap((g) => g.items).map((item) => {
                  const badgeCount = item.to === '/notifications' ? unreadCount : null
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        location.pathname === item.to ? 'bg-deep-50 text-deep-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={18} />
                        {item.label}
                      </div>
                      {badgeCount && badgeCount > 0 && (
                        <Badge variant="outline" className="text-[10px] font-bold text-red-600 border-red-200">
                          {badgeCount}
                        </Badge>
                      )}
                    </NavLink>
                  )
                })
              )}
            </nav>

            <div className="p-3 border-t border-gray-100 shrink-0 space-y-1">
              <NavLink
                to="/profile-settings"
                onClick={onClose}
                className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <User size={16} className="text-gray-500" />
                <span>Profile & Settings</span>
              </NavLink>
              <button
                onClick={() => { onClose(); logout() }}
                className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
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

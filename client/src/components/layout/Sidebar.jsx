import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
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
  Bell,
  Briefcase,
  ListPlus,
  ChevronDown,
  Shield,
  GraduationCap as SchoolIcon,
  Monitor,
  Cog,
  User,
  Settings,
  Clock,
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
      ],
    },
    {
      category: 'Credentials & Portfolio',
      icon: Shield,
      items: [
        { to: '/profile-settings', icon: FileText, label: 'Profile & Showcase', ariaLabel: 'Profile and Showcase' },
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
        { to: '/project-workspace', icon: Briefcase, label: 'Project Workspace', ariaLabel: 'Project Workspace' },
        { to: '/project-review', icon: ClipboardList, label: 'Project Review', ariaLabel: 'Project Review' },
      ],
    },
    {
      category: 'Account',
      icon: Shield,
      items: [
        { to: '/profile-settings', icon: FileText, label: 'Profile Settings', ariaLabel: 'Profile Settings' },
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
      ],
    },
    {
      category: 'Account',
      icon: Shield,
      items: [
        { to: '/profile-settings', icon: FileText, label: 'Profile Settings', ariaLabel: 'Profile Settings' },
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
        { to: '/student-monitoring', icon: Activity, label: 'Student Monitoring', ariaLabel: 'Student Monitoring' },
        { to: '/live-classes', icon: Video, label: 'Live Classes', ariaLabel: 'Live Classes' },
        { to: '/quiz-management', icon: ListPlus, label: 'Quiz Authoring', ariaLabel: 'Quiz Authoring' },
        { to: '/project-workspace', icon: Briefcase, label: 'Project Workspace', ariaLabel: 'Project Workspace' },
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
    {
      category: 'Account',
      icon: Shield,
      items: [
        { to: '/profile-settings', icon: FileText, label: 'Profile Settings', ariaLabel: 'Profile Settings' },
      ],
    },
  ],
}

export default function Sidebar({ open, onOpen, onClose }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const groups = sidebarGroups[user?.type] || sidebarGroups.Student
  const [openCategories, setOpenCategories] = useState({})
  const [unreadCount, setUnreadCount] = useState(0)
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    const loadUnreadCount = async () => {
      if (!user) return
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false)
        if (error) throw error
        if (!cancelled) setUnreadCount(count || 0)
      } catch {
        // silently fail - notification count is non-critical
      }
    }
    loadUnreadCount()
    return () => { cancelled = true }
  }, [user])

  const isCategoryOpen = (category) => openCategories[category] ?? true
  const toggleCategory = (category) => {
    setOpenCategories((prev) => ({ ...prev, [category]: !prev[category] }))
  }

  const openProfileDrawer = () => {
    setProfileDrawerOpen(true)
    if (onOpen) onOpen()
  }

  const closeProfileDrawer = () => {
    setProfileDrawerOpen(false)
    if (onClose) onClose()
  }

  return (
    <>
      <a href="#main-content" className="absolute -top-48 left-0 bg-brand-600 text-white px-4 py-2 z-50 transform -translate-y-full transition-all duration-200 focus:translate-y-0 focus:outline-none">
        Skip to main content
      </a>

      <aside data-tour="tour-sidebar" className="hidden lg:flex fixed top-0 left-0 z-50 h-screen w-64 bg-[#0B0F19] text-white flex-col border-r border-slate-800/80">
        {/* Profile Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3 cursor-pointer" onClick={openProfileDrawer}>
            <div className="relative">
              <img
                src={user?.avatar || '/logo-white.png'}
                alt={user?.name || 'User'}
                className="h-10 w-10 rounded-full bg-deep-100 border border-deep-200 object-cover shrink-0"
              />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0B0F19]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={openProfileDrawer}
            className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-deep-100 hover:bg-slate-700 transition-colors"
            aria-label="Profile menu"
          >
            <Settings size={16} />
          </button>
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
                        <Badge variant="outline" className="text-[10px] font-bold text-red-600 bg-red-50 border-red-200 shrink-0 ml-1">
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

        <div className="p-3 border-t border-slate-800/80 shrink-0">
          <button
            onClick={openProfileDrawer}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium text-white hover:bg-slate-700 transition-colors"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
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
                        <Badge variant="outline" className="text-[10px] font-bold text-red-600 bg-red-50 border-red-200">
                          {badgeCount}
                        </Badge>
                      )}
                    </NavLink>
                  )
                })
              )}
            </nav>

            <div className="p-3 border-t border-gray-100 shrink-0">
              <button
                onClick={() => { onClose(); logout() }}
                className="flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Slide-up Drawer */}
      {profileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeProfileDrawer} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col animate-sheet-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full bg-deep-100 flex items-center justify-center text-xs font-bold text-deep-600 shrink-0">
                    <User size={14} />
                  </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-deep-600">{user?.name || 'User'}</span>
                  <p className="text-[10px] text-gray-500">{user?.email || ''}</p>
                </div>
              </div>
              <button
                onClick={closeProfileDrawer}
                className="p-1.5 text-gray-400 hover:text-deep-600 rounded-md"
              >
                <X size={20} />
                <span className="visually-hidden">Close profile</span>
              </button>
            </div>

            <nav className="p-4 space-y-3 overflow-y-auto" aria-label="Profile settings">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <User size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-deep-600">Edit Profile</p>
                  <p className="text-[10px] text-gray-500">Update your personal information</p>
                </div>
                <ArrowRight size={14} className="text-gray-400 shrink-0" />
              </div>

              <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-100 bg-white cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                  <Clock size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-deep-600">Student ID</p>
                  <p className="text-[10px] text-gray-500 font-mono">{profile ? (profile.student_id || 'Pending') : 'Loading...'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-100 bg-white cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                  <Mail size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-deep-600">Contact Preferences</p>
                  <p className="text-[10px] text-gray-500">Manage email and SMS notifications</p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-100 bg-white cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                  <Cog size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-deep-600">Account Settings</p>
                  <p className="text-[10px] text-gray-500">Security, privacy, and preferences</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mt-4">
                <button
                  onClick={() => { closeProfileDrawer(); logout() }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

function getMobilePrimaryItems(role) {
  if (role === 'Instructor') {
    return [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
      { to: '/grading', icon: ClipboardList, label: 'Grading' },
      { to: '/live-classes', icon: Video, label: 'Classes' },
      { to: '/squads', icon: Users, label: 'Squads' },
      { to: '/my-modules', icon: BookOpen, label: 'Modules' },
    ]
  }
  if (role === 'Administrator') {
    return [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
      { to: '/applications', icon: ClipboardList, label: 'Admissions' },
      { to: '/cohorts', icon: SchoolIcon, label: 'Cohorts' },
      { to: '/curriculum', icon: BookOpen, label: 'Curriculum' },
      { to: '/reports', icon: BarChart3, label: 'Reports' },
    ]
  }
  if (role === 'Partner') {
    return [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
      { to: '/partner-courses', icon: SchoolIcon, label: 'Studio' },
      { to: '/live-classes', icon: Video, label: 'Classes' },
      { to: '/partner-catalog', icon: BookOpen, label: 'Catalog' },
      { to: '/profile-settings', icon: FileText, label: 'Settings' },
    ]
  }
  // Default: Student
  return [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/my-learning', icon: BookOpen, label: 'Learn' },
    { to: '/lab-workspace', icon: ClipboardList, label: 'Labs' },
    { to: '/live-classes', icon: Video, label: 'Live' },
    { to: '/my-squad', icon: Users, label: 'Squad' },
  ]
}
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  Activity,
  Award,
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
        { to: '/skills-profile', icon: CheckCircle, label: 'Skills Profile', ariaLabel: 'Skills Profile' },
        { to: '/certificates', icon: Award, label: 'Certificates', ariaLabel: 'Certificates' },
        { to: '/capstone', icon: FileText, label: 'Capstone', ariaLabel: 'Capstone' },
      ],
    },
    {
      category: 'Classes',
      icon: Monitor,
      items: [
        { to: '/live-classes', icon: Video, label: 'Live Classes', ariaLabel: 'Live Classes' },
      ],
    },
    {
      category: 'Community',
      icon: Users,
      items: [
        { to: '/my-squad', icon: Users, label: 'My Squad', ariaLabel: 'My Squad' },
        { to: '/progress', icon: Activity, label: 'Progress', ariaLabel: 'Progress' },
        { to: '/peer-reviews', icon: ClipboardList, label: 'Peer Reviews', ariaLabel: 'Peer Reviews' },
        { to: '/project-workspace', icon: Briefcase, label: 'Project Workspace', ariaLabel: 'Project Workspace' },
        { to: '/partner-catalog', icon: SchoolIcon, label: 'Partner Courses', ariaLabel: 'Partner Catalog' },
      ],
    },
    {
      category: 'Account',
      icon: Shield,
      items: [
        { to: '/notifications', icon: Bell, label: 'Notifications', ariaLabel: 'Notifications' },
        { to: '/profile-settings', icon: FileText, label: 'Profile Settings', ariaLabel: 'Profile Settings' },
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
        { to: '/labs-to-review', icon: ClipboardList, label: 'Labs to Review', ariaLabel: 'Labs to Review' },
        { to: '/grading', icon: BarChart3, label: 'Grading', ariaLabel: 'Grading' },
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
        { to: '/notifications', icon: Bell, label: 'Notifications', ariaLabel: 'Notifications' },
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
        { to: '/notifications', icon: Bell, label: 'Notifications', ariaLabel: 'Notifications' },
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
        { to: '/notifications', icon: Bell, label: 'Notifications', ariaLabel: 'Notifications' },
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
        <div className="flex items-center justify-between h-14 px-5 border-b border-slate-800/80 shrink-0">
          <img src="/logo-white.png" alt="BlueSPACE" className="h-7 w-auto" />
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
                    </NavLink>
                  )
                })}
              </nav>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800/80 shrink-0">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex items-stretch shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)] overflow-x-auto scrollbar-hide whitespace-nowrap">
        {groups.flatMap((g) => g.items).map((item) => {
          const active = location.pathname === item.to
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex-none flex flex-col items-center justify-center gap-1 py-2 px-3 text-[10px] font-medium transition-colors ${
                active ? 'text-deep-600' : 'text-gray-400'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <item.icon size={20} aria-hidden="true" />
              <span className="visually-hidden">{item.label}</span>
            </NavLink>
          )
        })}
        <button
          onClick={onOpen}
          className="flex-none flex flex-col items-center justify-center gap-1 py-2 px-3 text-[10px] font-medium text-gray-400"
          aria-label="More options"
        >
          <MoreHorizontal size={20} />
          <span className="visually-hidden">More</span>
        </button>
      </nav>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col animate-sheet-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <span className="text-sm font-bold text-deep-600">More</span>
              <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-deep-600 rounded-md">
                <X size={20} />
                <span className="visually-hidden">Close menu</span>
              </button>
            </div>

            <nav className="p-3 space-y-1 overflow-y-auto" aria-label="More options">
              {groups.flatMap((g) => g.items).length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-400">No additional items</p>
              ) : (
                groups.flatMap((g) => g.items).map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      location.pathname === item.to ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                ))
              )}
            </nav>

            <div className="p-3 border-t border-gray-100 shrink-0">
              <button
                onClick={() => { onClose(); logout() }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

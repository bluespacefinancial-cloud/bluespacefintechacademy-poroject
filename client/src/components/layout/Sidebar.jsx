import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, BookOpen, GraduationCap, Users, Activity, Award, Target, LogOut, X, ClipboardList, BarChart3, MapPin, MoreHorizontal, Eye, CheckCircle, FileText, Video, Bell, Briefcase, ListPlus } from 'lucide.react'
import { useAuth } from '../../context/AuthContext'

const navItems = {
  Student: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', ariaLabel: 'Dashboard' },
    { to: '/my-learning', icon: BookOpen, label: 'My Learning', ariaLabel: 'My Learning' },
    { to: '/my-squad', icon: Users, label: 'My Squad', ariaLabel: 'My Squad' },
    { to: '/progress', icon: Activity, label: 'Progress', ariaLabel: 'Progress' },
    { to: '/capstone', icon: FileText, label: 'Capstone', ariaLabel: 'Capstone' },
    { to: '/skills-profile', icon: CheckCircle, label: 'Skills Profile', ariaLabel: 'Skills Profile' },
    { to: '/certificates', icon: Award, label: 'Certificates', ariaLabel: 'Certificates' },
    { to: '/live-classes', icon: Video, label: 'Live Classes', ariaLabel: 'Live Classes' },
    { to: '/notifications', icon: Bell, label: 'Notifications', ariaLabel: 'Notifications' },
    { to: '/project-workspace', icon: Briefcase, label: 'Project Workspace', ariaLabel: 'Project Workspace' },
    { to: '/peer-reviews', icon: ClipboardList, label: 'Peer Reviews', ariaLabel: 'Peer Reviews' },
    { to: '/partner-catalog', icon: BookOpen, label: 'Partner Courses', ariaLabel: 'Partner Catalog' },
    { to: '/project-review', icon: ClipboardList, label: 'Project Review', ariaLabel: 'Project Review' },
    { to: '/mentor-evaluation', icon: CheckCircle, label: 'Mentor Evaluation', ariaLabel: 'Mentor Evaluation' },
  ],
  Instructor: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', ariaLabel: 'Dashboard' },
    { to: '/my-modules', icon: BookOpen, label: 'My Modules', ariaLabel: 'My Modules' },
    { to: '/squads', icon: Target, label: 'Squads', ariaLabel: 'Squads' },
    { to: '/labs-to-review', icon: ClipboardList, label: 'Labs to Review', ariaLabel: 'Labs to Review' },
    { to: '/mentor-clinics', icon: Activity, label: 'Mentor Clinics', ariaLabel: 'Mentor Clinics' },
    { to: '/live-classes', icon: Video, label: 'Live Classes', ariaLabel: 'Live Classes' },
    { to: '/grading', icon: BarChart3, label: 'Grading', ariaLabel: 'Grading' },
    { to: '/student-monitoring', icon: Activity, label: 'Student Monitoring', ariaLabel: 'Student Monitoring' },
    { to: '/announcements', icon: MapPin, label: 'Announcements', ariaLabel: 'Announcements' },
    { to: '/capstone', icon: FileText, label: 'Capstone', ariaLabel: 'Capstone' },
    { to: '/panel-review', icon: ClipboardList, label: 'Panel Review', ariaLabel: 'Panel Review' },
    { to: '/notifications', icon: Bell, label: 'Notifications', ariaLabel: 'Notifications' },
    { to: '/quiz-management', icon: ListPlus, label: 'Quiz Authoring', ariaLabel: 'Quiz Authoring' },
    { to: '/project-workspace', icon: Briefcase, label: 'Project Workspace', ariaLabel: 'Project Workspace' },
    { to: '/project-review', icon: ClipboardList, label: 'Project Review', ariaLabel: 'Project Review' },
    { to: '/mentor-evaluation', icon: CheckCircle, label: 'Mentor Evaluation', ariaLabel: 'Mentor Evaluation' },
  ],
  Partner: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', ariaLabel: 'Dashboard' },
    { to: '/partner-courses', icon: BookOpen, label: 'Course Studio', ariaLabel: 'Course Studio' },
    { to: '/notifications', icon: Bell, label: 'Notifications', ariaLabel: 'Notifications' },
  ],
  Administrator: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', ariaLabel: 'Dashboard' },
    { to: '/cohorts', icon: GraduationCap, label: 'Cohorts', ariaLabel: 'Cohorts' },
    { to: '/enrolments', icon: Users, label: 'Enrolments', ariaLabel: 'Enrolments' },
    { to: '/applications', icon: ClipboardList, label: 'Applications', ariaLabel: 'Applications' },
    { to: '/curriculum', icon: BookOpen, label: 'Curriculum', ariaLabel: 'Curriculum' },
    { to: '/instructor-assignments', icon: Users, label: 'Instructor Assignments', ariaLabel: 'Instructor Assignments' },
    { to: '/partner-management', icon: Briefcase, label: 'Partner Agencies', ariaLabel: 'Partner Agencies' },
    { to: '/partner-course-review', icon: ClipboardList, label: 'Partner Course Review', ariaLabel: 'Partner Course Review' },
    { to: '/use-case-assignment', icon: Target, label: 'Use Cases', ariaLabel: 'Use Cases' },
    { to: '/placement', icon: MapPin, label: 'Placement', ariaLabel: 'Placement' },
    { to: '/squads', icon: Target, label: 'Squads', ariaLabel: 'Squads' },
    { to: '/capstone', icon: FileText, label: 'Capstone', ariaLabel: 'Capstone' },
    { to: '/panel-review', icon: ClipboardList, label: 'Panel Review', ariaLabel: 'Panel Review' },
    { to: '/reports', icon: BarChart3, label: 'Reports', ariaLabel: 'Reports' },
    { to: '/student-monitoring', icon: Activity, label: 'Student Monitoring', ariaLabel: 'Student Monitoring' },
    { to: '/live-classes', icon: Video, label: 'Live Classes', ariaLabel: 'Live Classes' },
    { to: '/notifications', icon: Bell, label: 'Notifications', ariaLabel: 'Notifications' },
    { to: '/quiz-management', icon: ListPlus, label: 'Quiz Authoring', ariaLabel: 'Quiz Authoring' },
    { to: '/project-workspace', icon: Briefcase, label: 'Project Workspace', ariaLabel: 'Project Workspace' },
  ],
}

export default function Sidebar({ open, onOpen, onClose }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const items = navItems[user?.type] || navItems.Student

  const mobileItems = (() => {
    const mid = Math.floor(items.length / 2)
    return [...items.slice(0, mid), ...items.slice(mid)]
  })()
  const primary = mobileItems.slice(0, 4)
  const overflow = mobileItems.slice(4)

  return (
    <>
      {/* Skip to content link for keyboard navigation */}
      <a href="#main-content" className="absolute -top-48 left-0 bg-brand-600 text-white px-4 py-2 z-50 transform -translate-y-full transition-all duration-200 focus:translate-y-0 focus:outline-none">
        Skip to main content
      </a>

      <aside className="hidden lg:flex fixed top-0 left-0 z-50 h-screen w-60 bg-deep-600 text-white flex-col">
        <div className="flex items-center justify-between h-14 px-4 border-b border-white/10 shrink-0">
          <img src="/logo-white.png" alt="BlueSPACE" className="h-7 w-auto" />
        </div>

        <nav aria-label="Main navigation" className="p-3 space-y-0.5 flex-1 overflow-y-auto">
          {items.map((item) => {
            const active = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <item.icon size={16} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="p-3 border-t border-white/10 shrink-0">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex items-stretch shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
        {primary.map((item) => {
          const active = location.pathname === item.to
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors ${
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
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium text-gray-400"
          aria-label="More options"
        >
          <MoreHorizontal size={20} />
          <span className="visually-hidden">More</span>
        </button>
      </nav>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col animate-sheet-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <span className="text-sm font-bold text-deep-600">More</span>
              <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-deep-600 rounded-md">
                <X size={20} />
                <span className="visually-hidden">Close menu</span>
              </button>
            </div>

            <nav className="p-3 space-y-1 overflow-y-auto" aria-label="More options">
              {overflow.length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-400">No additional items</p>
              ) : (
                overflow.map((item) => (
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

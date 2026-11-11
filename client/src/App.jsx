import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NotFound from './pages/NotFound'
import Unauthorized from './pages/Unauthorized'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import Register from './pages/Register'
import ApplicationReview from './pages/ApplicationReview'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import MarketingHome from './pages/MarketingHome'
import { SkeletonCard } from './components/ui/skeleton-card'

/**
 * Lazy-load a page component with a Suspense fallback. Keeps the initial
 * bundle small by splitting rarely-visited pages (admin, partner, reports)
 * into their own chunks.
 */
const Lazy = (importFn) => {
  const Component = lazy(importFn)
  const LazyWrapper = ({ ...props }) => (
    <Suspense fallback={<SkeletonCard className="min-h-[300px]" />}>
      <Component {...props} />
    </Suspense>
  )
  LazyWrapper.displayName = 'Lazy'
  return LazyWrapper
}

// Lazily loaded pages (split into separate chunks to shrink the initial bundle)
const LazyMyLearning = Lazy(() => import('./pages/MyLearning'))
const LazyLabWorkspace = Lazy(() => import('./pages/LabWorkspace'))
const LazyProgress = Lazy(() => import('./pages/Progress'))
const LazyMySquad = Lazy(() => import('./pages/MySquad'))
const LazyCertificates = Lazy(() => import('./pages/Certificates'))
const LazyCertificateDetail = Lazy(() => import('./pages/CertificateDetail'))
const LazyMyModules = Lazy(() => import('./pages/MyModules'))
const LazyModuleEditor = Lazy(() => import('./pages/ModuleEditor'))
const LazyGrading = Lazy(() => import('./pages/Grading'))
const LazyMentorClinics = Lazy(() => import('./pages/MentorClinics'))
const LazyAnnouncements = Lazy(() => import('./pages/Announcements'))
const LazySquadManagement = Lazy(() => import('./pages/SquadManagement'))
const LazyUseCaseAssignment = Lazy(() => import('./pages/UseCaseAssignment'))
const LazyCohorts = Lazy(() => import('./pages/Cohorts'))
const LazyEnrolments = Lazy(() => import('./pages/Enrolments'))
const LazyCurriculum = Lazy(() => import('./pages/Curriculum'))
const LazyPlacement = Lazy(() => import('./pages/Placement'))
const LazyReports = Lazy(() => import('./pages/Reports'))
const LazyCapstoneSubmission = Lazy(() => import('./pages/CapstoneSubmission'))
const LazyPanelReview = Lazy(() => import('./pages/PanelReview'))
const LazyLessonPlayer = Lazy(() => import('./pages/LessonPlayer'))
const LazyLiveClasses = Lazy(() => import('./pages/LiveClasses'))
const LazyStudentMonitoring = Lazy(() => import('./pages/StudentMonitoring'))
const LazyQuiz = Lazy(() => import('./pages/Quiz'))
const LazyNotifications = Lazy(() => import('./pages/Notifications'))
const LazyCertificateVerify = Lazy(() => import('./pages/CertificateVerify'))
const LazyQuizManagement = Lazy(() => import('./pages/QuizManagement'))
const LazyProjectReview = Lazy(() => import('./pages/ProjectReview'))
const LazyPeerReview = Lazy(() => import('./pages/PeerReview'))
const LazyMentorEvaluation = Lazy(() => import('./pages/MentorEvaluation'))
const LazyInstructorAssignments = Lazy(() => import('./pages/InstructorAssignments'))
const LazyPartnerCourses = Lazy(() => import('./pages/PartnerCourses'))
const LazyPartnerOrganisation = Lazy(() => import('./pages/PartnerOrganisation'))
const LazyPartnerCatalog = Lazy(() => import('./pages/PartnerCatalog'))
const LazyPartnerManagement = Lazy(() => import('./pages/PartnerManagement'))
const LazyPartnerCourseReview = Lazy(() => import('./pages/PartnerCourseReview'))
const LazyPartnerCourseLearning = Lazy(() => import('./pages/PartnerCourseLearning'))
const LazyProfileSettings = Lazy(() => import('./pages/ProfileSettings'))
const LazyUserManagement = Lazy(() => import('./pages/UserManagement'))
const LazyAuditLog = Lazy(() => import('./pages/AuditLog'))

function RootRoute({ user }) {
  const location = useLocation()
  if (user) return <AppLayout />
  if (location.pathname === '/') return <MarketingHome />
  return <Navigate to="/student-login" replace />
}
RootRoute.propTypes = { user: PropTypes.object }

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Navigate to="/student-login" replace />} />
      <Route path="/student-login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/instructor-login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/partner-login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/admin-login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-certificate/:token" element={<LazyCertificateVerify />} />
      <Route path="/certificate/:id" element={<ProtectedRoute><LazyCertificateDetail /></ProtectedRoute>} />
      <Route path="/" element={<RootRoute user={user} />}>
        <Route index element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="my-learning" element={<ProtectedRoute roles={['Student']}><LazyMyLearning /></ProtectedRoute>} />
        <Route path="lab-workspace" element={<ProtectedRoute roles={['Student']}><LazyLabWorkspace /></ProtectedRoute>} />
        <Route path="progress" element={<ProtectedRoute roles={['Student']}><LazyProgress /></ProtectedRoute>} />
        <Route path="my-squad" element={<ProtectedRoute roles={['Student']}><LazyMySquad /></ProtectedRoute>} />
        <Route path="certificates" element={<ProtectedRoute roles={['Student']}><LazyCertificates /></ProtectedRoute>} />
        <Route path="notifications" element={<ProtectedRoute><LazyNotifications /></ProtectedRoute>} />
        <Route path="quiz/:assessmentId" element={<ProtectedRoute roles={['Student']}><LazyQuiz /></ProtectedRoute>} />
        <Route path="project-workspace" element={<Navigate to="/my-squad" replace />} />
        <Route path="partner-courses" element={<ProtectedRoute roles={['Partner']}><LazyPartnerCourses /></ProtectedRoute>} />
        <Route path="partner-organisation" element={<ProtectedRoute roles={['Partner']}><LazyPartnerOrganisation /></ProtectedRoute>} />
        <Route path="partner-catalog" element={<ProtectedRoute roles={['Student']}><LazyPartnerCatalog /></ProtectedRoute>} />
        <Route path="partner-course/:courseId" element={<ProtectedRoute roles={['Student']}><LazyPartnerCourseLearning /></ProtectedRoute>} />
        <Route path="partner-management" element={<ProtectedRoute roles={['Administrator']}><LazyPartnerManagement /></ProtectedRoute>} />
        <Route path="partner-course-review" element={<ProtectedRoute roles={['Administrator']}><LazyPartnerCourseReview /></ProtectedRoute>} />
        <Route path="peer-reviews" element={<ProtectedRoute roles={['Student']}><LazyPeerReview /></ProtectedRoute>} />
        <Route path="project-review" element={<ProtectedRoute roles={['Instructor', 'Administrator']}><LazyProjectReview /></ProtectedRoute>} />
        <Route path="mentor-evaluation" element={<ProtectedRoute roles={['Instructor', 'Administrator']}><LazyMentorEvaluation /></ProtectedRoute>} />
        <Route path="quiz-management" element={<ProtectedRoute roles={['Instructor', 'Administrator']}><LazyQuizManagement /></ProtectedRoute>} />
        <Route path="my-modules" element={<ProtectedRoute roles={['Instructor', 'Administrator']}><LazyMyModules /></ProtectedRoute>} />
        <Route path="modules/create" element={<ProtectedRoute roles={['Instructor', 'Administrator']}><LazyModuleEditor /></ProtectedRoute>} />
        <Route path="modules/:moduleId" element={<ProtectedRoute roles={['Instructor', 'Administrator']}><LazyModuleEditor /></ProtectedRoute>} />
        <Route path="labs-to-review" element={<ProtectedRoute roles={['Instructor', 'Administrator']}><LazyGrading /></ProtectedRoute>} />
        <Route path="grading" element={<ProtectedRoute roles={['Instructor', 'Administrator']}><LazyGrading /></ProtectedRoute>} />
        <Route path="mentor-clinics" element={<ProtectedRoute roles={['Student', 'Instructor', 'Administrator']}><LazyMentorClinics /></ProtectedRoute>} />
        <Route path="announcements" element={<ProtectedRoute roles={['Student', 'Instructor', 'Administrator']}><LazyAnnouncements /></ProtectedRoute>} />
        <Route path="squads" element={<ProtectedRoute roles={['Instructor', 'Administrator']}><LazySquadManagement /></ProtectedRoute>} />
        <Route path="use-case-assignment" element={<ProtectedRoute roles={['Administrator']}><LazyUseCaseAssignment /></ProtectedRoute>} />
        <Route path="capstone" element={<ProtectedRoute roles={['Student', 'Instructor', 'Administrator']}><LazyCapstoneSubmission /></ProtectedRoute>} />
        <Route path="lesson/:lessonId" element={<ProtectedRoute roles={['Student', 'Instructor', 'Administrator']}><LazyLessonPlayer /></ProtectedRoute>} />
        <Route path="live-classes" element={<ProtectedRoute><LazyLiveClasses /></ProtectedRoute>} />
        <Route path="student-monitoring" element={<ProtectedRoute roles={['Instructor', 'Administrator']}><LazyStudentMonitoring /></ProtectedRoute>} />
        <Route path="panel-review" element={<ProtectedRoute roles={['Instructor', 'Administrator']}><LazyPanelReview /></ProtectedRoute>} />
        <Route path="skills-profile" element={<ProtectedRoute roles={['Student']}><Navigate to="/profile-settings?tab=skills" replace /></ProtectedRoute>} />
        <Route path="cohorts" element={<ProtectedRoute roles={['Administrator']}><LazyCohorts /></ProtectedRoute>} />
        <Route path="instructor-assignments" element={<ProtectedRoute roles={['Administrator']}><LazyInstructorAssignments /></ProtectedRoute>} />
        <Route path="enrolments" element={<ProtectedRoute roles={['Administrator']}><LazyEnrolments /></ProtectedRoute>} />
        <Route path="applications" element={<ProtectedRoute roles={['Administrator']}><ApplicationReview /></ProtectedRoute>} />
        <Route path="curriculum" element={<ProtectedRoute roles={['Administrator']}><LazyCurriculum /></ProtectedRoute>} />
        <Route path="placement" element={<ProtectedRoute roles={['Administrator']}><LazyPlacement /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute roles={['Administrator']}><LazyReports /></ProtectedRoute>} />
        <Route path="user-management" element={<ProtectedRoute roles={['Administrator']}><LazyUserManagement /></ProtectedRoute>} />
        <Route path="audit-log" element={<ProtectedRoute roles={['Administrator']}><LazyAuditLog /></ProtectedRoute>} />
        <Route path="profile-settings" element={<ProtectedRoute><LazyProfileSettings /></ProtectedRoute>} />
        <Route path="unauthorized" element={<Unauthorized />} />
      </Route>
      <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  )
}

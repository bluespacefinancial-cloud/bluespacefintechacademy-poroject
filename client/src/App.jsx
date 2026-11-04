import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Unauthorized from './pages/Unauthorized'
import MyLearning from './pages/MyLearning'
import LabWorkspace from './pages/LabWorkspace'
import Progress from './pages/Progress'
import MySquad from './pages/MySquad'
import Certificates from './pages/Certificates'
import MyModules from './pages/MyModules'
import LabsToReview from './pages/LabsToReview'
import Grading from './pages/Grading'
import MentorClinics from './pages/MentorClinics'
import Announcements from './pages/Announcements'
import SquadManagement from './pages/SquadManagement'
import UseCaseAssignment from './pages/UseCaseAssignment'
import Cohorts from './pages/Cohorts'
import Enrolments from './pages/Enrolments'
import Curriculum from './pages/Curriculum'
import Placement from './pages/Placement'
import Reports from './pages/Reports'
import CapstoneSubmission from './pages/CapstoneSubmission'
import PanelReview from './pages/PanelReview'
import SkillsProfile from './pages/SkillsProfile'
import LessonPlayer from './pages/LessonPlayer'
import LiveClasses from './pages/LiveClasses'
import StudentMonitoring from './pages/StudentMonitoring'
import Quiz from './pages/Quiz'
import Notifications from './pages/Notifications'
import CertificateVerify from './pages/CertificateVerify'
import ProjectWorkspace from './pages/ProjectWorkspace'
import QuizManagement from './pages/QuizManagement'
import ProjectReview from './pages/ProjectReview'
import PeerReview from './pages/PeerReview'
import MentorEvaluation from './pages/MentorEvaluation'
import InstructorAssignments from './pages/InstructorAssignments'
import PartnerCourses from './pages/PartnerCourses'
import PartnerCatalog from './pages/PartnerCatalog'
import PartnerManagement from './pages/PartnerManagement'
import PartnerCourseReview from './pages/PartnerCourseReview'
import PartnerCourseLearning from './pages/PartnerCourseLearning'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import Register from './pages/Register'
import ApplicationReview from './pages/ApplicationReview'

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
    <Routes>
      <Route path="/login" element={<Navigate to="/student-login" replace />} />
      <Route path="/student-login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/instructor-login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/partner-login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/admin-login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/verify-certificate/:token" element={<CertificateVerify />} />
      <Route path="/" element={user ? <AppLayout /> : <Navigate to="/student-login" replace />}>
        <Route index element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="my-learning" element={<ProtectedRoute><MyLearning /></ProtectedRoute>} />
        <Route path="lab-workspace" element={<ProtectedRoute><LabWorkspace /></ProtectedRoute>} />
        <Route path="progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
        <Route path="my-squad" element={<ProtectedRoute><MySquad /></ProtectedRoute>} />
        <Route path="certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
        <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="quiz/:assessmentId" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
        <Route path="project-workspace" element={<ProtectedRoute><ProjectWorkspace /></ProtectedRoute>} />
        <Route path="partner-courses" element={<ProtectedRoute roles={['Partner']}><PartnerCourses /></ProtectedRoute>} />
        <Route path="partner-catalog" element={<ProtectedRoute roles={['Student']}><PartnerCatalog /></ProtectedRoute>} />
        <Route path="partner-course/:courseId" element={<ProtectedRoute roles={['Student']}><PartnerCourseLearning /></ProtectedRoute>} />
        <Route path="partner-management" element={<ProtectedRoute roles={['Administrator']}><PartnerManagement /></ProtectedRoute>} />
        <Route path="partner-course-review" element={<ProtectedRoute roles={['Administrator']}><PartnerCourseReview /></ProtectedRoute>} />
        <Route path="peer-reviews" element={<ProtectedRoute><PeerReview /></ProtectedRoute>} />
        <Route path="project-review" element={<ProtectedRoute roles={['Instructor', 'Administrator']}><ProjectReview /></ProtectedRoute>} />
        <Route path="mentor-evaluation" element={<ProtectedRoute roles={['Instructor', 'Administrator']}><MentorEvaluation /></ProtectedRoute>} />
        <Route path="quiz-management" element={<ProtectedRoute roles={['Instructor', 'Administrator']}><QuizManagement /></ProtectedRoute>} />
        <Route path="my-modules" element={<ProtectedRoute roles={['Instructor', 'Administrator']}><MyModules /></ProtectedRoute>} />
        <Route path="labs-to-review" element={<ProtectedRoute roles={['Instructor', 'Administrator']}><LabsToReview /></ProtectedRoute>} />
        <Route path="grading" element={<ProtectedRoute roles={['Instructor', 'Administrator']}><Grading /></ProtectedRoute>} />
        <Route path="mentor-clinics" element={<ProtectedRoute roles={['Instructor', 'Administrator']}><MentorClinics /></ProtectedRoute>} />
        <Route path="announcements" element={<ProtectedRoute roles={['Instructor', 'Administrator']}><Announcements /></ProtectedRoute>} />
        <Route path="squads" element={<ProtectedRoute><SquadManagement /></ProtectedRoute>} />
        <Route path="use-case-assignment" element={<ProtectedRoute roles={['Administrator']}><UseCaseAssignment /></ProtectedRoute>} />
        <Route path="capstone" element={<ProtectedRoute><CapstoneSubmission /></ProtectedRoute>} />
        <Route path="lesson/:lessonId" element={<ProtectedRoute><LessonPlayer /></ProtectedRoute>} />
        <Route path="live-classes" element={<ProtectedRoute><LiveClasses /></ProtectedRoute>} />
        <Route path="student-monitoring" element={<ProtectedRoute roles={['Instructor', 'Administrator']}><StudentMonitoring /></ProtectedRoute>} />
        <Route path="panel-review" element={<ProtectedRoute roles={['Instructor', 'Administrator']}><PanelReview /></ProtectedRoute>} />
        <Route path="skills-profile" element={<ProtectedRoute><SkillsProfile /></ProtectedRoute>} />
        <Route path="cohorts" element={<ProtectedRoute roles={['Administrator']}><Cohorts /></ProtectedRoute>} />
        <Route path="instructor-assignments" element={<ProtectedRoute roles={['Administrator']}><InstructorAssignments /></ProtectedRoute>} />
        <Route path="enrolments" element={<ProtectedRoute roles={['Administrator']}><Enrolments /></ProtectedRoute>} />
        <Route path="applications" element={<ProtectedRoute roles={['Administrator']}><ApplicationReview /></ProtectedRoute>} />
        <Route path="curriculum" element={<ProtectedRoute roles={['Administrator']}><Curriculum /></ProtectedRoute>} />
        <Route path="placement" element={<ProtectedRoute roles={['Administrator']}><Placement /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute roles={['Administrator']}><Reports /></ProtectedRoute>} />
        <Route path="unauthorized" element={<Unauthorized />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

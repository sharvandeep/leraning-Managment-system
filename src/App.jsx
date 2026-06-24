import { Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "./layouts/AuthLayout.jsx";
import StudentLayout from "./layouts/StudentLayout.jsx";
import TeacherLayout from "./layouts/TeacherLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import RoleRedirect from "./routes/RoleRedirect.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import StudentDashboard from "./pages/student/Dashboard.jsx";
import MyCourses from "./pages/student/MyCourses.jsx";
import CourseDetails from "./pages/student/CourseDetails.jsx";
import StudentAssignments from "./pages/student/Assignments.jsx";
import StudentQuizzes from "./pages/student/Quizzes.jsx";
import Grades from "./pages/student/Grades.jsx";
import StudentNotifications from "./pages/student/Notifications.jsx";
import StudentProfile from "./pages/student/Profile.jsx";
import TeacherDashboard from "./pages/teacher/Dashboard.jsx";
import AssignedCourses from "./pages/teacher/AssignedCourses.jsx";
import CourseContent from "./pages/teacher/CourseContent.jsx";
import MaterialUpload from "./pages/teacher/MaterialUpload.jsx";
import AssignmentManagement from "./pages/teacher/AssignmentManagement.jsx";
import QuizManagement from "./pages/teacher/QuizManagement.jsx";
import StudentPerformance from "./pages/teacher/StudentPerformance.jsx";
import TeacherProfile from "./pages/teacher/Profile.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import UserManagement from "./pages/admin/UserManagement.jsx";
import CourseManagement from "./pages/admin/CourseManagement.jsx";
import BranchManagement from "./pages/admin/BranchManagement.jsx";
import SemesterManagement from "./pages/admin/SemesterManagement.jsx";
import Settings from "./pages/admin/Settings.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleRedirect />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="courses" element={<MyCourses />} />
          <Route path="courses/:courseId" element={<CourseDetails />} />
          <Route path="assignments" element={<StudentAssignments />} />
          <Route path="quizzes" element={<StudentQuizzes />} />
          <Route path="grades" element={<Grades />} />
          <Route path="notifications" element={<StudentNotifications />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="courses" element={<AssignedCourses />} />
          <Route path="content" element={<CourseContent />} />
          <Route path="materials" element={<MaterialUpload />} />
          <Route path="assignments" element={<AssignmentManagement />} />
          <Route path="quizzes" element={<QuizManagement />} />
          <Route path="performance" element={<StudentPerformance />} />
          <Route path="profile" element={<TeacherProfile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="courses" element={<CourseManagement />} />
          <Route path="branches" element={<BranchManagement />} />
          <Route path="semesters" element={<SemesterManagement />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

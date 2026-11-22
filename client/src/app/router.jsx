import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Skeleton } from '@/components/ui';

/**
 * Application router with lazy-loaded routes.
 * Phase 1: Only the login route is active.
 * Future phases will add public, admin, and student routes.
 */

// Lazy-loaded pages (code splitting)
const LandingPage = lazy(() => import('@/features/landing/pages/LandingPage'));
const RegisterPage = lazy(() => import('@/features/registration/pages/RegisterPage'));
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));

// Admin routes (lazy loaded)
const AdminRoute = lazy(() => import('@/features/admin/components/AdminRoute'));
const AdminLayout = lazy(() => import('@/features/admin/components/AdminLayout'));
const AdminOverviewPage = lazy(() => import('@/features/admin/pages/AdminOverviewPage'));
const AdminApplicantsPage = lazy(() => import('@/features/admin/pages/AdminApplicantsPage'));
const AdminLessonsPage = lazy(() => import('@/features/admin/pages/AdminLessonsPage'));
const AdminTasksPage = lazy(() => import('@/features/admin/pages/AdminTasksPage'));
const AdminExamsPage = lazy(() => import('@/features/admin/pages/AdminExamsPage'));
const AdminStudentsPage = lazy(() => import('@/features/admin/pages/AdminStudentsPage'));
const AdminCoursesPage = lazy(() => import('@/features/admin/pages/AdminCoursesPage'));

// Student routes (lazy loaded)
const StudentRoute = lazy(() => import('@/features/student/components/StudentRoute'));
const StudentLayout = lazy(() => import('@/features/student/components/StudentLayout'));
const StudentDashboardPage = lazy(() => import('@/features/student/pages/StudentDashboardPage'));
const StudentLessonPlayerPage = lazy(() => import('@/features/student/pages/StudentLessonPlayerPage'));
const StudentTasksPage = lazy(() => import('@/features/student/pages/StudentTasksPage'));
const StudentLeaderboardPage = lazy(() => import('@/features/student/pages/StudentLeaderboardPage'));
const StudentExamsPage = lazy(() => import('@/features/student/pages/StudentExamsPage'));
const StudentExamRoomPage = lazy(() => import('@/features/student/pages/StudentExamRoomPage'));

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
    <Skeleton variant="card" width="420px" height="380px" />
  </div>
);

export default function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Landing & Dedicated Registration */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/:slug" element={<RegisterPage />} />
        <Route path="/apply" element={<RegisterPage />} />
        <Route path="/courses/:slug" element={<LandingPage />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* Phase 3: Admin Protected Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminOverviewPage />} />
          <Route path="courses" element={<AdminCoursesPage />} />
          <Route path="applicants" element={<AdminApplicantsPage />} />
          <Route path="lessons" element={<AdminLessonsPage />} />
          <Route path="tasks" element={<AdminTasksPage />} />
          <Route path="exams" element={<AdminExamsPage />} />
          <Route path="students" element={<AdminStudentsPage />} />
        </Route>

        {/* Standalone Student Exam Room (Immersive Fullscreen Lockdown) */}
        <Route
          path="/student/exams/:assessmentId/room"
          element={
            <StudentRoute>
              <StudentExamRoomPage />
            </StudentRoute>
          }
        />

        {/* Phase 4, 5 & 6: Student Protected Portal */}
        <Route
          path="/student"
          element={
            <StudentRoute>
              <StudentLayout />
            </StudentRoute>
          }
        >
          <Route index element={<StudentDashboardPage />} />
          <Route path="lessons" element={<StudentDashboardPage />} />
          <Route path="lessons/:lessonId" element={<StudentLessonPlayerPage />} />
          <Route path="tasks" element={<StudentTasksPage />} />
          <Route path="exams" element={<StudentExamsPage />} />
          <Route path="leaderboard" element={<StudentLeaderboardPage />} />
        </Route>

        {/* Fallback — redirect to Landing */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Suspense>
  );
}

import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '../features/auth/useAuthStore';
import { AppLayout } from '../shared/layouts/AppLayout';
import type { UserRole } from '../shared/types/lms';

const AdminPanelPage = lazy(() =>
  import('../features/admin/AdminPanelPage').then((m) => ({ default: m.AdminPanelPage }))
);
const AuthPage = lazy(() =>
  import('../features/auth/AuthPage').then((m) => ({ default: m.AuthPage }))
);
const CertificatePage = lazy(() =>
  import('../features/certificate/CertificatePage').then((m) => ({
    default: m.CertificatePage,
  }))
);
const VerifyCertificatePage = lazy(() =>
  import('../features/certificate/VerifyCertificatePage').then((m) => ({
    default: m.VerifyCertificatePage,
  }))
);
const CommunityPage = lazy(() =>
  import('../features/community/CommunityPage').then((m) => ({
    default: m.CommunityPage,
  }))
);
const CatalogPage = lazy(() =>
  import('../features/courses/CatalogPage').then((m) => ({ default: m.CatalogPage }))
);
const KraepelinPage = lazy(() =>
  import('../features/kraepelin/KraepelinPage').then((m) => ({ default: m.KraepelinPage }))
);
const CoursePlayerPage = lazy(() =>
  import('../features/player/CoursePlayerPage').then((m) => ({
    default: m.CoursePlayerPage,
  }))
);
const ProfilePage = lazy(() =>
  import('../features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const QuizResultPage = lazy(() =>
  import('../features/quiz-runner/QuizResultPage').then((m) => ({
    default: m.QuizResultPage,
  }))
);
const QuizRunnerPage = lazy(() =>
  import('../features/quiz-runner/QuizRunnerPage').then((m) => ({
    default: m.QuizRunnerPage,
  }))
);
const TeacherStudioPage = lazy(() =>
  import('../features/teacher/TeacherStudioPage').then((m) => ({
    default: m.TeacherStudioPage,
  }))
);
const TryoutPage = lazy(() =>
  import('../features/tryout/TryoutPage').then((m) => ({
    default: m.TryoutPage,
  }))
);

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-sm font-medium text-[#71717A] dark:text-slate-400">
        Memuat halaman...
      </div>
    </div>
  );
}

function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { user, initialized } = useAuthStore();
  if (!initialized) return <PageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!roles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  }
  return <>{children}</>;
}

function RedirectAdminToDashboard({ children }: { children: ReactNode }) {
  const { user, initialized } = useAuthStore();
  if (!initialized) return <PageLoader />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Distraction-free Exam Mode (no main AppLayout navbar) */}
        <Route
          path="/quiz/:quizId"
          element={
            <RequireRole roles={['student', 'teacher']}>
              <QuizRunnerPage />
            </RequireRole>
          }
        />

        {/* Standard AppLayout routes */}
        <Route
          path="*"
          element={
            <AppLayout>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route
                    path="/"
                    element={
                      <RedirectAdminToDashboard>
                        <CatalogPage />
                      </RedirectAdminToDashboard>
                    }
                  />
                  <Route
                    path="/kraepelin"
                    element={
                      <RedirectAdminToDashboard>
                        <KraepelinPage />
                      </RedirectAdminToDashboard>
                    }
                  />
                  <Route
                    path="/tryout"
                    element={
                      <RedirectAdminToDashboard>
                        <TryoutPage />
                      </RedirectAdminToDashboard>
                    }
                  />
                  <Route
                    path="/auth"
                    element={
                      <RedirectAdminToDashboard>
                        <AuthPage />
                      </RedirectAdminToDashboard>
                    }
                  />
                  <Route
                    path="/community"
                    element={
                      <RedirectAdminToDashboard>
                        <CommunityPage />
                      </RedirectAdminToDashboard>
                    }
                  />
                  <Route path="/verify" element={<VerifyCertificatePage />} />
                  <Route path="/verify/:certCode" element={<VerifyCertificatePage />} />
                  <Route
                    path="/courses/:slug"
                    element={
                      <RequireRole roles={['student', 'teacher']}>
                        <CoursePlayerPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/quiz/:quizId/result/:attemptId"
                    element={
                      <RequireRole roles={['student', 'teacher']}>
                        <QuizResultPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/certificate/:courseId"
                    element={
                      <RequireRole roles={['student', 'teacher']}>
                        <CertificatePage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <RequireRole roles={['student', 'teacher']}>
                        <ProfilePage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/teacher"
                    element={
                      <RequireRole roles={['teacher']}>
                        <TeacherStudioPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <RequireRole roles={['admin']}>
                        <AdminPanelPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="*"
                    element={
                      <RedirectAdminToDashboard>
                        <Navigate to="/" replace />
                      </RedirectAdminToDashboard>
                    }
                  />
                </Routes>
              </Suspense>
            </AppLayout>
          }
        />
      </Routes>
    </Suspense>
  );
}

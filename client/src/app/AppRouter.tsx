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
const TypingTestPage = lazy(() => import('../features/typing/TypingTestPage'));
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
const TalentPassportPage = lazy(() =>
  import('../features/talent/TalentPassportPage').then((m) => ({
    default: m.TalentPassportPage,
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
    const home =
      user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/';
    return <Navigate to={home} replace />;
  }
  return <>{children}</>;
}

function RedirectNonStudentHome({ children }: { children: ReactNode }) {
  const { user, initialized } = useAuthStore();
  if (!initialized) return <PageLoader />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'teacher') return <Navigate to="/teacher" replace />;
  return <>{children}</>;
}

function RedirectAuthenticatedFromAuth({ children }: { children: ReactNode }) {
  const { user, initialized } = useAuthStore();
  if (!initialized) return <PageLoader />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'teacher') return <Navigate to="/teacher" replace />;
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
            <RequireRole roles={['student']}>
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
                      <RedirectNonStudentHome>
                        <CatalogPage />
                      </RedirectNonStudentHome>
                    }
                  />
                  <Route
                    path="/kraepelin"
                    element={
                      <RedirectNonStudentHome>
                        <KraepelinPage />
                      </RedirectNonStudentHome>
                    }
                  />
                  <Route
                    path="/typing"
                    element={
                      <RedirectNonStudentHome>
                        <TypingTestPage />
                      </RedirectNonStudentHome>
                    }
                  />
                  <Route
                    path="/tryout"
                    element={
                      <RedirectNonStudentHome>
                        <TryoutPage />
                      </RedirectNonStudentHome>
                    }
                  />
                  <Route
                    path="/auth"
                    element={
                      <RedirectAuthenticatedFromAuth>
                        <AuthPage />
                      </RedirectAuthenticatedFromAuth>
                    }
                  />
                  <Route
                    path="/community"
                    element={
                      <RequireRole roles={['student', 'teacher']}>
                        <CommunityPage />
                      </RequireRole>
                    }
                  />
                  <Route path="/verify" element={<VerifyCertificatePage />} />
                  <Route path="/verify/:certCode" element={<VerifyCertificatePage />} />
                  <Route path="/talent/:userId" element={<TalentPassportPage />} />
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
                      <RequireRole roles={['student']}>
                        <QuizResultPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/certificate/:courseId"
                    element={
                      <RequireRole roles={['student']}>
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
                      <RedirectNonStudentHome>
                        <Navigate to="/" replace />
                      </RedirectNonStudentHome>
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

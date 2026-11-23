import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { lmsApi } from '../../shared/services/lmsApi';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { ProgressBar } from '../../shared/ui/ProgressBar';
import { useAuthStore } from '../auth/useAuthStore';
import { GamificationAnalyticsSection } from './GamificationAnalyticsSection';

export function ProfilePage() {
  const { user, setProfile } = useAuthStore();
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [savedMsg, setSavedMsg] = useState('');

  const { data: courses = [] } = useQuery({
    queryKey: ['courses', 'published'],
    queryFn: () => lmsApi.listPublishedCourses(),
  });

  const { data: enrolledIds = [] } = useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: () => (user ? lmsApi.getUserEnrollments(user.id) : Promise.resolve([])),
    enabled: Boolean(user && user.role === 'student'),
  });

  const { data: completedLessonIds = [] } = useQuery({
    queryKey: ['lesson-progress', user?.id],
    queryFn: () => (user ? lmsApi.getCompletedLessonIds(user.id) : Promise.resolve([])),
    enabled: Boolean(user && user.role === 'student'),
  });

  const { data: attempts = [] } = useQuery({
    queryKey: ['quiz-attempts', user?.id],
    queryFn: () => (user ? lmsApi.listUserAttempts(user.id) : Promise.resolve([])),
    enabled: Boolean(user && user.role === 'student'),
  });

  const { data: studentProgress = [] } = useQuery({
    queryKey: ['teacher-student-progress', user?.id],
    queryFn: () =>
      user ? lmsApi.listTeacherStudentProgress(user.id) : Promise.resolve([]),
    enabled: Boolean(user && (user.role === 'teacher' || user.role === 'admin')),
  });

  const updateProfileMut = useMutation({
    mutationFn: () => lmsApi.updateProfile(user!.id, { full_name: fullName, bio }),
    onSuccess: (updated) => {
      setProfile(updated);
      setSavedMsg('Profil berhasil diperbarui.');
      setTimeout(() => setSavedMsg(''), 3000);
    },
  });

  if (!user) return null;

  const enrolledCourses = courses.filter(
    (c) => enrolledIds.includes(c.id) && c.category !== 'Latihan Langsung'
  );

  const avgScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.score ?? 0), 0) / attempts.length)
      : 0;

  const quizTitleMap: Record<string, string> = {};
  for (const c of courses) {
    for (const m of c.modules ?? []) {
      for (const l of m.lessons) {
        if (l.quiz) quizTitleMap[l.quiz.id] = l.quiz.title;
      }
    }
  }

  const findQuizTitle = (quizId: string) => quizTitleMap[quizId] ?? 'Latihan Psikotes';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#18181B] dark:text-white">Profil &amp; Progres</h1>
          <p className="text-sm text-[#52525B] dark:text-slate-300 mt-0.5">
            Kelola informasi akun dan pantau perkembangan belajar secara menyeluruh.
          </p>
        </div>
        {savedMsg && (
          <Badge tone="emerald" className="py-1.5 px-3 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {savedMsg}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Edit Profile Card */}
        <section className="lg:col-span-4 bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3.5 pb-4 border-b border-[#E5E3DC] dark:border-slate-800">
            <div className="w-12 h-12 rounded-full bg-teal-50 text-[#0F766E] flex items-center justify-center font-bold text-lg">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[#18181B] dark:text-white truncate">{user.full_name}</p>
              <p className="text-xs text-[#71717A] dark:text-slate-400 truncate">{user.email}</p>
              <div className="mt-1">
                <Badge
                  tone={
                    user.role === 'admin'
                      ? 'amber'
                      : user.role === 'teacher'
                      ? 'blue'
                      : 'emerald'
                  }
                >
                  {user.role === 'student'
                    ? 'Pelajar'
                    : user.role === 'teacher'
                    ? 'Pengajar'
                    : 'Admin'}
                </Badge>
              </div>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateProfileMut.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-[#18181B] dark:text-white mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#18181B] dark:text-white mb-1">Email</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-800 text-sm bg-slate-50 dark:bg-slate-800 text-[#71717A] dark:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#18181B] dark:text-white mb-1">
                Tentang Saya
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tuliskan target belajar atau latar belakang Anda..."
                className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>

            <Button type="submit" className="w-full" disabled={updateProfileMut.isPending}>
              <User className="w-4 h-4" />
              {updateProfileMut.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </form>
        </section>

        {/* Right: Role-Specific Progress Dashboard */}
        <section className="lg:col-span-8 space-y-6">
          {/* STUDENT PROGRESS VIEW (Ala Coursera / Dicoding) */}
          {user.role === 'student' && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-xl p-4">
                  <span className="text-xs text-[#71717A] dark:text-slate-400 block">Kursus Diikuti</span>
                  <span className="text-2xl font-extrabold font-mono-tabular text-[#18181B] dark:text-white mt-1 block">
                    {enrolledCourses.length}
                  </span>
                </div>
                <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-xl p-4">
                  <span className="text-xs text-[#71717A] dark:text-slate-400 block">Materi Selesai</span>
                  <span className="text-2xl font-extrabold font-mono-tabular text-[#059669] mt-1 block">
                    {completedLessonIds.length}
                  </span>
                </div>
                <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-xl p-4">
                  <span className="text-xs text-[#71717A] dark:text-slate-400 block">Tes Dikerjakan</span>
                  <span className="text-2xl font-extrabold font-mono-tabular text-[#0F766E] mt-1 block">
                    {attempts.length}
                  </span>
                </div>
                <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-xl p-4">
                  <span className="text-xs text-[#71717A] dark:text-slate-400 block">Rata-rata Skor</span>
                  <span className="text-2xl font-extrabold font-mono-tabular text-[#18181B] dark:text-white mt-1 block">
                    {avgScore}%
                  </span>
                </div>
              </div>

              <GamificationAnalyticsSection
                attempts={attempts}
                completedLessonsCount={completedLessonIds.length}
                enrolledCount={enrolledCourses.length}
                quizTitleMap={quizTitleMap}
              />

              {/* Enrolled Courses Progress */}
              <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#0F766E]" />
                  Progres Kursus Terstruktur
                </h2>
                {enrolledCourses.length === 0 ? (
                  <div className="text-sm text-[#71717A] dark:text-slate-400 py-4">
                    Anda belum mendaftar di kursus terstruktur mana pun.{' '}
                    <Link to="/" className="text-[#0F766E] font-semibold hover:underline">
                      Jelajahi Katalog
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enrolledCourses.map((course) => {
                      const lessons = (course.modules ?? []).flatMap((m) => m.lessons);
                      const done = lessons.filter((l) =>
                        completedLessonIds.includes(l.id)
                      ).length;
                      const pct =
                        lessons.length > 0 ? Math.round((done / lessons.length) * 100) : 0;

                      return (
                        <div
                          key={course.id}
                          className="p-4 rounded-xl border border-[#E5E3DC] dark:border-slate-800 bg-[#F6F5F1] dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm text-[#18181B] dark:text-white">{course.title}</p>
                              {pct === 100 && (
                                <Badge tone="emerald">
                                  <Award className="w-3 h-3" />
                                  Lulus
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-[#71717A] dark:text-slate-400">
                              <span>
                                {done} dari {lessons.length} materi selesai
                              </span>
                              <span className="font-mono-tabular font-semibold text-[#18181B] dark:text-white">
                                {pct}%
                              </span>
                            </div>
                            <ProgressBar value={pct} tone="emerald" />
                          </div>
                          <div className="flex items-center gap-2">
                            {pct === 100 && (
                              <Link to={`/certificate/${course.id}`}>
                                <Button size="sm">
                                  <Award className="w-3.5 h-3.5" />
                                  Sertifikat
                                </Button>
                              </Link>
                            )}
                            <Link to={`/courses/${course.slug}`}>
                              <Button variant="secondary" size="sm">
                                {pct === 100 ? 'Tinjau Materi' : 'Lanjutkan Belajar'}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quiz / Practice History */}
              <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-[#0F766E]" />
                  Riwayat Latihan Soal &amp; Evaluasi
                </h2>
                {attempts.length === 0 ? (
                  <p className="text-sm text-[#71717A] dark:text-slate-400 py-2">
                    Belum ada latihan soal yang dikerjakan.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {attempts.map((att) => (
                      <div
                        key={att.id}
                        className="p-4 rounded-xl border border-[#E5E3DC] dark:border-slate-800 bg-[#F6F5F1] dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-semibold text-sm text-[#18181B] dark:text-white">
                            {findQuizTitle(att.quiz_id)}
                          </p>
                          <p className="text-xs text-[#71717A] dark:text-slate-400 mt-0.5">
                            Selesai pada{' '}
                            {att.submitted_at
                              ? new Date(att.submitted_at).toLocaleString('id-ID')
                              : '-'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge tone={(att.score ?? 0) >= 70 ? 'emerald' : 'amber'}>
                            Skor: {att.score ?? 0}%
                          </Badge>
                          <Link to={`/quiz/${att.quiz_id}/result/${att.id}`}>
                            <Button variant="secondary" size="sm">
                              <FileCheck2 className="w-3.5 h-3.5" />
                              Ringkasan Jawaban
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TEACHER STUDENT PROGRESS VIEW */}
          {user.role === 'teacher' && (
            <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-[#E5E3DC] dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#0F766E]" />
                    Progres Belajar Siswa
                  </h2>
                  <p className="text-xs text-[#71717A] dark:text-slate-400 mt-0.5">
                    Pantau penyelesaian materi dan hasil tes siswa yang terdaftar di kursus Anda.
                  </p>
                </div>
                <Link to="/teacher">
                  <Button variant="secondary" size="sm">
                    Buka Teacher Studio
                  </Button>
                </Link>
              </div>

              {studentProgress.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#71717A] dark:text-slate-400">
                  Belum ada siswa yang terdaftar pada kursus Anda.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#F6F5F1] dark:bg-slate-900 border-b border-[#E5E3DC] dark:border-slate-800 text-xs font-semibold text-[#71717A] dark:text-slate-400 uppercase">
                      <tr>
                        <th className="px-6 py-3">Siswa</th>
                        <th className="px-6 py-3">Kursus</th>
                        <th className="px-6 py-3">Progres Materi</th>
                        <th className="px-6 py-3">Nilai Tes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E3DC] dark:divide-slate-800">
                      {studentProgress.map((row) => {
                        const pct =
                          row.total_lessons > 0
                            ? Math.round((row.completed_lessons / row.total_lessons) * 100)
                            : 0;
                        return (
                          <tr key={`${row.student_id}-${row.course_id}`}>
                            <td className="px-6 py-3.5">
                              <p className="font-semibold text-[#18181B] dark:text-white">{row.student_name}</p>
                              <p className="text-xs text-[#71717A] dark:text-slate-400">{row.student_email}</p>
                            </td>
                            <td className="px-6 py-3.5 text-[#52525B] dark:text-slate-300">{row.course_title}</td>
                            <td className="px-6 py-3.5 w-48">
                              <div className="space-y-1">
                                <span className="text-xs font-mono-tabular text-[#18181B] dark:text-white">
                                  {row.completed_lessons}/{row.total_lessons} materi ({pct}%)
                                </span>
                                <ProgressBar value={pct} tone="emerald" />
                              </div>
                            </td>
                            <td className="px-6 py-3.5">
                              {row.latest_quiz_score !== null ? (
                                <Badge
                                  tone={row.latest_quiz_score >= 70 ? 'emerald' : 'amber'}
                                >
                                  {row.latest_quiz_score}%
                                </Badge>
                              ) : (
                                <span className="text-xs text-[#71717A] dark:text-slate-400">Belum tes</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ADMIN OVERVIEW */}
          {user.role === 'admin' && (
            <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#18181B] dark:text-white">Akses Administrator</h2>
                  <p className="text-xs text-[#71717A] dark:text-slate-400">
                    Anda memiliki akses penuh untuk mengelola akun pengguna dan publikasi kursus.
                  </p>
                </div>
              </div>
              <Link to="/admin">
                <Button>Buka Admin Panel</Button>
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

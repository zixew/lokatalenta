import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Lock,
  Star,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { lmsApi } from '../../shared/services/lmsApi';
import type { Course } from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { useAuthStore } from '../auth/useAuthStore';

export function CourseOverviewGate({
  course,
  onEnroll,
  enrolling,
}: {
  course: Course;
  onEnroll: () => void;
  enrolling: boolean;
}) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const modules = course.modules ?? [];
  const [openModuleId, setOpenModuleId] = useState<string | null>(modules[0]?.id ?? null);

  const { data: totalStudents = 0 } = useQuery({
    queryKey: ['course-enrollment-count', course.id],
    queryFn: () => lmsApi.getCourseEnrollmentCount(course.id),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['course-reviews', course.id],
    queryFn: () => lmsApi.listCourseReviews(course.id),
  });

  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0);
  const totalQuizzes = modules.reduce(
    (sum, m) => sum + (m.lessons ?? []).filter((l) => l.type === 'quiz').length,
    0
  );

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#71717A] dark:text-slate-400 hover:text-[#18181B] dark:hover:text-white"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Kembali ke Katalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Course Summary, Curriculum Flow & Reviews */}
        <div className="lg:col-span-8 space-y-6">
          {/* Course Summary Card */}
          <section className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="blue">{course.category}</Badge>
              <Badge tone="slate">{course.level}</Badge>
              {avgRating && (
                <Badge tone="amber">
                  <Star className="w-3 h-3 fill-current" />
                  {avgRating} ({reviews.length} ulasan)
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] dark:text-white leading-tight">
                {course.title}
              </h1>
              <p className="text-sm text-[#52525B] dark:text-slate-300 leading-relaxed">
                {course.description}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#E5E3DC] dark:border-slate-800 text-xs">
              <div className="p-3 rounded-xl bg-[#F6F5F1] dark:bg-slate-800/60">
                <span className="text-[#71717A] dark:text-slate-400 block">Total Siswa</span>
                <span className="font-bold text-sm text-[#18181B] dark:text-white inline-flex items-center gap-1.5 mt-1">
                  <Users className="w-3.5 h-3.5 text-[#0F766E]" />
                  {totalStudents} Pelajar
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F6F5F1] dark:bg-slate-800/60">
                <span className="text-[#71717A] dark:text-slate-400 block">Alur Modul</span>
                <span className="font-bold text-sm text-[#18181B] dark:text-white inline-flex items-center gap-1.5 mt-1">
                  <Layers className="w-3.5 h-3.5 text-[#0F766E]" />
                  {modules.length} Modul
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F6F5F1] dark:bg-slate-800/60">
                <span className="text-[#71717A] dark:text-slate-400 block">Materi &amp; Soal</span>
                <span className="font-bold text-sm text-[#18181B] dark:text-white inline-flex items-center gap-1.5 mt-1">
                  <BookOpen className="w-3.5 h-3.5 text-[#0F766E]" />
                  {totalLessons} Bagian
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F6F5F1] dark:bg-slate-800/60">
                <span className="text-[#71717A] dark:text-slate-400 block">Estimasi</span>
                <span className="font-bold text-sm text-[#18181B] dark:text-white inline-flex items-center gap-1.5 mt-1">
                  <Clock className="w-3.5 h-3.5 text-[#0F766E]" />
                  {course.estimated_hours} Jam
                </span>
              </div>
            </div>
          </section>

          {/* Alur Modul (Curriculum Roadmap) */}
          <section className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-[#18181B] dark:text-white">
                  Alur Modul &amp; Silabus Pembelajaran
                </h2>
                <p className="text-xs text-[#71717A] dark:text-slate-400 mt-0.5">
                  {modules.length} modul • {totalLessons} bagian materi, rangkuman, dan {totalQuizzes} latihan soal
                </p>
              </div>
              <Badge tone="amber">
                <Lock className="w-3 h-3" />
                Daftar untuk Membuka Materi
              </Badge>
            </div>

            <div className="space-y-2.5">
              {modules.map((mod, mIdx) => {
                const isOpen = openModuleId === mod.id;
                const lessons = mod.lessons ?? [];
                return (
                  <div
                    key={mod.id}
                    className="border border-[#E5E3DC] dark:border-slate-800 rounded-xl overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenModuleId(isOpen ? null : mod.id)}
                      className="w-full px-4 py-3.5 bg-[#F6F5F1] dark:bg-slate-800/60 flex items-center justify-between gap-3 text-left cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#0F766E] dark:text-teal-400">
                          Modul {mIdx + 1}
                        </p>
                        <p className="text-sm font-bold text-[#18181B] dark:text-white truncate">
                          {mod.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-[#71717A] dark:text-slate-400">
                          {lessons.length} bagian
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-[#71717A]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#71717A]" />
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="divide-y divide-[#F0EFEA] dark:divide-slate-800 bg-white dark:bg-[#161B22]">
                        {lessons.map((les) => (
                          <div
                            key={les.id}
                            className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="text-[#18181B] dark:text-slate-200 truncate">
                                {les.title}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#71717A] dark:text-slate-400 shrink-0">
                              {les.type === 'quiz' ? 'Latihan Soal' : `${les.duration_minutes} mnt`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Ulasan & Review Pelajar */}
          <section className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-[#18181B] dark:text-white">
                Ulasan Pelajar ({reviews.length})
              </h2>
              {avgRating && (
                <div className="inline-flex items-center gap-1 text-sm font-bold text-amber-600 dark:text-amber-400">
                  <Star className="w-4 h-4 fill-current" />
                  {avgRating} / 5.0
                </div>
              )}
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-[#71717A] dark:text-slate-400">
                Belum ada ulasan untuk kursus ini. Daftar dan selesaikan materi untuk memberikan ulasan pertama.
              </p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl bg-[#F6F5F1] dark:bg-slate-800/60 border border-[#E5E3DC] dark:border-slate-700 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-[#18181B] dark:text-white">
                        {r.author_name}
                      </p>
                      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {r.rating}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="text-xs text-[#52525B] dark:text-slate-300">{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right: Sticky Enroll CTA Card */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24">
          <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-xs">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#0F766E] dark:text-teal-400">
                Program Pembelajaran
              </p>
              <p className="text-xl font-extrabold text-[#18181B] dark:text-white mt-1">
                Akses Terbuka untuk Anggota
              </p>
              <p className="text-xs text-[#71717A] dark:text-slate-400 mt-1">
                Pengajar: {course.teacher_name}
              </p>
            </div>

            <ul className="space-y-2 text-xs text-[#52525B] dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0" />
                {modules.length} modul pembelajaran terstruktur
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0" />
                Penjelasan lengkap, rangkuman, dan {totalQuizzes} latihan soal
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0" />
                Forum Tanya Jawab, Catatan Pribadi &amp; Sertifikat Kelulusan
              </li>
            </ul>

            {user ? (
              <Button
                size="lg"
                className="w-full"
                onClick={onEnroll}
                disabled={enrolling}
              >
                {enrolling ? 'Memproses...' : 'Gabung Course'}
              </Button>
            ) : (
              <Button
                size="lg"
                className="w-full"
                onClick={() => navigate('/auth')}
              >
                Masuk untuk Gabung
              </Button>
            )}

            <p className="text-[11px] text-center text-[#71717A] dark:text-slate-400">
              Materi, video, dan latihan soal akan langsung terbuka setelah Anda bergabung.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

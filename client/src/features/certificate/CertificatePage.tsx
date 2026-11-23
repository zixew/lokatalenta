import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Award, CheckCircle2, Printer, Share2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { lmsApi } from '../../shared/services/lmsApi';
import { BrandLogo } from '../../shared/ui/BrandLogo';
import { Button } from '../../shared/ui/Button';
import { useAuthStore } from '../auth/useAuthStore';
import { buildLinkedInShareUrl, buildWhatsAppShareUrl } from '../quiz-runner/shareAndChallenge';

export function CertificatePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuthStore();
  const [issuedYear] = useState(() => new Date().getFullYear());
  const [issuedDate] = useState(() =>
    new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  );

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses', 'published'],
    queryFn: () => lmsApi.listPublishedCourses(),
  });

  const { data: completedIds = [] } = useQuery({
    queryKey: ['lesson-progress', user?.id],
    queryFn: () => (user ? lmsApi.getCompletedLessonIds(user.id) : Promise.resolve([])),
    enabled: Boolean(user),
  });

  const { data: attempts = [] } = useQuery({
    queryKey: ['quiz-attempts', user?.id],
    queryFn: () => (user ? lmsApi.listUserAttempts(user.id) : Promise.resolve([])),
    enabled: Boolean(user),
  });

  const course = courses.find((c) => c.id === courseId);
  const certNumber =
    course && user
      ? `LT-${course.id.slice(-4).toUpperCase()}-${user.id
          .slice(-4)
          .toUpperCase()}-${issuedYear}`
      : '';

  const allLessons = (course?.modules ?? []).flatMap((m) => m.lessons);
  const completedLessonsCount = allLessons.filter((l) => completedIds.includes(l.id)).length;
  const courseQuizzes = allLessons.filter((l) => l.type === 'quiz' && l.quiz).map((l) => l.quiz!);
  const passedAnyFinalQuiz = courseQuizzes.some((qz) =>
    attempts.some((a) => a.quiz_id === qz.id && (a.score ?? 0) >= qz.passing_score)
  );
  const eligible =
    Boolean(course && user) &&
    ((allLessons.length > 0 && completedLessonsCount === allLessons.length) || passedAnyFinalQuiz);

  useQuery({
    queryKey: ['register-cert', certNumber],
    queryFn: () =>
      lmsApi.registerCertificate({
        cert_code: certNumber,
        user_id: user!.id,
        student_name: user!.full_name,
        course_id: course!.id,
        course_title: course!.title,
        teacher_name: course!.teacher_name ?? 'Pengajar',
      }),
    enabled: Boolean(eligible && certNumber),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-96 bg-white border border-[#E5E3DC] rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!course || !user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-xl font-bold">Sertifikat tidak ditemukan</h1>
        <Link to="/profile">
          <Button variant="secondary">Kembali ke Profil</Button>
        </Link>
      </div>
    );
  }

  if (!eligible) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-[#D97706] flex items-center justify-center mx-auto">
          <Award className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-[#18181B]">Sertifikat Belum Terbuka</h1>
        <p className="text-sm text-[#52525B]">
          Selesaikan seluruh materi atau lulus tes evaluasi akhir (minimal skor 70%) untuk
          mendapatkan sertifikat kelulusan.
        </p>
        <Link to={`/courses/${course.slug}`}>
          <Button>Lanjutkan Belajar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          to={`/courses/${course.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#71717A] hover:text-[#18181B]"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Kursus
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/verify/${certNumber}`}>
            <Button variant="secondary">
              <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
              Verifikasi Publik
            </Button>
          </Link>
          <a
            href={buildWhatsAppShareUrl(
              `Alhamdulillah, saya baru saja menyelesaikan "${course.title}" di LokaTalenta! Verifikasi sertifikat (${certNumber}): ${
                typeof window !== 'undefined' ? window.location.origin : 'https://lokatalenta.vercel.app'
              }/verify/${certNumber}`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            WhatsApp
          </a>
          <a
            href={buildLinkedInShareUrl(
              `${
                typeof window !== 'undefined' ? window.location.origin : 'https://lokatalenta.vercel.app'
              }/verify/${certNumber}`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#0A66C2] hover:bg-[#004182] text-white transition-colors"
          >
            LinkedIn
          </a>
          <Button onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            Cetak / Simpan PDF
          </Button>
        </div>
      </div>

      {/* Printable Certificate Canvas */}
      <div className="bg-white border-2 border-[#18181B] rounded-2xl p-8 sm:p-14 shadow-sm relative overflow-hidden">
        <div className="border border-[#CBD5E1] rounded-xl p-6 sm:p-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E3DC] pb-6">
            <div className="flex items-center gap-3">
              <BrandLogo className="w-10 h-10" />
              <div>
                <span className="font-bold text-lg text-[#18181B] block leading-tight">
                  LokaTalenta
                </span>
                <span className="text-xs text-[#71717A]">Sertifikat Kelulusan Resmi</span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717A] block">
                Nomor Sertifikat
              </span>
              <span className="font-mono-tabular text-sm font-bold text-[#18181B]">
                {certNumber}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-4 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#0F766E]">
              Diberikan Kepada
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#18181B]">
              {user.full_name}
            </h1>
            <p className="text-sm sm:text-base text-[#52525B] max-w-2xl leading-relaxed">
              Telah menyelesaikan seluruh rangkaian pembelajaran dan evaluasi dengan baik pada
              program:
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-[#18181B] pt-1">
              {course.title}
            </h2>
          </div>

          {/* Footer / Signature */}
          <div className="pt-8 border-t border-[#E5E3DC] flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <span className="text-xs text-[#71717A] block">Diterbitkan pada</span>
              <span className="text-sm font-semibold text-[#18181B]">{issuedDate}</span>
            </div>

            <div className="text-left sm:text-right">
              <div className="w-40 border-b border-[#18181B] mb-2 sm:ml-auto" />
              <p className="text-sm font-bold text-[#18181B]">{course.teacher_name}</p>
              <p className="text-xs text-[#71717A]">Pengajar &amp; Kurator Materi</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

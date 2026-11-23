import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  Lock,
  Megaphone,
  PlayCircle,
  Trophy,
  Volume2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { lmsApi } from '../../shared/services/lmsApi';
import type { Lesson } from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { ProgressBar } from '../../shared/ui/ProgressBar';
import { useAuthStore } from '../auth/useAuthStore';
import { CourseOverviewGate } from './CourseOverviewGate';
import { FlashcardDeck } from './FlashcardDeck';
import { LessonExtrasPanel } from './LessonExtrasPanel';
import { SpeechPracticeBox } from './SpeechPracticeBox';
import { WritingCanvas } from './WritingCanvas';

export function CoursePlayerPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const requestedLessonId = searchParams.get('lesson');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => lmsApi.getCourseBySlug(slug!),
    enabled: Boolean(slug),
  });

  const { data: enrolledIds = [] } = useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: () => (user ? lmsApi.getUserEnrollments(user.id) : Promise.resolve([])),
    enabled: Boolean(user),
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

  const { data: inProgressAttempts = [] } = useQuery({
    queryKey: ['quiz-attempts-inprogress', user?.id],
    queryFn: () => (user ? lmsApi.listInProgressAttempts(user.id) : Promise.resolve([])),
    enabled: Boolean(user),
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['course-announcements', course?.id],
    queryFn: () => (course ? lmsApi.listCourseAnnouncements(course.id) : Promise.resolve([])),
    enabled: Boolean(course),
  });

  const allLessons = useMemo(
    () => (course?.modules ?? []).flatMap((m) => m.lessons),
    [course]
  );

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [speechRate, setSpeechRate] = useState<0.8 | 1.0>(1.0);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [flashcardMode, setFlashcardMode] = useState(false);
  const [writingMode, setWritingMode] = useState(false);
  const [speechMode, setSpeechMode] = useState(false);

  const speakLine = (text: string, lang: 'ja-JP' | 'en-US' | 'ko-KR', idx: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = speechRate;
    utter.onend = () => setSpeakingIdx(null);
    utter.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utter);
  };

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const isLessonDone = (les: Lesson) => {
    if (les.type === 'quiz' && les.quiz) {
      return attempts.some(
        (a) =>
          a.quiz_id === les.quiz!.id &&
          a.submitted_at !== null &&
          (a.score ?? 0) >= les.quiz!.passing_score
      );
    }
    return completedIds.includes(les.id);
  };

  const isLessonLocked = (lessonId: string) => {
    const idx = allLessons.findIndex((l) => l.id === lessonId);
    if (idx <= 0) return false;
    return !isLessonDone(allLessons[idx - 1]);
  };

  const firstIncompleteLesson = allLessons.find((l) => !isLessonDone(l));
  const activeLesson: Lesson | undefined =
    allLessons.find((l) => l.id === (activeLessonId ?? requestedLessonId)) ??
    firstIncompleteLesson ??
    allLessons[0];

  const isEnrolled = course ? enrolledIds.includes(course.id) : false;

  const enrollMutation = useMutation({
    mutationFn: () => lmsApi.enrollCourse(user!.id, course!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['course-enrollment-count', course?.id] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (lessonId: string) => lmsApi.markLessonComplete(user!.id, lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-progress', user?.id] });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="h-96 bg-white border border-[#E5E3DC] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">Kursus tidak ditemukan</h1>
        <Link to="/">
          <Button variant="secondary">Kembali ke Katalog</Button>
        </Link>
      </div>
    );
  }

  const canAccessCourse =
    isEnrolled || user?.role === 'teacher' || user?.role === 'admin';

  if (!canAccessCourse) {
    return (
      <CourseOverviewGate
        course={course}
        onEnroll={() => enrollMutation.mutate()}
        enrolling={enrollMutation.isPending}
      />
    );
  }

  const completedCount = allLessons.filter((l) => isLessonDone(l)).length;
  const progressPct =
    allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;

  const currentIdx = allLessons.findIndex((l) => l.id === activeLesson?.id);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : undefined;
  const nextLesson = currentIdx >= 0 ? allLessons[currentIdx + 1] : undefined;

  const findModuleTitle = (moduleId: string) =>
    (course.modules ?? []).find((m) => m.id === moduleId)?.title ?? '';

  const handleCompleteAndNext = async () => {
    if (!user || !activeLesson) return;
    if (!completedIds.includes(activeLesson.id)) {
      await completeMutation.mutateAsync(activeLesson.id);
    }
    if (nextLesson) setActiveLessonId(nextLesson.id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Breadcrumb & Course Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#71717A] dark:text-slate-400 hover:text-[#18181B] dark:hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Katalog
          </Link>
          <h1 className="text-2xl font-bold text-[#18181B] dark:text-white">{course.title}</h1>
          <p className="text-xs text-[#71717A] dark:text-slate-400">
            Pengajar: <span className="font-medium text-[#18181B] dark:text-slate-200">{course.teacher_name}</span> •{' '}
            {course.level}
          </p>
        </div>

        {!isEnrolled && user ? (
          <Button
            size="lg"
            onClick={() => enrollMutation.mutate()}
            disabled={enrollMutation.isPending}
          >
            {enrollMutation.isPending ? 'Memproses...' : 'Gabung Course'}
          </Button>
        ) : user && allLessons.length > 0 && completedCount === allLessons.length ? (
          <Link to={`/certificate/${course.id}`}>
            <Button size="lg">
              <Award className="w-4 h-4" />
              Lihat &amp; Cetak Sertifikat
            </Button>
          </Link>
        ) : null}
      </div>

      {/* Course Announcements Banner */}
      {announcements.length > 0 && (
        <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#0F766E] dark:text-teal-300 inline-flex items-center gap-1.5">
              <Megaphone className="w-4 h-4" />
              Pengumuman Mentor: {announcements[0].title}
            </span>
            <span className="text-[11px] text-[#71717A] dark:text-slate-400">
              {announcements[0].author_name}
            </span>
          </div>
          <p className="text-xs text-[#18181B] dark:text-slate-200 leading-relaxed">
            {announcements[0].content}
          </p>
        </div>
      )}

      {/* 2-Column Learning Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-8 bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          {!activeLesson ? (
            <p className="text-sm text-[#71717A] dark:text-slate-400">Belum ada materi di kursus ini.</p>
          ) : activeLesson.type === 'quiz' && activeLesson.quiz ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Badge tone="blue">Simulasi Psikotes / Kuis</Badge>
                <Badge tone="slate">
                  <Clock className="w-3 h-3" />
                  {activeLesson.quiz.duration_minutes} Menit
                </Badge>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-[#18181B] dark:text-white">{activeLesson.quiz.title}</h2>
                <p className="text-sm text-[#52525B] dark:text-slate-400 leading-relaxed">
                  {activeLesson.quiz.description}
                </p>
              </div>

              <div className="bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-800 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-xs text-[#71717A] dark:text-slate-400 block">Durasi Pengerjaan</span>
                  <span className="font-bold text-[#18181B] dark:text-white">
                    {activeLesson.quiz.duration_minutes} Menit
                  </span>
                </div>
                <div>
                  <span className="text-xs text-[#71717A] dark:text-slate-400 block">Ambang Batas Lulus</span>
                  <span className="font-bold text-[#18181B] dark:text-white">
                    Skor {activeLesson.quiz.passing_score}%
                  </span>
                </div>
                <div>
                  <span className="text-xs text-[#71717A] dark:text-slate-400 block">Sistem Penilaian</span>
                  <span className="font-bold text-[#18181B] dark:text-white">Otomatis + Pembahasan</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {!user ? (
                  <Link to="/auth">
                    <Button size="lg">Masuk untuk Mulai Tes</Button>
                  </Link>
                ) : (() => {
                  const doneAttempt = attempts.find(
                    (a) => a.quiz_id === activeLesson.quiz!.id && a.submitted_at
                  );
                  const activeAttempt = inProgressAttempts.find(
                    (a) => a.quiz_id === activeLesson.quiz!.id && !a.submitted_at
                  );
                  const passingScore = activeLesson.quiz!.passing_score;

                  if (activeAttempt) {
                    return (
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge tone="amber" className="py-1.5 px-3 text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          Sedang Dikerjakan
                        </Badge>
                        <Button
                          size="lg"
                          onClick={() => navigate(`/quiz/${activeLesson.quiz!.id}`)}
                        >
                          <ClipboardCheck className="w-4 h-4" />
                          Lanjutkan Tes
                        </Button>
                      </div>
                    );
                  }
                  if (doneAttempt && (doneAttempt.score ?? 0) >= passingScore) {
                    return (
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge tone="emerald" className="py-1.5 px-3 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Lulus (Skor: {doneAttempt.score}%)
                        </Badge>
                        <Link to={`/quiz/${activeLesson.quiz!.id}/result/${doneAttempt.id}`}>
                          <Button size="lg">Lihat Ringkasan Jawaban</Button>
                        </Link>
                      </div>
                    );
                  }
                  if (doneAttempt && (doneAttempt.score ?? 0) < passingScore) {
                    const submittedMs = new Date(doneAttempt.submitted_at!).getTime();
                    const waitLeftSec = Math.max(
                      0,
                      Math.ceil((submittedMs + 60 * 1000 - nowMs) / 1000)
                    );
                    return (
                      <div className="space-y-3 w-full">
                        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                          Skor Anda <strong>{doneAttempt.score}%</strong> (belum mencapai nilai
                          rata-rata minimal <strong>{passingScore}%</strong>). Silakan pelajari
                          kembali materi atau ringkasan jawaban, lalu ulangi latihan untuk membuka
                          modul berikutnya.
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            size="lg"
                            disabled={waitLeftSec > 0}
                            onClick={() => navigate(`/quiz/${activeLesson.quiz!.id}`)}
                          >
                            <ClipboardCheck className="w-4 h-4" />
                            {waitLeftSec > 0
                              ? `Tunggu ${waitLeftSec} detik untuk mengulang`
                              : 'Ulangi Latihan Modul'}
                          </Button>
                          <Link to={`/quiz/${activeLesson.quiz!.id}/result/${doneAttempt.id}`}>
                            <Button variant="secondary" size="lg">
                              Lihat Ringkasan Jawaban
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <Button
                      size="lg"
                      onClick={() => navigate(`/quiz/${activeLesson.quiz!.id}`)}
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      Mulai Kerjakan Tes
                    </Button>
                  );
                })()}
              </div>

              {/* Recent Attempts for this Quiz */}
              {attempts.filter((a) => a.quiz_id === activeLesson.quiz!.id).length > 0 && (
                <div className="pt-6 border-t border-[#E5E3DC] space-y-3">
                  <h3 className="text-sm font-bold text-[#18181B] flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#D97706]" />
                    Riwayat Pengerjaan Anda
                  </h3>
                  <div className="space-y-2">
                    {attempts
                      .filter((a) => a.quiz_id === activeLesson.quiz!.id)
                      .map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-3.5 rounded-lg border border-[#E5E3DC] bg-[#F6F5F1] text-sm"
                        >
                          <div>
                            <span className="font-semibold text-[#18181B]">
                              Skor: {att.score ?? 0}%
                            </span>
                            <span className="text-xs text-[#71717A] ml-3">
                              {att.submitted_at
                                ? new Date(att.submitted_at).toLocaleString('id-ID')
                                : ''}
                            </span>
                          </div>
                          <Link to={`/quiz/${activeLesson.quiz!.id}/result/${att.id}`}>
                            <Button variant="secondary" size="sm">
                              Lihat Pembahasan
                            </Button>
                          </Link>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {/* Coursera / Dicoding Bottom Back & Continue Bar for Quiz */}
              {(prevLesson || nextLesson) && (
                <div className="pt-6 border-t border-[#E5E3DC] dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    {prevLesson && (
                      <button
                        type="button"
                        onClick={() => setActiveLessonId(prevLesson.id)}
                        className="w-full text-left p-3.5 rounded-xl border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4 text-[#71717A] shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717A] dark:text-slate-400 block">
                            Kembali • {findModuleTitle(prevLesson.module_id)}
                          </span>
                          <span className="text-sm font-bold text-[#18181B] dark:text-white truncate block">
                            {prevLesson.title}
                          </span>
                        </div>
                      </button>
                    )}
                  </div>
                  <div>
                    {nextLesson && (
                      <button
                        type="button"
                        disabled={!isLessonDone(activeLesson)}
                        onClick={() => setActiveLessonId(nextLesson.id)}
                        className={`w-full text-right p-3.5 rounded-xl border transition-colors flex items-center justify-end gap-3 ${
                          isLessonDone(activeLesson)
                            ? 'border-[#0F766E] bg-[#0F766E] text-white hover:bg-[#115E59] cursor-pointer'
                            : 'border-[#E5E3DC] dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-[#94A3B8] dark:text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="text-[11px] font-semibold uppercase tracking-wider opacity-85 block">
                            {isLessonDone(activeLesson) ? 'Lanjut' : 'Terkunci'} •{' '}
                            {findModuleTitle(nextLesson.module_id)}
                          </span>
                          <span className="text-sm font-bold truncate block">
                            {nextLesson.title}
                          </span>
                        </div>
                        {isLessonDone(activeLesson) ? (
                          <ArrowRight className="w-4 h-4 shrink-0" />
                        ) : (
                          <Lock className="w-4 h-4 shrink-0" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#E5E3DC] dark:border-slate-800 pb-4">
                <div>
                  <Badge tone="slate">
                    {activeLesson.type === 'video' ? 'Materi Video' : 'Materi Bacaan'}
                  </Badge>
                  <h2 className="text-2xl font-bold text-[#18181B] dark:text-white mt-2">
                    {activeLesson.title}
                  </h2>
                </div>
                {completedIds.includes(activeLesson.id) && (
                  <Badge tone="emerald">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Selesai
                  </Badge>
                )}
              </div>

              {activeLesson.video_url && (
                <div className="aspect-video w-full rounded-xl overflow-hidden border border-[#E5E3DC] dark:border-slate-800 bg-slate-900">
                  <iframe
                    src={activeLesson.video_url}
                    title={activeLesson.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              <div className="prose prose-slate dark:prose-invert max-w-none text-[15px] leading-relaxed text-[#334155] dark:text-slate-300 whitespace-pre-line">
                {activeLesson.content}
              </div>

              {activeLesson.voice_lines && activeLesson.voice_lines.length > 0 && (
                <div className="bg-[#F6F5F1] dark:bg-slate-900/70 border border-[#E5E3DC] dark:border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E3DC] dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-[#0F766E] dark:text-teal-400" />
                      <h3 className="text-sm font-bold text-[#18181B] dark:text-white">
                        Audio Pelafalan &amp; Percakapan (Voice)
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setFlashcardMode((m) => !m);
                          setWritingMode(false);
                          setSpeechMode(false);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-semibold border cursor-pointer ${
                          flashcardMode
                            ? 'bg-[#0F766E] border-[#0F766E] text-white'
                            : 'bg-white dark:bg-slate-800 border-[#E5E3DC] dark:border-slate-700 text-[#18181B] dark:text-slate-200'
                        }`}
                      >
                        {flashcardMode ? 'Mode Daftar Audio' : 'Mode Flashcard'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSpeechMode((s) => !s);
                          setFlashcardMode(false);
                          setWritingMode(false);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-semibold border cursor-pointer ${
                          speechMode
                            ? 'bg-[#0F766E] border-[#0F766E] text-white'
                            : 'bg-white dark:bg-slate-800 border-[#E5E3DC] dark:border-slate-700 text-[#18181B] dark:text-slate-200'
                        }`}
                      >
                        Latihan Bicara
                      </button>
                      {activeLesson.voice_lines.some(
                        (v) => v.lang === 'ja-JP' || v.lang === 'ko-KR'
                      ) && (
                        <button
                          type="button"
                          onClick={() => {
                            setWritingMode((w) => !w);
                            setFlashcardMode(false);
                            setSpeechMode(false);
                          }}
                          className={`px-2.5 py-1 rounded-lg font-semibold border cursor-pointer ${
                            writingMode
                              ? 'bg-[#0F766E] border-[#0F766E] text-white'
                              : 'bg-white dark:bg-slate-800 border-[#E5E3DC] dark:border-slate-700 text-[#18181B] dark:text-slate-200'
                          }`}
                        >
                          Latihan Menulis
                        </button>
                      )}
                      <span className="text-[#71717A] dark:text-slate-400">Kecepatan:</span>
                      {([0.8, 1.0] as const).map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setSpeechRate(rate)}
                          className={`px-2 py-0.5 rounded font-mono-tabular font-semibold border cursor-pointer ${
                            speechRate === rate
                              ? 'bg-[#0F766E] border-[#0F766E] text-white'
                              : 'bg-white dark:bg-slate-800 border-[#E5E3DC] dark:border-slate-700 text-[#52525B] dark:text-slate-300'
                          }`}
                        >
                          {rate === 0.8 ? '0.8x' : '1.0x'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {speechMode ? (
                    <SpeechPracticeBox lines={activeLesson.voice_lines} />
                  ) : writingMode ? (
                    <WritingCanvas lines={activeLesson.voice_lines} />
                  ) : flashcardMode ? (
                    <FlashcardDeck lines={activeLesson.voice_lines} />
                  ) : (
                    <div className="space-y-2.5">
                      {activeLesson.voice_lines.map((line, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <p className="text-sm sm:text-base font-bold text-[#18181B] dark:text-white">
                              {line.text}
                            </p>
                            {line.romaji && (
                              <p className="text-xs font-medium text-[#0F766E] dark:text-teal-400">
                                {line.romaji}
                              </p>
                            )}
                            <p className="text-xs text-[#52525B] dark:text-slate-400">
                              {line.translation}
                            </p>
                          </div>
                          <Button
                            variant={speakingIdx === idx ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => speakLine(line.text, line.lang, idx)}
                            className="shrink-0"
                          >
                            <Volume2 className="w-4 h-4" />
                            {speakingIdx === idx ? 'Memutar...' : 'Dengar'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Coursera / Dicoding Bottom Back & Continue Bar */}
              <div className="pt-6 border-t border-[#E5E3DC] dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs text-[#71717A] dark:text-slate-400">
                  <span>Estimasi baca: {activeLesson.duration_minutes} menit</span>
                  {!nextLesson && user && (
                    <Button
                      onClick={handleCompleteAndNext}
                      disabled={completeMutation.isPending}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isLessonDone(activeLesson) ? 'Materi Sudah Selesai' : 'Tandai Materi Selesai'}
                    </Button>
                  )}
                </div>

                {(prevLesson || nextLesson) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      {prevLesson && (
                        <button
                          type="button"
                          onClick={() => setActiveLessonId(prevLesson.id)}
                          className="w-full text-left p-3.5 rounded-xl border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4 text-[#71717A] shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717A] dark:text-slate-400 block truncate">
                              Kembali • {findModuleTitle(prevLesson.module_id)}
                            </span>
                            <span className="text-sm font-bold text-[#18181B] dark:text-white truncate block">
                              {prevLesson.title}
                            </span>
                          </div>
                        </button>
                      )}
                    </div>

                    <div>
                      {nextLesson && (
                        <button
                          type="button"
                          disabled={completeMutation.isPending || (!user && !isLessonDone(activeLesson))}
                          onClick={() => {
                            if (user) handleCompleteAndNext();
                            else if (isLessonDone(activeLesson)) setActiveLessonId(nextLesson.id);
                          }}
                          className="w-full text-right p-3.5 rounded-xl border border-[#0F766E] bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors flex items-center justify-end gap-3 cursor-pointer disabled:opacity-50"
                        >
                          <div className="min-w-0">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-100 block truncate">
                              {isLessonDone(activeLesson) ? 'Lanjut' : 'Selesai & Lanjut'} •{' '}
                              {findModuleTitle(nextLesson.module_id)}
                            </span>
                            <span className="text-sm font-bold truncate block">
                              {nextLesson.title}
                            </span>
                          </div>
                          <ArrowRight className="w-4 h-4 shrink-0" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeLesson && (
            <LessonExtrasPanel
              key={activeLesson.id}
              courseId={course.id}
              courseSlug={course.slug}
              mentorId={course.teacher_id}
              mentorName={course.teacher_name ?? 'Mentor'}
              lessonId={activeLesson.id}
            />
          )}
        </div>

        {/* Right Sidebar: Syllabus & Progress */}
        <aside className="lg:col-span-4 bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-5 space-y-5 lg:sticky lg:top-24">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#18181B] dark:text-white">Kurikulum Kursus</span>
              <span className="font-mono-tabular font-semibold text-[#0F766E] dark:text-teal-400">
                {completedCount}/{allLessons.length} Selesai ({progressPct}%)
              </span>
            </div>
            <ProgressBar value={progressPct} tone="emerald" />
          </div>

          <div className="space-y-4">
            {(course.modules ?? []).map((mod) => (
              <div key={mod.id} className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-slate-400">
                  {mod.title}
                </h3>
                <div className="space-y-1.5">
                  {mod.lessons.map((les) => {
                    const isActive = les.id === activeLesson?.id;
                    const isDone = isLessonDone(les);
                    const locked = isLessonLocked(les.id);
                    return (
                      <button
                        key={les.id}
                        type="button"
                        disabled={locked}
                        onClick={() => {
                          if (!locked) setActiveLessonId(les.id);
                        }}
                        className={`w-full text-left p-3 rounded-xl border text-sm transition-colors flex items-start gap-2.5 ${
                          locked
                            ? 'bg-slate-50 dark:bg-slate-900/30 border-[#E5E3DC] dark:border-slate-800 text-[#94A3B8] dark:text-slate-500 opacity-65 cursor-not-allowed'
                            : isActive
                            ? 'bg-teal-50/70 dark:bg-teal-950/50 border-[#0F766E] text-[#18181B] dark:text-white cursor-pointer'
                            : 'bg-white dark:bg-slate-900/60 border-[#E5E3DC] dark:border-slate-800 text-[#52525B] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {locked ? (
                            <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          ) : isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                          ) : les.type === 'quiz' ? (
                            <ClipboardCheck className="w-4 h-4 text-[#0F766E]" />
                          ) : les.type === 'video' ? (
                            <PlayCircle className="w-4 h-4 text-slate-400" />
                          ) : (
                            <FileText className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium leading-snug">{les.title}</p>
                          <span className="text-[11px] text-[#71717A] dark:text-slate-400 mt-0.5 block">
                            {locked
                              ? 'Terkunci • Selesaikan materi sebelumnya'
                              : `${les.type === 'quiz' ? 'Simulasi Tes' : 'Materi'} • ${les.duration_minutes} mnt`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

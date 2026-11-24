import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Moon,
  Send,
  Sun,
  Volume2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { lmsApi } from '../../shared/services/lmsApi';
import { useThemeStore } from '../../shared/stores/useThemeStore';
import type { QuizAttempt, SafeQuestion } from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { useAuthStore } from '../auth/useAuthStore';
import { parseChallengeParams, saveActiveChallengeForQuiz } from './shareAndChallenge';

export function QuizRunnerPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const [searchParams] = useSearchParams();
  const challengeInfo = parseChallengeParams(searchParams.toString());
  const subtestFilter = searchParams.get('subtest')?.trim() ?? '';
  const navigate = useNavigate();

  useEffect(() => {
    if (quizId && challengeInfo) {
      saveActiveChallengeForQuiz(quizId, challengeInfo);
    }
  }, [quizId, challengeInfo]);
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const [quizTitle, setQuizTitle] = useState('Simulasi Psikotes');
  const [useSubtests, setUseSubtests] = useState(true);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [questions, setQuestions] = useState<SafeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState<number>(1200);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [navFilter, setNavFilter] = useState<'all' | 'unanswered' | 'flagged'>('all');
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceFeedback, setPracticeFeedback] = useState<
    Record<string, { is_correct: boolean; correct_option: string; explanation: string }>
  >({});
  const [checkingPractice, setCheckingPractice] = useState(false);

  const handleCheckPractice = async () => {
    if (!quizId || !currentQuestion) return;
    const selected = answers[currentQuestion.id];
    if (!selected || checkingPractice) return;
    setCheckingPractice(true);
    try {
      const res = await lmsApi.checkPracticeAnswer(quizId, currentQuestion.id, selected);
      setPracticeFeedback((prev) => ({ ...prev, [currentQuestion.id]: res }));
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingPractice(false);
    }
  };

  const playQuestionAudio = (text: string, lang: 'ja-JP' | 'en-US' | 'ko-KR', rate: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = rate;
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  // Initialize attempt & load safe questions
  useEffect(() => {
    if (!quizId || !user) return;
    let mounted = true;

    (async () => {
      try {
        const meta = await lmsApi.getQuizMeta(quizId);
        const durationMins = meta?.duration_minutes ?? 120;
        const passingScore = meta?.passing_score ?? 70;
        if (meta && mounted) {
          setQuizTitle(meta.title);
          setUseSubtests(meta.use_subtests ?? true);
        }

        const existing = await lmsApi.getUserAttemptForQuiz(user.id, quizId);
        if (!subtestFilter && existing && (existing.score ?? 0) >= passingScore && mounted) {
          navigate(`/quiz/${quizId}/result/${existing.id}`, { replace: true });
          return;
        }

        const { attempt: activeAttempt, questions: safeQs } = await lmsApi.startQuizAttempt(
          user.id,
          quizId
        );
        const drilledQs = subtestFilter
          ? safeQs.filter(
              (q) => (q.category_tag ?? '').toLowerCase() === subtestFilter.toLowerCase()
            )
          : safeQs;
        const effectiveQs = drilledQs.length > 0 ? drilledQs : safeQs;
        if (mounted) {
          const deadlineMs =
            new Date(activeAttempt.started_at).getTime() + durationMins * 60 * 1000;
          const remaining = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
          setAttempt(activeAttempt);
          setAnswers(activeAttempt.answers ?? {});
          setSecondsLeft(remaining);
          setQuestions(effectiveQs);
          setLoading(false);
        }
      } catch (err: any) {
        console.error(err);
        if (mounted) {
          setLoadError(err?.message ?? 'Gagal memuat latihan soal.');
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [quizId, user, navigate, subtestFilter]);

  const handleSubmit = useCallback(async () => {
    if (!attempt || submitting) return;
    setSubmitting(true);
    try {
      const submitted = await lmsApi.submitQuizAttempt(attempt.id, answers);
      navigate(`/quiz/${quizId}/result/${submitted.id}`, { replace: true });
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  }, [attempt, answers, navigate, quizId, submitting]);

  // Countdown timer with auto-submit
  useEffect(() => {
    if (loading || !attempt) return;
    if (secondsLeft <= 0) {
      const t = setTimeout(() => {
        void handleSubmit();
      }, 0);
      return () => clearTimeout(t);
    }
    const timer = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, attempt, secondsLeft, handleSubmit]);

  const currentQuestion = questions[currentIndex];

  const selectAnswer = useCallback(
    (questionId: string, optionKey: string) => {
      setAnswers((prev) => {
        const next = { ...prev, [questionId]: optionKey };
        if (attempt) {
          lmsApi.saveAttemptProgress(attempt.id, next).catch(console.error);
        }
        return next;
      });
    },
    [attempt]
  );

  // Keyboard shortcuts (A-E or 1-5, Left/Right arrows, F to flag)
  useEffect(() => {
    if (!currentQuestion || showConfirm) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') {
        setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'p') {
        setCurrentIndex((i) => Math.max(0, i - 1));
      } else if (e.key.toLowerCase() === 'f') {
        setFlagged((prev) => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }));
      } else {
        const keyMap: Record<string, string> = {
          '1': 'A',
          '2': 'B',
          '3': 'C',
          '4': 'D',
          '5': 'E',
          a: 'A',
          b: 'B',
          c: 'C',
          d: 'D',
          e: 'E',
        };
        const mapped = keyMap[e.key.toLowerCase()];
        if (mapped && currentQuestion.options.some((o) => o.key === mapped)) {
          selectAnswer(currentQuestion.id, mapped);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentQuestion, questions.length, showConfirm, selectAnswer]);

  // Warn browser before closing/reloading tab during active test
  useEffect(() => {
    if (!attempt || submitting) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [attempt, submitting]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F5F1] flex items-center justify-center">
        <div className="text-sm font-medium text-[#52525B]">Menyiapkan lembar soal...</div>
      </div>
    );
  }

  if (loadError || !currentQuestion) {
    return (
      <div className="min-h-screen bg-[#F6F5F1] dark:bg-[#0D1117] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-base font-semibold text-[#18181B] dark:text-white max-w-md">
          {loadError || 'Soal belum tersedia untuk kuis ini.'}
        </p>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Kembali
        </Button>
      </div>
    );
  }

  const answeredCount = questions.filter((q) => Boolean(answers[q.id])).length;
  const flaggedCount = questions.filter((q) => Boolean(flagged[q.id])).length;
  const unansweredCount = questions.length - answeredCount;
  const isCriticalTime = secondsLeft < 300; // < 5 minutes

  return (
    <div className="min-h-screen bg-[#F6F5F1] dark:bg-[#0D1117] text-[#18181B] dark:text-slate-100 flex flex-col">
      {/* Distraction-Free Sticky Exam Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-[#161B22] border-b border-[#E5E3DC] dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setShowLeaveWarning(true)}
              title="Keluar dari halaman latihan"
              className="p-2 rounded-lg border border-[#E5E3DC] dark:border-slate-700 text-[#52525B] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-semibold text-[#71717A] dark:text-slate-400 uppercase tracking-wider">
                Latihan Soal
              </p>
              <h1 className="text-sm sm:text-base font-bold text-[#18181B] dark:text-white truncate">
                {quizTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setPracticeMode((m) => !m)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                practiceMode
                  ? 'bg-[#0F766E] border-[#0F766E] text-white'
                  : 'bg-white dark:bg-slate-800 border-[#E5E3DC] dark:border-slate-700 text-[#52525B] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="Beralih antara Mode Ujian ketat dan Mode Latihan (cek pembahasan langsung)"
            >
              {practiceMode ? 'Mode Latihan' : 'Mode Ujian'}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Ganti tema terang atau gelap"
              className="p-2 rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#52525B] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <div
              className={`px-3 sm:px-3.5 py-1.5 rounded-lg border font-mono-tabular text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 ${
                isCriticalTime
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-[#E11D48] dark:text-rose-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-[#E5E3DC] dark:border-slate-700 text-[#18181B] dark:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              {formatTime(secondsLeft)}
            </div>

            <Button size="sm" onClick={() => setShowConfirm(true)}>
              <Send className="w-3.5 h-3.5" />
              Selesai
            </Button>
          </div>
        </div>
      </header>

      {challengeInfo && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4">
          <div className="px-4 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs sm:text-sm text-teal-900 dark:text-teal-100 flex flex-wrap items-center justify-between gap-2">
            <span>
              Tantangan 1v1 dari <strong>{challengeInfo.challenger}</strong> — Target untuk menang:{' '}
              <strong className="font-mono-tabular">&gt; {challengeInfo.targetScore}%</strong>
            </span>
            <Badge tone="emerald">Mode Tantangan</Badge>
          </div>
        </div>
      )}

      {subtestFilter && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4">
          <div className="px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs sm:text-sm text-amber-900 dark:text-amber-100 flex flex-wrap items-center justify-between gap-2">
            <span>
              <strong>Smart Drill Subtest:</strong> Fokus berlatih kategori{' '}
              <strong>{subtestFilter}</strong> ({questions.length} soal)
            </span>
            <Badge tone="amber">Smart Drill</Badge>
          </div>
        </div>
      )}

      {/* Main Exam Workspace */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        {/* Question Area */}
        <section className="lg:col-span-8 bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-5 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E3DC] dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="font-mono-tabular text-sm font-bold text-[#18181B] dark:text-white">
                Soal {currentIndex + 1} / {questions.length}
              </span>
              {useSubtests && <Badge tone="blue">{currentQuestion.category_tag}</Badge>}
            </div>

            <button
              type="button"
              onClick={() =>
                setFlagged((prev) => ({
                  ...prev,
                  [currentQuestion.id]: !prev[currentQuestion.id],
                }))
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                flagged[currentQuestion.id]
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-[#B45309] dark:text-amber-300'
                  : 'bg-white dark:bg-slate-800 border-[#E5E3DC] dark:border-slate-700 text-[#52525B] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              {flagged[currentQuestion.id] ? 'Ditandai Ragu-ragu' : 'Tandai Ragu-ragu'}
            </button>
          </div>

          <div className="hidden sm:flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-800 text-[11px] text-[#71717A] dark:text-slate-400">
            <span>Shortcut Cepat:</span>
            <span className="font-mono-tabular">
              [1–5 / A–E] Pilih Opsi • [←/→ atau P/N] Navigasi • [F] Tandai Ragu
            </span>
          </div>

          {/* Prompt */}
          <div className="space-y-4">
            {currentQuestion.audio_text && currentQuestion.audio_lang && (
              <div className="p-4 rounded-xl bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Volume2 className="w-5 h-5 text-[#0F766E] dark:text-teal-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#0F766E] dark:text-teal-400">
                      Soal Listening (Dengarkan Audio)
                    </p>
                    <p className="text-xs text-[#71717A] dark:text-slate-400">
                      Putar audio dengan kecepatan normal atau lambat.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      playQuestionAudio(
                        currentQuestion.audio_text!,
                        currentQuestion.audio_lang!,
                        0.8
                      )
                    }
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    0.8x Lambat
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      playQuestionAudio(
                        currentQuestion.audio_text!,
                        currentQuestion.audio_lang!,
                        1.0
                      )
                    }
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    {isSpeaking ? 'Memutar...' : 'Putar 1.0x'}
                  </Button>
                </div>
              </div>
            )}
            <p className="text-base sm:text-lg font-medium text-[#18181B] dark:text-slate-100 leading-relaxed">
              {currentQuestion.question_text}
            </p>
            {currentQuestion.image_url && (
              <div className="bg-white rounded-xl p-3 border border-[#E5E3DC] w-full flex justify-center">
                <img
                  src={currentQuestion.image_url}
                  alt="Gambar soal"
                  className="max-h-72 w-auto max-w-full rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2.5 pt-2">
            {currentQuestion.options.map((opt) => {
              const isSelected = answers[currentQuestion.id] === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => selectAnswer(currentQuestion.id, opt.key)}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-center gap-3.5 cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-teal-950/50 border-[#0F766E] ring-1 ring-[#0F766E]'
                      : 'bg-white dark:bg-slate-900/60 border-[#E5E3DC] dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-lg font-mono-tabular text-sm font-bold flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-[#0F766E] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-[#18181B] dark:text-slate-200'
                    }`}
                  >
                    {opt.key}
                  </span>
                  <span className="text-sm sm:text-base text-[#18181B] dark:text-slate-100 font-medium">
                    {opt.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* BL-02: Practice Mode Instant Feedback */}
          {practiceMode && (
            <div className="space-y-3">
              {answers[currentQuestion.id] && !practiceFeedback[currentQuestion.id] && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={checkingPractice}
                  onClick={() => void handleCheckPractice()}
                >
                  {checkingPractice ? 'Memeriksa...' : 'Cek Jawaban & Pembahasan'}
                </Button>
              )}

              {practiceFeedback[currentQuestion.id] && (
                <div
                  className={`p-4 rounded-xl border text-sm space-y-1.5 ${
                    practiceFeedback[currentQuestion.id].is_correct
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                  }`}
                >
                  <p className="font-bold text-xs uppercase tracking-wider">
                    {practiceFeedback[currentQuestion.id].is_correct
                      ? 'Jawaban Benar!'
                      : `Kurang Tepat — Jawaban Benar: ${practiceFeedback[currentQuestion.id].correct_option}`}
                  </p>
                  <p className="text-xs sm:text-sm leading-relaxed">
                    {practiceFeedback[currentQuestion.id].explanation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Prev / Next Controls */}
          <div className="pt-4 border-t border-[#E5E3DC] dark:border-slate-800 flex items-center justify-between gap-2">
            <Button
              variant="secondary"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              Sebelumnya
            </Button>

            <span className="hidden md:inline text-xs text-[#71717A] dark:text-slate-400">
              Tips: Tekan tombol A–E atau ←/→ di keyboard
            </span>

            {currentIndex < questions.length - 1 ? (
              <Button
                onClick={() =>
                  setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
                }
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={() => setShowConfirm(true)}>
                <CheckCircle2 className="w-4 h-4" />
                Kumpulkan Jawaban
              </Button>
            )}
          </div>
        </section>

        {/* Right Panel: Question Navigator Grid */}
        <aside className="lg:col-span-4 bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-5 space-y-4 lg:sticky lg:top-24">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#18181B] dark:text-white">Navigasi Soal</h2>
              <span className="text-xs font-mono-tabular text-[#71717A] dark:text-slate-400">
                {answeredCount}/{questions.length} Terjawab
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-[#0F766E] transition-all duration-300"
                style={{
                  width: `${questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'all', label: `Semua (${questions.length})` },
                { id: 'unanswered', label: `Kosong (${unansweredCount})` },
                { id: 'flagged', label: `Ragu (${flaggedCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setNavFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                  navFilter === tab.id
                    ? 'bg-[#18181B] dark:bg-white text-white dark:text-[#18181B] border-[#18181B] dark:border-white'
                    : 'bg-[#F6F5F1] dark:bg-slate-900 text-[#52525B] dark:text-slate-300 border-[#E5E3DC] dark:border-slate-700 hover:border-[#0F766E]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-4 max-h-[55vh] overflow-y-auto p-1.5">
            {(useSubtests
              ? Array.from(new Set(questions.map((q) => q.category_tag)))
              : ['__FLAT__']
            ).map((subtestName) => {
              const subQuestions = (
                subtestName === '__FLAT__'
                  ? questions.map((q, idx) => ({ q, idx }))
                  : questions
                      .map((q, idx) => ({ q, idx }))
                      .filter(({ q }) => q.category_tag === subtestName)
              ).filter(({ q }) => {
                if (navFilter === 'unanswered') return !answers[q.id];
                if (navFilter === 'flagged') return Boolean(flagged[q.id]);
                return true;
              });

              if (subQuestions.length === 0) return null;

              return (
                <div key={subtestName} className="space-y-2">
                  {subtestName !== '__FLAT__' && (
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] dark:text-slate-400">
                      {subtestName}
                    </p>
                  )}
                  <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-5 gap-2">
                    {subQuestions.map(({ q, idx }) => {
                      const isCurrent = idx === currentIndex;
                      const isAnswered = Boolean(answers[q.id]);
                      const isFlagged = Boolean(flagged[q.id]);

                      let style =
                        'bg-white dark:bg-slate-900 border-[#E5E3DC] dark:border-slate-700 text-[#52525B] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800';
                      if (isFlagged) {
                        style =
                          'bg-amber-100 dark:bg-amber-950/70 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-bold';
                      } else if (isAnswered) {
                        style = 'bg-[#0F766E] border-[#0F766E] text-white font-semibold';
                      }

                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setCurrentIndex(idx)}
                          className={`h-9 rounded-lg border font-mono-tabular text-xs transition-all cursor-pointer ${style} ${
                            isCurrent
                              ? 'ring-2 ring-[#18181B] dark:ring-white ring-offset-1 dark:ring-offset-[#161B22]'
                              : ''
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="pt-4 border-t border-[#E5E3DC] dark:border-slate-800 grid grid-cols-3 gap-2 text-[11px] text-[#52525B] dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#0F766E] inline-block" />
              Terjawab
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-300 border border-amber-500 inline-block" />
              Ragu-ragu
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 inline-block" />
              Kosong
            </div>
          </div>
        </aside>
      </main>

      {/* Submit Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-[#D97706] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#18181B] dark:text-white">
                  Kumpulkan Jawaban Tes?
                </h3>
                <p className="text-sm text-[#52525B] dark:text-slate-400 mt-1">
                  Setelah dikumpulkan, jawaban tidak dapat diubah lagi dan skor akan langsung
                  dihitung.
                </p>
              </div>
            </div>

            <div className="bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-800 rounded-xl p-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="block font-mono-tabular text-lg font-bold text-[#0F766E] dark:text-teal-400">
                  {answeredCount}
                </span>
                <span className="text-[#71717A] dark:text-slate-400">Terjawab</span>
              </div>
              <div>
                <span className="block font-mono-tabular text-lg font-bold text-[#D97706]">
                  {flaggedCount}
                </span>
                <span className="text-[#71717A] dark:text-slate-400">Ragu-ragu</span>
              </div>
              <div>
                <span className="block font-mono-tabular text-lg font-bold text-[#18181B] dark:text-white">
                  {unansweredCount}
                </span>
                <span className="text-[#71717A] dark:text-slate-400">Kosong</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <Button
                variant="secondary"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
              >
                Periksa Lagi
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Menghitung Skor...' : 'Ya, Kumpulkan Sekarang'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Leave Warning Dialog */}
      {showLeaveWarning && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-[#D97706] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#18181B] dark:text-white">
                  Keluar dari Halaman Latihan?
                </h3>
                <p className="text-sm text-[#52525B] dark:text-slate-400 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin keluar? Jawaban yang sudah dipilih tetap tersimpan,
                  namun waktu pengerjaan akan terus berjalan hingga habis.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <Button variant="secondary" onClick={() => setShowLeaveWarning(false)}>
                Lanjutkan Mengerjakan
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setShowLeaveWarning(false);
                  navigate(-1);
                }}
              >
                Ya, Keluar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Copy,
  MessageSquare,
  RotateCcw,
  Share2,
  Target,
  Volume2,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { lmsApi } from '../../shared/services/lmsApi';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { ProgressBar } from '../../shared/ui/ProgressBar';
import { useAuthStore } from '../auth/useAuthStore';
import {
  buildChallengeUrl,
  buildLinkedInShareUrl,
  buildWhatsAppShareUrl,
  evaluateChallengeOutcome,
  getActiveChallengeForQuiz,
} from './shareAndChallenge';

export function QuizResultPage() {
  const { quizId, attemptId } = useParams<{ quizId: string; attemptId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [filterMode, setFilterMode] = useState<'all' | 'wrong'>('all');
  const [selectedSubtest, setSelectedSubtest] = useState<string>('ALL');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [copiedChallenge, setCopiedChallenge] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: quizMeta } = useQuery({
    queryKey: ['quiz-meta', quizId],
    queryFn: () => lmsApi.getQuizMeta(quizId!),
    enabled: Boolean(quizId),
  });

  const { data: courseCtx } = useQuery({
    queryKey: ['quiz-course-context', quizId],
    queryFn: () => lmsApi.getCourseContextByQuizId(quizId!),
    enabled: Boolean(quizId),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['attempt-result', attemptId],
    queryFn: () => lmsApi.getAttemptResult(attemptId!),
    enabled: Boolean(attemptId),
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="h-64 bg-white border border-[#E5E3DC] rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-xl font-bold">Ringkasan jawaban tidak ditemukan</h1>
        <Link to="/">
          <Button variant="secondary">Kembali ke Katalog</Button>
        </Link>
      </div>
    );
  }

  const { attempt, review } = data;
  const score = attempt.score ?? 0;
  const passingScore = quizMeta?.passing_score ?? 70;
  const passed = score >= passingScore;
  const breakdown = attempt.category_breakdown ?? {};

  const submittedMs = attempt.submitted_at ? new Date(attempt.submitted_at).getTime() : 0;
  const retakeWaitSec = submittedMs
    ? Math.max(0, Math.ceil((submittedMs + 60 * 1000 - nowMs) / 1000))
    : 0;

  const correctCount = review.filter((q) => attempt.answers[q.id] === q.correct_option).length;
  const wrongCount = review.length - correctCount;

  const filteredReview = review.filter((q) => {
    if (selectedSubtest !== 'ALL' && q.category_tag !== selectedSubtest) {
      return false;
    }
    if (filterMode === 'wrong') {
      return attempt.answers[q.id] !== q.correct_option;
    }
    return true;
  });

  const subtestEntries = Object.entries(breakdown).filter(([, stats]) => stats.total > 0);
  const weakestSubtest = subtestEntries
    .map(([name, stats]) => ({
      name,
      correct: stats.correct,
      total: stats.total,
      pct: Math.round((stats.correct / stats.total) * 100),
    }))
    .filter((item) => item.correct < item.total)
    .sort((a, b) => a.pct - b.pct)[0];

  const showSubtests = quizMeta?.use_subtests ?? true;

  const backTarget =
    courseCtx && !courseCtx.isStandaloneQuiz
      ? `/courses/${courseCtx.courseSlug}?lesson=${courseCtx.lessonId}`
      : '/';
  const backLabel =
    courseCtx && !courseCtx.isStandaloneQuiz ? 'Kembali ke Kursus' : 'Kembali ke Beranda';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={backTarget}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#71717A] dark:text-slate-300 hover:text-[#18181B] dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Link>
        {passed ? (
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge tone="emerald">
              <CheckCircle2 className="w-3 h-3" />
              Lulus (Minimal {passingScore}%)
            </Badge>
            {courseCtx && !courseCtx.isStandaloneQuiz && courseCtx.nextLessonId && (
              <Link to={`/courses/${courseCtx.courseSlug}?lesson=${courseCtx.nextLessonId}`}>
                <Button size="sm">
                  Lanjut ke Materi Berikutnya
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
            {courseCtx && !courseCtx.isStandaloneQuiz && !courseCtx.nextLessonId && (
              <Link to={`/certificate/${courseCtx.courseId}`}>
                <Button size="sm">
                  <Award className="w-3.5 h-3.5" />
                  Lihat Sertifikat
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge tone="amber">Belum Mencapai Nilai Rata-rata ({passingScore}%)</Badge>
            {quizId && (
              <Button
                size="sm"
                disabled={retakeWaitSec > 0}
                onClick={() => navigate(`/quiz/${quizId}`)}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {retakeWaitSec > 0
                  ? `Ulangi dalam ${retakeWaitSec} dtk`
                  : 'Ulangi Latihan'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Hero Score & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          className={`${
            showSubtests ? 'lg:col-span-5' : 'lg:col-span-12'
          } bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6`}
        >
          <div className="space-y-2">
            <Badge tone={passed ? 'emerald' : 'amber'}>
              {passed ? 'Memenuhi Standar (≥ 70)' : 'Perlu Ditingkatkan (< 70)'}
            </Badge>
            <h1 className="text-xl font-bold text-[#18181B] dark:text-white">Ringkasan Hasil Tes</h1>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold font-mono-tabular text-[#18181B] dark:text-white">
              {score}
            </span>
            <span className="text-lg font-semibold text-[#71717A] dark:text-slate-400">/ 100</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E5E3DC] dark:border-slate-800 text-sm">
            <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
              <span className="text-xs text-emerald-700 dark:text-emerald-300 block">Jawaban Benar</span>
              <span className="text-lg font-bold font-mono-tabular text-emerald-900 dark:text-emerald-100">
                {correctCount} Soal
              </span>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl p-3">
              <span className="text-xs text-rose-700 dark:text-rose-300 block">Jawaban Salah</span>
              <span className="text-lg font-bold font-mono-tabular text-rose-900 dark:text-rose-100">
                {wrongCount} Soal
              </span>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {showSubtests && (
          <div className="lg:col-span-7 bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="text-base font-bold text-[#18181B] dark:text-white">
                Hasil per Bagian Tes
              </h2>
              <p className="text-xs text-[#71717A] dark:text-slate-400 mt-0.5">
                Lihat bagian mana yang sudah Anda kuasai dan mana yang masih perlu diperbaiki.
              </p>
            </div>

            <div className="space-y-4">
              {Object.entries(breakdown).map(([cat, stats]) => {
                const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                const tone = pct >= 75 ? 'emerald' : pct >= 50 ? 'blue' : 'rose';
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[#18181B] dark:text-white">{cat}</span>
                      <span className="font-mono-tabular text-xs font-semibold text-[#52525B] dark:text-slate-400">
                        {stats.correct}/{stats.total} benar ({pct}%)
                      </span>
                    </div>
                    <ProgressBar value={pct} tone={tone} />
                  </div>
                );
              })}
            </div>

            {weakestSubtest && (
              <div className="pt-4 border-t border-[#E5E3DC] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Target className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#52525B] dark:text-slate-300 leading-relaxed">
                    <strong className="text-[#18181B] dark:text-white">Rekomendasi Fokus:</strong>{' '}
                    Bagian <strong>{weakestSubtest.name}</strong> masih di angka{' '}
                    <span className="font-mono-tabular font-semibold">{weakestSubtest.pct}%</span>{' '}
                    ({weakestSubtest.total - weakestSubtest.correct} soal perlu diperbaiki).
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="shrink-0"
                  onClick={() => {
                    setFilterMode('wrong');
                    setSelectedSubtest(weakestSubtest.name);
                    document
                      .getElementById('quiz-review-section')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Fokus Soal {weakestSubtest.name}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tantang Teman 1v1 & Bagikan Skor */}
      {quizId && (() => {
        const duelChallenge = getActiveChallengeForQuiz(quizId);
        const duelResult = duelChallenge
          ? evaluateChallengeOutcome(score, duelChallenge)
          : null;
        return (
          <div className="space-y-4">
            {duelChallenge && duelResult && (
              <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      tone={
                        duelResult.outcome === 'win'
                          ? 'emerald'
                          : duelResult.outcome === 'draw'
                            ? 'blue'
                            : 'amber'
                      }
                    >
                      Hasil Duel 1v1
                    </Badge>
                    <span className="text-xs font-bold text-[#18181B] dark:text-white">
                      {duelResult.headline}
                    </span>
                  </div>
                  <p className="text-xs text-[#71717A] dark:text-slate-400">
                    Skor Anda: <strong className="font-mono-tabular">{score}/100</strong> vs{' '}
                    <strong>{duelChallenge.challenger}</strong>:{' '}
                    <strong className="font-mono-tabular">{duelChallenge.targetScore}/100</strong>
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-[#18181B] dark:text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#0F766E]" />
              Tantang Teman 1v1 &amp; Bagikan Skor
            </h2>
            <p className="text-xs text-[#71717A] dark:text-slate-400">
              Bagikan skor Anda ({score}/100) atau kirim tautan tantangan 1v1 agar teman mencoba mengalahkan rekor Anda.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                const url = buildChallengeUrl(
                  window.location.origin,
                  quizId,
                  score,
                  user?.full_name || 'Teman'
                );
                navigator.clipboard?.writeText(url);
                setCopiedChallenge(true);
                setTimeout(() => setCopiedChallenge(false), 2500);
              }}
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedChallenge ? 'Link Tantangan Disalin!' : 'Salin Link Tantangan 1v1'}
            </Button>
            <a
              href={buildWhatsAppShareUrl(
                `Saya meraih skor ${score}/100 di ${quizMeta?.title ?? 'Simulasi LokaTalenta'}! Berani kalahkan skor saya? ${buildChallengeUrl(
                  typeof window !== 'undefined' ? window.location.origin : 'https://lokatalenta.vercel.app',
                  quizId,
                  score,
                  user?.full_name || 'Teman'
                )}`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              Bagikan ke WhatsApp
            </a>
            <a
              href={buildLinkedInShareUrl(
                buildChallengeUrl(
                  typeof window !== 'undefined' ? window.location.origin : 'https://lokatalenta.vercel.app',
                  quizId,
                  score,
                  user?.full_name || 'Teman'
                )
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0A66C2] hover:bg-[#004182] text-white transition-colors"
            >
              Bagikan ke LinkedIn
            </a>
          </div>
        </div>
          </div>
        );
      })()}

      {/* Ringkasan Jawaban: Jawaban Salah & Jawaban yang Seharusnya Benar */}
      <section id="quiz-review-section" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#18181B] dark:text-white">Ringkasan Jawaban</h2>
          <p className="text-xs text-[#71717A] dark:text-slate-400">
            Menampilkan perbandingan jawaban Anda dengan jawaban yang seharusnya benar.
          </p>
        </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-[#18181B] text-white border-[#18181B]'
                  : 'bg-white text-[#52525B] border-[#E5E3DC]'
              }`}
            >
              Semua Soal ({review.length})
            </button>
            <button
              onClick={() => setFilterMode('wrong')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                filterMode === 'wrong'
                  ? 'bg-[#E11D48] text-white border-[#E11D48]'
                  : 'bg-white text-[#52525B] border-[#E5E3DC]'
              }`}
            >
              Lihat Jawaban Salah ({wrongCount})
            </button>
          </div>
        </div>

        {showSubtests && subtestEntries.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedSubtest('ALL')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
                selectedSubtest === 'ALL'
                  ? 'bg-[#0F766E] text-white border-[#0F766E]'
                  : 'bg-white dark:bg-[#161B22] text-[#52525B] dark:text-slate-300 border-[#E5E3DC] dark:border-slate-700'
              }`}
            >
              Semua Subtes
            </button>
            {subtestEntries.map(([name]) => (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedSubtest(name)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
                  selectedSubtest === name
                    ? 'bg-[#0F766E] text-white border-[#0F766E]'
                    : 'bg-white dark:bg-[#161B22] text-[#52525B] dark:text-slate-300 border-[#E5E3DC] dark:border-slate-700'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {filteredReview.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
              <p className="text-sm font-semibold text-emerald-900">
                Selamat! Tidak ada jawaban yang salah pada tes ini.
              </p>
            </div>
          ) : (
            filteredReview.map((q) => {
              const userAns = attempt.answers[q.id];
              const isCorrect = userAns === q.correct_option;
              const userOptObj = q.options.find((o) => o.key === userAns);
              const correctOptObj = q.options.find((o) => o.key === q.correct_option);

              return (
                <div
                  key={q.id}
                  className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tabular text-xs font-bold text-[#71717A]">
                        No. {q.order_index}
                      </span>
                      <Badge tone="blue">{q.category_tag}</Badge>
                    </div>
                    {isCorrect ? (
                      <Badge tone="emerald">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Benar
                      </Badge>
                    ) : (
                      <Badge tone="rose">
                        <XCircle className="w-3.5 h-3.5" />
                        Salah
                      </Badge>
                    )}
                  </div>

                  <p className="text-base font-medium text-[#18181B] dark:text-slate-100">{q.question_text}</p>
                  {q.audio_text && q.audio_lang && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if ('speechSynthesis' in window) {
                            window.speechSynthesis.cancel();
                            const u = new SpeechSynthesisUtterance(q.audio_text!);
                            u.lang = q.audio_lang!;
                            window.speechSynthesis.speak(u);
                          }
                        }}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        Putar Audio Soal
                      </Button>
                      <span className="text-xs text-[#71717A] dark:text-slate-400 italic">
                        Teks audio: &ldquo;{q.audio_text}&rdquo;
                      </span>
                    </div>
                  )}
                  {q.image_url && (
                    <div className="bg-white rounded-xl p-2 border border-[#E5E3DC] inline-block max-w-full">
                      <img
                        src={q.image_url}
                        alt="Gambar soal"
                        className="max-h-56 w-auto max-w-full rounded-lg"
                      />
                    </div>
                  )}

                  {/* Explicit Comparison: Jawaban Anda vs Seharusnya Benar */}
                  {!isCorrect && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-900">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block mb-1">
                          Jawaban Anda (Salah)
                        </span>
                        {userOptObj ? (
                          <span>
                            <strong>{userOptObj.key}.</strong> {userOptObj.text}
                          </span>
                        ) : (
                          <span className="italic">Tidak dijawab</span>
                        )}
                      </div>
                      <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                          Jawaban yang Seharusnya Benar
                        </span>
                        {correctOptObj && (
                          <span>
                            <strong>{correctOptObj.key}.</strong> {correctOptObj.text}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {isCorrect && correctOptObj && (
                    <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-sm">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                        Jawaban Anda (Benar)
                      </span>
                      <strong>{correctOptObj.key}.</strong> {correctOptObj.text}
                    </div>
                  )}

                  <div className="bg-teal-50/60 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900 rounded-xl p-4 text-sm text-[#1E293B] dark:text-slate-200 space-y-3">
                    <div>
                      <span className="font-bold text-[#0F766E] dark:text-teal-400 block text-xs uppercase tracking-wider mb-1">
                        Penjelasan
                      </span>
                      {q.explanation}
                    </div>
                    <div className="pt-2 border-t border-teal-200/70 dark:border-teal-800/70 flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const snippet =
                            q.question_text.length > 70
                              ? `${q.question_text.slice(0, 70)}...`
                              : q.question_text;
                          const optsText = q.options.map((o) => `${o.key}. ${o.text}`).join('\n');
                          navigate('/community', {
                            state: {
                              draftCategory: 'Tips Psikotes',
                              draftTitle: `[Tanya Soal ${q.category_tag}] ${snippet}`,
                              draftContent: `Halo mentor & teman-teman, saya ingin berdiskusi tentang soal ${q.category_tag} berikut:\n\n"${q.question_text}"\n\nOpsi:\n${optsText}\n\nBagian yang masih membingungkan bagi saya adalah...`,
                            },
                          });
                        }}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Tanyakan Soal Ini ke Komunitas
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

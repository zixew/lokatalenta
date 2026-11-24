import { BarChart3, ChevronRight, ClipboardList, User, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../shared/lib/supabase';
import type { Course, Question, QuizAttempt } from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { ProgressBar } from '../../shared/ui/ProgressBar';
import { computeTeacherAnalytics, type StudentProgressItem } from './teacherAnalytics';

interface TeacherAnalyticsPanelProps {
  studentProgress: StudentProgressItem[];
  courses: Course[];
}

interface ItemAnalysisRow {
  question_id: string;
  question_text: string;
  category_tag: string;
  question_type: 'mcq' | 'short_answer';
  total_answered: number;
  correct_count: number;
  correct_pct: number;
}

function readLocalAttempts(): QuizAttempt[] {
  try {
    const raw = localStorage.getItem('ruanglatih_demo_attempts_v11');
    return raw ? (JSON.parse(raw) as QuizAttempt[]) : [];
  } catch {
    return [];
  }
}

function computeLocalItemAnalysis(
  quizId: string,
  questions: Question[],
  attempts: QuizAttempt[]
): ItemAnalysisRow[] {
  const quizAttempts = attempts.filter((a) => a.quiz_id === quizId && a.submitted_at);
  return questions.map((q) => {
    let totalAnswered = 0;
    let correctCount = 0;
    for (const att of quizAttempts) {
      const ans = att.answers?.[q.id];
      if (ans !== undefined && ans !== '') {
        totalAnswered += 1;
        if (q.question_type === 'short_answer') {
          const accepted = (q.accepted_answers ?? []).map((a) =>
            q.case_sensitive ? a.trim() : a.trim().toLowerCase()
          );
          const norm = q.case_sensitive ? ans.trim() : ans.trim().toLowerCase();
          if (accepted.includes(norm)) correctCount += 1;
        } else if (ans === q.correct_option) {
          correctCount += 1;
        }
      }
    }
    const correctPct = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    return {
      question_id: q.id,
      question_text: q.question_text,
      category_tag: q.category_tag || 'Umum',
      question_type: q.question_type ?? 'mcq',
      total_answered: totalAnswered,
      correct_count: correctCount,
      correct_pct: correctPct,
    };
  });
}

export function TeacherAnalyticsPanel({ studentProgress, courses }: TeacherAnalyticsPanelProps) {
  const analytics = useMemo(
    () => computeTeacherAnalytics(studentProgress, courses),
    [studentProgress, courses]
  );

  const quizOptions = useMemo(() => {
    const list: Array<{ quizId: string; label: string; questions: Question[] }> = [];
    for (const c of courses) {
      for (const m of c.modules ?? []) {
        for (const l of m.lessons) {
          if (l.quiz && (l.quiz.questions?.length ?? 0) > 0) {
            list.push({
              quizId: l.quiz.id,
              label: `${c.title} — ${l.quiz.title}`,
              questions: l.quiz.questions ?? [],
            });
          }
        }
      }
    }
    return list;
  }, [courses]);

  const [selectedQuizId, setSelectedQuizId] = useState<string>(quizOptions[0]?.quizId ?? '');
  const [itemRows, setItemRows] = useState<ItemAnalysisRow[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentProgressItem | null>(null);

  const activeQuiz = quizOptions.find((q) => q.quizId === selectedQuizId) ?? quizOptions[0];

  useEffect(() => {
    if (!activeQuiz) return;
    let cancelled = false;

    async function loadItemAnalysis(quiz: NonNullable<typeof activeQuiz>) {
      setLoadingItems(true);
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase.rpc('get_quiz_item_analysis', {
            p_quiz_id: quiz.quizId,
          });
          if (!error && Array.isArray(data) && !cancelled) {
            const qMap = new Map(quiz.questions.map((q) => [q.id, q]));
            const mapped: ItemAnalysisRow[] = data.map((row: Record<string, unknown>) => {
              const qId = String(row.question_id ?? '');
              const q = qMap.get(qId);
              const total = Number(row.total_answered ?? row.attempts_count ?? 0);
              const correct = Number(row.correct_count ?? 0);
              const pct =
                row.correct_pct !== undefined
                  ? Math.round(Number(row.correct_pct))
                  : total > 0
                  ? Math.round((correct / total) * 100)
                  : 0;
              return {
                question_id: qId,
                question_text: String(row.question_text ?? q?.question_text ?? 'Soal'),
                category_tag: String(row.category_tag ?? q?.category_tag ?? 'Umum'),
                question_type: (q?.question_type ?? 'mcq') as 'mcq' | 'short_answer',
                total_answered: total,
                correct_count: correct,
                correct_pct: pct,
              };
            });
            setItemRows(mapped);
            setLoadingItems(false);
            return;
          }
        } catch {
          // fall through to local computation
        }
      }

      if (!cancelled) {
        const localAttempts = readLocalAttempts();
        setItemRows(computeLocalItemAnalysis(quiz.quizId, quiz.questions, localAttempts));
        setLoadingItems(false);
      }
    }

    void loadItemAnalysis(activeQuiz);
    return () => {
      cancelled = true;
    };
  }, [activeQuiz]);

  const displayedItemRows = activeQuiz ? itemRows : [];

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#0F766E]" />
              Analitik Kelulusan, Drop-Off &amp; Distribusi Soal
            </h2>
            <p className="text-xs text-[#71717A] dark:text-slate-400 mt-0.5">
              Pantau tingkat kelulusan tes, retensi modul siswa, dan cakupan kategori bank soal Anda.
            </p>
          </div>
          <Badge tone="blue">{analytics.testedCount} Sudah Tes</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-800">
            <div className="text-[11px] text-[#71717A] dark:text-slate-400">Total Enrollment</div>
            <div className="text-xl font-bold font-mono-tabular text-[#18181B] dark:text-white mt-0.5">
              {analytics.totalEnrollments}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-800">
            <div className="text-[11px] text-[#71717A] dark:text-slate-400">Tingkat Kelulusan (≥70%)</div>
            <div className="text-xl font-bold font-mono-tabular text-emerald-700 dark:text-emerald-400 mt-0.5">
              {analytics.passRatePct}%
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-800">
            <div className="text-[11px] text-[#71717A] dark:text-slate-400">Rata-rata Nilai Tes</div>
            <div className="text-xl font-bold font-mono-tabular text-[#0F766E] dark:text-teal-400 mt-0.5">
              {analytics.avgScore}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-800">
            <div className="text-[11px] text-[#71717A] dark:text-slate-400">Rata-rata Progres Materi</div>
            <div className="text-xl font-bold font-mono-tabular text-[#18181B] dark:text-white mt-0.5">
              {analytics.avgCompletionPct}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-[#E5E3DC] dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#71717A] dark:text-slate-400">
              Funnel Progres &amp; Drop-off per Kursus
            </h3>
            {analytics.courseFunnels.length === 0 ? (
              <p className="text-xs text-[#71717A] dark:text-slate-400">Belum ada data progres siswa.</p>
            ) : (
              <div className="space-y-3">
                {analytics.courseFunnels.map((item) => (
                  <div key={item.courseTitle} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#18181B] dark:text-white truncate pr-2">
                        {item.courseTitle}
                      </span>
                      <span className="font-mono-tabular text-[#71717A] dark:text-slate-400 shrink-0">
                        Avg {item.avgCompletionPct}% ({item.totalStudents} siswa)
                      </span>
                    </div>
                    <ProgressBar
                      value={item.avgCompletionPct}
                      tone={item.avgCompletionPct >= 70 ? 'emerald' : item.avgCompletionPct >= 35 ? 'blue' : 'amber'}
                    />
                    <div className="flex flex-wrap gap-2 text-[11px] text-[#71717A] dark:text-slate-400">
                      <span>0–25%: {item.earlyDropoff}</span>
                      <span>26–75%: {item.midProgress}</span>
                      <span>76–100%: {item.nearOrDone}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-[#E5E3DC] dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#71717A] dark:text-slate-400">
              Distribusi Kategori Bank Soal
            </h3>
            {analytics.categoryBreakdown.length === 0 ? (
              <p className="text-xs text-[#71717A] dark:text-slate-400">Belum ada soal terdata.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {analytics.categoryBreakdown.map((cat) => (
                  <div
                    key={cat.category}
                    className="px-3 py-2 rounded-xl bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-800 flex items-center gap-2 text-xs"
                  >
                    <span className="font-semibold text-[#18181B] dark:text-white">{cat.category}</span>
                    <Badge tone="slate">{cat.count} soal</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analitik Butir Soal (Item Analysis) */}
      <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#18181B] dark:text-white flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#0F766E]" />
              Analitik Butir Soal (Item Analysis)
            </h3>
            <p className="text-xs text-[#71717A] dark:text-slate-400 mt-0.5">
              Evaluasi tingkat kesulitan dan persentase jawaban benar per butir soal.
            </p>
          </div>
          {quizOptions.length > 0 && (
            <select
              value={activeQuiz?.quizId ?? ''}
              onChange={(e) => setSelectedQuizId(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-[#F6F5F1] dark:bg-slate-800 text-[#18181B] dark:text-white max-w-xs"
            >
              {quizOptions.map((opt) => (
                <option key={opt.quizId} value={opt.quizId}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {quizOptions.length === 0 ? (
          <p className="text-xs text-[#71717A] dark:text-slate-400">
            Belum ada kuis dengan bank soal pada kursus Anda.
          </p>
        ) : loadingItems ? (
          <p className="text-xs text-[#71717A] dark:text-slate-400">Memuat analitik butir soal...</p>
        ) : displayedItemRows.length === 0 ? (
          <p className="text-xs text-[#71717A] dark:text-slate-400">Belum ada butir soal pada kuis ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E5E3DC] dark:border-slate-800 text-[#71717A] dark:text-slate-400">
                  <th className="py-2 pr-3 font-semibold">#</th>
                  <th className="py-2 pr-3 font-semibold">Pertanyaan</th>
                  <th className="py-2 pr-3 font-semibold">Kategori</th>
                  <th className="py-2 pr-3 font-semibold">Dijawab</th>
                  <th className="py-2 pr-3 font-semibold">Benar</th>
                  <th className="py-2 font-semibold">Tingkat Kesulitan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E3DC] dark:divide-slate-800">
                {displayedItemRows.map((row, idx) => {
                  const difficulty =
                    row.total_answered === 0
                      ? { label: 'Belum Ada Data', tone: 'slate' as const }
                      : row.correct_pct >= 75
                      ? { label: 'Mudah', tone: 'emerald' as const }
                      : row.correct_pct >= 40
                      ? { label: 'Sedang', tone: 'amber' as const }
                      : { label: 'Sulit', tone: 'rose' as const };
                  return (
                    <tr key={row.question_id} className="hover:bg-[#F6F5F1]/60 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 pr-3 font-mono-tabular text-[#71717A]">{idx + 1}</td>
                      <td className="py-2.5 pr-3 max-w-md">
                        <p className="text-[#18181B] dark:text-white line-clamp-1">
                          {row.question_text}
                        </p>
                      </td>
                      <td className="py-2.5 pr-3">
                        <Badge tone="slate">{row.category_tag}</Badge>
                      </td>
                      <td className="py-2.5 pr-3 font-mono-tabular text-[#52525B] dark:text-slate-300">
                        {row.total_answered}
                      </td>
                      <td className="py-2.5 pr-3 font-mono-tabular font-semibold text-[#18181B] dark:text-white">
                        {row.total_answered > 0 ? `${row.correct_pct}% (${row.correct_count})` : '—'}
                      </td>
                      <td className="py-2.5">
                        <Badge tone={difficulty.tone}>{difficulty.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clickable Student Drill-Down List */}
      <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#18181B] dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-[#0F766E]" />
              Ringkasan Siswa (Klik untuk Detail)
            </h3>
            <p className="text-xs text-[#71717A] dark:text-slate-400 mt-0.5">
              Klik baris siswa untuk melihat detail progres materi dan status kelulusan.
            </p>
          </div>
          <Badge tone="slate">{studentProgress.length} entri</Badge>
        </div>

        {studentProgress.length === 0 ? (
          <p className="text-xs text-[#71717A] dark:text-slate-400">Belum ada data siswa.</p>
        ) : (
          <div className="divide-y divide-[#E5E3DC] dark:divide-slate-800 max-h-64 overflow-y-auto">
            {studentProgress.map((st, idx) => {
              const pct =
                st.total_lessons > 0
                  ? Math.round((st.completed_lessons / st.total_lessons) * 100)
                  : 0;
              return (
                <button
                  key={`${st.student_email}-${st.course_title}-${idx}`}
                  type="button"
                  onClick={() => setSelectedStudent(st)}
                  className="w-full py-2.5 px-2 flex items-center justify-between gap-3 text-left hover:bg-[#F6F5F1] dark:hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#18181B] dark:text-white truncate">
                      {st.student_name}
                    </p>
                    <p className="text-[11px] text-[#71717A] dark:text-slate-400 truncate">
                      {st.course_title} • {st.student_email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono-tabular text-[#52525B] dark:text-slate-300">
                      {pct}%
                    </span>
                    <Badge
                      tone={
                        st.latest_quiz_score === null
                          ? 'slate'
                          : st.latest_quiz_score >= 70
                          ? 'emerald'
                          : 'amber'
                      }
                    >
                      {st.latest_quiz_score !== null ? `Nilai ${st.latest_quiz_score}` : 'Belum Tes'}
                    </Badge>
                    <ChevronRight className="w-3.5 h-3.5 text-[#71717A]" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Student Drill-Down Modal */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-base font-bold text-[#18181B] dark:text-white">
                  {selectedStudent.student_name}
                </h4>
                <p className="text-xs text-[#71717A] dark:text-slate-400">
                  {selectedStudent.student_email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded-lg text-[#71717A] hover:text-[#18181B] dark:hover:text-white cursor-pointer"
                aria-label="Tutup detail siswa"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-[#71717A] dark:text-slate-400">Kursus</span>
                <span className="font-semibold text-[#18181B] dark:text-white text-right">
                  {selectedStudent.course_title}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#71717A] dark:text-slate-400">Materi Selesai</span>
                <span className="font-mono-tabular font-semibold text-[#18181B] dark:text-white">
                  {selectedStudent.completed_lessons} / {selectedStudent.total_lessons}
                </span>
              </div>
              <ProgressBar
                value={
                  selectedStudent.total_lessons > 0
                    ? Math.round(
                        (selectedStudent.completed_lessons / selectedStudent.total_lessons) * 100
                      )
                    : 0
                }
                tone="emerald"
              />
              <div className="flex justify-between gap-2 pt-1">
                <span className="text-[#71717A] dark:text-slate-400">Nilai Kuis Terakhir</span>
                <Badge
                  tone={
                    selectedStudent.latest_quiz_score === null
                      ? 'slate'
                      : selectedStudent.latest_quiz_score >= 70
                      ? 'emerald'
                      : 'rose'
                  }
                >
                  {selectedStudent.latest_quiz_score !== null
                    ? `${selectedStudent.latest_quiz_score} (${
                        selectedStudent.latest_quiz_score >= 70 ? 'Lulus' : 'Perlu Pendalaman'
                      })`
                    : 'Belum Mengikuti Tes'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

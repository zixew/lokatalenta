import { BarChart3 } from 'lucide-react';
import { useMemo } from 'react';
import type { Course } from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { ProgressBar } from '../../shared/ui/ProgressBar';
import { computeTeacherAnalytics, type StudentProgressItem } from './teacherAnalytics';

interface TeacherAnalyticsPanelProps {
  studentProgress: StudentProgressItem[];
  courses: Course[];
}

export function TeacherAnalyticsPanel({ studentProgress, courses }: TeacherAnalyticsPanelProps) {
  const analytics = useMemo(
    () => computeTeacherAnalytics(studentProgress, courses),
    [studentProgress, courses]
  );

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
    </div>
  );
}

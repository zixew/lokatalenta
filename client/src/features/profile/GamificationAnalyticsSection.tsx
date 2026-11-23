import { useQuery } from '@tanstack/react-query';
import { Award, Download, Flame, Medal, Target, TrendingUp, Trophy } from 'lucide-react';
import { useState } from 'react';
import { lmsApi } from '../../shared/services/lmsApi';
import type { QuizAttempt } from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { ProgressBar } from '../../shared/ui/ProgressBar';
import { useAuthStore } from '../auth/useAuthStore';
import { buildAttemptsCsv, computeGamificationStats } from './gamification';

export function GamificationAnalyticsSection({
  attempts,
  completedLessonsCount,
  enrolledCount,
  quizTitleMap,
}: {
  attempts: QuizAttempt[];
  completedLessonsCount: number;
  enrolledCount: number;
  quizTitleMap: Record<string, string>;
}) {
  const { user } = useAuthStore();
  const [weeklyGoal, setWeeklyGoal] = useState(() =>
    user ? lmsApi.getWeeklyGoal(user.id) : 5
  );

  const { data: rawLeaderboard = [] } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => lmsApi.listLeaderboard(),
  });

  const stats = computeGamificationStats(attempts, completedLessonsCount, enrolledCount);
  const passedQuizzesCount = attempts.filter((a) => (a.score ?? 0) >= 70).length;
  const leaderboard = (() => {
    if (!user || user.role !== 'student') return rawLeaderboard;
    const currentEntry = {
      user_id: user.id,
      full_name: user.full_name,
      xp: stats.xp,
      level: stats.level,
      completed_lessons: completedLessonsCount,
      passed_quizzes: passedQuizzesCount,
    };
    const filtered = rawLeaderboard.filter((e) => e.user_id !== user.id);
    return [...filtered, currentEntry].sort((a, b) => b.xp - a.xp);
  })();
  const weeklyDone = completedLessonsCount + attempts.length;
  const weeklyPct = Math.min(100, Math.round((weeklyDone / Math.max(1, weeklyGoal)) * 100));

  const recentAttempts = [...attempts]
    .filter((a) => a.submitted_at && a.score !== null)
    .slice(0, 8)
    .reverse();

  const handleGoalChange = (nextGoal: number) => {
    setWeeklyGoal(nextGoal);
    if (user) lmsApi.saveWeeklyGoal(user.id, nextGoal);
  };

  const handleExportCsv = () => {
    const csv = buildAttemptsCsv(attempts, quizTitleMap);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `riwayat-nilai-ruanglatih-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Gamification XP, Level & Streak */}
      <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#18181B] dark:text-white">
                Level {stats.level} • {stats.xp} XP
              </h2>
              <p className="text-xs text-[#71717A] dark:text-slate-400">
                Menuju Level {stats.level + 1} ({stats.nextLevelXp} XP)
              </p>
            </div>
          </div>

          <Badge tone="amber" className="py-1.5 px-3">
            <Flame className="w-3.5 h-3.5" />
            Streak: {stats.streakDays} hari
          </Badge>
        </div>

        <ProgressBar value={stats.levelProgressPct} tone="emerald" />

        {/* Weekly Learning Goal */}
        <div className="p-4 rounded-xl bg-[#F6F5F1] dark:bg-slate-800/60 border border-[#E5E3DC] dark:border-slate-700 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#18181B] dark:text-white inline-flex items-center gap-1.5">
              <Target className="w-4 h-4 text-[#0F766E]" />
              Target Belajar Mingguan: {weeklyDone} / {weeklyGoal} aktivitas
            </span>
            <select
              aria-label="Ubah target mingguan"
              value={weeklyGoal}
              onChange={(e) => handleGoalChange(Number(e.target.value))}
              className="px-2.5 py-1 text-xs rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-[#161B22]"
            >
              {[3, 5, 10, 15].map((g) => (
                <option key={g} value={g}>
                  Target {g} aktivitas
                </option>
              ))}
            </select>
          </div>
          <ProgressBar value={weeklyPct} tone="blue" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {stats.badges.map((b) => (
            <div
              key={b.id}
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                b.unlocked
                  ? 'bg-teal-50/60 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800'
                  : 'bg-[#F6F5F1] dark:bg-slate-800/40 border-[#E5E3DC] dark:border-slate-800 opacity-60'
              }`}
            >
              <Award
                className={`w-4 h-4 mt-0.5 shrink-0 ${
                  b.unlocked ? 'text-[#0F766E] dark:text-teal-400' : 'text-slate-400'
                }`}
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#18181B] dark:text-white">{b.label}</p>
                <p className="text-[11px] text-[#71717A] dark:text-slate-400">{b.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
            <Medal className="w-4 h-4 text-amber-500" />
            Papan Peringkat Pelajar (Leaderboard)
          </h2>
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((entry, idx) => {
              const isMe = entry.user_id === user?.id;
              return (
                <div
                  key={entry.user_id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                    isMe
                      ? 'bg-teal-50/60 dark:bg-teal-950/20 border-[#0F766E]/40'
                      : 'bg-[#F6F5F1] dark:bg-slate-800/50 border-[#E5E3DC] dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-[#0F766E] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#18181B] dark:text-white truncate">
                        {entry.full_name} {isMe ? '(Anda)' : ''}
                      </p>
                      <p className="text-[11px] text-[#71717A] dark:text-slate-400">
                        Level {entry.level} • {entry.completed_lessons} materi • {entry.passed_quizzes} tes lulus
                      </p>
                    </div>
                  </div>
                  <Badge tone="emerald">{entry.xp} XP</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Score Trend & CSV Export */}
      <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#0F766E]" />
            Tren Nilai Latihan Soal
          </h2>
          {attempts.length > 0 && (
            <Button variant="secondary" size="sm" onClick={handleExportCsv}>
              <Download className="w-3.5 h-3.5" />
              Ekspor Nilai (CSV)
            </Button>
          )}
        </div>

        {recentAttempts.length === 0 ? (
          <p className="text-xs text-[#71717A] dark:text-slate-400">
            Kerjakan latihan soal untuk melihat grafik perkembangan skor Anda.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 items-end h-36 pt-4">
            {recentAttempts.map((att, i) => {
              const score = att.score ?? 0;
              return (
                <div key={att.id} className="flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[11px] font-mono-tabular font-bold text-[#18181B] dark:text-white">
                    {score}%
                  </span>
                  <div className="w-full max-w-[36px] bg-[#F6F5F1] dark:bg-slate-800 rounded-t-lg overflow-hidden h-24 flex items-end">
                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        score >= 70 ? 'bg-[#0F766E]' : 'bg-amber-500'
                      }`}
                      style={{ height: `${Math.max(8, score)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#71717A] dark:text-slate-400">
                    Tes {i + 1}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

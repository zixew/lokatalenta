import type { QuizAttempt } from '../../shared/types/lms';

export interface AchievementBadge {
  id: string;
  label: string;
  description: string;
  unlocked: boolean;
}

export interface GamificationStats {
  xp: number;
  level: number;
  levelProgressPct: number;
  nextLevelXp: number;
  streakDays: number;
  badges: AchievementBadge[];
}

export function computeGamificationStats(
  attempts: QuizAttempt[],
  completedLessonsCount: number,
  enrolledCount: number
): GamificationStats {
  const passedCount = attempts.filter((a) => (a.score ?? 0) >= 70).length;
  const xp = completedLessonsCount * 20 + attempts.length * 40 + passedCount * 35;
  const level = Math.floor(xp / 200) + 1;
  const currentFloor = (level - 1) * 200;
  const nextLevelXp = level * 200;
  const levelProgressPct = Math.min(100, Math.round(((xp - currentFloor) / 200) * 100));

  // Compute consecutive active days from attempt timestamps
  const activeDayKeys = new Set(
    attempts
      .filter((a) => a.submitted_at)
      .map((a) => new Date(a.submitted_at!).toISOString().slice(0, 10))
  );
  let streakDays = activeDayKeys.size > 0 ? 1 : 0;
  if (activeDayKeys.size > 1) {
    const sortedDays = Array.from(activeDayKeys).sort().reverse();
    let run = 1;
    for (let i = 0; i < sortedDays.length - 1; i += 1) {
      const d1 = new Date(sortedDays[i]).getTime();
      const d2 = new Date(sortedDays[i + 1]).getTime();
      const diffDays = Math.round((d1 - d2) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) run += 1;
      else break;
    }
    streakDays = run;
  }

  const badges: AchievementBadge[] = [
    {
      id: 'first-course',
      label: 'Langkah Pertama',
      description: 'Mendaftar minimal 1 kursus terstruktur',
      unlocked: enrolledCount >= 1,
    },
    {
      id: 'active-learner',
      label: 'Pembelajar Aktif',
      description: 'Menyelesaikan minimal 5 materi',
      unlocked: completedLessonsCount >= 5,
    },
    {
      id: 'quiz-champion',
      label: 'Penakluk Tes',
      description: 'Lulus minimal 1 latihan soal (skor ≥ 70%)',
      unlocked: passedCount >= 1,
    },
    {
      id: 'high-achiever',
      label: 'Skor Unggul',
      description: 'Meraih skor ≥ 90% pada latihan soal',
      unlocked: attempts.some((a) => (a.score ?? 0) >= 90),
    },
  ];

  return {
    xp,
    level,
    levelProgressPct,
    nextLevelXp,
    streakDays,
    badges,
  };
}

export function buildAttemptsCsv(
  attempts: QuizAttempt[],
  quizTitleMap: Record<string, string>
): string {
  const header = ['Tanggal', 'Latihan Soal', 'Skor (%)', 'Status'].join(',');
  const rows = attempts.map((a) => {
    const dateStr = a.submitted_at
      ? new Date(a.submitted_at).toLocaleDateString('id-ID')
      : '-';
    const title = (quizTitleMap[a.quiz_id] ?? a.quiz_id).replaceAll('"', '""');
    const score = a.score ?? 0;
    const status = score >= 70 ? 'Lulus' : 'Perlu Latihan';
    return `"${dateStr}","${title}",${score},"${status}"`;
  });
  return [header, ...rows].join('\n');
}

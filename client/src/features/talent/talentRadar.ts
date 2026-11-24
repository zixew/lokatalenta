import type { KraepelinAttemptRecord } from '../kraepelin/kraepelinHistory';
import type { QuizAttempt } from '../../shared/types/lms';

export interface TalentRadarDimension {
  key: 'verbal' | 'numerik' | 'logika' | 'kraepelin' | 'materi';
  label: string;
  score: number;
  drillPath: string;
}

export interface TalentRadarMetrics {
  dimensions: TalentRadarDimension[];
  overallIndex: number;
  readinessBadge: 'Starter' | 'Job-Ready' | 'Top Talent';
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function avgBucketScore(
  categoryScores: Record<string, number>,
  keywords: string[],
  fallbackScore: number
): number {
  const matched: number[] = [];
  for (const [key, pct] of Object.entries(categoryScores)) {
    const lower = key.toLowerCase();
    if (keywords.some((kw) => lower.includes(kw))) {
      matched.push(pct);
    }
  }
  if (matched.length === 0) return clampScore(fallbackScore);
  return clampScore(matched.reduce((a, b) => a + b, 0) / matched.length);
}

export function extractCategoryScoresFromAttempts(
  attempts: QuizAttempt[]
): Record<string, number> {
  const totals: Record<string, { correct: number; total: number }> = {};

  for (const att of attempts) {
    if (!att.submitted_at || !att.category_breakdown) continue;
    for (const [cat, stats] of Object.entries(att.category_breakdown)) {
      if (!totals[cat]) totals[cat] = { correct: 0, total: 0 };
      totals[cat].correct += stats.correct ?? 0;
      totals[cat].total += stats.total ?? 0;
    }
  }

  const result: Record<string, number> = {};
  for (const [cat, stats] of Object.entries(totals)) {
    result[cat] = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  }
  return result;
}

export function computeTalentRadarMetrics(input: {
  categoryScores: Record<string, number>;
  avgQuizScore: number;
  kraepelinHistory?: KraepelinAttemptRecord[];
  kraepelinSummary?: { best_stability: number; avg_accuracy_pct: number; total_runs: number };
  completedLessonsCount: number;
  certificatesCount: number;
}): TalentRadarMetrics {
  const submittedQuizBase = input.avgQuizScore > 0 ? input.avgQuizScore * 0.7 : 0;

  const verbal = avgBucketScore(
    input.categoryScores,
    ['verbal', 'sinonim', 'antonim', 'analogi', 'wacana', 'bahasa'],
    submittedQuizBase
  );

  const numerik = avgBucketScore(
    input.categoryScores,
    ['numerik', 'aritmatika', 'deret', 'kuantitatif', 'hitung', 'excel'],
    submittedQuizBase
  );

  const logika = avgBucketScore(
    input.categoryScores,
    ['logika', 'silogisme', 'penalaran', 'spasial', 'analitik'],
    submittedQuizBase
  );

  let kraepelinScore = 0;
  if (input.kraepelinSummary && input.kraepelinSummary.total_runs > 0) {
    kraepelinScore = clampScore(
      input.kraepelinSummary.avg_accuracy_pct * 0.6 +
        input.kraepelinSummary.best_stability * 0.4
    );
  } else if (input.kraepelinHistory && input.kraepelinHistory.length > 0) {
    const avgAcc =
      input.kraepelinHistory.reduce((s, r) => s + r.accuracy_pct, 0) /
      input.kraepelinHistory.length;
    const bestStab = Math.max(...input.kraepelinHistory.map((r) => r.stability_score));
    kraepelinScore = clampScore(avgAcc * 0.6 + bestStab * 0.4);
  }

  const materiScore = clampScore(
    Math.min(65, input.completedLessonsCount * 8) +
      Math.min(35, input.certificatesCount * 20)
  );

  const dimensions: TalentRadarDimension[] = [
    { key: 'verbal', label: 'Verbal', score: verbal, drillPath: '/?q=Verbal' },
    { key: 'numerik', label: 'Numerik', score: numerik, drillPath: '/?q=Aritmatika' },
    { key: 'logika', label: 'Logika & Spasial', score: logika, drillPath: '/?q=Logika' },
    { key: 'kraepelin', label: 'Kraepelin', score: kraepelinScore, drillPath: '/kraepelin' },
    { key: 'materi', label: 'Bahasa & Materi', score: materiScore, drillPath: '/' },
  ];

  const overallIndex = clampScore(
    dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length
  );

  const readinessBadge: TalentRadarMetrics['readinessBadge'] =
    overallIndex >= 80 ? 'Top Talent' : overallIndex >= 60 ? 'Job-Ready' : 'Starter';

  return {
    dimensions,
    overallIndex,
    readinessBadge,
  };
}

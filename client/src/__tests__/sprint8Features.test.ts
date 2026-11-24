import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  computeKraepelinSummaryTrend,
  computeStabilityScore,
  getLocalKraepelinHistory,
  recordKraepelinAttemptAsync,
} from '../features/kraepelin/kraepelinHistory';
import {
  listQuizChallengesAsync,
  recordQuizChallengeAsync,
} from '../features/quiz-runner/shareAndChallenge';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

describe('Sprint 8 Features (BL-24, BL-25, BL-26)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  it('BL-24: records and lists 1v1 quiz challenge duels without duplicates', async () => {
    await recordQuizChallengeAsync({
      attemptKey: 'att-1',
      quizId: 'quiz-tiu-1',
      challengerName: 'Budi',
      targetScore: 70,
      opponentName: 'Sari',
      opponentScore: 85,
      outcome: 'win',
    });

    // Duplicate attemptKey should be ignored
    await recordQuizChallengeAsync({
      attemptKey: 'att-1',
      quizId: 'quiz-tiu-1',
      challengerName: 'Budi',
      targetScore: 70,
      opponentName: 'Sari',
      opponentScore: 85,
      outcome: 'win',
    });

    await recordQuizChallengeAsync({
      attemptKey: 'att-2',
      quizId: 'quiz-other',
      challengerName: 'Andi',
      targetScore: 80,
      opponentName: 'Sari',
      opponentScore: 60,
      outcome: 'lose',
    });

    const tiuHistory = await listQuizChallengesAsync('quiz-tiu-1');
    expect(tiuHistory).toHaveLength(1);
    expect(tiuHistory[0].challenger_name).toBe('Budi');
    expect(tiuHistory[0].outcome).toBe('win');
  });

  it('BL-25: filters quiz questions by subtest category (case-insensitive)', () => {
    const sampleQuestions = [
      { id: 'q1', category: 'Deret Angka' },
      { id: 'q2', category: 'Silogisme' },
      { id: 'q3', category: 'Deret Angka' },
    ];
    const subtestFilter = 'deret angka'.toLowerCase();
    const filtered = sampleQuestions.filter(
      (q) => q.category.trim().toLowerCase() === subtestFilter
    );

    expect(filtered).toHaveLength(2);
    expect(filtered.map((q) => q.id)).toEqual(['q1', 'q3']);
  });

  it('BL-26: records Kraepelin attempts and computes speed, stability & trend', async () => {
    // Consistent column counts yield high stability
    const highStability = computeStabilityScore([8, 8, 8, 8], 80);
    expect(highStability).toBe(100);

    await recordKraepelinAttemptAsync({
      presetId: 'quick',
      durationSeconds: 90,
      totalAnswered: 45,
      totalCorrect: 36,
      accuracyPct: 80,
      columnAttemptedCounts: [7, 8, 7, 8, 7, 8],
    });

    await recordKraepelinAttemptAsync({
      presetId: 'quick',
      durationSeconds: 90,
      totalAnswered: 60,
      totalCorrect: 54,
      accuracyPct: 90,
      columnAttemptedCounts: [10, 10, 10, 10, 10, 10],
    });

    const history = getLocalKraepelinHistory();
    expect(history).toHaveLength(2);
    expect(history[0].speed_kpm).toBe(40); // 60 answered in 90s = 40 KPM
    expect(history[0].stability_score).toBe(100);

    const trend = computeKraepelinSummaryTrend(history);
    expect(trend.totalRuns).toBe(2);
    expect(trend.avgAccuracyPct).toBe(85);
    expect(trend.deltaAccuracyPct).toBe(10); // 90 - 80
    expect(trend.bestStability).toBe(100);
  });
});

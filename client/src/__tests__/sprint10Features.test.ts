import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getPassportVisibilityLocal,
  getTalentPassportAsync,
  setPassportVisibilityAsync,
} from '../features/talent/talentApi';
import {
  computeTalentRadarMetrics,
  extractCategoryScoresFromAttempts,
} from '../features/talent/talentRadar';
import type { QuizAttempt } from '../shared/types/lms';

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

describe('Sprint 10 Major v2.0.0 Features (BL-30, BL-31, BL-32)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  it('BL-30: computes 5D Competency Radar metrics and readiness badge accurately', () => {
    const attempts: QuizAttempt[] = [
      {
        id: 'att-1',
        user_id: 'u-1',
        quiz_id: 'q-1',
        started_at: '2026-11-24T00:00:00Z',
        submitted_at: '2026-11-24T00:10:00Z',
        answers: {},
        score: 85,
        category_breakdown: {
          Verbal: { correct: 9, total: 10 },
          Aritmatika: { correct: 8, total: 10 },
          'Penalaran Logika': { correct: 8, total: 10 },
        },
      },
    ];

    const categoryScores = extractCategoryScoresFromAttempts(attempts);
    expect(categoryScores.Verbal).toBe(90);
    expect(categoryScores.Aritmatika).toBe(80);

    const radar = computeTalentRadarMetrics({
      categoryScores,
      avgQuizScore: 85,
      kraepelinSummary: {
        best_stability: 90,
        avg_accuracy_pct: 88,
        total_runs: 2,
      },
      completedLessonsCount: 8,
      certificatesCount: 2,
    });

    expect(radar.dimensions).toHaveLength(5);
    expect(radar.overallIndex).toBeGreaterThanOrEqual(80);
    expect(radar.readinessBadge).toBe('Top Talent');
  });

  it('BL-31: respects opt-in passport visibility toggle and loads public passport', async () => {
    expect(getPassportVisibilityLocal('u-demo-1')).toBe(true);

    const publicPassport = await getTalentPassportAsync('u-demo-1');
    expect(publicPassport).not.toBeNull();
    expect(publicPassport?.user_id).toBe('u-demo-1');

    await setPassportVisibilityAsync('u-demo-1', false);
    expect(getPassportVisibilityLocal('u-demo-1')).toBe(false);

    const hiddenPassport = await getTalentPassportAsync('u-demo-1');
    expect(hiddenPassport).toBeNull();
  });
});

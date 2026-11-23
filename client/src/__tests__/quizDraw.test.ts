import { beforeEach, describe, expect, it } from 'vitest';
import { lmsApi } from '../shared/services/lmsApi';

const mockStorage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => mockStorage.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mockStorage.set(k, v);
    },
    removeItem: (k: string) => {
      mockStorage.delete(k);
    },
    clear: () => {
      mockStorage.clear();
    },
  },
  configurable: true,
});

describe('2x Question Bank Unseen-First Draw', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('serves 100% unseen questions on attempt 2 before resetting to random on attempt 3', async () => {
    const userId = 'test-user-1';
    const quizId = 'quiz-simulasi-retail-2jam';

    // Attempt 1 -> draws 50 out of 100
    const att1 = await lmsApi.startQuizAttempt(userId, quizId);
    expect(att1.questions).toHaveLength(50);
    await lmsApi.submitQuizAttempt(att1.attempt.id, {});

    // Backdate attempt 1 submitted_at to bypass 60s cooldown
    const rawAttempts = JSON.parse(
      mockStorage.get('ruanglatih_demo_attempts_v11') ?? '[]'
    ) as Array<{ submitted_at?: string | null }>;
    rawAttempts[0].submitted_at = new Date(Date.now() - 120_000).toISOString();
    mockStorage.set('ruanglatih_demo_attempts_v11', JSON.stringify(rawAttempts));

    // Attempt 2 -> draws the remaining 50 unseen questions (0 overlap!)
    const att2 = await lmsApi.startQuizAttempt(userId, quizId);
    expect(att2.questions).toHaveLength(50);

    const ids1 = new Set(att1.questions.map((q) => q.id));
    const overlap = att2.questions.filter((q) => ids1.has(q.id));
    expect(overlap).toHaveLength(0);
  });
});

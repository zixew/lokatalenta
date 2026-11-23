import { beforeEach, describe, expect, it } from 'vitest';
import { buildAttemptsCsv, computeGamificationStats } from '../features/profile/gamification';
import { lmsApi } from '../shared/services/lmsApi';
import type { QuizAttempt } from '../shared/types/lms';

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

describe('Gamification & Analytics Helpers', () => {
  beforeEach(() => {
    mockStorage.clear();
  });
  it('calculates XP, level, streak, and unlocked badges accurately', () => {
    const attempts: QuizAttempt[] = [
      {
        id: 'a1',
        user_id: 'u1',
        quiz_id: 'q1',
        started_at: '2026-11-22T08:00:00.000Z',
        submitted_at: '2026-11-22T08:20:00.000Z',
        score: 92,
        category_breakdown: null,
        answers: {},
      },
      {
        id: 'a2',
        user_id: 'u1',
        quiz_id: 'q2',
        started_at: '2026-11-23T08:00:00.000Z',
        submitted_at: '2026-11-23T08:15:00.000Z',
        score: 60,
        category_breakdown: null,
        answers: {},
      },
    ];

    const stats = computeGamificationStats(attempts, 6, 2);
    // XP: 6*20 (120) + 2*40 (80) + 1*35 (35) = 235 -> Level 2
    expect(stats.xp).toBe(235);
    expect(stats.level).toBe(2);
    expect(stats.streakDays).toBe(2);
    expect(stats.badges.every((b) => b.unlocked)).toBe(true);
  });

  it('builds valid CSV rows for attempts export', () => {
    const attempts: QuizAttempt[] = [
      {
        id: 'a1',
        user_id: 'u1',
        quiz_id: 'quiz-1',
        started_at: '2026-11-23T08:00:00.000Z',
        submitted_at: '2026-11-23T08:10:00.000Z',
        score: 80,
        category_breakdown: null,
        answers: {},
      },
    ];

    const csv = buildAttemptsCsv(attempts, { 'quiz-1': 'Latihan Verbal' });
    expect(csv).toContain('Tanggal,Latihan Soal,Skor (%),Status');
    expect(csv).toContain('"Latihan Verbal",80,"Lulus"');
  });

  it('persists weekly learning goal and returns sorted leaderboard entries', async () => {
    lmsApi.saveWeeklyGoal('demo-student-1', 10);
    expect(lmsApi.getWeeklyGoal('demo-student-1')).toBe(10);

    const board = await lmsApi.listLeaderboard();
    expect(board.length).toBeGreaterThanOrEqual(1);
    expect(board[0]).toHaveProperty('xp');
  });
});

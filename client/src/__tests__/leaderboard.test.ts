import { describe, expect, it } from 'vitest';
import { lmsApi } from '../shared/services/lmsApi';

describe('BL-03 Global Leaderboard', () => {
  it('computes XP, level, completed_lessons, and passed_quizzes sorted descending', async () => {
    const entries = await lmsApi.listLeaderboard();
    expect(entries.length).toBeGreaterThanOrEqual(1);

    for (let i = 1; i < entries.length; i += 1) {
      expect(entries[i - 1].xp).toBeGreaterThanOrEqual(entries[i].xp);
    }

    for (const entry of entries) {
      expect(entry.level).toBe(Math.floor(entry.xp / 200) + 1);
      expect(entry.completed_lessons).toBeGreaterThanOrEqual(0);
      expect(entry.passed_quizzes).toBeGreaterThanOrEqual(0);
    }
  });
});

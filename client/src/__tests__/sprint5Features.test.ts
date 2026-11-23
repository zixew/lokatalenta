import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSavedDailyXpTarget,
  getSavedLearningGoal,
  saveDailyXpTarget,
  saveLearningGoal,
} from '../features/courses/learningGoalStorage';
import {
  getLastOpenedLessonId,
  saveLastOpenedLessonId,
} from '../features/player/lastLessonStorage';
import {
  evaluateChallengeOutcome,
  getActiveChallengeForQuiz,
  saveActiveChallengeForQuiz,
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

describe('Sprint 5 Features — Career Track & Daily XP Target (BL-15)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  it('defaults to psikotes and 60 XP, and persists updated career goal & XP target', () => {
    expect(getSavedLearningGoal()).toBe('psikotes');
    expect(getSavedDailyXpTarget()).toBe(60);

    saveLearningGoal('cpns_bumn');
    saveDailyXpTarget(100);

    expect(getSavedLearningGoal()).toBe('cpns_bumn');
    expect(getSavedDailyXpTarget()).toBe(100);
  });
});

describe('Sprint 5 Features — Resume Last Opened Lesson (BL-16)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  it('stores and retrieves last opened lesson per user and course', () => {
    expect(getLastOpenedLessonId('u-1', 'c-1')).toBeNull();
    saveLastOpenedLessonId('u-1', 'c-1', 'lesson-3');
    expect(getLastOpenedLessonId('u-1', 'c-1')).toBe('lesson-3');
  });
});

describe('Sprint 5 Features — 1v1 Duel Score Comparison (BL-17)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  it('evaluates win, draw, and lose outcomes and persists active challenge', () => {
    const challenge = { challenger: 'Budi', targetScore: 80 };
    saveActiveChallengeForQuiz('quiz-1', challenge);
    expect(getActiveChallengeForQuiz('quiz-1')).toEqual(challenge);

    expect(evaluateChallengeOutcome(90, challenge).outcome).toBe('win');
    expect(evaluateChallengeOutcome(80, challenge).outcome).toBe('draw');
    expect(evaluateChallengeOutcome(60, challenge).outcome).toBe('lose');
  });
});

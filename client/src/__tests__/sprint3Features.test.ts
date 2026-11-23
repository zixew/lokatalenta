import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buildChallengeUrl,
  buildLinkedInShareUrl,
  buildWhatsAppShareUrl,
  parseChallengeParams,
} from '../features/quiz-runner/shareAndChallenge';
import {
  buildScheduledTryoutEvents,
  getRegisteredTryoutIds,
  getTryoutEventStatus,
  toggleTryoutRegistration,
} from '../features/tryout/tryoutEvents';
import { useAuthStore } from '../features/auth/useAuthStore';

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

describe('Sprint 3 Features — Challenge 1v1 & Share URLs (BL-07)', () => {
  it('builds and parses 1v1 challenge URLs accurately', () => {
    const url = buildChallengeUrl('https://lokatalenta.vercel.app', 'quiz-123', 88, 'Rizco Renova');
    expect(url).toContain('/quiz/quiz-123?');
    const query = url.split('?')[1] ?? '';
    const parsed = parseChallengeParams(query);
    expect(parsed).toEqual({ challenger: 'Rizco Renova', targetScore: 88 });
  });

  it('rejects out-of-range challenge scores and builds WhatsApp/LinkedIn share URLs', () => {
    expect(parseChallengeParams('challengeScore=150&challenger=Test')).toBeNull();
    expect(buildWhatsAppShareUrl('Skor 90!')).toBe('https://wa.me/?text=Skor%2090!');
    expect(buildLinkedInShareUrl('https://lokatalenta.vercel.app/verify/LT-1')).toBe(
      'https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Flokatalenta.vercel.app%2Fverify%2FLT-1'
    );
  });
});

describe('Sprint 3 Features — Forgot Password Validation (BL-08)', () => {
  it('rejects invalid email format before calling reset', async () => {
    await expect(useAuthStore.getState().requestPasswordReset('not-an-email')).rejects.toThrow(
      'Format email tidak valid.'
    );
  });
});

describe('Sprint 3 Features — Scheduled Tryout Akbar (BL-09)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  it('computes live, upcoming, and ended statuses for scheduled tryout events', () => {
    const now = Date.UTC(2026, 10, 23, 12, 0, 0);
    const events = buildScheduledTryoutEvents(now);
    expect(events).toHaveLength(3);
    expect(getTryoutEventStatus(events[0], now)).toBe('live');
    expect(getTryoutEventStatus(events[1], now)).toBe('upcoming');
    expect(getTryoutEventStatus(events[2], now)).toBe('ended');
  });

  it('toggles tryout event registration per user', () => {
    expect(getRegisteredTryoutIds('u1')).toEqual([]);
    const afterAdd = toggleTryoutRegistration('u1', 'tryout-akbar-bumn-live');
    expect(afterAdd).toEqual(['tryout-akbar-bumn-live']);
    const afterRemove = toggleTryoutRegistration('u1', 'tryout-akbar-bumn-live');
    expect(afterRemove).toEqual([]);
  });
});

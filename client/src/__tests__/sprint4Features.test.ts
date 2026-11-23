import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isRecoverySearchOrHash } from '../features/auth/authRecovery';
import { useAuthStore } from '../features/auth/useAuthStore';
import {
  syncTryoutRegistrationsFromServer,
  toggleTryoutRegistrationAsync,
} from '../features/tryout/tryoutEvents';

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

describe('Sprint 4 Features — Password Recovery Callback (BL-12)', () => {
  it('detects type=recovery in URL search params or hash', () => {
    expect(isRecoverySearchOrHash('?type=recovery', '')).toBe(true);
    expect(isRecoverySearchOrHash('', '#access_token=abc&type=recovery')).toBe(true);
    expect(isRecoverySearchOrHash('?type=signup', '')).toBe(false);
  });

  it('rejects new password shorter than 6 characters', async () => {
    await expect(useAuthStore.getState().updatePassword('12345')).rejects.toThrow(
      'Password baru minimal 6 karakter.'
    );
  });
});

describe('Sprint 4 Features — Tryout Registrations Sync & Toggle (BL-13)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  it('persists and syncs tryout registrations cleanly for guest/local mode', async () => {
    const initial = await syncTryoutRegistrationsFromServer('guest');
    expect(initial).toEqual([]);

    const afterAdd = await toggleTryoutRegistrationAsync('guest', 'tryout-akbar-bumn-live');
    expect(afterAdd).toEqual(['tryout-akbar-bumn-live']);

    const synced = await syncTryoutRegistrationsFromServer('guest');
    expect(synced).toEqual(['tryout-akbar-bumn-live']);
  });
});

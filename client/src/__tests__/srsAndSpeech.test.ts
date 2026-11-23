import { beforeEach, describe, expect, it } from 'vitest';
import { evaluateSpeechMatch, normalizeSpeechText } from '../features/player/speechUtils';
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

describe('SRS Flashcard Sync & Speech Matching', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('persists and retrieves flashcard SRS ratings per user', async () => {
    await lmsApi.saveFlashcardRating('user-1', 'ありがとう', 'easy');
    await lmsApi.saveFlashcardRating('user-1', 'おはようございます', 'hard');

    const map = await lmsApi.getFlashcardProgressMap('user-1');
    expect(map['ありがとう']).toBe('easy');
    expect(map['おはようございます']).toBe('hard');
  });

  it('normalizes and matches spoken phrases accurately', () => {
    expect(normalizeSpeechText('Good morning!')).toBe('good morning');
    expect(evaluateSpeechMatch('Good morning', 'Good morning!')).toBe(true);
    expect(evaluateSpeechMatch('arigatou gozaimasu', 'ありがとうございます', 'Arigatou gozaimasu')).toBe(
      true
    );
    expect(evaluateSpeechMatch('sayonara', 'ありがとうございます', 'Arigatou gozaimasu')).toBe(false);
  });
});

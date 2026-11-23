import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getLessonNote, saveLessonNote } from '../features/player/lessonNotesStorage';

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

describe('Sprint 2 Features — Lesson Notes (BL-04)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  it('returns empty string when no note has been saved for a user and lesson', () => {
    expect(getLessonNote('user-1', 'lesson-1')).toBe('');
  });

  it('saves and retrieves personal notes per user and lesson', () => {
    saveLessonNote('user-1', 'lesson-1', 'Fokus ke pola deret angka genap.');
    saveLessonNote('user-1', 'lesson-2', 'Catatan modul kedua.');
    saveLessonNote('user-2', 'lesson-1', 'Catatan user berbeda.');

    expect(getLessonNote('user-1', 'lesson-1')).toBe('Fokus ke pola deret angka genap.');
    expect(getLessonNote('user-1', 'lesson-2')).toBe('Catatan modul kedua.');
    expect(getLessonNote('user-2', 'lesson-1')).toBe('Catatan user berbeda.');
  });
});

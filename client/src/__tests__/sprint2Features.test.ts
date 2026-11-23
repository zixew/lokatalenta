import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getLessonNote, saveLessonNote } from '../features/player/lessonNotesStorage';
import { parseQuestionsCsv, SAMPLE_QUESTIONS_CSV_TEMPLATE } from '../features/teacher/csvQuestionParser';

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

describe('Sprint 2 Features — Bulk CSV Question Parser (BL-05)', () => {
  it('parses valid CSV template with quoted fields and header row', () => {
    const result = parseQuestionsCsv(SAMPLE_QUESTIONS_CSV_TEMPLATE);
    expect(result.errors).toEqual([]);
    expect(result.questions).toHaveLength(2);
    expect(result.questions[0].category_tag).toBe('Verbal');
    expect(result.questions[0].correct_option).toBe('B');
    expect(result.questions[1].category_tag).toBe('Numerik');
    expect(result.questions[1].correct_option).toBe('C');
  });

  it('reports validation errors for invalid correct_option or missing columns', () => {
    const badCsv = [
      'category_tag,question_text,option_a,option_b,option_c,option_d,option_e,correct_option,explanation',
      'Logika,"Pertanyaan 1",A,B,C,D,E,Z,"Invalid key"',
      'Logika,"Kurang kolom",A,B',
    ].join('\n');

    const result = parseQuestionsCsv(badCsv);
    expect(result.questions).toHaveLength(0);
    expect(result.errors).toHaveLength(2);
  });
});

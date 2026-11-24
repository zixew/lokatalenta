import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buildCourseNotesMarkdown,
  saveLessonNote,
} from '../features/player/lessonNotesStorage';
import {
  evaluateCell,
  isTechnicalSpreadsheetCourse,
  SPREADSHEET_SCENARIOS,
} from '../features/player/spreadsheetEngine';
import {
  getSavedDailyXpTarget,
  getSavedLearningGoal,
  saveStudyPreferencesAsync,
} from '../features/courses/learningGoalStorage';
import type { Course } from '../shared/types/lms';

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

describe('Sprint 7 Features — Notes Export & Study Preferences (BL-21, BL-22, BL-23)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  it('persists study preferences locally when offline/guest and builds Markdown export', async () => {
    await saveStudyPreferencesAsync(undefined, { goal: 'cpns_bumn', xpTarget: 100 });
    expect(getSavedLearningGoal()).toBe('cpns_bumn');
    expect(getSavedDailyXpTarget()).toBe(100);

    saveLessonNote('u-1', 'les-1', 'Gunakan =SUM(B2:B5) untuk menjumlahkan omzet.');
    const mockCourse = {
      id: 'c-1',
      title: 'Kursus Excel & Komisi',
      category: 'Kompetensi Teknis',
      level: 'Pemula',
      modules: [
        {
          id: 'm-1',
          title: 'Modul 1: Rumus Dasar',
          lessons: [{ id: 'les-1', title: 'Menghitung Total Omzet' }],
        },
      ],
    } as unknown as Course;

    const md = buildCourseNotesMarkdown(mockCourse, 'u-1');
    expect(md).toContain('# Catatan Belajar: Kursus Excel & Komisi');
    expect(md).toContain('## Modul 1: Rumus Dasar');
    expect(md).toContain('Gunakan =SUM(B2:B5) untuk menjumlahkan omzet.');
  });
});

describe('Sprint 7 Features — Interactive Spreadsheet Engine (BL-23B)', () => {
  it('evaluates SUM, AVERAGE, IF, VLOOKUP, arithmetic, and guards circular references', () => {
    const sales = { ...SPREADSHEET_SCENARIOS[0].initialCells, B6: '=SUM(B2:B5)' };
    expect(evaluateCell('B6', sales)).toBe(30000000);
    expect(evaluateCell('B7', sales)).toBe(7500000);
    expect(evaluateCell('D2', sales)).toBe('Tercapai');
    expect(evaluateCell('D3', sales)).toBe('Belum');

    const bonus = {
      ...SPREADSHEET_SCENARIOS[1].initialCells,
      C2: '=IF(B2>=10000000,"Bonus 10%","Bonus 5%")',
    };
    expect(evaluateCell('C2', bonus)).toBe('Bonus 10%');

    const vlookup = {
      ...SPREADSHEET_SCENARIOS[2].initialCells,
      E2: '=VLOOKUP("A02",A2:C4,3,FALSE)',
    };
    expect(evaluateCell('E2', vlookup)).toBe(125000);

    const circular = { A1: '=B1', B1: '=A1' };
    expect(evaluateCell('A1', circular)).toBe('#REF!');
    expect(evaluateCell('A1', { A1: '=10*2+5' })).toBe(25);
  });

  it('detects technical spreadsheet/excel courses accurately', () => {
    expect(isTechnicalSpreadsheetCourse('Kursus Perhitungan Komisi & Bonus', 'Karier')).toBe(true);
    expect(isTechnicalSpreadsheetCourse('Belajar Excel Dasar', 'Teknis')).toBe(true);
    expect(isTechnicalSpreadsheetCourse('Hiragana & Katakana', 'Bahasa Jepang')).toBe(false);
  });
});

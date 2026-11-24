import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearClientTelemetryErrors,
  getClientTelemetryErrors,
  recordClientTelemetryError,
} from '../features/admin/healthTelemetry';
import { buildDiagnosticStudyPlan } from '../features/profile/diagnosticStudyPlan';
import {
  listQuestionBookmarks,
  removeQuestionBookmark,
  toggleQuestionBookmark,
} from '../features/quiz-runner/questionBookmarksApi';
import { computeTypingMetrics } from '../features/typing/typingEngine';
import type { Course, QuizAttempt } from '../shared/types/lms';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k: string) => store.get(k) ?? null,
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    removeItem: (k: string) => {
      store.delete(k);
    },
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };
}

describe('Sprint 12A Features (BL-36, BL-37, BL-38, BL-38B)', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: createMemoryStorage(),
      configurable: true,
    });
  });

  it('BL-36: buildDiagnosticStudyPlan memprioritaskan subtest terlemah dan menangani attempt kosong', () => {
    const emptyPlan = buildDiagnosticStudyPlan([], []);
    expect(emptyPlan).toHaveLength(3);
    expect(emptyPlan[0].priority).toBe('Tinggi');

    const attempts: QuizAttempt[] = [
      {
        id: 'att-1',
        quiz_id: 'q-1',
        user_id: 'u-1',
        score: 72,
        started_at: '2026-11-24T00:00:00Z',
        submitted_at: '2026-11-24T00:05:00Z',
        answers: {},
        category_breakdown: {
          Numerik: { correct: 2, total: 5 }, // 40%
          Verbal: { correct: 4, total: 5 }, // 80%
          Logika: { correct: 3, total: 4 }, // 75%
        },
      },
    ];
    const courses: Course[] = [
      {
        id: 'c-num',
        slug: 'numerik-dasar',
        title: 'Latihan Numerik Dasar',
        description: '',
        category: 'Numerik',
        level: 'Pemula',
        estimated_hours: 2,
        is_published: true,
        teacher_id: 't-1',
        modules: [],
      },
    ];

    const plan = buildDiagnosticStudyPlan(attempts, courses);
    expect(plan[0].subtest).toBe('Numerik');
    expect(plan[0].scorePct).toBe(40);
    expect(plan[0].priority).toBe('Tinggi');
    expect(plan[0].actionPath).toBe('/courses/numerik-dasar');
  });

  it('BL-38B: computeTypingMetrics menghitung WPM, CPM, akurasi & aman pada 0 detik / 0 karakter', () => {
    const zero = computeTypingMetrics('Halo dunia', '', 0);
    expect(zero.wpm).toBe(0);
    expect(zero.cpm).toBe(0);
    expect(zero.accuracyPct).toBe(100);
    expect(Number.isNaN(zero.wpm)).toBe(false);

    const perfect = computeTypingMetrics('Halo dunia', 'Halo dunia', 60);
    expect(perfect.correctChars).toBe(10);
    expect(perfect.errorCount).toBe(0);
    expect(perfect.accuracyPct).toBe(100);
    expect(perfect.cpm).toBe(10);
    expect(perfect.wpm).toBe(2);

    const withErrors = computeTypingMetrics('abcde', 'axcye', 30);
    expect(withErrors.correctChars).toBe(3);
    expect(withErrors.errorCount).toBe(2);
    expect(withErrors.accuracyPct).toBe(60);
  });

  it('BL-37: toggleQuestionBookmark bersifat idempoten dan removeQuestionBookmark menghapus item', async () => {
    const added = await toggleQuestionBookmark('student-demo', {
      question_id: 'q-101',
      quiz_id: 'quiz-1',
      quiz_title: 'Tryout BUMN',
      category_tag: 'Numerik',
      question_text: 'Berapakah 15% dari 200?',
      explanation: '0.15 * 200 = 30',
    });
    expect(added.bookmarked).toBe(true);
    expect(added.items).toHaveLength(1);

    const toggledOff = await toggleQuestionBookmark('student-demo', {
      question_id: 'q-101',
      quiz_id: 'quiz-1',
      question_text: 'Berapakah 15% dari 200?',
    });
    expect(toggledOff.bookmarked).toBe(false);
    expect(toggledOff.items).toHaveLength(0);

    await toggleQuestionBookmark('student-demo', {
      question_id: 'q-102',
      quiz_id: 'quiz-1',
      question_text: 'Soal kedua',
    });
    await removeQuestionBookmark('student-demo', 'q-102');
    const remaining = await listQuestionBookmarks('student-demo');
    expect(remaining).toHaveLength(0);
  });

  it('BL-38: telemetry error buffer mencatat dan membersihkan error client', () => {
    recordClientTelemetryError('test-boundary', 'Contoh error jaringan');
    expect(getClientTelemetryErrors()).toHaveLength(1);
    expect(getClientTelemetryErrors()[0].source).toBe('test-boundary');
    clearClientTelemetryErrors();
    expect(getClientTelemetryErrors()).toHaveLength(0);
  });
});

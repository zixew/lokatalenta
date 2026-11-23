import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getLessonNote, saveLessonNote } from '../features/player/lessonNotesStorage';
import { parseQuestionsCsv, SAMPLE_QUESTIONS_CSV_TEMPLATE } from '../features/teacher/csvQuestionParser';
import { computeTeacherAnalytics } from '../features/teacher/teacherAnalytics';
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

describe('Sprint 2 Features — Teacher Analytics (BL-06)', () => {
  it('computes pass rate, average score, drop-off funnel, and category breakdown', () => {
    const progress = [
      { student_name: 'A', student_email: 'a@x.com', course_title: 'TIU Dasar', completed_lessons: 1, total_lessons: 10, latest_quiz_score: 50 },
      { student_name: 'B', student_email: 'b@x.com', course_title: 'TIU Dasar', completed_lessons: 6, total_lessons: 10, latest_quiz_score: 80 },
      { student_name: 'C', student_email: 'c@x.com', course_title: 'TIU Dasar', completed_lessons: 10, total_lessons: 10, latest_quiz_score: 90 },
      { student_name: 'D', student_email: 'd@x.com', course_title: 'TIU Dasar', completed_lessons: 2, total_lessons: 10, latest_quiz_score: null },
    ];

    const mockCourses = [
      {
        id: 'c1',
        modules: [
          {
            id: 'm1',
            lessons: [
              {
                id: 'l1',
                type: 'quiz',
                quiz: {
                  id: 'q1',
                  questions: [
                    { id: '1', category_tag: 'Verbal' },
                    { id: '2', category_tag: 'Numerik' },
                    { id: '3', category_tag: 'Verbal' },
                  ],
                },
              },
            ],
          },
        ],
      },
    ] as unknown as Course[];

    const summary = computeTeacherAnalytics(progress, mockCourses);
    expect(summary.totalEnrollments).toBe(4);
    expect(summary.testedCount).toBe(3);
    expect(summary.passRatePct).toBe(67);
    expect(summary.avgScore).toBe(73);
    expect(summary.courseFunnels[0]).toEqual({
      courseTitle: 'TIU Dasar',
      totalStudents: 4,
      earlyDropoff: 2,
      midProgress: 1,
      nearOrDone: 1,
      avgCompletionPct: 48,
    });
    expect(summary.categoryBreakdown).toEqual([
      { category: 'Verbal', count: 2 },
      { category: 'Numerik', count: 1 },
    ]);
  });
});

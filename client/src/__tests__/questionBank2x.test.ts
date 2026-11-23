import { describe, expect, it } from 'vitest';
import { DEMO_COURSES } from '../shared/data/demoSeed';

describe('Question Bank 2x Coverage', () => {
  it('ensures every quiz in DEMO_COURSES has a 2x question bank', () => {
    let quizCount = 0;

    for (const course of DEMO_COURSES) {
      for (const mod of course.modules ?? []) {
        for (const lesson of mod.lessons ?? []) {
          if (lesson.quiz && lesson.quiz.questions && lesson.quiz.questions.length > 0) {
            quizCount += 1;
            const limit = lesson.quiz.question_limit ?? 0;
            expect(limit).toBeGreaterThan(0);
            expect(lesson.quiz.questions.length).toBe(limit * 2);

            const ids = new Set(lesson.quiz.questions.map((q) => q.id));
            expect(ids.size).toBe(lesson.quiz.questions.length);
          }
        }
      }
    }

    expect(quizCount).toBeGreaterThan(20);
  });

  it('ensures every structured course module has >= 5 explanation parts, summary, and quiz', () => {
    for (const course of DEMO_COURSES) {
      if (course.category === 'Latihan Langsung') continue;
      for (const mod of course.modules ?? []) {
        const lessons = mod.lessons ?? [];
        const nonQuiz = lessons.filter((l) => l.type !== 'quiz');
        const quizzes = lessons.filter((l) => l.type === 'quiz');
        expect(nonQuiz.length).toBeGreaterThanOrEqual(6);
        expect(quizzes.length).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

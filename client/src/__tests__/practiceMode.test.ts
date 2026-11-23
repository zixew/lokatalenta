import { describe, expect, it } from 'vitest';
import { lmsApi } from '../shared/services/lmsApi';

describe('BL-02 Practice Mode Instant Feedback', () => {
  it('returns correct_option and explanation for both right and wrong answers', async () => {
    const courses = await lmsApi.listPublishedCourses();
    let sampleQuizId = '';
    let sampleQuestionId = '';
    let wrongOption = '';
    let rightOption = '';

    for (const c of courses) {
      for (const m of c.modules ?? []) {
        for (const l of m.lessons) {
          if (l.quiz?.questions?.length) {
            sampleQuizId = l.quiz.id;
            const q = l.quiz.questions[0];
            sampleQuestionId = q.id;
            rightOption = q.correct_option;
            wrongOption = q.options.find((o) => o.key !== rightOption)?.key ?? 'Z';
            break;
          }
        }
        if (sampleQuizId) break;
      }
      if (sampleQuizId) break;
    }

    expect(sampleQuizId).toBeTruthy();

    const wrongRes = await lmsApi.checkPracticeAnswer(sampleQuizId, sampleQuestionId, wrongOption);
    expect(wrongRes.is_correct).toBe(false);
    expect(wrongRes.correct_option).toBe(rightOption);
    expect(wrongRes.explanation.length).toBeGreaterThan(0);

    const rightRes = await lmsApi.checkPracticeAnswer(sampleQuizId, sampleQuestionId, rightOption);
    expect(rightRes.is_correct).toBe(true);
    expect(rightRes.correct_option).toBe(rightOption);
  });
});

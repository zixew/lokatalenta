import type { Question } from '../../shared/types/lms';

export function extractUniqueCategories(questions: Question[]): string[] {
  const tags = new Set<string>();
  for (const q of questions) {
    if (q.category_tag) tags.add(q.category_tag);
  }
  return ['ALL', ...Array.from(tags)];
}

export function filterQuestionsBySearchAndCategory(
  questions: Question[],
  search: string,
  category: string
): Question[] {
  const qLower = search.trim().toLowerCase();
  return questions.filter((q) => {
    const matchCategory = category === 'ALL' || q.category_tag === category;
    const matchSearch =
      !qLower ||
      q.question_text.toLowerCase().includes(qLower) ||
      (q.category_tag ?? '').toLowerCase().includes(qLower);
    return matchCategory && matchSearch;
  });
}

export interface QuestionCalibrationResult {
  questionId: string;
  totalAttempts: number;
  correctAttempts: number;
  difficultyIndex: number; // 0.0 to 1.0 (proportion answering correctly)
  classification: 'mudah' | 'sedang' | 'sukar';
}

/**
 * Calibrates question difficulty against attempt distributions (BL-220).
 * Difficulty index p = correct / total
 * - p > 0.75: mudah
 * - 0.30 <= p <= 0.75: sedang
 * - p < 0.30: sukar
 */
export function computeQuestionDifficultyCalibration(
  questionId: string,
  answers: Array<{ isCorrect: boolean }>
): QuestionCalibrationResult {
  const total = answers.length;
  if (total === 0) {
    return {
      questionId,
      totalAttempts: 0,
      correctAttempts: 0,
      difficultyIndex: 0.5,
      classification: 'sedang',
    };
  }
  const correct = answers.filter((a) => a.isCorrect).length;
  const p = Math.round((correct / total) * 100) / 100;
  const classification = p > 0.75 ? 'mudah' : p < 0.30 ? 'sukar' : 'sedang';

  return {
    questionId,
    totalAttempts: total,
    correctAttempts: correct,
    difficultyIndex: p,
    classification,
  };
}

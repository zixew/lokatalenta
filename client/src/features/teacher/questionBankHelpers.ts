import type { QuizQuestion } from '../../shared/types/lms';

export function extractUniqueCategories(questions: QuizQuestion[]): string[] {
  const tags = new Set<string>();
  for (const q of questions) {
    if (q.category_tag) tags.add(q.category_tag);
  }
  return ['ALL', ...Array.from(tags)];
}

export function filterQuestionsBySearchAndCategory(
  questions: QuizQuestion[],
  search: string,
  category: string
): QuizQuestion[] {
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

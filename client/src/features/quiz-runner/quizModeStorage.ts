export type QuizSessionMode = 'exam' | 'practice';

const QUIZ_MODE_PREFIX = 'lokatalenta_quiz_mode_v1_';

export function getLockedQuizMode(attemptId?: string | null): QuizSessionMode | null {
  if (!attemptId) return null;
  try {
    const raw = localStorage.getItem(`${QUIZ_MODE_PREFIX}${attemptId}`);
    if (raw === 'exam' || raw === 'practice') return raw;
    return null;
  } catch {
    return null;
  }
}

export function lockQuizMode(attemptId: string, mode: QuizSessionMode): QuizSessionMode {
  try {
    localStorage.setItem(`${QUIZ_MODE_PREFIX}${attemptId}`, mode);
  } catch {
    // ignore storage errors
  }
  return mode;
}

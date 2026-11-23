const LAST_LESSON_PREFIX = 'lokatalenta_last_lesson_v1_';

export function getLastOpenedLessonId(userId: string, courseId: string): string | null {
  try {
    return localStorage.getItem(`${LAST_LESSON_PREFIX}${userId}_${courseId}`) || null;
  } catch {
    return null;
  }
}

export function saveLastOpenedLessonId(
  userId: string,
  courseId: string,
  lessonId: string
): void {
  try {
    localStorage.setItem(`${LAST_LESSON_PREFIX}${userId}_${courseId}`, lessonId);
  } catch {
    // ignore storage errors
  }
}

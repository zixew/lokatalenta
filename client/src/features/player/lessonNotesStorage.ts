const NOTES_STORAGE_PREFIX = 'lokatalenta_lesson_notes_v1_';

export function getLessonNote(userId: string, lessonId: string): string {
  try {
    return localStorage.getItem(`${NOTES_STORAGE_PREFIX}${userId}_${lessonId}`) ?? '';
  } catch {
    return '';
  }
}

export function saveLessonNote(userId: string, lessonId: string, text: string): void {
  try {
    localStorage.setItem(`${NOTES_STORAGE_PREFIX}${userId}_${lessonId}`, text);
  } catch {
    // ignore storage errors
  }
}

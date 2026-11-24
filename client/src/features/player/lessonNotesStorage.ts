import { isSupabaseConfigured, supabase } from '../../shared/lib/supabase';
import type { Course } from '../../shared/types/lms';

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

export async function syncLessonNoteFromServer(
  userId: string,
  lessonId: string
): Promise<string> {
  const localNote = getLessonNote(userId, lessonId);
  if (!isSupabaseConfigured || !supabase || !userId || userId === 'guest') {
    return localNote;
  }

  try {
    const { data, error } = await supabase
      .from('lesson_notes')
      .select('note_text')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (error || !data || typeof data.note_text !== 'string') {
      return localNote;
    }

    if (data.note_text.trim() !== '') {
      saveLessonNote(userId, lessonId, data.note_text);
      return data.note_text;
    }
    return localNote;
  } catch {
    return localNote;
  }
}

export async function saveLessonNoteAsync(
  userId: string,
  lessonId: string,
  text: string
): Promise<{ syncedToCloud: boolean }> {
  saveLessonNote(userId, lessonId, text);

  if (!isSupabaseConfigured || !supabase || !userId || userId === 'guest') {
    return { syncedToCloud: false };
  }

  try {
    const { error } = await supabase.from('lesson_notes').upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        note_text: text,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_id' }
    );
    return { syncedToCloud: !error };
  } catch {
    return { syncedToCloud: false };
  }
}

export function buildCourseNotesMarkdown(course: Course, userId: string): string {
  const lines: string[] = [
    `# Catatan Belajar: ${course.title}`,
    `Kategori: ${course.category} | Level: ${course.level}`,
    `Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')}`,
    '',
  ];

  let foundCount = 0;
  for (const mod of course.modules ?? []) {
    const modNotes: string[] = [];
    for (const lesson of mod.lessons) {
      const note = getLessonNote(userId, lesson.id).trim();
      if (note) {
        foundCount++;
        modNotes.push(`### ${lesson.title}\n${note}\n`);
      }
    }
    if (modNotes.length > 0) {
      lines.push(`## ${mod.title}`, '', ...modNotes);
    }
  }

  if (foundCount === 0) {
    lines.push('_Belum ada catatan pribadi yang tersimpan pada kursus ini._');
  }

  return lines.join('\n');
}

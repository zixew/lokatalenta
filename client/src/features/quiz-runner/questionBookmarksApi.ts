import { isSupabaseConfigured, supabase } from '../../shared/lib/supabase';
import { sanitizeUserText } from '../../shared/lib/securityGuards';

export interface QuestionBookmark {
  id: string;
  user_id: string;
  question_id: string;
  quiz_id: string;
  quiz_title: string;
  category_tag: string;
  question_text: string;
  explanation: string;
  note: string;
  created_at: string;
}

export interface ToggleBookmarkInput {
  question_id: string;
  quiz_id: string;
  quiz_title?: string;
  category_tag?: string;
  question_text: string;
  explanation?: string;
  note?: string;
}

const LOCAL_KEY_PREFIX = 'lokatalenta_question_bookmarks_';

function readLocal(userId: string): QuestionBookmark[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_KEY_PREFIX}${userId}`);
    return raw ? (JSON.parse(raw) as QuestionBookmark[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(userId: string, items: QuestionBookmark[]) {
  try {
    localStorage.setItem(`${LOCAL_KEY_PREFIX}${userId}`, JSON.stringify(items));
  } catch {
    // ignore storage quota errors
  }
}

export async function listQuestionBookmarks(
  userId: string
): Promise<QuestionBookmark[]> {
  if (!userId) return [];

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('question_bookmarks')
      .select(
        'id, user_id, question_id, quiz_id, quiz_title, category_tag, question_text, explanation, note, created_at'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      writeLocal(userId, data as QuestionBookmark[]);
      return data as QuestionBookmark[];
    }
  }

  return readLocal(userId);
}

export async function toggleQuestionBookmark(
  userId: string,
  input: ToggleBookmarkInput
): Promise<{ bookmarked: boolean; items: QuestionBookmark[] }> {
  const existing = await listQuestionBookmarks(userId);
  const found = existing.find((b) => b.question_id === input.question_id);

  if (found) {
    const remaining = await removeQuestionBookmark(userId, input.question_id);
    return { bookmarked: false, items: remaining };
  }

  const newEntry: QuestionBookmark = {
    id: crypto.randomUUID(),
    user_id: userId,
    question_id: input.question_id,
    quiz_id: input.quiz_id,
    quiz_title: sanitizeUserText(input.quiz_title ?? ''),
    category_tag: sanitizeUserText(input.category_tag ?? ''),
    question_text: sanitizeUserText(input.question_text),
    explanation: sanitizeUserText(input.explanation ?? ''),
    note: sanitizeUserText(input.note ?? ''),
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('question_bookmarks')
      .upsert(
        {
          user_id: userId,
          question_id: newEntry.question_id,
          quiz_id: newEntry.quiz_id,
          quiz_title: newEntry.quiz_title,
          category_tag: newEntry.category_tag,
          question_text: newEntry.question_text,
          explanation: newEntry.explanation,
          note: newEntry.note,
        },
        { onConflict: 'user_id,question_id' }
      )
      .select(
        'id, user_id, question_id, quiz_id, quiz_title, category_tag, question_text, explanation, note, created_at'
      )
      .single();

    if (error) {
      throw new Error(error.message);
    }
    const next = [data as QuestionBookmark, ...existing];
    writeLocal(userId, next);
    return { bookmarked: true, items: next };
  }

  const next = [newEntry, ...existing];
  writeLocal(userId, next);
  return { bookmarked: true, items: next };
}

export async function removeQuestionBookmark(
  userId: string,
  questionId: string
): Promise<QuestionBookmark[]> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('question_bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('question_id', questionId);
    if (error) {
      throw new Error(error.message);
    }
  }

  const next = readLocal(userId).filter((b) => b.question_id !== questionId);
  writeLocal(userId, next);
  return next;
}

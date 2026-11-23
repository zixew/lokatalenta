-- ============================================================================
-- Prioritas 1 Migration: Voice Lines on Lessons + Listening Audio on Questions
-- ============================================================================

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS voice_lines JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS audio_text TEXT,
  ADD COLUMN IF NOT EXISTS audio_lang TEXT;

-- Recreate RPCs to include audio_text & audio_lang for Listening questions
DROP FUNCTION IF EXISTS public.get_quiz_questions_safe(UUID);
CREATE OR REPLACE FUNCTION public.get_quiz_questions_safe(p_quiz_id UUID)
RETURNS TABLE (
  id UUID,
  category_tag TEXT,
  question_text TEXT,
  image_url TEXT,
  audio_text TEXT,
  audio_lang TEXT,
  options JSONB,
  order_index INT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.id, q.category_tag, q.question_text, q.image_url, q.audio_text, q.audio_lang, q.options, q.order_index
  FROM public.questions q
  WHERE q.quiz_id = p_quiz_id
  ORDER BY q.order_index ASC;
$$;

DROP FUNCTION IF EXISTS public.get_attempt_review(UUID);
CREATE OR REPLACE FUNCTION public.get_attempt_review(p_attempt_id UUID)
RETURNS TABLE (
  question_id UUID,
  category_tag TEXT,
  question_text TEXT,
  image_url TEXT,
  audio_text TEXT,
  audio_lang TEXT,
  options JSONB,
  correct_option TEXT,
  explanation TEXT,
  order_index INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt public.quiz_attempts;
BEGIN
  SELECT * INTO v_attempt FROM public.quiz_attempts WHERE id = p_attempt_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;
  IF v_attempt.user_id <> auth.uid() AND public.current_user_role() NOT IN ('teacher', 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF v_attempt.submitted_at IS NULL THEN
    RAISE EXCEPTION 'Quiz has not been submitted yet';
  END IF;

  RETURN QUERY
  SELECT q.id, q.category_tag, q.question_text, q.image_url, q.audio_text, q.audio_lang, q.options, q.correct_option, q.explanation, q.order_index
  FROM public.questions q
  WHERE q.quiz_id = v_attempt.quiz_id
  ORDER BY q.order_index ASC;
END;
$$;

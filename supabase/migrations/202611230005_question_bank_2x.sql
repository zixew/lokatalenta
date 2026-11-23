-- ============================================================================
-- Question Bank 2x Support: question_limit on quizzes + question_ids on attempts
-- ============================================================================

ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS question_limit INT;

ALTER TABLE public.quiz_attempts
  ADD COLUMN IF NOT EXISTS question_ids UUID[];

-- Update get_quiz_questions_safe to draw up to question_limit random questions
-- and persist them on the active quiz_attempt when p_attempt_id is not passed separately.
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INT;
  v_attempt_id UUID;
  v_existing_ids UUID[];
  v_seen_ids UUID[];
  v_drawn_ids UUID[];
BEGIN
  SELECT qz.question_limit INTO v_limit
  FROM public.quizzes qz
  WHERE qz.id = p_quiz_id;

  SELECT qa.id, qa.question_ids INTO v_attempt_id, v_existing_ids
  FROM public.quiz_attempts qa
  WHERE qa.user_id = auth.uid()
    AND qa.quiz_id = p_quiz_id
    AND qa.submitted_at IS NULL
  ORDER BY qa.started_at DESC
  LIMIT 1;

  IF v_existing_ids IS NOT NULL AND array_length(v_existing_ids, 1) > 0 THEN
    RETURN QUERY
    SELECT q.id, q.category_tag, q.question_text, q.image_url, q.audio_text, q.audio_lang, q.options, q.order_index
    FROM public.questions q
    WHERE q.quiz_id = p_quiz_id AND q.id = ANY(v_existing_ids)
    ORDER BY q.order_index ASC;
    RETURN;
  END IF;

  SELECT COALESCE(ARRAY(
    SELECT DISTINCT unnest(qa.question_ids)
    FROM public.quiz_attempts qa
    WHERE qa.user_id = auth.uid()
      AND qa.quiz_id = p_quiz_id
      AND qa.submitted_at IS NOT NULL
      AND qa.question_ids IS NOT NULL
  ), ARRAY[]::UUID[]) INTO v_seen_ids;

  IF v_limit IS NOT NULL AND v_limit > 0 THEN
    SELECT ARRAY(
      SELECT sub.id FROM (
        SELECT q.id, q.order_index
        FROM public.questions q
        WHERE q.quiz_id = p_quiz_id
        ORDER BY (CASE WHEN q.id = ANY(v_seen_ids) THEN 1 ELSE 0 END) ASC, random()
        LIMIT v_limit
      ) sub
      ORDER BY sub.order_index ASC
    ) INTO v_drawn_ids;
  ELSE
    SELECT ARRAY(
      SELECT q.id
      FROM public.questions q
      WHERE q.quiz_id = p_quiz_id
      ORDER BY q.order_index ASC
    ) INTO v_drawn_ids;
  END IF;

  IF v_attempt_id IS NOT NULL AND v_drawn_ids IS NOT NULL THEN
    UPDATE public.quiz_attempts
    SET question_ids = v_drawn_ids
    WHERE public.quiz_attempts.id = v_attempt_id;
  END IF;

  RETURN QUERY
  SELECT q.id, q.category_tag, q.question_text, q.image_url, q.audio_text, q.audio_lang, q.options, q.order_index
  FROM public.questions q
  WHERE q.quiz_id = p_quiz_id AND q.id = ANY(COALESCE(v_drawn_ids, ARRAY[]::UUID[]))
  ORDER BY q.order_index ASC;
END;
$$;

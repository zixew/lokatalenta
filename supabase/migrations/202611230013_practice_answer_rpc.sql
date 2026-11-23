-- BL-02: Secure per-question practice answer check RPC
CREATE OR REPLACE FUNCTION public.check_practice_answer(
  p_question_id UUID,
  p_selected_option TEXT
)
RETURNS TABLE (
  is_correct BOOLEAN,
  correct_option TEXT,
  explanation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_q public.questions;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_q FROM public.questions WHERE id = p_question_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question not found';
  END IF;

  RETURN QUERY
  SELECT
    (v_q.correct_option = p_selected_option) AS is_correct,
    v_q.correct_option,
    v_q.explanation;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_practice_answer(UUID, TEXT) TO authenticated;

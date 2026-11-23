-- ============================================================================
-- Migration 0008:
-- 1. Sync submit_quiz_attempt & get_attempt_review with 2x Bank question_ids
-- 2. Auto-notify enrolled students on Course Announcements
-- 3. File-upload Practice Assignments with 3-tab guide, 1-5 star rubric,
--    Approval (with congratulation) & Rejection (re-upload required)
-- 4. Storage bucket for assignment submissions
-- ============================================================================

-- 1. UPDATE submit_quiz_attempt TO SCORE ONLY DRAWN question_ids
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(p_attempt_id UUID, p_answers JSONB)
RETURNS public.quiz_attempts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt public.quiz_attempts;
  v_quiz public.quizzes;
  v_total INT := 0;
  v_correct INT := 0;
  v_score INT := 0;
  v_breakdown JSONB := '{}'::jsonb;
  v_rec RECORD;
  v_cat_total INT;
  v_cat_correct INT;
BEGIN
  SELECT * INTO v_attempt FROM public.quiz_attempts WHERE id = p_attempt_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;
  IF v_attempt.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF v_attempt.submitted_at IS NOT NULL THEN
    RETURN v_attempt;
  END IF;

  SELECT * INTO v_quiz FROM public.quizzes WHERE id = v_attempt.quiz_id;

  IF p_answers IS NULL OR p_answers = '{}'::jsonb THEN
    p_answers := COALESCE(v_attempt.answers, '{}'::jsonb);
  END IF;

  FOR v_rec IN
    SELECT id, category_tag, correct_option
    FROM public.questions
    WHERE quiz_id = v_attempt.quiz_id
      AND (
        v_attempt.question_ids IS NULL
        OR array_length(v_attempt.question_ids, 1) IS NULL
        OR id = ANY(v_attempt.question_ids)
      )
  LOOP
    v_total := v_total + 1;
    v_cat_total := COALESCE((v_breakdown -> v_rec.category_tag ->> 'total')::INT, 0) + 1;
    v_cat_correct := COALESCE((v_breakdown -> v_rec.category_tag ->> 'correct')::INT, 0);

    IF (p_answers ->> v_rec.id::TEXT) = v_rec.correct_option THEN
      v_correct := v_correct + 1;
      v_cat_correct := v_cat_correct + 1;
    END IF;

    v_breakdown := jsonb_set(
      v_breakdown,
      ARRAY[v_rec.category_tag],
      jsonb_build_object('total', v_cat_total, 'correct', v_cat_correct),
      true
    );
  END LOOP;

  IF v_total > 0 THEN
    v_score := ROUND((v_correct::NUMERIC / v_total::NUMERIC) * 100);
  END IF;

  UPDATE public.quiz_attempts
  SET
    answers = p_answers,
    score = v_score,
    category_breakdown = v_breakdown,
    submitted_at = now()
  WHERE id = p_attempt_id
  RETURNING * INTO v_attempt;

  RETURN v_attempt;
END;
$$;

-- 2. UPDATE get_attempt_review TO RETURN ONLY DRAWN question_ids
CREATE OR REPLACE FUNCTION public.get_attempt_review(p_attempt_id UUID)
RETURNS TABLE (
  question_id UUID,
  category_tag TEXT,
  question_text TEXT,
  image_url TEXT,
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
  SELECT q.id, q.category_tag, q.question_text, q.image_url, q.options, q.correct_option, q.explanation, q.order_index
  FROM public.questions q
  WHERE q.quiz_id = v_attempt.quiz_id
    AND (
      v_attempt.question_ids IS NULL
      OR array_length(v_attempt.question_ids, 1) IS NULL
      OR q.id = ANY(v_attempt.question_ids)
    )
  ORDER BY q.order_index ASC;
END;
$$;

-- 3. TRIGGER NOTIFY ENROLLED STUDENTS ON COURSE ANNOUNCEMENTS
CREATE OR REPLACE FUNCTION public.notify_enrolled_students_on_announcement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug TEXT;
BEGIN
  SELECT slug INTO v_slug FROM public.courses WHERE id = NEW.course_id;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT
    e.user_id,
    'Pengumuman Baru: ' || NEW.title,
    NEW.content,
    'course',
    CASE WHEN v_slug IS NOT NULL THEN '/courses/' || v_slug ELSE '/' END
  FROM public.enrollments e
  WHERE e.course_id = NEW.course_id
    AND (NEW.author_id IS NULL OR e.user_id <> NEW.author_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_announcement ON public.course_announcements;
CREATE TRIGGER trg_notify_announcement
  AFTER INSERT ON public.course_announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_enrolled_students_on_announcement();

-- 4. UPGRADE COURSE ASSIGNMENTS & SUBMISSIONS FOR FILE UPLOAD + 1-5 STAR RUBRIC
ALTER TABLE public.course_assignments
  ADD COLUMN IF NOT EXISTS requires_file BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS task_brief TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS how_to_guide TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS rubric JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.assignment_submissions
  ADD COLUMN IF NOT EXISTS attachment_name TEXT,
  ADD COLUMN IF NOT EXISTS rating_stars INT CHECK (rating_stars BETWEEN 1 AND 5);

ALTER TABLE public.assignment_submissions
  DROP CONSTRAINT IF EXISTS assignment_submissions_status_check;

ALTER TABLE public.assignment_submissions
  ADD CONSTRAINT assignment_submissions_status_check
  CHECK (status IN ('submitted', 'approved', 'rejected', 'graded', 'needs_revision'));

-- 5. STORAGE BUCKET FOR ASSIGNMENT FILE UPLOADS
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-submissions', 'assignment-submissions', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users read assignment files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'assignment-submissions');

CREATE POLICY "Authenticated users upload own assignment files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'assignment-submissions');

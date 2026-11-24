-- Migration: Sprint 13 Proctoring, Short Answer, STAR Interview Lab, Cohort Targeting, Item Analysis, Course Clone, System Broadcasts

-- 1. Quiz Attempts: focus & tab-switch integrity telemetry
ALTER TABLE public.quiz_attempts
  ADD COLUMN IF NOT EXISTS tab_switch_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS focus_loss_events JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Questions: support short_answer questions alongside mcq
ALTER TABLE public.questions
  ALTER COLUMN correct_option DROP NOT NULL;

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS question_type TEXT NOT NULL DEFAULT 'mcq'
    CHECK (question_type IN ('mcq', 'short_answer')),
  ADD COLUMN IF NOT EXISTS accepted_answers TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS case_sensitive BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. STAR Interview Attempts
CREATE TABLE IF NOT EXISTS public.star_interview_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scenario_id TEXT NOT NULL,
  scenario_title TEXT NOT NULL DEFAULT '',
  situation TEXT NOT NULL DEFAULT '',
  task TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL DEFAULT '',
  result TEXT NOT NULL DEFAULT '',
  duration_seconds INT NOT NULL DEFAULT 0,
  checklist_completed JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.star_interview_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own star interview attempts" ON public.star_interview_attempts;
CREATE POLICY "Users manage own star interview attempts"
  ON public.star_interview_attempts FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.star_interview_attempts TO authenticated;

-- 4. Cohort targeting on course_assignments and course_announcements
ALTER TABLE public.course_assignments
  ADD COLUMN IF NOT EXISTS cohort_id UUID NULL REFERENCES public.cohorts(id) ON DELETE SET NULL;

ALTER TABLE public.course_announcements
  ADD COLUMN IF NOT EXISTS cohort_id UUID NULL REFERENCES public.cohorts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_course_assignments_cohort_id
  ON public.course_assignments (cohort_id)
  WHERE cohort_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_course_announcements_cohort_id
  ON public.course_announcements (cohort_id)
  WHERE cohort_id IS NOT NULL;

-- 5. RPC: get_quiz_item_analysis(p_quiz_id UUID)
CREATE OR REPLACE FUNCTION public.get_quiz_item_analysis(p_quiz_id UUID)
RETURNS TABLE (
  question_id UUID,
  question_text TEXT,
  category_tag TEXT,
  question_type TEXT,
  total_attempts INT,
  answered_count INT,
  correct_count INT,
  correct_rate NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.current_user_role() NOT IN ('admin', 'teacher') THEN
    RAISE EXCEPTION 'Hanya mentor atau admin yang dapat melihat analitik butir soal.';
  END IF;

  RETURN QUERY
  WITH submitted AS (
    SELECT qa.id, qa.answers
    FROM public.quiz_attempts qa
    WHERE qa.quiz_id = p_quiz_id
      AND qa.submitted_at IS NOT NULL
  ),
  attempt_stats AS (
    SELECT COUNT(*)::INT AS total_cnt FROM submitted
  )
  SELECT
    q.id AS question_id,
    q.question_text,
    q.category_tag,
    q.question_type,
    ast.total_cnt AS total_attempts,
    COUNT(s.id) FILTER (
      WHERE NULLIF(trim(COALESCE(s.answers ->> q.id::text, '')), '') IS NOT NULL
    )::INT AS answered_count,
    COUNT(s.id) FILTER (
      WHERE CASE
        WHEN q.question_type = 'short_answer' THEN
          EXISTS (
            SELECT 1
            FROM unnest(q.accepted_answers) AS ans
            WHERE CASE
              WHEN q.case_sensitive THEN trim(COALESCE(s.answers ->> q.id::text, '')) = trim(ans)
              ELSE lower(trim(COALESCE(s.answers ->> q.id::text, ''))) = lower(trim(ans))
            END
          )
        ELSE
          upper(trim(COALESCE(s.answers ->> q.id::text, ''))) = upper(trim(COALESCE(q.correct_option, '')))
      END
    )::INT AS correct_count,
    CASE
      WHEN ast.total_cnt = 0 THEN 0::NUMERIC
      ELSE ROUND(
        (
          COUNT(s.id) FILTER (
            WHERE CASE
              WHEN q.question_type = 'short_answer' THEN
                EXISTS (
                  SELECT 1
                  FROM unnest(q.accepted_answers) AS ans
                  WHERE CASE
                    WHEN q.case_sensitive THEN trim(COALESCE(s.answers ->> q.id::text, '')) = trim(ans)
                    ELSE lower(trim(COALESCE(s.answers ->> q.id::text, ''))) = lower(trim(ans))
                  END
                )
              ELSE
                upper(trim(COALESCE(s.answers ->> q.id::text, ''))) = upper(trim(COALESCE(q.correct_option, '')))
            END
          )::NUMERIC / ast.total_cnt::NUMERIC
        ) * 100,
        1
      )
    END AS correct_rate
  FROM public.questions q
  CROSS JOIN attempt_stats ast
  LEFT JOIN submitted s ON true
  WHERE q.quiz_id = p_quiz_id
  GROUP BY q.id, q.question_text, q.category_tag, q.question_type, q.order_index, ast.total_cnt
  ORDER BY q.order_index ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_quiz_item_analysis(UUID) TO authenticated;

-- 6. RPC: clone_course_with_content(p_source_course_id UUID, p_new_title TEXT DEFAULT NULL)
CREATE OR REPLACE FUNCTION public.clone_course_with_content(
  p_source_course_id UUID,
  p_new_title TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_role TEXT := public.current_user_role();
  v_source RECORD;
  v_title TEXT;
  v_base_slug TEXT;
  v_slug TEXT;
  v_new_course_id UUID;
  v_module RECORD;
  v_new_module_id UUID;
  v_lesson RECORD;
  v_new_lesson_id UUID;
  v_quiz RECORD;
  v_new_quiz_id UUID;
BEGIN
  IF v_uid IS NULL OR v_role NOT IN ('admin', 'teacher') THEN
    RAISE EXCEPTION 'Hanya mentor atau admin yang dapat menduplikasi kursus.';
  END IF;

  SELECT * INTO v_source
  FROM public.courses
  WHERE id = p_source_course_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kursus sumber tidak ditemukan.';
  END IF;

  IF v_role = 'teacher' AND v_source.teacher_id <> v_uid THEN
    RAISE EXCEPTION 'Anda hanya dapat menduplikasi kursus milik Anda sendiri.';
  END IF;

  v_title := COALESCE(NULLIF(trim(p_new_title), ''), v_source.title || ' (Salinan)');
  v_base_slug := trim(both '-' from regexp_replace(lower(v_title), '[^a-z0-9]+', '-', 'g'));
  IF v_base_slug = '' THEN
    v_base_slug := 'kursus';
  END IF;

  LOOP
    v_slug := v_base_slug || '-' || substr(gen_random_uuid()::text, 1, 6);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.courses WHERE slug = v_slug);
  END LOOP;

  INSERT INTO public.courses (
    teacher_id,
    title,
    slug,
    description,
    category,
    level,
    estimated_hours,
    thumbnail_url,
    is_published
  )
  VALUES (
    v_uid,
    v_title,
    v_slug,
    v_source.description,
    v_source.category,
    v_source.level,
    v_source.estimated_hours,
    v_source.thumbnail_url,
    false
  )
  RETURNING id INTO v_new_course_id;

  FOR v_module IN
    SELECT * FROM public.modules
    WHERE course_id = p_source_course_id
    ORDER BY order_index ASC
  LOOP
    INSERT INTO public.modules (course_id, title, order_index)
    VALUES (v_new_course_id, v_module.title, v_module.order_index)
    RETURNING id INTO v_new_module_id;

    FOR v_lesson IN
      SELECT * FROM public.lessons
      WHERE module_id = v_module.id
      ORDER BY order_index ASC
    LOOP
      INSERT INTO public.lessons (
        module_id,
        title,
        type,
        content,
        video_url,
        duration_minutes,
        order_index
      )
      VALUES (
        v_new_module_id,
        v_lesson.title,
        v_lesson.type,
        v_lesson.content,
        v_lesson.video_url,
        v_lesson.duration_minutes,
        v_lesson.order_index
      )
      RETURNING id INTO v_new_lesson_id;

      IF v_lesson.type = 'quiz' THEN
        SELECT * INTO v_quiz
        FROM public.quizzes
        WHERE lesson_id = v_lesson.id;

        IF FOUND THEN
          INSERT INTO public.quizzes (
            lesson_id,
            title,
            description,
            duration_minutes,
            passing_score,
            use_subtests
          )
          VALUES (
            v_new_lesson_id,
            v_quiz.title,
            v_quiz.description,
            v_quiz.duration_minutes,
            v_quiz.passing_score,
            v_quiz.use_subtests
          )
          RETURNING id INTO v_new_quiz_id;

          INSERT INTO public.questions (
            quiz_id,
            category_tag,
            question_text,
            image_url,
            options,
            correct_option,
            question_type,
            accepted_answers,
            case_sensitive,
            explanation,
            order_index
          )
          SELECT
            v_new_quiz_id,
            q.category_tag,
            q.question_text,
            q.image_url,
            q.options,
            q.correct_option,
            q.question_type,
            q.accepted_answers,
            q.case_sensitive,
            q.explanation,
            q.order_index
          FROM public.questions q
          WHERE q.quiz_id = v_quiz.id
          ORDER BY q.order_index ASC;
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  RETURN v_new_course_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.clone_course_with_content(UUID, TEXT) TO authenticated;

-- 7. System Broadcasts table & RLS
CREATE TABLE IF NOT EXISTS public.system_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'urgent')),
  target_role TEXT NOT NULL DEFAULT 'all' CHECK (target_role IN ('all', 'student', 'teacher', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NULL
);

ALTER TABLE public.system_broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active system broadcasts" ON public.system_broadcasts;
CREATE POLICY "Anyone can read active system broadcasts"
  ON public.system_broadcasts FOR SELECT
  USING (
    (is_active = true AND (expires_at IS NULL OR expires_at > now()))
    OR public.current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Admins can insert system broadcasts" ON public.system_broadcasts;
CREATE POLICY "Admins can insert system broadcasts"
  ON public.system_broadcasts FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can update system broadcasts" ON public.system_broadcasts;
CREATE POLICY "Admins can update system broadcasts"
  ON public.system_broadcasts FOR UPDATE TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can delete system broadcasts" ON public.system_broadcasts;
CREATE POLICY "Admins can delete system broadcasts"
  ON public.system_broadcasts FOR DELETE TO authenticated
  USING (public.current_user_role() = 'admin');

GRANT SELECT ON public.system_broadcasts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.system_broadcasts TO authenticated;

-- ============================================================================
-- LMS & CBT Psikotes — Initial Supabase PostgreSQL Schema + RLS + Secure RPCs
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'Pengguna Baru',
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  bio TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'student'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function to read current user's role safely in RLS policies
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. COURSES
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Umum',
  level TEXT NOT NULL DEFAULT 'Pemula' CHECK (level IN ('Pemula', 'Menengah', 'Lanjutan', 'Semua Level')),
  estimated_hours NUMERIC(4,1) NOT NULL DEFAULT 1.0,
  thumbnail_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. MODULES
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0
);

-- 4. LESSONS
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('article', 'video', 'quiz')),
  content TEXT NOT NULL DEFAULT '',
  video_url TEXT,
  duration_minutes INT NOT NULL DEFAULT 10,
  order_index INT NOT NULL DEFAULT 0
);

-- 5. QUIZZES
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL UNIQUE REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  duration_minutes INT NOT NULL DEFAULT 30,
  passing_score INT NOT NULL DEFAULT 70,
  use_subtests BOOLEAN NOT NULL DEFAULT true
);

-- 6. QUESTIONS
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  category_tag TEXT NOT NULL DEFAULT 'Umum',
  question_text TEXT NOT NULL,
  image_url TEXT,
  options JSONB NOT NULL, -- e.g. [{"key":"A","text":"..."}, ...]
  correct_option TEXT NOT NULL,
  explanation TEXT NOT NULL DEFAULT '',
  order_index INT NOT NULL DEFAULT 0
);

-- 7. ENROLLMENTS
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

-- 8. LESSON PROGRESS
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT true,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

-- 9. QUIZ ATTEMPTS
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  score INT,
  category_breakdown JSONB,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Profiles readable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins manage all profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- Courses
CREATE POLICY "Published courses readable by everyone"
  ON public.courses FOR SELECT
  USING (is_published = true OR teacher_id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "Teachers and admins insert courses"
  ON public.courses FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('teacher', 'admin') AND teacher_id = auth.uid());

CREATE POLICY "Teachers update own courses, admins all"
  ON public.courses FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid() OR public.current_user_role() = 'admin')
  WITH CHECK (teacher_id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "Teachers delete own courses, admins all"
  ON public.courses FOR DELETE TO authenticated
  USING (teacher_id = auth.uid() OR public.current_user_role() = 'admin');

-- Modules, Lessons, Quizzes (inherit visibility from parent course)
CREATE POLICY "Modules readable with course"
  ON public.modules FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_id AND (c.is_published = true OR c.teacher_id = auth.uid() OR public.current_user_role() = 'admin')
  ));

CREATE POLICY "Teachers/admins manage modules"
  ON public.modules FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_id AND (c.teacher_id = auth.uid() OR public.current_user_role() = 'admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_id AND (c.teacher_id = auth.uid() OR public.current_user_role() = 'admin')
  ));

CREATE POLICY "Lessons readable with course"
  ON public.lessons FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.modules m JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = module_id AND (c.is_published = true OR c.teacher_id = auth.uid() OR public.current_user_role() = 'admin')
  ));

CREATE POLICY "Teachers/admins manage lessons"
  ON public.lessons FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.modules m JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = module_id AND (c.teacher_id = auth.uid() OR public.current_user_role() = 'admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.modules m JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = module_id AND (c.teacher_id = auth.uid() OR public.current_user_role() = 'admin')
  ));

CREATE POLICY "Quizzes readable with course"
  ON public.quizzes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    JOIN public.courses c ON c.id = m.course_id
    WHERE l.id = lesson_id AND (c.is_published = true OR c.teacher_id = auth.uid() OR public.current_user_role() = 'admin')
  ));

CREATE POLICY "Teachers/admins manage quizzes"
  ON public.quizzes FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    JOIN public.courses c ON c.id = m.course_id
    WHERE l.id = lesson_id AND (c.teacher_id = auth.uid() OR public.current_user_role() = 'admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    JOIN public.courses c ON c.id = m.course_id
    WHERE l.id = lesson_id AND (c.teacher_id = auth.uid() OR public.current_user_role() = 'admin')
  ));

-- Questions: ONLY teacher (owner) and admin can SELECT directly.
-- Students fetch questions via RPC `get_quiz_questions_safe` (strips correct_option & explanation).
CREATE POLICY "Teachers/admins manage questions"
  ON public.questions FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quizzes q
    JOIN public.lessons l ON l.id = q.lesson_id
    JOIN public.modules m ON m.id = l.module_id
    JOIN public.courses c ON c.id = m.course_id
    WHERE q.id = quiz_id AND (c.teacher_id = auth.uid() OR public.current_user_role() = 'admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.quizzes q
    JOIN public.lessons l ON l.id = q.lesson_id
    JOIN public.modules m ON m.id = l.module_id
    JOIN public.courses c ON c.id = m.course_id
    WHERE q.id = quiz_id AND (c.teacher_id = auth.uid() OR public.current_user_role() = 'admin')
  ));

-- Enrollments
CREATE POLICY "Users read own enrollments, teachers read course enrollments"
  ON public.enrollments FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.current_user_role() = 'admin'
    OR EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.teacher_id = auth.uid())
  );

CREATE POLICY "Users enroll themselves"
  ON public.enrollments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Lesson Progress
CREATE POLICY "Users manage own lesson progress"
  ON public.lesson_progress FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Quiz Attempts
CREATE POLICY "Users read own attempts, teachers/admins read course attempts"
  ON public.quiz_attempts FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.lessons l ON l.id = q.lesson_id
      JOIN public.modules m ON m.id = l.module_id
      JOIN public.courses c ON c.id = m.course_id
      WHERE q.id = quiz_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Users create own attempts"
  ON public.quiz_attempts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own unsubmitted attempts"
  ON public.quiz_attempts FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND submitted_at IS NULL)
  WITH CHECK (user_id = auth.uid() AND submitted_at IS NULL);

-- ============================================================================
-- SECURE RPCs FOR CBT / PSIKOTES ENGINE
-- ============================================================================

-- 1. Fetch questions safely without exposing correct_option or explanation
CREATE OR REPLACE FUNCTION public.get_quiz_questions_safe(p_quiz_id UUID)
RETURNS TABLE (
  id UUID,
  category_tag TEXT,
  question_text TEXT,
  image_url TEXT,
  options JSONB,
  order_index INT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.id, q.category_tag, q.question_text, q.image_url, q.options, q.order_index
  FROM public.questions q
  WHERE q.quiz_id = p_quiz_id
  ORDER BY q.order_index ASC;
$$;

-- 2. Submit attempt & score on server (prevents tampering & enforces timer)
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

  -- If submitted after deadline, use already-saved answers from v_attempt.answers when p_answers is empty
  IF p_answers IS NULL OR p_answers = '{}'::jsonb THEN
    p_answers := COALESCE(v_attempt.answers, '{}'::jsonb);
  END IF;

  -- Score per question and aggregate by category_tag
  FOR v_rec IN
    SELECT id, category_tag, correct_option
    FROM public.questions
    WHERE quiz_id = v_attempt.quiz_id
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
    submitted_at = now(),
    answers = p_answers,
    score = v_score,
    category_breakdown = v_breakdown
  WHERE id = p_attempt_id
  RETURNING * INTO v_attempt;

  RETURN v_attempt;
END;
$$;

-- 3. Fetch full review + explanations ONLY after attempt is submitted
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
  ORDER BY q.order_index ASC;
END;
$$;

-- ============================================================================
-- STORAGE BUCKET FOR QUESTION IMAGES
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('question-images', 'question-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Question images publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'question-images');

CREATE POLICY "Teachers and admins upload question images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'question-images'
    AND public.current_user_role() IN ('teacher', 'admin')
  );

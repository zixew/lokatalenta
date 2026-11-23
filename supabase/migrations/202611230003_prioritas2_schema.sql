-- ============================================================================
-- Prioritas 2 Migration: Q&A Comments, Personal Notes & Course Reviews
-- ============================================================================

-- 1. LESSON COMMENTS (Q&A)
CREATE TABLE public.lesson_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL DEFAULT 'student',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read comments"
  ON public.lesson_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users post own comments"
  ON public.lesson_comments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own comments or admin/teacher"
  ON public.lesson_comments FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.current_user_role() IN ('admin', 'teacher'));

-- 2. LESSON NOTES (Personal Notes per Student per Lesson)
CREATE TABLE public.lesson_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own lesson notes"
  ON public.lesson_notes FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. COURSE REVIEWS (Ratings & Reviews)
CREATE TABLE public.course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone reads course reviews"
  ON public.course_reviews FOR SELECT USING (true);

CREATE POLICY "Users upsert own course reviews"
  ON public.course_reviews FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

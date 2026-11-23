-- ============================================================================
-- Prioritas 3 Migration (Tanpa Payment): Assignments & In-App Notifications
-- ============================================================================

-- 1. COURSE ASSIGNMENTS
CREATE TABLE public.course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL DEFAULT '',
  due_date TIMESTAMPTZ,
  max_score INT NOT NULL DEFAULT 100 CHECK (max_score > 0),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read assignments"
  ON public.course_assignments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers and admins manage assignments"
  ON public.course_assignments FOR ALL TO authenticated
  USING (public.current_user_role() IN ('admin', 'teacher'))
  WITH CHECK (public.current_user_role() IN ('admin', 'teacher'));

-- 2. ASSIGNMENT SUBMISSIONS
CREATE TABLE public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.course_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  submission_text TEXT NOT NULL DEFAULT '',
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'needs_revision')),
  score INT,
  feedback TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  graded_at TIMESTAMPTZ,
  UNIQUE (assignment_id, user_id)
);

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own submissions and teachers read all"
  ON public.assignment_submissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.current_user_role() IN ('admin', 'teacher'));

CREATE POLICY "Students upsert own submissions"
  ON public.assignment_submissions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students update own ungraded or teachers grade"
  ON public.assignment_submissions FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.current_user_role() IN ('admin', 'teacher'))
  WITH CHECK (user_id = auth.uid() OR public.current_user_role() IN ('admin', 'teacher'));

-- 3. IN-APP NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('grade', 'comment', 'course', 'system')),
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users create notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

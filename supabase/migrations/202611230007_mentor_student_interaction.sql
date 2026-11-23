-- ============================================================================
-- Student-Mentor Interaction Migration:
-- 1. Threaded Q&A + Mentor Answer flag
-- 2. Private 1-on-1 Mentoring Messages
-- 3. Live Mentoring / Office Hours Sessions & Bookings
-- 4. Course Announcements
-- ============================================================================

-- 1. UPGRADE LESSON COMMENTS FOR THREADED REPLIES
ALTER TABLE public.lesson_comments
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.lesson_comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_mentor_answer BOOLEAN NOT NULL DEFAULT false;

-- 2. PRIVATE 1-ON-1 MENTOR MESSAGES
CREATE TABLE public.mentor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'student',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants and admins read mentor messages"
  ON public.mentor_messages FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR mentor_id = auth.uid()
    OR public.current_user_role() = 'admin'
  );

CREATE POLICY "Participants send mentor messages"
  ON public.mentor_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (student_id = auth.uid() OR mentor_id = auth.uid() OR public.current_user_role() IN ('admin', 'teacher'))
  );

-- 3. LIVE MENTORING SESSIONS & BOOKINGS
CREATE TABLE public.mentoring_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  mentor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  mentor_name TEXT NOT NULL,
  title TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT '',
  scheduled_at TIMESTAMPTZ NOT NULL,
  meeting_url TEXT NOT NULL DEFAULT '',
  max_participants INT NOT NULL DEFAULT 20 CHECK (max_participants > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mentoring_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read mentoring sessions"
  ON public.mentoring_sessions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers and admins manage mentoring sessions"
  ON public.mentoring_sessions FOR ALL TO authenticated
  USING (public.current_user_role() IN ('admin', 'teacher'))
  WITH CHECK (public.current_user_role() IN ('admin', 'teacher'));

CREATE TABLE public.mentoring_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.mentoring_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);

ALTER TABLE public.mentoring_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read bookings"
  ON public.mentoring_bookings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users manage own bookings"
  ON public.mentoring_bookings FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.current_user_role() IN ('admin', 'teacher'))
  WITH CHECK (user_id = auth.uid());

-- 4. COURSE ANNOUNCEMENTS
CREATE TABLE public.course_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.course_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read course announcements"
  ON public.course_announcements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers and admins manage course announcements"
  ON public.course_announcements FOR ALL TO authenticated
  USING (public.current_user_role() IN ('admin', 'teacher'))
  WITH CHECK (public.current_user_role() IN ('admin', 'teacher'));

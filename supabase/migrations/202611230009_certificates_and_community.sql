-- ============================================================================
-- Migration 0009: Public Certificate Verification & Community Forum
-- ============================================================================

-- 1. CERTIFICATES (Publicly Verifiable)
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_code TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  course_title TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can verify certificates"
  ON public.certificates FOR SELECT USING (true);

CREATE POLICY "Users register own certificates"
  ON public.certificates FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 2. COMMUNITY POSTS & REPLIES
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL DEFAULT 'student',
  category TEXT NOT NULL DEFAULT 'Tips Psikotes',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  likes_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone reads community posts"
  ON public.community_posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users create community posts"
  ON public.community_posts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users update likes on posts"
  ON public.community_posts FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authors or admins delete posts"
  ON public.community_posts FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.current_user_role() IN ('admin', 'teacher'));

CREATE TABLE public.community_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL DEFAULT 'student',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone reads community replies"
  ON public.community_replies FOR SELECT USING (true);

CREATE POLICY "Authenticated users create community replies"
  ON public.community_replies FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authors or admins delete replies"
  ON public.community_replies FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.current_user_role() IN ('admin', 'teacher'));

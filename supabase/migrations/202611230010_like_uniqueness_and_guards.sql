-- ============================================================================
-- Migration 0010: Enforce 1x Like Per User on Community Posts
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.community_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone reads post likes"
  ON public.community_post_likes FOR SELECT USING (true);

CREATE POLICY "Users manage own post likes"
  ON public.community_post_likes FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

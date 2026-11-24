-- Migration: Sprint 12B (POV & Revamp: Certificate Revocation, Tryout Event Leaderboard, Cohort & Community RLS)

-- 1. Certificate revocation columns & admin update policy
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS revoked_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revoke_reason TEXT NULL;

DROP POLICY IF EXISTS "Admins can revoke or update certificates" ON public.certificates;
CREATE POLICY "Admins can revoke or update certificates"
  ON public.certificates FOR UPDATE TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

GRANT UPDATE ON public.certificates TO authenticated;

-- 2. Tryout event tracking on quiz_attempts & safe per-event leaderboard RPC
ALTER TABLE public.quiz_attempts
  ADD COLUMN IF NOT EXISTS tryout_event_id TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_tryout_event
  ON public.quiz_attempts (tryout_event_id, score DESC)
  WHERE tryout_event_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.get_tryout_event_leaderboard(p_event_id TEXT)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  best_score INT,
  attempts_count INT,
  latest_submitted_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    qa.user_id,
    COALESCE(p.full_name, 'Peserta') AS full_name,
    MAX(COALESCE(qa.score, 0))::INT AS best_score,
    COUNT(*)::INT AS attempts_count,
    MAX(qa.submitted_at) AS latest_submitted_at
  FROM public.quiz_attempts qa
  JOIN public.profiles p ON p.id = qa.user_id
  WHERE qa.tryout_event_id = p_event_id
    AND qa.submitted_at IS NOT NULL
    AND p.is_active IS NOT FALSE
  GROUP BY qa.user_id, p.full_name
  ORDER BY best_score DESC, latest_submitted_at ASC
  LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.get_tryout_event_leaderboard(TEXT) TO anon, authenticated;

-- 3. RLS updates for community_posts DELETE, cohort_members SELECT/DELETE, cohorts UPDATE
DROP POLICY IF EXISTS "Authors or admins delete posts" ON public.community_posts;
CREATE POLICY "Authors or admins delete posts"
  ON public.community_posts FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.current_user_role() IN ('admin', 'teacher')
  );

DROP POLICY IF EXISTS "Members and cohort owners can view memberships" ON public.cohort_members;
CREATE POLICY "Members and cohort owners can view memberships"
  ON public.cohort_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.cohorts c
      WHERE c.id = cohort_id AND c.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can leave own cohort" ON public.cohort_members;
DROP POLICY IF EXISTS "Users or cohort teachers can remove memberships" ON public.cohort_members;
CREATE POLICY "Users or cohort teachers can remove memberships"
  ON public.cohort_members FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.cohorts c
      WHERE c.id = cohort_id AND c.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers and admins can update own cohorts" ON public.cohorts;
CREATE POLICY "Teachers and admins can update own cohorts"
  ON public.cohorts FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid() OR public.current_user_role() = 'admin')
  WITH CHECK (teacher_id = auth.uid() OR public.current_user_role() = 'admin');

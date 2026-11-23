-- ============================================================================
-- Flashcard SRS Progress Sync Table
-- ============================================================================

CREATE TABLE public.flashcard_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_key TEXT NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('hard', 'medium', 'easy')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, card_key)
);

ALTER TABLE public.flashcard_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own flashcard progress"
  ON public.flashcard_progress FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

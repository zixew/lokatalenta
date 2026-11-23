-- Single active session tracking per user
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_session_id TEXT;

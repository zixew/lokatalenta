-- Migration: BL-22 Cloud Study Preferences (lesson_notes already exists in 202611230003_prioritas2_schema.sql)
create table if not exists public.user_study_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  learning_goal text not null default 'psikotes',
  daily_xp_target integer not null default 60,
  last_lessons jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_study_preferences enable row level security;

create policy "Users manage own study preferences"
  on public.user_study_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

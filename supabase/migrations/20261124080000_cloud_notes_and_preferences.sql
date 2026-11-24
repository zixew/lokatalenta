-- Migration: BL-21 & BL-22 Cloud Lesson Notes and Study Preferences
create table if not exists public.lesson_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id text not null,
  note_text text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

alter table public.lesson_notes enable row level security;

create policy "Users manage own lesson notes"
  on public.lesson_notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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

-- Migration: BL-24 & BL-26 Multi-User 1v1 Quiz Challenges & Kraepelin Attempts History
create table if not exists public.quiz_challenges (
  id uuid primary key default gen_random_uuid(),
  quiz_id text not null,
  challenger_name text not null,
  target_score integer not null,
  opponent_user_id uuid references public.profiles(id) on delete set null,
  opponent_name text not null,
  opponent_score integer not null,
  outcome text not null check (outcome in ('win', 'draw', 'lose')),
  created_at timestamptz not null default now()
);

alter table public.quiz_challenges enable row level security;

create policy "Anyone can read quiz challenges"
  on public.quiz_challenges for select
  using (true);

create policy "Authenticated users can insert quiz challenge results"
  on public.quiz_challenges for insert
  with check (auth.uid() is not null);

create table if not exists public.kraepelin_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  duration_seconds integer not null,
  total_answered integer not null,
  total_correct integer not null,
  accuracy_pct integer not null,
  speed_kpm numeric(6,2) not null,
  stability_score integer not null,
  created_at timestamptz not null default now()
);

alter table public.kraepelin_attempts enable row level security;

create policy "Users manage own kraepelin attempts"
  on public.kraepelin_attempts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

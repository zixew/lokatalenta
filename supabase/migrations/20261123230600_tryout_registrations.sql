-- Migration: BL-13 Tryout Akbar Registrations Persistence
create table if not exists public.tryout_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

alter table public.tryout_registrations enable row level security;

create policy "Users can view their own tryout registrations"
  on public.tryout_registrations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tryout registrations"
  on public.tryout_registrations for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own tryout registrations"
  on public.tryout_registrations for delete
  using (auth.uid() = user_id);

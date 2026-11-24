-- Migration: Sprint 12A (BL-37 Question Bookmarks, BL-38B Typing Attempts, BL-38 Admin Health Metrics)

-- 1. BL-37: Question Bookmarks
create table if not exists public.question_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id text not null,
  quiz_id text not null,
  quiz_title text not null default '',
  category_tag text not null default '',
  question_text text not null,
  explanation text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create index if not exists idx_question_bookmarks_user_created
  on public.question_bookmarks (user_id, created_at desc);

alter table public.question_bookmarks enable row level security;

drop policy if exists "Users can manage own question bookmarks" on public.question_bookmarks;
create policy "Users can manage own question bookmarks"
  on public.question_bookmarks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on table public.question_bookmarks to authenticated;

-- 2. BL-38B: Typing Speed & Accuracy Attempts
create table if not exists public.typing_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  preset_id text not null,
  preset_title text not null default '',
  duration_seconds int not null check (duration_seconds > 0),
  wpm int not null check (wpm >= 0),
  cpm int not null check (cpm >= 0),
  accuracy_pct numeric(5,2) not null check (accuracy_pct >= 0 and accuracy_pct <= 100),
  error_count int not null default 0 check (error_count >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_typing_attempts_user_created
  on public.typing_attempts (user_id, created_at desc);

alter table public.typing_attempts enable row level security;

drop policy if exists "Users can view own typing attempts" on public.typing_attempts;
create policy "Users can view own typing attempts"
  on public.typing_attempts for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own typing attempts" on public.typing_attempts;
create policy "Users can insert own typing attempts"
  on public.typing_attempts for insert
  with check (auth.uid() = user_id);

grant select, insert on table public.typing_attempts to authenticated;

-- 3. BL-38: Admin Health Metrics RPC (strict admin check)
create or replace function public.get_admin_health_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_users bigint;
  v_active_users bigint;
  v_total_courses bigint;
  v_published_courses bigint;
  v_attempts_24h bigint;
  v_typing_24h bigint;
begin
  if public.current_user_role() <> 'admin' then
    raise exception 'Forbidden: admin role required';
  end if;

  select count(*), count(*) filter (where is_active is not false)
    into v_total_users, v_active_users
    from public.profiles;

  select count(*), count(*) filter (where is_published = true)
    into v_total_courses, v_published_courses
    from public.courses;

  select count(*)
    into v_attempts_24h
    from public.quiz_attempts
    where created_at >= now() - interval '24 hours';

  select count(*)
    into v_typing_24h
    from public.typing_attempts
    where created_at >= now() - interval '24 hours';

  return jsonb_build_object(
    'totalUsers', v_total_users,
    'activeUsers', v_active_users,
    'totalCourses', v_total_courses,
    'publishedCourses', v_published_courses,
    'attempts24h', v_attempts_24h,
    'typingAttempts24h', v_typing_24h,
    'checkedAt', now()
  );
end;
$$;

grant execute on function public.get_admin_health_metrics() to authenticated;

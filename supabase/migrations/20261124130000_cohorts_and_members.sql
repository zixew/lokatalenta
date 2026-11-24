-- Migration: Sprint 11 BL-33 Cohort Kelas Privat & Kode Undangan
create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  name text not null,
  invite_code text not null unique,
  max_members integer not null default 30,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.cohort_members (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (cohort_id, user_id)
);

alter table public.cohorts enable row level security;
alter table public.cohort_members enable row level security;

create or replace function public.is_cohort_member(p_cohort_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.cohort_members
    where cohort_id = p_cohort_id and user_id = p_user_id
  );
$$;

drop policy if exists "Teachers, admins, and enrolled members can view cohorts" on public.cohorts;
create policy "Teachers, admins, and enrolled members can view cohorts"
  on public.cohorts for select
  using (
    teacher_id = auth.uid()
    or public.current_user_role() = 'admin'
    or public.is_cohort_member(id, auth.uid())
  );

drop policy if exists "Teachers and admins can manage own cohorts" on public.cohorts;
create policy "Teachers and admins can manage own cohorts"
  on public.cohorts for all
  using (teacher_id = auth.uid() or public.current_user_role() = 'admin')
  with check (teacher_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "Members and cohort owners can view memberships" on public.cohort_members;
create policy "Members and cohort owners can view memberships"
  on public.cohort_members for select
  using (
    user_id = auth.uid()
    or public.current_user_role() = 'admin'
    or exists (
      select 1 from public.cohorts c
      where c.id = cohort_id and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "Users can leave own cohort" on public.cohort_members;
create policy "Users can leave own cohort"
  on public.cohort_members for delete
  using (user_id = auth.uid() or public.current_user_role() = 'admin');

create or replace function public.join_cohort_by_code(p_invite_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_cohort record;
  v_count integer := 0;
begin
  if v_uid is null then
    raise exception 'Silakan masuk terlebih dahulu.';
  end if;

  select * into v_cohort
  from public.cohorts
  where upper(invite_code) = upper(trim(p_invite_code))
    and is_active = true
  for update;

  if not found then
    raise exception 'Kode undangan cohort tidak ditemukan atau sudah tidak aktif.';
  end if;

  if exists (
    select 1 from public.cohort_members
    where cohort_id = v_cohort.id and user_id = v_uid
  ) then
    return jsonb_build_object('cohort_id', v_cohort.id, 'name', v_cohort.name, 'already_joined', true);
  end if;

  select count(*) into v_count
  from public.cohort_members
  where cohort_id = v_cohort.id;

  if v_count >= v_cohort.max_members then
    raise exception 'Kuota peserta untuk cohort ini sudah penuh.';
  end if;

  insert into public.cohort_members (cohort_id, user_id)
  values (v_cohort.id, v_uid);

  return jsonb_build_object('cohort_id', v_cohort.id, 'name', v_cohort.name, 'already_joined', false);
end;
$$;

grant select, insert, update, delete on public.cohorts to authenticated;
grant select, delete on public.cohort_members to authenticated;
grant execute on function public.join_cohort_by_code(text) to authenticated;

-- Migration: BL-28 Cloud Admin Audit Log
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text not null,
  action text not null check (action in ('ROLE_UPDATED', 'USER_STATUS_CHANGED', 'COURSE_PUBLISH_TOGGLED')),
  target_label text not null,
  detail text not null,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "Admins can read and insert audit logs" on public.admin_audit_logs;
create policy "Admins can read and insert audit logs"
  on public.admin_audit_logs for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

grant select, insert on public.admin_audit_logs to authenticated;

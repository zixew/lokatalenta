-- Migration: v2.0.1 Security & RLS Hardening
-- 1. Restrict notifications INSERT so users cannot spam arbitrary user_ids
drop policy if exists "Authenticated users can insert notifications" on public.notifications;
drop policy if exists "System or staff can insert notifications" on public.notifications;
create policy "Users or staff can insert notifications"
  on public.notifications for insert
  with check (
    auth.uid() = user_id
    or public.current_user_role() in ('teacher', 'admin')
  );

-- 2. Prevent students from modifying grading fields on assignment_submissions
create or replace function public.guard_student_assignment_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() not in ('teacher', 'admin') then
    new.score := old.score;
    new.status := old.status;
    new.feedback := old.feedback;
    new.graded_at := old.graded_at;
    new.graded_by := old.graded_by;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_student_assignment_update on public.assignment_submissions;
create trigger trg_guard_student_assignment_update
  before update on public.assignment_submissions
  for each row
  execute function public.guard_student_assignment_update();

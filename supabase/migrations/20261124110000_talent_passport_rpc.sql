-- Migration: Sprint 10 Major v2.0.0 — Talent Readiness Passport & Public Verify RPC
alter table public.profiles
  add column if not exists is_passport_public boolean not null default true;

create or replace function public.get_talent_passport(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile record;
  v_category_scores jsonb := '{}'::jsonb;
  v_avg_quiz_score numeric := 0;
  v_passed_quizzes integer := 0;
  v_kraepelin record;
  v_certs jsonb := '[]'::jsonb;
  v_completed_lessons integer := 0;
begin
  select id, full_name, role, is_active, is_passport_public, created_at
    into v_profile
  from public.profiles
  where id = p_user_id;

  if not found or v_profile.is_active is false or v_profile.role <> 'student' or v_profile.is_passport_public is false then
    return null;
  end if;

  select
    coalesce(round(avg(score)::numeric, 1), 0),
    count(*) filter (where score >= 70)
  into v_avg_quiz_score, v_passed_quizzes
  from public.quiz_attempts
  where user_id = p_user_id and submitted_at is not null;

  -- Aggregate subtest category scores from quiz_attempts.category_breakdown
  select coalesce(
    jsonb_object_agg(cat_key, round(avg_pct)),
    '{}'::jsonb
  )
  into v_category_scores
  from (
    select
      kv.key as cat_key,
      avg(
        case
          when coalesce((kv.value ->> 'total')::numeric, 0) > 0
            then ((kv.value ->> 'correct')::numeric / (kv.value ->> 'total')::numeric) * 100
          else 0
        end
      ) as avg_pct
    from public.quiz_attempts qa,
      lateral jsonb_each(coalesce(qa.category_breakdown, '{}'::jsonb)) as kv(key, value)
    where qa.user_id = p_user_id and qa.submitted_at is not null
    group by kv.key
  ) sub;

  select
    coalesce(max(stability_score), 0) as best_stability,
    coalesce(round(avg(speed_kpm)::numeric, 1), 0) as avg_speed_kpm,
    coalesce(round(avg(accuracy_pct)::numeric, 1), 0) as avg_accuracy_pct,
    count(*) as total_runs
  into v_kraepelin
  from public.kraepelin_attempts
  where user_id = p_user_id;

  select count(*)
  into v_completed_lessons
  from public.lesson_progress
  where user_id = p_user_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'cert_code', c.cert_code,
        'course_title', coalesce(cr.title, 'Program LokaTalenta'),
        'issued_at', c.issued_at
      )
      order by c.issued_at desc
    ),
    '[]'::jsonb
  )
  into v_certs
  from public.certificates c
  left join public.courses cr on cr.id = c.course_id
  where c.user_id = p_user_id;

  return jsonb_build_object(
    'user_id', v_profile.id,
    'full_name', v_profile.full_name,
    'member_since', v_profile.created_at,
    'is_passport_public', v_profile.is_passport_public,
    'avg_quiz_score', v_avg_quiz_score,
    'passed_quizzes', v_passed_quizzes,
    'completed_lessons', v_completed_lessons,
    'category_scores', v_category_scores,
    'kraepelin', jsonb_build_object(
      'best_stability', coalesce(v_kraepelin.best_stability, 0),
      'avg_speed_kpm', coalesce(v_kraepelin.avg_speed_kpm, 0),
      'avg_accuracy_pct', coalesce(v_kraepelin.avg_accuracy_pct, 0),
      'total_runs', coalesce(v_kraepelin.total_runs, 0)
    ),
    'certificates', v_certs
  );
end;
$$;

grant execute on function public.get_talent_passport(uuid) to anon, authenticated;

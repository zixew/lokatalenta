-- BL-03: Secure Global Leaderboard RPC (aggregates student XP, level, lessons, and passed quizzes)
CREATE OR REPLACE FUNCTION public.get_public_leaderboard()
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  xp INT,
  level INT,
  completed_lessons INT,
  passed_quizzes INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH lesson_counts AS (
    SELECT lp.user_id, COUNT(*)::INT AS completed_lessons
    FROM public.lesson_progress lp
    GROUP BY lp.user_id
  ),
  attempt_counts AS (
    SELECT
      qa.user_id,
      COUNT(*) FILTER (WHERE qa.submitted_at IS NOT NULL)::INT AS total_attempts,
      COUNT(*) FILTER (WHERE qa.submitted_at IS NOT NULL AND COALESCE(qa.score, 0) >= 70)::INT AS passed_quizzes
    FROM public.quiz_attempts qa
    GROUP BY qa.user_id
  ),
  computed AS (
    SELECT
      p.id AS user_id,
      p.full_name,
      COALESCE(lc.completed_lessons, 0) AS completed_lessons,
      COALESCE(ac.passed_quizzes, 0) AS passed_quizzes,
      (
        COALESCE(lc.completed_lessons, 0) * 20
        + COALESCE(ac.total_attempts, 0) * 40
        + COALESCE(ac.passed_quizzes, 0) * 35
      )::INT AS xp
    FROM public.profiles p
    LEFT JOIN lesson_counts lc ON lc.user_id = p.id
    LEFT JOIN attempt_counts ac ON ac.user_id = p.id
    WHERE p.role = 'student' AND p.is_active = true
  )
  SELECT
    c.user_id,
    c.full_name,
    c.xp,
    (FLOOR(c.xp / 200.0) + 1)::INT AS level,
    c.completed_lessons,
    c.passed_quizzes
  FROM computed c
  ORDER BY c.xp DESC, c.completed_lessons DESC, c.full_name ASC
  LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_leaderboard() TO anon, authenticated;

import type { Course } from '../../shared/types/lms';

export interface StudentProgressItem {
  student_name: string;
  student_email: string;
  course_title: string;
  completed_lessons: number;
  total_lessons: number;
  latest_quiz_score: number | null;
}

export interface CourseFunnelMetric {
  courseTitle: string;
  totalStudents: number;
  earlyDropoff: number; // 0-25%
  midProgress: number;  // 26-75%
  nearOrDone: number;   // 76-100%
  avgCompletionPct: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
}

export interface TeacherAnalyticsSummary {
  totalEnrollments: number;
  testedCount: number;
  passRatePct: number;
  avgScore: number;
  avgCompletionPct: number;
  courseFunnels: CourseFunnelMetric[];
  categoryBreakdown: CategoryDistribution[];
}

export function computeTeacherAnalytics(
  studentProgress: StudentProgressItem[],
  courses: Course[]
): TeacherAnalyticsSummary {
  const totalEnrollments = studentProgress.length;
  const tested = studentProgress.filter((s) => s.latest_quiz_score !== null);
  const passed = tested.filter((s) => (s.latest_quiz_score ?? 0) >= 70);

  const passRatePct = tested.length > 0 ? Math.round((passed.length / tested.length) * 100) : 0;
  const avgScore =
    tested.length > 0
      ? Math.round(tested.reduce((acc, s) => acc + (s.latest_quiz_score ?? 0), 0) / tested.length)
      : 0;

  const completionPcts = studentProgress.map((s) =>
    s.total_lessons > 0 ? Math.round((s.completed_lessons / s.total_lessons) * 100) : 0
  );
  const avgCompletionPct =
    completionPcts.length > 0
      ? Math.round(completionPcts.reduce((a, b) => a + b, 0) / completionPcts.length)
      : 0;

  const byCourse = new Map<string, StudentProgressItem[]>();
  for (const row of studentProgress) {
    const list = byCourse.get(row.course_title) ?? [];
    list.push(row);
    byCourse.set(row.course_title, list);
  }

  const courseFunnels: CourseFunnelMetric[] = Array.from(byCourse.entries()).map(([courseTitle, rows]) => {
    let earlyDropoff = 0;
    let midProgress = 0;
    let nearOrDone = 0;
    let sumPct = 0;

    for (const r of rows) {
      const pct = r.total_lessons > 0 ? Math.round((r.completed_lessons / r.total_lessons) * 100) : 0;
      sumPct += pct;
      if (pct <= 25) earlyDropoff++;
      else if (pct <= 75) midProgress++;
      else nearOrDone++;
    }

    return {
      courseTitle,
      totalStudents: rows.length,
      earlyDropoff,
      midProgress,
      nearOrDone,
      avgCompletionPct: Math.round(sumPct / rows.length),
    };
  });

  const catCounts = new Map<string, number>();
  for (const c of courses) {
    for (const m of c.modules ?? []) {
      for (const l of m.lessons) {
        for (const q of l.quiz?.questions ?? []) {
          const tag = q.category_tag || 'Umum';
          catCounts.set(tag, (catCounts.get(tag) ?? 0) + 1);
        }
      }
    }
  }

  const categoryBreakdown: CategoryDistribution[] = Array.from(catCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalEnrollments,
    testedCount: tested.length,
    passRatePct,
    avgScore,
    avgCompletionPct,
    courseFunnels,
    categoryBreakdown,
  };
}

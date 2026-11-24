import type { Course, QuizAttempt } from '../../shared/types/lms';

export interface StudyPlanStep {
  id: string;
  subtest: string;
  scorePct: number | null;
  priority: 'Tinggi' | 'Sedang' | 'Pemantapan';
  recommendation: string;
  actionPath: string;
  actionLabel: string;
}

function findMatchingQuizOrCourse(
  keyword: string,
  courses: Course[]
): { path: string; label: string } {
  const lower = keyword.toLowerCase();
  for (const c of courses) {
    if (
      c.title.toLowerCase().includes(lower) ||
      c.category.toLowerCase().includes(lower)
    ) {
      return { path: `/courses/${c.slug}`, label: `Buka ${c.title}` };
    }
  }
  return { path: '/', label: 'Jelajahi Katalog Latihan' };
}

export function buildDiagnosticStudyPlan(
  attempts: QuizAttempt[],
  courses: Course[]
): StudyPlanStep[] {
  if (attempts.length === 0) {
    return [
      {
        id: 'step-onboard-1',
        subtest: 'Asesmen Awal Psikotes',
        scorePct: null,
        priority: 'Tinggi',
        recommendation:
          'Mulai dari 1 paket tryout atau kuis dasar agar sistem dapat memetakan kekuatan dan kelemahan subtest Anda.',
        actionPath: '/',
        actionLabel: 'Pilih Kuis Pertama',
      },
      {
        id: 'step-onboard-2',
        subtest: 'Ketahanan & Konsentrasi (Kraepelin)',
        scorePct: null,
        priority: 'Sedang',
        recommendation:
          'Latih kecepatan hitung dan konsistensi fokus melalui simulasi Kraepelin 15 kolom.',
        actionPath: '/kraepelin',
        actionLabel: 'Mulai Tes Kraepelin',
      },
      {
        id: 'step-onboard-3',
        subtest: 'Kecepatan & Akurasi Mengetik',
        scorePct: null,
        priority: 'Pemantapan',
        recommendation:
          'Bangun kecepatan dan ketepatan mengetik untuk kesiapan tes administrasi & data entry.',
        actionPath: '/typing',
        actionLabel: 'Latihan Mengetik',
      },
    ];
  }

  const tagTotals = new Map<string, { sum: number; count: number }>();

  for (const att of attempts) {
    const breakdown = att.category_breakdown ?? {};
    for (const [rawTag, item] of Object.entries(breakdown)) {
      const tag = (rawTag || 'Umum').trim();
      const pct =
        item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
      const cur = tagTotals.get(tag) ?? { sum: 0, count: 0 };
      tagTotals.set(tag, { sum: cur.sum + pct, count: cur.count + 1 });
    }
  }

  if (tagTotals.size === 0) {
    const avg = Math.round(
      attempts.reduce((s, a) => s + (a.score ?? 0), 0) / attempts.length
    );
    const firstQuizCourse = courses.find((c) =>
      (c.modules ?? []).some((m) => m.lessons.some((l) => l.type === 'quiz'))
    );
    return [
      {
        id: 'step-avg-1',
        subtest: 'Evaluasi Skor Umum',
        scorePct: avg,
        priority: avg < 70 ? 'Tinggi' : 'Sedang',
        recommendation:
          avg < 70
            ? 'Rata-rata skor masih di bawah 70%. Ulangi materi inti dan kerjakan latihan soal bertahap.'
            : 'Pertahankan akurasi Anda dengan simulasi tingkat lanjut dan variasi soal baru.',
        actionPath: firstQuizCourse ? `/courses/${firstQuizCourse.slug}` : '/',
        actionLabel: firstQuizCourse ? 'Lanjutkan Kursus' : 'Lihat Katalog',
      },
      {
        id: 'step-avg-2',
        subtest: 'Ketahanan Kraepelin',
        scorePct: null,
        priority: 'Sedang',
        recommendation:
          'Tambahkan latihan Kraepelin harian untuk menjaga stabilitas ritme kerja.',
        actionPath: '/kraepelin',
        actionLabel: 'Buka Tes Kraepelin',
      },
      {
        id: 'step-avg-3',
        subtest: 'Kecepatan Mengetik',
        scorePct: null,
        priority: 'Pemantapan',
        recommendation:
          'Latih akurasi > 95% dan kecepatan > 45 WPM pada modul Tes Mengetik.',
        actionPath: '/typing',
        actionLabel: 'Buka Tes Mengetik',
      },
    ];
  }

  const ranked = Array.from(tagTotals.entries())
    .map(([subtest, stat]) => ({
      subtest,
      scorePct: Math.round(stat.sum / stat.count),
    }))
    .sort((a, b) => a.scorePct - b.scorePct);

  return ranked.slice(0, 3).map((item, idx) => {
    const priority: StudyPlanStep['priority'] =
      item.scorePct < 65
        ? 'Tinggi'
        : item.scorePct < 80
          ? 'Sedang'
          : 'Pemantapan';
    const match = findMatchingQuizOrCourse(item.subtest, courses);
    const recommendation =
      priority === 'Tinggi'
        ? `Skor rata-rata ${item.subtest} masih ${item.scorePct}%. Fokuskan ulang pada konsep dasar dan latihan soal subtest ini.`
        : priority === 'Sedang'
          ? `Skor ${item.subtest} berada di ${item.scorePct}%. Tingkatkan kecepatan pengerjaan dan kurangi salah ketelitian.`
          : `Skor ${item.subtest} sudah kuat (${item.scorePct}%). Pertahankan dengan tryout berkala.`;

    return {
      id: `diag-${idx}-${item.subtest.toLowerCase().replace(/\s+/g, '-')}`,
      subtest: item.subtest,
      scorePct: item.scorePct,
      priority,
      recommendation,
      actionPath: match.path,
      actionLabel: match.label,
    };
  });
}

import { isSupabaseConfigured, supabase } from '../../shared/lib/supabase';
import { lmsApi } from '../../shared/services/lmsApi';
import type { CertificateRecord } from '../../shared/types/lms';
import { getLocalKraepelinHistory } from '../kraepelin/kraepelinHistory';
import { extractCategoryScoresFromAttempts } from './talentRadar';

export async function listUserCertificatesAsync(
  userId: string
): Promise<CertificateRecord[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('id, cert_code, user_id, student_name, course_id, course_title, teacher_name, issued_at')
        .eq('user_id', userId)
        .order('issued_at', { ascending: false });
      if (!error && data) return data as CertificateRecord[];
    } catch {
      // fall through to local fallback
    }
  }
  try {
    const raw = localStorage.getItem('lokatalenta_certificates_v1');
    const all = raw ? (JSON.parse(raw) as CertificateRecord[]) : [];
    return all.filter((c) => c.user_id === userId);
  } catch {
    return [];
  }
}

export interface TalentCertificateSummary {
  cert_code: string;
  course_title: string;
  issued_at: string;
}

export interface TalentPassportData {
  user_id: string;
  full_name: string;
  member_since: string;
  is_passport_public: boolean;
  avg_quiz_score: number;
  passed_quizzes: number;
  completed_lessons: number;
  category_scores: Record<string, number>;
  kraepelin: {
    best_stability: number;
    avg_speed_kpm: number;
    avg_accuracy_pct: number;
    total_runs: number;
  };
  certificates: TalentCertificateSummary[];
}

const PASSPORT_VISIBILITY_PREFIX = 'lokatalenta_passport_public_v1_';

export function getPassportVisibilityLocal(userId: string): boolean {
  try {
    const raw = localStorage.getItem(`${PASSPORT_VISIBILITY_PREFIX}${userId}`);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

export async function setPassportVisibilityAsync(
  userId: string,
  isPublic: boolean
): Promise<boolean> {
  try {
    localStorage.setItem(`${PASSPORT_VISIBILITY_PREFIX}${userId}`, String(isPublic));
  } catch {
    // ignore storage errors
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('profiles')
        .update({ is_passport_public: isPublic })
        .eq('id', userId);
    } catch {
      // keep local visibility state
    }
  }
  return isPublic;
}

export async function getTalentPassportAsync(
  userId: string
): Promise<TalentPassportData | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('get_talent_passport', {
        p_user_id: userId,
      });
      if (!error && data) {
        return data as TalentPassportData;
      }
    } catch {
      // fall through to local/demo fallback if RPC not yet deployed
    }
  }

  // Local / Demo fallback
  const isVisible = getPassportVisibilityLocal(userId);
  if (!isVisible) return null;

  const [profiles, attempts, completedLessons, certs, courses] = await Promise.all([
    lmsApi.listAllProfiles(),
    lmsApi.listUserAttempts(userId),
    lmsApi.getCompletedLessonIds(userId),
    listUserCertificatesAsync(userId),
    lmsApi.listPublishedCourses(),
  ]);

  const profile = profiles.find((p) => p.id === userId && p.is_active !== false);
  const fullName = profile?.full_name || 'Kandidat LokaTalenta';
  const submitted = attempts.filter((a) => Boolean(a.submitted_at));
  const avgQuizScore =
    submitted.length > 0
      ? Math.round(submitted.reduce((s, a) => s + (a.score ?? 0), 0) / submitted.length)
      : 0;
  const passedQuizzes = submitted.filter((a) => (a.score ?? 0) >= 70).length;
  const kraepelinHistory = getLocalKraepelinHistory();

  const totalRuns = kraepelinHistory.length;
  const bestStability =
    totalRuns > 0 ? Math.max(...kraepelinHistory.map((r) => r.stability_score)) : 0;
  const avgSpeedKpm =
    totalRuns > 0
      ? Math.round(kraepelinHistory.reduce((s, r) => s + r.speed_kpm, 0) / totalRuns)
      : 0;
  const avgAccuracyPct =
    totalRuns > 0
      ? Math.round(kraepelinHistory.reduce((s, r) => s + r.accuracy_pct, 0) / totalRuns)
      : 0;

  return {
    user_id: userId,
    full_name: fullName,
    member_since: profile?.created_at || new Date().toISOString(),
    is_passport_public: true,
    avg_quiz_score: avgQuizScore,
    passed_quizzes: passedQuizzes,
    completed_lessons: completedLessons.length,
    category_scores: extractCategoryScoresFromAttempts(submitted),
    kraepelin: {
      best_stability: bestStability,
      avg_speed_kpm: avgSpeedKpm,
      avg_accuracy_pct: avgAccuracyPct,
      total_runs: totalRuns,
    },
    certificates: certs.map((c) => ({
      cert_code: c.cert_code,
      course_title:
        courses.find((cr) => cr.id === c.course_id)?.title || 'Program LokaTalenta',
      issued_at: c.issued_at,
    })),
  };
}

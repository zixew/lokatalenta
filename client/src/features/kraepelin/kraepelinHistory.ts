import { isSupabaseConfigured, supabase } from '../../shared/lib/supabase';

export interface KraepelinAttemptRecord {
  id: string;
  preset_id: string;
  duration_seconds: number;
  total_answered: number;
  total_correct: number;
  accuracy_pct: number;
  speed_kpm: number;
  stability_score: number;
  created_at: string;
}

export interface KraepelinSummaryTrend {
  totalRuns: number;
  avgAccuracyPct: number;
  avgSpeedKpm: number;
  bestStability: number;
  deltaAccuracyPct: number;
}

const KRAEPELIN_HISTORY_KEY = 'lokatalenta_kraepelin_history_v1';
const MAX_LOCAL_RECORDS = 20;

export function computeStabilityScore(
  columnAttemptedCounts: number[],
  fallbackAccuracyPct: number
): number {
  if (columnAttemptedCounts.length < 2) {
    return Math.max(0, Math.min(100, Math.round(fallbackAccuracyPct)));
  }
  const mean =
    columnAttemptedCounts.reduce((sum, count) => sum + count, 0) / columnAttemptedCounts.length;
  if (mean <= 0) return 0;

  const variance =
    columnAttemptedCounts.reduce((sum, count) => sum + (count - mean) ** 2, 0) /
    columnAttemptedCounts.length;
  const cv = Math.sqrt(variance) / mean;
  return Math.max(0, Math.min(100, Math.round(100 - cv * 100)));
}

export function getLocalKraepelinHistory(): KraepelinAttemptRecord[] {
  try {
    const raw = localStorage.getItem(KRAEPELIN_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as KraepelinAttemptRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalKraepelinHistory(records: KraepelinAttemptRecord[]): void {
  try {
    localStorage.setItem(
      KRAEPELIN_HISTORY_KEY,
      JSON.stringify(records.slice(0, MAX_LOCAL_RECORDS))
    );
  } catch {
    // ignore storage errors
  }
}

export async function recordKraepelinAttemptAsync(params: {
  userId?: string | null;
  presetId: string;
  durationSeconds: number;
  totalAnswered: number;
  totalCorrect: number;
  accuracyPct: number;
  columnAttemptedCounts: number[];
}): Promise<KraepelinAttemptRecord[]> {
  const speedKpm =
    params.durationSeconds > 0
      ? Math.round((params.totalAnswered / params.durationSeconds) * 60)
      : 0;
  const stabilityScore = computeStabilityScore(
    params.columnAttemptedCounts,
    params.accuracyPct
  );

  const entry: KraepelinAttemptRecord = {
    id: `krp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    preset_id: params.presetId,
    duration_seconds: Math.max(1, Math.round(params.durationSeconds)),
    total_answered: Math.max(0, Math.round(params.totalAnswered)),
    total_correct: Math.max(0, Math.round(params.totalCorrect)),
    accuracy_pct: Math.max(0, Math.min(100, Math.round(params.accuracyPct))),
    speed_kpm: Math.max(0, speedKpm),
    stability_score: stabilityScore,
    created_at: new Date().toISOString(),
  };

  const next = [entry, ...getLocalKraepelinHistory()].slice(0, MAX_LOCAL_RECORDS);
  saveLocalKraepelinHistory(next);

  if (params.userId && isSupabaseConfigured && supabase) {
    try {
      await supabase.from('kraepelin_attempts').insert({
        user_id: params.userId,
        duration_seconds: entry.duration_seconds,
        total_answered: entry.total_answered,
        total_correct: entry.total_correct,
        accuracy_pct: entry.accuracy_pct,
        speed_kpm: entry.speed_kpm,
        stability_score: entry.stability_score,
        created_at: entry.created_at,
      });
    } catch {
      // keep local history if cloud sync fails
    }
  }

  return next;
}

export async function syncKraepelinHistoryFromServer(
  userId?: string | null
): Promise<KraepelinAttemptRecord[]> {
  const local = getLocalKraepelinHistory();
  if (!userId || !isSupabaseConfigured || !supabase) {
    return local;
  }

  try {
    const { data, error } = await supabase
      .from('kraepelin_attempts')
      .select(
        'id, duration_seconds, total_answered, total_correct, accuracy_pct, speed_kpm, stability_score, created_at'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(MAX_LOCAL_RECORDS);

    if (error || !data || data.length === 0) {
      return local;
    }

    const mapped: KraepelinAttemptRecord[] = data.map((row) => ({
      id: String(row.id),
      preset_id: 'synced',
      duration_seconds: Number(row.duration_seconds) || 0,
      total_answered: Number(row.total_answered) || 0,
      total_correct: Number(row.total_correct) || 0,
      accuracy_pct: Number(row.accuracy_pct) || 0,
      speed_kpm: Number(row.speed_kpm) || 0,
      stability_score: Number(row.stability_score) || 0,
      created_at: String(row.created_at),
    }));

    saveLocalKraepelinHistory(mapped);
    return mapped;
  } catch {
    return local;
  }
}

export function computeKraepelinSummaryTrend(
  records: KraepelinAttemptRecord[]
): KraepelinSummaryTrend {
  if (records.length === 0) {
    return {
      totalRuns: 0,
      avgAccuracyPct: 0,
      avgSpeedKpm: 0,
      bestStability: 0,
      deltaAccuracyPct: 0,
    };
  }

  const totalRuns = records.length;
  const avgAccuracyPct = Math.round(
    records.reduce((sum, r) => sum + r.accuracy_pct, 0) / totalRuns
  );
  const avgSpeedKpm = Math.round(
    records.reduce((sum, r) => sum + r.speed_kpm, 0) / totalRuns
  );
  const bestStability = Math.max(...records.map((r) => r.stability_score));
  const deltaAccuracyPct =
    records.length >= 2 ? records[0].accuracy_pct - records[1].accuracy_pct : 0;

  return {
    totalRuns,
    avgAccuracyPct,
    avgSpeedKpm,
    bestStability,
    deltaAccuracyPct,
  };
}

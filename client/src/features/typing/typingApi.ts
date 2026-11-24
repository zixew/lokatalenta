import { isSupabaseConfigured, supabase } from '../../shared/lib/supabase';
import { emitEcosystemTelemetry } from '../../shared/services/ecosystemTelemetry';

export interface TypingAttemptRecord {
  id: string;
  user_id: string;
  preset_id: string;
  preset_title: string;
  duration_seconds: number;
  wpm: number;
  cpm: number;
  accuracy_pct: number;
  error_count: number;
  created_at: string;
}

const LOCAL_TYPING_PREFIX = 'lokatalenta_typing_attempts_';

function readLocal(userId: string): TypingAttemptRecord[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_TYPING_PREFIX}${userId}`);
    return raw ? (JSON.parse(raw) as TypingAttemptRecord[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(userId: string, rows: TypingAttemptRecord[]) {
  try {
    localStorage.setItem(
      `${LOCAL_TYPING_PREFIX}${userId}`,
      JSON.stringify(rows.slice(0, 30))
    );
  } catch {
    // ignore
  }
}

export async function listTypingAttempts(
  userId: string
): Promise<TypingAttemptRecord[]> {
  if (!userId) return [];

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('typing_attempts')
      .select(
        'id, user_id, preset_id, preset_title, duration_seconds, wpm, cpm, accuracy_pct, error_count, created_at'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      writeLocal(userId, data as TypingAttemptRecord[]);
      return data as TypingAttemptRecord[];
    }
  }

  return readLocal(userId);
}

export async function saveTypingAttempt(
  userId: string,
  payload: Omit<TypingAttemptRecord, 'id' | 'user_id' | 'created_at'>
): Promise<TypingAttemptRecord> {
  const localRecord: TypingAttemptRecord = {
    id: crypto.randomUUID(),
    user_id: userId,
    ...payload,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase && userId && userId !== 'guest') {
    const { data, error } = await supabase
      .from('typing_attempts')
      .insert({
        user_id: userId,
        preset_id: payload.preset_id,
        preset_title: payload.preset_title,
        duration_seconds: payload.duration_seconds,
        wpm: payload.wpm,
        cpm: payload.cpm,
        accuracy_pct: payload.accuracy_pct,
        error_count: payload.error_count,
      })
      .select(
        'id, user_id, preset_id, preset_title, duration_seconds, wpm, cpm, accuracy_pct, error_count, created_at'
      )
      .single();

    if (error) {
      throw new Error(error.message);
    }
    const existing = readLocal(userId);
    writeLocal(userId, [data as TypingAttemptRecord, ...existing]);
    const saved = data as TypingAttemptRecord;
    emitEcosystemTelemetry({
      divisionId: 'lounge',
      agentId: 13,
      entityId: saved.id,
      title: 'Tes mengetik selesai',
      summary: `Latihan mengetik selesai (${payload.wpm} WPM, akurasi ${payload.accuracy_pct}%)`,
      targetZone: 'lounge',
      targetFloor: 2,
      severity: 'success',
      metadata: {
        event: 'typing_completed',
        presetId: payload.preset_id,
        wpm: payload.wpm,
        accuracyPct: payload.accuracy_pct,
        durationSeconds: payload.duration_seconds,
      },
    });
    return saved;
  }

  const key = userId || 'guest';
  const existing = readLocal(key);
  writeLocal(key, [localRecord, ...existing]);
  emitEcosystemTelemetry({
    divisionId: 'lounge',
    agentId: 13,
    entityId: localRecord.id,
    title: 'Tes mengetik selesai',
    summary: `Latihan mengetik selesai (${payload.wpm} WPM, akurasi ${payload.accuracy_pct}%)`,
    targetZone: 'lounge',
    targetFloor: 2,
    severity: 'success',
    metadata: {
      event: 'typing_completed',
      presetId: payload.preset_id,
      wpm: payload.wpm,
      accuracyPct: payload.accuracy_pct,
      durationSeconds: payload.duration_seconds,
    },
  });
  return localRecord;
}

import { isSupabaseConfigured, supabase } from '../../shared/lib/supabase';
import { emitEcosystemTelemetry } from '../../shared/services/ecosystemTelemetry';

export type TryoutEventStatus = 'live' | 'upcoming' | 'ended';

export interface TryoutEvent {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  durationMinutes: number;
  questionCount: number;
  startAt: string;
  endAt: string;
  maxParticipants: number;
  registeredCount: number;
  prizeNote: string;
}

const REG_STORAGE_KEY = 'lokatalenta_tryout_registrations_v1';

export function buildScheduledTryoutEvents(referenceNowMs: number = Date.now()): TryoutEvent[] {
  const dayMs = 24 * 60 * 60 * 1000;
  return [
    {
      id: 'tryout-akbar-bumn-live',
      title: 'Tryout Akbar Nasional: TKD & Core Values BUMN',
      subtitle: 'Simulasi serentak dengan pemeringkatan nasional real-time.',
      category: 'Psikotes & BUMN',
      durationMinutes: 90,
      questionCount: 50,
      startAt: new Date(referenceNowMs - 2 * 60 * 60 * 1000).toISOString(),
      endAt: new Date(referenceNowMs + 3 * dayMs).toISOString(),
      maxParticipants: 500,
      registeredCount: 342,
      prizeNote: 'Sertifikat Peringkat Top 10 & Pembahasan Lengkap',
    },
    {
      id: 'tryout-akbar-cpns-upcoming',
      title: 'Tryout Akbar SKD CPNS: TWK, TIU & TKP',
      subtitle: 'Uji ketahanan fokus dan manajemen waktu sesuai standar CAT.',
      category: 'CPNS & Kedinasan',
      durationMinutes: 100,
      questionCount: 60,
      startAt: new Date(referenceNowMs + 2 * dayMs).toISOString(),
      endAt: new Date(referenceNowMs + 5 * dayMs).toISOString(),
      maxParticipants: 1000,
      registeredCount: 618,
      prizeNote: 'Badge Juara Tryout & Analisis Kelemahan Subtest',
    },
    {
      id: 'tryout-akbar-english-ended',
      title: 'Tryout Akbar TOEFL ITP & Listening Intensive',
      subtitle: 'Evaluasi Structure, Reading, dan Listening berstandar internasional.',
      category: 'Bahasa & Sertifikasi',
      durationMinutes: 60,
      questionCount: 40,
      startAt: new Date(referenceNowMs - 6 * dayMs).toISOString(),
      endAt: new Date(referenceNowMs - 2 * dayMs).toISOString(),
      maxParticipants: 300,
      registeredCount: 289,
      prizeNote: 'Arsip Leaderboard & Review Pembahasan',
    },
  ];
}

export function getTryoutEventStatus(event: TryoutEvent, nowMs: number = Date.now()): TryoutEventStatus {
  const start = new Date(event.startAt).getTime();
  const end = new Date(event.endAt).getTime();
  if (nowMs < start) return 'upcoming';
  if (nowMs <= end) return 'live';
  return 'ended';
}

export function getRegisteredTryoutIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(`${REG_STORAGE_KEY}_${userId}`);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function toggleTryoutRegistration(userId: string, eventId: string): string[] {
  const current = getRegisteredTryoutIds(userId);
  const exists = current.includes(eventId);
  const next = exists ? current.filter((id) => id !== eventId) : [...current, eventId];
  try {
    localStorage.setItem(`${REG_STORAGE_KEY}_${userId}`, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
  emitEcosystemTelemetry({
    divisionId: 'lounge',
    agentId: 13,
    entityId: eventId,
    title: exists ? 'Pendaftaran tryout dibatalkan' : 'Pendaftaran tryout dikonfirmasi',
    summary: `Status registrasi tryout ${eventId}: ${exists ? 'dibatalkan' : 'terdaftar'}`,
    targetZone: 'lounge',
    targetFloor: 2,
    severity: 'info',
    metadata: {
      event: exists ? 'tryout_unregistered' : 'tryout_registered',
      eventId,
    },
  });
  return next;
}

export async function syncTryoutRegistrationsFromServer(userId: string): Promise<string[]> {
  const localIds = getRegisteredTryoutIds(userId);
  if (!isSupabaseConfigured || !supabase || !userId || userId === 'guest') {
    return localIds;
  }

  try {
    const { data, error } = await supabase
      .from('tryout_registrations')
      .select('event_id')
      .eq('user_id', userId);
    if (error || !data) return localIds;

    const merged = Array.from(
      new Set([...localIds, ...data.map((r: { event_id: string }) => r.event_id)])
    );
    localStorage.setItem(`${REG_STORAGE_KEY}_${userId}`, JSON.stringify(merged));
    return merged;
  } catch {
    return localIds;
  }
}

export async function toggleTryoutRegistrationAsync(
  userId: string,
  eventId: string
): Promise<string[]> {
  const wasRegistered = getRegisteredTryoutIds(userId).includes(eventId);
  const next = toggleTryoutRegistration(userId, eventId);

  if (isSupabaseConfigured && supabase && userId && userId !== 'guest') {
    try {
      if (wasRegistered) {
        await supabase
          .from('tryout_registrations')
          .delete()
          .eq('user_id', userId)
          .eq('event_id', eventId);
      } else {
        await supabase
          .from('tryout_registrations')
          .upsert({ user_id: userId, event_id: eventId }, { onConflict: 'user_id,event_id' });
      }
    } catch {
      // keep optimistic local state
    }
  }

  return next;
}

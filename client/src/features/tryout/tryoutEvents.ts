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
  return next;
}

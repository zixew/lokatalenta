import { isSupabaseConfigured, supabase } from '../../shared/lib/supabase';

export interface ChallengeParams {
  challenger: string;
  targetScore: number;
}

export interface ChallengeDuelOutcome {
  outcome: 'win' | 'draw' | 'lose';
  headline: string;
  diff: number;
}

export interface QuizChallengeRecord {
  id: string;
  quiz_id: string;
  challenger_name: string;
  target_score: number;
  opponent_name: string;
  opponent_score: number;
  outcome: 'win' | 'draw' | 'lose';
  created_at: string;
}

const ACTIVE_CHALLENGE_PREFIX = 'lokatalenta_active_challenge_v1_';
const CHALLENGE_HISTORY_KEY = 'lokatalenta_challenge_history_v1';

export function parseChallengeParams(search: string): ChallengeParams | null {
  const params = new URLSearchParams(search);
  const rawScore = params.get('challengeScore');
  const challenger = params.get('challenger')?.trim();
  if (!rawScore || !challenger) return null;

  const targetScore = Number(rawScore);
  if (!Number.isFinite(targetScore) || targetScore < 0 || targetScore > 100) {
    return null;
  }

  return { challenger, targetScore: Math.round(targetScore) };
}

export function saveActiveChallengeForQuiz(quizId: string, challenge: ChallengeParams): void {
  try {
    localStorage.setItem(`${ACTIVE_CHALLENGE_PREFIX}${quizId}`, JSON.stringify(challenge));
  } catch {
    // ignore storage errors
  }
}

export function getActiveChallengeForQuiz(quizId: string): ChallengeParams | null {
  try {
    const raw = localStorage.getItem(`${ACTIVE_CHALLENGE_PREFIX}${quizId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChallengeParams;
    if (
      !parsed ||
      typeof parsed.challenger !== 'string' ||
      typeof parsed.targetScore !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function evaluateChallengeOutcome(
  myScore: number,
  challengeInfo: ChallengeParams
): ChallengeDuelOutcome {
  const roundedMy = Math.round(myScore);
  const roundedTarget = Math.round(challengeInfo.targetScore);
  const diff = roundedMy - roundedTarget;

  if (diff > 0) {
    return {
      outcome: 'win',
      headline: `MENANG! Anda unggul +${diff} poin atas ${challengeInfo.challenger}.`,
      diff,
    };
  }
  if (diff === 0) {
    return {
      outcome: 'draw',
      headline: `SERI! Skor Anda imbang dengan ${challengeInfo.challenger} (${roundedTarget}/100).`,
      diff: 0,
    };
  }
  return {
    outcome: 'lose',
    headline: `BELUM MENANG — terpaut ${Math.abs(diff)} poin dari ${challengeInfo.challenger}.`,
    diff,
  };
}

export function getLocalQuizChallenges(quizId?: string): QuizChallengeRecord[] {
  try {
    const raw = localStorage.getItem(CHALLENGE_HISTORY_KEY);
    const list = raw ? (JSON.parse(raw) as QuizChallengeRecord[]) : [];
    return quizId ? list.filter((r) => r.quiz_id === quizId) : list;
  } catch {
    return [];
  }
}

export async function recordQuizChallengeAsync(input: {
  attemptKey: string;
  quizId: string;
  challengerName: string;
  targetScore: number;
  opponentUserId?: string;
  opponentName: string;
  opponentScore: number;
  outcome: 'win' | 'draw' | 'lose';
}): Promise<QuizChallengeRecord[]> {
  const current = getLocalQuizChallenges();
  if (current.some((r) => r.id === input.attemptKey)) {
    return current.filter((r) => r.quiz_id === input.quizId);
  }

  const record: QuizChallengeRecord = {
    id: input.attemptKey,
    quiz_id: input.quizId,
    challenger_name: input.challengerName,
    target_score: Math.round(input.targetScore),
    opponent_name: input.opponentName || 'Peserta',
    opponent_score: Math.round(input.opponentScore),
    outcome: input.outcome,
    created_at: new Date().toISOString(),
  };

  const next = [record, ...current].slice(0, 50);
  try {
    localStorage.setItem(CHALLENGE_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }

  if (isSupabaseConfigured && supabase && input.opponentUserId) {
    try {
      await supabase.from('quiz_challenges').insert({
        quiz_id: input.quizId,
        challenger_name: record.challenger_name,
        target_score: record.target_score,
        opponent_user_id: input.opponentUserId,
        opponent_name: record.opponent_name,
        opponent_score: record.opponent_score,
        outcome: record.outcome,
      });
    } catch {
      // keep optimistic local state
    }
  }

  return next.filter((r) => r.quiz_id === input.quizId);
}

export async function listQuizChallengesAsync(quizId: string): Promise<QuizChallengeRecord[]> {
  const local = getLocalQuizChallenges(quizId);
  if (!isSupabaseConfigured || !supabase) {
    return local;
  }

  try {
    const { data, error } = await supabase
      .from('quiz_challenges')
      .select('id, quiz_id, challenger_name, target_score, opponent_name, opponent_score, outcome, created_at')
      .eq('quiz_id', quizId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !data || data.length === 0) return local;
    return data as QuizChallengeRecord[];
  } catch {
    return local;
  }
}

export function buildChallengeUrl(
  origin: string,
  quizId: string,
  score: number,
  challengerName: string
): string {
  const params = new URLSearchParams({
    challengeScore: String(Math.round(score)),
    challenger: challengerName.trim() || 'Peserta LokaTalenta',
  });
  return `${origin}/quiz/${quizId}?${params.toString()}`;
}

export function buildWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function buildLinkedInShareUrl(shareUrl: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
}

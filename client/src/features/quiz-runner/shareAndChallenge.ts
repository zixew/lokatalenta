export interface ChallengeParams {
  challenger: string;
  targetScore: number;
}

export interface ChallengeDuelOutcome {
  outcome: 'win' | 'draw' | 'lose';
  headline: string;
  diff: number;
}

const ACTIVE_CHALLENGE_PREFIX = 'lokatalenta_active_challenge_v1_';

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

export interface ChallengeParams {
  challenger: string;
  targetScore: number;
}

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

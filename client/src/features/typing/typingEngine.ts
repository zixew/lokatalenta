export interface TypingMetrics {
  wpm: number;
  cpm: number;
  accuracyPct: number;
  errorCount: number;
  correctChars: number;
  totalTyped: number;
}

export function computeTypingMetrics(
  targetText: string,
  typedText: string,
  elapsedSeconds: number
): TypingMetrics {
  const totalTyped = typedText.length;
  if (totalTyped === 0) {
    return {
      wpm: 0,
      cpm: 0,
      accuracyPct: 100,
      errorCount: 0,
      correctChars: 0,
      totalTyped: 0,
    };
  }

  let correctChars = 0;
  let errorCount = 0;

  for (let i = 0; i < totalTyped; i += 1) {
    if (i < targetText.length && typedText[i] === targetText[i]) {
      correctChars += 1;
    } else {
      errorCount += 1;
    }
  }

  const accuracyPct = Number(((correctChars / totalTyped) * 100).toFixed(1));
  const safeSeconds = Math.max(1, elapsedSeconds);
  const minutes = safeSeconds / 60;
  const cpm = Math.round(correctChars / minutes);
  const wpm = Math.round(correctChars / 5 / minutes);

  return {
    wpm,
    cpm,
    accuracyPct,
    errorCount,
    correctChars,
    totalTyped,
  };
}

/**
 * Normalizes a short-answer string by trimming leading/trailing whitespace
 * and collapsing internal runs of whitespace into single spaces.
 */
export function normalizeShortAnswer(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Evaluates whether a student's short-answer input matches any of the
 * accepted answers after trimming and collapsing consecutive spaces.
 */
export function evaluateShortAnswer(
  input: string,
  acceptedAnswers: string[],
  caseSensitive = false
): boolean {
  const normalizedInput = normalizeShortAnswer(input ?? '');
  if (!normalizedInput || !Array.isArray(acceptedAnswers) || acceptedAnswers.length === 0) {
    return false;
  }

  const target = caseSensitive ? normalizedInput : normalizedInput.toLowerCase();

  return acceptedAnswers.some((candidate) => {
    const normalizedCandidate = normalizeShortAnswer(candidate ?? '');
    if (!normalizedCandidate) return false;
    return (caseSensitive ? normalizedCandidate : normalizedCandidate.toLowerCase()) === target;
  });
}

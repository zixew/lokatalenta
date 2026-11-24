export function sanitizeUserText(input: string, maxLength: number = 2000): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
    .slice(0, maxLength);
}

export function sanitizeCsvCell(value: string): string {
  const str = String(value ?? '');
  const trimmedStart = str.replace(/^\s+/, '');
  const needsPrefix = /^[=+\-@\t\r]/.test(trimmedStart);
  const safe = needsPrefix ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function isSafeHttpUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/')) return !trimmed.startsWith('//');
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function createActionRateLimiter(minIntervalMs: number): () => boolean {
  let lastTriggerAt = 0;
  return () => {
    const now = Date.now();
    if (now - lastTriggerAt < minIntervalMs) {
      return false;
    }
    lastTriggerAt = now;
    return true;
  };
}

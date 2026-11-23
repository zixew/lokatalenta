export function normalizeSpeechText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?'"():;。、！？「」『』]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function evaluateSpeechMatch(spoken: string, target: string, romaji?: string): boolean {
  const s = normalizeSpeechText(spoken);
  if (!s) return false;
  const t = normalizeSpeechText(target);
  const r = romaji ? normalizeSpeechText(romaji) : '';
  return s === t || t.includes(s) || s.includes(t) || (Boolean(r) && (s === r || r.includes(s)));
}

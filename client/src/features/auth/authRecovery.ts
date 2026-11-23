export function isRecoverySearchOrHash(search: string, hash: string): boolean {
  const s = new URLSearchParams(search);
  const h = new URLSearchParams(hash.replace(/^#/, ''));
  return s.get('type') === 'recovery' || h.get('type') === 'recovery';
}

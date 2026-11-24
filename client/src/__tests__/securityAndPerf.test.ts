import { describe, it, expect } from 'vitest';
import {
  createActionRateLimiter,
  isSafeHttpUrl,
  sanitizeCsvCell,
  sanitizeUserText,
} from '../shared/lib/securityGuards';
import { evaluateCell, SPREADSHEET_SCENARIOS } from '../features/player/spreadsheetEngine';

describe('Security Hardening Suite (BL-23C)', () => {
  it('sanitizes XSS payloads and unsafe URLs', () => {
    expect(sanitizeUserText('<script>alert(1)</script>Halo <b>Rizco</b>')).toBe('alert(1)Halo Rizco');
    expect(sanitizeUserText('javascript:alert(1) onclick=hack()')).toBe('alert(1) hack()');
    expect(isSafeHttpUrl('https://lokatalenta.vercel.app/verify/LT-1')).toBe(true);
    expect(isSafeHttpUrl('/kraepelin')).toBe(true);
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeHttpUrl('//evil.example.com')).toBe(false);
  });

  it('prevents CSV Formula Injection on exported cells', () => {
    expect(sanitizeCsvCell('=CMD("calc")')).toBe('"\'=CMD(""calc"")"');
    expect(sanitizeCsvCell('+1+1')).toBe('"\'+1+1"');
    expect(sanitizeCsvCell('@SUM(A1)')).toBe('"\'@SUM(A1)"');
    expect(sanitizeCsvCell('Rizco Renova')).toBe('"Rizco Renova"');
  });

  it('enforces action rate limiting against rapid duplicate submissions', () => {
    const canProceed = createActionRateLimiter(500);
    expect(canProceed()).toBe(true);
    expect(canProceed()).toBe(false);
  });
});

describe('Performance Benchmark Gate (BL-23C)', () => {
  it('evaluates 1,000 spreadsheet formulas in under 50ms', () => {
    const cells = {
      ...SPREADSHEET_SCENARIOS[0].initialCells,
      B6: '=SUM(B2:B5)',
    };
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      evaluateCell('B6', cells);
    }
    const elapsedMs = performance.now() - start;
    expect(elapsedMs).toBeLessThan(50);
  });

  it('filters 1,000 mock course records in under 15ms', () => {
    const catalog = Array.from({ length: 1000 }, (_, i) => ({
      id: `c-${i}`,
      title: i % 2 === 0 ? `Kursus Excel & Komisi ${i}` : `Latihan Psikotes ${i}`,
      category: i % 2 === 0 ? 'Teknis' : 'Psikotes',
      level: i % 3 === 0 ? 'Pemula' : 'Menengah',
    }));

    const start = performance.now();
    const matched = catalog.filter(
      (c) => c.category === 'Teknis' && c.level === 'Pemula' && c.title.toLowerCase().includes('excel')
    );
    const elapsedMs = performance.now() - start;

    expect(matched.length).toBeGreaterThan(0);
    expect(elapsedMs).toBeLessThan(15);
  });
});

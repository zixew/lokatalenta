import { describe, it, expect } from 'vitest';
import {
  sanitizeUserText,
  sanitizeCsvCell,
  isSafeHttpUrl,
  createActionRateLimiter,
} from '../shared/lib/securityGuards';
import { evaluateCell, SPREADSHEET_SCENARIOS } from '../features/player/spreadsheetEngine';
import { executeClientSql } from '../features/player/sqlSandboxEngine';
import { evaluateShortAnswer, normalizeShortAnswer } from '../features/quiz-runner/shortAnswerEvaluator';

/**
 * Sprint 13 - BL-41: Automated Stress & Security Benchmark Suite v2
 * Test Cases: PERF-02 (5,000 Operations Stress & Latency Gate), SEC-02 (Comprehensive Security & Sandbox Injection Gate)
 */
describe('BL-41 / PERF-02: High-Volume 5,000 Operations Stress Benchmark Suite', () => {
  it('executes 1,000 spreadsheet formula evaluations within latency budget (< 60ms)', () => {
    const cells = {
      ...SPREADSHEET_SCENARIOS[0].initialCells,
      B6: '=SUM(B2:B5)',
      B7: '=AVERAGE(B2:B5)',
    };

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      const cellKey = i % 2 === 0 ? 'B6' : 'B7';
      const result = evaluateCell(cellKey, cells);
      expect(result).toBeDefined();
    }
    const elapsedMs = performance.now() - start;
    expect(elapsedMs).toBeLessThan(60);
  });

  it('executes 1,000 SQL sandbox queries with filtering, sorting, and limit (< 100ms)', () => {
    const queries = [
      'SELECT nama, gaji FROM karyawan WHERE gaji > 8000000',
      'SELECT nama, skor_tes FROM karyawan ORDER BY skor_tes DESC LIMIT 2',
      "SELECT nama, divisi FROM karyawan WHERE divisi = 'Keuangan'",
      'SELECT COUNT(*) FROM karyawan',
    ];

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      const q = queries[i % queries.length];
      const res = executeClientSql(q);
      expect(res.ok).toBe(true);
      expect(res.rows.length).toBeGreaterThan(0);
    }
    const elapsedMs = performance.now() - start;
    expect(elapsedMs).toBeLessThan(100);
  });

  it('executes 1,000 multi-criteria catalog searches and filtering across 1,000 items (< 30ms)', () => {
    const mockCatalog = Array.from({ length: 1000 }, (_, i) => ({
      id: `course-${i}`,
      title: i % 3 === 0 ? `Mastering React & TypeScript ${i}` : i % 3 === 1 ? `Psikotes Spasial & Logika ${i}` : `Excel Keuangan Lanjutan ${i}`,
      category: i % 3 === 0 ? 'Teknologi' : i % 3 === 1 ? 'Psikotes' : 'Bisnis',
      level: i % 2 === 0 ? 'Pemula' : 'Lanjutan',
      rating: 4.0 + (i % 10) / 10,
    }));

    const searchKeywords = ['react', 'psikotes', 'keuangan', 'lanjutan'];

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      const kw = searchKeywords[i % searchKeywords.length];
      const category = i % 2 === 0 ? 'Teknologi' : 'Bisnis';
      const results = mockCatalog.filter(
        (item) => item.category === category && item.title.toLowerCase().includes(kw)
      );
      expect(Array.isArray(results)).toBe(true);
    }
    const elapsedMs = performance.now() - start;
    expect(elapsedMs).toBeLessThan(30);
  });

  it('evaluates 1,000 short answer question submissions with fuzzing (< 50ms)', () => {
    const acceptedAnswers = ['Jakarta', 'DKI Jakarta', 'Ibukota Jakarta'];
    const inputs = [
      '  jakarta  ',
      'dki   jakarta',
      'IBUKOTA JAKARTA',
      'Bandung',
      'surabaya',
    ];

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      const input = inputs[i % inputs.length];
      const isCorrect = evaluateShortAnswer(input, acceptedAnswers, false);
      if (i % inputs.length < 3) {
        expect(isCorrect).toBe(true);
      } else {
        expect(isCorrect).toBe(false);
      }
    }
    const elapsedMs = performance.now() - start;
    expect(elapsedMs).toBeLessThan(50);
  });

  it('sanitizes 1,000 malicious user texts and CSV injection cells (< 60ms)', () => {
    const payloads = [
      '<script>alert("xss")</script>Halo Dunia',
      '=CMD("calc.exe")',
      '+cmd|"/c calc"!A1',
      '@SUM(1+1)*cmd',
      '-2+3+cmd|',
      '<img src="x" onerror="alert(1)">Gambar',
    ];

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      const payload = payloads[i % payloads.length];
      const textSanitized = sanitizeUserText(payload);
      const csvSanitized = sanitizeCsvCell(payload);

      expect(textSanitized).not.toContain('<script>');
      expect(textSanitized).not.toContain('onerror=');
      if (payload.startsWith('=') || payload.startsWith('+') || payload.startsWith('@') || payload.startsWith('-')) {
        expect(csvSanitized.startsWith('"\'')).toBe(true);
      }
    }
    const elapsedMs = performance.now() - start;
    expect(elapsedMs).toBeLessThan(60);
  });
});

describe('BL-41 / SEC-02: Comprehensive Security & Sandbox Hardening Gate', () => {
  it('blocks all SQL DDL and DML destructive queries in sandbox', () => {
    const maliciousQueries = [
      'DROP TABLE karyawan',
      'DELETE FROM karyawan WHERE 1=1',
      'UPDATE karyawan SET gaji = 999999999',
      'INSERT INTO karyawan (id, nama) VALUES (99, "Attacker")',
      'ALTER TABLE karyawan ADD COLUMN hack text',
      'TRUNCATE TABLE karyawan',
      'SELECT * FROM karyawan UNION SELECT * FROM users',
      'SELECT * FROM karyawan; DROP TABLE karyawan;',
      'SELECT * FROM karyawan -- comment bypass',
    ];

    maliciousQueries.forEach((query) => {
      const result = executeClientSql(query);
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  it('neutralizes XSS injection across profile, teacher studio, and feedback', () => {
    const attacks = [
      { input: '<script>window.location="http://evil.com"</script>', expectedNot: '<script>' },
      { input: '<a href="javascript:stealCookie()">Klik</a>', expectedNot: 'javascript:' },
      { input: '<svg/onload=alert(1)>', expectedNot: 'onload=' },
    ];

    attacks.forEach(({ input, expectedNot }) => {
      const sanitized = sanitizeUserText(input);
      expect(sanitized).not.toContain(expectedNot);
    });
  });

  it('validates URL safety rejecting dangerous protocols and foreign origins', () => {
    expect(isSafeHttpUrl('https://lokatalenta.vercel.app')).toBe(true);
    expect(isSafeHttpUrl('/dashboard')).toBe(true);
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeHttpUrl('vbscript:msgbox(1)')).toBe(false);
  });

  it('normalizes short answer whitespace and trims correctly', () => {
    expect(normalizeShortAnswer('  Halo   Dunia   ')).toBe('Halo Dunia');
    expect(normalizeShortAnswer('\n\t multi   line \t')).toBe('multi line');
    expect(evaluateShortAnswer('  dki   jakarta  ', ['DKI Jakarta'], false)).toBe(true);
    expect(evaluateShortAnswer('dki jakarta', ['DKI Jakarta'], true)).toBe(false); // Case sensitive check
  });

  it('enforces rate limiting against bot spamming', () => {
    const limiter = createActionRateLimiter(300);
    expect(limiter()).toBe(true);
    expect(limiter()).toBe(false);
  });
});

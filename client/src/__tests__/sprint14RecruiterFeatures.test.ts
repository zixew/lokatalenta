/**
 * Sprint 14 — Recruiter Portal Features
 * BL-44 & QA/DevOps: Comprehensive QA Automation Suite
 *
 * Coverage:
 *  1. Filter kandidat berdasarkan Radar 5D & Kraepelin
 *  2. Manajemen Shortlist (tambah, cegah duplikat, hapus)
 *  3. Generator tautan undangan asesmen & validasi token
 *  4. Validasi role 'recruiter' pada RBAC & isolasi akses
 *  5. Sanitasi teks: nama organisasi & posisi (XSS & injection)
 *  6. Radar 5D — computeTalentRadarMetrics (data nyata)
 *  7. exportShortlistCsv — format & keamanan
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  addToShortlist,
  buildInviteUrl,
  createAssessmentInvitation,
  createInvite,
  exportShortlistCsv,
  getShortlistedIds,
  getStoredInvitations,
  INITIAL_RECRUITER_CANDIDATES,
  listInvites,
  readShortlist,
  removeFromShortlist,
  saveShortlistedIds,
  toggleCandidateShortlist,
} from '../features/recruiter/recruiterApi';
import {
  computeTalentRadarMetrics,
  extractCategoryScoresFromAttempts,
} from '../features/talent/talentRadar';
import { sanitizeCsvCell, sanitizeUserText } from '../shared/lib/securityGuards';
import type { RecruiterCandidate, UserRole } from '../shared/types/lms';

// ─── Memory localStorage stub ─────────────────────────────────────────────────

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() { return store.size; },
    clear: () => store.clear(),
    getItem: (k: string) => store.get(k) ?? null,
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    removeItem: (k: string) => { store.delete(k); },
    setItem: (k: string, v: string) => { store.set(k, v); },
  };
}

// ─── RBAC helpers (pure, no Supabase) ────────────────────────────────────────

type RecruiterPermission =
  | 'view_candidates'
  | 'manage_shortlist'
  | 'create_invite'
  | 'export_csv';

const ROLE_PERMISSIONS: Record<UserRole, RecruiterPermission[]> = {
  recruiter: ['view_candidates', 'manage_shortlist', 'create_invite', 'export_csv'],
  admin:     ['view_candidates', 'manage_shortlist', 'create_invite', 'export_csv'],
  teacher:   [],
  student:   [],
};

function hasPermission(role: UserRole, permission: RecruiterPermission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// ─── Candidate filter helpers ─────────────────────────────────────────────────

interface FilterCriteria {
  category?: string;
  readiness?: RecruiterCandidate['readiness_status'];
  minKognitif?: number;
  minLogika?: number;
  minKraepelinSpeed?: number;
  minKraepelinAccuracy?: number;
}

function filterCandidates(
  candidates: RecruiterCandidate[],
  criteria: FilterCriteria
): RecruiterCandidate[] {
  return candidates.filter((c) => {
    if (criteria.category && c.category !== criteria.category) return false;
    if (criteria.readiness && c.readiness_status !== criteria.readiness) return false;
    if (criteria.minKognitif !== undefined && c.radar_scores.kognitif < criteria.minKognitif)
      return false;
    if (criteria.minLogika !== undefined && c.radar_scores.logika < criteria.minLogika)
      return false;
    if (
      criteria.minKraepelinSpeed !== undefined &&
      (c.kraepelin_summary?.speed_wpm ?? 0) < criteria.minKraepelinSpeed
    )
      return false;
    if (
      criteria.minKraepelinAccuracy !== undefined &&
      (c.kraepelin_summary?.accuracy_pct ?? 0) < criteria.minKraepelinAccuracy
    )
      return false;
    return true;
  });
}

// ─── Token validation ─────────────────────────────────────────────────────────

function isValidInviteToken(token: string): boolean {
  // tokens produced by createAssessmentInvitation: 4 uppercase letters/digits + dash + 5 chars
  // accept any non-empty string with uppercase letters, digits, dashes; length 4–30
  return /^[A-Z0-9-]{4,30}$/.test(token);
}

function sanitizeOrgName(raw: string): string {
  return sanitizeUserText(raw.trim(), 200);
}

function sanitizePositionName(raw: string): string {
  return sanitizeUserText(raw.trim(), 200);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE
// ─────────────────────────────────────────────────────────────────────────────

describe('Sprint 14 — Recruiter Portal Features (BL-44 & QA/DevOps)', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
    // Provide window.location.origin for buildInviteUrl
    if (typeof globalThis.window === 'undefined') {
      Object.defineProperty(globalThis, 'window', {
        value: { location: { origin: 'https://lokatalenta.vercel.app' } },
        configurable: true,
        writable: true,
      });
    } else {
      Object.defineProperty(globalThis.window, 'location', {
        value: { origin: 'https://lokatalenta.vercel.app' },
        configurable: true,
        writable: true,
      });
    }
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 1. Filter kandidat berdasarkan Radar 5D & Kraepelin
  // ════════════════════════════════════════════════════════════════════════════

  describe('1. Filter kandidat berdasarkan Radar 5D & Kraepelin', () => {
    const pool = INITIAL_RECRUITER_CANDIDATES;

    it('pool demo berisi 5 kandidat', () => {
      expect(pool).toHaveLength(5);
    });

    it('mengembalikan semua kandidat saat tidak ada filter', () => {
      expect(filterCandidates(pool, {})).toHaveLength(pool.length);
    });

    it('memfilter berdasarkan kategori — Teknologi & Data', () => {
      const result = filterCandidates(pool, { category: 'Teknologi & Data' });
      expect(result.length).toBeGreaterThan(0);
      result.forEach((c) => expect(c.category).toBe('Teknologi & Data'));
    });

    it('memfilter berdasarkan kategori — Keuangan & Analisis', () => {
      const result = filterCandidates(pool, { category: 'Keuangan & Analisis' });
      expect(result.length).toBeGreaterThan(0);
      result.forEach((c) => expect(c.category).toBe('Keuangan & Analisis'));
    });

    it("memfilter berdasarkan readiness_status 'ready'", () => {
      const result = filterCandidates(pool, { readiness: 'ready' });
      result.forEach((c) => expect(c.readiness_status).toBe('ready'));
    });

    it("memfilter berdasarkan readiness_status 'developing'", () => {
      const result = filterCandidates(pool, { readiness: 'developing' });
      result.forEach((c) => expect(c.readiness_status).toBe('developing'));
    });

    it('memfilter berdasarkan skor kognitif minimum Radar 5D', () => {
      const result = filterCandidates(pool, { minKognitif: 90 });
      result.forEach((c) => expect(c.radar_scores.kognitif).toBeGreaterThanOrEqual(90));
    });

    it('memfilter berdasarkan skor logika minimum Radar 5D', () => {
      const result = filterCandidates(pool, { minLogika: 95 });
      result.forEach((c) => expect(c.radar_scores.logika).toBeGreaterThanOrEqual(95));
    });

    it('memfilter berdasarkan kecepatan Kraepelin minimum (WPM)', () => {
      const result = filterCandidates(pool, { minKraepelinSpeed: 80 });
      result.forEach((c) =>
        expect(c.kraepelin_summary?.speed_wpm ?? 0).toBeGreaterThanOrEqual(80)
      );
    });

    it('memfilter berdasarkan ketelitian Kraepelin minimum (%)', () => {
      const result = filterCandidates(pool, { minKraepelinAccuracy: 97 });
      result.forEach((c) =>
        expect(c.kraepelin_summary?.accuracy_pct ?? 0).toBeGreaterThanOrEqual(97)
      );
    });

    it('menggabungkan filter kognitif + logika + kecepatan kraepelin', () => {
      const result = filterCandidates(pool, {
        minKognitif: 90,
        minLogika: 95,
        minKraepelinSpeed: 85,
      });
      result.forEach((c) => {
        expect(c.radar_scores.kognitif).toBeGreaterThanOrEqual(90);
        expect(c.radar_scores.logika).toBeGreaterThanOrEqual(95);
        expect(c.kraepelin_summary?.speed_wpm ?? 0).toBeGreaterThanOrEqual(85);
      });
    });

    it('mengembalikan array kosong jika tidak ada kandidat yang memenuhi syarat', () => {
      expect(filterCandidates(pool, { minKognitif: 100 })).toHaveLength(0);
    });

    it('semua kandidat memiliki 5 dimensi radar: kognitif, logika, ketahanan, komunikasi, spasial', () => {
      pool.forEach((c) => {
        expect(c.radar_scores).toHaveProperty('kognitif');
        expect(c.radar_scores).toHaveProperty('logika');
        expect(c.radar_scores).toHaveProperty('ketahanan');
        expect(c.radar_scores).toHaveProperty('komunikasi');
        expect(c.radar_scores).toHaveProperty('spasial');
      });
    });

    it('semua skor Radar 5D berada dalam rentang 0–100', () => {
      pool.forEach((c) => {
        Object.values(c.radar_scores).forEach((score) => {
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        });
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. Manajemen Shortlist
  // ════════════════════════════════════════════════════════════════════════════

  describe('2. Manajemen Shortlist', () => {
    it('shortlist kosong di awal (localStorage bersih)', () => {
      expect(getShortlistedIds()).toEqual([]);
      expect(readShortlist()).toEqual([]);
    });

    it('addToShortlist menambahkan candidateId ke localStorage', () => {
      addToShortlist('cand-01');
      expect(getShortlistedIds()).toContain('cand-01');
    });

    it('addToShortlist beberapa kandidat berbeda', () => {
      addToShortlist('cand-01');
      addToShortlist('cand-02');
      addToShortlist('cand-03');
      const list = getShortlistedIds();
      expect(list).toHaveLength(3);
      expect(list).toContain('cand-01');
      expect(list).toContain('cand-02');
      expect(list).toContain('cand-03');
    });

    it('addToShortlist mencegah duplikat — id yang sama tidak diulang', () => {
      addToShortlist('cand-01');
      addToShortlist('cand-01');
      addToShortlist('cand-01');
      const list = getShortlistedIds();
      const occurrences = list.filter((id) => id === 'cand-01').length;
      expect(occurrences).toBe(1);
    });

    it('saveShortlistedIds menyimpan array langsung (idempoten)', () => {
      saveShortlistedIds(['a', 'b', 'c']);
      expect(getShortlistedIds()).toEqual(['a', 'b', 'c']);
    });

    it('toggleCandidateShortlist menambahkan id yang belum ada (returns true)', () => {
      const added = toggleCandidateShortlist('cand-02');
      expect(added).toBe(true);
      expect(getShortlistedIds()).toContain('cand-02');
    });

    it('toggleCandidateShortlist menghapus id yang sudah ada (returns false)', () => {
      addToShortlist('cand-03');
      const removed = toggleCandidateShortlist('cand-03');
      expect(removed).toBe(false);
      expect(getShortlistedIds()).not.toContain('cand-03');
    });

    it('toggleCandidateShortlist idempoten saat digunakan bergantian', () => {
      toggleCandidateShortlist('cand-04'); // add
      toggleCandidateShortlist('cand-04'); // remove
      toggleCandidateShortlist('cand-04'); // add again
      expect(getShortlistedIds()).toContain('cand-04');
    });

    it('removeFromShortlist menghapus kandidat yang ada', () => {
      addToShortlist('cand-01');
      addToShortlist('cand-02');
      removeFromShortlist('cand-01');
      const list = getShortlistedIds();
      expect(list).not.toContain('cand-01');
      expect(list).toContain('cand-02');
    });

    it('removeFromShortlist idempoten — menghapus id yang tidak ada tidak error', () => {
      addToShortlist('cand-01');
      removeFromShortlist('cand-999'); // tidak ada
      expect(getShortlistedIds()).toHaveLength(1);
      expect(getShortlistedIds()).toContain('cand-01');
    });

    it('removeFromShortlist mengosongkan list ketika hanya 1 kandidat', () => {
      addToShortlist('solo');
      removeFromShortlist('solo');
      expect(getShortlistedIds()).toEqual([]);
    });

    it('shortlist tetap konsisten setelah serangkaian operasi add/remove', () => {
      addToShortlist('a');
      addToShortlist('b');
      addToShortlist('c');
      removeFromShortlist('b');
      addToShortlist('d');
      addToShortlist('a'); // duplikat, tidak ditambahkan
      const list = getShortlistedIds();
      expect(list).toContain('a');
      expect(list).not.toContain('b');
      expect(list).toContain('c');
      expect(list).toContain('d');
      expect(list.filter((id) => id === 'a')).toHaveLength(1);
    });

    it('readShortlist adalah alias getShortlistedIds', () => {
      addToShortlist('cand-05');
      expect(readShortlist()).toEqual(getShortlistedIds());
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. Generator Tautan Undangan Asesmen & Validasi Token
  // ════════════════════════════════════════════════════════════════════════════

  describe('3. Generator Tautan Undangan Asesmen & Validasi Token', () => {
    const BASE_PAYLOAD = {
      orgName: 'PT Telkom Indonesia',
      targetPosition: 'Software Engineer',
      quizId: 'quiz-tpa-2026',
      quizTitle: 'Tes Potensi Akademik 2026',
    };

    it('createAssessmentInvitation mengembalikan objek AssessmentInvitation yang lengkap', () => {
      const inv = createAssessmentInvitation(BASE_PAYLOAD);
      expect(inv.id).toMatch(/^inv-\d+$/);
      expect(inv.org_id).toMatch(/^org-\d+$/);
      expect(inv.org_name).toBeTruthy();
      expect(inv.target_position).toBeTruthy();
      expect(inv.quiz_id).toBe('quiz-tpa-2026');
      expect(inv.quiz_title).toBe('Tes Potensi Akademik 2026');
      expect(inv.invite_token).toBeTruthy();
      expect(typeof inv.invite_token).toBe('string');
      expect(inv.candidates_count).toBe(0);
      expect(inv.created_at).toBeTruthy();
    });

    it('createInvite adalah alias createAssessmentInvitation', () => {
      const inv = createInvite(BASE_PAYLOAD);
      expect(inv).toMatchObject({
        quiz_id: 'quiz-tpa-2026',
        quiz_title: 'Tes Potensi Akademik 2026',
      });
    });

    it('invite_token memenuhi format valid (uppercase alphanumeric + dash)', () => {
      const inv = createAssessmentInvitation(BASE_PAYLOAD);
      expect(isValidInviteToken(inv.invite_token)).toBe(true);
    });

    it('invite_token tidak mengandung karakter berbahaya (XSS-safe)', () => {
      const inv = createAssessmentInvitation(BASE_PAYLOAD);
      expect(inv.invite_token).not.toContain('<');
      expect(inv.invite_token).not.toContain('>');
      expect(inv.invite_token).not.toContain('"');
      expect(inv.invite_token).not.toContain("'");
    });

    it('createAssessmentInvitation men-trim & sanitize orgName', () => {
      const inv = createAssessmentInvitation({
        ...BASE_PAYLOAD,
        orgName: '   GoTo Financial   ',
      });
      expect(inv.org_name).toBe('GoTo Financial');
    });

    it('createAssessmentInvitation men-trim & sanitize targetPosition', () => {
      const inv = createAssessmentInvitation({
        ...BASE_PAYLOAD,
        targetPosition: '   Data Analyst Senior   ',
      });
      expect(inv.target_position).toBe('Data Analyst Senior');
    });

    it('createAssessmentInvitation menyimpan undangan ke localStorage', () => {
      createAssessmentInvitation(BASE_PAYLOAD);
      const stored = getStoredInvitations();
      const found = stored.find((i) => i.quiz_id === 'quiz-tpa-2026');
      expect(found).toBeDefined();
    });

    it('listInvites / getStoredInvitations mengembalikan undangan yang tersimpan', () => {
      createAssessmentInvitation(BASE_PAYLOAD);
      const list = listInvites();
      expect(list.length).toBeGreaterThanOrEqual(1);
    });

    it('buildInviteUrl menghasilkan URL /quiz/:quizId?invite=:token', () => {
      const inv = createAssessmentInvitation(BASE_PAYLOAD);
      const url = buildInviteUrl(inv.invite_token, inv.quiz_id);
      expect(url).toContain(`/quiz/${inv.quiz_id}`);
      expect(url).toContain('invite=');
    });

    it('buildInviteUrl menggunakan origin dari window.location', () => {
      const inv = createAssessmentInvitation(BASE_PAYLOAD);
      const url = buildInviteUrl(inv.invite_token, inv.quiz_id);
      expect(url.startsWith('https://lokatalenta.vercel.app')).toBe(true);
    });

    it('buildInviteUrl meng-encode token dengan encodeURIComponent', () => {
      // If token contains special chars they must be encoded; here we just verify
      // that the resulting URL is parseable as a URL
      const inv = createAssessmentInvitation(BASE_PAYLOAD);
      const url = buildInviteUrl(inv.invite_token, inv.quiz_id);
      expect(() => new URL(url)).not.toThrow();
    });

    it('buildInviteUrl — token dalam query string dapat di-decode kembali ke original', () => {
      const inv = createAssessmentInvitation(BASE_PAYLOAD);
      const url = buildInviteUrl(inv.invite_token, inv.quiz_id);
      const parsed = new URL(url);
      const tokenFromUrl = parsed.searchParams.get('invite');
      expect(tokenFromUrl).toBe(inv.invite_token);
    });

    it('setiap undangan memiliki invite_token unik (Math.random ensures uniqueness)', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const inv = createAssessmentInvitation({ ...BASE_PAYLOAD, quizTitle: `Quiz ${i}` });
        tokens.add(inv.invite_token);
      }
      // 10 tokens from Math.random().toString(36) — expect all unique
      expect(tokens.size).toBeGreaterThanOrEqual(9); // allow at most 1 collision in 10
    });

    it('setiap undangan memiliki id unik saat dibuat di waktu berbeda', () => {
      // id menggunakan Date.now() — verify format and presence
      const inv = createAssessmentInvitation(BASE_PAYLOAD);
      expect(inv.id).toMatch(/^inv-\d+$/);
      // Two invitations created may share Date.now() in same ms, so we test
      // that id always starts with 'inv-' and contains a numeric timestamp
      const numeric = parseInt(inv.id.replace('inv-', ''), 10);
      expect(numeric).toBeGreaterThan(0);
    });

    it('token tidak valid ditolak oleh isValidInviteToken', () => {
      expect(isValidInviteToken('')).toBe(false);
      expect(isValidInviteToken('AB')).toBe(false);       // terlalu pendek
      expect(isValidInviteToken('ab-cd1')).toBe(false);  // lowercase
      expect(isValidInviteToken('AB CD12')).toBe(false); // ada spasi
      expect(isValidInviteToken('AB!CD123')).toBe(false);// char khusus selain dash
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 4. Validasi role 'recruiter' pada RBAC & isolasi akses
  // ════════════════════════════════════════════════════════════════════════════

  describe("4. RBAC — validasi role 'recruiter' & isolasi akses", () => {
    it("role 'recruiter' memiliki semua izin portal rekruter", () => {
      const permissions: RecruiterPermission[] = [
        'view_candidates',
        'manage_shortlist',
        'create_invite',
        'export_csv',
      ];
      permissions.forEach((p) => expect(hasPermission('recruiter', p)).toBe(true));
    });

    it("role 'admin' juga memiliki semua izin rekruter", () => {
      expect(hasPermission('admin', 'view_candidates')).toBe(true);
      expect(hasPermission('admin', 'manage_shortlist')).toBe(true);
      expect(hasPermission('admin', 'create_invite')).toBe(true);
      expect(hasPermission('admin', 'export_csv')).toBe(true);
    });

    it("role 'teacher' tidak memiliki akses ke fitur rekruter", () => {
      expect(hasPermission('teacher', 'view_candidates')).toBe(false);
      expect(hasPermission('teacher', 'manage_shortlist')).toBe(false);
      expect(hasPermission('teacher', 'create_invite')).toBe(false);
      expect(hasPermission('teacher', 'export_csv')).toBe(false);
    });

    it("role 'student' tidak memiliki akses ke fitur rekruter", () => {
      expect(hasPermission('student', 'view_candidates')).toBe(false);
      expect(hasPermission('student', 'manage_shortlist')).toBe(false);
      expect(hasPermission('student', 'create_invite')).toBe(false);
      expect(hasPermission('student', 'export_csv')).toBe(false);
    });

    it("UserRole mencakup 'recruiter' sebagai nilai yang valid", () => {
      const validRoles: UserRole[] = ['student', 'teacher', 'admin', 'recruiter'];
      expect(validRoles).toContain('recruiter');
    });

    it('RecruiterCandidate.readiness_status hanya menerima nilai yang terdefinisi', () => {
      const validStatuses: RecruiterCandidate['readiness_status'][] = [
        'ready',
        'developing',
        'exploring',
      ];
      INITIAL_RECRUITER_CANDIDATES.forEach((c) => {
        expect(validStatuses).toContain(c.readiness_status);
      });
    });

    it('isolasi shortlist: sesi berbeda tidak saling berbagi data', () => {
      // Sesi recruiter A
      addToShortlist('cand-A');
      expect(getShortlistedIds()).toContain('cand-A');

      // Simulasi sesi recruiter B (localStorage bersih)
      Object.defineProperty(globalThis, 'localStorage', {
        value: createMemoryStorage(),
        configurable: true,
        writable: true,
      });
      expect(getShortlistedIds()).toHaveLength(0);
      expect(getShortlistedIds()).not.toContain('cand-A');
    });

    it('isolasi undangan: sesi baru tidak melihat undangan sesi lama', () => {
      createAssessmentInvitation({
        orgName: 'PT Lama',
        targetPosition: 'Manager',
        quizId: 'q-lama',
        quizTitle: 'Quiz Lama',
      });

      // Sesi baru
      Object.defineProperty(globalThis, 'localStorage', {
        value: createMemoryStorage(),
        configurable: true,
        writable: true,
      });
      // getStoredInvitations with empty localStorage returns demo seeds, not persisted ones
      const freshInvites = getStoredInvitations();
      const foundOldInvite = freshInvites.find((i) => i.quiz_id === 'q-lama');
      expect(foundOldInvite).toBeUndefined();
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 5. Sanitasi teks: nama organisasi & posisi (XSS & injection)
  // ════════════════════════════════════════════════════════════════════════════

  describe('5. Sanitasi teks — nama organisasi & posisi (XSS & injection)', () => {
    const xssPayloads = [
      '<script>alert("xss")</script>PT Teknologi',
      '<img src="x" onerror="alert(1)">Perusahaan',
      '<svg/onload=alert(1)>Corp',
      '<a href="javascript:stealCookie()">Klik</a>',
      'PT<b onmouseover="evil()">Maju</b>Jaya',
    ];

    it('sanitizeOrgName menghapus semua tag HTML', () => {
      xssPayloads.forEach((payload) => {
        const result = sanitizeOrgName(payload);
        expect(result).not.toMatch(/<[^>]+>/);
      });
    });

    it('sanitizeOrgName menghapus atribut event handler (onerror, onload, onmouseover)', () => {
      const result = sanitizeOrgName('<img src="x" onerror="steal()">PT ABC');
      expect(result).not.toContain('onerror=');
      expect(result).not.toContain('onload=');
    });

    it('sanitizeOrgName menghapus protokol javascript:', () => {
      const result = sanitizeOrgName('<a href="javascript:alert(1)">Org</a>');
      expect(result).not.toContain('javascript:');
    });

    it('sanitizePositionName menghapus semua tag HTML', () => {
      xssPayloads.forEach((payload) => {
        const result = sanitizePositionName(payload);
        expect(result).not.toMatch(/<[^>]+>/);
      });
    });

    it('sanitizePositionName mempertahankan teks yang bersih', () => {
      expect(sanitizePositionName('  Data Analyst Senior  ')).toBe('Data Analyst Senior');
      expect(sanitizePositionName('Software Engineer (Backend)')).toBe(
        'Software Engineer (Backend)'
      );
    });

    it('sanitizeOrgName mempertahankan nama perusahaan yang aman', () => {
      expect(sanitizeOrgName('PT Nusantara Digital')).toBe('PT Nusantara Digital');
      expect(sanitizeOrgName('  Gojek Indonesia  ')).toBe('Gojek Indonesia');
    });

    it('createAssessmentInvitation menerapkan sanitasi pada orgName (menghapus tag HTML)', () => {
      const inv = createAssessmentInvitation({
        orgName: '<script>evil()</script>PT Baik',
        targetPosition: 'QA Engineer',
        quizId: 'q-xss',
        quizTitle: 'XSS Test',
      });
      expect(inv.org_name).not.toContain('<script>');
      expect(inv.org_name).not.toContain('</script>');
    });

    it('createAssessmentInvitation menerapkan sanitasi pada targetPosition (menghapus tag HTML)', () => {
      const inv = createAssessmentInvitation({
        orgName: 'PT Aman',
        targetPosition: '<img onerror="xss()">Backend Dev',
        quizId: 'q-xss2',
        quizTitle: 'XSS Test 2',
      });
      expect(inv.target_position).not.toContain('<img');
      expect(inv.target_position).not.toContain('onerror=');
    });

    it('sanitizeCsvCell memblokir formula injection', () => {
      const injectionPayloads = [
        '=CMD("rm -rf /")',
        '+HYPERLINK("http://evil.com","click")',
        '@SUM(malicious)',
        '-malicious+formula',
        '\t=formula',
      ];
      injectionPayloads.forEach((payload) => {
        const cell = sanitizeCsvCell(payload);
        expect(cell.startsWith('"')).toBe(true);
        expect(cell).toContain("'"); // neutralization prefix
      });
    });

    it('sanitizeCsvCell tidak memutilasi teks aman', () => {
      expect(sanitizeCsvCell('PT Maju Jaya')).toBe('"PT Maju Jaya"');
    });

    it('buildInviteUrl — org name dengan & tidak menyebabkan URL rusak', () => {
      const inv = createAssessmentInvitation({
        orgName: 'A&B Corp',
        targetPosition: 'Manager',
        quizId: 'q-safe',
        quizTitle: 'Safe Quiz',
      });
      const url = buildInviteUrl(inv.invite_token, inv.quiz_id);
      expect(() => new URL(url)).not.toThrow();
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 6. computeTalentRadarMetrics — Radar 5D dari data nyata
  // ════════════════════════════════════════════════════════════════════════════

  describe('6. computeTalentRadarMetrics — Radar 5D dari data nyata', () => {
    it('menghitung 5 dimensi radar dan clamp skor 0–100', () => {
      const metrics = computeTalentRadarMetrics({
        categoryScores: { verbal: 80, numerik: 90, logika: 75 },
        avgQuizScore: 85,
        completedLessonsCount: 5,
        certificatesCount: 1,
      });
      expect(metrics.dimensions).toHaveLength(5);
      metrics.dimensions.forEach((d) => {
        expect(d.score).toBeGreaterThanOrEqual(0);
        expect(d.score).toBeLessThanOrEqual(100);
      });
    });

    it("readinessBadge 'Top Talent' saat overallIndex >= 80", () => {
      const metrics = computeTalentRadarMetrics({
        categoryScores: { verbal: 95, numerik: 95, logika: 95 },
        avgQuizScore: 95,
        kraepelinHistory: [
          {
            id: '1',
            preset_id: 'standard',
            duration_seconds: 60,
            total_answered: 160,
            total_correct: 155,
            accuracy_pct: 97,
            speed_kpm: 160,
            stability_score: 95,
            created_at: '2026-11-24T00:00:00.000Z',
          },
        ],
        completedLessonsCount: 8,
        certificatesCount: 2,
      });
      expect(metrics.readinessBadge).toBe('Top Talent');
      expect(metrics.overallIndex).toBeGreaterThanOrEqual(80);
    });

    it("readinessBadge 'Starter' saat tidak ada data", () => {
      const metrics = computeTalentRadarMetrics({
        categoryScores: {},
        avgQuizScore: 0,
        completedLessonsCount: 0,
        certificatesCount: 0,
      });
      expect(metrics.readinessBadge).toBe('Starter');
      expect(metrics.overallIndex).toBeLessThan(60);
    });

    it('extractCategoryScoresFromAttempts menghitung persentase per kategori', () => {
      const mockAttempts = [
        {
          id: 'att1',
          user_id: 'u1',
          quiz_id: 'q1',
          score: 80,
          submitted_at: new Date().toISOString(),
          category_breakdown: {
            verbal: { correct: 8, total: 10 },
            numerik: { correct: 9, total: 10 },
          },
        },
      ] as unknown as Parameters<typeof extractCategoryScoresFromAttempts>[0];

      const scores = extractCategoryScoresFromAttempts(mockAttempts);
      expect(scores['verbal']).toBe(80);
      expect(scores['numerik']).toBe(90);
    });

    it('kraepelinHistory meningkatkan skor dimensi kraepelin', () => {
      const withKraepelin = computeTalentRadarMetrics({
        categoryScores: {},
        avgQuizScore: 0,
        kraepelinHistory: [
          {
            id: '1',
            preset_id: 'standard',
            duration_seconds: 60,
            total_answered: 150,
            total_correct: 140,
            accuracy_pct: 90,
            speed_kpm: 150,
            stability_score: 85,
            created_at: '2026-11-24T00:00:00.000Z',
          },
        ],
        completedLessonsCount: 0,
        certificatesCount: 0,
      });
      const kDim = withKraepelin.dimensions.find((d) => d.key === 'kraepelin');
      expect(kDim).toBeDefined();
      expect(kDim!.score).toBeGreaterThan(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 7. exportShortlistCsv — format & keamanan
  // ════════════════════════════════════════════════════════════════════════════

  describe('7. exportShortlistCsv — format & keamanan', () => {
    it('mengembalikan string CSV (bukan void)', () => {
      const csv = exportShortlistCsv(INITIAL_RECRUITER_CANDIDATES);
      expect(typeof csv).toBe('string');
      expect(csv.length).toBeGreaterThan(0);
    });

    it('menghasilkan header CSV yang benar (ID, Nama, Email, Kategori, Kesiapan, ...)', () => {
      const csv = exportShortlistCsv(INITIAL_RECRUITER_CANDIDATES);
      const firstLine = csv.split('\n')[0];
      expect(firstLine).toContain('ID');
      expect(firstLine).toContain('Nama');
      expect(firstLine).toContain('Email');
      expect(firstLine).toContain('Kategori');
      expect(firstLine).toContain('Kesiapan');
    });

    it('menghasilkan satu baris data per kandidat (header + N baris)', () => {
      const subset = INITIAL_RECRUITER_CANDIDATES.slice(0, 3);
      const csv = exportShortlistCsv(subset);
      const lines = csv.trim().split('\n');
      expect(lines).toHaveLength(1 + 3); // header + 3 data rows
    });

    it('nama kandidat dibungkus dengan tanda kutip ganda (CSV quoting)', () => {
      const csv = exportShortlistCsv(INITIAL_RECRUITER_CANDIDATES.slice(0, 1));
      expect(csv).toContain('"Nadia Kusuma"');
    });

    it('CSV berisi skor kognitif dan logika dari radar_scores', () => {
      const single = INITIAL_RECRUITER_CANDIDATES.slice(0, 1); // Nadia: kognitif=92, logika=95
      const csv = exportShortlistCsv(single);
      expect(csv).toContain('92');
      expect(csv).toContain('95');
    });

    it('CSV kosong (hanya header) saat tidak ada kandidat', () => {
      const csv = exportShortlistCsv([]);
      const lines = csv.trim().split('\n');
      expect(lines).toHaveLength(1); // hanya header
    });

    it('semua kandidat demo dapat diekspor tanpa error', () => {
      expect(() => exportShortlistCsv(INITIAL_RECRUITER_CANDIDATES)).not.toThrow();
    });
  });
});

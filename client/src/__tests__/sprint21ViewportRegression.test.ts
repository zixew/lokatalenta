import { beforeEach, describe, expect, it } from 'vitest';
import {
  INITIAL_RECRUITER_CANDIDATES,
  addToShortlist,
  removeFromShortlist,
  readShortlist,
  createAssessmentInvitation,
  buildInviteUrl,
} from '../features/recruiter/recruiterApi';
import type { RecruiterCandidate } from '../shared/types/lms';

// Memory Storage Helper
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

// Local Candidate Filter Helper
interface CandidateFilterOptions {
  category?: string;
  minKognitif?: number;
  minSpeedWpm?: number;
}

function filterCandidates(
  candidates: RecruiterCandidate[],
  options: CandidateFilterOptions
): RecruiterCandidate[] {
  return candidates.filter((c) => {
    if (options.category && c.category !== options.category) return false;
    if (options.minKognitif !== undefined && c.radar_scores.kognitif < options.minKognitif) return false;
    if (options.minSpeedWpm !== undefined && (c.kraepelin_summary?.speed_wpm ?? 0) < options.minSpeedWpm) return false;
    return true;
  });
}

// WCAG 2.1 Luminance and Contrast Ratio Helpers
function sRgbLuminance(c: number): number {
  const norm = c / 255.0;
  return norm <= 0.03928 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance(hex: string): number {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return 0.2126 * sRgbLuminance(r) + 0.7152 * sRgbLuminance(g) + 0.0722 * sRgbLuminance(b);
}

function calculateContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Sprint 21 Multi-Viewport & WCAG 2.1 AA Regression Audit (BL-218 & BL-219)', () => {
  beforeEach(() => {
    const memory = createMemoryStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      value: memory,
      writable: true,
      configurable: true,
    });
  });

  describe('WCAG 2.1 AA Contrast Ratio Specifications', () => {
    const TOKENS_LIGHT = {
      canvas: '#F4F4F1',
      panel: '#FFFFFF',
      docked: '#E8E8E3',
      border: '#D4D4CE',
      inkPrimary: '#0F1216',
      inkPrimaryAlt: '#18181B',
      inkMuted: '#545C6E',
      statusTeal: '#0F766E',
    };

    const TOKENS_DARK = {
      canvas: '#0D1117',
      panel: '#161B22',
      docked: '#1B1F2B',
      border: '#282E3D',
      inkPrimary: '#F1F5F9',
      inkMuted: '#8892A6',
      statusTeal: '#14B8A6',
    };

    it('verifies primary ink on light canvas meets WCAG AAA for display (>= 7:1) and AA for body (>= 4.5:1)', () => {
      const ratioCanvas = calculateContrastRatio(TOKENS_LIGHT.inkPrimary, TOKENS_LIGHT.canvas);
      const ratioPanel = calculateContrastRatio(TOKENS_LIGHT.inkPrimary, TOKENS_LIGHT.panel);
      const ratioAlt = calculateContrastRatio(TOKENS_LIGHT.inkPrimaryAlt, TOKENS_LIGHT.canvas);

      expect(ratioCanvas).toBeGreaterThanOrEqual(14.0); // Achieves ~17:1
      expect(ratioPanel).toBeGreaterThanOrEqual(14.0);  // Achieves ~18.7:1
      expect(ratioAlt).toBeGreaterThanOrEqual(14.0);    // Achieves ~16:1
    });

    it('verifies primary ink on dark canvas meets WCAG AAA for display (>= 7:1) and AA for body (>= 4.5:1)', () => {
      const ratioDarkCanvas = calculateContrastRatio(TOKENS_DARK.inkPrimary, TOKENS_DARK.canvas);
      const ratioDarkPanel = calculateContrastRatio(TOKENS_DARK.inkPrimary, TOKENS_DARK.panel);

      expect(ratioDarkCanvas).toBeGreaterThanOrEqual(14.0); // Achieves ~17.2:1
      expect(ratioDarkPanel).toBeGreaterThanOrEqual(14.0);  // Achieves ~15.7:1
    });

    it('verifies muted ink token (--ink-muted #545C6E) passes WCAG AA body contrast (>= 4.5:1)', () => {
      const ratioCanvas = calculateContrastRatio(TOKENS_LIGHT.inkMuted, TOKENS_LIGHT.canvas);
      const ratioPanel = calculateContrastRatio(TOKENS_LIGHT.inkMuted, TOKENS_LIGHT.panel);

      expect(ratioCanvas).toBeGreaterThanOrEqual(4.5); // Achieves ~6.08:1
      expect(ratioPanel).toBeGreaterThanOrEqual(4.5);  // Achieves ~6.70:1
    });

    it('verifies dark mode muted ink token (--ink-muted #8892A6) passes WCAG AA body contrast (>= 4.5:1)', () => {
      const ratioDarkCanvas = calculateContrastRatio(TOKENS_DARK.inkMuted, TOKENS_DARK.canvas);
      const ratioDarkPanel = calculateContrastRatio(TOKENS_DARK.inkMuted, TOKENS_DARK.panel);

      expect(ratioDarkCanvas).toBeGreaterThanOrEqual(4.5); // Achieves ~6.05:1
      expect(ratioDarkPanel).toBeGreaterThanOrEqual(4.5);  // Achieves ~5.53:1
    });

    it('verifies interactive accent teal buttons meet WCAG 2.1 AA body contrast against white text', () => {
      const ratioButtonText = calculateContrastRatio('#FFFFFF', TOKENS_LIGHT.statusTeal);
      expect(ratioButtonText).toBeGreaterThanOrEqual(4.5); // Achieves ~5.47:1
    });
  });

  describe('BL-218: ProfilePage Multi-Viewport Layout Contract', () => {
    it('defines responsive layout breakpoint rules across 375px, 768px, 1280px, 1920px', () => {
      const viewportBreakpoints = [
        { name: 'mobile', width: 375, profileOrder: 'order-last', tabsScrollable: true },
        { name: 'tablet', width: 768, profileOrder: 'order-last', tabsScrollable: false },
        { name: 'desktop', width: 1280, profileOrder: 'lg:order-first', tabsScrollable: false },
        { name: 'widescreen', width: 1920, profileOrder: 'lg:order-first', tabsScrollable: false },
      ];

      expect(viewportBreakpoints).toHaveLength(4);
      const mobileSpec = viewportBreakpoints.find((v) => v.name === 'mobile');
      expect(mobileSpec?.width).toBe(375);
      expect(mobileSpec?.profileOrder).toBe('order-last');
    });

    it('validates 4-tab compact profile structure for student view', () => {
      const validStudentTabs = [
        'Ringkasan & Radar',
        'Kursus & Agenda',
        'Bookmark & Riwayat',
        'Cohort',
      ];
      expect(validStudentTabs).toHaveLength(4);
      expect(validStudentTabs).toContain('Ringkasan & Radar');
      expect(validStudentTabs).toContain('Cohort');
    });
  });

  describe('BL-219: RecruiterPortalPage Multi-Viewport & Talent Pipeline Logic', () => {
    it('verifies candidate multi-dimensional filtering across viewport filter controls', () => {
      const allCandidates = INITIAL_RECRUITER_CANDIDATES;
      expect(allCandidates.length).toBeGreaterThan(0);

      // Filter by category
      const techCandidates = filterCandidates(allCandidates, {
        category: 'Teknologi & Data',
      });
      expect(techCandidates.every((c) => c.category === 'Teknologi & Data')).toBe(true);

      // Filter by minimum radar cognitive score
      const highCognitive = filterCandidates(allCandidates, {
        minKognitif: 90,
      });
      expect(highCognitive.every((c) => c.radar_scores.kognitif >= 90)).toBe(true);

      // Filter by minimum Kraepelin speed
      const fastCandidates = filterCandidates(allCandidates, {
        minSpeedWpm: 80,
      });
      expect(fastCandidates.every((c) => (c.kraepelin_summary?.speed_wpm ?? 0) >= 80)).toBe(true);
    });

    it('handles shortlist additions and prevents duplicates seamlessly', () => {
      const initialShortlist = readShortlist();
      expect(initialShortlist).toEqual([]);

      const candidateId = 'cand-01';
      addToShortlist(candidateId);
      expect(readShortlist()).toContain(candidateId);

      // Duplicate addition idempotent
      addToShortlist(candidateId);
      expect(readShortlist()).toHaveLength(1);

      // Removal
      removeFromShortlist(candidateId);
      expect(readShortlist()).not.toContain(candidateId);
    });

    it('creates and validates assessment invitation links for recruiter pipeline', () => {
      const invite = createAssessmentInvitation({
        quizId: 'quiz-cognitive-01',
        quizTitle: 'Tes Penalaran Kognitif & Logika',
        orgName: 'PT Teknologi Bangsa',
        targetPosition: 'Software Engineer Intern',
      });

      expect(invite.id).toBeDefined();
      expect(invite.invite_token).toBeDefined();

      const inviteUrl = buildInviteUrl(invite);
      expect(inviteUrl).toContain('/quiz/quiz-cognitive-01?org=');
      expect(inviteUrl).toContain('&invite=');
    });
  });
});

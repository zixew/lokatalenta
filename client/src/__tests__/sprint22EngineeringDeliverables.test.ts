import { describe, expect, it } from 'vitest';
import {
  computeCohortPercentile,
  exportShortlistCsv,
} from '../features/recruiter/recruiterApi';
import { computeQuestionDifficultyCalibration } from '../features/teacher/questionBankHelpers';
import {
  formatAnonymizedTickerFeed,
  type EcosystemNormalizedEvent,
} from '../shared/services/ecosystemTelemetry';
import type { RecruiterCandidate } from '../shared/types/lms';

describe('Sprint 22 Engineering Deliverables (BL-224, BL-220, REC-001)', () => {
  describe('BL-224: Multi-Tenant Enterprise Recruiter Analytics & Benchmark Export', () => {
    it('sanitizes formula injection payloads in exportShortlistCsv', () => {
      const maliciousCandidates: RecruiterCandidate[] = [
        {
          id: 'cand-malicious-01',
          user_id: 'usr-malicious-01',
          full_name: '=SUM(A1:A10)',
          email: '+cmd|"/C calc"!A0',
          category: '@admin_eval',
          readiness_status: 'ready',
          radar_scores: {
            kognitif: 85,
            logika: 90,
            ketahanan: 75,
            komunikasi: 80,
            spasial: 70,
          },
          top_certificates: [],
        },
      ];

      const csvOutput = exportShortlistCsv(maliciousCandidates);
      const lines = csvOutput.split('\n');
      expect(lines.length).toBe(2);

      // Verify that leading formula symbols (=, +, @) are neutralized with single quote prefix
      expect(lines[1]).toContain('"\'=SUM(A1:A10)"');
      expect(lines[1]).toContain('"\'+cmd|""/C calc""!A0"');
      expect(lines[1]).toContain('"\'@admin_eval"');
    });

    it('computes multi-cohort percentile curves accurately', () => {
      const cohortScores = [40, 50, 60, 70, 80, 90, 100];

      // Score 40 (lowest) should be low percentile
      expect(computeCohortPercentile(40, cohortScores)).toBeLessThan(15);

      // Score 70 (median) should be around 50th percentile
      expect(computeCohortPercentile(70, cohortScores)).toBe(50);

      // Score 100 (top) should be high percentile (capped at 99)
      expect(computeCohortPercentile(100, cohortScores)).toBe(93);

      // Edge case: empty scores returns baseline 50
      expect(computeCohortPercentile(75, [])).toBe(50);
    });
  });

  describe('BL-220: Question Difficulty Calibration Matrix', () => {
    it('classifies question as mudah when p > 0.75', () => {
      const answers = [
        { isCorrect: true },
        { isCorrect: true },
        { isCorrect: true },
        { isCorrect: true },
        { isCorrect: false },
      ]; // 4/5 = 0.80
      const result = computeQuestionDifficultyCalibration('q-1', answers);

      expect(result.difficultyIndex).toBe(0.8);
      expect(result.classification).toBe('mudah');
      expect(result.totalAttempts).toBe(5);
      expect(result.correctAttempts).toBe(4);
    });

    it('classifies question as sukar when p < 0.30', () => {
      const answers = [
        { isCorrect: false },
        { isCorrect: false },
        { isCorrect: false },
        { isCorrect: true },
      ]; // 1/4 = 0.25
      const result = computeQuestionDifficultyCalibration('q-2', answers);

      expect(result.difficultyIndex).toBe(0.25);
      expect(result.classification).toBe('sukar');
    });

    it('classifies question as sedang when 0.30 <= p <= 0.75', () => {
      const answers = [
        { isCorrect: true },
        { isCorrect: false },
      ]; // 1/2 = 0.50
      const result = computeQuestionDifficultyCalibration('q-3', answers);

      expect(result.difficultyIndex).toBe(0.5);
      expect(result.classification).toBe('sedang');
    });
  });

  describe('REC-001: Candidate Telemetry Privacy Guardrails (3D Office Ticker Feed)', () => {
    it('anonymizes entity IDs and redacts PII from telemetry summaries', () => {
      const mockEvent: EcosystemNormalizedEvent = {
        id: 'evt-12345678',
        timestamp: '2026-11-25T12:00:00Z',
        source: 'lms-psikotes',
        type: 'lms.activity',
        divisionId: 'engineering',
        agentId: 6,
        entityId: 'user-secret-9988776655',
        title: 'Asesmen selesai oleh dimas@example.com (NIK: 3201012345678901, HP: 081234567890)',
        summary: 'Ujian psikotes sukses',
        targetZone: 'workspace',
        targetFloor: 2,
        severity: 'info',
        metadata: {},
      };

      const tickerText = formatAnonymizedTickerFeed(mockEvent);

      // Verify that candidate ID is truncated to 8 chars
      expect(tickerText).toContain('[#user-sec]');

      // Verify that email, NIK, and phone number are replaced with [REDACTED]
      expect(tickerText).not.toContain('dimas@example.com');
      expect(tickerText).not.toContain('3201012345678901');
      expect(tickerText).not.toContain('081234567890');
      expect(tickerText).toContain('[REDACTED]');
    });
  });
});

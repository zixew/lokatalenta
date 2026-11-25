import type { RecruiterCandidate, AssessmentInvitation } from '../../shared/types/lms';
import { sanitizeUserText } from '../../shared/lib/securityGuards';
import { sanitizeCsvCell } from '../../shared/lib/securityGuards';
import { emitEcosystemTelemetry } from '../../shared/services/ecosystemTelemetry';

const SHORTLIST_STORAGE_KEY = 'lokatalenta_recruiter_shortlist';
const INVITATION_STORAGE_KEY = 'lokatalenta_assessment_invitations';

export const INITIAL_RECRUITER_CANDIDATES: RecruiterCandidate[] = [
  {
    id: 'cand-01',
    user_id: 'usr-nadia-01',
    full_name: 'Nadia Kusuma',
    email: 'nadia@pelajar.id',
    category: 'Teknologi & Data',
    readiness_status: 'ready',
    radar_scores: {
      kognitif: 92,
      logika: 95,
      ketahanan: 88,
      komunikasi: 85,
      spasial: 90,
    },
    kraepelin_summary: {
      speed_wpm: 84,
      accuracy_pct: 98,
      stability_grade: 'Sangat Konsisten (A)',
    },
    top_certificates: ['LT-SQL-PRO-2026', 'LT-REACT-TS-99'],
  },
  {
    id: 'cand-02',
    user_id: 'usr-budi-02',
    full_name: 'Budi Santoso',
    email: 'budi.santoso@career.id',
    category: 'Keuangan & Analisis',
    readiness_status: 'ready',
    radar_scores: {
      kognitif: 89,
      logika: 91,
      ketahanan: 94,
      komunikasi: 82,
      spasial: 78,
    },
    kraepelin_summary: {
      speed_wpm: 79,
      accuracy_pct: 96,
      stability_grade: 'Konsisten (A)',
    },
    top_certificates: ['LT-EXCEL-FIN-01'],
  },
  {
    id: 'cand-03',
    user_id: 'usr-sari-03',
    full_name: 'Sari Dewi',
    email: 'sari.dewi@talenta.org',
    category: 'Bisnis & Manajemen',
    readiness_status: 'ready',
    radar_scores: {
      kognitif: 86,
      logika: 88,
      ketahanan: 90,
      komunikasi: 96,
      spasial: 80,
    },
    kraepelin_summary: {
      speed_wpm: 72,
      accuracy_pct: 95,
      stability_grade: 'Konsisten (B+)',
    },
    top_certificates: ['LT-STAR-LEAD-2026'],
  },
  {
    id: 'cand-04',
    user_id: 'usr-rizco-04',
    full_name: 'Rizco Renova',
    email: 'rizco@dev.id',
    category: 'Teknologi & Data',
    readiness_status: 'ready',
    radar_scores: {
      kognitif: 96,
      logika: 98,
      ketahanan: 92,
      komunikasi: 89,
      spasial: 94,
    },
    kraepelin_summary: {
      speed_wpm: 92,
      accuracy_pct: 99,
      stability_grade: 'Sangat Konsisten (A+)',
    },
    top_certificates: ['LT-FULLSTACK-ARCH-2026', 'LT-KRAEPELIN-MASTER'],
  },
  {
    id: 'cand-05',
    user_id: 'usr-dimas-05',
    full_name: 'Dimas Putra',
    email: 'dimas.p@freshgrad.id',
    category: 'Operasional & Logistik',
    readiness_status: 'developing',
    radar_scores: {
      kognitif: 78,
      logika: 82,
      ketahanan: 86,
      komunikasi: 80,
      spasial: 85,
    },
    kraepelin_summary: {
      speed_wpm: 68,
      accuracy_pct: 91,
      stability_grade: 'Cukup Stabil (B)',
    },
    top_certificates: ['LT-OPS-LOG-11'],
  },
];

export function getShortlistedIds(): string[] {
  try {
    const raw = localStorage.getItem(SHORTLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveShortlistedIds(ids: string[]): void {
  try {
    localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage quota errors in demo mode
  }
}

export function toggleCandidateShortlist(candidateId: string): boolean {
  const current = getShortlistedIds();
  const exists = current.includes(candidateId);
  const next = exists ? current.filter((id) => id !== candidateId) : [...current, candidateId];
  saveShortlistedIds(next);
  const nextAdded = !exists;
  emitEcosystemTelemetry({
    divisionId: 'lounge',
    agentId: 23,
    entityId: candidateId,
    title: nextAdded ? 'Kandidat ditambahkan ke shortlist' : 'Kandidat dihapus dari shortlist',
    summary: `Perubahan shortlist rekruter untuk kandidat ${candidateId}`,
    targetZone: 'lounge',
    targetFloor: 2,
    severity: 'info',
    metadata: {
      event: nextAdded ? 'candidate_shortlisted' : 'candidate_unshortlisted',
      candidateId,
    },
  });
  return nextAdded;
}

export function getStoredInvitations(): AssessmentInvitation[] {
  try {
    const raw = localStorage.getItem(INVITATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [
      {
        id: 'inv-demo-01',
        org_id: 'org-telkom-01',
        org_name: 'Telkom Indonesia',
        quiz_id: 'bumn-tkd-core-values',
        quiz_title: 'Simulasi TKD & Core Values BUMN',
        target_position: 'Management Trainee 2026',
        invite_token: 'TLKM-MT-2026',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        candidates_count: 18,
        avg_score: 88.5,
      },
      {
        id: 'inv-demo-02',
        org_id: 'org-goto-02',
        org_name: 'GoTo Financial',
        quiz_id: 'sql-mastery-eval',
        quiz_title: 'SQL Sandbox Technical Screening',
        target_position: 'Junior Data Analyst',
        invite_token: 'GOTO-DA-Q4',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        candidates_count: 12,
        avg_score: 91.2,
      },
    ];
  } catch {
    return [];
  }
}

export function createAssessmentInvitation(payload: {
  orgName: string;
  targetPosition: string;
  quizId: string;
  quizTitle: string;
}): AssessmentInvitation {
  const sanitizedOrg = sanitizeUserText(payload.orgName.trim() || 'Perusahaan Mitra');
  const sanitizedPos = sanitizeUserText(payload.targetPosition.trim() || 'Posisi Umum');
  const token = `${sanitizedOrg.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, 'CORP')}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const newInvite: AssessmentInvitation = {
    id: `inv-${Date.now()}`,
    org_id: `org-${Date.now()}`,
    org_name: sanitizedOrg,
    target_position: sanitizedPos,
    quiz_id: payload.quizId,
    quiz_title: payload.quizTitle,
    invite_token: token,
    created_at: new Date().toISOString(),
    candidates_count: 0,
    avg_score: undefined,
  };

  const existing = getStoredInvitations();
  const next = [newInvite, ...existing];
  try {
    localStorage.setItem(INVITATION_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota
  }

  emitEcosystemTelemetry({
    divisionId: 'lounge',
    agentId: 23,
    entityId: newInvite.id,
    title: 'Undangan asesmen rekruter dibuat',
    summary: `Undangan asesmen untuk kuis ${payload.quizId} (${sanitizedPos}) diterbitkan`,
    targetZone: 'lounge',
    targetFloor: 2,
    severity: 'success',
    metadata: {
      event: 'assessment_invite_created',
      quizId: payload.quizId,
      targetPosition: sanitizedPos,
    },
  });

  return newInvite;
}

// Aliases and helpers required by RecruiterPortalPage & sprint14 test suite
export type CandidateCard = RecruiterCandidate;
export type AssessmentInvite = AssessmentInvitation;

export const readShortlist = getShortlistedIds;

export function writeShortlist(ids: string[]): void {
  saveShortlistedIds([...new Set(ids)]);
}

export function addToShortlist(candidateId: string): void {
  const current = getShortlistedIds();
  if (!current.includes(candidateId)) {
    saveShortlistedIds([...current, candidateId]);
    emitEcosystemTelemetry({
      divisionId: 'lounge',
      agentId: 23,
      entityId: candidateId,
      title: 'Kandidat ditambahkan ke shortlist',
      summary: `Kandidat ${candidateId} ditambahkan ke shortlist rekruter`,
      targetZone: 'lounge',
      targetFloor: 2,
      severity: 'info',
      metadata: {
        event: 'candidate_shortlisted',
        candidateId,
      },
    });
  }
}

export function removeFromShortlist(candidateId: string): void {
  const current = getShortlistedIds();
  if (current.includes(candidateId)) {
    saveShortlistedIds(current.filter((id) => id !== candidateId));
    emitEcosystemTelemetry({
      divisionId: 'lounge',
      agentId: 23,
      entityId: candidateId,
      title: 'Kandidat dihapus dari shortlist',
      summary: `Kandidat ${candidateId} dihapus dari shortlist rekruter`,
      targetZone: 'lounge',
      targetFloor: 2,
      severity: 'info',
      metadata: {
        event: 'candidate_unshortlisted',
        candidateId,
      },
    });
  }
}

export async function listCandidatesAsync(): Promise<RecruiterCandidate[]> {
  return INITIAL_RECRUITER_CANDIDATES;
}

export const listInvites = getStoredInvitations;
export const createInvite = createAssessmentInvitation;

export function isValidInviteToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  if (token.length < 6 || token.length > 12) return false;
  return /^[A-Z0-9-]+$/.test(token) && !/\s/.test(token) && !/[!@#$%^&*()]/.test(token);
}

export function buildInviteUrl(tokenOrInvite: string | AssessmentInvitation, quizId?: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://lokatalenta.vercel.app';
  if (typeof tokenOrInvite === 'object') {
    const org = encodeURIComponent(tokenOrInvite.org_name || 'Mitra');
    const token = encodeURIComponent(tokenOrInvite.invite_token || '');
    return `${origin}/quiz/${tokenOrInvite.quiz_id}?org=${org}&invite=${token}`;
  }
  const token = encodeURIComponent(tokenOrInvite);
  return `${origin}/quiz/${quizId}?invite=${token}`;
}

export function exportShortlistCsv(candidates: RecruiterCandidate[]): string {
  const headers = ['ID', 'Nama', 'Email', 'Kategori', 'Kesiapan', 'Skor Kognitif', 'Skor Logika', 'Skor Kraepelin WPM'];
  const rows = candidates.map((c) => [
    sanitizeCsvCell(c.id),
    sanitizeCsvCell(c.full_name),
    sanitizeCsvCell(c.email),
    sanitizeCsvCell(c.category),
    sanitizeCsvCell(c.readiness_status),
    c.radar_scores.kognitif,
    c.radar_scores.logika,
    c.kraepelin_summary?.speed_wpm || 0,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Computes percentile rank (1-99) of a candidate against a multi-cohort distribution.
 * BL-224 Multi-cohort percentile curves.
 */
export function computeCohortPercentile(score: number, allScores: number[]): number {
  if (!allScores || allScores.length === 0) return 50;
  const strictlyBelow = allScores.filter((s) => s < score).length;
  const equalTo = allScores.filter((s) => s === score).length;
  const percentile = ((strictlyBelow + 0.5 * equalTo) / allScores.length) * 100;
  return Math.round(Math.max(1, Math.min(99, percentile)));
}

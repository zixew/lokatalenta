import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { recordAdminAuditLogAsync } from '../features/admin/adminAuditLog';
import { recordKraepelinAttemptAsync } from '../features/kraepelin/kraepelinHistory';
import {
  addToShortlist,
  createAssessmentInvitation,
  removeFromShortlist,
  toggleCandidateShortlist,
} from '../features/recruiter/recruiterApi';
import { toggleTryoutRegistrationAsync } from '../features/tryout/tryoutEvents';
import { saveTypingAttempt } from '../features/typing/typingApi';
import {
  buildLmsActivityEvent,
  emitEcosystemTelemetry,
  resolveTelemetryGatewayUrl,
  sanitizeTelemetryMetadata,
} from '../shared/services/ecosystemTelemetry';
import { lmsApi } from '../shared/services/lmsApi';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

const CANONICAL_KEYS = [
  'agentId',
  'divisionId',
  'entityId',
  'id',
  'metadata',
  'severity',
  'source',
  'summary',
  'targetFloor',
  'targetZone',
  'timestamp',
  'title',
  'type',
];

function assertCanonicalLmsEvent(rawBody: string): Record<string, unknown> {
  const parsed = JSON.parse(rawBody) as Record<string, unknown>;
  expect(Object.keys(parsed).sort()).toEqual(CANONICAL_KEYS);
  expect(typeof parsed.id).toBe('string');
  expect((parsed.id as string).length).toBeGreaterThan(0);
  expect((parsed.id as string).length).toBeLessThanOrEqual(128);
  expect(Number.isNaN(Date.parse(String(parsed.timestamp)))).toBe(false);
  expect(parsed.source).toBe('lms-psikotes');
  expect(parsed.type).toBe('lms.activity');
  expect(['executive', 'architecture', 'engineering', 'qa', 'devops', 'lounge']).toContain(
    parsed.divisionId,
  );
  expect(typeof parsed.agentId).toBe('number');
  expect(Number.isInteger(parsed.agentId)).toBe(true);
  expect(parsed.agentId as number).toBeGreaterThanOrEqual(0);
  expect(parsed.agentId as number).toBeLessThanOrEqual(23);
  expect(
    parsed.entityId === null ||
      (typeof parsed.entityId === 'string' && parsed.entityId.length <= 128),
  ).toBe(true);
  expect(typeof parsed.title).toBe('string');
  expect((parsed.title as string).trim().length).toBeGreaterThan(0);
  expect((parsed.title as string).length).toBeLessThanOrEqual(160);
  expect(typeof parsed.summary).toBe('string');
  expect((parsed.summary as string).trim().length).toBeGreaterThan(0);
  expect((parsed.summary as string).length).toBeLessThanOrEqual(500);
  expect(['workspace', 'boardroom', 'cafeteria', 'lobby', 'lounge', 'gym', 'musholla']).toContain(
    parsed.targetZone,
  );
  expect([1, 2, 3]).toContain(parsed.targetFloor);
  expect(['info', 'success', 'warning', 'alert']).toContain(parsed.severity);
  expect(
    typeof parsed.metadata === 'object' &&
      parsed.metadata !== null &&
      !Array.isArray(parsed.metadata),
  ).toBe(true);
  return parsed;
}

describe('ecosystemTelemetry adapter & hooks (R5-F4a)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('is a zero-network no-op when VITE_TELEMETRY_GATEWAY_URL is unset, empty, or placeholder', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    vi.stubEnv('VITE_TELEMETRY_GATEWAY_URL', '');
    expect(resolveTelemetryGatewayUrl()).toBeNull();
    emitEcosystemTelemetry({ title: 'Test', summary: 'Should not send' });

    vi.stubEnv('VITE_TELEMETRY_GATEWAY_URL', 'https://your-gateway-id.local');
    expect(resolveTelemetryGatewayUrl()).toBeNull();
    emitEcosystemTelemetry({ title: 'Test', summary: 'Should not send' });

    vi.stubEnv('VITE_TELEMETRY_GATEWAY_URL', 'ftp://localhost:4101');
    expect(resolveTelemetryGatewayUrl()).toBeNull();

    await lmsApi.enrollCourse('u-1', 'course-abc');
    await recordKraepelinAttemptAsync({
      userId: 'u-1',
      presetId: 'standard',
      durationSeconds: 60,
      totalAnswered: 40,
      totalCorrect: 38,
      accuracyPct: 95,
      columnAttemptedCounts: [10, 10, 10, 10],
    });
    toggleCandidateShortlist('cand-01');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('emits strictly 13-key event-schema.json payloads across all 11 hook points', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 202 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('VITE_TELEMETRY_GATEWAY_URL', 'http://localhost:4101/');

    // Seed an unsubmitted quiz attempt in demo storage
    localStorage.setItem(
      'ruanglatih_demo_attempts_v11',
      JSON.stringify([
        {
          id: 'att-telemetry-1',
          quiz_id: 'quiz-logika-1',
          user_id: 'usr-demo-1',
          started_at: new Date().toISOString(),
          submitted_at: null,
          answers: {},
          score: null,
        },
      ]),
    );

    // 1. enrollCourse
    await lmsApi.enrollCourse('usr-demo-1', 'course-telemetry-1');
    // 2. markLessonComplete
    await lmsApi.markLessonComplete('usr-demo-1', 'lesson-telemetry-1');
    // 3. submitQuizAttempt
    await lmsApi.submitQuizAttempt('att-telemetry-1', { q1: 'A' });
    // 4. registerCertificate
    await lmsApi.registerCertificate({
      cert_code: 'LT-CERT-2026-01',
      user_id: 'usr-demo-1',
      student_name: 'Nadia Kusuma',
      course_id: 'course-telemetry-1',
      course_title: 'Analisis Logika',
      teacher_name: 'Ibu Triastuti',
    });
    // 5. createCommunityPost
    await lmsApi.createCommunityPost({
      user_id: 'usr-demo-1',
      author_name: 'Nadia Kusuma',
      author_role: 'student',
      category: 'Tips Psikotes',
      title: 'Cara cepat Kraepelin',
      content: 'Latihan rutin setiap hari',
    });
    // 6. recordKraepelinAttemptAsync
    await recordKraepelinAttemptAsync({
      userId: 'usr-demo-1',
      presetId: 'kraepelin-3m',
      durationSeconds: 180,
      totalAnswered: 120,
      totalCorrect: 114,
      accuracyPct: 95,
      columnAttemptedCounts: [28, 30, 31, 31],
    });
    // 7. saveTypingAttempt
    await saveTypingAttempt('guest', {
      preset_id: 'typing-id-1',
      preset_title: 'Teks Bisnis',
      duration_seconds: 60,
      wpm: 72,
      cpm: 360,
      accuracy_pct: 97,
      error_count: 3,
    });
    // 8. toggleTryoutRegistrationAsync
    await toggleTryoutRegistrationAsync('usr-demo-1', 'tryout-akbar-bumn-live');
    // 9. toggleCandidateShortlist (+ addToShortlist/removeFromShortlist)
    toggleCandidateShortlist('cand-01');
    addToShortlist('cand-02');
    removeFromShortlist('cand-02');
    // 10. createAssessmentInvitation
    const invite = createAssessmentInvitation({
      orgName: 'Telkom Indonesia',
      targetPosition: 'Data Analyst',
      quizId: 'quiz-sql-1',
      quizTitle: 'SQL Screening',
    });
    // 11. recordAdminAuditLogAsync
    await recordAdminAuditLogAsync({
      actorId: 'admin-99',
      actorName: 'Super Admin',
      action: 'CERTIFICATE_REVOKED',
      targetLabel: 'target@user.id',
      detail: 'Revoked cert for Nadia Kusuma',
    });

    expect(fetchMock).toHaveBeenCalledTimes(13);

    const emittedEvents: Record<string, unknown>[] = [];
    for (const call of fetchMock.mock.calls) {
      expect(call[0]).toBe('http://localhost:4101/events');
      const init = call[1] as RequestInit;
      expect(init.method).toBe('POST');
      expect(init.keepalive).toBe(true);
      emittedEvents.push(assertCanonicalLmsEvent(String(init.body)));
    }

    const certEvt = emittedEvents.find((e) => e.entityId === 'LT-CERT-2026-01');
    expect(certEvt?.id).toBe('lms-cert-LT-CERT-2026-01');
    expect(certEvt?.agentId).toBe(14);
    expect(certEvt?.targetZone).toBe('lobby');
    expect(certEvt?.targetFloor).toBe(1);

    const serializedAll = JSON.stringify(emittedEvents);
    expect(serializedAll).not.toContain(invite.invite_token);
  });

  it('strictly anonymizes UU PDP PII keys and patterns across all payloads', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('VITE_TELEMETRY_GATEWAY_URL', 'http://localhost:4101');

    const cleanedMeta = sanitizeTelemetryMetadata({
      email: 'nadia@pelajar.id',
      student_name: 'Nadia Kusuma',
      full_name: 'Nadia Kusuma',
      author_name: 'Nadia Kusuma',
      teacher_name: 'Pak Guru',
      actorName: 'Super Admin',
      targetLabel: 'target@user.id',
      detail: 'Alasan sensitif Nadia',
      password: 'secret',
      token: 'tok-xyz',
      invite_token: 'INV-1234',
      user_id: 'usr-secret-99',
      userId: 'usr-secret-99',
      actorId: 'adm-1',
      answers: { q1: 'A' },
      content: 'Isi forum pribadi',
      safeScore: 95,
      note: 'Hubungi nadia@pelajar.id atau 081234567890 NIK 3174011234560001',
    });

    expect(Object.keys(cleanedMeta)).toEqual(['safeScore', 'note']);
    expect(cleanedMeta.note).toBe('Hubungi [REDACTED] atau [REDACTED] NIK [REDACTED]');

    const directEvent = buildLmsActivityEvent({
      title: 'Kirim ke nadia@pelajar.id',
      summary: 'NIK 3174011234560001 dan +6281234567890',
    });
    expect(directEvent.title).toBe('Kirim ke [REDACTED]');
    expect(directEvent.summary).toBe('NIK [REDACTED] dan [REDACTED]');

    await lmsApi.registerCertificate({
      cert_code: 'LT-PII-01',
      user_id: 'usr-secret-99',
      student_name: 'Nadia Kusuma',
      course_id: 'course-1',
      course_title: 'Kursus A',
      teacher_name: 'Ibu Guru Rahasia',
    });
    await lmsApi.createCommunityPost({
      user_id: 'usr-secret-99',
      author_name: 'Nadia Kusuma',
      author_role: 'student',
      category: 'Diskusi',
      title: 'Rahasia pribadi',
      content: 'Konten forum sangat rahasia',
    });
    await recordAdminAuditLogAsync({
      actorId: 'adm-secret-1',
      actorName: 'Super Admin Rahasia',
      action: 'USER_STATUS_CHANGED',
      targetLabel: 'target@user.id',
      detail: 'Alasan suspensi Nadia Kusuma',
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const allBodies = fetchMock.mock.calls.map((c) => String((c[1] as RequestInit).body)).join('\n');
    expect(allBodies).not.toContain('Nadia Kusuma');
    expect(allBodies).not.toContain('Ibu Guru Rahasia');
    expect(allBodies).not.toContain('usr-secret-99');
    expect(allBodies).not.toContain('Konten forum sangat rahasia');
    expect(allBodies).not.toContain('Super Admin Rahasia');
    expect(allBodies).not.toContain('target@user.id');
    expect(allBodies).not.toContain('Alasan suspensi');
    expect(allBodies).not.toContain('adm-secret-1');
  });

  it('remains resilient when fetch rejects, returns 500, or returns undefined', async () => {
    vi.stubEnv('VITE_TELEMETRY_GATEWAY_URL', 'http://localhost:4101');

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
    await expect(lmsApi.enrollCourse('u-err', 'c-err')).resolves.toBeUndefined();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('Server Error', { status: 500 })),
    );
    await expect(
      recordAdminAuditLogAsync({
        actorName: 'Admin',
        action: 'ROLE_UPDATED',
        targetLabel: 'user',
        detail: 'role change',
      }),
    ).resolves.toHaveLength(1);

    vi.stubGlobal('fetch', vi.fn().mockReturnValue(undefined));
    expect(() =>
      emitEcosystemTelemetry({ title: 'Undefined fetch return', summary: 'Must not throw' }),
    ).not.toThrow();
  });

  it('prevents duplicate emissions on async wrappers and idempotent re-calls', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('VITE_TELEMETRY_GATEWAY_URL', 'http://localhost:4101');

    // Tryout async wraps sync toggle -> must emit exactly 1 event
    await toggleTryoutRegistrationAsync('u-nondup', 'tryout-akbar-bumn-live');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Admin async wraps sync record -> must emit exactly 1 event
    await recordAdminAuditLogAsync({
      actorName: 'Admin',
      action: 'COURSE_PUBLISH_TOGGLED',
      targetLabel: 'course-1',
      detail: 'published',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Idempotent registerCertificate second call -> 0 new emissions
    await lmsApi.registerCertificate({
      cert_code: 'LT-DEDUP-1',
      user_id: 'u-nondup',
      student_name: 'Siswa',
      course_id: 'course-1',
      course_title: 'Course',
      teacher_name: 'Guru',
    });
    await lmsApi.registerCertificate({
      cert_code: 'LT-DEDUP-1',
      user_id: 'u-nondup',
      student_name: 'Siswa',
      course_id: 'course-1',
      course_title: 'Course',
      teacher_name: 'Guru',
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // Idempotent submitQuizAttempt second call -> 0 new emissions
    localStorage.setItem(
      'ruanglatih_demo_attempts_v11',
      JSON.stringify([
        {
          id: 'att-dedup-1',
          quiz_id: 'quiz-1',
          user_id: 'u-nondup',
          started_at: new Date().toISOString(),
          submitted_at: null,
          answers: {},
          score: null,
        },
      ]),
    );
    await lmsApi.submitQuizAttempt('att-dedup-1', { q1: 'A' });
    await lmsApi.submitQuizAttempt('att-dedup-1', { q1: 'A' });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});

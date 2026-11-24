import { beforeEach, describe, expect, it } from 'vitest';
import {
  getAdminAuditLogs,
  recordAdminAuditLog,
} from '../features/admin/adminAuditLog';
import {
  createCohortAsync,
  joinCohortByCodeAsync,
  listCohortMembers,
  listTeacherCohortsAsync,
  removeCohortMember,
  toggleCohortArchive,
} from '../features/cohort/cohortApi';
import {
  getTalentPassportAsync,
  listAllCertificatesAsync,
  revokeCertificateAsync,
  type CertificateWithRevocation,
} from '../features/talent/talentApi';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k: string) => store.get(k) ?? null,
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    removeItem: (k: string) => {
      store.delete(k);
    },
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };
}

describe('Sprint 12B Features (POV & Governance, Cohort Management, Certificate Revocation)', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: createMemoryStorage(),
      configurable: true,
    });
  });

  it('Admin Audit Log mencatat aksi COMMUNITY_POST_DELETED dan CERTIFICATE_REVOKED', () => {
    recordAdminAuditLog({
      actorName: 'Admin Utama',
      action: 'COMMUNITY_POST_DELETED',
      targetLabel: 'Diskusi Spam',
      detail: 'Dihapus karena melanggar pedoman komunitas',
    });
    recordAdminAuditLog({
      actorName: 'Admin Utama',
      action: 'CERTIFICATE_REVOKED',
      targetLabel: 'LOKA-2026-001',
      detail: 'Alasan: Indikasi kecurangan ujian',
    });

    const logs = getAdminAuditLogs();
    expect(logs).toHaveLength(2);
    expect(logs[0].action).toBe('CERTIFICATE_REVOKED');
    expect(logs[0].targetLabel).toBe('LOKA-2026-001');
    expect(logs[1].action).toBe('COMMUNITY_POST_DELETED');
    expect(logs[1].targetLabel).toBe('Diskusi Spam');
  });

  it('Cohort API: listCohortMembers, removeCohortMember, dan toggleCohortArchive bekerja pada fallback lokal', async () => {
    const cohort = await createCohortAsync({
      teacherId: 'teacher-1',
      name: 'Batch Intensif BUMN',
      maxMembers: 20,
    });

    await joinCohortByCodeAsync('student-a', cohort.invite_code);
    await joinCohortByCodeAsync('student-b', cohort.invite_code);

    const membersBefore = await listCohortMembers(cohort.id);
    expect(membersBefore).toHaveLength(2);
    expect(membersBefore.map((m) => m.user_id).sort()).toEqual(['student-a', 'student-b']);

    await removeCohortMember(cohort.id, 'student-a');
    const membersAfter = await listCohortMembers(cohort.id);
    expect(membersAfter).toHaveLength(1);
    expect(membersAfter[0].user_id).toBe('student-b');

    await toggleCohortArchive(cohort.id, false);
    const archivedList = await listTeacherCohortsAsync('teacher-1');
    expect(archivedList[0].is_active).toBe(false);

    await toggleCohortArchive(cohort.id, true);
    const activeList = await listTeacherCohortsAsync('teacher-1');
    expect(activeList[0].is_active).toBe(true);
  });

  it('Talent API: revokeCertificateAsync memvalidasi alasan, mencabut sertifikat, dan menyembunyikan dari Talent Passport', async () => {
    const seedCerts: CertificateWithRevocation[] = [
      {
        id: 'cert-active',
        cert_code: 'LOKA-ACT-01',
        user_id: 'student-1',
        student_name: 'Budi Santoso',
        course_id: 'course-1',
        course_title: 'Logika Analitis',
        teacher_name: 'Mentor A',
        issued_at: '2026-11-20T10:00:00Z',
      },
      {
        id: 'cert-revoked',
        cert_code: 'LOKA-REV-02',
        user_id: 'student-1',
        student_name: 'Budi Santoso',
        course_id: 'course-2',
        course_title: 'Numerik Dasar',
        teacher_name: 'Mentor A',
        issued_at: '2026-11-22T10:00:00Z',
      },
    ];
    localStorage.setItem('lokatalenta_certificates_v1', JSON.stringify(seedCerts));

    await expect(revokeCertificateAsync('cert-revoked', '   ')).rejects.toThrow(
      'Alasan pencabutan sertifikat wajib diisi.'
    );
    await expect(revokeCertificateAsync('cert-missing', 'Alasan valid')).rejects.toThrow(
      'Sertifikat tidak ditemukan.'
    );

    const revoked = await revokeCertificateAsync('cert-revoked', 'Pelanggaran integritas');
    expect(revoked?.revoked_at).toBeTruthy();
    expect(revoked?.revoke_reason).toBe('Pelanggaran integritas');

    const allCerts = await listAllCertificatesAsync();
    expect(allCerts).toHaveLength(2);
    expect(allCerts[0].id).toBe('cert-revoked');
    expect(allCerts[0].revoke_reason).toBe('Pelanggaran integritas');

    const passport = await getTalentPassportAsync('student-1');
    expect(passport).not.toBeNull();
    expect(passport?.certificates).toHaveLength(1);
    expect(passport?.certificates[0].cert_code).toBe('LOKA-ACT-01');
  });
});

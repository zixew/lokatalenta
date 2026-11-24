import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAdminAuditLogs,
  recordAdminAuditLogAsync,
  syncAdminAuditLogsFromServer,
} from '../features/admin/adminAuditLog';
import { buildAuditLogsCsv, buildUsersCsv } from '../features/admin/adminCsvExport';
import { lmsApi } from '../shared/services/lmsApi';
import type { Profile } from '../shared/types/lms';

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

describe('Sprint 9 Features (BL-27, BL-28, BL-29)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  it('BL-27: updates a question in-place without duplicating entries', async () => {
    const courses = await lmsApi.listAllCoursesForManagement();
    let targetQuizId = '';
    let initialCount = 0;

    for (const c of courses) {
      for (const m of c.modules ?? []) {
        for (const l of m.lessons) {
          if (l.quiz?.questions && l.quiz.questions.length > 0) {
            targetQuizId = l.quiz.id;
            initialCount = l.quiz.questions.length;
            break;
          }
        }
        if (targetQuizId) break;
      }
      if (targetQuizId) break;
    }

    expect(targetQuizId).not.toBe('');

    const added = await lmsApi.addQuestionToQuiz(targetQuizId, {
      category_tag: 'Verbal',
      question_text: 'Soal Awal Sebelum Edit',
      image_url: null,
      audio_text: null,
      audio_lang: null,
      options: [
        { key: 'A', text: 'Opsi A' },
        { key: 'B', text: 'Opsi B' },
        { key: 'C', text: 'Opsi C' },
        { key: 'D', text: 'Opsi D' },
        { key: 'E', text: 'Opsi E' },
      ],
      correct_option: 'A',
      explanation: 'Penjelasan awal',
    });

    const updated = await lmsApi.updateQuestionInQuiz(added.id, {
      category_tag: 'Logika',
      question_text: 'Soal Sudah Diperbarui In-Place',
      image_url: null,
      audio_text: null,
      audio_lang: null,
      options: [
        { key: 'A', text: 'Baru A' },
        { key: 'B', text: 'Baru B' },
        { key: 'C', text: 'Baru C' },
        { key: 'D', text: 'Baru D' },
        { key: 'E', text: 'Baru E' },
      ],
      correct_option: 'B',
      explanation: 'Penjelasan baru',
    });

    expect(updated.id).toBe(added.id);
    expect(updated.question_text).toBe('Soal Sudah Diperbarui In-Place');
    expect(updated.correct_option).toBe('B');

    const refreshedCourses = await lmsApi.listAllCoursesForManagement();
    let finalCount = 0;
    for (const c of refreshedCourses) {
      for (const m of c.modules ?? []) {
        for (const l of m.lessons) {
          if (l.quiz?.id === targetQuizId) {
            finalCount = l.quiz.questions?.length ?? 0;
          }
        }
      }
    }
    expect(finalCount).toBe(initialCount + 1);
  });

  it('BL-28: records and retrieves admin audit logs asynchronously', async () => {
    await recordAdminAuditLogAsync({
      actorId: 'admin-1',
      actorName: 'Super Admin',
      action: 'ROLE_UPDATED',
      targetLabel: 'siswa@lokatalenta.id',
      detail: 'Mengubah role menjadi teacher',
    });

    const local = getAdminAuditLogs();
    expect(local).toHaveLength(1);
    expect(local[0].action).toBe('ROLE_UPDATED');

    const synced = await syncAdminAuditLogsFromServer();
    expect(synced).toHaveLength(1);
    expect(synced[0].targetLabel).toBe('siswa@lokatalenta.id');
  });

  it('BL-29: builds users & audit logs CSV with formula injection sanitization', () => {
    const mockProfiles: Profile[] = [
      {
        id: 'u-1',
        email: 'evil@test.com',
        full_name: '=CMD("calc")',
        role: 'student',
        is_active: true,
        created_at: '2026-11-24T00:00:00Z',
      },
    ];

    const usersCsv = buildUsersCsv(mockProfiles);
    expect(usersCsv).toContain('ID,Nama Lengkap,Email,Role,Status Aktif,Dibuat Pada');
    expect(usersCsv).toContain(`"'=CMD(""calc"")"`);

    const auditCsv = buildAuditLogsCsv([
      {
        id: 'a-1',
        actorName: 'Admin',
        action: 'COURSE_PUBLISH_TOGGLED',
        targetLabel: '+Kursus Formula',
        detail: 'Menerbitkan kursus ke katalog',
        timestamp: '2026-11-24T00:00:00Z',
      },
    ]);
    expect(auditCsv).toContain('ID,Waktu,Aktor,Aksi,Target,Detail');
    expect(auditCsv).toContain("'+Kursus Formula");
  });
});

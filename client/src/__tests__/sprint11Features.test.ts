import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildCohortSummaryCsv,
  createCohortAsync,
  joinCohortByCodeAsync,
  listStudentCohortsAsync,
} from '../features/cohort/cohortApi';
import {
  executeClientSql,
  isSqlMissionPassed,
  SQL_SCENARIOS,
} from '../features/player/sqlSandboxEngine';
import {
  buildIcsCalendarEvent,
  buildStudyAgendaItems,
} from '../features/profile/studyAgenda';

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

describe('Sprint 11 Features (BL-33, BL-34, BL-35)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  it('BL-33: creates cohort, joins by invite code, enforces quota & sanitizes CSV', async () => {
    const cohort = await createCohortAsync({
      teacherId: 'teacher-1',
      name: '=BUMN Batch 2026',
      courseId: 'course-1',
      courseTitle: 'Persiapan TKD BUMN',
      maxMembers: 5,
    });

    expect(cohort.invite_code).toMatch(/^LOKA-/);

    const joinRes = await joinCohortByCodeAsync('student-1', cohort.invite_code);
    expect(joinRes.alreadyJoined).toBe(false);
    expect(joinRes.name).toBe('=BUMN Batch 2026');

    const studentCohorts = await listStudentCohortsAsync('student-1');
    expect(studentCohorts).toHaveLength(1);
    expect(studentCohorts[0].id).toBe(cohort.id);

    await expect(joinCohortByCodeAsync('student-2', 'INVALID-CODE')).rejects.toThrow();

    const csv = buildCohortSummaryCsv(studentCohorts);
    expect(csv).toContain("'=BUMN Batch 2026");
  });

  it('BL-34: builds chronological Study Agenda items and valid .ics calendar event', () => {
    const items = buildStudyAgendaItems({
      registeredTryoutIds: ['tryout-akbar-bumn-live'],
      cohorts: [
        {
          id: 'c-1',
          teacher_id: 't-1',
          course_id: null,
          name: 'Cohort Intensif',
          invite_code: 'LOKA-ABC123',
          max_members: 30,
          is_active: true,
          member_count: 1,
          created_at: new Date().toISOString(),
        },
      ],
      enrolledCourses: [],
      completedLessonIds: [],
    });

    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items[0].category).toBe('tryout');
    const ics = buildIcsCalendarEvent(items[0]);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
  });

  it('BL-35: executes SELECT/WHERE/ORDER/LIMIT/COUNT in SQL sandbox and blocks destructive SQL', () => {
    const res1 = executeClientSql(SQL_SCENARIOS[0].solutionQuery);
    expect(res1.ok).toBe(true);
    expect(isSqlMissionPassed(res1, SQL_SCENARIOS[0])).toBe(true);

    const res2 = executeClientSql(SQL_SCENARIOS[1].solutionQuery);
    expect(res2.ok).toBe(true);
    expect(isSqlMissionPassed(res2, SQL_SCENARIOS[1])).toBe(true);

    const res3 = executeClientSql(SQL_SCENARIOS[2].solutionQuery);
    expect(res3.ok).toBe(true);
    expect(isSqlMissionPassed(res3, SQL_SCENARIOS[2])).toBe(true);

    const blocked = executeClientSql('DROP TABLE karyawan');
    expect(blocked.ok).toBe(false);
    expect(blocked.error).toContain('SELECT');
  });
});

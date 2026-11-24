import { sanitizeCsvCell } from '../../shared/lib/securityGuards';
import { isSupabaseConfigured, supabase } from '../../shared/lib/supabase';

export interface CohortRecord {
  id: string;
  teacher_id: string;
  course_id: string | null;
  course_title?: string;
  name: string;
  invite_code: string;
  max_members: number;
  is_active: boolean;
  member_count: number;
  created_at: string;
}

export interface CohortMembershipRecord {
  cohort_id: string;
  user_id: string;
  joined_at: string;
}

const COHORTS_KEY = 'lokatalenta_cohorts_v1';
const COHORT_MEMBERS_KEY = 'lokatalenta_cohort_members_v1';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

export function generateCohortInviteCode(prefix = 'LOKA'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${suffix}`;
}

export async function listTeacherCohortsAsync(
  teacherId: string,
  courseTitleMap: Record<string, string> = {}
): Promise<CohortRecord[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('cohorts')
        .select('id, teacher_id, course_id, name, invite_code, max_members, is_active, created_at, cohort_members(count)')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((row: Record<string, unknown>) => {
          const cid = row.course_id ? String(row.course_id) : null;
          const membersArr = Array.isArray(row.cohort_members)
            ? (row.cohort_members as Array<{ count?: number }>)
            : [];
          return {
            id: String(row.id),
            teacher_id: String(row.teacher_id),
            course_id: cid,
            course_title: cid ? courseTitleMap[cid] : undefined,
            name: String(row.name),
            invite_code: String(row.invite_code),
            max_members: Number(row.max_members) || 30,
            is_active: row.is_active !== false,
            member_count: Number(membersArr[0]?.count ?? 0),
            created_at: String(row.created_at),
          };
        });
      }
    } catch {
      // fall through to local fallback
    }
  }

  const cohorts = readJson<CohortRecord[]>(COHORTS_KEY, []);
  const members = readJson<CohortMembershipRecord[]>(COHORT_MEMBERS_KEY, []);
  return cohorts
    .filter((c) => c.teacher_id === teacherId)
    .map((c) => ({
      ...c,
      course_title: c.course_id ? courseTitleMap[c.course_id] : c.course_title,
      member_count: members.filter((m) => m.cohort_id === c.id).length,
    }));
}

export async function createCohortAsync(input: {
  teacherId: string;
  name: string;
  courseId?: string | null;
  courseTitle?: string;
  maxMembers?: number;
}): Promise<CohortRecord> {
  const cleanName = input.name.trim();
  if (!cleanName) throw new Error('Nama cohort tidak boleh kosong.');
  const maxMembers = Math.max(5, Math.min(500, Math.round(input.maxMembers ?? 30)));
  const inviteCode = generateCohortInviteCode();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('cohorts')
        .insert({
          teacher_id: input.teacherId,
          course_id: input.courseId || null,
          name: cleanName,
          invite_code: inviteCode,
          max_members: maxMembers,
        })
        .select('id, teacher_id, course_id, name, invite_code, max_members, is_active, created_at')
        .single();

      if (!error && data) {
        return {
          ...(data as CohortRecord),
          course_title: input.courseTitle,
          member_count: 0,
        };
      }
    } catch {
      // fall through to local fallback
    }
  }

  const entry: CohortRecord = {
    id: `cohort-${Date.now()}`,
    teacher_id: input.teacherId,
    course_id: input.courseId || null,
    course_title: input.courseTitle,
    name: cleanName,
    invite_code: inviteCode,
    max_members: maxMembers,
    is_active: true,
    member_count: 0,
    created_at: new Date().toISOString(),
  };
  const current = readJson<CohortRecord[]>(COHORTS_KEY, []);
  writeJson(COHORTS_KEY, [entry, ...current]);
  return entry;
}

export async function listStudentCohortsAsync(
  userId: string,
  courseTitleMap: Record<string, string> = {}
): Promise<CohortRecord[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('cohort_members')
        .select('cohort_id, cohorts(id, teacher_id, course_id, name, invite_code, max_members, is_active, created_at)')
        .eq('user_id', userId);

      if (!error && data) {
        return data
          .map((row: Record<string, unknown>) => row.cohorts as Record<string, unknown> | null)
          .filter((c): c is Record<string, unknown> => Boolean(c))
          .map((c) => {
            const cid = c.course_id ? String(c.course_id) : null;
            return {
              id: String(c.id),
              teacher_id: String(c.teacher_id),
              course_id: cid,
              course_title: cid ? courseTitleMap[cid] : undefined,
              name: String(c.name),
              invite_code: String(c.invite_code),
              max_members: Number(c.max_members) || 30,
              is_active: c.is_active !== false,
              member_count: 1,
              created_at: String(c.created_at),
            };
          });
      }
    } catch {
      // fall through to local fallback
    }
  }

  const cohorts = readJson<CohortRecord[]>(COHORTS_KEY, []);
  const members = readJson<CohortMembershipRecord[]>(COHORT_MEMBERS_KEY, []);
  const joinedIds = new Set(members.filter((m) => m.user_id === userId).map((m) => m.cohort_id));
  return cohorts
    .filter((c) => joinedIds.has(c.id))
    .map((c) => ({
      ...c,
      course_title: c.course_id ? courseTitleMap[c.course_id] : c.course_title,
      member_count: members.filter((m) => m.cohort_id === c.id).length,
    }));
}

export async function joinCohortByCodeAsync(
  userId: string,
  inviteCode: string
): Promise<{ name: string; alreadyJoined: boolean }> {
  const cleanCode = inviteCode.trim().toUpperCase();
  if (!cleanCode) throw new Error('Masukkan kode undangan cohort.');

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('join_cohort_by_code', {
        p_invite_code: cleanCode,
      });
      if (!error && data) {
        const res = data as { name?: string; already_joined?: boolean };
        return {
          name: res.name || 'Cohort',
          alreadyJoined: Boolean(res.already_joined),
        };
      }
      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      if (err instanceof Error && !err.message.includes('function') && !err.message.includes('404')) {
        throw err;
      }
    }
  }

  const cohorts = readJson<CohortRecord[]>(COHORTS_KEY, []);
  const target = cohorts.find(
    (c) => c.invite_code.toUpperCase() === cleanCode && c.is_active
  );
  if (!target) {
    throw new Error('Kode undangan cohort tidak ditemukan atau sudah tidak aktif.');
  }

  const members = readJson<CohortMembershipRecord[]>(COHORT_MEMBERS_KEY, []);
  if (members.some((m) => m.cohort_id === target.id && m.user_id === userId)) {
    return { name: target.name, alreadyJoined: true };
  }

  const currentCount = members.filter((m) => m.cohort_id === target.id).length;
  if (currentCount >= target.max_members) {
    throw new Error('Kuota peserta untuk cohort ini sudah penuh.');
  }

  writeJson(COHORT_MEMBERS_KEY, [
    ...members,
    { cohort_id: target.id, user_id: userId, joined_at: new Date().toISOString() },
  ]);
  return { name: target.name, alreadyJoined: false };
}

export async function leaveCohortAsync(userId: string, cohortId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('cohort_members')
        .delete()
        .eq('cohort_id', cohortId)
        .eq('user_id', userId);
    } catch {
      // fall through
    }
  }
  const members = readJson<CohortMembershipRecord[]>(COHORT_MEMBERS_KEY, []);
  writeJson(
    COHORT_MEMBERS_KEY,
    members.filter((m) => !(m.cohort_id === cohortId && m.user_id === userId))
  );
}

export function buildCohortSummaryCsv(cohorts: CohortRecord[]): string {
  const header = ['ID', 'Nama Cohort', 'Kode Undangan', 'Kursus Terkait', 'Jumlah Anggota', 'Kuota Maksimal', 'Status'];
  const rows = cohorts.map((c) => [
    sanitizeCsvCell(c.id),
    sanitizeCsvCell(c.name),
    sanitizeCsvCell(c.invite_code),
    sanitizeCsvCell(c.course_title || '-'),
    String(c.member_count),
    String(c.max_members),
    c.is_active ? 'Aktif' : 'Arsip',
  ]);
  return [header, ...rows].map((r) => r.join(',')).join('\n');
}

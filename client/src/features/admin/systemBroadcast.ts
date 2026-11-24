import { isSupabaseConfigured, supabase } from '../../shared/lib/supabase';
import type { UserRole } from '../../shared/types/lms';

export type BroadcastTargetRole = 'all' | UserRole;
export type BroadcastSeverity = 'info' | 'warning' | 'urgent';

export interface SystemBroadcast {
  id: string;
  title: string;
  message: string;
  severity: BroadcastSeverity;
  target_role: BroadcastTargetRole;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface CreateSystemBroadcastInput {
  title: string;
  message: string;
  severity?: BroadcastSeverity;
  target_role?: BroadcastTargetRole;
  created_by?: string | null;
  expires_at?: string | null;
}

const BROADCAST_STORAGE_KEY = 'lokatalenta_system_broadcasts_v1';
const DISMISSED_STORAGE_KEY = 'lokatalenta_dismissed_broadcasts_v1';

function readLocalBroadcasts(): SystemBroadcast[] {
  try {
    const raw = localStorage.getItem(BROADCAST_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SystemBroadcast[]) : [];
  } catch {
    return [];
  }
}

function writeLocalBroadcasts(items: SystemBroadcast[]): void {
  try {
    localStorage.setItem(BROADCAST_STORAGE_KEY, JSON.stringify(items.slice(0, 50)));
  } catch {
    // ignore storage errors
  }
}

function mapBroadcastRow(row: Record<string, unknown>): SystemBroadcast {
  const severity = row.severity;
  const targetRole = row.target_role;
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    message: String(row.message ?? ''),
    severity:
      severity === 'warning' || severity === 'urgent' || severity === 'info'
        ? severity
        : 'info',
    target_role:
      targetRole === 'student' ||
      targetRole === 'teacher' ||
      targetRole === 'admin' ||
      targetRole === 'all'
        ? targetRole
        : 'all',
    is_active: row.is_active !== false,
    created_by: row.created_by ? String(row.created_by) : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    expires_at: row.expires_at ? String(row.expires_at) : null,
  };
}

function isNotExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true;
  const time = new Date(expiresAt).getTime();
  return Number.isNaN(time) || time > Date.now();
}

export function filterActiveBroadcastsForRole(
  items: SystemBroadcast[],
  role?: UserRole | 'all' | null
): SystemBroadcast[] {
  return items.filter((item) => {
    if (!item.is_active || !isNotExpired(item.expires_at)) return false;
    if (item.target_role === 'all') return true;
    if (!role || role === 'all') return false;
    return item.target_role === role;
  });
}

export async function listActiveBroadcasts(
  role?: UserRole | 'all' | null
): Promise<SystemBroadcast[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('system_broadcasts')
        .select('id, title, message, severity, target_role, is_active, created_by, created_at, expires_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped = data.map((row) => mapBroadcastRow(row as Record<string, unknown>));
        return filterActiveBroadcastsForRole(mapped, role);
      }
    } catch {
      // fall through to local demo fallback
    }
  }

  return filterActiveBroadcastsForRole(readLocalBroadcasts(), role);
}

export async function listAllBroadcasts(): Promise<SystemBroadcast[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('system_broadcasts')
        .select('id, title, message, severity, target_role, is_active, created_by, created_at, expires_at')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped = data.map((row) => mapBroadcastRow(row as Record<string, unknown>));
        writeLocalBroadcasts(mapped);
        return mapped;
      }
    } catch {
      // fall through to local demo fallback
    }
  }

  return readLocalBroadcasts();
}

export async function createSystemBroadcast(
  input: CreateSystemBroadcastInput
): Promise<SystemBroadcast> {
  const title = input.title.trim();
  const message = input.message.trim();
  if (!title || !message) {
    throw new Error('Judul dan pesan pengumuman wajib diisi.');
  }

  const severity: BroadcastSeverity = input.severity ?? 'info';
  const targetRole: BroadcastTargetRole = input.target_role ?? 'all';
  const expiresAt = input.expires_at ?? null;

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('system_broadcasts')
      .insert({
        title,
        message,
        severity,
        target_role: targetRole,
        is_active: true,
        created_by: input.created_by ?? null,
        expires_at: expiresAt,
      })
      .select('id, title, message, severity, target_role, is_active, created_by, created_at, expires_at')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const created = mapBroadcastRow(data as Record<string, unknown>);
    const current = readLocalBroadcasts();
    writeLocalBroadcasts([created, ...current.filter((item) => item.id !== created.id)]);
    return created;
  }

  const created: SystemBroadcast = {
    id: `broadcast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    message,
    severity,
    target_role: targetRole,
    is_active: true,
    created_by: input.created_by ?? null,
    created_at: new Date().toISOString(),
    expires_at: expiresAt,
  };
  const next = [created, ...readLocalBroadcasts()];
  writeLocalBroadcasts(next);
  return created;
}

export async function toggleSystemBroadcast(
  id: string,
  isActive: boolean
): Promise<SystemBroadcast | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('system_broadcasts')
      .update({ is_active: isActive })
      .eq('id', id)
      .select('id, title, message, severity, target_role, is_active, created_by, created_at, expires_at')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const updated = mapBroadcastRow(data as Record<string, unknown>);
    const next = readLocalBroadcasts().map((item) => (item.id === id ? updated : item));
    writeLocalBroadcasts(next);
    return updated;
  }

  let updatedItem: SystemBroadcast | null = null;
  const next = readLocalBroadcasts().map((item) => {
    if (item.id === id) {
      updatedItem = { ...item, is_active: isActive };
      return updatedItem;
    }
    return item;
  });
  writeLocalBroadcasts(next);
  return updatedItem;
}

export function getDismissedBroadcastIds(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function dismissBroadcastId(id: string): string[] {
  const current = getDismissedBroadcastIds();
  if (current.includes(id)) return current;
  const next = [...current, id].slice(-100);
  try {
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
  return next;
}

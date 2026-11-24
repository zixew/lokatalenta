import { isSupabaseConfigured, supabase } from '../../shared/lib/supabase';

export type AdminAuditAction = 'ROLE_UPDATED' | 'USER_STATUS_CHANGED' | 'COURSE_PUBLISH_TOGGLED';

export interface AdminAuditEntry {
  id: string;
  actorName: string;
  action: AdminAuditAction;
  targetLabel: string;
  detail: string;
  timestamp: string;
}

const AUDIT_STORAGE_KEY = 'lokatalenta_admin_audit_logs_v1';

export function getAdminAuditLogs(): AdminAuditEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminAuditEntry[]) : [];
  } catch {
    return [];
  }
}

function saveAdminAuditLogsLocal(logs: AdminAuditEntry[]): void {
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch {
    // ignore storage errors
  }
}

export function recordAdminAuditLog(input: {
  actorName: string;
  action: AdminAuditAction;
  targetLabel: string;
  detail: string;
}): AdminAuditEntry[] {
  const current = getAdminAuditLogs();
  const entry: AdminAuditEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    actorName: input.actorName || 'Admin',
    action: input.action,
    targetLabel: input.targetLabel,
    detail: input.detail,
    timestamp: new Date().toISOString(),
  };
  const next = [entry, ...current].slice(0, 100);
  saveAdminAuditLogsLocal(next);
  return next;
}

export async function recordAdminAuditLogAsync(input: {
  actorId?: string | null;
  actorName: string;
  action: AdminAuditAction;
  targetLabel: string;
  detail: string;
}): Promise<AdminAuditEntry[]> {
  const next = recordAdminAuditLog(input);
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('admin_audit_logs').insert({
        actor_id: input.actorId ?? null,
        actor_name: input.actorName || 'Admin',
        action: input.action,
        target_label: input.targetLabel,
        detail: input.detail,
      });
    } catch {
      // keep optimistic local audit log if cloud sync fails
    }
  }
  return next;
}

export async function syncAdminAuditLogsFromServer(): Promise<AdminAuditEntry[]> {
  const local = getAdminAuditLogs();
  if (!isSupabaseConfigured || !supabase) {
    return local;
  }

  try {
    const { data, error } = await supabase
      .from('admin_audit_logs')
      .select('id, actor_name, action, target_label, detail, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data || data.length === 0) {
      return local;
    }

    const mapped: AdminAuditEntry[] = data.map((row) => ({
      id: String(row.id),
      actorName: String(row.actor_name),
      action: row.action as AdminAuditAction,
      targetLabel: String(row.target_label),
      detail: String(row.detail),
      timestamp: String(row.created_at),
    }));
    saveAdminAuditLogsLocal(mapped);
    return mapped;
  } catch {
    return local;
  }
}

export interface AdminAuditEntry {
  id: string;
  actorName: string;
  action: 'ROLE_UPDATED' | 'USER_STATUS_CHANGED' | 'COURSE_PUBLISH_TOGGLED';
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

export function recordAdminAuditLog(input: {
  actorName: string;
  action: AdminAuditEntry['action'];
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
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
  return next;
}

import { sanitizeCsvCell } from '../../shared/lib/securityGuards';
import type { Profile } from '../../shared/types/lms';
import type { AdminAuditEntry } from './adminAuditLog';

export function buildUsersCsv(profiles: Profile[]): string {
  const header = ['ID', 'Nama Lengkap', 'Email', 'Role', 'Status Aktif', 'Dibuat Pada'];
  const rows = profiles.map((p) => [
    sanitizeCsvCell(p.id),
    sanitizeCsvCell(p.full_name || ''),
    sanitizeCsvCell(p.email || ''),
    sanitizeCsvCell(p.role),
    sanitizeCsvCell(p.is_active === false ? 'Nonaktif' : 'Aktif'),
    sanitizeCsvCell(p.created_at || ''),
  ]);
  return [header, ...rows].map((row) => row.join(',')).join('\n');
}

export function buildAuditLogsCsv(logs: AdminAuditEntry[]): string {
  const header = ['ID', 'Waktu', 'Aktor', 'Aksi', 'Target', 'Detail'];
  const rows = logs.map((log) => [
    sanitizeCsvCell(log.id),
    sanitizeCsvCell(log.timestamp),
    sanitizeCsvCell(log.actorName),
    sanitizeCsvCell(log.action),
    sanitizeCsvCell(log.targetLabel),
    sanitizeCsvCell(log.detail),
  ]);
  return [header, ...rows].map((row) => row.join(',')).join('\n');
}

export function downloadCsvFile(filename: string, csvContent: string): void {
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

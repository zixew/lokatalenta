import { ClipboardList, Download } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import type { AdminAuditAction, AdminAuditEntry } from './adminAuditLog';

interface AdminAuditLogPanelProps {
  logs: AdminAuditEntry[];
  onExportCsv?: (filteredLogs: AdminAuditEntry[]) => void;
}

const ACTION_FILTERS: Array<{ value: 'ALL' | AdminAuditAction; label: string }> = [
  { value: 'ALL', label: 'Semua Aksi' },
  { value: 'ROLE_UPDATED', label: 'Role Diubah' },
  { value: 'USER_STATUS_CHANGED', label: 'Status Akun' },
  { value: 'COURSE_PUBLISH_TOGGLED', label: 'Publikasi Kursus' },
];

export function AdminAuditLogPanel({ logs, onExportCsv }: AdminAuditLogPanelProps) {
  const [actionFilter, setActionFilter] = useState<'ALL' | AdminAuditAction>('ALL');

  const filteredLogs =
    actionFilter === 'ALL' ? logs : logs.filter((log) => log.action === actionFilter);

  return (
    <section className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E5E3DC] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#0F766E]" />
            Audit Log &amp; Jejak Aktivitas Admin
          </h2>
          <p className="text-xs text-[#71717A] dark:text-slate-400 mt-0.5">
            Rekam jejak perubahan role pengguna, status akun, dan moderasi publikasi kursus.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="slate">{filteredLogs.length} Aktivitas</Badge>
          {onExportCsv && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onExportCsv(filteredLogs)}
              disabled={filteredLogs.length === 0}
            >
              <Download className="w-3.5 h-3.5" />
              Unduh CSV Audit Log
            </Button>
          )}
        </div>
      </div>

      <div className="px-6 py-3 border-b border-[#E5E3DC] dark:border-slate-800 bg-[#FAFAF9] dark:bg-slate-900/40 flex flex-wrap gap-1.5">
        {ACTION_FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setActionFilter(item.value)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              actionFilter === item.value
                ? 'bg-[#0F766E] text-white'
                : 'bg-white dark:bg-slate-800 border border-[#E5E3DC] dark:border-slate-700 text-[#52525B] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filteredLogs.length === 0 ? (
        <div className="p-8 text-center text-sm text-[#71717A] dark:text-slate-400">
          Belum ada aktivitas perubahan yang sesuai dengan filter ini.
        </div>
      ) : (
        <div className="divide-y divide-[#E5E3DC] dark:divide-slate-800">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    tone={
                      log.action === 'ROLE_UPDATED'
                        ? 'blue'
                        : log.action === 'USER_STATUS_CHANGED'
                          ? 'amber'
                          : 'emerald'
                    }
                  >
                    {log.action}
                  </Badge>
                  <span className="font-bold text-[#18181B] dark:text-white">
                    {log.targetLabel}
                  </span>
                </div>
                <p className="text-[#52525B] dark:text-slate-300">{log.detail}</p>
              </div>
              <div className="text-[#71717A] dark:text-slate-400 font-mono-tabular shrink-0">
                {log.actorName} •{' '}
                {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

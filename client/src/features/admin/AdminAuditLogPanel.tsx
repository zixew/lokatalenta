import { ClipboardList } from 'lucide-react';
import { Badge } from '../../shared/ui/Badge';
import type { AdminAuditEntry } from './adminAuditLog';

interface AdminAuditLogPanelProps {
  logs: AdminAuditEntry[];
}

export function AdminAuditLogPanel({ logs }: AdminAuditLogPanelProps) {
  return (
    <section className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E5E3DC] dark:border-slate-800 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#0F766E]" />
            Audit Log &amp; Jejak Aktivitas Admin
          </h2>
          <p className="text-xs text-[#71717A] dark:text-slate-400 mt-0.5">
            Rekam jejak perubahan role pengguna, status akun, dan moderasi publikasi kursus.
          </p>
        </div>
        <Badge tone="slate">{logs.length} Aktivitas</Badge>
      </div>

      {logs.length === 0 ? (
        <div className="p-8 text-center text-sm text-[#71717A] dark:text-slate-400">
          Belum ada aktivitas perubahan yang tercatat pada sesi ini.
        </div>
      ) : (
        <div className="divide-y divide-[#E5E3DC] dark:divide-slate-800">
          {logs.map((log) => (
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

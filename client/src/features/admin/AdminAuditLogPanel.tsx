import { ClipboardList, Download, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import type { AdminAuditAction, AdminAuditEntry } from './adminAuditLog';

interface AdminAuditLogPanelProps {
  logs: AdminAuditEntry[];
  onExportCsv?: (filteredLogs: AdminAuditEntry[]) => void;
}

const AUDIT_PAGE_SIZE = 10;

const ACTION_FILTERS: Array<{ value: 'ALL' | AdminAuditAction; label: string }> = [
  { value: 'ALL', label: 'Semua Aksi' },
  { value: 'ROLE_UPDATED', label: 'Role Diubah' },
  { value: 'USER_STATUS_CHANGED', label: 'Status Akun' },
  { value: 'COURSE_PUBLISH_TOGGLED', label: 'Publikasi Kursus' },
  { value: 'COMMUNITY_POST_DELETED', label: 'Hapus Postingan' },
  { value: 'CERTIFICATE_REVOKED', label: 'Cabut Sertifikat' },
];

const ACTION_LABELS: Record<AdminAuditAction, string> = {
  ROLE_UPDATED: 'Role Diubah',
  USER_STATUS_CHANGED: 'Status Akun',
  COURSE_PUBLISH_TOGGLED: 'Publikasi Kursus',
  COMMUNITY_POST_DELETED: 'Hapus Postingan',
  CERTIFICATE_REVOKED: 'Cabut Sertifikat',
};

const ACTION_TONES: Record<AdminAuditAction, 'blue' | 'amber' | 'emerald' | 'rose'> = {
  ROLE_UPDATED: 'blue',
  USER_STATUS_CHANGED: 'amber',
  COURSE_PUBLISH_TOGGLED: 'emerald',
  COMMUNITY_POST_DELETED: 'rose',
  CERTIFICATE_REVOKED: 'rose',
};

export function AdminAuditLogPanel({ logs, onExportCsv }: AdminAuditLogPanelProps) {
  const [actionFilter, setActionFilter] = useState<'ALL' | AdminAuditAction>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
      if (q) {
        return (
          log.actorName.toLowerCase().includes(q) ||
          log.targetLabel.toLowerCase().includes(q) ||
          log.detail.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, actionFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / AUDIT_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedLogs = filteredLogs.slice(
    (safePage - 1) * AUDIT_PAGE_SIZE,
    safePage * AUDIT_PAGE_SIZE
  );

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

      <div className="px-6 py-3 border-b border-[#E5E3DC] dark:border-slate-800 bg-[#FAFAF9] dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap gap-1.5">
          {ACTION_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setActionFilter(item.value);
                setPage(1);
              }}
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
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari aktor atau target..."
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-[#E5E3DC] dark:border-slate-700 rounded-lg text-xs text-[#18181B] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          />
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="p-8 text-center text-sm text-[#71717A] dark:text-slate-400">
          Belum ada aktivitas perubahan yang sesuai dengan filter ini.
        </div>
      ) : (
        <>
          <div className="divide-y divide-[#E5E3DC] dark:divide-slate-800">
            {pagedLogs.map((log) => (
              <div
                key={log.id}
                className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={ACTION_TONES[log.action] ?? 'slate'}>
                      {ACTION_LABELS[log.action] ?? log.action}
                    </Badge>
                    <span className="font-bold text-[#18181B] dark:text-white">
                      {log.targetLabel}
                    </span>
                  </div>
                  <p className="text-[#52525B] dark:text-slate-300">{log.detail}</p>
                </div>
                <div className="text-[#71717A] dark:text-slate-400 font-mono-tabular shrink-0">
                  {log.actorName} •{' '}
                  {new Date(log.timestamp).toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-[#E5E3DC] dark:border-slate-800 flex items-center justify-between text-xs text-[#71717A] dark:text-slate-400">
              <span>
                Halaman {safePage} dari {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Sebelumnya
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

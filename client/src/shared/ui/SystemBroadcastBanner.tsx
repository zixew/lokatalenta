import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Info, Megaphone, X } from 'lucide-react';
import { useState } from 'react';
import {
  dismissBroadcastId,
  getDismissedBroadcastIds,
  listActiveBroadcasts,
  type BroadcastSeverity,
} from '../../features/admin/systemBroadcast';
import type { UserRole } from '../types/lms';

function getSeverityStyles(severity: BroadcastSeverity): string {
  switch (severity) {
    case 'urgent':
      return 'bg-rose-600 text-white border-b border-rose-700';
    case 'warning':
      return 'bg-amber-50 dark:bg-amber-950/70 text-amber-950 dark:text-amber-100 border-b border-amber-200 dark:border-amber-800';
    case 'info':
    default:
      return 'bg-teal-50 dark:bg-teal-950/70 text-teal-950 dark:text-teal-100 border-b border-teal-200 dark:border-teal-800';
  }
}

function getSeverityIcon(severity: BroadcastSeverity) {
  switch (severity) {
    case 'urgent':
      return <Megaphone className="w-4 h-4 shrink-0" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />;
    case 'info':
    default:
      return <Info className="w-4 h-4 shrink-0 text-[#0F766E] dark:text-teal-400" />;
  }
}

export function SystemBroadcastBanner({ role }: { role?: UserRole | null }) {
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => getDismissedBroadcastIds());

  const { data: broadcasts = [] } = useQuery({
    queryKey: ['system-broadcasts-active', role ?? 'guest'],
    queryFn: () => listActiveBroadcasts(role ?? null),
    staleTime: 60_000,
  });

  const visibleBroadcasts = broadcasts.filter((item) => !dismissedIds.includes(item.id));
  if (visibleBroadcasts.length === 0) return null;

  return (
    <div className="print:hidden" role="region" aria-label="Pengumuman Global">
      {visibleBroadcasts.map((item) => (
        <div key={item.id} className={getSeverityStyles(item.severity)}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <span className="mt-0.5 sm:mt-0">{getSeverityIcon(item.severity)}</span>
              <p className="leading-snug">
                <span className="font-semibold">{item.title}:</span>{' '}
                <span className="opacity-95">{item.message}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDismissedIds(dismissBroadcastId(item.id))}
              aria-label={`Tutup pengumuman ${item.title}`}
              className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

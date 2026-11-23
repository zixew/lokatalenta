import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, FileCheck2, MessageSquare, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/useAuthStore';
import { lmsApi } from '../services/lmsApi';
import type { AppNotification } from '../types/lms';

export function NotificationBell() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => (user ? lmsApi.listNotifications(user.id) : Promise.resolve([])),
    enabled: Boolean(user),
    refetchInterval: 30000,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const markOneMut = useMutation({
    mutationFn: (id: string) => lmsApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const markAllMut = useMutation({
    mutationFn: () => (user ? lmsApi.markAllNotificationsRead(user.id) : Promise.resolve()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  if (!user) return null;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleItemClick = (n: AppNotification) => {
    if (!n.is_read) markOneMut.mutate(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const renderIcon = (type: AppNotification['type']) => {
    if (type === 'grade') return <FileCheck2 className="w-4 h-4 text-[#0F766E] shrink-0" />;
    if (type === 'comment') return <MessageSquare className="w-4 h-4 text-sky-600 shrink-0" />;
    return <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />;
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifikasi"
        aria-expanded={open}
        aria-haspopup="true"
        title="Notifikasi"
        className="relative p-2 rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#52525B] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-16 sm:inset-x-auto sm:absolute sm:right-0 sm:top-auto sm:mt-2 sm:w-96 rounded-2xl bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E5E3DC] dark:border-slate-800 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-[#18181B] dark:text-white">Notifikasi</p>
              <p className="text-[11px] text-[#71717A] dark:text-slate-400">
                {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllMut.mutate()}
                disabled={markAllMut.isPending}
                className="text-xs font-semibold text-[#0F766E] dark:text-teal-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tandai dibaca
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#F0EFEA] dark:divide-slate-800">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#71717A] dark:text-slate-400">
                Belum ada notifikasi saat ini.
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleItemClick(n)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#F6F5F1] dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${
                    !n.is_read ? 'bg-teal-50/40 dark:bg-teal-950/20' : ''
                  }`}
                >
                  <div className="mt-0.5">{renderIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[#18181B] dark:text-white truncate">
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#0F766E] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[#52525B] dark:text-slate-300 mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-[#71717A] dark:text-slate-500 mt-1">
                      {new Date(n.created_at).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

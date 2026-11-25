import { Award, CheckCircle2, X } from 'lucide-react';
import { useEffect } from 'react';

export interface MilestoneToastProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  variant?: 'lesson' | 'module';
  durationMs?: number;
  onClose: () => void;
}

export function MilestoneToast({
  visible,
  title,
  subtitle,
  variant = 'lesson',
  durationMs = 4500,
  onClose,
}: MilestoneToastProps) {
  useEffect(() => {
    if (!visible || durationMs <= 0) return;
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [visible, durationMs, onClose]);

  if (!visible) return null;

  const isModule = variant === 'module';

  return (
    <>
      <style>{`
        @keyframes milestoneToastIn {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      <div
        role="status"
        aria-live="polite"
        style={{ animation: 'milestoneToastIn 240ms cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        className={`fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100vw-2.5rem)] rounded-2xl border p-4 shadow-lg backdrop-blur-sm flex items-start gap-3 ${
          isModule
            ? 'bg-emerald-950/95 border-emerald-700 text-white'
            : 'bg-white/95 dark:bg-[#161B22]/95 border-[#D4D4CE] dark:border-[#282E3D] text-[#18181B] dark:text-white'
        }`}
      >
        <div
          className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${
            isModule
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400'
          }`}
        >
          {isModule ? <Award className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider opacity-80">
            {isModule ? 'Modul Tuntas!' : 'Materi Selesai'}
          </p>
          <p className="text-sm font-bold leading-snug mt-0.5 truncate">{title}</p>
          {subtitle && (
            <p
              className={`text-xs mt-1 leading-relaxed ${
                isModule ? 'text-emerald-200' : 'text-[#52525B] dark:text-slate-400'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup notifikasi"
          className={`p-1 rounded-lg transition-colors cursor-pointer ${
            isModule
              ? 'text-emerald-200 hover:bg-emerald-800/60'
              : 'text-[#71717A] hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}

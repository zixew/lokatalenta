import { useEffect, useId, useRef, type ReactNode } from 'react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';
import { Button } from './Button';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  tone = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const prevActive = document.activeElement as HTMLElement | null;
    const focusSelector = tone === 'danger' ? '[data-confirm-cancel]' : '[data-confirm-action]';
    const target = dialogRef.current?.querySelector<HTMLButtonElement>(focusSelector);
    target?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      prevActive?.focus?.();
    };
  }, [open, tone, onCancel]);

  if (!open) return null;

  const isDanger = tone === 'danger';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="relative w-full max-w-md rounded-lg bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] shadow-xl p-6 text-[#18181B] dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150 ease-out"
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Tutup dialog"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#71717A] dark:text-slate-400 hover:bg-[#F4F4F5] dark:hover:bg-slate-800 hover:text-[#18181B] dark:hover:text-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <div
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
              isDanger
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                : 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400 border border-teal-200 dark:border-teal-900'
            }`}
          >
            {isDanger ? <AlertTriangle className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
          </div>

          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-semibold leading-snug">
              {title}
            </h2>
            {description && (
              <div
                id={descId}
                className="mt-1.5 text-sm text-[#52525B] dark:text-slate-300 leading-relaxed"
              >
                {description}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <Button data-confirm-cancel type="button" variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            data-confirm-action
            type="button"
            variant={isDanger ? 'danger' : 'primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

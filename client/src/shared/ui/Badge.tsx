import type { ReactNode } from 'react';

interface BadgeProps {
  tone?: 'slate' | 'blue' | 'emerald' | 'amber' | 'rose';
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'slate', children, className = '' }: BadgeProps) {
  const tones: Record<NonNullable<BadgeProps['tone']>, string> = {
    slate:
      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    blue: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    emerald:
      'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    amber:
      'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    rose: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

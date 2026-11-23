interface ProgressBarProps {
  value: number;
  tone?: 'blue' | 'emerald' | 'amber' | 'rose';
  className?: string;
}

export function ProgressBar({ value, tone = 'blue', className = '' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const barColors: Record<NonNullable<ProgressBarProps['tone']>, string> = {
    blue: 'bg-[#0F766E]',
    emerald: 'bg-[#059669]',
    amber: 'bg-[#D97706]',
    rose: 'bg-[#E11D48]',
  };

  return (
    <div
      className={`w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden ${className}`}
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ${barColors[tone]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

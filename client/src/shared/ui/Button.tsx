import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2';

  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-[#0F766E] text-white hover:bg-[#115E59] shadow-xs',
    secondary:
      'bg-white dark:bg-[#161B22] text-[#18181B] dark:text-slate-100 border border-[#E5E3DC] dark:border-slate-700 hover:bg-[#F6F5F1] dark:hover:bg-slate-800',
    ghost:
      'bg-transparent text-[#52525B] dark:text-slate-300 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 hover:text-[#18181B] dark:hover:text-white',
    danger: 'bg-[#E11D48] text-white hover:bg-[#BE123C]',
    amber:
      'bg-[#FEF3C7] dark:bg-amber-950/60 text-[#92400E] dark:text-amber-300 border border-[#FDE68A] dark:border-amber-800 hover:bg-[#FDE68A]',
  };

  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-sm px-5 py-3 font-semibold',
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

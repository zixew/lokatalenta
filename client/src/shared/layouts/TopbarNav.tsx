import {
  BookOpen,
  ChevronDown,
  GraduationCap,
  ShieldCheck,
  Timer,
  Trophy,
  User,
  Users,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { UserRole } from '../types/lms';

export interface TopbarNavItem {
  to: string;
  label: string;
  icon: ReactNode;
  priority: 'primary' | 'overflow';
}

interface TopbarNavProps {
  role?: UserRole;
  isLoggedIn: boolean;
  isActive: (path: string) => boolean;
}

function buildTopbarNavItems(
  isLoggedIn: boolean,
  role?: UserRole
): TopbarNavItem[] {
  const items: TopbarNavItem[] = [
    {
      to: '/',
      label: 'Katalog',
      icon: <BookOpen className="w-4 h-4 shrink-0" />,
      priority: 'primary',
    },
    {
      to: '/kraepelin',
      label: 'Tes Kraepelin',
      icon: <Timer className="w-4 h-4 shrink-0" />,
      priority: 'primary',
    },
    {
      to: '/tryout',
      label: 'Tryout Akbar',
      icon: <Trophy className="w-4 h-4 shrink-0" />,
      priority: 'primary',
    },
    {
      to: '/community',
      label: 'Komunitas',
      icon: <Users className="w-4 h-4 shrink-0" />,
      priority: 'primary',
    },
  ];

  if (isLoggedIn) {
    items.push({
      to: '/profile',
      label: 'Profil & Progres',
      icon: <User className="w-4 h-4 shrink-0" />,
      priority: 'overflow',
    });
  }

  if (role === 'teacher' || role === 'admin') {
    items.push({
      to: '/teacher',
      label: 'Teacher Studio',
      icon: <GraduationCap className="w-4 h-4 shrink-0" />,
      priority: 'overflow',
    });
  }

  if (role === 'admin') {
    items.push({
      to: '/admin',
      label: 'Admin Panel',
      icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
      priority: 'overflow',
    });
  }

  return items;
}

export function TopbarNav({ role, isLoggedIn, isActive }: TopbarNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allItems = buildTopbarNavItems(isLoggedIn, role);
  const primaryItems = allItems.filter((item) => item.priority === 'primary');
  const overflowItems = allItems.filter((item) => item.priority === 'overflow');
  const hasActiveOverflow = overflowItems.some((item) => isActive(item.to));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="hidden lg:flex items-center gap-1 min-w-0" aria-label="Navigasi utama">
      {primaryItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={`px-2.5 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
            isActive(item.to)
              ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400'
              : 'text-[#52525B] dark:text-slate-300 hover:text-[#18181B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}

      {overflowItems.length > 0 && (
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            className={`px-2.5 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
              hasActiveOverflow
                ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400'
                : 'text-[#52525B] dark:text-slate-300 hover:text-[#18181B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Lainnya
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {moreOpen && (
            <div className="absolute left-0 mt-1.5 w-52 bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-xl shadow-lg py-1.5 z-50">
              {overflowItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={`mx-1.5 px-3 py-2 rounded-lg text-[13px] font-medium flex items-center gap-2.5 transition-colors ${
                    isActive(item.to)
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400'
                      : 'text-[#52525B] dark:text-slate-300 hover:text-[#18181B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

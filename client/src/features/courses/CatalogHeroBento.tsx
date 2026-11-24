import { ArrowRight, Flame, Keyboard, Play, Sparkles, Trophy, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../shared/ui/Button';

export interface CatalogHeroBentoProps {
  userName?: string;
  isLoggedIn: boolean;
  earnedToday: number;
  xpTarget: number;
  totalCourses: number;
  isLoading?: boolean;
  primaryCourseSlug?: string;
  onOpenTarget: (e: React.MouseEvent, targetUrl: string) => void;
}

const QUICK_LAUNCH_PILLS = [
  {
    to: '/kraepelin',
    label: 'Kraepelin / Pauli',
    icon: Zap,
    accent: 'text-amber-600 dark:text-amber-400',
  },
  {
    to: '/typing',
    label: 'Tes Mengetik',
    icon: Keyboard,
    accent: 'text-[#0F766E] dark:text-teal-400',
  },
  {
    to: '/tryout',
    label: 'Tryout Akbar',
    icon: Trophy,
    accent: 'text-indigo-600 dark:text-indigo-400',
  },
] as const;

export function CatalogHeroBento({
  userName,
  isLoggedIn,
  earnedToday,
  xpTarget,
  totalCourses,
  isLoading = false,
  primaryCourseSlug,
  onOpenTarget,
}: CatalogHeroBentoProps) {
  const safeTarget = Math.max(1, xpTarget);
  const progressRatio = Math.min(1, Math.max(0, earnedToday / safeTarget));
  const progressPct = Math.round(progressRatio * 100);
  const remainingXp = Math.max(0, safeTarget - earnedToday);

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <section className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center shadow-xs">
      {/* Left Column: Editorial Headline + Quick-Launch Pills */}
      <div className="lg:col-span-7 space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F6F5F1] dark:bg-slate-800 border border-[#E5E3DC] dark:border-slate-700 text-xs font-semibold text-[#0F766E] dark:text-teal-400">
          <Sparkles className="w-3.5 h-3.5" />
          {isLoggedIn && userName
            ? `Selamat datang kembali, ${userName.split(' ')[0]}`
            : 'LokaTalenta • Akademi Bahasa, Karier & Komunitas'}
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#18181B] dark:text-white leading-tight tracking-tight">
          Bangun Kompetensi Bahasa Asing &amp; Kesiapan Seleksi Kerja secara Terstruktur.
        </h1>

        <p className="text-sm sm:text-base text-[#52525B] dark:text-slate-300 leading-relaxed max-w-2xl">
          Pelajari kurikulum bertahap dari nol hingga mahir dengan{' '}
          <strong className="text-[#18181B] dark:text-white">20+ modul bahasa</strong>, latihan
          aksara &amp; pelafalan,{' '}
          <strong className="text-[#18181B] dark:text-white">simulasi psikotes</strong>, serta
          bimbingan langsung bersama mentor.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {primaryCourseSlug && (
            <Link
              to={`/courses/${primaryCourseSlug}`}
              onClick={(e) => onOpenTarget(e, `/courses/${primaryCourseSlug}`)}
            >
              <Button size="lg">
                <Play className="w-4 h-4" />
                {isLoggedIn ? 'Lanjutkan Belajar' : 'Gabung & Mulai Belajar'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
          <a href="#katalog">
            <Button variant="secondary" size="lg">
              {isLoading ? 'Jelajahi Program' : `Jelajahi ${totalCourses}+ Program`}
            </Button>
          </a>
        </div>

        {/* Quick-Launch Pills */}
        <div className="pt-2 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#71717A] dark:text-slate-400">
            Akses Cepat Simulasi &amp; Event
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_LAUNCH_PILLS.map((pill) => {
              const Icon = pill.icon;
              return (
                <Link
                  key={pill.to}
                  to={pill.to}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-700 text-xs font-semibold text-[#18181B] dark:text-slate-200 hover:border-[#0F766E]/60 dark:hover:border-teal-500/60 hover:-translate-y-0.5 transition-all"
                >
                  <Icon className={`w-3.5 h-3.5 ${pill.accent}`} />
                  {pill.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Bento XP Ring + Pillars */}
      <div className="lg:col-span-5 space-y-3">
        {/* Daily XP Progress Ring Card */}
        <div className="bg-[#F6F5F1] dark:bg-slate-900/80 border border-[#E5E3DC] dark:border-slate-800 rounded-xl p-5 flex items-center gap-5">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-[#E5E3DC] dark:text-slate-800"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="text-[#0F766E] dark:text-teal-400 transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-extrabold font-mono-tabular text-[#18181B] dark:text-white leading-none">
                {progressPct}%
              </span>
              <span className="text-[10px] font-semibold text-[#71717A] dark:text-slate-400 mt-0.5">
                XP Hari Ini
              </span>
            </div>
          </div>

          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] dark:text-teal-400">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Target Belajar Harian
            </div>
            <p className="text-xl font-extrabold font-mono-tabular text-[#18181B] dark:text-white">
              {earnedToday}{' '}
              <span className="text-xs font-semibold text-[#71717A] dark:text-slate-400">
                / {xpTarget} XP
              </span>
            </p>
            <p className="text-xs text-[#52525B] dark:text-slate-400">
              {earnedToday >= xpTarget
                ? 'Target harian tercapai! Pertahankan konsistensi Anda.'
                : isLoggedIn
                  ? `Butuh ${remainingXp} XP lagi untuk mencapai target hari ini.`
                  : 'Masuk untuk melacak XP harian & progres modul Anda.'}
            </p>
          </div>
        </div>

        {/* 4 Learning Pillars Mini-Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Bahasa Jepang & Korea', desc: 'Aksara & Percakapan' },
            { label: 'Bahasa Inggris Karier', desc: 'Grammar & Bisnis' },
            { label: 'Simulasi Psikotes', desc: 'Numerik, Deret & Logika' },
            { label: 'Mentoring & Tugas', desc: 'Sesi Live & Rubrik' },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-[#F6F5F1] dark:bg-slate-900/60 border border-[#E5E3DC] dark:border-slate-800 rounded-xl p-3 space-y-0.5"
            >
              <p className="text-xs font-bold text-[#18181B] dark:text-white leading-snug">
                {item.label}
              </p>
              <p className="text-[11px] text-[#71717A] dark:text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

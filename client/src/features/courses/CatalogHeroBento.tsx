import { ArrowRight, Keyboard, Play, Shield, Trophy, Zap } from 'lucide-react';
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

const QUICK_LAUNCH_INSTRUMENTS = [
  {
    to: '/kraepelin',
    label: 'Tes Kraepelin / Pauli',
    tag: 'Fokus & Kecepatan',
    icon: Zap,
  },
  {
    to: '/typing',
    label: 'Uji Kecepatan Mengetik',
    tag: 'WPM & Akurasi',
    icon: Keyboard,
  },
  {
    to: '/tryout',
    label: 'Tryout Seleksi Akbar',
    tag: 'Simulasi Nasional',
    icon: Trophy,
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

  return (
    <section className="bg-white dark:bg-[#151821] border border-[#D4D4CE] dark:border-[#282E3D] rounded-lg p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center shadow-xs">
      {/* Left Column: Editorial Headline + Action Bar */}
      <div className="lg:col-span-7 space-y-4">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#E8E8E3] dark:bg-[#1B1F2B] border border-[#D4D4CE] dark:border-[#282E3D] text-xs font-semibold text-[#0F766E] dark:text-[#14B8A6]">
          <Shield className="w-3.5 h-3.5" />
          {isLoggedIn && userName
            ? `Personel Aktif: ${userName.split(' ')[0]}`
            : 'LokaTalenta LMS • Industrial Learning Workbench'}
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0F1216] dark:text-[#F1F5F9] leading-tight tracking-tight">
          Pusat Pembelajaran Kompetensi Bahasa &amp; Asesmen Kesiapan Karier.
        </h1>

        <p className="text-sm text-[#545C6E] dark:text-[#8892A6] leading-relaxed max-w-2xl">
          Kurikulum terstruktur berbasis kompetensi industri dengan{' '}
          <strong className="text-[#0F1216] dark:text-[#F1F5F9]">20+ modul bahasa aktif</strong>, latihan
          aksara interaktif,{' '}
          <strong className="text-[#0F1216] dark:text-[#F1F5F9]">simulasi psikotes objektif</strong>, serta
          100% bebas biaya tanpa paywall.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {primaryCourseSlug && (
            <Link
              to={`/courses/${primaryCourseSlug}`}
              onClick={(e) => onOpenTarget(e, `/courses/${primaryCourseSlug}`)}
            >
              <Button size="lg" className="rounded-md">
                <Play className="w-4 h-4" />
                {isLoggedIn ? 'Lanjutkan Modul' : 'Mulai Belajar Sekarang'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
          <a href="#katalog">
            <Button variant="secondary" size="lg" className="rounded-md">
              {isLoading ? 'Memuat Program...' : `Katalog (${totalCourses} Program)`}
            </Button>
          </a>
        </div>

        {/* Quick-Launch Instruments */}
        <div className="pt-3 border-t border-[#D4D4CE] dark:border-[#282E3D] space-y-2">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#545C6E] dark:text-[#8892A6]">
            Instrumen Simulasi Cepat
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {QUICK_LAUNCH_INSTRUMENTS.map((inst) => {
              const Icon = inst.icon;
              return (
                <Link
                  key={inst.to}
                  to={inst.to}
                  className="flex items-center gap-2.5 p-2 rounded-md bg-[#F3F3F0] dark:bg-[#1B1F2B] border border-[#D4D4CE] dark:border-[#282E3D] hover:border-[#0F766E] dark:hover:border-[#14B8A6] transition-colors"
                >
                  <div className="w-7 h-7 shrink-0 rounded bg-white dark:bg-[#151821] border border-[#D4D4CE] dark:border-[#282E3D] flex items-center justify-center text-[#0F766E] dark:text-[#14B8A6]">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#0F1216] dark:text-[#F1F5F9] truncate">
                      {inst.label}
                    </p>
                    <p className="text-[10px] text-[#545C6E] dark:text-[#8892A6] font-mono">
                      {inst.tag}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Tactical KPI Metric Cards */}
      <div className="lg:col-span-5 space-y-3">
        {/* Daily XP Target Meter */}
        <div className="bg-[#F3F3F0] dark:bg-[#1B1F2B] border border-[#D4D4CE] dark:border-[#282E3D] rounded-md p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#545C6E] dark:text-[#8892A6]">
              Target Pembelajaran Harian
            </span>
            <span className="font-mono-tabular text-sm font-bold text-[#0F766E] dark:text-[#14B8A6]">
              {progressPct}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded bg-[#D4D4CE] dark:bg-[#282E3D] overflow-hidden">
            <div
              className="h-full bg-[#0F766E] dark:bg-[#14B8A6] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-2 mt-2.5 text-xs text-[#545C6E] dark:text-[#8892A6]">
            <span className="font-mono-tabular">
              {earnedToday} / {safeTarget} XP
            </span>
            <span className="text-[11px]">
              {remainingXp === 0 ? '✓ Target tercapai hari ini' : `Sisa ${remainingXp} XP lagi`}
            </span>
          </div>
        </div>

        {/* Telemetry Stat Strip */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-md bg-[#F3F3F0] dark:bg-[#1B1F2B] border border-[#D4D4CE] dark:border-[#282E3D]">
            <span className="text-[10px] font-mono uppercase text-[#545C6E] dark:text-[#8892A6] block">
              Kurikulum Aktif
            </span>
            <span className="font-mono-tabular text-lg font-bold text-[#0F1216] dark:text-[#F1F5F9]">
              {totalCourses} Modul
            </span>
            <span className="text-[10px] text-[#059669] dark:text-[#10B981] font-mono block mt-0.5">
              ● Siap Ditempuh
            </span>
          </div>
          <div className="p-3 rounded-md bg-[#F3F3F0] dark:bg-[#1B1F2B] border border-[#D4D4CE] dark:border-[#282E3D]">
            <span className="text-[10px] font-mono uppercase text-[#545C6E] dark:text-[#8892A6] block">
              Standar Integritas
            </span>
            <span className="font-mono-tabular text-lg font-bold text-[#0F1216] dark:text-[#F1F5F9]">
              100% Free
            </span>
            <span className="text-[10px] text-[#0F766E] dark:text-[#14B8A6] font-mono block mt-0.5">
              ● Tanpa Paywall
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

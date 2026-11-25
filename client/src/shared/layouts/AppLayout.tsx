import {
  BookOpen,
  GraduationCap,
  Keyboard,
  LogOut,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  Timer,
  Trophy,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import pkg from '../../../package.json';
import { useAuthStore } from '../../features/auth/useAuthStore';
import { useThemeStore } from '../stores/useThemeStore';
import { Badge } from '../ui/Badge';
import { BrandLogo } from '../ui/BrandLogo';
import { Button } from '../ui/Button';
import { TopbarNav } from './TopbarNav';
import { NotificationBell } from '../ui/NotificationBell';
import { SystemBroadcastBanner } from '../ui/SystemBroadcastBanner';

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen overflow-x-hidden flex flex-col bg-[#F3F3F0] dark:bg-[#0E1015] text-[#0F1216] dark:text-[#F1F5F9] transition-colors">
      <SystemBroadcastBanner role={user?.role} />
      <header className="sticky top-0 z-30 bg-white dark:bg-[#151821] border-b border-[#D4D4CE] dark:border-[#282E3D] print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Brand + Desktop Nav */}
          <div className="flex items-center gap-4 xl:gap-7 min-w-0 flex-1">
            <Link
              to={
                user?.role === 'admin'
                  ? '/admin'
                  : user?.role === 'teacher'
                    ? '/teacher'
                    : '/'
              }
              className="flex items-center gap-2.5 shrink-0"
            >
              <BrandLogo className="w-8 h-8 shrink-0" />
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-[#0F1216] dark:text-[#F1F5F9] block">
                    LokaTalenta
                  </span>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/30">
                    v{pkg.version}
                  </span>
                </div>
                <span className="text-[10px] text-[#545C6E] dark:text-[#8892A6] font-medium hidden xl:block">
                  Industrial Precision Workbench
                </span>
              </div>
            </Link>

            <TopbarNav role={user?.role} isLoggedIn={Boolean(user)} isActive={isActive} />
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Notifications (non-admin) */}
            {user?.role !== 'admin' && <NotificationBell />}

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Ganti tema terang atau gelap"
              title={theme === 'light' ? 'Aktifkan Mode Gelap' : 'Aktifkan Mode Terang'}
              className="p-2 rounded-lg border border-[#D4D4CE] dark:border-[#282E3D] bg-white dark:bg-slate-800 text-[#52525B] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-[#282E3D]">
                {user.role === 'admin' ? (
                  <div className="hidden sm:block text-right leading-tight">
                    <p className="text-sm font-semibold text-[#18181B] dark:text-white max-w-[140px] truncate">
                      {user.full_name}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <Badge tone="amber">
                        <UserCheck className="w-3 h-3" />
                        Admin
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <Link
                    to="/profile"
                    className="hidden sm:block text-right leading-tight hover:opacity-80 transition-opacity"
                  >
                    <p className="text-sm font-semibold text-[#18181B] dark:text-white max-w-[140px] truncate">
                      {user.full_name}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <Badge tone={user.role === 'teacher' ? 'blue' : 'emerald'}>
                        <UserCheck className="w-3 h-3" />
                        {user.role === 'student' ? 'Pelajar' : 'Mentor'}
                      </Badge>
                    </div>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await signOut(false);
                    navigate('/auth');
                  }}
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button size="sm">Masuk</Button>
              </Link>
            )}

            {/* Mobile/Tablet Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Menu navigasi"
              className="lg:hidden p-2 rounded-lg border border-[#D4D4CE] dark:border-[#282E3D] text-[#18181B] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile/Tablet Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#D4D4CE] dark:border-[#282E3D] bg-white dark:bg-[#161B22] px-4 py-4 space-y-3">
            <nav className="flex flex-col gap-1">
              {user?.role === 'admin' ? (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    isActive('/admin')
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400'
                      : 'text-[#52525B] dark:text-slate-300'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin Dashboard
                </Link>
              ) : user?.role === 'teacher' ? (
                <>
                  <Link
                    to="/teacher"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                      isActive('/teacher')
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400'
                        : 'text-[#52525B] dark:text-slate-300'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    Mentor Studio
                  </Link>
                  <Link
                    to="/community"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                      isActive('/community')
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400'
                        : 'text-[#52525B] dark:text-slate-300'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Komunitas
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                      isActive('/profile')
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400'
                        : 'text-[#52525B] dark:text-slate-300'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Profil Mentor
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                      isActive('/')
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400'
                        : 'text-[#52525B] dark:text-slate-300'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Katalog
                  </Link>
                  <Link
                    to="/kraepelin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                      isActive('/kraepelin')
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400'
                        : 'text-[#52525B] dark:text-slate-300'
                    }`}
                  >
                    <Timer className="w-4 h-4" />
                    Tes Kraepelin
                  </Link>

                  <Link
                    to="/typing"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                      isActive('/typing')
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400'
                        : 'text-[#52525B] dark:text-slate-300'
                    }`}
                  >
                    <Keyboard className="w-4 h-4" />
                    Tes Mengetik
                  </Link>

                  <Link
                    to="/tryout"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                      isActive('/tryout')
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400'
                        : 'text-[#52525B] dark:text-slate-300'
                    }`}
                  >
                    <Trophy className="w-4 h-4" />
                    Tryout Akbar
                  </Link>

                  <Link
                    to="/community"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                      isActive('/community')
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400'
                        : 'text-[#52525B] dark:text-slate-300'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Komunitas
                  </Link>
                  {user && (
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                        isActive('/profile')
                          ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400'
                          : 'text-[#52525B] dark:text-slate-300'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      Profil &amp; Progres
                    </Link>
                  )}
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[#D4D4CE] dark:border-[#282E3D] bg-white dark:bg-[#151821] py-5 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#545C6E] dark:text-[#8892A6]">
          <p>
            LokaTalenta <span className="font-mono-tabular font-semibold">v{pkg.version}</span> — Industrial Precision Learning Workbench
          </p>
          <div className="flex items-center gap-2">
            <Badge tone="emerald">PWA Ready</Badge>
            <span className="font-mono text-[11px] text-[#059669] dark:text-[#10B981]">100% Zero-Paywall Access</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

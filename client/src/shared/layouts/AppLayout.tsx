import {
  BookOpen,
  GraduationCap,
  LogOut,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
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
import { NotificationBell } from '../ui/NotificationBell';

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen overflow-x-hidden flex flex-col bg-[#F6F5F1] dark:bg-[#0D1117] text-[#18181B] dark:text-slate-100 transition-colors">
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#161B22]/95 backdrop-blur border-b border-[#E5E3DC] dark:border-slate-800 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand + Desktop Nav */}
          <div className="flex items-center gap-6 lg:gap-8 min-w-0">
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <BrandLogo className="w-9 h-9 shrink-0" />
              <div className="leading-tight">
                <span className="font-bold text-base tracking-tight text-[#18181B] dark:text-white block">
                  LokaTalenta
                </span>
                <span className="text-[11px] text-[#71717A] dark:text-slate-400 font-medium hidden sm:block">
                  Akademi Bahasa &amp; Karier
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              <Link
                to="/"
                className={`px-2.5 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive('/')
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400'
                    : 'text-[#52525B] dark:text-slate-300 hover:text-[#18181B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                Katalog
              </Link>

              <Link
                to="/kraepelin"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-2.5 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive('/kraepelin')
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400'
                    : 'text-[#52525B] dark:text-slate-300 hover:text-[#18181B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Tes Kraepelin
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
                Tryout Akbar
              </Link>

              <Link
                to="/tryout"
                className={`px-2.5 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive('/tryout')
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400'
                    : 'text-[#52525B] dark:text-slate-300 hover:text-[#18181B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Tryout Akbar
              </Link>

              <Link
                to="/community"
                className={`px-2.5 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive('/community')
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400'
                    : 'text-[#52525B] dark:text-slate-300 hover:text-[#18181B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                Komunitas
              </Link>

              {(user?.role === 'teacher' || user?.role === 'admin') && (
                <Link
                  to="/teacher"
                  className={`px-2.5 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isActive('/teacher')
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400'
                      : 'text-[#52525B] dark:text-slate-300 hover:text-[#18181B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  Teacher Studio
                </Link>
              )}

              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`px-2.5 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isActive('/admin')
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400'
                      : 'text-[#52525B] dark:text-slate-300 hover:text-[#18181B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  Admin Panel
                </Link>
              )}

              {user && (
                <Link
                  to="/profile"
                  className={`px-2.5 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isActive('/profile')
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400'
                      : 'text-[#52525B] dark:text-slate-300 hover:text-[#18181B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  Profil &amp; Progres
                </Link>
              )}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Notifications */}
            <NotificationBell />

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Ganti tema terang atau gelap"
              title={theme === 'light' ? 'Aktifkan Mode Gelap' : 'Aktifkan Mode Terang'}
              className="p-2 rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#52525B] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <Link
                  to="/profile"
                  className="hidden sm:block text-right leading-tight hover:opacity-80 transition-opacity"
                >
                  <p className="text-sm font-semibold text-[#18181B] dark:text-white">
                    {user.full_name}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <Badge
                      tone={
                        user.role === 'admin'
                          ? 'amber'
                          : user.role === 'teacher'
                          ? 'blue'
                          : 'emerald'
                      }
                    >
                      <UserCheck className="w-3 h-3" />
                      {user.role === 'student'
                        ? 'Pelajar'
                        : user.role === 'teacher'
                        ? 'Pengajar'
                        : 'Admin'}
                    </Badge>
                  </div>
                </Link>
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
              className="lg:hidden p-2 rounded-lg border border-[#E5E3DC] dark:border-slate-700 text-[#18181B] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile/Tablet Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E5E3DC] dark:border-slate-800 bg-white dark:bg-[#161B22] px-4 py-4 space-y-3">
            <nav className="flex flex-col gap-1">
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
                Beranda &amp; Katalog
              </Link>
              <Link
                to="/kraepelin"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-2.5 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive('/kraepelin')
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400'
                    : 'text-[#52525B] dark:text-slate-300 hover:text-[#18181B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Tes Kraepelin
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
                Tryout Akbar
              </Link>

              <Link
                to="/tryout"
                className={`px-2.5 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive('/tryout')
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400'
                    : 'text-[#52525B] dark:text-slate-300 hover:text-[#18181B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
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
              {(user?.role === 'teacher' || user?.role === 'admin') && (
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
                  Teacher Studio
                </Link>
              )}
              {user?.role === 'admin' && (
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
                  Admin Panel
                </Link>
              )}
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
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[#E5E3DC] dark:border-slate-800 bg-white dark:bg-[#161B22] py-6 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#71717A] dark:text-slate-400">
          <p>
            LokaTalenta <span className="font-mono-tabular">v{pkg.version}</span> — Akademi Bahasa, Asesmen &amp; Kesiapan Karier
          </p>
          <p>Belajar terstruktur dan ukur kesiapan Anda secara objektif.</p>
        </div>
      </footer>
    </div>
  );
}

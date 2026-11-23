import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/ui/Button';
import { useAuthStore } from './useAuthStore';

export function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    signIn,
    signUp,
    sessionExpired,
    sessionDisplaced,
    clearSessionExpired,
    clearSessionDisplaced,
  } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isRegister) {
        await signUp(fullName, email, password);
      } else {
        await signIn(email, password);
      }
      clearSessionExpired();
      clearSessionDisplaced();
      const role = useAuthStore.getState().user?.role;
      if (role === 'teacher') navigate('/teacher');
      else if (role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat masuk ke akun.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#18181B] dark:text-white">
              {isRegister ? 'Gabung ke LokaTalenta' : 'Masuk ke LokaTalenta'}
            </h1>
            <p className="text-sm text-[#52525B] dark:text-slate-400 mt-1">
              {isRegister
                ? 'Daftar dengan email aktif Anda untuk mulai belajar dan simulasi tes.'
                : 'Lanjutkan kursus, latihan soal, dan ringkasan hasil Anda.'}
            </p>
          </div>

          {sessionExpired && (
            <div className="mb-4 p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm">
              Sesi anda telah habis.
            </div>
          )}

          {sessionDisplaced && (
            <div className="mb-4 p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm">
              Akun Anda telah masuk di perangkat atau sesi lain, sehingga sesi ini otomatis keluar.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label
                  htmlFor="auth-fullname"
                  className="block text-xs font-semibold text-[#18181B] dark:text-slate-200 mb-1.5"
                >
                  Nama Lengkap
                </label>
                <input
                  id="auth-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Nadia Kusuma"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#18181B] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-semibold text-[#18181B] dark:text-slate-200 mb-1.5"
              >
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#18181B] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-semibold text-[#18181B] dark:text-slate-200 mb-1.5"
              >
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#18181B] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? 'Memproses...' : isRegister ? 'Daftar Sekarang' : 'Masuk'}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E5E3DC] dark:border-slate-800 text-center text-sm text-[#52525B] dark:text-slate-400">
            {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
            <button
              type="button"
              onClick={() => {
                setError('');
                setPassword('');
                setIsRegister(!isRegister);
              }}
              className="text-[#0F766E] dark:text-teal-400 font-semibold hover:underline cursor-pointer"
            >
              {isRegister ? 'Masuk di sini' : 'Gabung Sekarang'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/ui/Button';
import { useAuthStore } from './useAuthStore';

export function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [devOtpPreview, setDevOtpPreview] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    signIn,
    requestSignUpOtp,
    verifyAndSignUp,
    sessionExpired,
    sessionDisplaced,
    clearSessionExpired,
    clearSessionDisplaced,
  } = useAuthStore();
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await requestSignUpOtp(email);
      setOtpSent(true);
      setDevOtpPreview(res.devOtpPreview);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim kode OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister && !otpSent) {
      await handleSendOtp();
      return;
    }

    setSubmitting(true);
    try {
      if (isRegister) {
        await verifyAndSignUp(fullName, email, password, otpCode);
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
                ? 'Verifikasi email Anda dengan kode OTP untuk mulai belajar.'
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
                <label className="block text-xs font-semibold text-[#18181B] dark:text-slate-200 mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  disabled={otpSent}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Nadia Kusuma"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#18181B] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F766E] disabled:opacity-60"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#18181B] dark:text-slate-200 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                disabled={isRegister && otpSent}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#18181B] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F766E] disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#18181B] dark:text-slate-200 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                disabled={isRegister && otpSent}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#18181B] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F766E] disabled:opacity-60"
              />
            </div>

            {isRegister && otpSent && (
              <div className="p-4 rounded-xl bg-[#F6F5F1] dark:bg-slate-800/60 border border-[#E5E3DC] dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs font-semibold text-[#18181B] dark:text-slate-200">
                    Kode OTP (6 Digit)
                  </label>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={submitting}
                    className="text-xs font-semibold text-[#0F766E] dark:text-teal-400 hover:underline cursor-pointer"
                  >
                    Kirim Ulang OTP
                  </button>
                </div>
                <input
                  type="text"
                  required
                  maxLength={8}
                  inputMode="numeric"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="Masukkan kode OTP dari email"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono-tabular tracking-widest text-center text-[#18181B] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
                {devOtpPreview && (
                  <p className="text-[11px] text-[#0F766E] dark:text-teal-400">
                    Simulasi Email Lokal: Kode OTP verifikasi Anda adalah{' '}
                    <strong className="font-mono-tabular">{devOtpPreview}</strong>
                  </p>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting
                ? 'Memproses...'
                : !isRegister
                ? 'Masuk'
                : otpSent
                ? 'Verifikasi OTP & Daftar'
                : 'Kirim Kode OTP ke Email'}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E5E3DC] dark:border-slate-800 text-center text-sm text-[#52525B] dark:text-slate-400">
            {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
            <button
              type="button"
              onClick={() => {
                setError('');
                setPassword('');
                setOtpSent(false);
                setOtpCode('');
                setDevOtpPreview(undefined);
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

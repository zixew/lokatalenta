import { useQuery } from '@tanstack/react-query';
import { Award, CheckCircle2, Search, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { lmsApi } from '../../shared/services/lmsApi';
import { Badge } from '../../shared/ui/Badge';
import { BrandLogo } from '../../shared/ui/BrandLogo';
import { Button } from '../../shared/ui/Button';

export function VerifyCertificatePage() {
  const { certCode = '' } = useParams<{ certCode?: string }>();
  const navigate = useNavigate();
  const [inputCode, setInputCode] = useState(certCode);

  const { data: cert, isLoading } = useQuery({
    queryKey: ['verify-certificate', certCode],
    queryFn: () => lmsApi.verifyCertificate(certCode),
    enabled: Boolean(certCode.trim()),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      navigate(`/verify/${encodeURIComponent(inputCode.trim().toUpperCase())}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <BrandLogo className="w-10 h-10 shrink-0" />
          <div>
            <h1 className="text-xl font-bold text-[#18181B] dark:text-white">
              Verifikasi Sertifikat LokaTalenta
            </h1>
            <p className="text-xs text-[#71717A] dark:text-slate-400">
              Periksa keaslian nomor sertifikat kelulusan peserta secara publik.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Masukkan nomor sertifikat (contoh: LT-XXXX-XXXX-2026)"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-[#F6F5F1] dark:bg-slate-900 text-sm text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
          </div>
          <Button type="submit">Verifikasi</Button>
        </form>

        {certCode.trim() && (
          <div className="pt-2">
            {isLoading ? (
              <div className="h-32 rounded-xl bg-[#F6F5F1] dark:bg-slate-800 animate-pulse" />
            ) : cert ? (
              <div className="p-5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge tone="emerald">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Sertifikat Asli &amp; Terverifikasi
                  </Badge>
                  <span className="font-mono-tabular text-xs font-bold text-[#18181B] dark:text-white">
                    {cert.cert_code}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#71717A] dark:text-slate-400 block">Nama Penerima</span>
                    <span className="text-sm font-bold text-[#18181B] dark:text-white">
                      {cert.student_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#71717A] dark:text-slate-400 block">Program / Kursus</span>
                    <span className="text-sm font-bold text-[#18181B] dark:text-white">
                      {cert.course_title}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#71717A] dark:text-slate-400 block">Pengajar</span>
                    <span className="font-semibold text-[#18181B] dark:text-slate-200">
                      {cert.teacher_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#71717A] dark:text-slate-400 block">Diterbitkan pada</span>
                    <span className="font-semibold text-[#18181B] dark:text-slate-200">
                      {new Date(cert.issued_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-rose-800 dark:text-rose-300">
                    Sertifikat Tidak Ditemukan
                  </p>
                  <p className="text-rose-700 dark:text-rose-200">
                    Nomor sertifikat <strong>{certCode}</strong> tidak terdaftar dalam sistem LokaTalenta. Pastikan penulisan kode sudah benar.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-[#E5E3DC] dark:border-slate-800 flex items-center justify-between text-xs text-[#71717A] dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#0F766E]" />
            LokaTalenta Credential Verification
          </span>
          <Link to="/" className="text-[#0F766E] dark:text-teal-400 font-semibold hover:underline">
            Kembali ke Katalog
          </Link>
        </div>
      </div>
    </div>
  );
}

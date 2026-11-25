import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Award,
  Check,
  Copy,
  Printer,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { CompetencyRadarCard } from './CompetencyRadarCard';
import { getTalentPassportAsync } from './talentApi';
import { computeTalentRadarMetrics } from './talentRadar';

export function TalentPassportPage() {
  const { userId } = useParams<{ userId: string }>();
  const [copied, setCopied] = useState(false);

  const { data: passport, isLoading } = useQuery({
    queryKey: ['talent-passport', userId],
    queryFn: () => (userId ? getTalentPassportAsync(userId) : Promise.resolve(null)),
    enabled: Boolean(userId),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center text-sm text-[#52525B] dark:text-slate-400">
        Memuat Talent Readiness Passport...
      </div>
    );
  }

  if (!passport) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-[#71717A]">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-[#18181B] dark:text-white">
          Talent Passport Tidak Tersedia
        </h1>
        <p className="text-sm text-[#52525B] dark:text-slate-400">
          Kandidat tidak ditemukan atau memilih menyembunyikan profil Talent Passport dari akses publik.
        </p>
        <Link to="/verify">
          <Button variant="secondary">Kembali ke Portal Verifikasi</Button>
        </Link>
      </div>
    );
  }

  const radar = computeTalentRadarMetrics({
    categoryScores: passport.category_scores,
    avgQuizScore: passport.avg_quiz_score,
    kraepelinSummary: passport.kraepelin,
    completedLessonsCount: passport.completed_lessons,
    certificatesCount: passport.certificates.length,
  });

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          to="/verify"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#52525B] dark:text-slate-300 hover:text-[#18181B] dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Portal Verifikasi
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleCopyUrl}>
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Link Disalin' : 'Salin Link Passport'}
          </Button>
          <Button variant="primary" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            Cetak / PDF
          </Button>
        </div>
      </div>

      {/* Candidate Identity Header */}
      <section className="bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] dark:text-teal-400">
              <ShieldCheck className="w-4 h-4" />
              Terverifikasi oleh LokaTalenta 2.0
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] dark:text-white">
              {passport.full_name}
            </h1>
            <p className="text-xs text-[#71717A] dark:text-slate-400 font-mono-tabular">
              ID Passport: {passport.user_id} • Bergabung{' '}
              {new Date(passport.member_since).toLocaleDateString('id-ID', {
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5">
            <Badge
              tone={
                radar.readinessBadge === 'Top Talent'
                  ? 'emerald'
                  : radar.readinessBadge === 'Job-Ready'
                    ? 'blue'
                    : 'amber'
              }
            >
              Readiness: {radar.readinessBadge} ({radar.overallIndex}/100)
            </Badge>
            <span className="text-xs text-[#71717A] dark:text-slate-400">
              {passport.passed_quizzes} Kuis Lulus • {passport.certificates.length} Sertifikat
            </span>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#D4D4CE] dark:border-[#282E3D]">
          <div className="rounded-xl bg-[#F4F4F1] dark:bg-[#11141B] border border-[#D4D4CE] dark:border-[#282E3D] p-3 min-h-[76px] flex flex-col justify-between">
            <p className="text-[11px] font-medium text-[#71717A] dark:text-slate-400">Rata-rata Psikotes</p>
            <p className="text-lg font-bold font-mono-tabular text-[#18181B] dark:text-white">
              {passport.avg_quiz_score}/100
            </p>
          </div>
          <div className="rounded-xl bg-[#F4F4F1] dark:bg-[#11141B] border border-[#D4D4CE] dark:border-[#282E3D] p-3 min-h-[76px] flex flex-col justify-between">
            <p className="text-[11px] font-medium text-[#71717A] dark:text-slate-400">Stabilitas Kraepelin</p>
            <p className="text-lg font-bold font-mono-tabular text-emerald-600 dark:text-emerald-400">
              {passport.kraepelin.best_stability}%
            </p>
          </div>
          <div className="rounded-xl bg-[#F4F4F1] dark:bg-[#11141B] border border-[#D4D4CE] dark:border-[#282E3D] p-3 min-h-[76px] flex flex-col justify-between">
            <p className="text-[11px] font-medium text-[#71717A] dark:text-slate-400">Kecepatan Kraepelin</p>
            <p className="text-lg font-bold font-mono-tabular text-[#18181B] dark:text-white">
              {passport.kraepelin.avg_speed_kpm} KPM
            </p>
          </div>
          <div className="rounded-xl bg-[#F4F4F1] dark:bg-[#11141B] border border-[#D4D4CE] dark:border-[#282E3D] p-3 min-h-[76px] flex flex-col justify-between">
            <p className="text-[11px] font-medium text-[#71717A] dark:text-slate-400">Materi Selesai</p>
            <p className="text-lg font-bold font-mono-tabular text-[#18181B] dark:text-white">
              {passport.completed_lessons} Materi
            </p>
          </div>
        </div>
      </section>

      {/* 5D Competency Radar */}
      <CompetencyRadarCard metrics={radar} interactive={false} />

      {/* Verified Certificates */}
      <section className="bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base sm:text-lg font-bold text-[#18181B] dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-[#0F766E] dark:text-teal-400" />
            Sertifikat Kelulusan Terverifikasi
          </h2>
          <Badge tone="slate">{passport.certificates.length} Sertifikat</Badge>
        </div>

        {passport.certificates.length === 0 ? (
          <p className="text-sm text-[#71717A] dark:text-slate-400">
            Kandidat belum memiliki sertifikat kelulusan resmi.
          </p>
        ) : (
          <div className="divide-y divide-[#D4D4CE] dark:divide-[#282E3D]">
            {passport.certificates.map((cert) => (
              <div
                key={cert.cert_code}
                className="py-3 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[#18181B] dark:text-white">
                    {cert.course_title}
                  </p>
                  <p className="text-xs text-[#71717A] dark:text-slate-400 font-mono-tabular">
                    Kode: {cert.cert_code} • Terbit{' '}
                    {new Date(cert.issued_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <Link to={`/verify/${encodeURIComponent(cert.cert_code)}`}>
                  <Button variant="secondary" size="sm">
                    <Zap className="w-3.5 h-3.5" />
                    Verifikasi Sertifikat
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

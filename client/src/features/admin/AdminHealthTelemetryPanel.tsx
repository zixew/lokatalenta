import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, Database, RefreshCw, Server, Trash2 } from 'lucide-react';
import { useState } from 'react';
import pkg from '../../../package.json';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import {
  clearClientTelemetryErrors,
  fetchSystemHealthSnapshot,
  getClientTelemetryErrors,
} from './healthTelemetry';

export function AdminHealthTelemetryPanel() {
  const [errors, setErrors] = useState(() => getClientTelemetryErrors());

  const {
    data: snapshot,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: fetchSystemHealthSnapshot,
  });

  const handleClearErrors = () => {
    clearClientTelemetryErrors();
    setErrors([]);
  };

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0F766E]" />
              Kesehatan Sistem &amp; Telemetry
            </h2>
            <p className="text-xs text-[#71717A] dark:text-slate-400 mt-0.5">
              Pantau versi aktif, status PWA/cache, latensi database, dan log error client.
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            disabled={isFetching}
            onClick={() => {
              refetch();
              setErrors(getClientTelemetryErrors());
            }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Muat Ulang Metrik
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-800 space-y-1">
            <span className="text-xs text-[#71717A] dark:text-slate-400">Versi Aplikasi</span>
            <p className="text-lg font-extrabold font-mono-tabular text-[#18181B] dark:text-white">
              v{pkg.version}
            </p>
            <Badge tone="emerald">{snapshot?.mode ?? 'Memeriksa...'}</Badge>
          </div>

          <div className="p-4 rounded-xl bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-800 space-y-1">
            <span className="text-xs text-[#71717A] dark:text-slate-400 flex items-center gap-1">
              <Database className="w-3.5 h-3.5" /> Latensi Database
            </span>
            <p className="text-lg font-extrabold font-mono-tabular text-[#18181B] dark:text-white">
              {snapshot?.dbLatencyMs !== null && snapshot?.dbLatencyMs !== undefined
                ? `${snapshot.dbLatencyMs} ms`
                : 'Mode Lokal'}
            </p>
            <span className="text-[11px] text-[#71717A] dark:text-slate-400">
              Koneksi Cloud Database
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-800 space-y-1">
            <span className="text-xs text-[#71717A] dark:text-slate-400 flex items-center gap-1">
              <Server className="w-3.5 h-3.5" /> Service Worker / PWA
            </span>
            <p className="text-lg font-extrabold text-[#18181B] dark:text-white">
              {snapshot?.swStatus ?? '-'}
            </p>
            <span className="text-[11px] text-[#71717A] dark:text-slate-400">
              {snapshot?.localStorageKeys ?? 0} key tersimpan lokal
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-800 space-y-1">
            <span className="text-xs text-[#71717A] dark:text-slate-400">Aktivitas 24 Jam</span>
            <p className="text-lg font-extrabold font-mono-tabular text-[#18181B] dark:text-white">
              {snapshot?.attempts24h !== undefined
                ? `${snapshot.attempts24h} kuis · ${snapshot.typingAttempts24h ?? 0} ketik`
                : 'Tersedia di Cloud'}
            </p>
            <span className="text-[11px] text-[#71717A] dark:text-slate-400">
              {snapshot?.activeUsers !== undefined
                ? `${snapshot.activeUsers}/${snapshot.totalUsers} pengguna aktif`
                : 'Mode demo'}
            </span>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E3DC] dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-[#18181B] dark:text-white">
                Log Error Client Tertangkap ({errors.length})
              </h3>
              <p className="text-[11px] text-[#71717A] dark:text-slate-400">
                Cakupan lokal browser (<code className="font-mono">sessionStorage</code>) untuk sesi tab aktif ini.
              </p>
            </div>
          </div>
          {errors.length > 0 && (
            <Button size="sm" variant="secondary" onClick={handleClearErrors}>
              <Trash2 className="w-3.5 h-3.5" />
              Bersihkan Log
            </Button>
          )}
        </div>

        {errors.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#71717A] dark:text-slate-400">
            Tidak ada error runtime client yang tercatat pada sesi browser ini (sessionStorage).
          </div>
        ) : (
          <div className="divide-y divide-[#E5E3DC] dark:divide-slate-800">
            {errors.map((err) => (
              <div
                key={err.id}
                className="px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <Badge tone="rose">{err.source}</Badge>
                  <p className="text-[#18181B] dark:text-slate-200 break-words">
                    {err.message}
                  </p>
                </div>
                <span className="text-[#71717A] dark:text-slate-400 font-mono-tabular shrink-0">
                  {new Date(err.timestamp).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, CheckCircle2, Keyboard, RotateCcw, Timer } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { useAuthStore } from '../auth/useAuthStore';
import { listTypingAttempts, saveTypingAttempt } from './typingApi';
import { computeTypingMetrics } from './typingEngine';
import { TYPING_PROMPTS } from './typingPrompts';

const DURATIONS = [30, 60, 120] as const;

export default function TypingTestPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const userKey = user?.id ?? 'guest';

  const [durationSec, setDurationSec] = useState<number>(60);
  const [presetId, setPresetId] = useState<string>(TYPING_PROMPTS[0].id);
  const [typedText, setTypedText] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'finished'>('idle');
  const [timeLeft, setTimeLeft] = useState<number>(60);

  const activePreset = useMemo(
    () => TYPING_PROMPTS.find((p) => p.id === presetId) ?? TYPING_PROMPTS[0],
    [presetId]
  );

  const { data: history = [] } = useQuery({
    queryKey: ['typing-attempts', userKey],
    queryFn: () => listTypingAttempts(userKey),
  });

  const saveMut = useMutation({
    mutationFn: (metrics: {
      wpm: number;
      cpm: number;
      accuracyPct: number;
      errorCount: number;
      elapsed: number;
    }) =>
      saveTypingAttempt(userKey, {
        preset_id: activePreset.id,
        preset_title: activePreset.title,
        duration_seconds: metrics.elapsed,
        wpm: metrics.wpm,
        cpm: metrics.cpm,
        accuracy_pct: metrics.accuracyPct,
        error_count: metrics.errorCount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['typing-attempts', userKey] });
    },
  });

  const elapsedSeconds = Math.max(1, durationSec - timeLeft);
  const metrics = useMemo(
    () => computeTypingMetrics(activePreset.text, typedText, elapsedSeconds),
    [activePreset.text, typedText, elapsedSeconds]
  );

  const typedTextRef = useRef('');
  const saveMutRef = useRef(saveMut.mutate);

  useEffect(() => {
    saveMutRef.current = saveMut.mutate;
  }, [saveMut.mutate]);

  useEffect(() => {
    if (status !== 'running') return undefined;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setStatus('finished');
          const finalMetrics = computeTypingMetrics(
            activePreset.text,
            typedTextRef.current,
            durationSec
          );
          saveMutRef.current({ ...finalMetrics, elapsed: durationSec });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [status, activePreset.text, durationSec]);

  const handleReset = (nextDuration = durationSec, nextPreset = presetId) => {
    setDurationSec(nextDuration);
    setPresetId(nextPreset);
    setTypedText('');
    typedTextRef.current = '';
    setTimeLeft(nextDuration);
    setStatus('idle');
  };

  const handleInputChange = (val: string) => {
    if (status === 'finished') return;
    if (status === 'idle' && val.length > 0) {
      setStatus('running');
    }
    const bounded = val.slice(0, activePreset.text.length);
    setTypedText(bounded);
    typedTextRef.current = bounded;

    if (bounded.length >= activePreset.text.length) {
      const usedSec = Math.max(1, durationSec - timeLeft);
      setStatus('finished');
      const finalMetrics = computeTypingMetrics(
        activePreset.text,
        bounded,
        usedSec
      );
      saveMut.mutate({ ...finalMetrics, elapsed: usedSec });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <Badge tone="emerald">
            <Keyboard className="w-3.5 h-3.5" />
            Latihan Data Entry &amp; Administrasi
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] dark:text-white tracking-tight">
            Tes Kecepatan &amp; Ketepatan Mengetik
          </h1>
          <p className="text-sm text-[#52525B] dark:text-slate-400">
            Ukur kecepatan ketik (WPM &amp; CPM) dan akurasi karakter real-time untuk kesiapan tes administrasi kerja.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => handleReset()}
        >
          <RotateCcw className="w-4 h-4" />
          Ulangi Latihan
        </Button>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#71717A] dark:text-slate-400 mr-1">
            Durasi:
          </span>
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleReset(d, presetId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                durationSec === d
                  ? 'bg-[#0F766E] text-white'
                  : 'bg-[#F4F4F1] dark:bg-slate-800 text-[#52525B] dark:text-slate-300'
              }`}
            >
              {d} Detik
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#71717A] dark:text-slate-400 mr-1">
            Paket Teks:
          </span>
          {TYPING_PROMPTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleReset(durationSec, p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                presetId === p.id
                  ? 'bg-[#0F766E] text-white'
                  : 'bg-[#F4F4F1] dark:bg-slate-800 text-[#52525B] dark:text-slate-300'
              }`}
            >
              {p.category}
            </button>
          ))}
        </div>
      </div>

      {/* Live Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-xl p-4">
          <span className="text-xs text-[#71717A] dark:text-slate-400 flex items-center gap-1">
            <Timer className="w-3.5 h-3.5" /> Sisa Waktu
          </span>
          <p className="text-2xl font-extrabold font-mono-tabular text-[#18181B] dark:text-white mt-1">
            {timeLeft}s
          </p>
        </div>
        <div className="bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-xl p-4">
          <span className="text-xs text-[#71717A] dark:text-slate-400">Kecepatan (WPM)</span>
          <p className="text-2xl font-extrabold font-mono-tabular text-[#0F766E] dark:text-teal-400 mt-1">
            {metrics.wpm} <span className="text-xs font-medium">WPM</span>
          </p>
        </div>
        <div className="bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-xl p-4">
          <span className="text-xs text-[#71717A] dark:text-slate-400">Akurasi Ketik</span>
          <p className="text-2xl font-extrabold font-mono-tabular text-[#18181B] dark:text-white mt-1">
            {metrics.accuracyPct}%
          </p>
        </div>
        <div className="bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-xl p-4">
          <span className="text-xs text-[#71717A] dark:text-slate-400">Karakter / Salah</span>
          <p className="text-2xl font-extrabold font-mono-tabular text-[#18181B] dark:text-white mt-1">
            {metrics.cpm} <span className="text-xs font-medium text-rose-500">({metrics.errorCount} err)</span>
          </p>
        </div>
      </div>

      {/* Prompt Display & Input */}
      <section className="bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[#0F766E] dark:text-teal-400">
            {activePreset.title}
          </p>
          {status === 'finished' && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="emerald">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Selesai! Hasil Tersimpan
              </Badge>
              <Button type="button" size="sm" variant="secondary" onClick={() => handleReset()}>
                <RotateCcw className="w-3.5 h-3.5" />
                Ulangi Latihan
              </Button>
            </div>
          )}
        </div>

        <div
          className="p-4 sm:p-5 rounded-xl bg-[#F4F4F1] dark:bg-slate-900 border border-[#D4D4CE] dark:border-[#282E3D] font-mono text-sm sm:text-base leading-relaxed select-none break-words"
          aria-label="Teks target latihan mengetik"
        >
          {activePreset.text.split('').map((ch, idx) => {
            const isTyped = idx < typedText.length;
            const isCorrect = isTyped && typedText[idx] === ch;
            const isCursor = idx === typedText.length && status !== 'finished';
            return (
              <span
                key={idx}
                className={
                  isTyped
                    ? isCorrect
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 underline'
                    : isCursor
                      ? 'bg-[#0F766E]/20 border-b-2 border-[#0F766E] text-[#18181B] dark:text-white'
                      : 'text-[#71717A] dark:text-slate-500'
                }
              >
                {ch}
              </span>
            );
          })}
        </div>

        <textarea
          rows={3}
          value={typedText}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={status === 'finished'}
          placeholder="Mulai ketik teks di atas di sini — timer otomatis berjalan pada ketukan pertama..."
          className="w-full p-4 rounded-xl border border-[#D4D4CE] dark:border-[#282E3D] bg-white dark:bg-slate-900 text-sm font-mono text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E] disabled:opacity-60"
        />
      </section>

      {/* History */}
      <section className="bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-[#0F766E]" />
          Riwayat Latihan Mengetik ({history.length})
        </h2>

        {history.length === 0 ? (
          <p className="text-sm text-[#71717A] dark:text-slate-400">
            Belum ada riwayat latihan mengetik. Selesaikan satu sesi untuk melihat progres Anda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-[#D4D4CE] dark:border-[#282E3D] text-[#71717A] dark:text-slate-400">
                <tr>
                  <th className="py-2 pr-4">Paket</th>
                  <th className="py-2 pr-4">WPM</th>
                  <th className="py-2 pr-4">CPM</th>
                  <th className="py-2 pr-4">Akurasi</th>
                  <th className="py-2">Durasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4D4CE] dark:divide-slate-800">
                {history.slice(0, 8).map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 pr-4 font-medium text-[#18181B] dark:text-white">
                      {item.preset_title}
                    </td>
                    <td className="py-2.5 pr-4 font-mono-tabular font-bold text-[#0F766E] dark:text-teal-400">
                      {item.wpm} WPM
                    </td>
                    <td className="py-2.5 pr-4 font-mono-tabular">{item.cpm}</td>
                    <td className="py-2.5 pr-4 font-mono-tabular">{item.accuracy_pct}%</td>
                    <td className="py-2.5 font-mono-tabular">{item.duration_seconds}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

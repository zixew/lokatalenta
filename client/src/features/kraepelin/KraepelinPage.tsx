import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BarChart3, CheckCircle2, Clock, History, Play, RotateCcw, TrendingUp, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { ProgressBar } from '../../shared/ui/ProgressBar';
import { useAuthStore } from '../auth/useAuthStore';
import {
  evaluateKraepelinSession,
  generateKraepelinColumns,
  pairKey,
} from './kraepelinEngine';
import {
  computeKraepelinSummaryTrend,
  recordKraepelinAttemptAsync,
  syncKraepelinHistoryFromServer,
} from './kraepelinHistory';

type Stage = 'setup' | 'running' | 'result';

interface Preset {
  id: string;
  label: string;
  desc: string;
  columns: number;
  rows: number;
  secondsPerCol: number;
}

const PRESETS: Preset[] = [
  {
    id: 'quick',
    label: 'Latihan Cepat',
    desc: '6 Kolom • 15 dtk/kolom • 10 pasangan/kolom',
    columns: 6,
    rows: 11,
    secondsPerCol: 15,
  },
  {
    id: 'standard',
    label: 'Standar Ritel & Bank',
    desc: '10 Kolom • 20 dtk/kolom • 15 pasangan/kolom',
    columns: 10,
    rows: 16,
    secondsPerCol: 20,
  },
  {
    id: 'bumn',
    label: 'Intensif BUMN',
    desc: '15 Kolom • 20 dtk/kolom • 18 pasangan/kolom',
    columns: 15,
    rows: 19,
    secondsPerCol: 20,
  },
];

export function KraepelinPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [presetId, setPresetId] = useState<string>('quick');
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];

  const [stage, setStage] = useState<Stage>('setup');
  const [runId, setRunId] = useState<number>(1);
  const [columns, setColumns] = useState<number[][]>(() =>
    generateKraepelinColumns(preset.columns, preset.rows)
  );
  const [colIdx, setColIdx] = useState(0);
  const [pairIdx, setPairIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(preset.secondsPerCol);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [activeColIndex, setActiveColIndex] = useState<number | null>(null);

  const startSimulation = useCallback(() => {
    const freshCols = generateKraepelinColumns(preset.columns, preset.rows);
    setColumns(freshCols);
    setColIdx(0);
    setPairIdx(0);
    setSecondsLeft(preset.secondsPerCol);
    setAnswers({});
    setRunId((id) => id + 1);
    setStage('running');
  }, [preset]);

  const advanceColumn = useCallback(() => {
    setColIdx((prevCol) => {
      if (prevCol + 1 >= columns.length) {
        setStage('result');
        return prevCol;
      }
      setPairIdx(0);
      setSecondsLeft(preset.secondsPerCol);
      return prevCol + 1;
    });
  }, [columns.length, preset.secondsPerCol]);

  // Countdown timer per column
  useEffect(() => {
    if (stage !== 'running') return;
    const timer = window.setTimeout(() => {
      if (secondsLeft <= 1) {
        advanceColumn();
      } else {
        setSecondsLeft((s) => s - 1);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [stage, secondsLeft, advanceColumn]);

  const activeCol = columns[colIdx] ?? [];
  const totalPairsInCol = Math.max(0, activeCol.length - 1);
  const topDigit = activeCol[pairIdx];
  const bottomDigit = activeCol[pairIdx + 1];

  const handleDigitInput = useCallback(
    (digit: number) => {
      if (stage !== 'running' || pairIdx >= totalPairsInCol) return;
      const key = pairKey(colIdx, pairIdx);
      setAnswers((prev) => ({ ...prev, [key]: digit }));

      if (pairIdx + 1 < totalPairsInCol) {
        setPairIdx((p) => p + 1);
      } else {
        // Completed all pairs in this column early -> advance to next column
        advanceColumn();
      }
    },
    [stage, pairIdx, totalPairsInCol, colIdx, advanceColumn]
  );

  // Physical keyboard 0-9 support
  useEffect(() => {
    if (stage !== 'running') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigitInput(Number(e.key));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stage, handleDigitInput]);

  const evaluation = useMemo(
    () => evaluateKraepelinSession(columns, answers),
    [columns, answers]
  );

  const { data: history = [] } = useQuery({
    queryKey: ['kraepelin-history', user?.id ?? 'guest'],
    queryFn: () => syncKraepelinHistoryFromServer(user?.id),
  });

  useQuery({
    queryKey: ['kraepelin-record', runId, user?.id ?? 'guest'],
    enabled: stage === 'result',
    staleTime: Infinity,
    queryFn: async () => {
      const updated = await recordKraepelinAttemptAsync({
        userId: user?.id,
        presetId: preset.id,
        durationSeconds: preset.columns * preset.secondsPerCol,
        totalAnswered: evaluation.totalAttempted,
        totalCorrect: evaluation.totalCorrect,
        accuracyPct: evaluation.accuracyPct,
        columnAttemptedCounts: evaluation.columnStats.map((s) => s.attempted),
      });
      queryClient.setQueryData(['kraepelin-history', user?.id ?? 'guest'], updated);
      return updated;
    },
  });

  const trend = useMemo(() => computeKraepelinSummaryTrend(history), [history]);

  const maxAttemptedInAnyCol = Math.max(
    1,
    ...evaluation.columnStats.map((c) => c.attempted)
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#71717A] dark:text-slate-300 hover:text-[#18181B] dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Katalog
        </Link>
        <Badge tone="blue">
          <Zap className="w-3 h-3" />
          Simulator Kraepelin / Pauli
        </Badge>
      </div>

      {/* SETUP STAGE */}
      {stage === 'setup' && (
        <section className="bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[#18181B] dark:text-white">
              Tes Ketelitian Angka (Kraepelin &amp; Pauli)
            </h1>
            <p className="text-sm text-[#52525B] dark:text-slate-300 leading-relaxed">
              Latih kecepatan, ketelitian, dan konsistensi kerja Anda seperti tes seleksi ritel
              modern, perbankan, dan BUMN.
            </p>
          </div>

          <div className="bg-[#F4F4F1] dark:bg-slate-900 border border-[#D4D4CE] dark:border-[#282E3D] rounded-xl p-4 text-sm text-[#18181B] dark:text-slate-200 space-y-1.5">
            <p className="font-bold text-xs uppercase tracking-wider text-[#0F766E] dark:text-teal-400">
              Aturan Pengerjaan
            </p>
            <p>
              Jumlahkan dua angka yang tampil berdekatan lalu ketik atau tekan{' '}
              <strong>digit satuannya saja</strong>:
            </p>
            <p className="text-xs text-[#52525B] dark:text-slate-400 font-mono-tabular">
              Contoh: 7 + 8 = 15 → tekan <strong>5</strong> | 4 + 6 = 10 → tekan <strong>0</strong>
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-slate-400">
              Pilih Mode Latihan
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRESETS.map((p) => {
                const active = p.id === preset.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPresetId(p.id)}
                    className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                      active
                        ? 'bg-teal-50/70 dark:bg-teal-950/50 border-[#0F766E] ring-2 ring-[#0F766E]/20'
                        : 'bg-[#F4F4F1] dark:bg-slate-900 border-[#D4D4CE] dark:border-[#282E3D] hover:border-[#0F766E]'
                    }`}
                  >
                    <p className="text-sm font-bold text-[#18181B] dark:text-white">{p.label}</p>
                    <p className="text-xs text-[#71717A] dark:text-slate-400 mt-1">{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <Button size="lg" onClick={startSimulation}>
              <Play className="w-4 h-4" />
              Mulai Simulasi Sekarang
            </Button>
          </div>
        </section>
      )}

      {/* RUNNING STAGE */}
      {stage === 'running' && (
        <section className="bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#71717A] dark:text-slate-400">
                Kolom {colIdx + 1} dari {columns.length} • Pasangan {pairIdx + 1}/{totalPairsInCol}
              </span>
              <ProgressBar
                value={Math.round(((colIdx + 1) / columns.length) * 100)}
                tone="blue"
              />
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`px-3.5 py-2 rounded-xl border font-mono-tabular text-sm font-bold flex items-center gap-1.5 ${
                  secondsLeft <= 5
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 text-rose-700 dark:text-rose-300'
                    : 'bg-[#F4F4F1] dark:bg-slate-900 border-[#D4D4CE] dark:border-[#282E3D] text-[#18181B] dark:text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
                {secondsLeft} dtk
              </div>
              <Button variant="secondary" size="sm" onClick={() => setStage('result')}>
                Selesai
              </Button>
            </div>
          </div>

          {/* Active Pair Focus Card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5 bg-[#F4F4F1] dark:bg-slate-900 border border-[#D4D4CE] dark:border-[#282E3D] rounded-2xl p-6 flex flex-col items-center justify-center space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] dark:text-slate-400">
                Jumlahkan Dua Angka Ini
              </span>
              <div className="flex items-center gap-4 text-5xl font-extrabold font-mono-tabular text-[#18181B] dark:text-white">
                <span className="w-16 h-16 rounded-2xl bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] flex items-center justify-center">
                  {topDigit}
                </span>
                <span className="text-2xl text-[#0F766E]">+</span>
                <span className="w-16 h-16 rounded-2xl bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] flex items-center justify-center">
                  {bottomDigit}
                </span>
              </div>
              <p className="text-xs text-[#71717A] dark:text-slate-400">
                Tekan tombol angka <strong>0–9</strong> di keyboard atau keypad
              </p>
            </div>

            {/* Numeric Keypad (0-9) */}
            <div className="md:col-span-7 grid grid-cols-5 gap-2.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDigitInput(num)}
                  className="h-14 rounded-xl border border-[#D4D4CE] dark:border-[#282E3D] bg-[#F4F4F1] dark:bg-slate-900 hover:bg-[#0F766E] hover:text-white hover:border-[#0F766E] text-xl font-bold font-mono-tabular text-[#18181B] dark:text-white transition-colors cursor-pointer"
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RESULT STAGE */}
      {stage === 'result' && (
        <section className="space-y-6">
          <div className="bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge tone="emerald">
                  <CheckCircle2 className="w-3 h-3" />
                  Simulasi Selesai
                </Badge>
                <h1 className="text-2xl font-bold text-[#18181B] dark:text-white mt-2">
                  Hasil Ketelitian &amp; Kecepatan
                </h1>
              </div>
              <Button onClick={startSimulation}>
                <RotateCcw className="w-4 h-4" />
                Coba Paket Baru
              </Button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#F4F4F1] dark:bg-slate-900 border border-[#D4D4CE] dark:border-[#282E3D]">
                <span className="text-xs text-[#71717A] dark:text-slate-400 block">
                  Total Terjawab
                </span>
                <strong className="text-2xl font-extrabold font-mono-tabular text-[#18181B] dark:text-white">
                  {evaluation.totalAttempted}
                </strong>
                <span className="text-xs text-[#71717A] dark:text-slate-400 block">
                  dari {evaluation.totalPairs} pasangan
                </span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="text-xs text-emerald-700 dark:text-emerald-300 block">
                  Akurasi Jawaban
                </span>
                <strong className="text-2xl font-extrabold font-mono-tabular text-emerald-900 dark:text-emerald-100">
                  {evaluation.accuracyPct}%
                </strong>
                <span className="text-xs text-emerald-700 dark:text-emerald-300 block">
                  {evaluation.totalCorrect} benar
                </span>
              </div>

              <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                <span className="text-xs text-sky-700 dark:text-sky-300 block">
                  Rata-rata Kecepatan
                </span>
                <strong className="text-2xl font-extrabold font-mono-tabular text-sky-900 dark:text-sky-100">
                  {evaluation.avgSpeedPerCol}
                </strong>
                <span className="text-xs text-sky-700 dark:text-sky-300 block">
                  soal / kolom
                </span>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                <span className="text-xs text-amber-700 dark:text-amber-300 block">
                  Konsistensi
                </span>
                <strong className="text-2xl font-extrabold font-mono-tabular text-amber-900 dark:text-amber-100">
                  {evaluation.consistencyPct}%
                </strong>
                <span className="text-xs text-amber-700 dark:text-amber-300 block">
                  stabilitas antar kolom
                </span>
              </div>
            </div>

            {/* Per-Column Speed & Accuracy Curve */}
            <div className="pt-4 border-t border-[#D4D4CE] dark:border-[#282E3D] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#0F766E]" />
                  <h2 className="text-sm font-bold text-[#18181B] dark:text-white">
                    Kurva Kecepatan &amp; Ketelitian per Kolom
                  </h2>
                </div>
                {(() => {
                  const activeStat = evaluation.columnStats.find(
                    (s) => s.columnIndex === activeColIndex
                  );
                  if (!activeStat) {
                    return (
                      <span className="text-[11px] text-[#71717A] dark:text-slate-400">
                        Arahkan atau klik batang grafik untuk detail kolom
                      </span>
                    );
                  }
                  return (
                    <span className="text-xs font-mono-tabular font-semibold px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-[#0F766E] dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      Kolom {activeStat.columnIndex + 1}: {activeStat.correct}/{activeStat.attempted} benar • Akurasi {activeStat.accuracyPct}%
                    </span>
                  );
                })()}
              </div>

              {/* Pure-SVG Interactive Column Chart */}
              {evaluation.columnStats.length > 0 && (() => {
                const cols = evaluation.columnStats;
                const chartW = 560;
                const chartH = 160;
                const padX = 24;
                const baseY = 128;
                const maxBarH = 92;
                const slotW = (chartW - padX * 2) / cols.length;
                const barW = Math.min(30, Math.max(12, slotW * 0.62));
                const activeStat = cols.find((s) => s.columnIndex === activeColIndex) ?? null;

                return (
                  <div className="rounded-xl border border-[#D4D4CE] dark:border-[#282E3D] bg-[#F4F4F1] dark:bg-slate-900/70 p-3">
                    <svg
                      viewBox={`0 0 ${chartW} ${chartH}`}
                      className="w-full h-40 select-none"
                      role="img"
                      aria-label="Grafik Ketahanan dan Kecepatan per Kolom Kraepelin"
                    >
                      <line
                        x1={padX}
                        y1={baseY}
                        x2={chartW - padX}
                        y2={baseY}
                        stroke="currentColor"
                        className="text-slate-300 dark:text-slate-700"
                        strokeWidth={1}
                      />
                      {cols.map((stat, i) => {
                        const xCenter = padX + i * slotW + slotW / 2;
                        const barH = Math.max(
                          6,
                          Math.round((stat.attempted / maxAttemptedInAnyCol) * maxBarH)
                        );
                        const y = baseY - barH;
                        const isSelected = activeColIndex === stat.columnIndex;
                        const fill =
                          stat.accuracyPct >= 80
                            ? '#059669'
                            : stat.accuracyPct >= 50
                              ? '#0F766E'
                              : '#D97706';

                        return (
                          <g
                            key={stat.columnIndex}
                            className="cursor-pointer"
                            onMouseEnter={() => setActiveColIndex(stat.columnIndex)}
                            onClick={() =>
                              setActiveColIndex((prev) =>
                                prev === stat.columnIndex ? null : stat.columnIndex
                              )
                            }
                          >
                            <rect
                              x={xCenter - slotW / 2}
                              y={12}
                              width={slotW}
                              height={baseY - 12}
                              fill="transparent"
                            />
                            <rect
                              x={xCenter - barW / 2}
                              y={y}
                              width={barW}
                              height={barH}
                              rx={4}
                              fill={fill}
                              opacity={activeColIndex === null || isSelected ? 1 : 0.45}
                              stroke={isSelected ? '#18181B' : 'none'}
                              strokeWidth={isSelected ? 1.5 : 0}
                            />
                            <text
                              x={xCenter}
                              y={baseY + 15}
                              textAnchor="middle"
                              className="fill-[#71717A] dark:fill-slate-400 text-[10px] font-mono-tabular"
                            >
                              K{stat.columnIndex + 1}
                            </text>
                          </g>
                        );
                      })}
                      {activeStat && (() => {
                        const i = cols.findIndex((s) => s.columnIndex === activeStat.columnIndex);
                        const xCenter = padX + i * slotW + slotW / 2;
                        const boxW = 134;
                        const boxX = Math.max(6, Math.min(chartW - boxW - 6, xCenter - boxW / 2));
                        return (
                          <g pointerEvents="none">
                            <rect
                              x={boxX}
                              y={4}
                              width={boxW}
                              height={22}
                              rx={6}
                              fill="#18181B"
                              opacity={0.92}
                            />
                            <text
                              x={boxX + boxW / 2}
                              y={18}
                              textAnchor="middle"
                              fill="#FFFFFF"
                              className="text-[10px] font-mono-tabular font-semibold"
                            >
                              K{activeStat.columnIndex + 1}: {activeStat.correct}/{activeStat.attempted} ({activeStat.accuracyPct}%)
                            </text>
                          </g>
                        );
                      })()}
                    </svg>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {evaluation.columnStats.map((stat) => {
                  const speedPct = Math.round((stat.attempted / maxAttemptedInAnyCol) * 100);
                  return (
                    <div
                      key={stat.columnIndex}
                      className="p-3 rounded-xl bg-[#F4F4F1] dark:bg-slate-900 border border-[#D4D4CE] dark:border-[#282E3D] space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#18181B] dark:text-white">
                          Kolom {stat.columnIndex + 1}
                        </span>
                        <span className="font-mono-tabular text-[#0F766E] dark:text-teal-400 font-semibold">
                          {stat.correct}/{stat.attempted}
                        </span>
                      </div>
                      <ProgressBar
                        value={speedPct}
                        tone={stat.accuracyPct >= 80 ? 'emerald' : stat.accuracyPct >= 50 ? 'blue' : 'amber'}
                      />
                      <span className="text-[11px] text-[#71717A] dark:text-slate-400 block">
                        Akurasi {stat.accuracyPct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Riwayat & Tren Ketahanan (BL-26) */}
      {stage !== 'running' && history.length > 0 && (
        <section className="rounded-2xl border border-[#E4E4E7] dark:border-[#282E3D] bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base sm:text-lg font-bold text-[#18181B] dark:text-white">
                Riwayat &amp; Tren Ketahanan
              </h2>
            </div>
            {trend.totalRuns >= 2 && (
              <Badge tone={trend.deltaAccuracyPct >= 0 ? 'emerald' : 'amber'}>
                <TrendingUp className="h-3.5 w-3.5 mr-1 inline" />
                {trend.deltaAccuracyPct >= 0 ? `+${trend.deltaAccuracyPct}%` : `${trend.deltaAccuracyPct}%`} vs sesi lalu
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 p-3">
              <p className="text-[11px] text-[#71717A] dark:text-slate-400">Total Sesi</p>
              <p className="text-lg font-bold text-[#18181B] dark:text-white">{trend.totalRuns}x</p>
            </div>
            <div className="rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 p-3">
              <p className="text-[11px] text-[#71717A] dark:text-slate-400">Rata-rata Akurasi</p>
              <p className="text-lg font-bold text-[#18181B] dark:text-white">{trend.avgAccuracyPct}%</p>
            </div>
            <div className="rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 p-3">
              <p className="text-[11px] text-[#71717A] dark:text-slate-400">Rata-rata Kecepatan</p>
              <p className="text-lg font-bold text-[#18181B] dark:text-white">{trend.avgSpeedKpm} KPM</p>
            </div>
            <div className="rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 p-3">
              <p className="text-[11px] text-[#71717A] dark:text-slate-400">Stabilitas Terbaik</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{trend.bestStability}%</p>
            </div>
          </div>

          <div className="divide-y divide-[#E4E4E7] dark:divide-slate-800">
            {history.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#18181B] dark:text-white">
                    {new Date(item.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="text-[#71717A] dark:text-slate-400">
                    {item.total_correct}/{item.total_answered} benar
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={item.accuracy_pct >= 80 ? 'emerald' : 'blue'}>
                    Akurasi {item.accuracy_pct}%
                  </Badge>
                  <Badge tone="slate">{item.speed_kpm} KPM</Badge>
                  <Badge tone="slate">Stabilitas {item.stability_score}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

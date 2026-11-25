import { ArrowRight, Compass } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../shared/ui/Badge';
import { ProgressBar } from '../../shared/ui/ProgressBar';
import type { TalentRadarMetrics } from './talentRadar';

interface CompetencyRadarCardProps {
  metrics: TalentRadarMetrics;
  interactive?: boolean;
}

const CENTER_X = 110;
const CENTER_Y = 100;
const MAX_RADIUS = 68;
const RINGS = [20, 40, 60, 80, 100];

function polarPoint(index: number, total: number, radius: number): { x: number; y: number } {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return {
    x: CENTER_X + radius * Math.cos(angle),
    y: CENTER_Y + radius * Math.sin(angle),
  };
}

export function CompetencyRadarCard({
  metrics,
  interactive = true,
}: CompetencyRadarCardProps) {
  const [activeDimKey, setActiveDimKey] = useState<string | null>(null);
  const total = metrics.dimensions.length;
  const activeDimension =
    metrics.dimensions.find((d) => d.key === activeDimKey) ?? null;
  const dataPoints = metrics.dimensions
    .map((d, idx) => {
      const p = polarPoint(idx, total, (d.score / 100) * MAX_RADIUS);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(' ');

  const badgeTone =
    metrics.readinessBadge === 'Top Talent'
      ? 'emerald'
      : metrics.readinessBadge === 'Job-Ready'
        ? 'blue'
        : 'amber';

  return (
    <section className="bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#18181B] dark:text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#0F766E] dark:text-teal-400" />
            Radar Kompetensi 5-Dimensi
          </h2>
          <p className="text-xs text-[#71717A] dark:text-slate-400 mt-0.5">
            Indeks kesiapan karier gabungan asesmen verbal, numerik, logika, Kraepelin &amp; materi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold font-mono-tabular text-[#18181B] dark:text-white">
            Skor {metrics.overallIndex}/100
          </span>
          <Badge tone={badgeTone}>{metrics.readinessBadge}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Pure SVG 5D Radar with Zero-CLS aspect ratio reservation */}
        <div className="md:col-span-5 flex flex-col items-center gap-3">
          <div className="relative w-full max-w-[300px] aspect-[370/248] flex items-center justify-center">
            <svg
              viewBox="-75 -24 370 248"
              className="w-full h-full select-none"
              role="img"
              aria-label="Grafik Radar Kompetensi 5-Dimensi"
            >
            {/* Concentric polygon rings */}
            {RINGS.map((pct) => {
              const pts = metrics.dimensions
                .map((_, idx) => {
                  const p = polarPoint(idx, total, (pct / 100) * MAX_RADIUS);
                  return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                })
                .join(' ');
              return (
                <polygon
                  key={pct}
                  points={pts}
                  fill="none"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-700"
                  strokeWidth={pct === 100 ? 1.3 : 0.8}
                />
              );
            })}

            {/* Axis lines & labels */}
            {metrics.dimensions.map((dim, idx) => {
              const edge = polarPoint(idx, total, MAX_RADIUS);
              const labelPos = polarPoint(idx, total, MAX_RADIUS + 20);
              const anchor =
                labelPos.x < CENTER_X - 10
                  ? 'end'
                  : labelPos.x > CENTER_X + 10
                    ? 'start'
                    : 'middle';
              const isSelected = activeDimKey === dim.key;
              return (
                <g
                  key={dim.key}
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveDimKey(dim.key)}
                  onClick={() =>
                    setActiveDimKey((prev) => (prev === dim.key ? null : dim.key))
                  }
                >
                  <line
                    x1={CENTER_X}
                    y1={CENTER_Y}
                    x2={edge.x}
                    y2={edge.y}
                    stroke="currentColor"
                    className={
                      isSelected
                        ? 'text-[#0F766E] dark:text-teal-400'
                        : 'text-slate-200 dark:text-slate-700'
                    }
                    strokeWidth={isSelected ? 1.5 : 0.9}
                  />
                  <text
                    x={labelPos.x}
                    y={labelPos.y + 3}
                    textAnchor={anchor}
                    className={`text-[10px] font-semibold transition-colors ${
                      isSelected
                        ? 'fill-[#0F766E] dark:fill-teal-400'
                        : 'fill-[#52525B] dark:fill-slate-300'
                    }`}
                  >
                    {dim.label}
                  </text>
                </g>
              );
            })}

            {/* Candidate polygon */}
            <polygon
              points={dataPoints}
              fill="rgba(15, 118, 110, 0.22)"
              stroke="#0F766E"
              strokeWidth={2}
            />
            {metrics.dimensions.map((d, idx) => {
              const p = polarPoint(idx, total, (d.score / 100) * MAX_RADIUS);
              const isSelected = activeDimKey === d.key;
              return (
                <g
                  key={d.key}
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveDimKey(d.key)}
                  onClick={() =>
                    setActiveDimKey((prev) => (prev === d.key ? null : d.key))
                  }
                >
                  <circle cx={p.x} cy={p.y} r={12} fill="transparent" />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isSelected ? 5.5 : 3.5}
                    className="fill-[#0F766E] dark:fill-teal-400 stroke-white dark:stroke-slate-900 transition-all"
                    strokeWidth={isSelected ? 2 : 1.2}
                  />
                </g>
              );
            })}
          </svg>
          </div>

          {/* Interactive Dimension Tooltip with Zero Layout Shift */}
          <div className="w-full max-w-[300px] h-[58px] rounded-xl border border-[#D4D4CE] dark:border-[#282E3D] bg-[#F4F4F1] dark:bg-[#11141B] px-3.5 py-2 flex items-center justify-between gap-2 text-xs overflow-hidden">
            {activeDimension ? (
              <>
                <div className="min-w-0">
                  <p className="font-bold text-[#18181B] dark:text-white truncate">
                    {activeDimension.label}
                  </p>
                  <p className="text-[11px] font-mono-tabular text-[#52525B] dark:text-slate-400">
                    Skor saat ini: <strong>{activeDimension.score}%</strong>
                  </p>
                </div>
                {interactive && (
                  <Link
                    to={activeDimension.drillPath}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0F766E] text-white font-semibold text-[11px] hover:bg-[#115E59] shrink-0"
                  >
                    Latih
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </>
            ) : (
              <p className="text-[11px] text-[#71717A] dark:text-slate-400 mx-auto text-center leading-relaxed">
                Arahkan kursor atau klik titik dimensi pada radar untuk detail &amp; latihan.
              </p>
            )}
          </div>
        </div>

        {/* Dimension Breakdown */}
        <div className="md:col-span-7 space-y-3">
          {metrics.dimensions.map((dim) => (
            <div key={dim.key} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#18181B] dark:text-white">{dim.label}</span>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono-tabular font-bold text-[#18181B] dark:text-slate-200">
                    {dim.score}%
                  </span>
                  {interactive && dim.score < 80 && (
                    <Link
                      to={dim.drillPath}
                      className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#0F766E] dark:text-teal-400 hover:underline"
                    >
                      Latih
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
              <ProgressBar
                value={dim.score}
                tone={dim.score >= 80 ? 'emerald' : dim.score >= 60 ? 'blue' : 'amber'}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

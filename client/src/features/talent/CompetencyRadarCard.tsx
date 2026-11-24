import { ArrowRight, Compass } from 'lucide-react';
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
  const total = metrics.dimensions.length;
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
    <section className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
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
        {/* Pure SVG 5D Radar */}
        <div className="md:col-span-5 flex justify-center">
          <svg
            viewBox="-48 -24 316 248"
            className="w-full max-w-[280px] h-auto select-none"
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
              return (
                <g key={dim.key}>
                  <line
                    x1={CENTER_X}
                    y1={CENTER_Y}
                    x2={edge.x}
                    y2={edge.y}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-700"
                    strokeWidth={0.9}
                  />
                  <text
                    x={labelPos.x}
                    y={labelPos.y + 3}
                    textAnchor={anchor}
                    className="fill-[#52525B] dark:fill-slate-300 text-[10px] font-semibold"
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
              return (
                <circle
                  key={d.key}
                  cx={p.x}
                  cy={p.y}
                  r={3.5}
                  className="fill-[#0F766E] dark:fill-teal-400 stroke-white dark:stroke-slate-900"
                  strokeWidth={1.2}
                />
              );
            })}
          </svg>
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

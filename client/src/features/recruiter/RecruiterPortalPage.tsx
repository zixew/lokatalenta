/**
 * RecruiterPortalPage.tsx — Sprint 14 / BL-42 & BL-45
 * Anti-AI-Slop design: editorial headings, crisp 1px borders,
 * compact high-density cards, teal accent. No floaty purple gradients.
 */

import {
  Bookmark,
  BookmarkX,
  Briefcase,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Copy,
  Download,
  ExternalLink,
  Filter,
  Link2,
  MailPlus,
  Search,
  Send,
  Users,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AssessmentInvitation, RecruiterCandidate } from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import {
  createAssessmentInvitation,
  getShortlistedIds,
  getStoredInvitations,
  INITIAL_RECRUITER_CANDIDATES,
  toggleCandidateShortlist,
} from './recruiterApi';

// ─── Types / constants ────────────────────────────────────────────────────────

type CategoryFilter = 'Semua' | string;
type ReadinessFilter = 'Semua' | 'ready' | 'developing' | 'exploring';
type ActiveTab = 'kandidat' | 'shortlist';

const CATEGORIES = ['Semua', 'Teknologi & Data', 'Keuangan & Analisis', 'Bisnis & Manajemen', 'Operasional & Logistik'];
const READINESS_OPTS: Array<{ value: ReadinessFilter; label: string }> = [
  { value: 'Semua', label: 'Semua' },
  { value: 'ready', label: 'Siap Kerja' },
  { value: 'developing', label: 'Berkembang' },
  { value: 'exploring', label: 'Menjelajahi' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function radarAvg(scores: RecruiterCandidate['radar_scores']): number {
  const vals = Object.values(scores);
  return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
}

function buildInviteUrl(invite: AssessmentInvitation): string {
  const org = encodeURIComponent(invite.org_name);
  return `${window.location.origin}/quiz/${invite.quiz_id}?org=${org}&invite=${invite.invite_token}`;
}

function exportShortlistCsv(candidates: RecruiterCandidate[]): void {
  const header = [
    'Nama', 'Kategori', 'Status Kesiapan', 'Kognitif', 'Logika',
    'Ketahanan', 'Komunikasi', 'Spasial', 'Radar Avg',
    'Speed (WPM)', 'Ketelitian (%)', 'Stabilitas',
  ].join(',');

  const rows = candidates.map((c) => [
    `"${c.full_name}"`,
    `"${c.category}"`,
    c.readiness_status,
    c.radar_scores.kognitif,
    c.radar_scores.logika,
    c.radar_scores.ketahanan,
    c.radar_scores.komunikasi,
    c.radar_scores.spasial,
    radarAvg(c.radar_scores),
    c.kraepelin_summary?.speed_wpm ?? '-',
    c.kraepelin_summary?.accuracy_pct ?? '-',
    `"${c.kraepelin_summary?.stability_grade ?? '-'}"`,
  ].join(','));

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `shortlist_rekruter_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="border border-[#D4D4CE] dark:border-[#282E3D] rounded-lg p-4 bg-white dark:bg-[#161B22] flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-widest text-[#71717A] dark:text-slate-500 font-medium">
        {label}
      </span>
      <span className="text-2xl font-extrabold tabular-nums text-[#18181B] dark:text-white leading-tight">
        {value}
      </span>
      {sub && <span className="text-[11px] text-[#A1A1AA] dark:text-slate-500">{sub}</span>}
    </div>
  );
}

function RadarMiniBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-20 shrink-0 text-[#71717A] dark:text-slate-400 capitalize">{label}</span>
      <div className="flex-1 h-1.5 bg-[#F4F4F5] dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-[#0F766E]"
          style={{ width: `${Math.max(2, score)}%` }}
        />
      </div>
      <span className="tabular-nums text-[#52525B] dark:text-slate-400 w-7 text-right">{score}</span>
    </div>
  );
}

function ReadinessBadge({ status }: { status: RecruiterCandidate['readiness_status'] }) {
  if (status === 'ready') return <Badge tone="emerald">✓ Siap Kerja</Badge>;
  if (status === 'developing') return <Badge tone="blue">↑ Berkembang</Badge>;
  return <Badge tone="slate">◎ Menjelajahi</Badge>;
}

function AvatarCircle({ initials, size = 'md' }: { initials: string; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div
      className={`${cls} rounded-full bg-[#CCFBF1] dark:bg-teal-950 text-[#0F766E] dark:text-teal-300 font-bold flex items-center justify-center shrink-0 select-none border border-[#99F6E4] dark:border-teal-800`}
    >
      {initials}
    </div>
  );
}

// ─── Candidate Card ───────────────────────────────────────────────────────────

function CandidateCardItem({
  candidate,
  isShortlisted,
  onToggleShortlist,
  onSendInvite,
}: {
  candidate: RecruiterCandidate;
  isShortlisted: boolean;
  onToggleShortlist: (id: string) => void;
  onSendInvite: (c: RecruiterCandidate) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const avg = radarAvg(candidate.radar_scores);

  return (
    <article className="border border-[#D4D4CE] dark:border-[#282E3D] rounded-lg bg-white dark:bg-[#161B22] overflow-hidden">
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        <AvatarCircle initials={getInitials(candidate.full_name)} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-[#18181B] dark:text-white truncate">
              {candidate.full_name}
            </span>
            <ReadinessBadge status={candidate.readiness_status} />
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-[11px] text-[#71717A] dark:text-slate-400 font-medium">
              {candidate.category}
            </span>
            <span className="text-[#D4D4D8] dark:text-slate-700">·</span>
            <span className="text-[11px] tabular-nums text-[#71717A] dark:text-slate-400">
              Radar avg <strong className="text-[#18181B] dark:text-slate-200">{avg}</strong>/100
            </span>
            {candidate.kraepelin_summary && (
              <>
                <span className="text-[#D4D4D8] dark:text-slate-700">·</span>
                <span className="text-[11px] tabular-nums text-[#71717A] dark:text-slate-400">
                  {candidate.kraepelin_summary.speed_wpm}
                  <span className="font-normal"> WPM</span> / {candidate.kraepelin_summary.accuracy_pct}%
                </span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => setExpanded((p) => !p)}
          className="text-[#A1A1AA] hover:text-[#52525B] dark:hover:text-slate-300 transition-colors mt-0.5"
          aria-label="Toggle radar detail"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Radar mini-bars (collapsible) */}
      {expanded && (
        <div className="px-4 pb-3 space-y-1.5 border-t border-[#F4F4F5] dark:border-[#282E3D] pt-3">
          {Object.entries(candidate.radar_scores).map(([key, score]) => (
            <RadarMiniBar key={key} label={key} score={score} />
          ))}
          {candidate.kraepelin_summary && (
            <div className="pt-1.5 border-t border-[#F4F4F5] dark:border-[#282E3D] mt-1.5 text-[11px] text-[#71717A] dark:text-slate-400">
              Kraepelin: <strong className="text-[#18181B] dark:text-slate-200">{candidate.kraepelin_summary.stability_grade}</strong>
            </div>
          )}
          {candidate.top_certificates.length > 0 && (
            <div className="pt-1.5 flex flex-wrap gap-1">
              {candidate.top_certificates.map((cert) => (
                <span
                  key={cert}
                  className="text-[10px] px-2 py-0.5 rounded bg-[#F4F4F1] dark:bg-slate-800 border border-[#D4D4CE] dark:border-[#282E3D] text-[#52525B] dark:text-slate-400 font-mono"
                >
                  {cert}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-[#F4F4F5] dark:border-[#282E3D] bg-[#FAFAF9] dark:bg-[#0D1117]">
        <Link
          to={`/talent/${candidate.user_id}`}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0F766E] dark:text-teal-400 hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Talent Passport
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => onSendInvite(candidate)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#52525B] dark:text-slate-400 hover:text-[#0F766E] dark:hover:text-teal-400 transition-colors"
            title="Kirim Undangan Asesmen"
          >
            <MailPlus className="w-3.5 h-3.5" />
            Undang
          </button>
          <button
            onClick={() => onToggleShortlist(candidate.id)}
            className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors ${
              isShortlisted
                ? 'text-[#0F766E] dark:text-teal-400'
                : 'text-[#A1A1AA] hover:text-[#52525B] dark:hover:text-slate-300'
            }`}
            title={isShortlisted ? 'Hapus dari Shortlist' : 'Simpan ke Shortlist'}
          >
            {isShortlisted ? <BookmarkX className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            {isShortlisted ? 'Tersimpan' : 'Simpan'}
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Shortlist Row ────────────────────────────────────────────────────────────

function ShortlistRow({
  candidate,
  onRemove,
  onSendInvite,
}: {
  candidate: RecruiterCandidate;
  onRemove: (id: string) => void;
  onSendInvite: (c: RecruiterCandidate) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#F4F4F5] dark:border-[#282E3D] last:border-0">
      <AvatarCircle initials={getInitials(candidate.full_name)} size="sm" />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-[#18181B] dark:text-white truncate block">
          {candidate.full_name}
        </span>
        <span className="text-[11px] text-[#71717A] dark:text-slate-400">
          {candidate.category} · Radar avg {radarAvg(candidate.radar_scores)}/100
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => onSendInvite(candidate)} title="Kirim Undangan">
          <Send className="w-3.5 h-3.5" />
          Undang
        </Button>
        <button
          onClick={() => onRemove(candidate.id)}
          className="text-[#A1A1AA] hover:text-rose-500 transition-colors p-1"
          title="Hapus dari shortlist"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Create Invite Modal ──────────────────────────────────────────────────────

interface InviteModalProps {
  targetCandidate: RecruiterCandidate | null;
  quizList: Array<{ id: string; title: string }>;
  onClose: () => void;
  onCreated: (invite: AssessmentInvitation) => void;
}

function InviteModal({ targetCandidate, quizList, onClose, onCreated }: InviteModalProps) {
  const [quizId, setQuizId] = useState(quizList[0]?.id ?? '');
  const [positionName, setPositionName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [generatedInvite, setGeneratedInvite] = useState<AssessmentInvitation | null>(null);
  const [copied, setCopied] = useState(false);

  const quizTitle = quizList.find((q) => q.id === quizId)?.title ?? 'Asesmen';

  function handleGenerate() {
    if (!quizId || !positionName.trim() || !companyName.trim()) return;
    const invite = createAssessmentInvitation({
      quizId,
      quizTitle,
      orgName: companyName,
      targetPosition: positionName,
    });
    setGeneratedInvite(invite);
    onCreated(invite);
  }

  async function handleCopy() {
    if (!generatedInvite) return;
    try {
      await navigator.clipboard.writeText(buildInviteUrl(generatedInvite));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore clipboard errors
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-xl shadow-xl overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D4D4CE] dark:border-[#282E3D]">
          <div>
            <h3 className="text-base font-bold text-[#18181B] dark:text-white">
              Buat Undangan Asesmen
            </h3>
            {targetCandidate && (
              <p className="text-xs text-[#71717A] dark:text-slate-400 mt-0.5">
                untuk {targetCandidate.full_name}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-[#A1A1AA] hover:text-[#52525B] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal body */}
        <div className="px-5 py-4 space-y-4">
          {/* Quiz selector */}
          <div>
            <label className="block text-xs font-semibold text-[#52525B] dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Pilih Kuis / Tes
            </label>
            <div className="relative">
              <select
                value={quizId}
                onChange={(e) => setQuizId(e.target.value)}
                className="w-full border border-[#D4D4CE] dark:border-[#282E3D] rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-[#0D1117] text-[#18181B] dark:text-slate-100 appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              >
                {quizList.length === 0 && (
                  <option value="">— Belum ada kuis tersedia —</option>
                )}
                {quizList.map((q) => (
                  <option key={q.id} value={q.id}>{q.title}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA] pointer-events-none" />
            </div>
          </div>

          {/* Position name */}
          <div>
            <label className="block text-xs font-semibold text-[#52525B] dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Nama Posisi
            </label>
            <input
              type="text"
              value={positionName}
              onChange={(e) => setPositionName(e.target.value)}
              placeholder="cth. Data Analyst"
              className="w-full border border-[#D4D4CE] dark:border-[#282E3D] rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-[#0D1117] text-[#18181B] dark:text-slate-100 placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
          </div>

          {/* Company name */}
          <div>
            <label className="block text-xs font-semibold text-[#52525B] dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Nama Perusahaan
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="cth. PT Maju Bersama"
              className="w-full border border-[#D4D4CE] dark:border-[#282E3D] rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-[#0D1117] text-[#18181B] dark:text-slate-100 placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
          </div>

          {/* Generated link */}
          {generatedInvite && (
            <div className="bg-[#F4F4F1] dark:bg-slate-800/60 border border-[#D4D4CE] dark:border-[#282E3D] rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] dark:text-teal-400">
                <Link2 className="w-3.5 h-3.5" />
                Tautan Undangan
              </div>
              <code className="block text-[11px] text-[#52525B] dark:text-slate-400 break-all leading-relaxed font-mono">
                {buildInviteUrl(generatedInvite)}
              </code>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] dark:text-teal-400 hover:underline"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Disalin!' : 'Salin Tautan'}
              </button>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#D4D4CE] dark:border-[#282E3D] bg-[#FAFAF9] dark:bg-[#0D1117]">
          <Button variant="secondary" size="sm" onClick={onClose}>Tutup</Button>
          {!generatedInvite ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerate}
              disabled={!quizId || !positionName.trim() || !companyName.trim()}
            >
              <Link2 className="w-3.5 h-3.5" />
              Generate Tautan
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleCopy}>
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Disalin!' : 'Salin Tautan'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function RecruiterPortalPage() {
  // ── State ──
  const [activeTab, setActiveTab] = useState<ActiveTab>('kandidat');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('Semua');
  const [readinessFilter, setReadinessFilter] = useState<ReadinessFilter>('Semua');
  const [minRadar, setMinRadar] = useState(0);
  const [minKraepelinSpeed, setMinKraepelinSpeed] = useState(0);
  const [minKraepelinAccuracy, setMinKraepelinAccuracy] = useState(0);
  const [shortlistIds, setShortlistIds] = useState<string[]>(() => getShortlistedIds());
  const [inviteTarget, setInviteTarget] = useState<RecruiterCandidate | null>(null);
  const [invites, setInvites] = useState<AssessmentInvitation[]>(() => getStoredInvitations());
  const [filterOpen, setFilterOpen] = useState(false);

  // ── Static candidate data (demo seed) ──
  const candidates: RecruiterCandidate[] = INITIAL_RECRUITER_CANDIDATES;

  // ── Static quiz list (demo) ──
  const quizList = [
    { id: 'bumn-tkd-core-values', title: 'Simulasi TKD & Core Values BUMN' },
    { id: 'sql-mastery-eval', title: 'SQL Sandbox Technical Screening' },
    { id: 'psikotest-5d-std', title: 'Psikotest 5D Standard' },
    { id: 'kraepelin-full', title: 'Kraepelin Full Session' },
  ];

  // ── Derived ──
  const shortlistSet = useMemo(() => new Set(shortlistIds), [shortlistIds]);

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      if (search && !c.full_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter !== 'Semua' && c.category !== categoryFilter) return false;
      if (readinessFilter !== 'Semua' && c.readiness_status !== readinessFilter) return false;
      if (radarAvg(c.radar_scores) < minRadar) return false;
      if (minKraepelinSpeed > 0 && (c.kraepelin_summary?.speed_wpm ?? 0) < minKraepelinSpeed) return false;
      if (minKraepelinAccuracy > 0 && (c.kraepelin_summary?.accuracy_pct ?? 0) < minKraepelinAccuracy) return false;
      return true;
    });
  }, [candidates, search, categoryFilter, readinessFilter, minRadar, minKraepelinSpeed, minKraepelinAccuracy]);

  const shortlistedCandidates = useMemo(
    () => candidates.filter((c) => shortlistSet.has(c.id)),
    [candidates, shortlistSet]
  );

  const metrics = useMemo(() => ({
    total: candidates.length,
    jobReady: candidates.filter((c) => c.readiness_status === 'ready').length,
    shortlisted: shortlistIds.length,
    activeInvites: invites.filter((inv) =>
      !inv.expires_at || new Date(inv.expires_at) > new Date()
    ).length,
  }), [candidates, shortlistIds, invites]);

  // ── Handlers ──
  function handleToggleShortlist(id: string) {
    toggleCandidateShortlist(id);
    setShortlistIds(getShortlistedIds());
  }

  function handleRemoveFromShortlist(id: string) {
    toggleCandidateShortlist(id);
    setShortlistIds(getShortlistedIds());
  }

  function handleInviteCreated(invite: AssessmentInvitation) {
    setInvites((prev) => [invite, ...prev]);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Page header ── */}
        <header className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#71717A] dark:text-slate-500 font-medium uppercase tracking-widest">
            <Briefcase className="w-3.5 h-3.5" />
            LokaTalenta · Portal Rekruter
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18181B] dark:text-white">
            Rekrut Kandidat Terbaik
          </h1>
          <p className="text-sm text-[#71717A] dark:text-slate-400 max-w-xl">
            Filter kandidat berdasarkan skor Radar 5D (Kognitif, Logika, Ketahanan, Komunikasi,
            Spasial) dan Kraepelin. Simpan ke shortlist dan kirim undangan asesmen kustom.
          </p>
        </header>

        {/* ── Metric strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="Total Kandidat" value={metrics.total} sub="terdaftar" />
          <MetricCard label="Siap Kerja" value={metrics.jobReady} sub="readiness: ready" />
          <MetricCard label="Di Shortlist" value={metrics.shortlisted} sub="tersimpan" />
          <MetricCard label="Undangan Aktif" value={metrics.activeInvites} sub="belum kadaluarsa" />
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-0 border-b border-[#D4D4CE] dark:border-[#282E3D]">
          {(
            [
              { id: 'kandidat' as const, icon: Users, label: 'Semua Kandidat' },
              {
                id: 'shortlist' as const,
                icon: ClipboardList,
                label: `Shortlist (${shortlistIds.length})`,
              },
            ] as const
          ).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                activeTab === id
                  ? 'border-[#0F766E] text-[#0F766E] dark:text-teal-400 dark:border-teal-400'
                  : 'border-transparent text-[#71717A] dark:text-slate-400 hover:text-[#18181B] dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── KANDIDAT TAB ── */}
        {activeTab === 'kandidat' && (
          <div className="space-y-5">
            {/* Search + filter bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama kandidat..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-[#D4D4CE] dark:border-[#282E3D] rounded-lg bg-white dark:bg-[#161B22] text-[#18181B] dark:text-slate-100 placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
              <button
                onClick={() => setFilterOpen((p) => !p)}
                className={`inline-flex items-center gap-2 text-sm font-medium px-3 py-2 border rounded-lg transition-colors ${
                  filterOpen
                    ? 'border-[#0F766E] text-[#0F766E] dark:text-teal-400 bg-[#F0FDFA] dark:bg-teal-950/40'
                    : 'border-[#D4D4CE] dark:border-[#282E3D] text-[#52525B] dark:text-slate-400 hover:border-[#0F766E] hover:text-[#0F766E]'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filter Multi-Dimensi
              </button>
            </div>

            {/* Collapsible filter panel */}
            {filterOpen && (
              <div className="border border-[#D4D4CE] dark:border-[#282E3D] rounded-lg p-4 bg-[#FAFAF9] dark:bg-[#0D1117] space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-[#52525B] dark:text-slate-400 mb-2 uppercase tracking-wide">
                      Kategori
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                            categoryFilter === cat
                              ? 'bg-[#0F766E] text-white border-[#0F766E]'
                              : 'border-[#D4D4CE] dark:border-[#282E3D] text-[#52525B] dark:text-slate-400 hover:border-[#0F766E] hover:text-[#0F766E]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Readiness */}
                  <div>
                    <label className="block text-xs font-semibold text-[#52525B] dark:text-slate-400 mb-2 uppercase tracking-wide">
                      Status Kesiapan
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {READINESS_OPTS.map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => setReadinessFilter(value)}
                          className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                            readinessFilter === value
                              ? 'bg-[#0F766E] text-white border-[#0F766E]'
                              : 'border-[#D4D4CE] dark:border-[#282E3D] text-[#52525B] dark:text-slate-400 hover:border-[#0F766E] hover:text-[#0F766E]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Numeric sliders */}
                  <div className="space-y-3">
                    <div>
                      <label className="flex justify-between text-xs font-semibold text-[#52525B] dark:text-slate-400 mb-1 uppercase tracking-wide">
                        <span>Min Radar 5D Avg</span>
                        <span className="tabular-nums text-[#0F766E]">{minRadar}</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={minRadar}
                        onChange={(e) => setMinRadar(Number(e.target.value))}
                        className="w-full accent-[#0F766E]"
                      />
                    </div>
                    <div>
                      <label className="flex justify-between text-xs font-semibold text-[#52525B] dark:text-slate-400 mb-1 uppercase tracking-wide">
                        <span>Min Kecepatan (WPM)</span>
                        <span className="tabular-nums text-[#0F766E]">{minKraepelinSpeed}</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={150}
                        step={5}
                        value={minKraepelinSpeed}
                        onChange={(e) => setMinKraepelinSpeed(Number(e.target.value))}
                        className="w-full accent-[#0F766E]"
                      />
                    </div>
                    <div>
                      <label className="flex justify-between text-xs font-semibold text-[#52525B] dark:text-slate-400 mb-1 uppercase tracking-wide">
                        <span>Min Ketelitian (%)</span>
                        <span className="tabular-nums text-[#0F766E]">{minKraepelinAccuracy}</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={minKraepelinAccuracy}
                        onChange={(e) => setMinKraepelinAccuracy(Number(e.target.value))}
                        className="w-full accent-[#0F766E]"
                      />
                    </div>
                  </div>
                </div>

                {/* Reset */}
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCategoryFilter('Semua');
                      setReadinessFilter('Semua');
                      setMinRadar(0);
                      setMinKraepelinSpeed(0);
                      setMinKraepelinAccuracy(0);
                    }}
                  >
                    Reset Filter
                  </Button>
                </div>
              </div>
            )}

            {/* Results count */}
            <p className="text-xs text-[#71717A] dark:text-slate-500">
              Menampilkan{' '}
              <strong className="text-[#18181B] dark:text-slate-200">{filtered.length}</strong>{' '}
              dari {candidates.length} kandidat
            </p>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="text-sm text-center py-16 text-[#71717A] dark:text-slate-400">
                Tidak ada kandidat yang sesuai filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((candidate) => (
                  <CandidateCardItem
                    key={candidate.id}
                    candidate={candidate}
                    isShortlisted={shortlistSet.has(candidate.id)}
                    onToggleShortlist={handleToggleShortlist}
                    onSendInvite={(c) => setInviteTarget(c)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SHORTLIST TAB ── */}
        {activeTab === 'shortlist' && (
          <div className="space-y-5">
            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => exportShortlistCsv(shortlistedCandidates)}
                disabled={shortlistedCandidates.length === 0}
              >
                <Download className="w-4 h-4" />
                Ekspor CSV Shortlist
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (shortlistedCandidates.length > 0) {
                    setInviteTarget(shortlistedCandidates[0]);
                  }
                }}
                disabled={shortlistedCandidates.length === 0}
              >
                <MailPlus className="w-4 h-4" />
                Kirim Undangan Asesmen
              </Button>
            </div>

            {/* Shortlist rows */}
            <div className="border border-[#D4D4CE] dark:border-[#282E3D] rounded-lg bg-white dark:bg-[#161B22]">
              {shortlistedCandidates.length === 0 ? (
                <div className="text-sm text-center py-16 text-[#71717A] dark:text-slate-400">
                  Belum ada kandidat di shortlist. Klik{' '}
                  <strong className="text-[#18181B] dark:text-slate-200">Simpan</strong> pada
                  kartu kandidat.
                </div>
              ) : (
                <div className="px-4">
                  {shortlistedCandidates.map((c) => (
                    <ShortlistRow
                      key={c.id}
                      candidate={c}
                      onRemove={handleRemoveFromShortlist}
                      onSendInvite={(cand) => setInviteTarget(cand)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Invite history */}
            {invites.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#18181B] dark:text-white flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-[#0F766E]" />
                  Riwayat Undangan ({invites.length})
                </h3>
                <div className="border border-[#D4D4CE] dark:border-[#282E3D] rounded-lg bg-white dark:bg-[#161B22] divide-y divide-[#F4F4F5] dark:divide-slate-800 overflow-hidden">
                  {invites.map((inv) => {
                    const isExpired = inv.expires_at ? new Date(inv.expires_at) < new Date() : false;
                    return (
                      <div key={inv.id} className="px-4 py-3 flex flex-wrap items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-[#18181B] dark:text-white">
                              {inv.target_position}
                            </span>
                            <span className="text-[11px] text-[#71717A] dark:text-slate-400">
                              @ {inv.org_name}
                            </span>
                            {isExpired ? (
                              <Badge tone="rose">Kadaluarsa</Badge>
                            ) : (
                              <Badge tone="emerald">Aktif</Badge>
                            )}
                            {inv.candidates_count > 0 && (
                              <Badge tone="slate">{inv.candidates_count} kandidat</Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-[#A1A1AA] dark:text-slate-500 mt-0.5">
                            {inv.quiz_title} · Token: <span className="font-mono">{inv.invite_token}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => navigator.clipboard.writeText(buildInviteUrl(inv))}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F766E] dark:text-teal-400 hover:underline"
                          title="Salin tautan undangan"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Salin
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Invite Modal ── */}
      {inviteTarget !== null && (
        <InviteModal
          targetCandidate={inviteTarget}
          quizList={quizList}
          onClose={() => setInviteTarget(null)}
          onCreated={handleInviteCreated}
        />
      )}
    </>
  );
}

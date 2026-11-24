import {
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  History,
  MessageSquareQuote,
  Pause,
  Play,
  RotateCcw,
  Save,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  computeStarCompleteness,
  STAR_INTERVIEW_SCENARIOS,
  type StarAttemptRecord,
} from '../../shared/data/starInterviewScenarios';
import { isSupabaseConfigured, supabase } from '../../shared/lib/supabase';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { useAuthStore } from '../auth/useAuthStore';

const STAR_STORAGE_KEY = 'lokatalenta_star_attempts_v1';

function readLocalStarAttempts(userId: string): StarAttemptRecord[] {
  try {
    const raw = localStorage.getItem(STAR_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StarAttemptRecord[];
    return parsed.filter((item) => item.user_id === userId);
  } catch {
    return [];
  }
}

function writeLocalStarAttempt(record: StarAttemptRecord): void {
  try {
    const raw = localStorage.getItem(STAR_STORAGE_KEY);
    const existing = raw ? (JSON.parse(raw) as StarAttemptRecord[]) : [];
    const next = [record, ...existing].slice(0, 50);
    localStorage.setItem(STAR_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage quota errors
  }
}

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function StarInterviewLab() {
  const { user } = useAuthStore();
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const scenario = STAR_INTERVIEW_SCENARIOS[scenarioIdx] ?? STAR_INTERVIEW_SCENARIOS[0];

  const [situation, setSituation] = useState('');
  const [task, setTask] = useState('');
  const [action, setAction] = useState('');
  const [result, setResult] = useState('');
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [showSample, setShowSample] = useState(false);

  const [elapsedSec, setElapsedSec] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');
  const [attempts, setAttempts] = useState<StarAttemptRecord[]>([]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    const uid = user?.id ?? 'guest';
    let cancelled = false;

    async function loadAttempts() {
      if (isSupabaseConfigured && supabase && user?.id) {
        try {
          const { data, error } = await supabase
            .from('star_interview_attempts')
            .select(
              'id, user_id, scenario_id, scenario_title, situation, task, action, result, checked_items, duration_seconds, word_count, completeness_score, created_at'
            )
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);
          if (!error && data && !cancelled) {
            setAttempts(data as StarAttemptRecord[]);
            return;
          }
        } catch {
          // fall through to localStorage
        }
      }
      if (!cancelled) {
        setAttempts(readLocalStarAttempts(uid));
      }
    }

    void loadAttempts();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const metrics = useMemo(
    () =>
      computeStarCompleteness({
        situation,
        task,
        action,
        result,
        checkedCount: checkedIds.length,
        totalChecklist: scenario.checklist.length,
      }),
    [situation, task, action, result, checkedIds.length, scenario.checklist.length]
  );

  const handleSelectScenario = (idx: number) => {
    setScenarioIdx(idx);
    setSituation('');
    setTask('');
    setAction('');
    setResult('');
    setCheckedIds([]);
    setShowSample(false);
    setElapsedSec(0);
    setTimerRunning(false);
    setSavedNotice('');
  };

  const toggleChecklist = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleFillSample = () => {
    setSituation(scenario.sampleOutline.situation);
    setTask(scenario.sampleOutline.task);
    setAction(scenario.sampleOutline.action);
    setResult(scenario.sampleOutline.result);
    setCheckedIds(scenario.checklist.map((c) => c.id));
  };

  const handleSaveAttempt = async () => {
    if (metrics.wordCount < 10) {
      setSavedNotice('Isi minimal beberapa kalimat pada kotak STAR sebelum menyimpan.');
      return;
    }
    setSaving(true);
    setSavedNotice('');
    setTimerRunning(false);

    const uid = user?.id ?? 'guest';
    const localRecord: StarAttemptRecord = {
      id: `star-${Date.now()}`,
      user_id: uid,
      scenario_id: scenario.id,
      scenario_title: scenario.title,
      situation: situation.trim(),
      task: task.trim(),
      action: action.trim(),
      result: result.trim(),
      checked_items: checkedIds,
      duration_seconds: elapsedSec,
      word_count: metrics.wordCount,
      completeness_score: metrics.score,
      created_at: new Date().toISOString(),
    };

    try {
      if (isSupabaseConfigured && supabase && user?.id) {
        const { data, error } = await supabase
          .from('star_interview_attempts')
          .insert({
            user_id: user.id,
            scenario_id: scenario.id,
            scenario_title: scenario.title,
            situation: localRecord.situation,
            task: localRecord.task,
            action: localRecord.action,
            result: localRecord.result,
            checked_items: checkedIds,
            duration_seconds: elapsedSec,
            word_count: metrics.wordCount,
            completeness_score: metrics.score,
          })
          .select(
            'id, user_id, scenario_id, scenario_title, situation, task, action, result, checked_items, duration_seconds, word_count, completeness_score, created_at'
          )
          .single();

        if (!error && data) {
          setAttempts((prev) => [data as StarAttemptRecord, ...prev].slice(0, 10));
          setSavedNotice('Latihan STAR tersimpan ke cloud.');
          setSaving(false);
          return;
        }
      }

      writeLocalStarAttempt(localRecord);
      setAttempts((prev) => [localRecord, ...prev].slice(0, 10));
      setSavedNotice('Latihan STAR tersimpan.');
    } catch {
      writeLocalStarAttempt(localRecord);
      setAttempts((prev) => [localRecord, ...prev].slice(0, 10));
      setSavedNotice('Latihan STAR tersimpan lokal.');
    } finally {
      setSaving(false);
    }
  };

  const starBoxes: Array<{
    key: 'situation' | 'task' | 'action' | 'result';
    letter: string;
    label: string;
    value: string;
    onChange: (val: string) => void;
    tip: string;
    placeholder: string;
  }> = [
    {
      key: 'situation',
      letter: 'S',
      label: 'Situation (Situasi)',
      value: situation,
      onChange: setSituation,
      tip: scenario.tips.situation,
      placeholder: 'Jelaskan konteks, waktu, dan tantangan yang terjadi...',
    },
    {
      key: 'task',
      letter: 'T',
      label: 'Task (Tugas & Tanggung Jawab)',
      value: task,
      onChange: setTask,
      tip: scenario.tips.task,
      placeholder: 'Apa peran spesifik dan target yang harus Anda capai?',
    },
    {
      key: 'action',
      letter: 'A',
      label: 'Action (Tindakan Konkret)',
      value: action,
      onChange: setAction,
      tip: scenario.tips.action,
      placeholder: 'Langkah nyata apa yang Anda lakukan? Fokus pada kontribusi Anda...',
    },
    {
      key: 'result',
      letter: 'R',
      label: 'Result (Hasil & Dampak)',
      value: result,
      onChange: setResult,
      tip: scenario.tips.result,
      placeholder: 'Apa hasil terukur (%, waktu, biaya, atau feedback) yang tercapai?',
    },
  ];

  const overRecommended = elapsedSec > scenario.recommendedMinutes * 60;

  return (
    <div className="space-y-4">
      {/* Scenario Selector */}
      <div className="flex flex-wrap items-center gap-1.5">
        {STAR_INTERVIEW_SCENARIOS.map((sc, idx) => (
          <button
            key={sc.id}
            type="button"
            onClick={() => handleSelectScenario(idx)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              scenarioIdx === idx
                ? 'bg-[#0F766E] text-white'
                : 'bg-[#F6F5F1] dark:bg-slate-800 text-[#52525B] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {idx + 1}. {sc.title}
          </button>
        ))}
      </div>

      {/* Prompt & Timer Header */}
      <div className="p-4 rounded-xl bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-[240px]">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="emerald">{scenario.competency}</Badge>
              <Badge tone="slate">{scenario.difficulty}</Badge>
              <span className="text-[11px] text-[#71717A] dark:text-slate-400">
                Target: {scenario.targetRole}
              </span>
            </div>
            <p className="text-sm font-semibold text-[#18181B] dark:text-white flex items-start gap-2 pt-1">
              <MessageSquareQuote className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
              <span>{scenario.prompt}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono-tabular font-bold flex items-center gap-1.5 ${
                overRecommended
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                  : 'bg-white dark:bg-slate-800 border-[#E5E3DC] dark:border-slate-700 text-[#18181B] dark:text-white'
              }`}
              title={`Rekomendasi durasi: ${scenario.recommendedMinutes} menit`}
            >
              <Clock className="w-3.5 h-3.5 text-[#0F766E]" />
              {formatTimer(elapsedSec)}
              <span className="text-[10px] font-normal text-[#71717A] dark:text-slate-400">
                / {scenario.recommendedMinutes}m
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setTimerRunning((v) => !v)}
            >
              {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {timerRunning ? 'Jeda' : 'Mulai'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTimerRunning(false);
                setElapsedSec(0);
              }}
              aria-label="Reset timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E5E3DC] dark:border-slate-800">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-[#52525B] dark:text-slate-300">
              Skor Kelengkapan STAR:{' '}
              <strong className="font-mono-tabular text-[#0F766E] dark:text-teal-400">
                {metrics.score}%
              </strong>
            </span>
            <span className="text-[#71717A] dark:text-slate-400 font-mono-tabular">
              {metrics.wordCount} kata • {metrics.filledSections}/4 bagian terisi
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSample((v) => !v)}
            >
              {showSample ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showSample ? 'Sembunyikan Contoh' : 'Lihat Contoh'}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleFillSample}>
              <Sparkles className="w-3.5 h-3.5" />
              Isi Kerangka Contoh
            </Button>
          </div>
        </div>

        {showSample && (
          <div className="p-3 rounded-lg bg-white dark:bg-slate-800/80 border border-[#E5E3DC] dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-bold text-[#0F766E]">S:</span> {scenario.sampleOutline.situation}
            </div>
            <div>
              <span className="font-bold text-[#0F766E]">T:</span> {scenario.sampleOutline.task}
            </div>
            <div>
              <span className="font-bold text-[#0F766E]">A:</span> {scenario.sampleOutline.action}
            </div>
            <div>
              <span className="font-bold text-[#0F766E]">R:</span> {scenario.sampleOutline.result}
            </div>
          </div>
        )}
      </div>

      {/* 4-Box STAR Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {starBoxes.map((box) => (
          <div
            key={box.key}
            className="p-3.5 rounded-xl border border-[#E5E3DC] dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor={`star-${box.key}`}
                className="text-xs font-bold text-[#18181B] dark:text-white flex items-center gap-2"
              >
                <span className="w-5 h-5 rounded-md bg-[#0F766E] text-white text-[11px] font-bold inline-flex items-center justify-center">
                  {box.letter}
                </span>
                {box.label}
              </label>
              <span className="text-[11px] font-mono-tabular text-[#71717A] dark:text-slate-400">
                {box.value.trim().split(/\s+/).filter(Boolean).length} kata
              </span>
            </div>
            <p className="text-[11px] text-[#71717A] dark:text-slate-400 leading-relaxed">
              {box.tip}
            </p>
            <textarea
              id={`star-${box.key}`}
              rows={3}
              value={box.value}
              onChange={(e) => {
                if (!timerRunning && elapsedSec === 0) setTimerRunning(true);
                box.onChange(e.target.value);
              }}
              placeholder={box.placeholder}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800 text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
            />
          </div>
        ))}
      </div>

      {/* Competency Checklist + Save */}
      <div className="p-4 rounded-xl border border-[#E5E3DC] dark:border-slate-800 bg-[#F6F5F1] dark:bg-slate-900 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wide text-[#52525B] dark:text-slate-300">
            Checklist Kompetensi Jawaban ({checkedIds.length}/{scenario.checklist.length})
          </h4>
          {savedNotice && (
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {savedNotice}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {scenario.checklist.map((item) => {
            const checked = checkedIds.includes(item.id);
            return (
              <label
                key={item.id}
                className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                  checked
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-white dark:bg-slate-800 border-[#E5E3DC] dark:border-slate-700 text-[#52525B] dark:text-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleChecklist(item.id)}
                  className="mt-0.5 accent-[#0F766E]"
                />
                <span>{item.label}</span>
              </label>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSelectScenario(scenarioIdx)}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Bersihkan Jawaban
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveAttempt}
            disabled={saving}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Menyimpan...' : 'Simpan Latihan STAR'}
          </Button>
        </div>
      </div>

      {/* Recent Saved Attempts */}
      {attempts.length > 0 && (
        <div className="p-4 rounded-xl border border-[#E5E3DC] dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wide text-[#71717A] dark:text-slate-400 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-[#0F766E]" />
            Riwayat Latihan STAR Terbaru
          </h4>
          <div className="space-y-2">
            {attempts.slice(0, 4).map((att) => (
              <div
                key={att.id}
                className="p-2.5 rounded-lg bg-[#F6F5F1] dark:bg-slate-800/80 border border-[#E5E3DC] dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-semibold text-[#18181B] dark:text-white">
                    {att.scenario_title}
                  </span>
                  <span className="text-[#71717A] dark:text-slate-400 ml-2">
                    {new Date(att.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono-tabular">
                  <Badge tone={att.completeness_score >= 75 ? 'emerald' : 'amber'}>
                    Skor {att.completeness_score}%
                  </Badge>
                  <span className="text-[#71717A] dark:text-slate-400">
                    {att.word_count} kata • {formatTimer(att.duration_seconds)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default StarInterviewLab;

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, HelpCircle, StickyNote, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Lesson } from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import {
  getLessonNote,
  saveLessonNoteAsync,
  syncLessonNoteFromServer,
} from './lessonNotesStorage';

interface QuickCheckQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

function buildQuickCheck(lesson: Lesson): QuickCheckQuestion {
  const voiceLines = lesson.voice_lines ?? [];
  if (voiceLines.length >= 2) {
    const target = voiceLines[0];
    const distractors = voiceLines
      .slice(1, 4)
      .map((v) => v.translation)
      .filter((t) => t !== target.translation);
    const options = [target.translation, ...distractors.slice(0, 2)];
    if (options.length < 2) options.push('Tidak ada yang tepat');
    return {
      prompt: `Apa arti / padanan yang tepat untuk "${target.text}"?`,
      options,
      correctIndex: 0,
      explanation: `"${target.text}"${target.romaji ? ` (${target.romaji})` : ''} berarti "${target.translation}".`,
    };
  }

  return {
    prompt: `Manakah langkah belajar terbaik setelah memahami "${lesson.title}"?`,
    options: [
      'Mencatat poin inti dan mencoba latihan soal terkait',
      'Melewati semua latihan tanpa evaluasi',
      'Menghafal tanpa memahami pola atau contoh',
    ],
    correctIndex: 0,
    explanation:
      'Mencatat poin inti dan langsung menguji pemahaman lewat latihan memperkuat retensi jangka panjang.',
  };
}

export function LessonNotesAndCheckPanel({
  userId,
  lesson,
}: {
  userId: string;
  lesson: Lesson;
}) {
  const [activeTab, setActiveTab] = useState<'check' | 'notes'>('check');
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const [note, setNote] = useState(() => getLessonNote(userId, lesson.id));
  const [noteSaved, setNoteSaved] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);

  useQuery({
    queryKey: ['lesson-note-sync', userId, lesson.id],
    queryFn: async () => {
      const synced = await syncLessonNoteFromServer(userId, lesson.id);
      if (synced && synced !== note) {
        setNote(synced);
      }
      return synced;
    },
    enabled: Boolean(userId && lesson.id),
  });

  const quickCheck = useMemo(() => buildQuickCheck(lesson), [lesson]);

  const handleSaveNote = async () => {
    const res = await saveLessonNoteAsync(userId, lesson.id, note);
    setCloudSynced(res.syncedToCloud);
    setNoteSaved(true);
    window.setTimeout(() => setNoteSaved(false), 2500);
  };

  return (
    <div className="rounded-2xl border border-[#D4D4CE] dark:border-[#282E3D] bg-[#F4F4F1]/70 dark:bg-slate-900/60 p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('check')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border cursor-pointer transition-colors ${
              activeTab === 'check'
                ? 'bg-[#0F766E] text-white border-[#0F766E]'
                : 'bg-white dark:bg-[#161B22] text-[#52525B] dark:text-slate-300 border-[#D4D4CE] dark:border-[#282E3D]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Quick Check
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border cursor-pointer transition-colors ${
              activeTab === 'notes'
                ? 'bg-[#0F766E] text-white border-[#0F766E]'
                : 'bg-white dark:bg-[#161B22] text-[#52525B] dark:text-slate-300 border-[#D4D4CE] dark:border-[#282E3D]'
            }`}
          >
            <StickyNote className="w-3.5 h-3.5" />
            Catatan Pribadi
          </button>
        </div>
        <Badge tone="slate">Interaktif</Badge>
      </div>

      {activeTab === 'check' ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[#18181B] dark:text-white">
            {quickCheck.prompt}
          </p>
          <div className="space-y-2">
            {quickCheck.options.map((opt, idx) => {
              const isSelected = selectedOpt === idx;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setSelectedOpt(idx);
                    setChecked(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-teal-950/60 border-[#0F766E] text-[#18181B] dark:text-white font-semibold'
                      : 'bg-white dark:bg-[#161B22] border-[#D4D4CE] dark:border-[#282E3D] text-[#52525B] dark:text-slate-300'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {selectedOpt !== null && !checked && (
            <Button size="sm" onClick={() => setChecked(true)}>
              Cek Pemahaman
            </Button>
          )}

          {checked && selectedOpt !== null && (
            <div
              className={`p-3 rounded-xl border text-xs space-y-1 ${
                selectedOpt === quickCheck.correctIndex
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
              }`}
            >
              <p className="font-bold inline-flex items-center gap-1">
                {selectedOpt === quickCheck.correctIndex ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Tepat sekali!
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" /> Kurang tepat, coba perhatikan lagi:
                  </>
                )}
              </p>
              <p>{quickCheck.explanation}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tulis rangkuman, rumus cepat, atau catatan pribadi untuk materi ini..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D4CE] dark:border-[#282E3D] bg-white dark:bg-[#161B22] text-sm text-[#18181B] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-[#71717A] dark:text-slate-400">
              {noteSaved
                ? cloudSynced
                  ? 'Catatan tersimpan ke cloud & perangkat Anda.'
                  : 'Catatan tersimpan di perangkat Anda.'
                : 'Tersimpan per materi pelajaran.'}
            </span>
            <Button size="sm" variant="secondary" onClick={handleSaveNote}>
              Simpan Catatan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

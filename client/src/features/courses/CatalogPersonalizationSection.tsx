import { ArrowRight, BookOpen, CheckCircle2, Circle, Compass, Flame, PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Course } from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { ProgressBar } from '../../shared/ui/ProgressBar';

import {
  getSavedDailyXpTarget,
  getSavedLearningGoal,
  saveDailyXpTarget,
  saveLearningGoal,
  type DailyXpTarget,
  type LearningGoalId,
} from './learningGoalStorage';

const GOALS: { id: LearningGoalId; label: string; desc: string }[] = [
  { id: 'psikotes', label: 'Lolos Psikotes Kerja', desc: 'Ritel modern & korporasi swasta' },
  { id: 'cpns_bumn', label: 'Seleksi BUMN & CPNS', desc: 'TKD, Core Values & SKD CAT' },
  { id: 'japanese', label: 'Bahasa Jepang dari 0', desc: 'Hiragana, Katakana, Kanji & JLPT' },
  { id: 'korean', label: 'Bahasa Korea dari 0', desc: 'Hangeul, kosakata & TOPIK' },
  { id: 'english', label: 'Bahasa Inggris & Karier', desc: 'Grammar, speaking & dunia kerja' },
];

const XP_TARGETS: { value: DailyXpTarget; label: string }[] = [
  { value: 30, label: '30 XP Santai' },
  { value: 60, label: '60 XP Fokus' },
  { value: 100, label: '100 XP Intensif' },
];

export function CatalogPersonalizationSection({
  courses,
  enrolledIds,
  completedIds,
  attemptsCount = 0,
  isLoggedIn,
  onOpenTarget,
}: {
  courses: Course[];
  enrolledIds: string[];
  completedIds: string[];
  attemptsCount?: number;
  isLoggedIn: boolean;
  onOpenTarget: (e: React.MouseEvent, path: string) => void;
}) {
  const [goal, setGoal] = useState<LearningGoalId>(() => getSavedLearningGoal());
  const [xpTarget, setXpTarget] = useState<DailyXpTarget>(() => getSavedDailyXpTarget());

  const selectGoal = (next: LearningGoalId) => {
    setGoal(next);
    saveLearningGoal(next);
  };

  const selectXpTarget = (next: DailyXpTarget) => {
    setXpTarget(next);
    saveDailyXpTarget(next);
  };

  const enrolledCourses = courses
    .filter((c) => enrolledIds.includes(c.id))
    .slice(0, 3);

  const recommendedCourses = courses
    .filter((c) => {
      const text = `${c.category} ${c.title}`.toLowerCase();
      if (goal === 'psikotes') return text.includes('psikotes') || text.includes('retail');
      if (goal === 'cpns_bumn')
        return text.includes('bumn') || text.includes('cpns') || text.includes('psikotes');
      if (goal === 'japanese') return text.includes('jepang') || text.includes('hiragana');
      if (goal === 'korean') return text.includes('korea') || text.includes('hangeul');
      return text.includes('inggris') || text.includes('karier') || text.includes('kerja');
    })
    .slice(0, 3);

  const quests = [
    {
      id: 'enroll',
      label: 'Ikuti minimal 1 kursus atau simulasi',
      done: enrolledIds.length >= 1,
    },
    {
      id: 'lesson',
      label: 'Selesaikan minimal 1 materi belajar',
      done: completedIds.length >= 1,
    },
    {
      id: 'quiz',
      label: 'Kerjakan minimal 1 evaluasi / psikotes',
      done: attemptsCount >= 1,
    },
  ];
  const questsDone = quests.filter((q) => q.done).length;

  return (
    <div className="space-y-6">
      {/* Interactive Daily Quests / Learning Checklist (Logged-in Students) */}
      {isLoggedIn && (
        <section className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#D97706]" />
              <h2 className="text-base font-bold text-[#18181B] dark:text-white">
                Misi Belajar Aktif
              </h2>
            </div>
            <Badge tone={questsDone === quests.length ? 'emerald' : 'amber'}>
              {questsDone}/{quests.length} Selesai
            </Badge>
          </div>
          <ProgressBar
            value={Math.round((questsDone / quests.length) * 100)}
            tone={questsDone === quests.length ? 'emerald' : 'amber'}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {quests.map((q) => (
              <div
                key={q.id}
                className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                  q.done
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-[#F6F5F1] dark:bg-slate-900 border-[#E5E3DC] dark:border-slate-800 text-[#52525B] dark:text-slate-300'
                }`}
              >
                {q.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-[#A1A1AA] shrink-0" />
                )}
                <span className={q.done ? 'font-semibold' : 'font-medium'}>{q.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Continue Learning Bar (Logged-in Students) */}
      {isLoggedIn && enrolledCourses.length > 0 && (
        <section className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-[#0F766E]" />
              Lanjutkan Belajar Anda
            </h2>
            <Link
              to="/profile"
              className="text-xs font-semibold text-[#0F766E] dark:text-teal-400 hover:underline"
            >
              Lihat Semua Progres
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {enrolledCourses.map((c) => {
              const allLessons = (c.modules ?? []).flatMap((m) => m.lessons);
              const done = allLessons.filter((l) => completedIds.includes(l.id)).length;
              const pct = allLessons.length > 0 ? Math.round((done / allLessons.length) * 100) : 0;
              return (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-[#F6F5F1] dark:bg-slate-800/60 border border-[#E5E3DC] dark:border-slate-700 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[#0F766E] dark:text-teal-400">
                      {c.category}
                    </span>
                    <p className="text-sm font-bold text-[#18181B] dark:text-white line-clamp-1">
                      {c.title}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-[#71717A] dark:text-slate-400">
                      <span>{done}/{allLessons.length} materi</span>
                      <span className="font-mono-tabular font-semibold">{pct}%</span>
                    </div>
                    <ProgressBar value={pct} tone="emerald" />
                    <Link
                      to={`/courses/${c.slug}`}
                      onClick={(e) => onOpenTarget(e, `/courses/${c.slug}`)}
                      className="block pt-1"
                    >
                      <Button size="sm" className="w-full">
                        Lanjutkan
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Onboarding Goal Picker + Recommendations */}
      <section className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#0F766E]" />
            <h2 className="text-base font-bold text-[#18181B] dark:text-white">
              Rekomendasi Jalur Belajar Sesuai Tujuan Anda
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-[#F6F5F1] dark:bg-slate-800 p-1 rounded-lg border border-[#E5E3DC] dark:border-slate-700">
              {XP_TARGETS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => selectXpTarget(item.value)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    xpTarget === item.value
                      ? 'bg-[#0F766E] text-white'
                      : 'text-[#52525B] dark:text-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {goal && (
              <Badge tone="emerald">
                Fokus: {GOALS.find((g) => g.id === goal)?.label}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {GOALS.map((g) => {
            const active = goal === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => selectGoal(g.id)}
                className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  active
                    ? 'bg-teal-50 dark:bg-teal-950/40 border-[#0F766E]'
                    : 'bg-[#F6F5F1] dark:bg-slate-800/50 border-[#E5E3DC] dark:border-slate-700 hover:border-[#0F766E]/50'
                }`}
              >
                <p className="text-xs font-bold text-[#18181B] dark:text-white">{g.label}</p>
                <p className="text-[11px] text-[#71717A] dark:text-slate-400 mt-0.5">{g.desc}</p>
              </button>
            );
          })}
        </div>

        {recommendedCourses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {recommendedCourses.map((c) => (
              <Link
                key={c.id}
                to={`/courses/${c.slug}`}
                onClick={(e) => onOpenTarget(e, `/courses/${c.slug}`)}
                className="p-3.5 rounded-xl border border-[#E5E3DC] dark:border-slate-700 bg-[#F6F5F1] dark:bg-slate-800/40 hover:border-[#0F766E] transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[#0F766E] dark:text-teal-400 truncate">
                    Rekomendasi • {c.level}
                  </p>
                  <p className="text-xs font-bold text-[#18181B] dark:text-white truncate">
                    {c.title}
                  </p>
                </div>
                <BookOpen className="w-4 h-4 text-[#0F766E] shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

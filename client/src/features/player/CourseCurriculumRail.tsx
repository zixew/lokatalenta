import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Lock,
  PanelRightClose,
  PanelRightOpen,
  PlayCircle,
} from 'lucide-react';
import { useState } from 'react';
import type { Lesson, Module } from '../../shared/types/lms';
import { ProgressBar } from '../../shared/ui/ProgressBar';

export interface CourseCurriculumRailProps {
  modules: Module[];
  activeLessonId: string | null;
  completedIds: string[];
  isLessonDone: (lesson: Lesson) => boolean;
  isLessonLocked: (lessonId: string) => boolean;
  isMentorPreview?: boolean;
  completedCount: number;
  totalLessons: number;
  progressPct: number;
  onSelectLesson?: (lessonId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export function CourseCurriculumRail({
  modules,
  activeLessonId,
  completedIds: _completedIds,
  isLessonDone,
  isLessonLocked,
  isMentorPreview = false,
  completedCount,
  totalLessons,
  progressPct,
  onSelectLesson,
  isCollapsed = false,
  onToggleCollapse,
  className = '',
}: CourseCurriculumRailProps) {
  // Allow toggling specific module accordions
  const [collapsedModuleIds, setCollapsedModuleIds] = useState<Record<string, boolean>>({});

  const toggleModuleCollapse = (moduleId: string) => {
    setCollapsedModuleIds((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  if (isCollapsed) {
    return (
      <aside
        data-testid="curriculum-rail-collapsed"
        className={`bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-2xl p-3 flex flex-col items-center gap-4 transition-all duration-150 ease-out ${className}`}
      >
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Buka Rel Silabus Materi"
            aria-label="Buka Rel Silabus Materi"
            className="p-2 rounded-lg border border-[#D4D4CE] dark:border-[#282E3D] bg-[#F4F4F1] dark:bg-[#11141B] text-[#18181B] dark:text-slate-200 hover:border-[#0F766E] transition-colors cursor-pointer"
          >
            <PanelRightOpen className="w-4 h-4 text-[#0F766E] dark:text-teal-400" />
          </button>
        )}
        <div className="writing-vertical-lr text-xs font-mono font-bold tracking-wider text-[#71717A] dark:text-slate-400 uppercase py-2 select-none">
          Silabus ({completedCount}/{totalLessons})
        </div>
      </aside>
    );
  }

  return (
    <aside
      data-testid="curriculum-rail"
      className={`bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-2xl p-5 space-y-5 transition-all duration-150 ease-out shadow-xs ${className}`}
    >
      {/* Curriculum Header & Progress */}
      <div className="space-y-2 border-b border-[#D4D4CE] dark:border-[#282E3D] pb-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-[#18181B] dark:text-white truncate">
              Kurikulum Kursus
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isMentorPreview ? (
              <span className="text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-300">
                Mode Pratinjau
              </span>
            ) : (
              <span className="font-mono text-[11px] font-semibold text-[#0F766E] dark:text-teal-400">
                {completedCount}/{totalLessons} ({progressPct}%)
              </span>
            )}

            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Sembunyikan Rel Silabus"
                aria-label="Sembunyikan Rel Silabus"
                className="p-1 rounded border border-[#D4D4CE] dark:border-[#282E3D] text-[#71717A] dark:text-slate-400 hover:text-[#18181B] dark:hover:text-white hover:bg-[#F4F4F1] dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <PanelRightClose className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {!isMentorPreview && <ProgressBar value={progressPct} tone="emerald" />}
      </div>

      {/* Modules & Lessons List */}
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {modules.map((mod, mIdx) => {
          const isModCollapsed = !!collapsedModuleIds[mod.id];
          const lessons = mod.lessons ?? [];
          const modCompleted = lessons.filter((l) => isLessonDone(l)).length;

          return (
            <div key={mod.id} className="space-y-2">
              <button
                type="button"
                onClick={() => toggleModuleCollapse(mod.id)}
                className="w-full flex items-center justify-between gap-2 text-left group cursor-pointer select-none"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-slate-400 group-hover:text-[#18181B] dark:group-hover:text-white transition-colors truncate">
                  Modul {mIdx + 1}: {mod.title}
                </span>
                <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-mono text-slate-400">
                  <span>
                    {modCompleted}/{lessons.length}
                  </span>
                  {isModCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </div>
              </button>

              {!isModCollapsed && (
                <div className="space-y-1.5">
                  {lessons.map((les) => {
                    const isActive = les.id === activeLessonId;
                    const isDone = isLessonDone(les);
                    const locked = isLessonLocked(les.id);

                    return (
                      <button
                        key={les.id}
                        type="button"
                        disabled={locked}
                        onClick={() => {
                          if (!locked && onSelectLesson) {
                            onSelectLesson(les.id);
                          }
                        }}
                        className={`w-full text-left p-3 rounded-xl border text-sm transition-[background-color,border-color,transform] duration-150 ease-out active:scale-[0.995] flex items-start gap-2.5 ${
                          locked
                            ? 'bg-[#F4F4F1]/60 dark:bg-[#11141B]/40 border-[#D4D4CE] dark:border-[#282E3D] text-[#94A3B8] dark:text-slate-500 opacity-65 cursor-not-allowed'
                            : isActive
                              ? 'bg-teal-50/70 dark:bg-teal-950/50 border-[#0F766E] text-[#18181B] dark:text-white cursor-pointer shadow-xs'
                              : 'bg-white dark:bg-[#161B22] border-[#D4D4CE] dark:border-[#282E3D] text-[#52525B] dark:text-slate-300 hover:bg-[#F4F4F1] dark:hover:bg-slate-800 hover:border-[#94A3B8] cursor-pointer'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {locked ? (
                            <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          ) : isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                          ) : les.type === 'quiz' ? (
                            <ClipboardCheck className="w-4 h-4 text-[#0F766E]" />
                          ) : les.type === 'video' ? (
                            <PlayCircle className="w-4 h-4 text-slate-400" />
                          ) : (
                            <FileText className="w-4 h-4 text-slate-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium leading-snug line-clamp-2">{les.title}</p>
                          <span className="text-[11px] text-[#71717A] dark:text-slate-400 mt-0.5 block font-mono">
                            {locked
                              ? 'Terkunci • Selesaikan materi sebelumnya'
                              : `${les.type === 'quiz' ? 'Simulasi Tes' : les.type === 'video' ? 'Video' : 'Materi'} • ${les.duration_minutes} mnt`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

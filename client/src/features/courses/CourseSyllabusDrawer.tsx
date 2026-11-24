import { ArrowRight, BookOpen, ClipboardCheck, Clock, FileText, Layers, Video, X } from 'lucide-react';
import { useEffect } from 'react';
import type { Course } from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';

export interface CourseSyllabusDrawerProps {
  course: Course | null;
  targetUrl: string;
  onClose: () => void;
  onStartCourse: (e: React.MouseEvent, targetUrl: string) => void;
}

export function CourseSyllabusDrawer({
  course,
  targetUrl,
  onClose,
  onStartCourse,
}: CourseSyllabusDrawerProps) {
  useEffect(() => {
    if (!course) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [course, onClose]);

  if (!course) return null;

  const modules = [...(course.modules ?? [])].sort((a, b) => a.order_index - b.order_index);
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Pratinjau Silabus: ${course.title}`}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-[#161B22] h-full flex flex-col shadow-2xl border-l border-[#E5E3DC] dark:border-slate-800"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[#E5E3DC] dark:border-slate-800 shrink-0">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="blue">{course.category}</Badge>
              <Badge tone="slate">{course.level}</Badge>
            </div>
            <h2 className="text-lg font-extrabold text-[#18181B] dark:text-white leading-snug">
              {course.title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Tutup pratinjau silabus"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[#E5E3DC] dark:border-slate-700 text-[#52525B] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <p className="text-sm text-[#52525B] dark:text-slate-300 leading-relaxed">
            {course.description}
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-800 text-center">
              <p className="text-[11px] text-[#71717A] dark:text-slate-400">Modul</p>
              <p className="text-base font-bold font-mono-tabular text-[#18181B] dark:text-white">
                {modules.length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-800 text-center">
              <p className="text-[11px] text-[#71717A] dark:text-slate-400">Materi</p>
              <p className="text-base font-bold font-mono-tabular text-[#18181B] dark:text-white">
                {totalLessons}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-800 text-center">
              <p className="text-[11px] text-[#71717A] dark:text-slate-400">Estimasi</p>
              <p className="text-base font-bold font-mono-tabular text-[#18181B] dark:text-white">
                {course.estimated_hours} Jam
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A] dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#0F766E]" />
              Struktur Silabus
            </h3>

            {modules.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-800 text-center text-xs text-[#71717A] dark:text-slate-400">
                Silabus modul sedang disiapkan oleh mentor.
              </div>
            ) : (
              <div className="space-y-3">
                {modules.map((mod, mIdx) => {
                  const lessons = [...mod.lessons].sort((a, b) => a.order_index - b.order_index);
                  return (
                    <div
                      key={mod.id}
                      className="rounded-xl border border-[#E5E3DC] dark:border-slate-800 overflow-hidden"
                    >
                      <div className="px-4 py-3 bg-[#F6F5F1] dark:bg-slate-900/80 border-b border-[#E5E3DC] dark:border-slate-800 flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#18181B] dark:text-white">
                          Modul {mIdx + 1}: {mod.title}
                        </span>
                        <span className="text-[11px] font-mono-tabular text-[#71717A] dark:text-slate-400 shrink-0">
                          {lessons.length} materi
                        </span>
                      </div>
                      <ul className="divide-y divide-[#E5E3DC] dark:divide-slate-800 bg-white dark:bg-[#161B22]">
                        {lessons.map((lesson) => {
                          const TypeIcon =
                            lesson.type === 'video'
                              ? Video
                              : lesson.type === 'quiz'
                                ? ClipboardCheck
                                : FileText;
                          return (
                            <li
                              key={lesson.id}
                              className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <TypeIcon className="w-3.5 h-3.5 text-[#0F766E] dark:text-teal-400 shrink-0" />
                                <span className="text-[#18181B] dark:text-slate-200 truncate">
                                  {lesson.title}
                                </span>
                              </div>
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono-tabular text-[#71717A] dark:text-slate-400 shrink-0">
                                <Clock className="w-3 h-3" />
                                {lesson.duration_minutes}m
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E3DC] dark:border-slate-800 bg-white dark:bg-[#161B22] flex items-center justify-between gap-3 shrink-0">
          <Button type="button" variant="secondary" onClick={onClose}>
            Tutup
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={(e) => {
              onClose();
              onStartCourse(e, targetUrl);
            }}
          >
            <BookOpen className="w-4 h-4" />
            Buka Program
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

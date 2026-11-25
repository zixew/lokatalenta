import { ArrowRight, BookOpen, ClipboardCheck, Clock, FileText, Layers, Video, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const lastY = useRef(0);
  const velocityY = useRef(0);
  const lastTime = useRef(0);

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

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only engage drag when dragging header or grab bar
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;
    
    setIsDragging(true);
    dragStartY.current = e.clientY;
    lastY.current = e.clientY;
    lastTime.current = performance.now();
    velocityY.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const now = performance.now();
    const dt = Math.max(1, now - lastTime.current);
    const dy = e.clientY - lastY.current;
    
    velocityY.current = dy / dt; // px per ms
    lastY.current = e.clientY;
    lastTime.current = now;

    const rawDelta = e.clientY - dragStartY.current;
    if (rawDelta < 0) {
      // Rubber-banding upward resistance
      setDragOffset(rawDelta * 0.2);
    } else {
      setDragOffset(rawDelta);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // Dismiss if dragged down > 120px OR flicked downward fast (> 0.6 px/ms)
    if (dragOffset > 120 || velocityY.current > 0.6) {
      onClose();
    } else {
      // Snap back with critically damped spring
      setDragOffset(0);
    }
  };

  if (!course) return null;

  const modules = [...(course.modules ?? [])].sort((a, b) => a.order_index - b.order_index);
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Pratinjau Silabus: ${course.title}`}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex justify-end items-end sm:items-stretch transition-opacity duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: dragOffset !== 0 ? `translateY(${Math.max(0, dragOffset)}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="w-full sm:max-w-lg bg-white dark:bg-[#161B22] max-h-[92vh] sm:max-h-full sm:h-full flex flex-col rounded-t-2xl sm:rounded-none shadow-2xl border-t sm:border-t-0 sm:border-l border-[#D4D4CE] dark:border-[#282E3D] touch-none"
      >
        {/* Grab Handle for Touch/Mobile */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full pt-3 pb-1 cursor-grab active:cursor-grabbing sm:hidden flex justify-center shrink-0"
        >
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="flex items-start justify-between gap-4 px-6 py-4 sm:py-5 border-b border-[#D4D4CE] dark:border-[#282E3D] shrink-0 cursor-grab active:cursor-grabbing select-none"
        >
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="blue">{course.category}</Badge>
              <Badge tone="slate">{course.level}</Badge>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#18181B] dark:text-white leading-snug">
              {course.title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Tutup pratinjau silabus"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[#D4D4CE] dark:border-[#282E3D] text-[#52525B] dark:text-slate-300 hover:bg-[#F4F4F1] dark:hover:bg-slate-800 cursor-pointer shrink-0"
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
            <div className="p-3 rounded-lg bg-[#F4F4F1] dark:bg-[#11141B] border border-[#D4D4CE] dark:border-[#282E3D] text-center">
              <p className="text-[11px] font-medium text-[#71717A] dark:text-slate-400">Modul</p>
              <p className="text-base font-bold font-mono text-[#18181B] dark:text-white">
                {modules.length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#F4F4F1] dark:bg-[#11141B] border border-[#D4D4CE] dark:border-[#282E3D] text-center">
              <p className="text-[11px] font-medium text-[#71717A] dark:text-slate-400">Materi</p>
              <p className="text-base font-bold font-mono text-[#18181B] dark:text-white">
                {totalLessons}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#F4F4F1] dark:bg-[#11141B] border border-[#D4D4CE] dark:border-[#282E3D] text-center">
              <p className="text-[11px] font-medium text-[#71717A] dark:text-slate-400">Estimasi</p>
              <p className="text-base font-bold font-mono text-[#18181B] dark:text-white">
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
              <div className="p-6 rounded-lg bg-[#F4F4F1] dark:bg-[#11141B] border border-[#D4D4CE] dark:border-[#282E3D] text-center text-xs text-[#71717A] dark:text-slate-400">
                Silabus modul sedang disiapkan oleh mentor.
              </div>
            ) : (
              <div className="space-y-3">
                {modules.map((mod, mIdx) => {
                  const lessons = [...mod.lessons].sort((a, b) => a.order_index - b.order_index);
                  return (
                    <div
                      key={mod.id}
                      className="rounded-lg border border-[#D4D4CE] dark:border-[#282E3D] overflow-hidden"
                    >
                      <div className="px-4 py-2.5 bg-[#F4F4F1] dark:bg-[#11141B] border-b border-[#D4D4CE] dark:border-[#282E3D] flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#18181B] dark:text-white">
                          Modul {mIdx + 1}: {mod.title}
                        </span>
                        <span className="text-[11px] font-mono text-[#71717A] dark:text-slate-400 shrink-0">
                          {lessons.length} materi
                        </span>
                      </div>
                      <ul className="divide-y divide-[#D4D4CE] dark:divide-[#282E3D] bg-white dark:bg-[#161B22]">
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
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#71717A] dark:text-slate-400 shrink-0">
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
        <div className="p-4 border-t border-[#D4D4CE] dark:border-[#282E3D] bg-white dark:bg-[#161B22] flex items-center justify-between gap-3 shrink-0">
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

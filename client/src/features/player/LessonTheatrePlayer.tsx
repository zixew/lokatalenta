import { Check, Maximize2, Minimize2, Tv, Video } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { formatVideoEmbedUrl } from './videoPlayerUtils';

export interface LessonTheatrePlayerProps {
  videoUrl: string;
  title: string;
  lessonId?: string;
  isTheatreMode?: boolean;
  onToggleTheatre?: () => void;
  isCompleted?: boolean;
  className?: string;
}

export function LessonTheatrePlayer({
  videoUrl,
  title,
  lessonId,
  isTheatreMode = false,
  onToggleTheatre,
  isCompleted = false,
  className = '',
}: LessonTheatrePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keyboard shortcut listener for Theatre mode ('t' / 'T')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl && activeEl.getAttribute('contenteditable') === 'true');

      if (isInput) return;

      if (e.key === 't' || e.key === 'T') {
        if (onToggleTheatre) {
          e.preventDefault();
          onToggleTheatre();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleTheatre]);

  // Handle Fullscreen API
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        // Fullscreen request rejected or unsupported
      });
    } else {
      document.exitFullscreen?.().then(() => {
        setIsFullscreen(false);
      }).catch(() => {
        // Exit fullscreen failed
      });
    }
  };

  const formattedUrl = formatVideoEmbedUrl(videoUrl);

  return (
    <div
      ref={containerRef}
      data-testid="lesson-theatre-player"
      data-theatre-mode={isTheatreMode ? 'true' : 'false'}
      className={`relative w-full rounded-xl overflow-hidden border border-[#D4D4CE] dark:border-[#282E3D] bg-[#0D1117] transition-all duration-200 ease-out shadow-xs ${
        isTheatreMode ? 'ring-1 ring-[#0F766E]/40' : ''
      } ${className}`}
    >
      {/* Theatre Top Telemetry Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#11141B] border-b border-[#282E3D] text-xs select-none">
        <div className="flex items-center gap-2 min-w-0">
          <Badge tone="blue" className="shrink-0">
            <Video className="w-3 h-3 mr-1" />
            Video Lesson
          </Badge>
          <span className="font-mono text-[11px] text-slate-300 truncate max-w-xs sm:max-w-md">
            {title}
          </span>
          {isCompleted && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 shrink-0">
              <Check className="w-3 h-3" />
              Selesai
            </span>
          )}
        </div>

        {/* Player Mode Quick Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleTheatre && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onToggleTheatre}
              className="text-[11px] h-7 px-2.5 bg-[#161B22] border-[#282E3D] text-slate-200 hover:bg-[#21262D]"
              title={isTheatreMode ? 'Keluar dari Mode Teater (Tekan T)' : 'Beralih ke Mode Teater (Tekan T)'}
              aria-label={isTheatreMode ? 'Tutup Mode Teater' : 'Buka Mode Teater'}
            >
              <Tv className="w-3.5 h-3.5 mr-1 text-[#14B8A6]" />
              <span className="hidden sm:inline">
                {isTheatreMode ? 'Tampilan Normal' : 'Mode Teater'}
              </span>
              <kbd className="hidden md:inline-block ml-1 px-1 py-0.2 bg-[#0D1117] border border-[#282E3D] rounded text-[10px] font-mono text-slate-400">
                T
              </kbd>
            </Button>
          )}

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-[#21262D] transition-colors cursor-pointer"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Video Viewport Canvas with Zero-Letterboxing Fluid Scaling */}
      <div
        className={`relative w-full ${
          isTheatreMode
            ? 'aspect-[21/9] sm:aspect-[16/9] max-h-[72vh] min-h-[320px]'
            : 'aspect-video max-h-[56vh]'
        } bg-black flex items-center justify-center`}
      >
        {formattedUrl ? (
          <iframe
            key={`${lessonId ?? 'lesson'}-${formattedUrl}`}
            src={formattedUrl}
            title={title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-slate-500 text-xs p-6 text-center">
            <Video className="w-8 h-8 text-slate-600" />
            <p>Tautan video pelajaran belum tersedia dari pengajar.</p>
          </div>
        )}
      </div>
    </div>
  );
}

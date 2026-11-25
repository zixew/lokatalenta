import { Eraser, Eye, EyeOff, PenTool, Undo2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { VoiceLine } from '../../shared/types/lms';
import { Button } from '../../shared/ui/Button';

export function WritingCanvas({ lines }: { lines: VoiceLine[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showGuide, setShowGuide] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);

  const targetChar = (lines[selectedIdx]?.text ?? 'あ').trim();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#0F766E';
  }, []);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setHistory((prev) => [...prev.slice(-14), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    const pt = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    setIsDrawing(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pt = getPoint(e);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setHistory((prev) => [...prev.slice(-14), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const undoStroke = () => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const last = history[history.length - 1];
    ctx.putImageData(last, 0, 0);
    setHistory((prev) => prev.slice(0, -1));
  };

  return (
    <div className="rounded-2xl border border-[#D4D4CE] dark:border-[#282E3D] bg-white dark:bg-[#161B22] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-[#0F766E]" />
          <span className="text-sm font-bold text-[#18181B] dark:text-white">
            Kanvas Latihan Menulis Aksara
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowGuide((v) => !v)}
          >
            {showGuide ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showGuide ? 'Sembunyikan Panduan' : 'Tampilkan Panduan'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={undoStroke}
            disabled={history.length === 0}
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={clearCanvas}>
            <Eraser className="w-3.5 h-3.5" />
            Bersihkan
          </Button>
        </div>
      </div>

      {lines.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {lines.slice(0, 12).map((line, i) => (
            <button
              key={`${line.text}-${i}`}
              type="button"
              onClick={() => {
                setSelectedIdx(i);
                clearCanvas();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                selectedIdx === i
                  ? 'bg-[#0F766E] text-white border-[#0F766E]'
                  : 'bg-[#F4F4F1] dark:bg-slate-800 text-[#18181B] dark:text-slate-200 border-[#D4D4CE] dark:border-[#282E3D]'
              }`}
            >
              {line.text}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        <div className="sm:col-span-7 flex justify-center">
          <div className="relative w-full max-w-[256px] aspect-square rounded-2xl border-2 border-dashed border-[#0F766E]/40 bg-[#F4F4F1] dark:bg-slate-900 overflow-hidden touch-none">
            {/* Crosshair grid lines */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-full h-px border-t border-dashed border-slate-300 dark:border-[#282E3D]" />
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-full w-px border-l border-dashed border-slate-300 dark:border-[#282E3D]" />
            </div>
            {/* Faint character guide */}
            {showGuide && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-3 select-none">
                <span
                  className={`font-bold text-center break-words text-slate-300/70 dark:text-slate-700/70 ${
                    targetChar.length <= 2
                      ? 'text-7xl'
                      : targetChar.length <= 5
                      ? 'text-4xl'
                      : 'text-2xl leading-snug'
                  }`}
                >
                  {targetChar}
                </span>
              </div>
            )}
            <canvas
              ref={canvasRef}
              width={256}
              height={256}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
              className="relative z-10 w-full h-full cursor-crosshair"
            />
          </div>
        </div>

        <div className="sm:col-span-5 space-y-2 text-xs text-[#52525B] dark:text-slate-300">
          <p className="text-sm font-bold text-[#18181B] dark:text-white">{targetChar}</p>
          {lines[selectedIdx]?.romaji && (
            <p className="font-semibold text-[#0F766E] dark:text-teal-400">
              Cara baca: {lines[selectedIdx].romaji}
            </p>
          )}
          {lines[selectedIdx]?.translation && (
            <p>Arti: {lines[selectedIdx].translation}</p>
          )}
          <p className="text-[11px] text-[#71717A] dark:text-slate-400 pt-1">
            Ikuti garis bantu silang untuk melatih proporsi dan urutan goresan dengan mouse atau layar sentuh.
          </p>
        </div>
      </div>
    </div>
  );
}

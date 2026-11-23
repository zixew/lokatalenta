import { CheckCircle2, Mic, MicOff, Volume2 } from 'lucide-react';
import { useState } from 'react';
import type { VoiceLine } from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { evaluateSpeechMatch } from './speechUtils';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

export function SpeechPracticeBox({ lines }: { lines: VoiceLine[] }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [statusMsg, setStatusMsg] = useState<'idle' | 'match' | 'retry' | 'unsupported'>('idle');

  if (lines.length === 0) return null;
  const current = lines[selectedIdx] ?? lines[0];

  const speakTarget = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(current.text);
    u.lang = current.lang;
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  const startListening = () => {
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const RecognitionCtor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      setStatusMsg('unsupported');
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.lang = current.lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setTranscript('');
    setStatusMsg('idle');
    setListening(true);

    recognition.onresult = (event) => {
      const spoken = event.results[0]?.[0]?.transcript ?? '';
      setTranscript(spoken);
      const matched = evaluateSpeechMatch(spoken, current.text, current.romaji);
      setStatusMsg(matched ? 'match' : 'retry');
    };
    recognition.onerror = () => {
      setListening(false);
      setStatusMsg('retry');
    };
    recognition.onend = () => {
      setListening(false);
    };
    try {
      recognition.start();
    } catch {
      setListening(false);
      setStatusMsg('unsupported');
    }
  };

  return (
    <div className="rounded-2xl border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-[#161B22] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-[#0F766E]" />
          <span className="text-sm font-bold text-[#18181B] dark:text-white">
            Latihan Pelafalan (Shadowing)
          </span>
        </div>
        <Badge tone="blue">{current.lang}</Badge>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {lines.slice(0, 10).map((line, i) => (
          <button
            key={`${line.text}-${i}`}
            type="button"
            onClick={() => {
              setSelectedIdx(i);
              setTranscript('');
              setStatusMsg('idle');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              selectedIdx === i
                ? 'bg-[#0F766E] text-white border-[#0F766E]'
                : 'bg-[#F6F5F1] dark:bg-slate-800 text-[#18181B] dark:text-slate-200 border-[#E5E3DC] dark:border-slate-700'
            }`}
          >
            {line.text}
          </button>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-[#F6F5F1] dark:bg-slate-800/60 space-y-2">
        <p className="text-lg font-extrabold text-[#18181B] dark:text-white">{current.text}</p>
        {current.romaji && (
          <p className="text-xs font-semibold text-[#0F766E] dark:text-teal-400">
            {current.romaji}
          </p>
        )}
        <p className="text-xs text-[#52525B] dark:text-slate-300">{current.translation}</p>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={speakTarget}>
            <Volume2 className="w-3.5 h-3.5" />
            Dengar Contoh
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={startListening}
            disabled={listening}
          >
            {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {listening ? 'Mendengarkan...' : 'Mulai Ucapkan'}
          </Button>
        </div>
      </div>

      {transcript && (
        <div className="text-xs space-y-1">
          <p className="text-[#52525B] dark:text-slate-300">
            Terdeteksi: <strong className="text-[#18181B] dark:text-white">{transcript}</strong>
          </p>
          {statusMsg === 'match' && (
            <p className="font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Bagus! Pelafalan Anda sudah sesuai.
            </p>
          )}
          {statusMsg === 'retry' && (
            <p className="font-medium text-amber-600 dark:text-amber-400">
              Coba ucapkan kembali dengan lebih jelas setelah mendengar contoh.
            </p>
          )}
        </div>
      )}

      {!transcript && statusMsg === 'retry' && (
        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
          Mikrofon tidak terdeteksi atau suara tidak tertangkap. Periksa izin mikrofon lalu coba lagi.
        </p>
      )}

      {statusMsg === 'unsupported' && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Browser ini belum mendukung pengenalan suara mikrofon (SpeechRecognition). Gunakan Chrome atau Edge versi terbaru untuk fitur ini.
        </p>
      )}
    </div>
  );
}

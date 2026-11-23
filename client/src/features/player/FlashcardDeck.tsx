import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, RotateCw, Sparkles, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { lmsApi } from '../../shared/services/lmsApi';
import type { SrsRating, VoiceLine } from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { useAuthStore } from '../auth/useAuthStore';

export function FlashcardDeck({ lines }: { lines: VoiceLine[] }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [deck, setDeck] = useState<VoiceLine[]>(() => lines);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const { data: srsMap = {} } = useQuery({
    queryKey: ['flashcard-srs', user?.id],
    queryFn: () =>
      user ? lmsApi.getFlashcardProgressMap(user.id) : Promise.resolve({} as Record<string, SrsRating>),
    enabled: Boolean(user),
  });

  const saveRatingMut = useMutation({
    mutationFn: ({ cardKey, rating }: { cardKey: string; rating: SrsRating }) =>
      user ? lmsApi.saveFlashcardRating(user.id, cardKey, rating) : Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-srs', user?.id] });
    },
  });

  if (lines.length === 0) return null;
  const activeDeck = deck.length > 0 ? deck : lines;
  const current = activeDeck[idx] ?? activeDeck[0];
  const currentRating = srsMap[current.text];
  const masteredCount = lines.filter((l) => srsMap[l.text] === 'easy').length;

  const speak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(current.text);
    u.lang = current.lang;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const rateCard = (rating: SrsRating) => {
    saveRatingMut.mutate({ cardKey: current.text, rating });

    // Spaced Repetition: if 'hard', re-insert card 2 positions later in current deck
    if (rating === 'hard' && idx < activeDeck.length - 1) {
      const insertAt = Math.min(activeDeck.length, idx + 3);
      const nextDeck = [...activeDeck];
      nextDeck.splice(insertAt, 0, current);
      setDeck(nextDeck);
    }

    setFlipped(false);
    if (idx < activeDeck.length - 1) {
      setIdx((i) => i + 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <Badge tone="emerald">
          <Sparkles className="w-3 h-3" />
          SRS Dikuasai: {masteredCount} / {lines.length}
        </Badge>
        {currentRating && (
          <Badge
            tone={
              currentRating === 'easy'
                ? 'emerald'
                : currentRating === 'medium'
                ? 'amber'
                : 'rose'
            }
          >
            Status:{' '}
            {currentRating === 'easy'
              ? 'Mudah'
              : currentRating === 'medium'
              ? 'Sedang'
              : 'Perlu Diulang'}
          </Badge>
        )}
      </div>

      <div
        onClick={() => setFlipped((f) => !f)}
        className="min-h-44 rounded-2xl border-2 border-[#0F766E]/30 dark:border-teal-700/60 bg-white dark:bg-[#161B22] p-6 flex flex-col items-center justify-center text-center gap-3 cursor-pointer select-none hover:border-[#0F766E] transition-colors"
      >
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] dark:text-slate-400">
          {flipped ? 'Arti & Cara Baca (Klik untuk balik)' : 'Klik kartu untuk melihat arti'}
        </span>

        {!flipped ? (
          <>
            <p className="text-xl sm:text-2xl font-extrabold text-[#18181B] dark:text-white">
              {current.text}
            </p>
            <Button variant="secondary" size="sm" onClick={speak}>
              <Volume2 className="w-4 h-4" />
              Dengar Pelafalan
            </Button>
          </>
        ) : (
          <div className="space-y-1.5">
            {current.romaji && (
              <p className="text-sm font-semibold text-[#0F766E] dark:text-teal-400">
                {current.romaji}
              </p>
            )}
            <p className="text-lg font-bold text-[#18181B] dark:text-white">
              {current.translation}
            </p>
          </div>
        )}
      </div>

      {/* SRS Rating Buttons */}
      {flipped && (
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => rateCard('hard')}
            className="py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-100 cursor-pointer transition-colors"
          >
            Sulit (Ulangi)
          </button>
          <button
            type="button"
            onClick={() => rateCard('medium')}
            className="py-2 px-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 cursor-pointer transition-colors"
          >
            Sedang
          </button>
          <button
            type="button"
            onClick={() => rateCard('easy')}
            className="py-2 px-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 cursor-pointer transition-colors"
          >
            Mudah (Hafal)
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          disabled={idx === 0}
          onClick={() => {
            setIdx((i) => Math.max(0, i - 1));
            setFlipped(false);
          }}
        >
          <ChevronLeft className="w-4 h-4" />
          Sebelumnya
        </Button>

        <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#71717A] dark:text-slate-400">
          <span>
            Kartu {idx + 1} / {activeDeck.length}
          </span>
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="inline-flex items-center gap-1 text-[#0F766E] dark:text-teal-400 font-semibold cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Balik
          </button>
        </div>

        <Button
          variant="secondary"
          size="sm"
          disabled={idx === activeDeck.length - 1}
          onClick={() => {
            setIdx((i) => Math.min(activeDeck.length - 1, i + 1));
            setFlipped(false);
          }}
        >
          Berikutnya
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { Calendar, CheckCircle2, Clock, Play, Trophy, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lmsApi } from '../../shared/services/lmsApi';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { useAuthStore } from '../auth/useAuthStore';
import {
  buildScheduledTryoutEvents,
  getRegisteredTryoutIds,
  getTryoutEventStatus,
  syncTryoutRegistrationsFromServer,
  toggleTryoutRegistrationAsync,
} from './tryoutEvents';

export function TryoutPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const userKey = user?.id ?? 'guest';

  const [nowMs] = useState(() => Date.now());
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const events = useMemo(() => buildScheduledTryoutEvents(nowMs), [nowMs]);
  const [registeredIds, setRegisteredIds] = useState<string[]>(() =>
    getRegisteredTryoutIds(userKey)
  );

  useQuery({
    queryKey: ['tryout-registrations', userKey],
    queryFn: async () => {
      const synced = await syncTryoutRegistrationsFromServer(userKey);
      setRegisteredIds(synced);
      return synced;
    },
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses', 'published'],
    queryFn: () => lmsApi.listPublishedCourses(),
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['public-leaderboard'],
    queryFn: async () => (await lmsApi.listLeaderboard()).slice(0, 10),
  });

  const categories = useMemo(
    () => ['ALL', ...Array.from(new Set(events.map((e) => e.category)))],
    [events]
  );

  const filteredEvents = useMemo(
    () =>
      selectedCategory === 'ALL'
        ? events
        : events.filter((ev) => ev.category === selectedCategory),
    [events, selectedCategory]
  );

  const defaultQuizId = useMemo(() => {
    for (const c of courses) {
      for (const m of c.modules ?? []) {
        for (const l of m.lessons) {
          if (l.type === 'quiz' && l.quiz?.id) {
            return l.quiz.id;
          }
        }
      }
    }
    return '';
  }, [courses]);

  const handleToggleRegister = async (eventId: string) => {
    const updated = await toggleTryoutRegistrationAsync(userKey, eventId);
    setRegisteredIds(updated);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <Badge tone="emerald">Event Kompetisi Nasional</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] dark:text-white tracking-tight">
            Tryout Akbar &amp; Peringkat Event
          </h1>
          <p className="text-sm text-[#52525B] dark:text-slate-400 max-w-2xl">
            Ikuti jadwal simulasi serentak, daftarkan kursi Anda sebelum kuota penuh, dan pantau peringkat nasional di papan skor event.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0F766E] text-white'
                  : 'bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 text-[#52525B] dark:text-slate-300'
              }`}
            >
              {cat === 'ALL' ? 'Semua Kategori' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          {filteredEvents.map((ev) => {
            const status = getTryoutEventStatus(ev, nowMs);
            const isRegistered = registeredIds.includes(ev.id);
            const displayCount = ev.registeredCount + (isRegistered ? 1 : 0);

            return (
              <div
                key={ev.id}
                className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge tone={status === 'live' ? 'emerald' : status === 'upcoming' ? 'blue' : 'slate'}>
                      {status === 'live'
                        ? 'Sedang Berlangsung'
                        : status === 'upcoming'
                          ? 'Akan Datang'
                          : 'Selesai'}
                    </Badge>
                    <Badge tone="slate">{ev.category}</Badge>
                  </div>
                  <span className="text-xs font-mono-tabular text-[#71717A] dark:text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {displayCount}/{ev.maxParticipants} peserta
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#18181B] dark:text-white">{ev.title}</h2>
                  <p className="text-xs sm:text-sm text-[#52525B] dark:text-slate-400 mt-1">
                    {ev.subtitle}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-[#52525B] dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#0F766E]" />
                    {ev.durationMinutes} Menit • {ev.questionCount} Soal
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0F766E]" />
                    {new Date(ev.startAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    –{' '}
                    {new Date(ev.endAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="pt-3 border-t border-[#E5E3DC] dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-medium text-[#0F766E] dark:text-teal-400">
                    {ev.prizeNote}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {status !== 'ended' && (
                      <Button
                        type="button"
                        size="sm"
                        variant={isRegistered ? 'secondary' : 'primary'}
                        onClick={() => handleToggleRegister(ev.id)}
                      >
                        {isRegistered ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Terdaftar
                          </>
                        ) : (
                          'Daftar Event'
                        )}
                      </Button>
                    )}
                    {status === 'live' && defaultQuizId && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => navigate(user ? `/quiz/${defaultQuizId}` : '/auth')}
                      >
                        <Play className="w-3.5 h-3.5" />
                        Mulai Tryout
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="lg:col-span-4 bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Leaderboard Tryout
            </h2>
            <Badge tone="amber">Top 10</Badge>
          </div>
          {leaderboard.length === 0 ? (
            <p className="text-xs text-[#71717A] dark:text-slate-400">
              Belum ada skor peserta yang tercatat.
            </p>
          ) : (
            <div className="space-y-2.5">
              {leaderboard.map((entry, idx) => (
                <div
                  key={entry.user_id}
                  className="p-3 rounded-xl bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-[#0F766E]/10 text-[#0F766E] dark:text-teal-400 font-bold flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-[#18181B] dark:text-white truncate">
                      {entry.full_name}
                    </span>
                  </div>
                  <span className="font-mono-tabular font-bold text-[#0F766E] dark:text-teal-400 shrink-0">
                    {entry.xp} XP
                  </span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

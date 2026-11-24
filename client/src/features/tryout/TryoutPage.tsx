import { useQuery } from '@tanstack/react-query';
import { Calendar, CheckCircle2, Clock, Play, Trophy, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../../shared/lib/supabase';
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
  const [selectedLeaderboardEventId, setSelectedLeaderboardEventId] = useState<string>('GLOBAL');
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

  const { data: leaderboard = [], isLoading: isLeaderboardLoading } = useQuery({
    queryKey: ['public-leaderboard', selectedLeaderboardEventId],
    queryFn: async () => {
      if (selectedLeaderboardEventId === 'GLOBAL') {
        const rows = await lmsApi.listLeaderboard();
        return rows.slice(0, 10).map((r) => ({
          user_id: r.user_id,
          full_name: r.full_name,
          metricValue: `${r.xp} XP`,
        }));
      }

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.rpc('get_tryout_event_leaderboard', {
          p_event_id: selectedLeaderboardEventId,
        });
        if (!error && Array.isArray(data)) {
          return data.slice(0, 10).map((row: { user_id: string; full_name: string; best_score: number }) => ({
            user_id: row.user_id,
            full_name: row.full_name,
            metricValue: `${Number(row.best_score ?? 0)} Skor`,
          }));
        }
      }

      return [];
    },
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
    if (!user) {
      navigate('/auth');
      return;
    }
    const updated = await toggleTryoutRegistrationAsync(userKey, eventId);
    setRegisteredIds(updated);
  };

  const resolveEventQuizId = (category: string): string => {
    const normalized = category.toLowerCase();
    for (const c of courses) {
      if (!c.category.toLowerCase().includes(normalized) && !c.title.toLowerCase().includes(normalized)) {
        continue;
      }
      for (const m of c.modules ?? []) {
        for (const l of m.lessons) {
          if (l.type === 'quiz' && l.quiz?.id) {
            return l.quiz.id;
          }
        }
      }
    }
    return defaultQuizId;
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
                    {status !== 'ended' && !(status === 'live' && defaultQuizId && !isRegistered) && (
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
                    {status === 'live' && defaultQuizId && (() => {
                      const eventQuizId = resolveEventQuizId(ev.category);
                      return (
                        <Button
                          type="button"
                          size="sm"
                          onClick={async () => {
                            if (!user) {
                              navigate('/auth');
                              return;
                            }
                            if (!isRegistered) {
                              const updated = await toggleTryoutRegistrationAsync(userKey, ev.id);
                              setRegisteredIds(updated);
                            }
                            navigate(`/quiz/${eventQuizId}`);
                          }}
                        >
                          <Play className="w-3.5 h-3.5" />
                          {isRegistered ? 'Mulai Tryout' : 'Daftar & Ikuti Tryout'}
                        </Button>
                      );
                    })()}
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

          <div className="space-y-1.5">
            <label
              htmlFor="tryout-leaderboard-event-select"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[#71717A] dark:text-slate-400"
            >
              Pilih Papan Skor Event
            </label>
            <select
              id="tryout-leaderboard-event-select"
              value={selectedLeaderboardEventId}
              onChange={(e) => setSelectedLeaderboardEventId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-700 text-[#18181B] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            >
              <option value="GLOBAL">Global XP (Semua Aktivitas)</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>

          {isLeaderboardLoading ? (
            <div className="space-y-2.5 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-11 rounded-xl bg-[#F6F5F1] dark:bg-slate-900 border border-[#E5E3DC] dark:border-slate-800"
                />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <p className="text-xs text-[#71717A] dark:text-slate-400">
              {selectedLeaderboardEventId === 'GLOBAL'
                ? 'Belum ada skor peserta yang tercatat.'
                : 'Belum ada skor peserta yang tercatat untuk event ini.'}
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
                    {entry.metricValue}
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

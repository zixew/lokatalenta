import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, CheckCircle2, ExternalLink, Users, Video } from 'lucide-react';
import { lmsApi } from '../../shared/services/lmsApi';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { useAuthStore } from '../auth/useAuthStore';

export function MentoringSessionsPanel({
  courseId,
  courseSlug,
}: {
  courseId: string;
  courseSlug: string;
}) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: sessions = [] } = useQuery({
    queryKey: ['mentoring-sessions', courseId],
    queryFn: () => lmsApi.listMentoringSessions(courseId),
    enabled: Boolean(courseId),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['mentoring-bookings'],
    queryFn: () => lmsApi.listAllMentoringBookings(),
  });

  const bookMut = useMutation({
    mutationFn: (session: { id: string; title: string }) =>
      lmsApi.bookMentoringSession({
        session_id: session.id,
        session_title: session.title,
        user_id: user!.id,
        student_name: user!.full_name,
        course_slug: courseSlug,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentoring-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  if (sessions.length === 0) {
    return (
      <div className="p-6 text-center rounded-xl border border-dashed border-[#D4D4CE] dark:border-[#282E3D]">
        <Video className="w-7 h-7 text-[#71717A] mx-auto mb-2 opacity-70" />
        <p className="text-sm font-medium text-[#18181B] dark:text-white">
          Belum ada jadwal sesi live untuk kursus ini
        </p>
        <p className="text-xs text-[#71717A] dark:text-slate-400 mt-1">
          Mentor dapat menjadwalkan sesi bimbingan langsung (Office Hours) melalui Teacher Studio.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((s) => {
        const sessionBookings = bookings.filter((b) => b.session_id === s.id);
        const isBooked = Boolean(user && sessionBookings.some((b) => b.user_id === user.id));
        const isFull = sessionBookings.length >= s.max_participants;

        return (
          <div
            key={s.id}
            className="p-4 rounded-xl bg-[#F4F4F1] dark:bg-slate-800/60 border border-[#D4D4CE] dark:border-[#282E3D] space-y-2.5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-[#18181B] dark:text-white">{s.title}</h4>
                <p className="text-xs text-[#71717A] dark:text-slate-400">
                  Mentor: {s.mentor_name}
                </p>
              </div>
              <Badge tone={isBooked ? 'emerald' : isFull ? 'rose' : 'blue'}>
                {isBooked ? 'Terdaftar' : isFull ? 'Kuota Penuh' : 'Tersedia'}
              </Badge>
            </div>

            {s.topic && (
              <p className="text-xs text-[#52525B] dark:text-slate-300">{s.topic}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#71717A] dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#0F766E]" />
                {new Date(s.scheduled_at).toLocaleString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#0F766E]" />
                {sessionBookings.length}/{s.max_participants} peserta
              </span>
            </div>

            <div className="pt-1 flex flex-wrap items-center gap-2">
              {isBooked ? (
                <>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Anda terdaftar pada sesi ini
                  </span>
                  {s.meeting_url && (
                    <a
                      href={s.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] dark:text-teal-400 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Buka Link Meeting
                    </a>
                  )}
                </>
              ) : user ? (
                <Button
                  size="sm"
                  disabled={isFull || bookMut.isPending}
                  onClick={() => bookMut.mutate({ id: s.id, title: s.title })}
                >
                  Booking Sesi Live
                </Button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

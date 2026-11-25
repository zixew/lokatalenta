import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, LogOut, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Course } from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import {
  joinCohortByCodeAsync,
  leaveCohortAsync,
  listStudentCohortsAsync,
} from './cohortApi';

interface StudentCohortCardProps {
  userId: string;
  courses: Course[];
}

export function StudentCohortCard({ userId, courses }: StudentCohortCardProps) {
  const queryClient = useQueryClient();
  const [inviteCode, setInviteCode] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const courseMap: Record<string, Course> = {};
  const titleMap: Record<string, string> = {};
  for (const c of courses) {
    courseMap[c.id] = c;
    titleMap[c.id] = c.title;
  }

  const { data: cohorts = [] } = useQuery({
    queryKey: ['student-cohorts', userId],
    queryFn: () => listStudentCohortsAsync(userId, titleMap),
    enabled: Boolean(userId),
  });

  const joinMut = useMutation({
    mutationFn: () => joinCohortByCodeAsync(userId, inviteCode),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['student-cohorts', userId] });
      setInviteCode('');
      setFeedback({
        ok: true,
        msg: res.alreadyJoined
          ? `Anda sudah tergabung di cohort "${res.name}".`
          : `Berhasil bergabung ke cohort "${res.name}"!`,
      });
    },
    onError: (err: Error) => {
      setFeedback({ ok: false, msg: err.message || 'Gagal bergabung ke cohort.' });
    },
  });

  const leaveMut = useMutation({
    mutationFn: (cohortId: string) => leaveCohortAsync(userId, cohortId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-cohorts', userId] });
    },
  });

  return (
    <section className="bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0F766E]" />
            Cohort &amp; Kelas Privat
          </h2>
          <p className="text-xs text-[#71717A] dark:text-slate-400 mt-0.5">
            Masukkan kode undangan dari pengajar/mentor untuk bergabung ke kelas privat.
          </p>
        </div>
        <Badge tone="slate">{cohorts.length} Cohort</Badge>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setFeedback(null);
          joinMut.mutate();
        }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          placeholder="Masukkan kode undangan (mis. LOKA-XXXXXX)"
          className="flex-1 px-3.5 py-2 rounded-lg border border-[#D4D4CE] dark:border-[#282E3D] bg-[#F4F4F1] dark:bg-slate-900 text-sm font-mono-tabular uppercase text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
        />
        <Button type="submit" size="sm" disabled={joinMut.isPending || !inviteCode.trim()}>
          {joinMut.isPending ? 'Memproses...' : 'Gabung Cohort'}
        </Button>
      </form>

      {feedback && (
        <p
          className={`text-xs font-semibold ${
            feedback.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {feedback.msg}
        </p>
      )}

      {cohorts.length > 0 && (
        <div className="space-y-2.5">
          {cohorts.map((cohort) => {
            const linkedCourse = cohort.course_id ? courseMap[cohort.course_id] : undefined;
            return (
              <div
                key={cohort.id}
                className="p-3.5 rounded-xl border border-[#D4D4CE] dark:border-[#282E3D] bg-[#F4F4F1] dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-[#18181B] dark:text-white">
                      {cohort.name}
                    </p>
                    <Badge tone="emerald">Aktif</Badge>
                  </div>
                  {cohort.course_title && (
                    <p className="text-xs text-[#71717A] dark:text-slate-400">
                      Kursus: {cohort.course_title}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {linkedCourse && (
                    <Link to={`/courses/${linkedCourse.slug}`}>
                      <Button variant="secondary" size="sm">
                        Buka Kursus
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Keluar dari cohort"
                    disabled={leaveMut.isPending}
                    onClick={() => leaveMut.mutate(cohort.id)}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

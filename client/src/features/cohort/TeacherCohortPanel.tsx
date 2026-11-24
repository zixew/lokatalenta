import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Download, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import type { Course } from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { downloadCsvFile } from '../admin/adminCsvExport';
import {
  buildCohortSummaryCsv,
  createCohortAsync,
  listTeacherCohortsAsync,
} from './cohortApi';

interface TeacherCohortPanelProps {
  teacherId: string;
  courses: Course[];
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function TeacherCohortPanel({
  teacherId,
  courses,
  onSuccess,
  onError,
}: TeacherCohortPanelProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [courseId, setCourseId] = useState('');
  const [maxMembers, setMaxMembers] = useState(30);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const courseTitleMap: Record<string, string> = {};
  for (const c of courses) {
    courseTitleMap[c.id] = c.title;
  }

  const { data: cohorts = [] } = useQuery({
    queryKey: ['teacher-cohorts', teacherId],
    queryFn: () => listTeacherCohortsAsync(teacherId, courseTitleMap),
    enabled: Boolean(teacherId),
  });

  const createMut = useMutation({
    mutationFn: () =>
      createCohortAsync({
        teacherId,
        name,
        courseId: courseId || null,
        courseTitle: courseId ? courseTitleMap[courseId] : undefined,
        maxMembers,
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-cohorts', teacherId] });
      setName('');
      onSuccess(`Cohort "${created.name}" (${created.invite_code}) berhasil dibuat.`);
    },
    onError: (err: Error) => {
      onError(err.message || 'Gagal membuat cohort.');
    },
  });

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Create Cohort */}
      <section className="lg:col-span-5 bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#0F766E]" />
          <h2 className="text-base font-bold text-[#18181B] dark:text-white">
            Buat Cohort / Kelas Privat
          </h2>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMut.mutate();
          }}
          className="space-y-3.5"
        >
          <div>
            <label className="block text-xs font-semibold text-[#18181B] dark:text-slate-200 mb-1">
              Nama Cohort / Batch
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: BUMN Batch 2026 - Kelas Intensif"
              className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#18181B] dark:text-slate-200 mb-1">
              Tautkan Kursus Wajib (Opsional)
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            >
              <option value="">-- Tanpa kursus spesifik --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#18181B] dark:text-slate-200 mb-1">
              Kuota Maksimal Peserta
            </label>
            <input
              type="number"
              min={5}
              max={500}
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
          </div>

          <Button type="submit" disabled={createMut.isPending} className="w-full">
            <Plus className="w-4 h-4" />
            {createMut.isPending ? 'Membuat Cohort...' : 'Buat Cohort & Kode Undangan'}
          </Button>
        </form>
      </section>

      {/* Right: Cohort List */}
      <section className="lg:col-span-7 bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#18181B] dark:text-white">
              Daftar Cohort Aktif ({cohorts.length})
            </h2>
            <p className="text-xs text-[#71717A] dark:text-slate-400">
              Bagikan kode undangan kepada peserta agar tergabung otomatis ke kelompok.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={cohorts.length === 0}
            onClick={() =>
              downloadCsvFile(
                `lokatalenta-cohorts-${new Date().toISOString().slice(0, 10)}.csv`,
                buildCohortSummaryCsv(cohorts)
              )
            }
          >
            <Download className="w-3.5 h-3.5" />
            Unduh CSV Cohort
          </Button>
        </div>

        {cohorts.length === 0 ? (
          <div className="py-10 text-center text-sm text-[#71717A] dark:text-slate-400">
            Belum ada cohort yang dibuat. Buat cohort pertama di formulir sebelah kiri.
          </div>
        ) : (
          <div className="space-y-3">
            {cohorts.map((cohort) => (
              <div
                key={cohort.id}
                className="p-4 rounded-xl border border-[#E5E3DC] dark:border-slate-800 bg-[#F6F5F1] dark:bg-slate-900 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm text-[#18181B] dark:text-white">
                      {cohort.name}
                    </p>
                    {cohort.course_title && (
                      <p className="text-xs text-[#71717A] dark:text-slate-400 mt-0.5">
                        Kursus: {cohort.course_title}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={cohort.member_count >= cohort.max_members ? 'amber' : 'emerald'}>
                      {cohort.member_count}/{cohort.max_members} Peserta
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E5E3DC] dark:border-slate-800">
                  <code className="px-2.5 py-1 rounded-md bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-700 text-xs font-bold font-mono-tabular text-[#0F766E] dark:text-teal-400">
                    {cohort.invite_code}
                  </code>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCopy(cohort.id, cohort.invite_code)}
                  >
                    {copiedId === cohort.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedId === cohort.id ? 'Tersalin!' : 'Salin Kode'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

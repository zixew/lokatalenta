import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ArchiveRestore, Check, Copy, Download, Plus, Trash2, Users, X } from 'lucide-react';
import { useState } from 'react';
import type { Course } from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { downloadCsvFile } from '../admin/adminCsvExport';
import {
  buildCohortSummaryCsv,
  createCohortAsync,
  listCohortMembers,
  listTeacherCohortsAsync,
  removeCohortMember,
  toggleCohortArchive,
  type CohortRecord,
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
  const [selectedCohort, setSelectedCohort] = useState<CohortRecord | null>(null);

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

  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['cohort-members', selectedCohort?.id],
    queryFn: () => listCohortMembers(selectedCohort!.id),
    enabled: Boolean(selectedCohort),
  });

  const removeMemberMut = useMutation({
    mutationFn: ({ cohortId, userId }: { cohortId: string; userId: string }) =>
      removeCohortMember(cohortId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohort-members', selectedCohort?.id] });
      queryClient.invalidateQueries({ queryKey: ['teacher-cohorts', teacherId] });
      onSuccess('Peserta berhasil dikeluarkan dari cohort.');
    },
    onError: (err: Error) => {
      onError(err.message || 'Gagal mengeluarkan peserta.');
    },
  });

  const toggleArchiveMut = useMutation({
    mutationFn: ({ cohortId, nextIsActive }: { cohortId: string; nextIsActive: boolean }) =>
      toggleCohortArchive(cohortId, nextIsActive),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-cohorts', teacherId] });
      onSuccess(vars.nextIsActive ? 'Cohort diaktifkan kembali.' : 'Cohort berhasil diarsipkan.');
    },
    onError: (err: Error) => {
      onError(err.message || 'Gagal mengubah status arsip cohort.');
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
                    <Badge tone={cohort.is_active ? 'emerald' : 'slate'}>
                      {cohort.is_active ? 'Aktif' : 'Diarsipkan'}
                    </Badge>
                    <Badge tone={cohort.member_count >= cohort.max_members ? 'amber' : 'emerald'}>
                      {cohort.member_count}/{cohort.max_members} Peserta
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E5E3DC] dark:border-slate-800">
                  <code className="px-2.5 py-1 rounded-md bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-700 text-xs font-bold font-mono-tabular text-[#0F766E] dark:text-teal-400">
                    {cohort.invite_code}
                  </code>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedCohort(cohort)}
                    >
                      <Users className="w-3.5 h-3.5" />
                      Anggota ({cohort.member_count})
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={toggleArchiveMut.isPending}
                      onClick={() =>
                        toggleArchiveMut.mutate({
                          cohortId: cohort.id,
                          nextIsActive: !cohort.is_active,
                        })
                      }
                    >
                      {cohort.is_active ? (
                        <>
                          <Archive className="w-3.5 h-3.5" />
                          Arsipkan
                        </>
                      ) : (
                        <>
                          <ArchiveRestore className="w-3.5 h-3.5" />
                          Aktifkan
                        </>
                      )}
                    </Button>
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
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cohort Members Modal */}
      {selectedCohort && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Anggota Cohort ${selectedCohort.name}`}
        >
          <div className="w-full max-w-lg bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E3DC] dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#18181B] dark:text-white">
                  Anggota Cohort: {selectedCohort.name}
                </h3>
                <p className="text-xs text-[#71717A] dark:text-slate-400">
                  Kode: <span className="font-mono-tabular font-semibold">{selectedCohort.invite_code}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCohort(null)}
                aria-label="Tutup modal anggota"
                className="p-1.5 rounded-lg text-[#71717A] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-2.5">
              {loadingMembers ? (
                <p className="text-sm text-[#71717A] dark:text-slate-400 text-center py-6">
                  Memuat daftar anggota...
                </p>
              ) : members.length === 0 ? (
                <p className="text-sm text-[#71717A] dark:text-slate-400 text-center py-6">
                  Belum ada peserta yang bergabung ke cohort ini.
                </p>
              ) : (
                members.map((member) => (
                  <div
                    key={member.user_id}
                    className="p-3 rounded-xl border border-[#E5E3DC] dark:border-slate-800 bg-[#F6F5F1] dark:bg-slate-900 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#18181B] dark:text-white truncate">
                        {member.full_name || `Peserta (${member.user_id.slice(0, 8)})`}
                      </p>
                      <p className="text-xs text-[#71717A] dark:text-slate-400 truncate">
                        {member.email ? `${member.email} • ` : ''}
                        Gabung {new Date(member.joined_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={removeMemberMut.isPending}
                      onClick={() =>
                        removeMemberMut.mutate({
                          cohortId: selectedCohort.id,
                          userId: member.user_id,
                        })
                      }
                      className="text-rose-600 dark:text-rose-400 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Keluarkan
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  ExternalLink,
  PlusCircle,
  Search,
  Star,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../shared/lib/supabase';
import { DEFAULT_ASSIGNMENT_RUBRIC, lmsApi } from '../../shared/services/lmsApi';
import type {
  AssignmentRubricItem,
  AssignmentSubmission,
  Course,
  CourseAssignment,
  SubmissionStatus,
} from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { SearchablePicker } from '../../shared/ui/SearchablePicker';
import { useAuthStore } from '../auth/useAuthStore';
import { listTeacherCohortsAsync } from '../cohort/cohortApi';

export function TeacherAssignmentsTab({
  courses,
  onSuccess,
  onError,
}: {
  courses: Course[];
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [cohortId, setCohortId] = useState('');
  const [assignmentCohortFilter, setAssignmentCohortFilter] = useState('all');
  const [title, setTitle] = useState('');
  const [taskBrief, setTaskBrief] = useState('');
  const [howToGuide, setHowToGuide] = useState('');
  const [rubric, setRubric] = useState<AssignmentRubricItem[]>(DEFAULT_ASSIGNMENT_RUBRIC);
  const [rubricOpen, setRubricOpen] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [subSearch, setSubSearch] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState<'all' | 'submitted' | 'approved' | 'rejected'>('all');
  const [pendingDeleteAssignment, setPendingDeleteAssignment] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const { data: rawAssignments = [] } = useQuery({
    queryKey: ['all-assignments'],
    queryFn: () => lmsApi.listAllAssignments(),
  });

  const { data: rawSubmissions = [] } = useQuery({
    queryKey: ['teacher-submissions'],
    queryFn: () => lmsApi.listAllSubmissionsForTeacher(),
  });

  const { data: cohorts = [] } = useQuery({
    queryKey: ['teacher-cohorts', user?.id],
    queryFn: () => (user?.id ? listTeacherCohortsAsync(user.id) : Promise.resolve([])),
    enabled: Boolean(user?.id),
  });
  const cohortNameMap = new Map(cohorts.map((c) => [c.id, c.name]));

  const teacherCourseIds = new Set(courses.map((c) => c.id));
  const assignments = rawAssignments.filter((a) => teacherCourseIds.has(a.course_id));
  const filteredAssignments = assignments.filter((a) => {
    if (assignmentCohortFilter === 'all') return true;
    if (assignmentCohortFilter === 'public') return !a.cohort_id;
    return a.cohort_id === assignmentCohortFilter;
  });
  const submissions = rawSubmissions.filter((sub) => {
    const asg = rawAssignments.find((a) => a.id === sub.assignment_id);
    const cid = asg?.course_id ?? sub.assignment_id.replace('asg-default-', '');
    return teacherCourseIds.has(cid);
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const created = await lmsApi.createCourseAssignment({
        course_id: courseId || courses[0]?.id || '',
        title: title.trim(),
        instructions: taskBrief.trim(),
        requires_file: true,
        task_brief: taskBrief.trim(),
        how_to_guide: howToGuide.trim(),
        rubric,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        max_score: 100,
        created_by: user?.id ?? null,
      });
      if (cohortId) {
        if (isSupabaseConfigured && supabase) {
          await supabase
            .from('course_assignments')
            .update({ cohort_id: cohortId })
            .eq('id', created.id);
        } else {
          try {
            const raw = localStorage.getItem('ruanglatih_demo_assignments_v1');
            if (raw) {
              const list = JSON.parse(raw) as CourseAssignment[];
              localStorage.setItem(
                'ruanglatih_demo_assignments_v1',
                JSON.stringify(
                  list.map((item) =>
                    item.id === created.id ? { ...item, cohort_id: cohortId } : item
                  )
                )
              );
            }
          } catch {
            // ignore storage errors
          }
        }
      }
      return created;
    },
    onSuccess: () => {
      setTitle('');
      setTaskBrief('');
      setHowToGuide('');
      setDueDate('');
      setCohortId('');
      queryClient.invalidateQueries({ queryKey: ['all-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['course-assignments'] });
      onSuccess('Tugas upload file beserta panduan & rubrik bintang 1–5 berhasil dibuat.');
    },
    onError: (err: Error) => onError(err.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => lmsApi.deleteCourseAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['course-assignments'] });
      onSuccess('Tugas berhasil dihapus.');
    },
  });

  const courseName = (cId: string) =>
    courses.find((c) => c.id === cId)?.title ?? 'Kursus';

  const updateRubricDesc = (stars: number, description: string) => {
    setRubric((prev) =>
      prev.map((item) => (item.stars === stars ? { ...item, description } : item))
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Create File-Upload Assignment + Rubric */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-[#0F766E]" />
            Buat Tugas Upload File &amp; Rubrik ★ 1–5
          </h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              createMut.mutate();
            }}
            className="space-y-3"
          >
            <SearchablePicker
              label="Pilih Kursus"
              placeholder="Cari judul atau kategori kursus..."
              value={courseId || courses[0]?.id || ''}
              onChange={(id) => setCourseId(id)}
              options={courses.map((c) => ({
                id: c.id,
                label: c.title,
                sublabel: `${c.category} • ${c.level}`,
              }))}
            />

            <div>
              <label className="block text-xs font-semibold text-[#52525B] dark:text-slate-300 mb-1">
                Target Cohort (Opsional)
              </label>
              <select
                value={cohortId}
                onChange={(e) => setCohortId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#18181B] dark:text-white"
              >
                <option value="">Semua Peserta</option>
                {cohorts
                  .filter((c) => c.is_active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#52525B] dark:text-slate-300 mb-1">
                Judul Tugas
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Upload Lembar Latihan Menulis Hiragana"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#18181B] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#52525B] dark:text-slate-300 mb-1">
                Instruksi Tugas &amp; Aturan Format File
              </label>
              <textarea
                rows={3}
                required
                value={taskBrief}
                onChange={(e) => setTaskBrief(e.target.value)}
                placeholder="Jelaskan tugas yang wajib dikerjakan dan format file yang harus diunggah..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#18181B] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#52525B] dark:text-slate-300 mb-1">
                Panduan Langkah Pengerjaan (Opsional)
              </label>
              <textarea
                rows={3}
                value={howToGuide}
                onChange={(e) => setHowToGuide(e.target.value)}
                placeholder="Langkah 1... Langkah 2... agar siswa mudah mengikuti..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#18181B] dark:text-white"
              />
            </div>

            <div className="rounded-xl border border-[#E5E3DC] dark:border-slate-700 bg-[#F6F5F1]/60 dark:bg-slate-800/40 p-3 space-y-2">
              <button
                type="button"
                onClick={() => setRubricOpen((v) => !v)}
                className="w-full flex items-center justify-between text-left cursor-pointer"
              >
                <span className="text-xs font-semibold text-[#18181B] dark:text-slate-200">
                  Rubrik Penilaian Bintang 1 – 5 (Default siap pakai)
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#71717A] transition-transform ${
                    rubricOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {rubricOpen && (
                <div className="space-y-1.5 pt-1">
                  {rubric.map((r) => (
                    <div key={r.stars} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-500 w-10 shrink-0">
                        ★ {r.stars}
                      </span>
                      <input
                        type="text"
                        value={r.description}
                        onChange={(e) => updateRubricDesc(r.stars, e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#18181B] dark:text-white"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#52525B] dark:text-slate-300 mb-1">
                Batas Waktu (Opsional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#18181B] dark:text-white"
              />
            </div>

            <Button type="submit" disabled={createMut.isPending} className="w-full">
              Simpan Tugas
            </Button>
          </form>
        </div>

        <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#18181B] dark:text-white">
              Daftar Tugas Kustom ({filteredAssignments.length})
            </h3>
            {cohorts.length > 0 && (
              <select
                value={assignmentCohortFilter}
                onChange={(e) => setAssignmentCohortFilter(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-[#F6F5F1] dark:bg-slate-800 text-[#18181B] dark:text-white"
              >
                <option value="all">Semua Target</option>
                <option value="public">Semua Peserta</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    Cohort: {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          {filteredAssignments.length === 0 ? (
            <p className="text-xs text-[#71717A] dark:text-slate-400">
              Setiap kursus sudah memiliki tugas upload file bawaan; Anda juga bisa membuat tugas khusus di atas.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {filteredAssignments.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl bg-[#F6F5F1] dark:bg-slate-800/60 border border-[#E5E3DC] dark:border-slate-700 flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-xs font-bold text-[#18181B] dark:text-white truncate">
                        {a.title}
                      </p>
                      {a.cohort_id && (
                        <Badge tone="blue">
                          {cohortNameMap.get(a.cohort_id) ?? 'Khusus Cohort'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-[#71717A] dark:text-slate-400 truncate">
                      {courseName(a.course_id)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteAssignment({ id: a.id, title: a.title })}
                    className="p-1.5 rounded-lg text-[#71717A] hover:text-rose-600 cursor-pointer"
                    title="Hapus tugas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Submissions Grading with 1-5 Star Rubric & Approve/Reject */}
      <div className="lg:col-span-7 bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="space-y-3">
          <h2 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-[#0F766E]" />
            Pemeriksaan File &amp; Penilaian Rubrik ({submissions.length})
          </h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
                placeholder="Cari nama pelajar atau file..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-[#F6F5F1] dark:bg-slate-900"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {(['all', 'submitted', 'approved', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSubStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    subStatusFilter === st
                      ? 'bg-[#0F766E] text-white'
                      : 'bg-[#F6F5F1] dark:bg-slate-800 text-[#52525B] dark:text-slate-300'
                  }`}
                >
                  {st === 'all'
                    ? 'Semua'
                    : st === 'submitted'
                    ? 'Menunggu'
                    : st === 'approved'
                    ? 'Diterima'
                    : 'Ditolak'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {submissions.length === 0 ? (
          <p className="text-sm text-[#71717A] dark:text-slate-400 py-8 text-center">
            Belum ada file tugas yang dikumpulkan oleh pelajar.
          </p>
        ) : (
          <div className="space-y-4">
            {submissions
              .filter((sub) => {
                if (subStatusFilter === 'submitted' && sub.status !== 'submitted') return false;
                if (
                  subStatusFilter === 'approved' &&
                  sub.status !== 'approved' &&
                  sub.status !== 'graded'
                ) {
                  return false;
                }
                if (
                  subStatusFilter === 'rejected' &&
                  sub.status !== 'rejected' &&
                  sub.status !== 'needs_revision'
                ) {
                  return false;
                }
                const q = subSearch.trim().toLowerCase();
                if (
                  q &&
                  !`${sub.student_name} ${sub.attachment_name ?? ''}`.toLowerCase().includes(q)
                ) {
                  return false;
                }
                return true;
              })
              .map((sub) => {
              const asg = assignments.find((a) => a.id === sub.assignment_id);
              const matchedCourse = courses.find(
                (c) => c.id === (asg?.course_id ?? sub.assignment_id.replace('asg-default-', ''))
              );
              return (
                <SubmissionGradeRow
                  key={sub.id}
                  submission={sub}
                  assignment={asg}
                  courseSlug={matchedCourse?.slug}
                  onGraded={(msg) => {
                    queryClient.invalidateQueries({ queryKey: ['teacher-submissions'] });
                    queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
                    queryClient.invalidateQueries({ queryKey: ['notifications'] });
                    onSuccess(msg);
                  }}
                  onValidationError={onError}
                />
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDeleteAssignment)}
        title="Hapus Tugas"
        description={
          pendingDeleteAssignment
            ? `Hapus tugas "${pendingDeleteAssignment.title}" secara permanen?`
            : ''
        }
        confirmLabel="Hapus Tugas"
        tone="danger"
        onCancel={() => setPendingDeleteAssignment(null)}
        onConfirm={() => {
          if (pendingDeleteAssignment) {
            deleteMut.mutate(pendingDeleteAssignment.id);
          }
          setPendingDeleteAssignment(null);
        }}
      />
    </div>
  );
}

function SubmissionGradeRow({
  submission,
  assignment,
  courseSlug,
  onGraded,
  onValidationError,
}: {
  submission: AssignmentSubmission;
  assignment?: CourseAssignment;
  courseSlug?: string;
  onGraded: (msg: string) => void;
  onValidationError: (msg: string) => void;
}) {
  const [stars, setStars] = useState<number>(submission.rating_stars ?? 5);
  const [feedback, setFeedback] = useState(submission.feedback ?? '');

  const rubric =
    assignment?.rubric && assignment.rubric.length > 0
      ? assignment.rubric
      : DEFAULT_ASSIGNMENT_RUBRIC;
  const activeRubric = rubric.find((r) => r.stars === stars) ?? rubric[rubric.length - 1];

  const gradeMut = useMutation({
    mutationFn: (status: SubmissionStatus) =>
      lmsApi.gradeAssignmentSubmission(submission.id, {
        rating_stars: status === 'rejected' ? null : stars,
        score: status === 'rejected' ? 0 : stars * 20,
        feedback: feedback.trim(),
        status,
        courseId: assignment?.course_id,
        courseSlug,
        assignmentTitle: assignment?.title ?? 'Tugas Praktik',
      }),
    onSuccess: (_data, status) => {
      onGraded(
        status === 'rejected'
          ? 'Tugas ditolak. Siswa telah diberitahu untuk mengunggah ulang.'
          : `Selamat! Tugas diterima dengan nilai ★ ${stars}/5.`
      );
    },
  });

  const handleApprove = () => {
    if (!feedback.trim()) {
      setFeedback('Selamat! Tugas Anda sudah sesuai kriteria dan diterima dengan baik.');
    }
    gradeMut.mutate('approved');
  };

  const handleReject = () => {
    if (!feedback.trim()) {
      onValidationError('Harap tuliskan alasan mengapa file tugas ditolak sebelum menolak.');
      return;
    }
    gradeMut.mutate('rejected');
  };

  return (
    <div className="p-4 rounded-xl bg-[#F6F5F1] dark:bg-slate-800/50 border border-[#E5E3DC] dark:border-slate-700 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-[#18181B] dark:text-white">
            {submission.student_name}
          </p>
          <p className="text-xs text-[#71717A] dark:text-slate-400">
            {assignment?.title ?? 'Tugas Praktik'} •{' '}
            {new Date(submission.submitted_at).toLocaleString('id-ID')}
          </p>
        </div>
        <Badge
          tone={
            submission.status === 'approved' || submission.status === 'graded'
              ? 'emerald'
              : submission.status === 'rejected' || submission.status === 'needs_revision'
              ? 'rose'
              : 'blue'
          }
        >
          {submission.status === 'approved' || submission.status === 'graded'
            ? `Diterima ★ ${submission.rating_stars ?? '-'}/5 (${submission.score ?? 0})`
            : submission.status === 'rejected' || submission.status === 'needs_revision'
            ? 'Ditolak (Perlu Upload Ulang)'
            : 'Menunggu Pemeriksaan'}
        </Badge>
      </div>

      {submission.attachment_url && (
        <a
          href={submission.attachment_url}
          target="_blank"
          rel="noreferrer"
          download={submission.attachment_name || 'file-tugas'}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-700 text-xs font-semibold text-[#0F766E] dark:text-teal-400 hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Periksa File: {submission.attachment_name || 'Lampiran Pelajar'}
        </a>
      )}

      {submission.submission_text && (
        <div className="p-3 rounded-lg bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-700 text-xs text-[#18181B] dark:text-slate-200 whitespace-pre-wrap">
          {submission.submission_text}
        </div>
      )}

      {/* 1-5 Star Rubric Selector */}
      <div className="p-3 rounded-lg bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-700 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#18181B] dark:text-white">
            Pilih Penilaian Rubrik:
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStars(s)}
                aria-label={`Nilai ${s} bintang`}
                className="p-1 cursor-pointer"
              >
                <Star
                  className={`w-4 h-4 ${
                    s <= stars
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-slate-300 dark:text-slate-600'
                  }`}
                />
              </button>
            ))}
            <span className="text-xs font-bold text-[#0F766E] dark:text-teal-400 ml-1">
              ({stars * 20} poin)
            </span>
          </div>
        </div>
        <p className="text-[11px] text-[#52525B] dark:text-slate-300">
          <strong>{activeRubric.label}:</strong> {activeRubric.description}
        </p>
      </div>

      <input
        type="text"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Tulis ucapan selamat (jika diterima) atau alasan penolakan (jika ditolak)..."
        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-[#161B22] text-[#18181B] dark:text-white"
      />

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={gradeMut.isPending}
          className="flex-1 text-xs"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Terima &amp; Nilai (★ {stars})
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleReject}
          disabled={gradeMut.isPending}
          className="text-xs text-rose-700 dark:text-rose-300"
        >
          <XCircle className="w-3.5 h-3.5" />
          Tolak &amp; Minta Upload Ulang
        </Button>
      </div>
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Compass,
  ExternalLink,
  FileUp,
  ListChecks,
  Send,
  Star,
} from 'lucide-react';
import { useState } from 'react';
import { DEFAULT_ASSIGNMENT_RUBRIC, lmsApi } from '../../shared/services/lmsApi';
import type { AssignmentSubmission, CourseAssignment } from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { useAuthStore } from '../auth/useAuthStore';
import { listStudentCohortsAsync } from '../cohort/cohortApi';

type GuideTab = 'brief' | 'howto' | 'rubric';

export function AssignmentPanel({
  courseId,
  courseSlug,
  lessonId,
}: {
  courseId: string;
  courseSlug?: string;
  lessonId: string;
}) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: assignments = [] } = useQuery({
    queryKey: ['course-assignments', courseId],
    queryFn: () => lmsApi.listCourseAssignments(courseId),
    enabled: Boolean(courseId),
  });

  const { data: mySubmissions = [] } = useQuery({
    queryKey: ['my-submissions', user?.id],
    queryFn: () => (user ? lmsApi.listMySubmissions(user.id) : Promise.resolve([])),
    enabled: Boolean(user),
  });

  const { data: myCohorts = [] } = useQuery({
    queryKey: ['student-cohorts', user?.id],
    queryFn: () => (user ? listStudentCohortsAsync(user.id) : Promise.resolve([])),
    enabled: Boolean(user?.id),
  });

  const myCohortIds = new Set(myCohorts.map((c) => c.id));
  const cohortNameMap = new Map(myCohorts.map((c) => [c.id, c.name]));

  const visibleAssignments = assignments.filter((a) => {
    const lessonMatch = !a.lesson_id || a.lesson_id === lessonId;
    if (!lessonMatch) return false;
    if (!a.cohort_id) return true;
    if (user?.role === 'teacher' || user?.role === 'admin') return true;
    return myCohortIds.has(a.cohort_id);
  });

  if (visibleAssignments.length === 0) {
    return (
      <div className="p-6 text-center rounded-xl border border-dashed border-[#E5E3DC] dark:border-slate-700">
        <ClipboardList className="w-7 h-7 text-[#71717A] mx-auto mb-2 opacity-70" />
        <p className="text-sm font-medium text-[#18181B] dark:text-white">
          Belum ada tugas untuk materi ini
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleAssignments.map((assignment) => {
        const submission = mySubmissions.find((s) => s.assignment_id === assignment.id);
        return (
          <AssignmentCard
            key={assignment.id}
            assignment={assignment}
            cohortName={assignment.cohort_id ? cohortNameMap.get(assignment.cohort_id) : undefined}
            submission={submission}
            courseSlug={courseSlug ?? courseId}
            onSubmitted={() => {
              queryClient.invalidateQueries({ queryKey: ['my-submissions', user?.id] });
              queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
            }}
          />
        );
      })}
    </div>
  );
}

function AssignmentCard({
  assignment,
  cohortName,
  submission,
  courseSlug,
  onSubmitted,
}: {
  assignment: CourseAssignment;
  cohortName?: string;
  submission?: AssignmentSubmission;
  courseSlug: string;
  onSubmitted: () => void;
}) {
  const { user } = useAuthStore();
  const [guideTab, setGuideTab] = useState<GuideTab>('brief');
  const [text, setText] = useState(submission?.submission_text ?? '');
  const [fileUrl, setFileUrl] = useState(submission?.attachment_url ?? '');
  const [fileName, setFileName] = useState(submission?.attachment_name ?? '');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [savedMsg, setSavedMsg] = useState(false);

  const rubric =
    assignment.rubric && assignment.rubric.length > 0
      ? assignment.rubric
      : DEFAULT_ASSIGNMENT_RUBRIC;

  const isRejected =
    submission?.status === 'rejected' || submission?.status === 'needs_revision';
  const isApproved =
    submission?.status === 'approved' || submission?.status === 'graded';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadError('');
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 5 MB.');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await lmsApi.uploadAssignmentFile(file, user.id);
      setFileUrl(uploaded.url);
      setFileName(uploaded.name);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Gagal mengunggah file.');
    } finally {
      setUploading(false);
    }
  };

  const submitMut = useMutation({
    mutationFn: async () => {
      const res = await lmsApi.submitAssignment({
        assignment_id: assignment.id,
        user_id: user!.id,
        student_name: user!.full_name,
        submission_text: text.trim(),
        attachment_url: fileUrl || null,
        attachment_name: fileName || null,
      });
      await lmsApi.createNotification({
        user_id: user!.id,
        type: 'course',
        title: `Tugas Terkirim: ${assignment.title}`,
        message: `File "${fileName || 'lampiran'}" telah dikirim dan menunggu pemeriksaan mentor.`,
        link: `/courses/${courseSlug}`,
      });
      return res;
    },
    onSuccess: () => {
      setSavedMsg(true);
      onSubmitted();
      setTimeout(() => setSavedMsg(false), 3000);
    },
  });

  const statusBadge = () => {
    if (!submission) return <Badge tone="slate">Belum Upload File</Badge>;
    if (isApproved) {
      return (
        <Badge tone="emerald">
          Diterima • {submission.rating_stars ? `★ ${submission.rating_stars}/5` : ''} ({submission.score ?? 0}/{assignment.max_score})
        </Badge>
      );
    }
    if (isRejected) {
      return <Badge tone="rose">Ditolak • Wajib Upload Ulang</Badge>;
    }
    return <Badge tone="blue">Menunggu Pemeriksaan Mentor</Badge>;
  };

  const requiresFile = assignment.requires_file ?? true;
  const canSubmit = (!requiresFile || Boolean(fileUrl)) && !uploading && !submitMut.isPending;

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#F6F5F1] dark:bg-slate-800/50 border border-[#E5E3DC] dark:border-slate-700 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-bold text-[#18181B] dark:text-white">{assignment.title}</h4>
            {assignment.cohort_id && (
              <Badge tone="blue">{cohortName ? `Cohort: ${cohortName}` : 'Khusus Cohort'}</Badge>
            )}
          </div>
          {assignment.due_date && (
            <p className="text-[11px] text-[#71717A] dark:text-slate-400 inline-flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" />
              Batas waktu:{' '}
              {new Date(assignment.due_date).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
        {statusBadge()}
      </div>

      {/* 3 Guide Tabs: Yang Harus Dikerjakan | Cara Mengerjakan | Kriteria Penilaian (1-5) */}
      <div className="flex flex-wrap gap-1.5 border-b border-[#E5E3DC] dark:border-slate-700 pb-2.5">
        <button
          type="button"
          onClick={() => setGuideTab('brief')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
            guideTab === 'brief'
              ? 'bg-[#0F766E] text-white'
              : 'bg-white dark:bg-[#161B22] text-[#52525B] dark:text-slate-300 border border-[#E5E3DC] dark:border-slate-700'
          }`}
        >
          <ListChecks className="w-3.5 h-3.5" />
          Yang Harus Dikerjakan
        </button>

        <button
          type="button"
          onClick={() => setGuideTab('howto')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
            guideTab === 'howto'
              ? 'bg-[#0F766E] text-white'
              : 'bg-white dark:bg-[#161B22] text-[#52525B] dark:text-slate-300 border border-[#E5E3DC] dark:border-slate-700'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          Cara Mengerjakan
        </button>

        <button
          type="button"
          onClick={() => setGuideTab('rubric')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
            guideTab === 'rubric'
              ? 'bg-[#0F766E] text-white'
              : 'bg-white dark:bg-[#161B22] text-[#52525B] dark:text-slate-300 border border-[#E5E3DC] dark:border-slate-700'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          Penilaian (★ 1–5)
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-700 text-xs">
        {guideTab === 'brief' && (
          <div className="space-y-1.5 text-[#18181B] dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
            <p className="font-bold text-[#0F766E] dark:text-teal-400">
              Aturan &amp; Tugas yang Wajib Dikerjakan:
            </p>
            <p>{assignment.task_brief || assignment.instructions}</p>
          </div>
        )}

        {guideTab === 'howto' && (
          <div className="space-y-1.5 text-[#18181B] dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
            <p className="font-bold text-[#0F766E] dark:text-teal-400">
              Panduan Langkah Pengerjaan:
            </p>
            <p>
              {assignment.how_to_guide ||
                '1. Baca aturan tugas dengan teliti.\n2. Kerjakan pada dokumen atau lembar kerja Anda.\n3. Simpan sebagai file PDF/DOCX/Gambar lalu unggah di form di bawah.'}
            </p>
          </div>
        )}

        {guideTab === 'rubric' && (
          <div className="space-y-2">
            <p className="font-bold text-[#0F766E] dark:text-teal-400">
              Daftar Kriteria Penilaian Mentor (Bintang 1 – Bintang 5):
            </p>
            <div className="space-y-1.5">
              {rubric.map((item) => (
                <div
                  key={item.stars}
                  className="p-2.5 rounded-lg bg-[#F6F5F1] dark:bg-slate-800/60 border border-[#E5E3DC] dark:border-slate-700"
                >
                  <div className="flex items-center gap-1.5 font-bold text-[#18181B] dark:text-white">
                    <span className="text-amber-500">
                      {'★'.repeat(item.stars)}
                      {'☆'.repeat(5 - item.stars)}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  <p className="text-[#52525B] dark:text-slate-300 mt-0.5">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Approved / Rejected Feedback Banner */}
      {isApproved && submission && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
          <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Selamat! Tugas Anda telah diterima dan dinilai
            {submission.rating_stars ? ` (★ ${submission.rating_stars}/5)` : ''}
          </p>
          {submission.feedback && (
            <p className="text-emerald-900 dark:text-emerald-200">{submission.feedback}</p>
          )}
        </div>
      )}

      {isRejected && submission && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs space-y-1">
          <p className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            File Tugas Ditolak — Silakan Perbaiki dan Upload Ulang
          </p>
          <p className="text-rose-900 dark:text-rose-200">
            Alasan mentor: {submission.feedback || 'File belum sesuai kriteria tugas.'}
          </p>
        </div>
      )}

      {/* Upload File Form */}
      {user ? (
        <div className="space-y-2.5 pt-1">
          <label className="block p-3.5 rounded-xl border-2 border-dashed border-[#0F766E]/40 bg-white dark:bg-[#161B22] hover:border-[#0F766E] transition-colors cursor-pointer">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-2 font-semibold text-[#18181B] dark:text-white">
                <FileUp className="w-4 h-4 text-[#0F766E]" />
                {uploading
                  ? 'Mengunggah file...'
                  : fileName
                  ? `File siap: ${fileName}`
                  : 'Pilih File Tugas Wajib (PDF, DOCX, TXT, PNG, JPG — Maks 5 MB)'}
              </span>
              <span className="text-[#0F766E] dark:text-teal-400 font-semibold">
                {fileName ? 'Ganti File' : 'Pilih File'}
              </span>
            </div>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.mp3,.mp4"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {uploadError && <p className="text-xs text-rose-600">{uploadError}</p>}

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="Catatan tambahan untuk mentor (opsional)..."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-[#161B22] text-[#18181B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            {fileUrl ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                download={fileName || 'tugas'}
                className="inline-flex items-center gap-1 text-xs text-[#0F766E] dark:text-teal-400 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Lihat file ({fileName || 'lampiran'})
              </a>
            ) : (
              <span className="text-[11px] text-[#71717A] dark:text-slate-400">
                Wajib upload file hasil kerja sebelum mengirim.
              </span>
            )}

            <Button size="sm" onClick={() => submitMut.mutate()} disabled={!canSubmit}>
              <Send className="w-3.5 h-3.5" />
              {isRejected
                ? 'Upload Ulang Tugas'
                : submission
                ? 'Perbarui File Tugas'
                : 'Kumpulkan Tugas'}
            </Button>
          </div>

          {savedMsg && (
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              File tugas berhasil dikumpulkan dan menunggu pemeriksaan mentor!
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-[#71717A] dark:text-slate-400">
          Masuk ke akun Anda untuk mengunggah tugas ini.
        </p>
      )}
    </div>
  );
}

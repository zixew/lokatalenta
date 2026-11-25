import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Send,
  Trash2,
  Users,
  Video,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../../shared/lib/supabase';
import { lmsApi } from '../../shared/services/lmsApi';
import type {
  Course,
  CourseAnnouncement,
  MentorMessage,
  TeacherCommentItem,
} from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { SearchablePicker } from '../../shared/ui/SearchablePicker';
import { useAuthStore } from '../auth/useAuthStore';
import { listTeacherCohortsAsync } from '../cohort/cohortApi';

type SubTab = 'qa' | 'chat' | 'live';

export function TeacherInteractionTab({
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
  const [subTab, setSubTab] = useState<SubTab>('qa');
  const [qaFilter, setQaFilter] = useState<'unanswered' | 'all'>('unanswered');
  const [confirmDelete, setConfirmDelete] = useState<{
    kind: 'session' | 'announcement';
    id: string;
    title: string;
  } | null>(null);

  // Live session form
  const [sessCourseId, setSessCourseId] = useState(courses[0]?.id ?? '');
  const [sessTitle, setSessTitle] = useState('');
  const [sessTopic, setSessTopic] = useState('');
  const [sessDate, setSessDate] = useState('');
  const [sessUrl, setSessUrl] = useState('');
  const [sessMax, setSessMax] = useState(20);

  // Announcement form
  const [annCourseId, setAnnCourseId] = useState(courses[0]?.id ?? '');
  const [annCohortId, setAnnCohortId] = useState('');
  const [annCohortFilter, setAnnCohortFilter] = useState('all');
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');

  const { data: rawComments = [] } = useQuery({
    queryKey: ['teacher-all-comments'],
    queryFn: () => lmsApi.listAllCommentsForTeacher(),
  });

  const { data: rawMentorMsgs = [] } = useQuery({
    queryKey: ['teacher-mentor-messages'],
    queryFn: () => lmsApi.listAllMentorMessagesForTeacher(),
  });

  const { data: rawSessions = [] } = useQuery({
    queryKey: ['mentoring-sessions'],
    queryFn: () => lmsApi.listMentoringSessions(),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['mentoring-bookings'],
    queryFn: () => lmsApi.listAllMentoringBookings(),
  });

  const { data: rawAnnouncements = [] } = useQuery({
    queryKey: ['course-announcements'],
    queryFn: () => lmsApi.listCourseAnnouncements(),
  });

  const { data: cohorts = [] } = useQuery({
    queryKey: ['teacher-cohorts', user?.id],
    queryFn: () => (user?.id ? listTeacherCohortsAsync(user.id) : Promise.resolve([])),
    enabled: Boolean(user?.id),
  });
  const cohortNameMap = new Map(cohorts.map((c) => [c.id, c.name]));

  const teacherCourseIds = new Set(courses.map((c) => c.id));
  const teacherLessonIds = new Set(
    courses.flatMap((c) => (c.modules ?? []).flatMap((m) => m.lessons.map((l) => l.id)))
  );
  const allComments = rawComments.filter((c) => teacherLessonIds.has(c.lesson_id));
  const allMentorMsgs = rawMentorMsgs.filter((m) => teacherCourseIds.has(m.course_id));
  const sessions = rawSessions.filter((s) => teacherCourseIds.has(s.course_id));
  const announcements = rawAnnouncements.filter((a) => teacherCourseIds.has(a.course_id));
  const filteredAnnouncements = announcements.filter((a) => {
    if (annCohortFilter === 'all') return true;
    if (annCohortFilter === 'public') return !a.cohort_id;
    return a.cohort_id === annCohortFilter;
  });

  const createSessionMut = useMutation({
    mutationFn: () =>
      lmsApi.createMentoringSession({
        course_id: sessCourseId || courses[0]?.id || '',
        mentor_id: user?.id ?? null,
        mentor_name: user?.full_name ?? 'Mentor',
        title: sessTitle.trim(),
        topic: sessTopic.trim(),
        scheduled_at: sessDate ? new Date(sessDate).toISOString() : new Date().toISOString(),
        meeting_url: sessUrl.trim(),
        max_participants: sessMax,
      }),
    onSuccess: () => {
      setSessTitle('');
      setSessTopic('');
      setSessDate('');
      setSessUrl('');
      queryClient.invalidateQueries({ queryKey: ['mentoring-sessions'] });
      onSuccess('Jadwal sesi live berhasil dipublikasikan.');
    },
    onError: (e: Error) => onError(e.message),
  });

  const deleteSessionMut = useMutation({
    mutationFn: (id: string) => lmsApi.deleteMentoringSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentoring-sessions'] });
      onSuccess('Jadwal sesi live dihapus.');
    },
  });

  const createAnnMut = useMutation({
    mutationFn: async () => {
      const targetCourseId = annCourseId || courses[0]?.id || '';
      const targetCourse = courses.find((c) => c.id === targetCourseId);
      const created = await lmsApi.createCourseAnnouncement({
        course_id: targetCourseId,
        course_slug: targetCourse?.slug,
        author_id: user?.id ?? null,
        author_name: user?.full_name ?? 'Mentor',
        title: annTitle.trim(),
        content: annContent.trim(),
      });
      if (annCohortId) {
        if (isSupabaseConfigured && supabase) {
          await supabase
            .from('course_announcements')
            .update({ cohort_id: annCohortId })
            .eq('id', created.id);
        } else {
          try {
            const raw = localStorage.getItem('ruanglatih_course_announcements_v1');
            if (raw) {
              const list = JSON.parse(raw) as CourseAnnouncement[];
              localStorage.setItem(
                'ruanglatih_course_announcements_v1',
                JSON.stringify(
                  list.map((item) =>
                    item.id === created.id ? { ...item, cohort_id: annCohortId } : item
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
      setAnnTitle('');
      setAnnContent('');
      setAnnCohortId('');
      queryClient.invalidateQueries({ queryKey: ['course-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      onSuccess('Pengumuman kursus berhasil dikirim ke pelajar terdaftar.');
    },
    onError: (e: Error) => onError(e.message),
  });

  const deleteAnnMut = useMutation({
    mutationFn: (id: string) => lmsApi.deleteCourseAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-announcements'] });
      onSuccess('Pengumuman dihapus.');
    },
  });

  const filteredQuestions = allComments.filter((c) =>
    qaFilter === 'unanswered' ? !c.has_mentor_reply : true
  );
  const unansweredCount = allComments.filter((c) => !c.has_mentor_reply).length;

  // Group 1-on-1 messages by (course_id + student_id)
  const threadMap = new Map<string, MentorMessage[]>();
  for (const m of allMentorMsgs) {
    const key = `${m.course_id}::${m.student_id}`;
    const arr = threadMap.get(key) ?? [];
    arr.push(m);
    threadMap.set(key, arr);
  }
  const threads = Array.from(threadMap.entries());

  const courseTitle = (cId: string) => courses.find((c) => c.id === cId)?.title ?? 'Kursus';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSubTab('qa')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
            subTab === 'qa'
              ? 'bg-[#0F766E] text-white'
              : 'bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] text-[#52525B] dark:text-slate-300'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Inbox Pertanyaan Q&amp;A ({unansweredCount} belum dijawab)
        </button>

        <button
          type="button"
          onClick={() => setSubTab('chat')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
            subTab === 'chat'
              ? 'bg-[#0F766E] text-white'
              : 'bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] text-[#52525B] dark:text-slate-300'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Konsultasi Privat ({threads.length})
        </button>

        <button
          type="button"
          onClick={() => setSubTab('live')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
            subTab === 'live'
              ? 'bg-[#0F766E] text-white'
              : 'bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] text-[#52525B] dark:text-slate-300'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          Sesi Live &amp; Pengumuman
        </button>
      </div>

      {/* SUBTAB 1: Q&A INBOX */}
      {subTab === 'qa' && (
        <div className="bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-[#18181B] dark:text-white">
              Pertanyaan Pelajar di Materi Kursus
            </h2>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setQaFilter('unanswered')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  qaFilter === 'unanswered'
                    ? 'bg-[#0F766E] text-white'
                    : 'bg-[#F4F4F1] dark:bg-slate-800 text-[#52525B] dark:text-slate-300'
                }`}
              >
                Belum Dijawab ({unansweredCount})
              </button>
              <button
                type="button"
                onClick={() => setQaFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  qaFilter === 'all'
                    ? 'bg-[#0F766E] text-white'
                    : 'bg-[#F4F4F1] dark:bg-slate-800 text-[#52525B] dark:text-slate-300'
                }`}
              >
                Semua ({allComments.length})
              </button>
            </div>
          </div>

          {filteredQuestions.length === 0 ? (
            <p className="text-sm text-[#71717A] dark:text-slate-400 py-8 text-center">
              Tidak ada pertanyaan yang menunggu jawaban saat ini.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((item) => (
                <MentorQaReplyCard
                  key={item.id}
                  item={item}
                  onReplied={() => {
                    queryClient.invalidateQueries({ queryKey: ['teacher-all-comments'] });
                    queryClient.invalidateQueries({ queryKey: ['lesson-comments', item.lesson_id] });
                    onSuccess('Balasan mentor berhasil dikirim ke pelajar.');
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: PRIVATE 1-ON-1 CHAT */}
      {subTab === 'chat' && (
        <div className="bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-[#18181B] dark:text-white">
            Konsultasi Privat 1-on-1 Siswa
          </h2>
          {threads.length === 0 ? (
            <p className="text-sm text-[#71717A] dark:text-slate-400 py-8 text-center">
              Belum ada pesan konsultasi privat dari pelajar.
            </p>
          ) : (
            <div className="space-y-4">
              {threads.map(([key, msgs]) => {
                const first = msgs[0];
                const cObj = courses.find((c) => c.id === first.course_id);
                return (
                  <MentorThreadCard
                    key={key}
                    courseTitle={cObj?.title ?? 'Kursus'}
                    courseSlug={cObj?.slug}
                    messages={msgs}
                    onSent={() => {
                      queryClient.invalidateQueries({ queryKey: ['teacher-mentor-messages'] });
                      queryClient.invalidateQueries({ queryKey: ['mentor-messages'] });
                      onSuccess('Pesan balasan konsultasi terkirim.');
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: LIVE SESSIONS & ANNOUNCEMENTS */}
      {subTab === 'live' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Live Sessions */}
          <div className="lg:col-span-6 bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-[#0F766E]" />
              Jadwalkan Sesi Live (Office Hours)
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (sessTitle.trim()) createSessionMut.mutate();
              }}
              className="space-y-3"
            >
              <SearchablePicker
                label="Kursus"
                placeholder="Cari judul atau kategori kursus..."
                value={sessCourseId || courses[0]?.id || ''}
                onChange={(id) => setSessCourseId(id)}
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
                  value={annCohortId}
                  onChange={(e) => setAnnCohortId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#D4D4CE] dark:border-[#282E3D] bg-white dark:bg-slate-800 text-[#18181B] dark:text-white"
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
                <label
                  htmlFor="sess-title"
                  className="block text-xs font-semibold text-[#52525B] dark:text-slate-300 mb-1"
                >
                  Judul Sesi
                </label>
                <input
                  id="sess-title"
                  type="text"
                  required
                  value={sessTitle}
                  onChange={(e) => setSessTitle(e.target.value)}
                  placeholder="Contoh: Klinik Soal Deret Angka"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#D4D4CE] dark:border-[#282E3D] bg-white dark:bg-slate-800 text-[#18181B] dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="sess-topic"
                  className="block text-xs font-semibold text-[#52525B] dark:text-slate-300 mb-1"
                >
                  Topik Pembahasan (Opsional)
                </label>
                <input
                  id="sess-topic"
                  type="text"
                  value={sessTopic}
                  onChange={(e) => setSessTopic(e.target.value)}
                  placeholder="Topik pembahasan singkat..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#D4D4CE] dark:border-[#282E3D] bg-white dark:bg-slate-800 text-[#18181B] dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="sess-date"
                    className="block text-xs font-semibold text-[#52525B] dark:text-slate-300 mb-1"
                  >
                    Jadwal &amp; Waktu
                  </label>
                  <input
                    id="sess-date"
                    type="datetime-local"
                    required
                    value={sessDate}
                    onChange={(e) => setSessDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#D4D4CE] dark:border-[#282E3D] bg-white dark:bg-slate-800 text-[#18181B] dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="sess-max"
                    className="block text-xs font-semibold text-[#52525B] dark:text-slate-300 mb-1"
                  >
                    Kuota Peserta
                  </label>
                  <input
                    id="sess-max"
                    type="number"
                    min={1}
                    max={200}
                    value={sessMax}
                    onChange={(e) => setSessMax(Number(e.target.value) || 20)}
                    placeholder="Kuota"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#D4D4CE] dark:border-[#282E3D] bg-white dark:bg-slate-800 text-[#18181B] dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="sess-url"
                  className="block text-xs font-semibold text-[#52525B] dark:text-slate-300 mb-1"
                >
                  Tautan Meeting (Google Meet / Zoom)
                </label>
                <input
                  id="sess-url"
                  type="url"
                  value={sessUrl}
                  onChange={(e) => setSessUrl(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#D4D4CE] dark:border-[#282E3D] bg-white dark:bg-slate-800 text-[#18181B] dark:text-white"
                />
              </div>
              <Button type="submit" disabled={createSessionMut.isPending} className="w-full">
                Publikasikan Jadwal Sesi
              </Button>
            </form>

            <div className="space-y-2 pt-2 border-t border-[#D4D4CE] dark:border-[#282E3D]">
              {sessions.map((s) => {
                const count = bookings.filter((b) => b.session_id === s.id).length;
                return (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-[#F4F4F1] dark:bg-slate-800/60 border border-[#D4D4CE] dark:border-[#282E3D] flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#18181B] dark:text-white truncate">
                        {s.title}
                      </p>
                      <p className="text-[11px] text-[#71717A] dark:text-slate-400 inline-flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(s.scheduled_at).toLocaleDateString('id-ID')}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {count}/{s.max_participants}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmDelete({ kind: 'session', id: s.id, title: s.title })
                      }
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Course Announcements */}
          <div className="lg:col-span-6 bg-white dark:bg-[#161B22] border border-[#D4D4CE] dark:border-[#282E3D] rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#0F766E]" />
              Kirim Pengumuman Kursus
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (annTitle.trim() && annContent.trim()) createAnnMut.mutate();
              }}
              className="space-y-3"
            >
              <SearchablePicker
                label="Kursus"
                placeholder="Cari judul atau kategori kursus..."
                value={annCourseId || courses[0]?.id || ''}
                onChange={(id) => setAnnCourseId(id)}
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
                  value={annCohortId}
                  onChange={(e) => setAnnCohortId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#D4D4CE] dark:border-[#282E3D] bg-white dark:bg-slate-800 text-[#18181B] dark:text-white"
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
              <input
                type="text"
                required
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="Judul Pengumuman (mis. Pembaruan Bank Soal Terbaru)"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#D4D4CE] dark:border-[#282E3D] bg-white dark:bg-slate-800"
              />
              <textarea
                rows={3}
                required
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                placeholder="Isi pengumuman untuk seluruh siswa terdaftar..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#D4D4CE] dark:border-[#282E3D] bg-white dark:bg-slate-800"
              />
              <Button type="submit" disabled={createAnnMut.isPending} className="w-full">
                Kirim Pengumuman
              </Button>
            </form>

            <div className="space-y-2 pt-2 border-t border-[#D4D4CE] dark:border-[#282E3D]">
              {cohorts.length > 0 && announcements.length > 0 && (
                <div className="flex items-center justify-between gap-2 pb-1">
                  <span className="text-[11px] font-semibold text-[#71717A] dark:text-slate-400">
                    Filter Target ({filteredAnnouncements.length})
                  </span>
                  <select
                    value={annCohortFilter}
                    onChange={(e) => setAnnCohortFilter(e.target.value)}
                    className="px-2 py-1 text-xs rounded-lg border border-[#D4D4CE] dark:border-[#282E3D] bg-[#F4F4F1] dark:bg-slate-800 text-[#18181B] dark:text-white"
                  >
                    <option value="all">Semua Target</option>
                    <option value="public">Semua Peserta</option>
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>
                        Cohort: {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {filteredAnnouncements.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl bg-[#F4F4F1] dark:bg-slate-800/60 border border-[#D4D4CE] dark:border-[#282E3D] flex items-start justify-between gap-2"
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
                      {courseTitle(a.course_id)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmDelete({ kind: 'announcement', id: a.id, title: a.title })
                    }
                    className="text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title={confirmDelete?.kind === 'session' ? 'Hapus Sesi Live' : 'Hapus Pengumuman'}
        description={
          confirmDelete
            ? confirmDelete.kind === 'session'
              ? `Hapus sesi mentoring "${confirmDelete.title}"?`
              : `Hapus pengumuman "${confirmDelete.title}"?`
            : ''
        }
        confirmLabel="Hapus"
        tone="danger"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete?.kind === 'session') {
            deleteSessionMut.mutate(confirmDelete.id);
          } else if (confirmDelete?.kind === 'announcement') {
            deleteAnnMut.mutate(confirmDelete.id);
          }
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}

function MentorQaReplyCard({
  item,
  onReplied,
}: {
  item: TeacherCommentItem;
  onReplied: () => void;
}) {
  const { user } = useAuthStore();
  const [reply, setReply] = useState('');

  const replyMut = useMutation({
    mutationFn: () =>
      lmsApi.addLessonComment({
        lesson_id: item.lesson_id,
        user_id: user!.id,
        author_name: user!.full_name,
        author_role: user!.role,
        content: reply.trim(),
        parent_id: item.id,
        is_mentor_answer: true,
        notify_user_id: item.user_id,
        course_slug: item.course_slug,
      }),
    onSuccess: () => {
      setReply('');
      onReplied();
    },
  });

  return (
    <div className="p-4 rounded-xl bg-[#F4F4F1] dark:bg-slate-800/50 border border-[#D4D4CE] dark:border-[#282E3D] space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#18181B] dark:text-white">
            {item.author_name} • <span className="font-normal text-[#71717A]">{item.course_title}</span>
          </p>
          <p className="text-[11px] text-[#0F766E] dark:text-teal-400 truncate">
            Materi: {item.lesson_title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {item.has_mentor_reply ? (
            <Badge tone="emerald">
              <CheckCircle2 className="w-3 h-3" />
              Sudah Dijawab ({item.reply_count})
            </Badge>
          ) : (
            <Badge tone="amber">Menunggu Jawaban</Badge>
          )}
          {item.course_slug && (
            <Link
              to={`/courses/${item.course_slug}?lesson=${item.lesson_id}`}
              className="text-xs text-[#0F766E] dark:text-teal-400 hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Buka
            </Link>
          )}
        </div>
      </div>

      <p className="text-sm text-[#18181B] dark:text-slate-200">{item.content}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (reply.trim()) replyMut.mutate();
        }}
        className="flex flex-col sm:flex-row gap-2 pt-1"
      >
        <input
          type="text"
          required
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Tulis jawaban mentor untuk siswa ini..."
          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#D4D4CE] dark:border-[#282E3D] bg-white dark:bg-[#161B22]"
        />
        <Button type="submit" size="sm" disabled={replyMut.isPending}>
          <Send className="w-3.5 h-3.5" />
          Jawab
        </Button>
      </form>
    </div>
  );
}

function MentorThreadCard({
  courseTitle,
  courseSlug,
  messages,
  onSent,
}: {
  courseTitle: string;
  courseSlug?: string;
  messages: MentorMessage[];
  onSent: () => void;
}) {
  const { user } = useAuthStore();
  const [reply, setReply] = useState('');
  const first = messages[0];

  const sendMut = useMutation({
    mutationFn: () =>
      lmsApi.sendMentorMessage({
        course_id: first.course_id,
        course_slug: courseSlug,
        student_id: first.student_id,
        mentor_id: user!.id,
        sender_id: user!.id,
        sender_name: user!.full_name,
        sender_role: user!.role,
        message: reply.trim(),
      }),
    onSuccess: () => {
      setReply('');
      onSent();
    },
  });

  return (
    <div className="p-4 rounded-xl bg-[#F4F4F1] dark:bg-slate-800/50 border border-[#D4D4CE] dark:border-[#282E3D] space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-[#18181B] dark:text-white">
          {courseTitle} • Pelajar: {messages.find((m) => m.sender_role === 'student')?.sender_name ?? 'Pelajar'}
        </p>
        <Badge tone="blue">{messages.length} pesan</Badge>
      </div>
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id} className="text-xs bg-white dark:bg-[#161B22] p-2.5 rounded-lg border border-[#D4D4CE] dark:border-[#282E3D]">
            <span className="font-bold text-[#0F766E] dark:text-teal-400">{m.sender_name}: </span>
            <span className="text-[#18181B] dark:text-slate-200">{m.message}</span>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (reply.trim()) sendMut.mutate();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          required
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Balas konsultasi privat pelajar..."
          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#D4D4CE] dark:border-[#282E3D] bg-white dark:bg-[#161B22]"
        />
        <Button type="submit" size="sm" disabled={sendMut.isPending}>
          Balas
        </Button>
      </form>
    </div>
  );
}

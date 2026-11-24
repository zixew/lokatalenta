import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  BookPlus,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  GraduationCap,
  ImagePlus,
  Layers,
  MessageSquare,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
  Volume2,
} from 'lucide-react';
import { useState } from 'react';
import { lmsApi } from '../../shared/services/lmsApi';
import type { Course, Lesson, QuizOption } from '../../shared/types/lms';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { ProgressBar } from '../../shared/ui/ProgressBar';
import { SearchablePicker } from '../../shared/ui/SearchablePicker';
import { useAuthStore } from '../auth/useAuthStore';
import { BulkCsvImportPanel } from './BulkCsvImportPanel';
import {
  extractUniqueCategories,
  filterQuestionsBySearchAndCategory,
} from './questionBankHelpers';
import { TeacherAnalyticsPanel } from './TeacherAnalyticsPanel';
import { TeacherAssignmentsTab } from './TeacherAssignmentsTab';
import { TeacherInteractionTab } from './TeacherInteractionTab';

type StudioTab = 'courses' | 'questions' | 'assignments' | 'interaction' | 'students';

export function TeacherStudioPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<StudioTab>('questions');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState<'all' | 'passed' | 'not_tested'>('all');
  const [savedBanner, setSavedBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');

  // Create Course State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Kursus Terstruktur');
  const [level, setLevel] = useState<Course['level']>('Semua Level');
  const [estimatedHours, setEstimatedHours] = useState(2);

  // Module & Lesson Builder State
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [moduleTitle, setModuleTitle] = useState('');
  const [targetModuleId, setTargetModuleId] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonType, setLessonType] = useState<Lesson['type']>('article');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonDuration, setLessonDuration] = useState(10);

  // Quiz Settings & Question Builder State
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [quizDuration, setQuizDuration] = useState(120);
  const [quizPassingScore, setQuizPassingScore] = useState(70);
  const [quizUseSubtests, setQuizUseSubtests] = useState(true);
  const [lessonUseSubtests, setLessonUseSubtests] = useState(true);

  const [qCategory, setQCategory] = useState('Verbal');
  const [qText, setQText] = useState('');
  const [qImageUrl, setQImageUrl] = useState('');
  const [qAudioText, setQAudioText] = useState('');
  const [qAudioLang, setQAudioLang] = useState<'ja-JP' | 'en-US' | 'ko-KR'>('en-US');
  const [uploadingImg, setUploadingImg] = useState(false);

  // Edit Lesson / Course Modal State
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');
  const [editLessonContent, setEditLessonContent] = useState('');
  const [editLessonVideo, setEditLessonVideo] = useState('');
  const [editLessonDuration, setEditLessonDuration] = useState(10);
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [optE, setOptE] = useState('');
  const [correctOpt, setCorrectOpt] = useState<QuizOption['key']>('A');
  const [explanation, setExplanation] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionCategoryFilter, setQuestionCategoryFilter] = useState('ALL');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const resetQuestionForm = () => {
    setEditingQuestionId(null);
    setQText('');
    setQImageUrl('');
    setQAudioText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setOptE('');
    setExplanation('');
  };

  const showSuccess = (msg: string) => {
    setErrorBanner('');
    setSavedBanner(msg);
    setTimeout(() => setSavedBanner(''), 3500);
  };

  const { data: courses = [] } = useQuery({
    queryKey: ['teacher-courses', user?.id],
    queryFn: () =>
      lmsApi.listAllCoursesForManagement(user?.role === 'admin' ? undefined : user?.id),
    enabled: Boolean(user),
  });

  const { data: studentProgress = [] } = useQuery({
    queryKey: ['teacher-student-progress', user?.id],
    queryFn: () =>
      user ? lmsApi.listTeacherStudentProgress(user.id) : Promise.resolve([]),
    enabled: Boolean(user),
  });

  const { data: allSubmissions = [] } = useQuery({
    queryKey: ['teacher-submissions'],
    queryFn: () => lmsApi.listAllSubmissionsForTeacher(),
    enabled: Boolean(user),
  });

  const { data: allComments = [] } = useQuery({
    queryKey: ['teacher-all-comments'],
    queryFn: () => lmsApi.listAllCommentsForTeacher(),
    enabled: Boolean(user),
  });

  const pendingSubmissionsCount = allSubmissions.filter((s) => s.status === 'submitted').length;
  const unansweredQaCount = allComments.filter((c) => !c.has_mentor_reply).length;

  const quizzes = courses.flatMap((c) =>
    (c.modules ?? []).flatMap((m) =>
      m.lessons
        .filter((l) => l.type === 'quiz' && l.quiz)
        .map((l) => ({ courseTitle: c.title, quiz: l.quiz! }))
    )
  );

  const activeQuizObj = quizzes.find((item) => item.quiz.id === selectedQuizId)?.quiz;

  const handleSelectQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
    const found = quizzes.find((item) => item.quiz.id === quizId)?.quiz;
    if (found) {
      setQuizDuration(found.duration_minutes);
      setQuizPassingScore(found.passing_score);
      setQuizUseSubtests(found.use_subtests ?? true);
    }
  };

  const createCourseMut = useMutation({
    mutationFn: () =>
      lmsApi.createCourse({
        teacher_id: user!.id,
        teacher_name: user!.full_name,
        title,
        description,
        category,
        level,
        estimated_hours: estimatedHours,
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setSelectedCourseId(created.id);
      setTitle('');
      setDescription('');
      showSuccess('Kursus baru berhasil dibuat (status: Draft).');
    },
  });

  const { data: selectedQuizMeta } = useQuery({
    queryKey: ['teacher-quiz-meta', selectedQuizId],
    queryFn: () => lmsApi.getQuizWithQuestions(selectedQuizId),
    enabled: Boolean(selectedQuizId),
  });
  const activeQuestions = selectedQuizMeta?.questions ?? activeQuizObj?.questions ?? [];

  const addModuleMut = useMutation({
    mutationFn: () => lmsApi.addModule(selectedCourseId, moduleTitle),
    onSuccess: (mod) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      setTargetModuleId(mod.id);
      setModuleTitle('');
      showSuccess('Modul baru berhasil ditambahkan.');
    },
  });

  const addLessonMut = useMutation({
    mutationFn: () =>
      lmsApi.addLesson(targetModuleId, {
        title: lessonTitle,
        type: lessonType,
        content: lessonContent,
        video_url: lessonType === 'video' ? lessonVideoUrl : undefined,
        duration_minutes: lessonDuration,
        use_subtests: lessonType === 'quiz' ? lessonUseSubtests : undefined,
      }),
    onSuccess: (createdLesson) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setLessonTitle('');
      setLessonContent('');
      setLessonVideoUrl('');
      if (createdLesson.quiz) setSelectedQuizId(createdLesson.quiz.id);
      showSuccess('Materi baru berhasil ditambahkan.');
    },
  });

  const updateQuizSettingsMut = useMutation({
    mutationFn: () =>
      lmsApi.updateQuizSettings(selectedQuizId, {
        duration_minutes: quizDuration,
        passing_score: quizPassingScore,
        use_subtests: quizUseSubtests,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      showSuccess('Waktu pengerjaan & ambang batas berhasil diperbarui.');
    },
  });

  const addQuestionMut = useMutation({
    mutationFn: () =>
      lmsApi.addQuestionToQuiz(selectedQuizId, {
        category_tag: qCategory,
        question_text: qText,
        image_url: qImageUrl || null,
        audio_text: qAudioText.trim() || null,
        audio_lang: qAudioText.trim() ? qAudioLang : null,
        options: [
          { key: 'A', text: optA },
          { key: 'B', text: optB },
          { key: 'C', text: optC },
          { key: 'D', text: optD },
          { key: 'E', text: optE },
        ],
        correct_option: correctOpt,
        explanation,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      resetQuestionForm();
      showSuccess('Soal baru berhasil ditambahkan.');
    },
  });

  const updateQuestionMut = useMutation({
    mutationFn: () => {
      if (!editingQuestionId) throw new Error('Tidak ada soal yang sedang diedit.');
      return lmsApi.updateQuestionInQuiz(editingQuestionId, {
        category_tag: qCategory,
        question_text: qText,
        image_url: qImageUrl || null,
        audio_text: qAudioText.trim() || null,
        audio_lang: qAudioText.trim() ? qAudioLang : null,
        options: [
          { key: 'A', text: optA },
          { key: 'B', text: optB },
          { key: 'C', text: optC },
          { key: 'D', text: optD },
          { key: 'E', text: optE },
        ],
        correct_option: correctOpt,
        explanation,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      resetQuestionForm();
      showSuccess('Soal berhasil diperbarui secara in-place.');
    },
  });

  const deleteModuleMut = useMutation({
    mutationFn: (moduleId: string) => lmsApi.deleteModule(moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      showSuccess('Modul berhasil dihapus.');
    },
  });

  const deleteLessonMut = useMutation({
    mutationFn: (lessonId: string) => lmsApi.deleteLesson(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      showSuccess('Materi berhasil dihapus.');
    },
  });

  const updateLessonMut = useMutation({
    mutationFn: () =>
      lmsApi.updateLesson(editingLesson!.id, {
        title: editLessonTitle,
        content: editLessonContent,
        video_url: editLessonVideo.trim() || null,
        duration_minutes: editLessonDuration,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setEditingLesson(null);
      showSuccess('Materi berhasil diperbarui.');
    },
  });

  const reorderModulesMut = useMutation({
    mutationFn: ({ courseId, ids }: { courseId: string; ids: string[] }) =>
      lmsApi.reorderModules(courseId, ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const reorderLessonsMut = useMutation({
    mutationFn: ({ moduleId, ids }: { moduleId: string; ids: string[] }) =>
      lmsApi.reorderLessons(moduleId, ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const deleteQuestionMut = useMutation({
    mutationFn: (qId: string) => lmsApi.deleteQuestion(qId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      showSuccess('Soal berhasil dihapus.');
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    setErrorBanner('');
    try {
      const url = await lmsApi.uploadQuestionImage(file);
      setQImageUrl(url);
    } catch (err: any) {
      setErrorBanner(err?.message ?? 'Gagal mengunggah gambar.');
    } finally {
      setUploadingImg(false);
    }
  };

  const effectiveCourseId = selectedCourseId || courses[0]?.id || '';
  const selectedCourse = courses.find((c) => c.id === effectiveCourseId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#18181B] dark:text-white">Teacher Studio</h1>
          <p className="text-sm text-[#52525B] dark:text-slate-300 mt-0.5">
            Susun kursus, kelola bank soal dengan gambar, atur waktu tes, dan pantau progres siswa.
          </p>
        </div>
        {savedBanner && (
          <Badge tone="emerald" className="py-1.5 px-3 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {savedBanner}
          </Badge>
        )}
        {errorBanner && (
          <Badge tone="rose" className="py-1.5 px-3 text-xs">
            {errorBanner}
          </Badge>
        )}
      </div>

      {/* Quick Mentor Health Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-xl p-4">
          <span className="text-xs text-[#71717A] dark:text-slate-400 block">Total Program</span>
          <span className="text-xl font-extrabold font-mono-tabular text-[#18181B] dark:text-white mt-0.5 block">
            {courses.length}
          </span>
        </div>
        <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-xl p-4">
          <span className="text-xs text-[#71717A] dark:text-slate-400 block">Siswa Aktif</span>
          <span className="text-xl font-extrabold font-mono-tabular text-[#0F766E] mt-0.5 block">
            {studentProgress.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('assignments')}
          className="text-left bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 hover:border-[#0F766E] rounded-xl p-4 transition-colors cursor-pointer"
        >
          <span className="text-xs text-[#71717A] dark:text-slate-400 block">Tugas Perlu Dinilai</span>
          <span className="text-xl font-extrabold font-mono-tabular text-amber-600 mt-0.5 block">
            {pendingSubmissionsCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('interaction')}
          className="text-left bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 hover:border-[#0F766E] rounded-xl p-4 transition-colors cursor-pointer"
        >
          <span className="text-xs text-[#71717A] dark:text-slate-400 block">Q&amp;A Belum Dijawab</span>
          <span className="text-xl font-extrabold font-mono-tabular text-rose-600 mt-0.5 block">
            {unansweredQaCount}
          </span>
        </button>
      </div>

      {/* Studio Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E3DC] dark:border-slate-800 pb-3">
        {[
          { id: 'questions' as StudioTab, label: 'Bank Soal & Waktu Tes', icon: PlusCircle },
          { id: 'courses' as StudioTab, label: 'Kursus, Modul & Materi', icon: Layers },
          { id: 'assignments' as StudioTab, label: 'Tugas & Penilaian', icon: ClipboardCheck },
          { id: 'interaction' as StudioTab, label: 'Interaksi Mentor', icon: MessageSquare },
          { id: 'students' as StudioTab, label: 'Progres Siswa', icon: GraduationCap },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                active
                  ? 'bg-[#0F766E] text-white'
                  : 'bg-white dark:bg-[#161B22] text-[#52525B] dark:text-slate-300 border border-[#E5E3DC] dark:border-slate-800 hover:bg-slate-50 dark:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BANK SOAL & PENGATURAN WAKTU */}
      {activeTab === 'questions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Quiz Selection & Timer Settings + Existing Questions */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0F766E]" />
                Pilih Tes &amp; Atur Waktu Pengerjaan
              </h2>

              <SearchablePicker
                label="Target Latihan / Evaluasi"
                placeholder="Cari judul latihan atau kursus..."
                value={selectedQuizId}
                onChange={(id) => handleSelectQuiz(id)}
                options={quizzes.map((item) => ({
                  id: item.quiz.id,
                  label: item.quiz.title,
                  sublabel: item.courseTitle,
                }))}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] dark:text-white mb-1">
                    Waktu Pengerjaan (Menit)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={quizDuration}
                    onChange={(e) => setQuizDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] dark:text-white mb-1">
                    Standar Lulus (%)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={quizPassingScore}
                    onChange={(e) => setQuizPassingScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-xs font-medium text-[#18181B] dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={quizUseSubtests}
                  onChange={(e) => setQuizUseSubtests(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E5E3DC] accent-[#0F766E]"
                />
                Kelompokkan soal berdasarkan Subtest
              </label>

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => updateQuizSettingsMut.mutate()}
                disabled={updateQuizSettingsMut.isPending}
              >
                {updateQuizSettingsMut.isPending ? 'Menyimpan...' : 'Simpan Pengaturan Waktu'}
              </Button>
            </div>

            {/* Existing Questions List */}
            <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#18181B] dark:text-white">Daftar Soal Saat Ini</h3>
                <Badge tone="blue">{activeQuestions.length} Soal</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  placeholder="Cari teks soal..."
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E5E3DC] dark:border-slate-800 bg-[#F6F5F1] dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
                <select
                  value={questionCategoryFilter}
                  onChange={(e) => setQuestionCategoryFilter(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E5E3DC] dark:border-slate-800 bg-[#F6F5F1] dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                >
                  {extractUniqueCategories(activeQuestions).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'ALL' ? 'Semua Kategori' : cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {filterQuestionsBySearchAndCategory(
                  activeQuestions,
                  questionSearch,
                  questionCategoryFilter
                ).map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl border border-[#E5E3DC] dark:border-slate-800 bg-[#F6F5F1] dark:bg-slate-900 flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono-tabular font-bold text-[#71717A] dark:text-slate-400">
                          #{idx + 1}
                        </span>
                        <Badge tone="slate">{q.category_tag}</Badge>
                        <span className="text-[11px] font-semibold text-emerald-700">
                          Kunci: {q.correct_option}
                        </span>
                      </div>
                      <p className="text-xs text-[#18181B] dark:text-white line-clamp-2">{q.question_text}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQuestionId(q.id);
                          setQCategory(q.category_tag);
                          setQText(q.question_text);
                          setQImageUrl(q.image_url ?? '');
                          setQAudioText(q.audio_text ?? '');
                          setOptA(q.options.find((o) => o.key === 'A')?.text ?? '');
                          setOptB(q.options.find((o) => o.key === 'B')?.text ?? '');
                          setOptC(q.options.find((o) => o.key === 'C')?.text ?? '');
                          setOptD(q.options.find((o) => o.key === 'D')?.text ?? '');
                          setOptE(q.options.find((o) => o.key === 'E')?.text ?? '');
                          setCorrectOpt(q.correct_option);
                          setExplanation(q.explanation);
                          showSuccess('Soal dimuat ke form editor untuk diperbarui.');
                        }}
                        className="p-1.5 text-slate-400 hover:text-[#0F766E] cursor-pointer"
                        title="Muat ke form editor"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteQuestionMut.mutate(q.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Hapus soal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Question Builder with Image Upload */}
          <div className="lg:col-span-7 bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-5">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold text-[#18181B] dark:text-white">
                  {editingQuestionId ? 'Edit Soal In-Place' : 'Tambah Soal Baru (Teks & Gambar)'}
                </h2>
                {editingQuestionId && <Badge tone="blue">Mode Edit</Badge>}
              </div>
              <p className="text-xs text-[#71717A] dark:text-slate-400 mt-0.5">
                {editingQuestionId
                  ? 'Perubahan akan langsung memperbarui soal terpilih tanpa membuat duplikat.'
                  : 'Anda bebas membuat soal teks maupun melampirkan gambar (cocok untuk tes spasial atau grafik).'}
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingQuestionId) {
                  updateQuestionMut.mutate();
                } else {
                  addQuestionMut.mutate();
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#18181B] dark:text-white mb-1">
                  Kategori Soal
                </label>
                <input
                  type="text"
                  required
                  value={qCategory}
                  onChange={(e) => setQCategory(e.target.value)}
                  placeholder="Contoh: Verbal, Numerik, Logika, Spasial"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18181B] dark:text-white mb-1">
                  Pertanyaan Soal
                </label>
                <textarea
                  rows={3}
                  required
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Tuliskan teks soal di sini..."
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              {/* Image Attachment */}
              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-[#F6F5F1] dark:bg-slate-900 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#18181B] dark:text-white flex items-center gap-1.5">
                    <ImagePlus className="w-4 h-4 text-[#0F766E]" />
                    Gambar Soal (Opsional)
                  </span>
                  <label className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 text-xs font-semibold text-[#18181B] dark:text-white hover:bg-slate-50 dark:bg-slate-800 cursor-pointer">
                    {uploadingImg ? 'Mengunggah...' : 'Pilih File Gambar'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="url"
                  value={qImageUrl}
                  onChange={(e) => setQImageUrl(e.target.value)}
                  placeholder="Atau tempel tautan gambar (https://...)"
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E5E3DC] dark:border-slate-800 bg-white dark:bg-[#161B22] text-xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
                {qImageUrl && (
                  <div className="relative inline-block">
                    <img
                      src={qImageUrl}
                      alt="Pratinjau gambar soal"
                      className="max-h-40 rounded-lg border border-[#E5E3DC] dark:border-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setQImageUrl('')}
                      className="mt-1 text-xs text-rose-600 font-semibold hover:underline cursor-pointer block"
                    >
                      Hapus gambar
                    </button>
                  </div>
                )}
              </div>

              {/* Listening Audio (Optional) */}
              <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-[#F6F5F1] dark:bg-slate-900 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#18181B] dark:text-white flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-[#0F766E]" />
                    Audio Listening (Opsional — untuk soal bahasa)
                  </span>
                  <select
                    value={qAudioLang}
                    onChange={(e) =>
                      setQAudioLang(e.target.value as 'ja-JP' | 'en-US' | 'ko-KR')
                    }
                    className="px-2.5 py-1 rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="en-US">Bahasa Inggris (en-US)</option>
                    <option value="ja-JP">Bahasa Jepang (ja-JP)</option>
                    <option value="ko-KR">Bahasa Korea (ko-KR)</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={qAudioText}
                  onChange={(e) => setQAudioText(e.target.value)}
                  placeholder="Tuliskan kalimat yang akan dibacakan oleh sistem suara..."
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: 'A', val: optA, set: setOptA },
                  { key: 'B', val: optB, set: setOptB },
                  { key: 'C', val: optC, set: setOptC },
                  { key: 'D', val: optD, set: setOptD },
                  { key: 'E', val: optE, set: setOptE },
                ].map((o) => (
                  <div key={o.key} className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono-tabular font-bold flex items-center justify-center shrink-0">
                      {o.key}
                    </span>
                    <input
                      type="text"
                      required
                      value={o.val}
                      onChange={(e) => o.set(e.target.value)}
                      placeholder={`Opsi ${o.key}`}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#E5E3DC] dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] dark:text-white mb-1">
                    Kunci Jawaban
                  </label>
                  <select
                    value={correctOpt}
                    onChange={(e) => setCorrectOpt(e.target.value as QuizOption['key'])}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-800 text-sm bg-white dark:bg-[#161B22] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  >
                    {['A', 'B', 'C', 'D', 'E'].map((k) => (
                      <option key={k} value={k}>
                        Opsi {k}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#18181B] dark:text-white mb-1">
                    Penjelasan Jawaban
                  </label>
                  <input
                    type="text"
                    required
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Jelaskan alasan jawaban yang benar..."
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="submit"
                  disabled={addQuestionMut.isPending || updateQuestionMut.isPending}
                >
                  {editingQuestionId
                    ? updateQuestionMut.isPending
                      ? 'Memperbarui...'
                      : 'Perbarui Soal Ini'
                    : addQuestionMut.isPending
                      ? 'Menambahkan...'
                      : 'Simpan Soal Baru'}
                </Button>
                {editingQuestionId && (
                  <Button type="button" variant="secondary" onClick={resetQuestionForm}>
                    Batal Edit
                  </Button>
                )}
              </div>
            </form>
          </div>

          <div className="lg:col-span-12">
            <BulkCsvImportPanel
              selectedQuizId={selectedQuizId}
              onImported={(count) => showSuccess(`${count} soal berhasil diimpor dari CSV ke bank soal.`)}
              onError={(msg) => setErrorBanner(msg)}
            />
          </div>
        </div>
      )}

      {/* TAB 2: KURSUS, MODUL & MATERI */}
      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Create Course */}
          <div className="lg:col-span-5 bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-[#18181B] dark:text-white flex items-center gap-2">
              <BookPlus className="w-4 h-4 text-[#0F766E]" />
              Buat Kursus / Paket Baru
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createCourseMut.mutate();
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-[#18181B] dark:text-white mb-1">
                  Judul Kursus
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Latihan Psikotes Perbankan"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] dark:text-white mb-1">Tipe</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-800 text-sm bg-white dark:bg-[#161B22] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  >
                    <option value="Kursus Terstruktur">Kursus Terstruktur</option>
                    <option value="Latihan Langsung">Latihan Langsung</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] dark:text-white mb-1">
                    Estimasi (Jam)
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18181B] dark:text-white mb-1">Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as Course['level'])}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-800 text-sm bg-white dark:bg-[#161B22] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                >
                  <option value="Semua Level">Semua Level</option>
                  <option value="Pemula">Pemula</option>
                  <option value="Menengah">Menengah</option>
                  <option value="Lanjutan">Lanjutan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18181B] dark:text-white mb-1">
                  Deskripsi
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <Button type="submit" className="w-full" disabled={createCourseMut.isPending}>
                {createCourseMut.isPending ? 'Menyimpan...' : 'Buat Kursus'}
              </Button>
            </form>
          </div>

          {/* Right: Module & Lesson Builder */}
          <div className="lg:col-span-7 bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#18181B] dark:text-white">
                Susun Modul &amp; Materi Kursus
              </h2>
              <p className="text-xs text-[#71717A] dark:text-slate-400 mt-0.5">
                Tambahkan bab (modul) dan isi dengan materi bacaan, video, atau paket latihan soal.
              </p>
            </div>

            <SearchablePicker
              label="Pilih Kursus"
              placeholder="Cari judul atau kategori kursus..."
              value={effectiveCourseId}
              onChange={(cid) => {
                setSelectedCourseId(cid);
                const found = courses.find((c) => c.id === cid);
                setTargetModuleId(found?.modules?.[0]?.id ?? '');
              }}
              options={courses.map((c) => ({
                id: c.id,
                label: c.title,
                sublabel: `${c.category} • ${c.is_published ? 'Terbit' : 'Draft'}`,
              }))}
            />

            {/* Add Module */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (selectedCourseId) addModuleMut.mutate();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                required
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                placeholder="Nama modul baru (contoh: Modul 4: Tes Ketelitian)"
                className="flex-1 px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
              <Button type="submit" variant="secondary" disabled={addModuleMut.isPending}>
                + Tambah Modul
              </Button>
            </form>

            {/* Add Lesson */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (targetModuleId) addLessonMut.mutate();
              }}
              className="space-y-3 pt-4 border-t border-[#E5E3DC] dark:border-slate-800"
            >
              <h3 className="text-sm font-bold text-[#18181B] dark:text-white">Tambah Materi ke Modul</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] dark:text-white mb-1">
                    Pilih Modul
                  </label>
                  <select
                    value={targetModuleId}
                    onChange={(e) => setTargetModuleId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-800 text-sm bg-white dark:bg-[#161B22] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  >
                    {(selectedCourse?.modules ?? []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] dark:text-white mb-1">
                    Jenis Materi
                  </label>
                  <select
                    value={lessonType}
                    onChange={(e) => setLessonType(e.target.value as Lesson['type'])}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-800 text-sm bg-white dark:bg-[#161B22] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  >
                    <option value="article">Artikel Bacaan</option>
                    <option value="video">Video Pembelajaran</option>
                    <option value="quiz">Latihan Soal / Tes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#18181B] dark:text-white mb-1">
                    Judul Materi
                  </label>
                  <input
                    type="text"
                    required
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="Judul materi atau judul tes"
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] dark:text-white mb-1">
                    Durasi (Menit)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={lessonDuration}
                    onChange={(e) => setLessonDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
              </div>

              {lessonType === 'video' && (
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] dark:text-white mb-1">
                    Tautan Embed Video (YouTube Embed URL)
                  </label>
                  <input
                    type="url"
                    value={lessonVideoUrl}
                    onChange={(e) => setLessonVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/embed/..."
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#18181B] dark:text-white mb-1">
                  {lessonType === 'quiz' ? 'Deskripsi Tes' : 'Isi Materi'}
                </label>
                <textarea
                  rows={4}
                  required
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              {lessonType === 'quiz' && (
                <label className="flex items-center gap-2.5 text-xs font-medium text-[#18181B] dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lessonUseSubtests}
                    onChange={(e) => setLessonUseSubtests(e.target.checked)}
                    className="w-4 h-4 rounded border-[#E5E3DC] accent-[#0F766E]"
                  />
                  Gunakan pengelompokan Subtest pada latihan ini
                </label>
              )}

              <Button type="submit" disabled={addLessonMut.isPending}>
                {addLessonMut.isPending ? 'Menambahkan...' : 'Simpan Materi'}
              </Button>
            </form>

            {/* Full CRUD Module & Lesson Structure Manager */}
            {selectedCourse && (selectedCourse.modules ?? []).length > 0 && (
              <div className="pt-5 border-t border-[#E5E3DC] dark:border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-[#18181B] dark:text-white">
                  Kelola, Urutkan &amp; Edit Modul / Materi
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {(selectedCourse.modules ?? []).map((mod, mIdx, modArr) => (
                    <div
                      key={mod.id}
                      className="p-3.5 rounded-xl border border-[#E5E3DC] dark:border-slate-800 bg-[#F6F5F1] dark:bg-slate-900/60 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-[#18181B] dark:text-white truncate">
                          {mod.title}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={mIdx === 0}
                            onClick={() => {
                              const ids = modArr.map((x) => x.id);
                              [ids[mIdx - 1], ids[mIdx]] = [ids[mIdx], ids[mIdx - 1]];
                              reorderModulesMut.mutate({ courseId: selectedCourse.id, ids });
                            }}
                            className="p-1 rounded hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                            title="Geser modul ke atas"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={mIdx === modArr.length - 1}
                            onClick={() => {
                              const ids = modArr.map((x) => x.id);
                              [ids[mIdx + 1], ids[mIdx]] = [ids[mIdx], ids[mIdx + 1]];
                              reorderModulesMut.mutate({ courseId: selectedCourse.id, ids });
                            }}
                            className="p-1 rounded hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                            title="Geser modul ke bawah"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteModuleMut.mutate(mod.id)}
                            className="p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="Hapus modul"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {mod.lessons.map((les, lIdx, lesArr) => (
                          <div
                            key={les.id}
                            className="px-3 py-2 rounded-lg bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="truncate text-[#18181B] dark:text-slate-200">
                              {les.title}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={lIdx === 0}
                                onClick={() => {
                                  const ids = lesArr.map((x) => x.id);
                                  [ids[lIdx - 1], ids[lIdx]] = [ids[lIdx], ids[lIdx - 1]];
                                  reorderLessonsMut.mutate({ moduleId: mod.id, ids });
                                }}
                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                                title="Naikkan urutan"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={lIdx === lesArr.length - 1}
                                onClick={() => {
                                  const ids = lesArr.map((x) => x.id);
                                  [ids[lIdx + 1], ids[lIdx]] = [ids[lIdx], ids[lIdx + 1]];
                                  reorderLessonsMut.mutate({ moduleId: mod.id, ids });
                                }}
                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                                title="Turunkan urutan"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingLesson(les);
                                  setEditLessonTitle(les.title);
                                  setEditLessonContent(les.content);
                                  setEditLessonVideo(les.video_url ?? '');
                                  setEditLessonDuration(les.duration_minutes);
                                }}
                                className="p-1 rounded text-[#0F766E] hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer"
                                title="Edit materi"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteLessonMut.mutate(les.id)}
                                className="p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                title="Hapus materi"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Lesson Modal */}
      {editingLesson && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-lg">
            <h3 className="text-lg font-bold text-[#18181B] dark:text-white">Edit Materi</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Judul Materi</label>
                <input
                  type="text"
                  value={editLessonTitle}
                  onChange={(e) => setEditLessonTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-700 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Durasi (Menit)</label>
                <input
                  type="number"
                  min={1}
                  value={editLessonDuration}
                  onChange={(e) => setEditLessonDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-700 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Tautan Embed Video (Opsional)
                </label>
                <input
                  type="url"
                  value={editLessonVideo}
                  onChange={(e) => setEditLessonVideo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-700 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Isi Materi</label>
                <textarea
                  rows={4}
                  value={editLessonContent}
                  onChange={(e) => setEditLessonContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E3DC] dark:border-slate-700 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setEditingLesson(null)}>
                Batal
              </Button>
              <Button
                onClick={() => updateLessonMut.mutate()}
                disabled={updateLessonMut.isPending}
              >
                {updateLessonMut.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROGRES SISWA & ANALITIK */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <TeacherAnalyticsPanel studentProgress={studentProgress} courses={courses} />

          <div className="bg-white dark:bg-[#161B22] border border-[#E5E3DC] dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E3DC] dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#18181B] dark:text-white">Progres Belajar Siswa</h2>
              <p className="text-xs text-[#71717A] dark:text-slate-400 mt-0.5">
                Ringkasan penyelesaian materi dan nilai tes siswa di seluruh kursus Anda.
              </p>
            </div>
            {studentProgress.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const header = 'Nama Siswa,Email,Kursus,Materi Selesai,Total Materi,Persentase,Nilai Tes\n';
                  const rows = studentProgress
                    .map((r) => {
                      const pct =
                        r.total_lessons > 0
                          ? Math.round((r.completed_lessons / r.total_lessons) * 100)
                          : 0;
                      return `"${r.student_name}","${r.student_email}","${r.course_title}",${r.completed_lessons},${r.total_lessons},${pct}%,${r.latest_quiz_score ?? '-'}`;
                    })
                    .join('\n');
                  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `rekap-progres-siswa-${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Laporan CSV
              </Button>
            )}
          </div>
          {studentProgress.length > 0 && (
            <div className="px-6 py-3 border-b border-[#E5E3DC] dark:border-slate-800 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Cari nama siswa, email, atau kursus..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E5E3DC] dark:border-slate-700 bg-[#F6F5F1] dark:bg-slate-900"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'passed', 'not_tested'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setStudentFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      studentFilter === f
                        ? 'bg-[#0F766E] text-white'
                        : 'bg-[#F6F5F1] dark:bg-slate-800 text-[#52525B] dark:text-slate-300'
                    }`}
                  >
                    {f === 'all' ? 'Semua' : f === 'passed' ? 'Lulus (≥70%)' : 'Belum Tes'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {studentProgress.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#71717A] dark:text-slate-400">
              Belum ada siswa yang terdaftar pada kursus Anda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F6F5F1] dark:bg-slate-900 border-b border-[#E5E3DC] dark:border-slate-800 text-xs font-semibold text-[#71717A] dark:text-slate-400 uppercase">
                  <tr>
                    <th className="px-6 py-3">Siswa</th>
                    <th className="px-6 py-3">Kursus</th>
                    <th className="px-6 py-3">Progres Materi</th>
                    <th className="px-6 py-3">Nilai Tes Terakhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E3DC] dark:divide-slate-800">
                  {studentProgress
                    .filter((row) => {
                      if (
                        studentFilter === 'passed' &&
                        (row.latest_quiz_score === null || row.latest_quiz_score < 70)
                      ) {
                        return false;
                      }
                      if (studentFilter === 'not_tested' && row.latest_quiz_score !== null) {
                        return false;
                      }
                      const q = studentSearch.trim().toLowerCase();
                      if (
                        q &&
                        !`${row.student_name} ${row.student_email} ${row.course_title}`
                          .toLowerCase()
                          .includes(q)
                      ) {
                        return false;
                      }
                      return true;
                    })
                    .map((row) => {
                    const pct =
                      row.total_lessons > 0
                        ? Math.round((row.completed_lessons / row.total_lessons) * 100)
                        : 0;
                    return (
                      <tr key={`${row.student_id}-${row.course_id}`}>
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-[#18181B] dark:text-white">{row.student_name}</p>
                          <p className="text-xs text-[#71717A] dark:text-slate-400">{row.student_email}</p>
                        </td>
                        <td className="px-6 py-3.5 text-[#52525B] dark:text-slate-300">{row.course_title}</td>
                        <td className="px-6 py-3.5 w-52">
                          <div className="space-y-1">
                            <span className="text-xs font-mono-tabular text-[#18181B] dark:text-white">
                              {row.completed_lessons}/{row.total_lessons} materi ({pct}%)
                            </span>
                            <ProgressBar value={pct} tone="emerald" />
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          {row.latest_quiz_score !== null ? (
                            <Badge tone={row.latest_quiz_score >= 70 ? 'emerald' : 'amber'}>
                              {row.latest_quiz_score}%
                            </Badge>
                          ) : (
                            <span className="text-xs text-[#71717A] dark:text-slate-400">Belum tes</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <TeacherAssignmentsTab
          courses={courses}
          onSuccess={showSuccess}
          onError={setErrorBanner}
        />
      )}

      {activeTab === 'interaction' && (
        <TeacherInteractionTab
          courses={courses}
          onSuccess={showSuccess}
          onError={setErrorBanner}
        />
      )}
    </div>
  );
}

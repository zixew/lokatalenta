import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type {
  AppNotification,
  AssignmentRubricItem,
  AssignmentSubmission,
  CategoryBreakdown,
  CertificateRecord,
  CommunityPost,
  CommunityReply,
  Course,
  CourseAnnouncement,
  CourseAssignment,
  CourseRatingSummary,
  CourseReview,
  LeaderboardEntry,
  Lesson,
  LessonComment,
  MentorMessage,
  MentoringBooking,
  MentoringSession,
  Module,
  NotificationType,
  Profile,
  Question,
  Quiz,
  QuizAttempt,
  ReviewQuestion,
  SafeQuestion,
  SrsRating,
  StudentProgressSummary,
  SubmissionStatus,
  TeacherCommentItem,
  UserRole,
} from '../types/lms';

const STORAGE_KEYS = {
  courses: 'ruanglatih_demo_courses_v14',
  profiles: 'ruanglatih_demo_profiles_v13',
  enrollments: 'ruanglatih_demo_enrollments_v11',
  progress: 'ruanglatih_demo_progress_v11',
  attempts: 'ruanglatih_demo_attempts_v11',
  comments: 'ruanglatih_demo_comments_v1',
  notes: 'ruanglatih_demo_notes_v1',
  reviews: 'ruanglatih_demo_reviews_v1',
  assignments: 'ruanglatih_demo_assignments_v1',
  submissions: 'ruanglatih_demo_submissions_v1',
  notifications: 'ruanglatih_demo_notifications_v1',
  flashcardSrs: 'ruanglatih_flashcard_srs_v1',
  mentorMessages: 'ruanglatih_mentor_messages_v1',
  mentoringSessions: 'ruanglatih_mentoring_sessions_v1',
  mentoringBookings: 'ruanglatih_mentoring_bookings_v1',
  announcements: 'ruanglatih_course_announcements_v1',
  weeklyGoals: 'ruanglatih_weekly_goals_v1',
  certificates: 'lokatalenta_certificates_v1',
  communityPosts: 'lokatalenta_community_posts_v1',
  communityReplies: 'lokatalenta_community_replies_v1',
  communityLikes: 'lokatalenta_community_likes_v1',
};

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function drawStratified(pool: Question[], limit: number): Question[] {
  if (pool.length <= limit || limit <= 0) return pool;

  // Stratified random draw preserving category_tag proportions
  const groups = new Map<string, Question[]>();
  for (const q of pool) {
    const tag = q.category_tag || 'Umum';
    const arr = groups.get(tag) ?? [];
    arr.push(q);
    groups.set(tag, arr);
  }

  const picked: Question[] = [];
  const leftovers: Question[] = [];
  const entries = Array.from(groups.entries());

  for (const [, qs] of entries) {
    const shuffled = shuffleArray(qs);
    const quota = Math.floor((qs.length / pool.length) * limit);
    picked.push(...shuffled.slice(0, quota));
    leftovers.push(...shuffled.slice(quota));
  }

  if (picked.length < limit) {
    const remaining = shuffleArray(leftovers).slice(0, limit - picked.length);
    picked.push(...remaining);
  }

  // Keep subtest grouping order tidy
  const tagOrder = new Map(entries.map(([tag], idx) => [tag, idx]));
  return picked.sort((a, b) => {
    const ta = tagOrder.get(a.category_tag || 'Umum') ?? 0;
    const tb = tagOrder.get(b.category_tag || 'Umum') ?? 0;
    if (ta !== tb) return ta - tb;
    return a.order_index - b.order_index;
  });
}

function drawQuestionsFromBank(
  bank: Question[],
  limit: number,
  seenIds?: Set<string>
): Question[] {
  if (bank.length <= limit || limit <= 0) return bank;

  if (seenIds && seenIds.size > 0) {
    const unseen = bank.filter((q) => !seenIds.has(q.id));
    if (unseen.length >= limit) {
      return drawStratified(unseen, limit);
    }
    if (unseen.length > 0) {
      const seenPool = bank.filter((q) => seenIds.has(q.id));
      const fill = drawStratified(seenPool, limit - unseen.length);
      return [...unseen, ...fill];
    }
    // unseen.length === 0 -> all questions in bank have been shown; reset to random draw
  }

  return drawStratified(bank, limit);
}

async function getDemoCourses(): Promise<Course[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.courses);
    if (raw) return JSON.parse(raw) as Course[];
  } catch {
    // ignore parse error
  }
  const { DEMO_COURSES } = await import('../data/demoSeed');
  return DEMO_COURSES;
}

async function getDemoProfiles(): Promise<Profile[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.profiles);
    if (raw) return JSON.parse(raw) as Profile[];
  } catch {
    // ignore parse error
  }
  const { DEMO_PROFILES } = await import('../data/demoSeed');
  return DEMO_PROFILES;
}

export const DEFAULT_ASSIGNMENT_RUBRIC: AssignmentRubricItem[] = [
  {
    stars: 1,
    label: 'Bintang 1 — Perlu Perbaikan Mendasar',
    description: 'File belum sesuai format/instruksi atau isi tugas belum menjawab pokok latihan.',
  },
  {
    stars: 2,
    label: 'Bintang 2 — Kurang Lengkap',
    description: 'Sebagian tugas dikerjakan, namun masih banyak bagian penting yang terlewat atau keliru.',
  },
  {
    stars: 3,
    label: 'Bintang 3 — Cukup Baik',
    description: 'Memenuhi syarat dasar dan format yang diminta, meski analisis atau kerapian masih bisa ditingkatkan.',
  },
  {
    stars: 4,
    label: 'Bintang 4 — Baik & Rapi',
    description: 'Tugas lengkap, akurat, mengikuti aturan file, dan menunjukkan pemahaman materi yang solid.',
  },
  {
    stars: 5,
    label: 'Bintang 5 — Sangat Memuaskan',
    description: 'Sempurna, sangat teliti, struktur rapi, contoh tepat, dan melampaui standar latihan.',
  },
];

function buildDefaultCourseAssignment(courseId: string): CourseAssignment {
  return {
    id: `asg-default-${courseId}`,
    course_id: courseId,
    lesson_id: null,
    title: 'Tugas Praktik & Upload Hasil Kerja',
    instructions:
      'Kerjakan latihan praktik sesuai materi kursus ini lalu unggah file hasil pengerjaan Anda.',
    requires_file: true,
    task_brief:
      '1. Buat ringkasan penerapan atau lembar kerja praktik dari materi yang telah Anda pelajari.\n' +
      '2. Simpan hasil kerja dalam format file PDF, DOCX, TXT, atau gambar (PNG/JPG) yang jelas terbaca.\n' +
      '3. Wajib mengunggah file hasil kerja (maksimal 5 MB) sebelum menekan tombol Kumpulkan Tugas.',
    how_to_guide:
      'Langkah 1: Pelajari seluruh bagian penjelasan dan rangkuman pada modul.\n' +
      'Langkah 2: Tulis atau kerjakan latihan praktik di dokumen/lembar catatan Anda.\n' +
      'Langkah 3: Ekspor atau foto hasil pengerjaan dengan pencahayaan jelas, lalu unggah file di formulir bawah ini.\n' +
      'Langkah 4: Tunggu pemeriksaan mentor. Jika ditolak, baca alasan penolakan lalu upload ulang file perbaikan.',
    rubric: DEFAULT_ASSIGNMENT_RUBRIC,
    due_date: null,
    max_score: 100,
    created_by: null,
    created_at: new Date().toISOString(),
  };
}

export const lmsApi = {
  async listPublishedCourses(): Promise<Course[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('courses')
        .select(
          `id, slug, teacher_id, title, description, category, level, estimated_hours, thumbnail_url, is_published, created_at, profiles:teacher_id(full_name), modules(id, course_id, title, order_index, lessons(id, module_id, title, type, duration_minutes, order_index, quizzes(id, lesson_id, title, description, duration_minutes, passing_score, use_subtests, question_limit)))`
        )
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((c: any) => ({
        ...c,
        teacher_name: c.profiles?.full_name ?? 'Pengajar',
        modules: (c.modules ?? [])
          .sort((a: Module, b: Module) => a.order_index - b.order_index)
          .map((m: any) => ({
            ...m,
            lessons: (m.lessons ?? [])
              .sort((a: Lesson, b: Lesson) => a.order_index - b.order_index)
              .map((l: any) => ({
                ...l,
                content: l.content ?? '',
                quiz: Array.isArray(l.quizzes) ? l.quizzes[0] ?? null : l.quizzes ?? null,
              })),
          })),
      }));
    }
    return (await getDemoCourses()).filter((c) => c.is_published);
  },

  async listAllCoursesForManagement(teacherId?: string): Promise<Course[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('courses')
        .select(
          `id, slug, teacher_id, title, description, category, level, estimated_hours, thumbnail_url, is_published, created_at, profiles:teacher_id(full_name), modules(id, course_id, title, order_index, lessons(id, module_id, title, type, duration_minutes, order_index, quizzes(id, lesson_id, title, description, duration_minutes, passing_score, use_subtests, question_limit)))`
        )
        .order('created_at', { ascending: false });
      if (teacherId) query = query.eq('teacher_id', teacherId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((c: any) => ({
        ...c,
        teacher_name: c.profiles?.full_name ?? 'Pengajar',
        modules: (c.modules ?? [])
          .sort((a: Module, b: Module) => a.order_index - b.order_index)
          .map((m: any) => ({
            ...m,
            lessons: (m.lessons ?? [])
              .sort((a: Lesson, b: Lesson) => a.order_index - b.order_index)
              .map((l: any) => ({
                ...l,
                content: l.content ?? '',
                quiz: Array.isArray(l.quizzes) ? l.quizzes[0] ?? null : l.quizzes ?? null,
              })),
          })),
      }));
    }
    const all = await getDemoCourses();
    return teacherId ? all.filter((c) => c.teacher_id === teacherId) : all;
  },

  async getCourseBySlug(slug: string): Promise<Course | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('courses')
        .select(`*, profiles:teacher_id(full_name), modules(*, lessons(*, quizzes(*)))`)
        .eq('slug', slug)
        .single();
      if (error) return null;
      return {
        ...data,
        teacher_name: (data as any).profiles?.full_name ?? 'Pengajar',
        modules: ((data as any).modules ?? [])
          .sort((a: Module, b: Module) => a.order_index - b.order_index)
          .map((m: any) => ({
            ...m,
            lessons: (m.lessons ?? [])
              .sort((a: Lesson, b: Lesson) => a.order_index - b.order_index)
              .map((l: any) => ({
                ...l,
                quiz: Array.isArray(l.quizzes) ? l.quizzes[0] ?? null : l.quizzes ?? null,
              })),
          })),
      };
    }
    return (await getDemoCourses()).find((c) => c.slug === slug || c.id === slug) ?? null;
  },

  async getUserEnrollments(userId: string): Promise<string[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', userId);
      if (error) throw error;
      return (data ?? []).map((e) => e.course_id);
    }
    const map = readLocal<Record<string, string[]>>(STORAGE_KEYS.enrollments, {
      'demo-student-1': ['course-retail-panduan'],
    });
    return map[userId] ?? [];
  },

  async enrollCourse(userId: string, courseId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('enrollments')
        .upsert({ user_id: userId, course_id: courseId }, { onConflict: 'user_id,course_id' });
      if (error) throw error;
      return;
    }
    const map = readLocal<Record<string, string[]>>(STORAGE_KEYS.enrollments, {
      'demo-student-1': ['course-retail-panduan'],
    });
    const list = map[userId] ?? [];
    if (!list.includes(courseId)) {
      map[userId] = [...list, courseId];
      writeLocal(STORAGE_KEYS.enrollments, map);
    }
  },

  async getCourseEnrollmentCount(courseId: string): Promise<number> {
    if (isSupabaseConfigured && supabase) {
      const { count, error } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);
      if (error) throw error;
      return count ?? 0;
    }
    const map = readLocal<Record<string, string[]>>(STORAGE_KEYS.enrollments, {
      'demo-student-1': ['course-retail-panduan'],
    });
    let total = 0;
    for (const coursesList of Object.values(map)) {
      if (coursesList.includes(courseId)) total += 1;
    }
    return total;
  },

  async getCompletedLessonIds(userId: string): Promise<string[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('is_completed', true);
      if (error) throw error;
      return (data ?? []).map((r) => r.lesson_id);
    }
    const map = readLocal<Record<string, string[]>>(STORAGE_KEYS.progress, {});
    return map[userId] ?? [];
  },

  async markLessonComplete(userId: string, lessonId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert(
          { user_id: userId, lesson_id: lessonId, is_completed: true },
          { onConflict: 'user_id,lesson_id' }
        );
      if (error) throw error;
      return;
    }
    const map = readLocal<Record<string, string[]>>(STORAGE_KEYS.progress, {});
    const list = map[userId] ?? [];
    if (!list.includes(lessonId)) {
      map[userId] = [...list, lessonId];
      writeLocal(STORAGE_KEYS.progress, map);
    }
  },

  async getQuizMeta(quizId: string): Promise<Quiz | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('quizzes').select('*').eq('id', quizId).single();
      if (error) throw error;
      return data;
    }
    for (const c of await getDemoCourses()) {
      for (const m of c.modules ?? []) {
        for (const l of m.lessons) {
          if (l.quiz?.id === quizId) return l.quiz;
        }
      }
    }
    return null;
  },

  async getInProgressAttempt(userId: string, quizId: string): Promise<QuizAttempt | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('quiz_id', quizId)
        .is('submitted_at', null)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
    const attempts = readLocal<QuizAttempt[]>(STORAGE_KEYS.attempts, []);
    return (
      attempts.find(
        (a) => a.user_id === userId && a.quiz_id === quizId && a.submitted_at === null
      ) ?? null
    );
  },

  async saveAttemptProgress(
    attemptId: string,
    answers: Record<string, string>
  ): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('quiz_attempts')
        .update({ answers })
        .eq('id', attemptId)
        .is('submitted_at', null);
      if (error) throw error;
      return;
    }
    const attempts = readLocal<QuizAttempt[]>(STORAGE_KEYS.attempts, []);
    const idx = attempts.findIndex((a) => a.id === attemptId);
    if (idx !== -1 && attempts[idx].submitted_at === null) {
      attempts[idx] = { ...attempts[idx], answers };
      writeLocal(STORAGE_KEYS.attempts, attempts);
    }
  },

  async syncExpiredAttempts(userId: string): Promise<void> {
    let pending: QuizAttempt[] = [];
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .is('submitted_at', null);
      if (error) throw error;
      pending = data ?? [];
    } else {
      pending = readLocal<QuizAttempt[]>(STORAGE_KEYS.attempts, []).filter(
        (a) => a.user_id === userId && a.submitted_at === null
      );
    }

    for (const att of pending) {
      const quiz = await this.getQuizMeta(att.quiz_id);
      if (!quiz) continue;
      const deadlineMs =
        new Date(att.started_at).getTime() + quiz.duration_minutes * 60 * 1000;
      if (Date.now() >= deadlineMs) {
        await this.submitQuizAttempt(att.id, att.answers ?? {});
      }
    }
  },

  async listInProgressAttempts(userId: string): Promise<QuizAttempt[]> {
    await this.syncExpiredAttempts(userId);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .is('submitted_at', null);
      if (error) throw error;
      return data ?? [];
    }
    return readLocal<QuizAttempt[]>(STORAGE_KEYS.attempts, []).filter(
      (a) => a.user_id === userId && a.submitted_at === null
    );
  },

  async getUserAttemptForQuiz(userId: string, quizId: string): Promise<QuizAttempt | null> {
    await this.syncExpiredAttempts(userId);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('quiz_id', quizId)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
    const attempts = readLocal<QuizAttempt[]>(STORAGE_KEYS.attempts, [])
      .filter((a) => a.user_id === userId && a.quiz_id === quizId && a.submitted_at !== null)
      .sort(
        (a, b) =>
          new Date(b.submitted_at!).getTime() - new Date(a.submitted_at!).getTime()
      );
    return attempts[0] ?? null;
  },

  async startQuizAttempt(
    userId: string,
    quizId: string
  ): Promise<{ attempt: QuizAttempt; questions: SafeQuestion[] }> {
    await this.syncExpiredAttempts(userId);
    const quizMeta = await this.getQuizMeta(quizId);
    const passingScore = quizMeta?.passing_score ?? 70;

    const latestSubmitted = await this.getUserAttemptForQuiz(userId, quizId);
    if (latestSubmitted) {
      if ((latestSubmitted.score ?? 0) >= passingScore) {
        throw new Error('Anda sudah lulus tes ini.');
      }
      const elapsedMs = Date.now() - new Date(latestSubmitted.submitted_at!).getTime();
      if (elapsedMs < 60 * 1000) {
        const waitSec = Math.ceil((60 * 1000 - elapsedMs) / 1000);
        throw new Error(`Harap tunggu ${waitSec} detik sebelum mengulang tes.`);
      }
    }

    const inProgress = await this.getInProgressAttempt(userId, quizId);

    if (isSupabaseConfigured && supabase) {
      let attempt = inProgress;
      if (!attempt) {
        const { data: created, error: aErr } = await supabase
          .from('quiz_attempts')
          .insert({ user_id: userId, quiz_id: quizId })
          .select()
          .single();
        if (aErr) throw aErr;
        attempt = created;
      }

      const { data: questions, error: qErr } = await supabase.rpc('get_quiz_questions_safe', {
        p_quiz_id: quizId,
      });
      if (qErr) throw qErr;

      return { attempt: attempt!, questions: questions ?? [] };
    }

    const quiz = await this.getQuizMeta(quizId);
    if (!quiz) throw new Error('Kuis tidak ditemukan');

    const bank = quiz.questions ?? [];
    const limit = quiz.question_limit ?? bank.length;

    const allUserAttempts = readLocal<QuizAttempt[]>(STORAGE_KEYS.attempts, []);
    const seenIds = new Set<string>();
    for (const prev of allUserAttempts) {
      if (prev.user_id === userId && prev.quiz_id === quizId && prev.submitted_at) {
        for (const qid of prev.question_ids ?? []) {
          seenIds.add(qid);
        }
      }
    }

    let attempt = inProgress;
    let selectedQuestions: Question[];

    if (attempt?.question_ids && attempt.question_ids.length > 0) {
      const idSet = new Set(attempt.question_ids);
      selectedQuestions = bank.filter((q) => idSet.has(q.id));
      if (selectedQuestions.length === 0) {
        selectedQuestions = drawQuestionsFromBank(bank, limit, seenIds);
      }
    } else {
      selectedQuestions = drawQuestionsFromBank(bank, limit, seenIds);
      if (!attempt) {
        attempt = {
          id: `attempt-${Date.now()}`,
          user_id: userId,
          quiz_id: quizId,
          started_at: new Date().toISOString(),
          submitted_at: null,
          score: null,
          category_breakdown: null,
          answers: {},
          question_ids: selectedQuestions.map((q) => q.id),
        };
        const attempts = readLocal<QuizAttempt[]>(STORAGE_KEYS.attempts, []);
        writeLocal(STORAGE_KEYS.attempts, [attempt, ...attempts]);
      }
    }

    // Strip correct_option & explanation in demo mode as well
    const safeQuestions: SafeQuestion[] = selectedQuestions.map((q, idx) => ({
      id: q.id,
      category_tag: q.category_tag,
      question_text: q.question_text,
      image_url: q.image_url,
      audio_text: q.audio_text ?? null,
      audio_lang: q.audio_lang ?? null,
      options: q.options,
      order_index: idx + 1,
    }));

    return { attempt: attempt!, questions: safeQuestions };
  },

  async submitQuizAttempt(
    attemptId: string,
    answers: Record<string, string>
  ): Promise<QuizAttempt> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('submit_quiz_attempt', {
        p_attempt_id: attemptId,
        p_answers: answers,
      });
      if (error) throw error;
      return data;
    }

    const attempts = readLocal<QuizAttempt[]>(STORAGE_KEYS.attempts, []);
    const idx = attempts.findIndex((a) => a.id === attemptId);
    if (idx === -1) throw new Error('Attempt tidak ditemukan');
    const target = attempts[idx];
    if (target.submitted_at) return target;

    const quiz = await this.getQuizMeta(target.quiz_id);
    const allQuestions = quiz?.questions ?? [];
    const questions =
      target.question_ids && target.question_ids.length > 0
        ? allQuestions.filter((q) => target.question_ids!.includes(q.id))
        : allQuestions;

    let correctCount = 0;
    const breakdown: CategoryBreakdown = {};

    for (const q of questions) {
      const cat = q.category_tag || 'Umum';
      if (!breakdown[cat]) breakdown[cat] = { total: 0, correct: 0 };
      breakdown[cat].total += 1;
      if (answers[q.id] === q.correct_option) {
        correctCount += 1;
        breakdown[cat].correct += 1;
      }
    }

    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const updated: QuizAttempt = {
      ...target,
      submitted_at: new Date().toISOString(),
      answers,
      score,
      category_breakdown: breakdown,
    };
    attempts[idx] = updated;
    writeLocal(STORAGE_KEYS.attempts, attempts);
    return updated;
  },

  async getAttemptResult(
    attemptId: string
  ): Promise<{ attempt: QuizAttempt; review: ReviewQuestion[] }> {
    if (isSupabaseConfigured && supabase) {
      const { data: attempt, error: aErr } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();
      if (aErr) throw aErr;

      const { data: review, error: rErr } = await supabase.rpc('get_attempt_review', {
        p_attempt_id: attemptId,
      });
      if (rErr) throw rErr;
      const normalizedReview: ReviewQuestion[] = (review ?? []).map(
        (r: ReviewQuestion & { question_id?: string }) => ({
          ...r,
          id: r.id ?? r.question_id ?? '',
        })
      );
      return { attempt, review: normalizedReview };
    }

    const attempts = readLocal<QuizAttempt[]>(STORAGE_KEYS.attempts, []);
    const attempt = attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new Error('Hasil tes tidak ditemukan');

    const quiz = await this.getQuizMeta(attempt.quiz_id);
    const allQuestions = quiz?.questions ?? [];
    const targetQuestions =
      attempt.question_ids && attempt.question_ids.length > 0
        ? allQuestions.filter((q) => attempt.question_ids!.includes(q.id))
        : allQuestions;
    const review: ReviewQuestion[] = targetQuestions.map((q, idx) => ({
      id: q.id,
      category_tag: q.category_tag,
      question_text: q.question_text,
      image_url: q.image_url,
      audio_text: q.audio_text ?? null,
      audio_lang: q.audio_lang ?? null,
      options: q.options,
      order_index: idx + 1,
      correct_option: q.correct_option,
      explanation: q.explanation,
    }));
    return { attempt, review };
  },

  async listUserAttempts(userId: string): Promise<QuizAttempt[]> {
    await this.syncExpiredAttempts(userId);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    }
    return readLocal<QuizAttempt[]>(STORAGE_KEYS.attempts, [])
      .filter((a) => a.user_id === userId && a.submitted_at !== null)
      .sort(
        (a, b) =>
          new Date(b.submitted_at!).getTime() - new Date(a.submitted_at!).getTime()
      );
  },

  // TEACHER OPERATIONS
  async createCourse(input: {
    teacher_id: string;
    teacher_name: string;
    title: string;
    description: string;
    category: string;
    level: Course['level'];
    estimated_hours: number;
  }): Promise<Course> {
    const slug =
      input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      Math.floor(100 + Math.random() * 900);

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          teacher_id: input.teacher_id,
          title: input.title,
          slug,
          description: input.description,
          category: input.category,
          level: input.level,
          estimated_hours: input.estimated_hours,
          is_published: false,
        })
        .select()
        .single();
      if (error) throw error;
      return { ...data, modules: [] };
    }

    const courses = (await getDemoCourses());
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      teacher_id: input.teacher_id,
      teacher_name: input.teacher_name,
      title: input.title,
      slug,
      description: input.description,
      category: input.category,
      level: input.level,
      estimated_hours: input.estimated_hours,
      is_published: false,
      modules: [
        {
          id: `mod-${Date.now()}`,
          course_id: `course-${Date.now()}`,
          title: 'Modul 1: Pengantar & Latihan',
          order_index: 1,
          lessons: [],
        },
      ],
    };
    writeLocal(STORAGE_KEYS.courses, [newCourse, ...courses]);
    return newCourse;
  },

  async addQuestionToQuiz(
    quizId: string,
    question: Omit<Question, 'id' | 'quiz_id' | 'order_index'>
  ): Promise<Question> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('questions')
        .insert({ ...question, quiz_id: quizId, order_index: 99 })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const courses = (await getDemoCourses());
    const newQ: Question = {
      ...question,
      id: `q-${Date.now()}`,
      quiz_id: quizId,
      order_index: 99,
    };
    for (const c of courses) {
      for (const m of c.modules ?? []) {
        for (const l of m.lessons) {
          if (l.quiz?.id === quizId) {
            newQ.order_index = (l.quiz.questions?.length ?? 0) + 1;
            l.quiz.questions = [...(l.quiz.questions ?? []), newQ];
          }
        }
      }
    }
    writeLocal(STORAGE_KEYS.courses, courses);
    return newQ;
  },

  async toggleCoursePublish(courseId: string, isPublished: boolean): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('courses')
        .update({ is_published: isPublished })
        .eq('id', courseId);
      if (error) throw error;
      return;
    }
    const courses = (await getDemoCourses()).map((c) =>
      c.id === courseId ? { ...c, is_published: isPublished } : c
    );
    writeLocal(STORAGE_KEYS.courses, courses);
  },

  // ADMIN OPERATIONS
  async listAllProfiles(): Promise<Profile[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    }
    return (await getDemoProfiles());
  },

  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
      if (error) throw error;
      return;
    }
    const profiles = (await getDemoProfiles()).map((p) => (p.id === userId ? { ...p, role } : p));
    writeLocal(STORAGE_KEYS.profiles, profiles);
  },

  async toggleUserActive(userId: string, isActive: boolean): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);
      if (error) throw error;
      return;
    }
    const profiles = (await getDemoProfiles()).map((p) =>
      p.id === userId ? { ...p, is_active: isActive } : p
    );
    writeLocal(STORAGE_KEYS.profiles, profiles);
  },

  async updateProfile(userId: string, patch: { full_name: string; bio: string }): Promise<Profile> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name: patch.full_name, bio: patch.bio })
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const profiles = (await getDemoProfiles()).map((p) =>
      p.id === userId ? { ...p, full_name: patch.full_name, bio: patch.bio } : p
    );
    writeLocal(STORAGE_KEYS.profiles, profiles);
    return profiles.find((p) => p.id === userId)!;
  },

  async addModule(courseId: string, title: string): Promise<Module> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('modules')
        .insert({ course_id: courseId, title, order_index: 99 })
        .select()
        .single();
      if (error) throw error;
      return { ...data, lessons: [] };
    }
    const courses = (await getDemoCourses());
    const newMod: Module = {
      id: `mod-${Date.now()}`,
      course_id: courseId,
      title,
      order_index: 99,
      lessons: [],
    };
    const updated = courses.map((c) =>
      c.id === courseId
        ? { ...c, modules: [...(c.modules ?? []), { ...newMod, order_index: (c.modules?.length ?? 0) + 1 }] }
        : c
    );
    writeLocal(STORAGE_KEYS.courses, updated);
    return newMod;
  },

  async addLesson(
    moduleId: string,
    input: {
      title: string;
      type: Lesson['type'];
      content: string;
      video_url?: string;
      duration_minutes: number;
      passing_score?: number;
      use_subtests?: boolean;
    }
  ): Promise<Lesson> {
    if (isSupabaseConfigured && supabase) {
      const { data: lesson, error } = await supabase
        .from('lessons')
        .insert({
          module_id: moduleId,
          title: input.title,
          type: input.type,
          content: input.content,
          video_url: input.video_url ?? null,
          duration_minutes: input.duration_minutes,
          order_index: 99,
        })
        .select()
        .single();
      if (error) throw error;

      let quiz: Quiz | null = null;
      if (input.type === 'quiz') {
        const { data: qData, error: qErr } = await supabase
          .from('quizzes')
          .insert({
            lesson_id: lesson.id,
            title: input.title,
            description: input.content,
            duration_minutes: input.duration_minutes,
            passing_score: input.passing_score ?? 70,
            use_subtests: input.use_subtests ?? true,
          })
          .select()
          .single();
        if (qErr) throw qErr;
        quiz = { ...qData, questions: [] };
      }
      return { ...lesson, quiz };
    }

    const courses = (await getDemoCourses());
    const lessonId = `les-${Date.now()}`;
    const newLesson: Lesson = {
      id: lessonId,
      module_id: moduleId,
      title: input.title,
      type: input.type,
      content: input.content,
      video_url: input.video_url ?? null,
      duration_minutes: input.duration_minutes,
      order_index: 99,
      quiz:
        input.type === 'quiz'
          ? {
              id: `quiz-${Date.now()}`,
              lesson_id: lessonId,
              title: input.title,
              description: input.content,
              duration_minutes: input.duration_minutes,
              passing_score: input.passing_score ?? 70,
              use_subtests: input.use_subtests ?? true,
              questions: [],
            }
          : null,
    };

    for (const c of courses) {
      for (const m of c.modules ?? []) {
        if (m.id === moduleId) {
          newLesson.order_index = m.lessons.length + 1;
          m.lessons = [...m.lessons, newLesson];
        }
      }
    }
    writeLocal(STORAGE_KEYS.courses, courses);
    return newLesson;
  },

  async updateQuizSettings(
    quizId: string,
    patch: { duration_minutes: number; passing_score: number; use_subtests?: boolean }
  ): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('quizzes')
        .update({
          duration_minutes: patch.duration_minutes,
          passing_score: patch.passing_score,
          ...(patch.use_subtests !== undefined ? { use_subtests: patch.use_subtests } : {}),
        })
        .eq('id', quizId);
      if (error) throw error;
      return;
    }
    const courses = (await getDemoCourses());
    for (const c of courses) {
      for (const m of c.modules ?? []) {
        for (const l of m.lessons) {
          if (l.quiz?.id === quizId) {
            l.quiz.duration_minutes = patch.duration_minutes;
            l.quiz.passing_score = patch.passing_score;
            if (patch.use_subtests !== undefined) {
              l.quiz.use_subtests = patch.use_subtests;
            }
            l.duration_minutes = patch.duration_minutes;
          }
        }
      }
    }
    writeLocal(STORAGE_KEYS.courses, courses);
  },

  async deleteQuestion(questionId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('questions').delete().eq('id', questionId);
      if (error) throw error;
      return;
    }
    const courses = (await getDemoCourses());
    for (const c of courses) {
      for (const m of c.modules ?? []) {
        for (const l of m.lessons) {
          if (l.quiz?.questions) {
            l.quiz.questions = l.quiz.questions.filter((q) => q.id !== questionId);
          }
        }
      }
    }
    writeLocal(STORAGE_KEYS.courses, courses);
  },

  async uploadQuestionImage(file: File): Promise<string> {
    if (!file.type.startsWith('image/')) {
      throw new Error('File harus berupa gambar (PNG, JPG, WebP, atau SVG).');
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Ukuran gambar maksimal 2 MB.');
    }
    if (isSupabaseConfigured && supabase) {
      const ext = file.name.split('.').pop() || 'png';
      const filePath = `questions/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('question-images').upload(filePath, file);
      if (error) throw error;
      const { data } = supabase.storage.from('question-images').getPublicUrl(filePath);
      return data.publicUrl;
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
      reader.readAsDataURL(file);
    });
  },

  async listTeacherStudentProgress(teacherId: string): Promise<StudentProgressSummary[]> {
    if (isSupabaseConfigured && supabase) {
      const { data: courses, error: cErr } = await supabase
        .from('courses')
        .select('id, title, modules(lessons(id, quizzes(id)))')
        .eq('teacher_id', teacherId);
      if (cErr) throw cErr;

      const courseIds = (courses ?? []).map((c: any) => c.id);
      if (courseIds.length === 0) return [];

      const { data: enrollments, error: eErr } = await supabase
        .from('enrollments')
        .select('user_id, course_id, profiles:user_id(full_name, email)')
        .in('course_id', courseIds);
      if (eErr) throw eErr;

      const { data: progress } = await supabase.from('lesson_progress').select('user_id, lesson_id');
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('user_id, quiz_id, score, submitted_at')
        .not('submitted_at', 'is', null);

      return (enrollments ?? []).map((enr: any) => {
        const course = (courses ?? []).find((c: any) => c.id === enr.course_id);
        const lessons = (course?.modules ?? []).flatMap((m: any) => m.lessons ?? []);
        const lessonIds = lessons.map((l: any) => l.id);
        const quizIds = lessons
          .flatMap((l: any) => (Array.isArray(l.quizzes) ? l.quizzes : l.quizzes ? [l.quizzes] : []))
          .map((q: any) => q.id);

        const completedCount = (progress ?? []).filter(
          (p: any) => p.user_id === enr.user_id && lessonIds.includes(p.lesson_id)
        ).length;

        const studentAttempts = (attempts ?? []).filter(
          (a: any) => a.user_id === enr.user_id && quizIds.includes(a.quiz_id)
        );
        const latestScore =
          studentAttempts.length > 0 ? studentAttempts[studentAttempts.length - 1].score : null;

        return {
          student_id: enr.user_id,
          student_name: enr.profiles?.full_name ?? 'Siswa',
          student_email: enr.profiles?.email ?? '',
          course_id: enr.course_id,
          course_title: course?.title ?? '',
          completed_lessons: completedCount,
          total_lessons: lessonIds.length,
          latest_quiz_score: latestScore,
        };
      });
    }

    // Demo mode aggregation
    const courses = (await getDemoCourses()).filter((c) => c.teacher_id === teacherId);
    const profiles = (await getDemoProfiles());
    const enrollments = readLocal<Record<string, string[]>>(STORAGE_KEYS.enrollments, {
      'demo-student-1': ['course-retail-panduan'],
    });
    const progress = readLocal<Record<string, string[]>>(STORAGE_KEYS.progress, {});
    const attempts = readLocal<QuizAttempt[]>(STORAGE_KEYS.attempts, []);

    const rows: StudentProgressSummary[] = [];
    for (const [userId, courseIds] of Object.entries(enrollments)) {
      const student = profiles.find((p) => p.id === userId);
      if (!student) continue;
      for (const cid of courseIds) {
        const course = courses.find((c) => c.id === cid);
        if (!course) continue;
        const lessons = (course.modules ?? []).flatMap((m) => m.lessons);
        const lessonIds = lessons.map((l) => l.id);
        const quizIds = lessons.filter((l) => l.quiz).map((l) => l.quiz!.id);
        const completedCount = (progress[userId] ?? []).filter((lid) =>
          lessonIds.includes(lid)
        ).length;
        const studentAttempts = attempts.filter(
          (a) => a.user_id === userId && quizIds.includes(a.quiz_id) && a.submitted_at
        );
        rows.push({
          student_id: userId,
          student_name: student.full_name,
          student_email: student.email,
          course_id: course.id,
          course_title: course.title,
          completed_lessons: completedCount,
          total_lessons: lessonIds.length,
          latest_quiz_score:
            studentAttempts.length > 0 ? studentAttempts[0].score : null,
        });
      }
    }
    return rows;
  },

  // FULL CRUD EDIT / DELETE / REORDER FOR TEACHER
  async updateCourse(
    courseId: string,
    patch: { title: string; description: string; category: string; level: Course['level']; estimated_hours: number }
  ): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('courses').update(patch).eq('id', courseId);
      if (error) throw error;
      return;
    }
    const courses = (await getDemoCourses()).map((c) =>
      c.id === courseId ? { ...c, ...patch } : c
    );
    writeLocal(STORAGE_KEYS.courses, courses);
  },

  async deleteCourse(courseId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('courses').delete().eq('id', courseId);
      if (error) throw error;
      return;
    }
    const courses = (await getDemoCourses()).filter((c) => c.id !== courseId);
    writeLocal(STORAGE_KEYS.courses, courses);
  },

  async updateModule(moduleId: string, title: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('modules').update({ title }).eq('id', moduleId);
      if (error) throw error;
      return;
    }
    const courses = await getDemoCourses();
    for (const c of courses) {
      for (const m of c.modules ?? []) {
        if (m.id === moduleId) m.title = title;
      }
    }
    writeLocal(STORAGE_KEYS.courses, courses);
  },

  async deleteModule(moduleId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('modules').delete().eq('id', moduleId);
      if (error) throw error;
      return;
    }
    const courses = (await getDemoCourses()).map((c) => ({
      ...c,
      modules: (c.modules ?? []).filter((m) => m.id !== moduleId),
    }));
    writeLocal(STORAGE_KEYS.courses, courses);
  },

  async reorderModules(courseId: string, orderedModuleIds: string[]): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await Promise.all(
        orderedModuleIds.map((id, idx) =>
          supabase!.from('modules').update({ order_index: idx + 1 }).eq('id', id)
        )
      );
      return;
    }
    const courses = await getDemoCourses();
    for (const c of courses) {
      if (c.id === courseId && c.modules) {
        c.modules = orderedModuleIds
          .map((id, idx) => {
            const mod = c.modules!.find((m) => m.id === id);
            return mod ? { ...mod, order_index: idx + 1 } : null;
          })
          .filter(Boolean) as Module[];
      }
    }
    writeLocal(STORAGE_KEYS.courses, courses);
  },

  async updateLesson(
    lessonId: string,
    patch: { title: string; content: string; video_url?: string | null; duration_minutes: number }
  ): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('lessons').update(patch).eq('id', lessonId);
      if (error) throw error;
      return;
    }
    const courses = await getDemoCourses();
    for (const c of courses) {
      for (const m of c.modules ?? []) {
        for (const l of m.lessons) {
          if (l.id === lessonId) {
            l.title = patch.title;
            l.content = patch.content;
            l.video_url = patch.video_url ?? null;
            l.duration_minutes = patch.duration_minutes;
          }
        }
      }
    }
    writeLocal(STORAGE_KEYS.courses, courses);
  },

  async deleteLesson(lessonId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
      if (error) throw error;
      return;
    }
    const courses = await getDemoCourses();
    for (const c of courses) {
      for (const m of c.modules ?? []) {
        m.lessons = m.lessons.filter((l) => l.id !== lessonId);
      }
    }
    writeLocal(STORAGE_KEYS.courses, courses);
  },

  async reorderLessons(moduleId: string, orderedLessonIds: string[]): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await Promise.all(
        orderedLessonIds.map((id, idx) =>
          supabase!.from('lessons').update({ order_index: idx + 1 }).eq('id', id)
        )
      );
      return;
    }
    const courses = await getDemoCourses();
    for (const c of courses) {
      for (const m of c.modules ?? []) {
        if (m.id === moduleId) {
          m.lessons = orderedLessonIds
            .map((id, idx) => {
              const les = m.lessons.find((l) => l.id === id);
              return les ? { ...les, order_index: idx + 1 } : null;
            })
            .filter(Boolean) as Lesson[];
        }
      }
    }
    writeLocal(STORAGE_KEYS.courses, courses);
  },

  // PRIORITAS 2: LESSON Q&A COMMENTS
  async listLessonComments(lessonId: string): Promise<LessonComment[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('lesson_comments')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    }
    return readLocal<LessonComment[]>(STORAGE_KEYS.comments, []).filter(
      (c) => c.lesson_id === lessonId
    );
  },

  async addLessonComment(input: {
    lesson_id: string;
    user_id: string;
    author_name: string;
    author_role: UserRole;
    content: string;
    parent_id?: string | null;
    is_mentor_answer?: boolean;
    notify_user_id?: string;
    course_slug?: string;
  }): Promise<LessonComment> {
    const isMentor =
      input.is_mentor_answer ??
      (input.author_role === 'teacher' || input.author_role === 'admin');
    const payload = {
      lesson_id: input.lesson_id,
      user_id: input.user_id,
      author_name: input.author_name,
      author_role: input.author_role,
      content: input.content,
      parent_id: input.parent_id ?? null,
      is_mentor_answer: isMentor,
    };

    let saved: LessonComment;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('lesson_comments')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      saved = data;
    } else {
      saved = {
        ...payload,
        id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        created_at: new Date().toISOString(),
      };
      const all = readLocal<LessonComment[]>(STORAGE_KEYS.comments, []);
      writeLocal(STORAGE_KEYS.comments, [...all, saved]);
    }

    if (input.notify_user_id && input.notify_user_id !== input.user_id) {
      await this.createNotification({
        user_id: input.notify_user_id,
        type: 'comment',
        title: isMentor
          ? `Mentor ${input.author_name} menjawab pertanyaan Anda`
          : `${input.author_name} membalas diskusi Anda`,
        message: input.content,
        link: input.course_slug
          ? `/courses/${input.course_slug}?lesson=${input.lesson_id}`
          : '/',
      });
    }

    return saved;
  },

  async listAllCommentsForTeacher(): Promise<TeacherCommentItem[]> {
    let comments: LessonComment[] = [];
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('lesson_comments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      comments = data ?? [];
    } else {
      comments = readLocal<LessonComment[]>(STORAGE_KEYS.comments, []);
    }

    const courses = await this.listPublishedCourses();
    const lessonLookup = new Map<
      string,
      { course_id: string; course_slug: string; course_title: string; lesson_title: string }
    >();
    for (const c of courses) {
      for (const m of c.modules ?? []) {
        for (const l of m.lessons) {
          lessonLookup.set(l.id, {
            course_id: c.id,
            course_slug: c.slug,
            course_title: c.title,
            lesson_title: l.title,
          });
        }
      }
    }

    const topLevel = comments.filter((c) => !c.parent_id);
    return topLevel
      .map((c) => {
        const replies = comments.filter((r) => r.parent_id === c.id);
        const meta = lessonLookup.get(c.lesson_id);
        return {
          ...c,
          course_id: meta?.course_id ?? '',
          course_slug: meta?.course_slug ?? '',
          course_title: meta?.course_title ?? 'Kursus',
          lesson_title: meta?.lesson_title ?? 'Materi',
          reply_count: replies.length,
          has_mentor_reply: replies.some(
            (r) => r.is_mentor_answer || r.author_role === 'teacher' || r.author_role === 'admin'
          ),
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async deleteLessonComment(commentId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('lesson_comments').delete().eq('id', commentId);
      if (error) throw error;
      return;
    }
    const all = readLocal<LessonComment[]>(STORAGE_KEYS.comments, []).filter(
      (c) => c.id !== commentId
    );
    writeLocal(STORAGE_KEYS.comments, all);
  },

  // PRIORITAS 2: PERSONAL NOTES
  async getLessonNote(userId: string, lessonId: string): Promise<string> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('lesson_notes')
        .select('content')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .maybeSingle();
      if (error) throw error;
      return data?.content ?? '';
    }
    const map = readLocal<Record<string, string>>(STORAGE_KEYS.notes, {});
    return map[`${userId}:${lessonId}`] ?? '';
  },

  async saveLessonNote(userId: string, lessonId: string, content: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('lesson_notes')
        .upsert(
          { user_id: userId, lesson_id: lessonId, content, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,lesson_id' }
        );
      if (error) throw error;
      return;
    }
    const map = readLocal<Record<string, string>>(STORAGE_KEYS.notes, {});
    map[`${userId}:${lessonId}`] = content;
    writeLocal(STORAGE_KEYS.notes, map);
  },

  // PRIORITAS 2: COURSE RATINGS & REVIEWS
  async listCourseReviews(courseId: string): Promise<CourseReview[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('course_reviews')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    }
    return readLocal<CourseReview[]>(STORAGE_KEYS.reviews, []).filter(
      (r) => r.course_id === courseId
    );
  },

  async listAllCourseRatingSummaries(): Promise<Record<string, CourseRatingSummary>> {
    let all: Pick<CourseReview, 'course_id' | 'rating'>[] = [];
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('course_reviews')
        .select('course_id, rating');
      if (error) throw error;
      all = data ?? [];
    } else {
      all = readLocal<CourseReview[]>(STORAGE_KEYS.reviews, []);
    }

    const grouped: Record<string, { sum: number; count: number }> = {};
    for (const r of all) {
      if (!grouped[r.course_id]) grouped[r.course_id] = { sum: 0, count: 0 };
      grouped[r.course_id].sum += r.rating;
      grouped[r.course_id].count += 1;
    }

    const out: Record<string, CourseRatingSummary> = {};
    for (const [cid, g] of Object.entries(grouped)) {
      out[cid] = { avg: Number((g.sum / g.count).toFixed(1)), count: g.count };
    }
    return out;
  },

  async submitCourseReview(input: {
    course_id: string;
    user_id: string;
    author_name: string;
    rating: number;
    comment: string;
  }): Promise<CourseReview> {
    const clampedRating = Math.min(5, Math.max(1, Math.round(input.rating)));
    const payload = { ...input, rating: clampedRating };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('course_reviews')
        .upsert(payload, { onConflict: 'user_id,course_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const all = readLocal<CourseReview[]>(STORAGE_KEYS.reviews, []);
    const existingIdx = all.findIndex(
      (r) => r.course_id === payload.course_id && r.user_id === payload.user_id
    );
    const saved: CourseReview = {
      ...payload,
      id: existingIdx !== -1 ? all[existingIdx].id : `rev-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    if (existingIdx !== -1) all[existingIdx] = saved;
    else all.unshift(saved);
    writeLocal(STORAGE_KEYS.reviews, all);
    return saved;
  },

  // =========================================================================
  // PRIORITAS 3: ASSIGNMENTS & SUBMISSIONS
  // =========================================================================
  async uploadAssignmentFile(
    file: File,
    userId: string
  ): Promise<{ url: string; name: string }> {
    if (isSupabaseConfigured && supabase) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${userId}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage
        .from('assignment-submissions')
        .upload(filePath, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage
        .from('assignment-submissions')
        .getPublicUrl(filePath);
      return { url: data.publicUrl, name: file.name };
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({ url: String(reader.result ?? ''), name: file.name });
      reader.onerror = () => reject(new Error('Gagal membaca file tugas.'));
      reader.readAsDataURL(file);
    });
  },

  async listCourseAssignments(courseId: string): Promise<CourseAssignment[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('course_assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as CourseAssignment[];
      return rows.length > 0 ? rows : [buildDefaultCourseAssignment(courseId)];
    }
    const all = readLocal<CourseAssignment[]>(STORAGE_KEYS.assignments, []);
    const filtered = all.filter((a) => a.course_id === courseId);
    return filtered.length > 0 ? filtered : [buildDefaultCourseAssignment(courseId)];
  },

  async listAllAssignments(): Promise<CourseAssignment[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('course_assignments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    }
    return readLocal<CourseAssignment[]>(STORAGE_KEYS.assignments, []);
  },

  async createCourseAssignment(input: {
    course_id: string;
    lesson_id?: string | null;
    title: string;
    instructions: string;
    requires_file?: boolean;
    task_brief?: string;
    how_to_guide?: string;
    rubric?: AssignmentRubricItem[];
    due_date?: string | null;
    max_score?: number;
    created_by?: string | null;
  }): Promise<CourseAssignment> {
    const payload = {
      course_id: input.course_id,
      lesson_id: input.lesson_id ?? null,
      title: input.title,
      instructions: input.instructions,
      requires_file: input.requires_file ?? true,
      task_brief: input.task_brief ?? input.instructions,
      how_to_guide: input.how_to_guide ?? '',
      rubric: input.rubric ?? DEFAULT_ASSIGNMENT_RUBRIC,
      due_date: input.due_date || null,
      max_score: input.max_score ?? 100,
      created_by: input.created_by ?? null,
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('course_assignments')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const all = readLocal<CourseAssignment[]>(STORAGE_KEYS.assignments, []);
    const item: CourseAssignment = {
      ...payload,
      id: `asg-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    all.unshift(item);
    writeLocal(STORAGE_KEYS.assignments, all);
    return item;
  },

  async deleteCourseAssignment(assignmentId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('course_assignments')
        .delete()
        .eq('id', assignmentId);
      if (error) throw error;
      return;
    }
    const all = readLocal<CourseAssignment[]>(STORAGE_KEYS.assignments, []);
    writeLocal(
      STORAGE_KEYS.assignments,
      all.filter((a) => a.id !== assignmentId)
    );
  },

  async listMySubmissions(userId: string): Promise<AssignmentSubmission[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data ?? [];
    }
    const all = readLocal<AssignmentSubmission[]>(STORAGE_KEYS.submissions, []);
    return all.filter((s) => s.user_id === userId);
  },

  async listAllSubmissionsForTeacher(): Promise<AssignmentSubmission[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    }
    return readLocal<AssignmentSubmission[]>(STORAGE_KEYS.submissions, []);
  },

  async submitAssignment(input: {
    assignment_id: string;
    user_id: string;
    student_name: string;
    submission_text: string;
    attachment_url?: string | null;
    attachment_name?: string | null;
  }): Promise<AssignmentSubmission> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .upsert(
          {
            assignment_id: input.assignment_id,
            user_id: input.user_id,
            student_name: input.student_name,
            submission_text: input.submission_text,
            attachment_url: input.attachment_url || null,
            attachment_name: input.attachment_name || null,
            status: 'submitted',
            rating_stars: null,
            feedback: null,
            graded_at: null,
            submitted_at: new Date().toISOString(),
          },
          { onConflict: 'assignment_id,user_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const all = readLocal<AssignmentSubmission[]>(STORAGE_KEYS.submissions, []);
    const idx = all.findIndex(
      (s) => s.assignment_id === input.assignment_id && s.user_id === input.user_id
    );
    const saved: AssignmentSubmission = {
      id: idx !== -1 ? all[idx].id : `sub-${Date.now()}`,
      assignment_id: input.assignment_id,
      user_id: input.user_id,
      student_name: input.student_name,
      submission_text: input.submission_text,
      attachment_url: input.attachment_url || null,
      attachment_name: input.attachment_name || null,
      status: 'submitted',
      rating_stars: null,
      score: null,
      feedback: null,
      submitted_at: new Date().toISOString(),
      graded_at: null,
    };
    if (idx !== -1) all[idx] = saved;
    else all.unshift(saved);
    writeLocal(STORAGE_KEYS.submissions, all);
    return saved;
  },

  async gradeAssignmentSubmission(
    submissionId: string,
    input: {
      rating_stars?: number | null;
      score: number;
      feedback: string;
      status: SubmissionStatus;
      courseId?: string;
      courseSlug?: string;
      assignmentTitle?: string;
    }
  ): Promise<AssignmentSubmission> {
    if (input.status === 'rejected' && !input.feedback.trim()) {
      throw new Error('Alasan penolakan wajib diisi.');
    }
    const safeScore = Math.min(100, Math.max(0, Math.round(input.score)));
    const gradedAt = new Date().toISOString();
    let updated: AssignmentSubmission;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .update({
          rating_stars: input.rating_stars ?? null,
          score: safeScore,
          feedback: input.feedback,
          status: input.status,
          graded_at: gradedAt,
        })
        .eq('id', submissionId)
        .select()
        .single();
      if (error) throw error;
      updated = data;
    } else {
      const all = readLocal<AssignmentSubmission[]>(STORAGE_KEYS.submissions, []);
      const idx = all.findIndex((s) => s.id === submissionId);
      if (idx === -1) throw new Error('Pengumpulan tugas tidak ditemukan.');
      updated = {
        ...all[idx],
        rating_stars: input.rating_stars ?? null,
        score: safeScore,
        feedback: input.feedback,
        status: input.status,
        graded_at: gradedAt,
      };
      all[idx] = updated;
      writeLocal(STORAGE_KEYS.submissions, all);
    }

    const isRejected = input.status === 'rejected' || input.status === 'needs_revision';
    const starsLabel = input.rating_stars ? ` (★ ${input.rating_stars}/5)` : '';
    await this.createNotification({
      user_id: updated.user_id,
      type: 'grade',
      title: isRejected
        ? `Tugas Ditolak — Upload Ulang: ${input.assignmentTitle ?? 'Tugas'}`
        : `Selamat! Tugas Diterima & Dinilai${starsLabel}`,
      message: isRejected
        ? `Alasan penolakan: ${input.feedback || 'File belum sesuai aturan tugas. Silakan unggah ulang.'}`
        : `Skor: ${input.score}${input.feedback ? ` — "${input.feedback}"` : ''}`,
      link: input.courseSlug ? `/courses/${input.courseSlug}` : '/',
    });

    return updated;
  },

  // =========================================================================
  // PRIORITAS 3: IN-APP NOTIFICATIONS
  // =========================================================================
  async listNotifications(userId: string): Promise<AppNotification[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    }
    const all = readLocal<AppNotification[]>(STORAGE_KEYS.notifications, []);
    return all.filter((n) => n.user_id === userId);
  },

  async createNotification(input: {
    user_id: string;
    title: string;
    message: string;
    type?: NotificationType;
    link?: string | null;
  }): Promise<AppNotification> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: input.user_id,
          title: input.title,
          message: input.message,
          type: input.type ?? 'system',
          link: input.link ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const all = readLocal<AppNotification[]>(STORAGE_KEYS.notifications, []);
    const item: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: input.user_id,
      title: input.title,
      message: input.message,
      type: input.type ?? 'system',
      link: input.link ?? null,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    all.unshift(item);
    writeLocal(STORAGE_KEYS.notifications, all.slice(0, 100));
    return item;
  },

  async markNotificationRead(notificationId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
      return;
    }
    const all = readLocal<AppNotification[]>(STORAGE_KEYS.notifications, []);
    writeLocal(
      STORAGE_KEYS.notifications,
      all.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
  },

  async markAllNotificationsRead(userId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) throw error;
      return;
    }
    const all = readLocal<AppNotification[]>(STORAGE_KEYS.notifications, []);
    writeLocal(
      STORAGE_KEYS.notifications,
      all.map((n) => (n.user_id === userId ? { ...n, is_read: true } : n))
    );
  },

  // =========================================================================
  // FLASHCARD SRS PROGRESS SYNC
  // =========================================================================
  async getFlashcardProgressMap(userId: string): Promise<Record<string, SrsRating>> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('flashcard_progress')
        .select('card_key, rating')
        .eq('user_id', userId);
      if (error) throw error;
      const map: Record<string, SrsRating> = {};
      for (const row of data ?? []) {
        map[row.card_key] = row.rating as SrsRating;
      }
      return map;
    }
    const store = readLocal<Record<string, Record<string, SrsRating>>>(
      STORAGE_KEYS.flashcardSrs,
      {}
    );
    return store[userId] ?? {};
  },

  async getCourseContextByQuizId(quizId: string): Promise<{
    courseId: string;
    courseSlug: string;
    courseTitle: string;
    lessonId: string;
    nextLessonId: string | null;
    isStandaloneQuiz: boolean;
  } | null> {
    const courses = await this.listPublishedCourses();
    for (const c of courses) {
      const flatLessons = (c.modules ?? []).flatMap((m) => m.lessons);
      const idx = flatLessons.findIndex((l) => l.quiz?.id === quizId);
      if (idx !== -1) {
        return {
          courseId: c.id,
          courseSlug: c.slug,
          courseTitle: c.title,
          lessonId: flatLessons[idx].id,
          nextLessonId: flatLessons[idx + 1]?.id ?? null,
          isStandaloneQuiz: c.category === 'Latihan Langsung',
        };
      }
    }
    return null;
  },

  async saveFlashcardRating(
    userId: string,
    cardKey: string,
    rating: SrsRating
  ): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('flashcard_progress').upsert(
        {
          user_id: userId,
          card_key: cardKey,
          rating,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,card_key' }
      );
      if (error) throw error;
      return;
    }
    const store = readLocal<Record<string, Record<string, SrsRating>>>(
      STORAGE_KEYS.flashcardSrs,
      {}
    );
    const userMap = store[userId] ?? {};
    store[userId] = { ...userMap, [cardKey]: rating };
    writeLocal(STORAGE_KEYS.flashcardSrs, store);
  },

  // =========================================================================
  // 1-ON-1 MENTOR CHAT
  // =========================================================================
  async listMentorMessages(courseId: string, studentId: string): Promise<MentorMessage[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('mentor_messages')
        .select('*')
        .eq('course_id', courseId)
        .eq('student_id', studentId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    }
    return readLocal<MentorMessage[]>(STORAGE_KEYS.mentorMessages, []).filter(
      (m) => m.course_id === courseId && m.student_id === studentId
    );
  },

  async listAllMentorMessagesForTeacher(): Promise<MentorMessage[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('mentor_messages')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    }
    return readLocal<MentorMessage[]>(STORAGE_KEYS.mentorMessages, []);
  },

  async sendMentorMessage(input: {
    course_id: string;
    course_slug?: string;
    student_id: string;
    mentor_id: string;
    sender_id: string;
    sender_name: string;
    sender_role: UserRole;
    message: string;
  }): Promise<MentorMessage> {
    const payload = {
      course_id: input.course_id,
      student_id: input.student_id,
      mentor_id: input.mentor_id,
      sender_id: input.sender_id,
      sender_name: input.sender_name,
      sender_role: input.sender_role,
      message: input.message,
    };

    let saved: MentorMessage;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('mentor_messages')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      saved = data;
    } else {
      saved = {
        ...payload,
        id: `mmsg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        created_at: new Date().toISOString(),
      };
      const all = readLocal<MentorMessage[]>(STORAGE_KEYS.mentorMessages, []);
      writeLocal(STORAGE_KEYS.mentorMessages, [...all, saved]);
    }

    const recipientId =
      input.sender_id === input.student_id ? input.mentor_id : input.student_id;
    if (recipientId && recipientId !== input.sender_id) {
      await this.createNotification({
        user_id: recipientId,
        type: 'comment',
        title: `Pesan Konsultasi dari ${input.sender_name}`,
        message: input.message,
        link: input.course_slug ? `/courses/${input.course_slug}` : '/teacher',
      });
    }

    return saved;
  },

  // =========================================================================
  // LIVE MENTORING / OFFICE HOURS SESSIONS
  // =========================================================================
  async listMentoringSessions(courseId?: string): Promise<MentoringSession[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('mentoring_sessions')
        .select('*')
        .order('scheduled_at', { ascending: true });
      if (courseId) query = query.eq('course_id', courseId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    }
    const all = readLocal<MentoringSession[]>(STORAGE_KEYS.mentoringSessions, []);
    const filtered = courseId ? all.filter((s) => s.course_id === courseId) : all;
    return filtered.sort(
      (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );
  },

  async createMentoringSession(input: {
    course_id: string;
    mentor_id?: string | null;
    mentor_name: string;
    title: string;
    topic: string;
    scheduled_at: string;
    meeting_url: string;
    max_participants?: number;
  }): Promise<MentoringSession> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('mentoring_sessions')
        .insert({
          ...input,
          max_participants: input.max_participants ?? 20,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const item: MentoringSession = {
      id: `msess-${Date.now()}`,
      course_id: input.course_id,
      mentor_id: input.mentor_id ?? null,
      mentor_name: input.mentor_name,
      title: input.title,
      topic: input.topic,
      scheduled_at: input.scheduled_at,
      meeting_url: input.meeting_url,
      max_participants: input.max_participants ?? 20,
      created_at: new Date().toISOString(),
    };
    const all = readLocal<MentoringSession[]>(STORAGE_KEYS.mentoringSessions, []);
    writeLocal(STORAGE_KEYS.mentoringSessions, [...all, item]);
    return item;
  },

  async deleteMentoringSession(sessionId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('mentoring_sessions')
        .delete()
        .eq('id', sessionId);
      if (error) throw error;
      return;
    }
    const all = readLocal<MentoringSession[]>(STORAGE_KEYS.mentoringSessions, []);
    writeLocal(
      STORAGE_KEYS.mentoringSessions,
      all.filter((s) => s.id !== sessionId)
    );
  },

  async listAllMentoringBookings(): Promise<MentoringBooking[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('mentoring_bookings').select('*');
      if (error) throw error;
      return data ?? [];
    }
    return readLocal<MentoringBooking[]>(STORAGE_KEYS.mentoringBookings, []);
  },

  async bookMentoringSession(input: {
    session_id: string;
    session_title: string;
    user_id: string;
    student_name: string;
    course_slug?: string;
  }): Promise<MentoringBooking> {
    let saved: MentoringBooking;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('mentoring_bookings')
        .upsert(
          {
            session_id: input.session_id,
            user_id: input.user_id,
            student_name: input.student_name,
          },
          { onConflict: 'session_id,user_id' }
        )
        .select()
        .single();
      if (error) throw error;
      saved = data;
    } else {
      const all = readLocal<MentoringBooking[]>(STORAGE_KEYS.mentoringBookings, []);
      const existing = all.find(
        (b) => b.session_id === input.session_id && b.user_id === input.user_id
      );
      if (existing) return existing;

      const sessions = readLocal<MentoringSession[]>(STORAGE_KEYS.mentoringSessions, []);
      const targetSession = sessions.find((s) => s.id === input.session_id);
      const currentCount = all.filter((b) => b.session_id === input.session_id).length;
      if (targetSession && currentCount >= targetSession.max_participants) {
        throw new Error('Kuota sesi sudah penuh.');
      }

      saved = {
        id: `mbook-${Date.now()}`,
        session_id: input.session_id,
        user_id: input.user_id,
        student_name: input.student_name,
        created_at: new Date().toISOString(),
      };
      writeLocal(STORAGE_KEYS.mentoringBookings, [...all, saved]);
    }

    await this.createNotification({
      user_id: input.user_id,
      type: 'course',
      title: `Terdaftar di Sesi Live: ${input.session_title}`,
      message: 'Slot bimbingan Anda telah dikonfirmasi. Tautan meeting tersedia di tab Sesi Live.',
      link: input.course_slug ? `/courses/${input.course_slug}` : '/',
    });

    return saved;
  },

  // =========================================================================
  // COURSE ANNOUNCEMENTS
  // =========================================================================
  async listCourseAnnouncements(courseId?: string): Promise<CourseAnnouncement[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('course_announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (courseId) query = query.eq('course_id', courseId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    }
    const all = readLocal<CourseAnnouncement[]>(STORAGE_KEYS.announcements, []);
    const filtered = courseId ? all.filter((a) => a.course_id === courseId) : all;
    return filtered.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async createCourseAnnouncement(input: {
    course_id: string;
    course_slug?: string;
    author_id?: string | null;
    author_name: string;
    title: string;
    content: string;
  }): Promise<CourseAnnouncement> {
    let saved: CourseAnnouncement;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('course_announcements')
        .insert({
          course_id: input.course_id,
          author_id: input.author_id ?? null,
          author_name: input.author_name,
          title: input.title,
          content: input.content,
        })
        .select()
        .single();
      if (error) throw error;
      saved = data;
    } else {
      saved = {
        id: `ann-${Date.now()}`,
        course_id: input.course_id,
        author_id: input.author_id ?? null,
        author_name: input.author_name,
        title: input.title,
        content: input.content,
        created_at: new Date().toISOString(),
      };
      const all = readLocal<CourseAnnouncement[]>(STORAGE_KEYS.announcements, []);
      writeLocal(STORAGE_KEYS.announcements, [saved, ...all]);

      // Notify enrolled students in demo mode
      const enrollments = readLocal<Record<string, string[]>>(STORAGE_KEYS.enrollments, {
        'demo-student-1': ['course-retail-panduan'],
      });
      for (const [studentId, cIds] of Object.entries(enrollments)) {
        if (cIds.includes(input.course_id) && studentId !== input.author_id) {
          await this.createNotification({
            user_id: studentId,
            type: 'course',
            title: `Pengumuman Baru: ${input.title}`,
            message: input.content,
            link: input.course_slug ? `/courses/${input.course_slug}` : '/',
          });
        }
      }
    }
    return saved;
  },

  async deleteCourseAnnouncement(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('course_announcements').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    const all = readLocal<CourseAnnouncement[]>(STORAGE_KEYS.announcements, []);
    writeLocal(
      STORAGE_KEYS.announcements,
      all.filter((a) => a.id !== id)
    );
  },

  // =========================================================================
  // LEADERBOARD & WEEKLY LEARNING GOAL
  // =========================================================================
  getWeeklyGoal(userId: string): number {
    const map = readLocal<Record<string, number>>(STORAGE_KEYS.weeklyGoals, {});
    return map[userId] ?? 5;
  },

  saveWeeklyGoal(userId: string, target: number): void {
    const map = readLocal<Record<string, number>>(STORAGE_KEYS.weeklyGoals, {});
    map[userId] = Math.max(1, target);
    writeLocal(STORAGE_KEYS.weeklyGoals, map);
  },

  async listLeaderboard(): Promise<LeaderboardEntry[]> {
    const profiles = await getDemoProfiles();
    const students = profiles.filter((p) => p.role === 'student');
    const progressMap = readLocal<Record<string, string[]>>(STORAGE_KEYS.progress, {});
    const attempts = readLocal<QuizAttempt[]>(STORAGE_KEYS.attempts, []);

    const entries: LeaderboardEntry[] = students.map((s) => {
      const completedLessons = (progressMap[s.id] ?? []).length;
      const userAttempts = attempts.filter((a) => a.user_id === s.id && a.submitted_at);
      const passedQuizzes = userAttempts.filter((a) => (a.score ?? 0) >= 70).length;
      const xp = completedLessons * 20 + userAttempts.length * 40 + passedQuizzes * 35;
      const level = Math.floor(xp / 200) + 1;
      return {
        user_id: s.id,
        full_name: s.full_name,
        xp,
        level,
        completed_lessons: completedLessons,
        passed_quizzes: passedQuizzes,
      };
    });

    return entries.sort((a, b) => b.xp - a.xp);
  },

  // =========================================================================
  // PUBLIC CERTIFICATE VERIFICATION
  // =========================================================================
  async registerCertificate(input: {
    cert_code: string;
    user_id: string;
    student_name: string;
    course_id: string;
    course_title: string;
    teacher_name: string;
  }): Promise<CertificateRecord> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('certificates')
        .upsert(input, { onConflict: 'user_id,course_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const all = readLocal<CertificateRecord[]>(STORAGE_KEYS.certificates, []);
    const existing = all.find(
      (c) => c.cert_code === input.cert_code || (c.user_id === input.user_id && c.course_id === input.course_id)
    );
    if (existing) return existing;
    const rec: CertificateRecord = {
      ...input,
      id: `cert-${Date.now()}`,
      issued_at: new Date().toISOString(),
    };
    writeLocal(STORAGE_KEYS.certificates, [rec, ...all]);
    return rec;
  },

  async verifyCertificate(certCode: string): Promise<CertificateRecord | null> {
    const clean = certCode.trim().toUpperCase();
    if (!clean) return null;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('cert_code', clean)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    }
    const all = readLocal<CertificateRecord[]>(STORAGE_KEYS.certificates, []);
    return all.find((c) => c.cert_code.toUpperCase() === clean) ?? null;
  },

  // =========================================================================
  // COMMUNITY FORUM
  // =========================================================================
  async listCommunityPosts(): Promise<CommunityPost[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    }
    const defaults: CommunityPost[] = [
      {
        id: 'cpost-seed-1',
        user_id: 'demo-teacher-1',
        author_name: 'Rizco Renova',
        author_role: 'teacher',
        category: 'Tips Psikotes',
        title: 'Strategi Manajemen Waktu untuk Simulasi Psikotes 120 Menit',
        content:
          'Jangan terpaku lebih dari 90 detik pada satu soal deret angka atau logika gambar. Tandai soal yang ragu dengan fitur Ragu-ragu lalu selesaikan soal ketelitian dan verbal lebih dulu.',
        likes_count: 14,
        created_at: new Date(Date.now() - 86400_000 * 2).toISOString(),
      },
      {
        id: 'cpost-seed-2',
        user_id: 'demo-student-1',
        author_name: 'Nadia Kusuma',
        author_role: 'student',
        category: 'Belajar Bahasa',
        title: 'Tips Menghafal Hiragana & Katakana dalam 7 Hari',
        content:
          'Saya kombinasikan Flashcard SRS mode Sulit/Sedang/Mudah dengan Kanvas Menulis 15 menit setiap malam. Hasilnya jauh lebih cepat hafal bentuk huruf yang mirip seperti ツ dan シ.',
        likes_count: 9,
        created_at: new Date(Date.now() - 86400_000).toISOString(),
      },
    ];
    const stored = readLocal<CommunityPost[]>(STORAGE_KEYS.communityPosts, []);
    if (stored.length === 0) {
      writeLocal(STORAGE_KEYS.communityPosts, defaults);
      return defaults;
    }
    return stored;
  },

  async createCommunityPost(input: {
    user_id: string;
    author_name: string;
    author_role: UserRole;
    category: string;
    title: string;
    content: string;
  }): Promise<CommunityPost> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('community_posts')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const all = await this.listCommunityPosts();
    const item: CommunityPost = {
      ...input,
      id: `cpost-${Date.now()}`,
      likes_count: 0,
      created_at: new Date().toISOString(),
    };
    writeLocal(STORAGE_KEYS.communityPosts, [item, ...all]);
    return item;
  },

  async listMyLikedPostIds(userId: string): Promise<string[]> {
    if (!userId) return [];
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('community_post_likes')
        .select('post_id')
        .eq('user_id', userId);
      if (error) throw error;
      return (data ?? []).map((r) => r.post_id);
    }
    const map = readLocal<Record<string, string[]>>(STORAGE_KEYS.communityLikes, {});
    return map[userId] ?? [];
  },

  async likeCommunityPost(postId: string, userId: string): Promise<{ liked: boolean }> {
    if (!userId) throw new Error('Silakan masuk untuk mendukung topik.');
    if (isSupabaseConfigured && supabase) {
      const { data: existing } = await supabase
        .from('community_post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      const { data: post } = await supabase
        .from('community_posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      if (existing) {
        await supabase.from('community_post_likes').delete().eq('id', existing.id);
        if (post) {
          await supabase
            .from('community_posts')
            .update({ likes_count: Math.max(0, (post.likes_count ?? 0) - 1) })
            .eq('id', postId);
        }
        return { liked: false };
      }

      await supabase.from('community_post_likes').insert({ post_id: postId, user_id: userId });
      if (post) {
        await supabase
          .from('community_posts')
          .update({ likes_count: (post.likes_count ?? 0) + 1 })
          .eq('id', postId);
      }
      return { liked: true };
    }

    const likesMap = readLocal<Record<string, string[]>>(STORAGE_KEYS.communityLikes, {});
    const userLikes = likesMap[userId] ?? [];
    const alreadyLiked = userLikes.includes(postId);
    likesMap[userId] = alreadyLiked
      ? userLikes.filter((id) => id !== postId)
      : [...userLikes, postId];
    writeLocal(STORAGE_KEYS.communityLikes, likesMap);

    const all = await this.listCommunityPosts();
    writeLocal(
      STORAGE_KEYS.communityPosts,
      all.map((p) =>
        p.id === postId
          ? { ...p, likes_count: Math.max(0, p.likes_count + (alreadyLiked ? -1 : 1)) }
          : p
      )
    );
    return { liked: !alreadyLiked };
  },

  async deleteCommunityPost(postId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('community_posts').delete().eq('id', postId);
      if (error) throw error;
      return;
    }
    const all = await this.listCommunityPosts();
    writeLocal(
      STORAGE_KEYS.communityPosts,
      all.filter((p) => p.id !== postId)
    );
  },

  async listCommunityReplies(postId: string): Promise<CommunityReply[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('community_replies')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    }
    return readLocal<CommunityReply[]>(STORAGE_KEYS.communityReplies, []).filter(
      (r) => r.post_id === postId
    );
  },

  async addCommunityReply(input: {
    post_id: string;
    user_id: string;
    author_name: string;
    author_role: UserRole;
    content: string;
  }): Promise<CommunityReply> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('community_replies')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const all = readLocal<CommunityReply[]>(STORAGE_KEYS.communityReplies, []);
    const item: CommunityReply = {
      ...input,
      id: `crep-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    writeLocal(STORAGE_KEYS.communityReplies, [...all, item]);
    return item;
  },
};

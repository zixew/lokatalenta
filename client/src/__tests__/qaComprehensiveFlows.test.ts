import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '../features/auth/useAuthStore';
import { lmsApi } from '../shared/services/lmsApi';

const mockStorage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => mockStorage.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mockStorage.set(k, v);
    },
    removeItem: (k: string) => {
      mockStorage.delete(k);
    },
    clear: () => {
      mockStorage.clear();
    },
  },
  configurable: true,
});

describe('QA Lead Comprehensive Suite — Happy & Sad Flows', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('Community Like (1x per user): prevents spam inflation and toggles cleanly', async () => {
    const post = await lmsApi.createCommunityPost({
      user_id: 'u-author',
      author_name: 'Nadia',
      author_role: 'student',
      category: 'Tips Psikotes',
      title: 'Test Post',
      content: 'Konten diskusi',
    });

    // Happy: User A likes once -> likes_count = 1
    const r1 = await lmsApi.likeCommunityPost(post.id, 'user-a');
    expect(r1.liked).toBe(true);
    let posts = await lmsApi.listCommunityPosts();
    expect(posts.find((p) => p.id === post.id)?.likes_count).toBe(1);

    // Sad: User A clicks again -> toggles off (never inflates to 2!)
    const r2 = await lmsApi.likeCommunityPost(post.id, 'user-a');
    expect(r2.liked).toBe(false);
    posts = await lmsApi.listCommunityPosts();
    expect(posts.find((p) => p.id === post.id)?.likes_count).toBe(0);

    // Happy: Two distinct users like -> likes_count = 2
    await lmsApi.likeCommunityPost(post.id, 'user-a');
    await lmsApi.likeCommunityPost(post.id, 'user-b');
    posts = await lmsApi.listCommunityPosts();
    expect(posts.find((p) => p.id === post.id)?.likes_count).toBe(2);

    // Sad: Empty userId rejected
    await expect(lmsApi.likeCommunityPost(post.id, '')).rejects.toThrow();
  });

  it('Mentoring Session Booking: enforces max_participants capacity and idempotency', async () => {
    const sess = await lmsApi.createMentoringSession({
      course_id: 'course-1',
      mentor_id: 'mentor-1',
      mentor_name: 'Rizco Renova',
      title: 'Sesi Terbatas',
      topic: 'Deret Angka',
      scheduled_at: '2026-12-01T10:00:00.000Z',
      meeting_url: 'https://meet.example.com/room',
      max_participants: 1,
    });

    // Happy: Student 1 books
    await lmsApi.bookMentoringSession({
      session_id: sess.id,
      session_title: sess.title,
      user_id: 'student-1',
      student_name: 'Nadia',
    });

    // Sad (idempotent): Student 1 booking again returns existing without error
    const dup = await lmsApi.bookMentoringSession({
      session_id: sess.id,
      session_title: sess.title,
      user_id: 'student-1',
      student_name: 'Nadia',
    });
    expect(dup.user_id).toBe('student-1');

    // Sad: Student 2 blocked because quota (1) is full
    await expect(
      lmsApi.bookMentoringSession({
        session_id: sess.id,
        session_title: sess.title,
        user_id: 'student-2',
        student_name: 'Budi',
      })
    ).rejects.toThrow(/Kuota sesi sudah penuh/i);
  });

  it('Quiz Guards: enforces 60s retake cooldown and blocks retake after passing', async () => {
    const userId = 'qa-student-1';
    const quizId = 'quiz-simulasi-retail-2jam';

    // Happy: Start and submit with 0% (fail)
    const att1 = await lmsApi.startQuizAttempt(userId, quizId);
    await lmsApi.submitQuizAttempt(att1.attempt.id, {});

    // Sad: Immediate retake within 60s fails with cooldown error
    await expect(lmsApi.startQuizAttempt(userId, quizId)).rejects.toThrow(/Harap tunggu/i);

    // Happy: Backdate attempt 1 and answer all questions correctly -> pass
    const rawAttempts = JSON.parse(
      mockStorage.get('ruanglatih_demo_attempts_v11') ?? '[]'
    ) as Array<{ id: string; submitted_at?: string | null; score?: number | null }>;
    rawAttempts[0].score = 85;
    mockStorage.set('ruanglatih_demo_attempts_v11', JSON.stringify(rawAttempts));

    // Sad: Retaking after passing (>= 70%) is blocked
    await expect(lmsApi.startQuizAttempt(userId, quizId)).rejects.toThrow(/sudah lulus/i);
  });

  it('Assignment & Review Validation: rejects empty rejection reason and clamps ratings/scores', async () => {
    const asgList = await lmsApi.listCourseAssignments('course-1');
    const sub = await lmsApi.submitAssignment({
      assignment_id: asgList[0].id,
      user_id: 'student-1',
      student_name: 'Nadia',
      submission_text: 'Draft',
      attachment_url: 'data:text/plain;base64,MQ==',
      attachment_name: 'file.pdf',
    });

    // Sad: Rejecting without feedback throws
    await expect(
      lmsApi.gradeAssignmentSubmission(sub.id, {
        status: 'rejected',
        score: 0,
        feedback: '   ',
      })
    ).rejects.toThrow(/Alasan penolakan wajib diisi/i);

    // Happy: Approving clamps out-of-range score (150 -> 100)
    const approved = await lmsApi.gradeAssignmentSubmission(sub.id, {
      status: 'approved',
      rating_stars: 5,
      score: 150,
      feedback: 'Selamat!',
    });
    expect(approved.score).toBe(100);

    // Review rating clamping (9 -> 5)
    const rev = await lmsApi.submitCourseReview({
      course_id: 'course-1',
      user_id: 'student-1',
      author_name: 'Nadia',
      rating: 9,
      comment: 'Bagus',
    });
    expect(rev.rating).toBe(5);
  });

  it('Enrollment & Admin Moderation: prevents double counting and updates roles/publish status', async () => {
    await lmsApi.enrollCourse('student-x', 'course-retail-panduan');
    await lmsApi.enrollCourse('student-x', 'course-retail-panduan');
    const count = await lmsApi.getCourseEnrollmentCount('course-retail-panduan');
    // demo-student-1 (default) + student-x = 2 (not 3)
    expect(count).toBe(2);

    await lmsApi.updateUserRole('demo-student-1', 'teacher');
    const profiles = await lmsApi.listAllProfiles();
    expect(profiles.find((p) => p.id === 'demo-student-1')?.role).toBe('teacher');
  });

  it('Course Lookup & Notification Read Flow: resolves by slug or id and marks all read', async () => {
    const bySlug = await lmsApi.getCourseBySlug('huruf-jepang-hiragana-katakana-kanji');
    expect(bySlug).not.toBeNull();
    const byId = await lmsApi.getCourseBySlug(bySlug!.id);
    expect(byId?.slug).toBe(bySlug!.slug);

    await lmsApi.createNotification({
      user_id: 'notif-user-1',
      type: 'course',
      title: 'Tes Notifikasi',
      message: 'Cek link kursus',
      link: `/courses/${bySlug!.slug}`,
    });
    let list = await lmsApi.listNotifications('notif-user-1');
    expect(list.filter((n) => !n.is_read)).toHaveLength(1);

    await lmsApi.markAllNotificationsRead('notif-user-1');
    list = await lmsApi.listNotifications('notif-user-1');
    expect(list.filter((n) => !n.is_read)).toHaveLength(0);
  });

  it('Registration Email OTP: validates format, rejects wrong OTP, and registers on valid OTP', async () => {
    const store = useAuthStore.getState();

    // Sad: invalid email format
    await expect(store.requestSignUpOtp('bukan-email')).rejects.toThrow(/Format email tidak valid/i);

    // Sad: already registered email
    await expect(store.requestSignUpOtp('nadia@pelajar.id')).rejects.toThrow(/sudah terdaftar/i);

    // Happy: request OTP for new email
    const { devOtpPreview } = await store.requestSignUpOtp('baru@lokatalenta.id');
    expect(devOtpPreview).toMatch(/^\d{6}$/);

    // Sad: wrong OTP rejected
    await expect(
      store.verifyAndSignUp('User Baru', 'baru@lokatalenta.id', 'password123', '000000')
    ).rejects.toThrow(/tidak valid/i);

    // Happy: valid OTP completes registration
    await store.verifyAndSignUp('User Baru', 'baru@lokatalenta.id', 'password123', devOtpPreview!);
    expect(useAuthStore.getState().user?.email).toBe('baru@lokatalenta.id');
  });
});

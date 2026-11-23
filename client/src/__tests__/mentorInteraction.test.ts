import { beforeEach, describe, expect, it } from 'vitest';
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

describe('Student-Mentor Interaction Features', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('supports threaded Q&A replies and notifies the student when mentor replies', async () => {
    const q = await lmsApi.addLessonComment({
      lesson_id: 'les-1',
      user_id: 'student-1',
      author_name: 'Nadia',
      author_role: 'student',
      content: 'Bagaimana cara membedakan partikel wa dan ga?',
    });

    await lmsApi.addLessonComment({
      lesson_id: 'les-1',
      user_id: 'mentor-1',
      author_name: 'Rizky',
      author_role: 'teacher',
      content: 'Partikel wa menandai topik kalimat, sedangkan ga menandai subjek baru.',
      parent_id: q.id,
      is_mentor_answer: true,
      notify_user_id: q.user_id,
      course_slug: 'bahasa-jepang',
    });

    const comments = await lmsApi.listLessonComments('les-1');
    expect(comments).toHaveLength(2);
    expect(comments[1].parent_id).toBe(q.id);

    const notifs = await lmsApi.listNotifications('student-1');
    expect(notifs.some((n) => n.title.includes('Mentor Rizky menjawab'))).toBe(true);
  });

  it('supports 1-on-1 mentor chat, live session booking, and course announcements', async () => {
    await lmsApi.enrollCourse('student-1', 'course-1');

    // 1-on-1 chat
    await lmsApi.sendMentorMessage({
      course_id: 'course-1',
      course_slug: 'course-1-slug',
      student_id: 'student-1',
      mentor_id: 'mentor-1',
      sender_id: 'student-1',
      sender_name: 'Nadia',
      sender_role: 'student',
      message: 'Halo mentor, saya butuh tips persiapan tes.',
    });
    const chat = await lmsApi.listMentorMessages('course-1', 'student-1');
    expect(chat).toHaveLength(1);

    // Live session + booking
    const sess = await lmsApi.createMentoringSession({
      course_id: 'course-1',
      mentor_id: 'mentor-1',
      mentor_name: 'Rizky',
      title: 'Klinik Soal',
      topic: 'Deret Angka',
      scheduled_at: '2026-12-01T10:00:00.000Z',
      meeting_url: 'https://meet.example.com/abc',
      max_participants: 15,
    });
    await lmsApi.bookMentoringSession({
      session_id: sess.id,
      session_title: sess.title,
      user_id: 'student-1',
      student_name: 'Nadia',
      course_slug: 'course-1-slug',
    });
    const bookings = await lmsApi.listAllMentoringBookings();
    expect(bookings).toHaveLength(1);

    // Course announcement notifies enrolled student
    await lmsApi.createCourseAnnouncement({
      course_id: 'course-1',
      course_slug: 'course-1-slug',
      author_id: 'mentor-1',
      author_name: 'Rizky',
      title: 'Materi Baru Tersedia',
      content: 'Silakan cek modul terbaru.',
    });
    const studentNotifs = await lmsApi.listNotifications('student-1');
    expect(studentNotifs.some((n) => n.title.includes('Pengumuman Baru'))).toBe(true);
  });
});

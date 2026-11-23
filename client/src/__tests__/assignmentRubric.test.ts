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

describe('File-Upload Assignment with 1-5 Star Rubric & Approve/Reject Flow', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('provides 3-tab brief/guide/5-star rubric and supports reject -> re-upload -> approve', async () => {
    const assignments = await lmsApi.listCourseAssignments('course-test-1');
    expect(assignments.length).toBeGreaterThanOrEqual(1);
    const asg = assignments[0];
    expect(asg.requires_file).toBe(true);
    expect(asg.task_brief).toBeTruthy();
    expect(asg.how_to_guide).toBeTruthy();
    expect(asg.rubric).toHaveLength(5);

    // Student uploads initial file
    const sub1 = await lmsApi.submitAssignment({
      assignment_id: asg.id,
      user_id: 'student-1',
      student_name: 'Nadia',
      submission_text: 'Lampiran pertama',
      attachment_url: 'data:text/plain;base64,aGVsbG8=',
      attachment_name: 'tugas-v1.pdf',
    });
    expect(sub1.status).toBe('submitted');

    // Mentor rejects with reason
    const rejected = await lmsApi.gradeAssignmentSubmission(sub1.id, {
      status: 'rejected',
      score: 0,
      feedback: 'Halaman 2 terpotong, harap unggah ulang PDF yang jelas.',
      assignmentTitle: asg.title,
    });
    expect(rejected.status).toBe('rejected');

    const notifsAfterReject = await lmsApi.listNotifications('student-1');
    expect(notifsAfterReject[0].title).toContain('Ditolak');

    // Student re-uploads fixed file
    const sub2 = await lmsApi.submitAssignment({
      assignment_id: asg.id,
      user_id: 'student-1',
      student_name: 'Nadia',
      submission_text: 'Sudah diperbaiki',
      attachment_url: 'data:text/plain;base64,aGVsbG8tdjI=',
      attachment_name: 'tugas-v2.pdf',
    });
    expect(sub2.status).toBe('submitted');
    expect(sub2.attachment_name).toBe('tugas-v2.pdf');

    // Mentor approves with 5 stars and congratulation
    const approved = await lmsApi.gradeAssignmentSubmission(sub2.id, {
      status: 'approved',
      rating_stars: 5,
      score: 100,
      feedback: 'Selamat! File sangat rapi dan lengkap.',
      assignmentTitle: asg.title,
    });
    expect(approved.status).toBe('approved');
    expect(approved.rating_stars).toBe(5);

    const notifsAfterApprove = await lmsApi.listNotifications('student-1');
    expect(notifsAfterApprove[0].title).toContain('Selamat');
  });
});

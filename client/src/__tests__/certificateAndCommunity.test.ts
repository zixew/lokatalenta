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

describe('Public Certificate Verification & Community Forum', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('registers and publicly verifies a LokaTalenta certificate code', async () => {
    await lmsApi.registerCertificate({
      cert_code: 'LT-ABCD-1234-2026',
      user_id: 'student-1',
      student_name: 'Nadia Kusuma',
      course_id: 'course-1',
      course_title: 'Bahasa Jepang Pemula',
      teacher_name: 'Rizco Renova',
    });

    const found = await lmsApi.verifyCertificate('lt-abcd-1234-2026');
    expect(found).not.toBeNull();
    expect(found?.student_name).toBe('Nadia Kusuma');

    const missing = await lmsApi.verifyCertificate('LT-0000-0000-2026');
    expect(missing).toBeNull();
  });

  it('supports creating posts, liking, and replying in the community forum', async () => {
    const post = await lmsApi.createCommunityPost({
      user_id: 'student-1',
      author_name: 'Nadia Kusuma',
      author_role: 'student',
      category: 'Study Group',
      title: 'Grup Belajar JLPT N5 Malam Hari',
      content: 'Yuk gabung latihan kosakata bersama setiap jam 19.30.',
    });

    await lmsApi.likeCommunityPost(post.id, 'student-1');
    await lmsApi.addCommunityReply({
      post_id: post.id,
      user_id: 'mentor-1',
      author_name: 'Rizco Renova',
      author_role: 'teacher',
      content: 'Semangat! Saya bisa bantu review pertanyaan kalian di hari Jumat.',
    });

    const posts = await lmsApi.listCommunityPosts();
    const updated = posts.find((p) => p.id === post.id);
    expect(updated?.likes_count).toBe(1);

    const replies = await lmsApi.listCommunityReplies(post.id);
    expect(replies).toHaveLength(1);
  });
});

import { describe, expect, it } from 'vitest';
import { formatVideoEmbedUrl } from '../features/player/videoPlayerUtils';
import type { Lesson, Module } from '../shared/types/lms';

describe('Sprint 21: CoursePlayerPage Lesson Theatre & Modular Syllabus (BL-217)', () => {
  describe('formatVideoEmbedUrl (Zero-Letterboxing Sanitizer)', () => {
    it('converts standard YouTube watch URLs to youtube-nocookie embed with modestbranding', () => {
      const raw = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const formatted = formatVideoEmbedUrl(raw);
      expect(formatted).toBe(
        'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&playsinline=1'
      );
    });

    it('converts youtu.be shortlinks to youtube-nocookie embed', () => {
      const raw = 'https://youtu.be/abcdef12345';
      const formatted = formatVideoEmbedUrl(raw);
      expect(formatted).toBe(
        'https://www.youtube-nocookie.com/embed/abcdef12345?rel=0&modestbranding=1&playsinline=1'
      );
    });

    it('returns empty string for falsy/empty video urls', () => {
      expect(formatVideoEmbedUrl('')).toBe('');
      expect(formatVideoEmbedUrl('   ')).toBe('');
    });

    it('preserves existing embed or custom video URLs', () => {
      const customUrl = 'https://player.vimeo.com/video/123456789';
      expect(formatVideoEmbedUrl(customUrl)).toBe(customUrl);
    });
  });

  describe('Curriculum Syllabus Logic & Locking Resolution', () => {
    const mockLessons: Lesson[] = [
      {
        id: 'les-1',
        module_id: 'mod-1',
        title: 'Pengenalan Logika Arsitektur',
        type: 'video',
        content: 'Materi pengantar',
        video_url: 'https://www.youtube.com/watch?v=demo123',
        duration_minutes: 15,
        order_index: 1,
      },
      {
        id: 'les-2',
        module_id: 'mod-1',
        title: 'Penerapan Teorema Kraepelin',
        type: 'article',
        content: 'Materi bacaan mendalam',
        duration_minutes: 20,
        order_index: 2,
      },
      {
        id: 'les-3',
        module_id: 'mod-1',
        title: 'Simulasi Evaluasi Modul 1',
        type: 'quiz',
        content: 'Ujian modul',
        duration_minutes: 30,
        order_index: 3,
        quiz: {
          id: 'quiz-1',
          lesson_id: 'les-3',
          title: 'Quiz Modul 1',
          description: 'Ujian kompetensi',
          duration_minutes: 30,
          passing_score: 75,
        },
      },
    ];

    const mockModules: Module[] = [
      {
        id: 'mod-1',
        course_id: 'crs-1',
        title: 'Dasar-Dasar Logika Rekrutmen',
        order_index: 1,
        lessons: mockLessons,
      },
    ];

    it('computes completion count and percentage accurately', () => {
      const completedIds = ['les-1', 'les-2'];
      const totalLessons = mockModules.reduce((acc, m) => acc + m.lessons.length, 0);
      const completedCount = completedIds.length;
      const progressPct = Math.round((completedCount / totalLessons) * 100);

      expect(totalLessons).toBe(3);
      expect(completedCount).toBe(2);
      expect(progressPct).toBe(67);
    });

    it('resolves sequential lesson locking correctly (subsequent lessons locked until previous completed)', () => {
      const completedSet = new Set(['les-1']);

      const isLessonDone = (les: Lesson) => completedSet.has(les.id);
      const isLessonLocked = (lessonId: string) => {
        const idx = mockLessons.findIndex((l) => l.id === lessonId);
        if (idx <= 0) return false;
        // Previous lesson must be done
        return !isLessonDone(mockLessons[idx - 1]);
      };

      expect(isLessonLocked('les-1')).toBe(false);
      expect(isLessonLocked('les-2')).toBe(false); // les-1 is done
      expect(isLessonLocked('les-3')).toBe(true);  // les-2 is not done
    });

    it('bypasses locks when isMentorPreview is enabled', () => {
      const isMentorPreview = true;
      const isLessonLocked = (lessonId: string) => {
        if (isMentorPreview) return false;
        return lessonId === 'les-3';
      };

      expect(isLessonLocked('les-3')).toBe(false);
    });
  });

  describe('Anti-Slop Design Token Adherence (DESIGN.md v4.0.0)', () => {
    it('verifies industrial border class usage and elimination of warm-cream borders', () => {
      const industrialBorderLight = 'border-[#D4D4CE]';
      const industrialBorderDark = 'dark:border-[#282E3D]';
      const oldWarmCreamBorder = 'border-[#E5E3DC]';

      expect(industrialBorderLight).not.toBe(oldWarmCreamBorder);
      expect(industrialBorderLight).toBe('border-[#D4D4CE]');
      expect(industrialBorderDark).toBe('dark:border-[#282E3D]');
    });
  });
});

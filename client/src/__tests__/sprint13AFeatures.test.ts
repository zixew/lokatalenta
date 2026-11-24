import { beforeEach, describe, expect, it } from 'vitest';
import {
  createSystemBroadcast,
  dismissBroadcastId,
  filterActiveBroadcastsForRole,
  getDismissedBroadcastIds,
  listActiveBroadcasts,
  listAllBroadcasts,
  toggleSystemBroadcast,
  type SystemBroadcast,
} from '../features/admin/systemBroadcast';
import {
  evaluateShortAnswer,
  normalizeShortAnswer,
} from '../features/quiz-runner/shortAnswerEvaluator';
import {
  parseQuestionsCsv,
  SAMPLE_QUESTIONS_CSV_TEMPLATE,
} from '../features/teacher/csvQuestionParser';
import {
  computeStarCompleteness,
  STAR_INTERVIEW_SCENARIOS,
} from '../shared/data/starInterviewScenarios';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k: string) => store.get(k) ?? null,
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    removeItem: (k: string) => {
      store.delete(k);
    },
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };
}

describe('Sprint 13A Features (Short Answer, CSV Parser, System Broadcast, STAR Interview)', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: createMemoryStorage(),
      configurable: true,
    });
  });

  describe('evaluateShortAnswer & normalizeShortAnswer', () => {
    it('menormalisasi spasi berlebih dan mencocokkan jawaban secara case-insensitive', () => {
      expect(normalizeShortAnswer('  empat   puluh   dua \n ')).toBe('empat puluh dua');
      expect(evaluateShortAnswer('  Rp   150.000 ', ['rp 150.000', '150000'])).toBe(true);
      expect(evaluateShortAnswer('150000', ['rp 150.000', '150000'])).toBe(true);
    });

    it('mematuhi mode caseSensitive saat diaktifkan', () => {
      expect(evaluateShortAnswer('SUM(A1:A10)', ['sum(a1:a10)'], true)).toBe(false);
      expect(evaluateShortAnswer('SUM(A1:A10)', ['SUM(A1:A10)'], true)).toBe(true);
    });

    it('mengembalikan false untuk input kosong atau daftar acceptedAnswers kosong', () => {
      expect(evaluateShortAnswer('   ', ['42'])).toBe(false);
      expect(evaluateShortAnswer('42', [])).toBe(false);
      expect(evaluateShortAnswer('42', ['  '])).toBe(false);
    });
  });

  describe('csvQuestionParser dengan short_answer', () => {
    it('mem-parsing soal short_answer dengan kolom accepted_answers dipisahkan pipe (|)', () => {
      const csv = [
        'category_tag,question_text,option_a,option_b,option_c,option_d,option_e,correct_option,explanation,question_type,accepted_answers',
        'Numerik,"Berapa hasil 6 x 7?",,,,,,,"6 dikali 7 sama dengan 42.",short_answer,42|empat puluh dua',
      ].join('\n');

      const result = parseQuestionsCsv(csv);
      expect(result.errors).toEqual([]);
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0]).toMatchObject({
        category_tag: 'Numerik',
        question_text: 'Berapa hasil 6 x 7?',
        question_type: 'short_answer',
        accepted_answers: ['42', 'empat puluh dua'],
        options: [],
      });
    });

    it('melaporkan error jika short_answer tidak memiliki accepted_answers dan menolak tipe tidak valid', () => {
      const csv = [
        'category_tag,question_text,option_a,option_b,option_c,option_d,option_e,correct_option,explanation,question_type,accepted_answers',
        'Verbal,"Apa sinonim EPILOG?",,,,,,,"Penjelasan",short_answer,',
        'Verbal,"Soal tipe invalid",A,B,C,D,,A,"Penjelasan",essay,jawaban',
      ].join('\n');

      const result = parseQuestionsCsv(csv);
      expect(result.questions).toHaveLength(0);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('short_answer');
      expect(result.errors[1]).toContain('question_type');
    });

    it('tetap kompatibel 100% dengan template CSV 9-kolom MCQ', () => {
      const result = parseQuestionsCsv(SAMPLE_QUESTIONS_CSV_TEMPLATE);
      expect(result.errors).toEqual([]);
      expect(result.questions).toHaveLength(2);
      expect(result.questions[0].correct_option).toBe('B');
      expect(result.questions[1].correct_option).toBe('C');
    });
  });

  describe('systemBroadcast', () => {
    it('membuat, memfilter per role, menonaktifkan, dan mendismiss pengumuman global', async () => {
      const allUsersBroadcast = await createSystemBroadcast({
        title: 'Pemeliharaan Terjadwal',
        message: 'Sistem akan maintenance pukul 23:00 WIB.',
        severity: 'warning',
        target_role: 'all',
      });
      const teacherOnlyBroadcast = await createSystemBroadcast({
        title: 'Update Rubrik Mentor',
        message: 'Silakan tinjau panduan penilaian baru.',
        severity: 'info',
        target_role: 'teacher',
      });

      const all = await listAllBroadcasts();
      expect(all).toHaveLength(2);

      const studentActive = await listActiveBroadcasts('student');
      expect(studentActive.map((b) => b.id)).toEqual([allUsersBroadcast.id]);

      const teacherActive = await listActiveBroadcasts('teacher');
      expect(teacherActive).toHaveLength(2);

      await toggleSystemBroadcast(teacherOnlyBroadcast.id, false);
      const teacherAfterToggle = await listActiveBroadcasts('teacher');
      expect(teacherAfterToggle.map((b) => b.id)).toEqual([allUsersBroadcast.id]);

      dismissBroadcastId(allUsersBroadcast.id);
      dismissBroadcastId(allUsersBroadcast.id);
      expect(getDismissedBroadcastIds()).toEqual([allUsersBroadcast.id]);
    });

    it('memfilter broadcast kedaluwarsa dan memvalidasi judul/pesan wajib diisi', async () => {
      await expect(
        createSystemBroadcast({ title: '  ', message: 'Isi pesan' })
      ).rejects.toThrow();

      const items: SystemBroadcast[] = [
        {
          id: 'b-expired',
          title: 'Lama',
          message: 'Sudah lewat',
          severity: 'info',
          target_role: 'all',
          is_active: true,
          created_by: null,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() - 60_000).toISOString(),
        },
        {
          id: 'b-valid',
          title: 'Aktif',
          message: 'Masih berlaku',
          severity: 'urgent',
          target_role: 'student',
          is_active: true,
          created_by: null,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 60_000).toISOString(),
        },
      ];

      expect(filterActiveBroadcastsForRole(items, 'student').map((b) => b.id)).toEqual(['b-valid']);
      expect(filterActiveBroadcastsForRole(items, 'admin')).toEqual([]);
    });
  });

  describe('starInterviewScenarios & computeStarCompleteness', () => {
    it('menyediakan skenario STAR dengan struktur lengkap (tips, checklist, sampleOutline)', () => {
      expect(STAR_INTERVIEW_SCENARIOS.length).toBeGreaterThanOrEqual(4);
      for (const scenario of STAR_INTERVIEW_SCENARIOS) {
        expect(scenario.id).toBeTruthy();
        expect(scenario.title).toBeTruthy();
        expect(scenario.checklist.length).toBe(4);
        expect(scenario.sampleOutline.situation.length).toBeGreaterThan(20);
        expect(scenario.sampleOutline.task.length).toBeGreaterThan(20);
        expect(scenario.sampleOutline.action.length).toBeGreaterThan(20);
        expect(scenario.sampleOutline.result.length).toBeGreaterThan(20);
      }
    });

    it('menghitung skor kelengkapan STAR secara akurat untuk input kosong, parsial, dan lengkap', () => {
      const emptyResult = computeStarCompleteness({
        situation: '',
        task: '',
        action: '',
        result: '',
        checkedCount: 0,
        totalChecklist: 4,
      });
      expect(emptyResult).toEqual({ wordCount: 0, score: 0, filledSections: 0 });

      const sample = STAR_INTERVIEW_SCENARIOS[0].sampleOutline;
      const fullResult = computeStarCompleteness({
        situation: `${sample.situation} Tambahan konteks detail agar panjang mencukupi delapan puluh kata.`,
        task: `${sample.task} Tanggung jawab saya mencakup koordinasi lintas divisi secara langsung.`,
        action: `${sample.action} Saya juga membuat dokumen pelacakan progres harian untuk seluruh anggota tim.`,
        result: `${sample.result} Tingkat kepuasan stakeholder internal mencapai sembilan puluh lima persen.`,
        checkedCount: 4,
        totalChecklist: 4,
      });
      expect(fullResult.filledSections).toBe(4);
      expect(fullResult.wordCount).toBeGreaterThanOrEqual(80);
      expect(fullResult.score).toBe(100);
    });
  });
});

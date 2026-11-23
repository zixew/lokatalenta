import type { Course, QuizAttempt } from '../types/lms';
export { DEMO_PROFILES } from './demoProfiles';
import { buildExpandedCatalogCourses } from './catalogExpansion';
import { buildComprehensive50Questions } from './comprehensiveQuestions';
import { apply20ModulesToLanguageCourses } from './language20ModuleExpander';
import { LANGUAGE_COURSES } from './languageCourses';
import { expandCourseModulesWithMultiSlideLessons } from './moduleLessonExpander';
import { SCRIPT_COURSES } from './languageScriptAndModules';
import { applyQuestionBank2x } from './questionBank2x';
import { WORKPLACE_COURSES } from './workplaceCourses';

export const DEMO_COURSES: Course[] = applyQuestionBank2x(
  expandCourseModulesWithMultiSlideLessons([
  // =========================================================================
  // 1. KURSUS TERSTRUKTUR (Ala Coursera / Dicoding)
  // =========================================================================
  {
    id: 'course-retail-panduan',
    teacher_id: 'demo-teacher-1',
    teacher_name: 'Rizco Renova',
    title: 'Panduan Lengkap Psikotes Retail & Perusahaan Besar',
    slug: 'panduan-psikotes-retail-perusahaan-besar',
    description:
      'Pelajari pola tes seleksi pegawai yang biasa digunakan oleh Alfamart, Alfamidi, Indomaret, FamilyMart, dan perusahaan besar lainnya. Lengkap dengan materi strategi dan simulasi 2 jam.',
    category: 'Kursus Terstruktur',
    level: 'Semua Level',
    estimated_hours: 4.0,
    is_published: true,
    modules: [
      {
        id: 'mod-ret-1',
        course_id: 'course-retail-panduan',
        title: 'Modul 1: Peta Tes Seleksi Retail & Korporasi',
        order_index: 1,
        lessons: [
          {
            id: 'les-ret-1',
            module_id: 'mod-ret-1',
            title: 'Apa yang Diuji oleh Alfamart, Alfamidi, Indomaret & FamilyMart?',
            type: 'article',
            duration_minutes: 10,
            order_index: 1,
            content: `Dalam proses rekrutmen pegawai ritel modern (Kasir, Pramuniaga, Kepala Toko, hingga Staf Manajemen) maupun perusahaan besar lainnya, rangkaian psikotes umumnya berlangsung sekitar 90 hingga 120 menit (2 jam).

Materi yang hampir selalu muncul meliputi:
1. Matematika Kasir & Aritmatika Ritel: Menghitung diskon bertingkat, kembalian tunai, persentase laba/rugi, dan sisa stok barang secara cepat tanpa kalkulator.
2. Tes Ketelitian Data (Koreksi Angka & Kode SKU): Menguji kecepatan mata dan konsentrasi dalam mencocokkan deretan kode barang atau angka hampir mirip agar tidak terjadi kesalahan input di kasir/gudang.
3. Deret Angka: Mengukur logika pola urutan (bertambah bertingkat, pola lompat, atau perkalian).
4. Logika Gambar (Figural / Spasial): Menguji kemampuan membaca rotasi bentuk, penambahan elemen gambar, serta matriks pola 3×3.
5. Verbal, Penalaran Logis & Sikap Pelayanan: Mengukur pemahaman kosakata, kesimpulan logis, serta kesiapan melayani pelanggan dan bekerja dalam tim shift.`,
          },
          {
            id: 'les-ret-2',
            module_id: 'mod-ret-1',
            title: 'Trik Hitung Cepat Diskon, Kembalian & Ketelitian Kode',
            type: 'article',
            duration_minutes: 12,
            order_index: 2,
            content: `Saat menghadapi soal hitungan ritel dengan waktu terbatas, gunakan trik berikut:

• Diskon Bertingkat (misal 25% + 10%): Jangan dijumlahkan menjadi 35%! Hitung potongan pertama dulu, baru potongan kedua dihitung dari sisa harganya.
• Pembulatan Kembalian: Untuk menghitung kembalian dari Rp50.000 atau Rp100.000, hitung selisih menuju ribuan terdekat terlebih dahulu (misal belanja Rp20.500 → tambah 500 jadi 21.000 → tambah 29.000 jadi 50.000 → total kembalian Rp29.500).
• Ketelitian Kode Barang: Jangan membaca seluruh angka sekaligus. Bandingkan 3–4 karakter dari depan, lalu langsung lompat ke 3 karakter terakhir. Biasanya jebakan diletakkan pada dua angka yang tertukar di tengah atau belakang.`,
          },
          {
            id: 'les-ret-1-quiz',
            module_id: 'mod-ret-1',
            title: 'Latihan Modul 1: Matematika Kasir & Ketelitian Kode',
            type: 'quiz',
            duration_minutes: 10,
            order_index: 3,
            content:
              'Latihan ini menguji pemahaman Anda tentang materi Modul 1: diskon bertingkat, hitung kembalian ribuan terdekat, dan ketelitian membaca kode SKU.',
            quiz: {
              id: 'quiz-mod-ret-1',
              lesson_id: 'les-ret-1-quiz',
              title: 'Latihan Modul 1 — Matematika Kasir & Ketelitian',
              description:
                'Selesaikan latihan Modul 1 dengan skor minimal 70% untuk membuka Modul 2.',
              duration_minutes: 10,
              passing_score: 70,
              use_subtests: false,
              questions: buildComprehensive50Questions('quiz-mod-ret-1').slice(20, 23).concat(
                buildComprehensive50Questions('quiz-mod-ret-1').slice(40, 42)
              ).map((q, i) => ({ ...q, order_index: i + 1 })),
            },
          },
        ],
      },
      {
        id: 'mod-ret-2',
        course_id: 'course-retail-panduan',
        title: 'Modul 2: Strategi Logika Gambar & Sikap Kerja',
        order_index: 2,
        lessons: [
          {
            id: 'les-ret-3',
            module_id: 'mod-ret-2',
            title: 'Cara Membaca Pola Rotasi, Deret Bentuk & Matriks Gambar',
            type: 'article',
            duration_minutes: 10,
            order_index: 1,
            content: `Soal logika gambar sering terasa membingungkan jika dilihat secara keseluruhan sekaligus. Pecahlah menjadi 3 langkah pengecekan:

1. Cek Arah Putaran (Rotasi): Apakah elemen utama berputar 45° atau 90° searah jarum jam atau berlawanan?
2. Cek Jumlah Elemen: Hitung jumlah garis, sisi bangun (segitiga → segiempat → segilima), atau titik di dalamnya.
3. Cek Pola Baris & Kolom (Matriks 3×3): Biasanya tiap baris memiliki 1 bentuk yang sama dengan variasi isian (kosong, arsiran/penuh, dan kombinasi) yang bergantian di tiap kolom.`,
          },
          {
            id: 'les-ret-2-quiz',
            module_id: 'mod-ret-2',
            title: 'Latihan Modul 2: Logika Gambar & Penalaran',
            type: 'quiz',
            duration_minutes: 10,
            order_index: 2,
            content:
              'Latihan ini menguji pemahaman Anda tentang materi Modul 2: membaca pola rotasi, jumlah elemen bangun, dan matriks 3×3.',
            quiz: {
              id: 'quiz-mod-ret-2',
              lesson_id: 'les-ret-2-quiz',
              title: 'Latihan Modul 2 — Logika Gambar & Penalaran',
              description:
                'Selesaikan latihan Modul 2 dengan skor minimal 70% untuk membuka Modul 3.',
              duration_minutes: 10,
              passing_score: 70,
              use_subtests: false,
              questions: buildComprehensive50Questions('quiz-mod-ret-2')
                .slice(10, 15)
                .map((q, i) => ({ ...q, order_index: i + 1 })),
            },
          },
        ],
      },
      {
        id: 'mod-ret-3',
        course_id: 'course-retail-panduan',
        title: 'Modul 3: Evaluasi Akhir (Simulasi 2 Jam)',
        order_index: 3,
        lessons: [
          {
            id: 'les-ret-quiz',
            module_id: 'mod-ret-3',
            title: 'Evaluasi Akhir: Simulasi Psikotes Komprehensif (20 Soal • 2 Jam)',
            type: 'quiz',
            duration_minutes: 120,
            order_index: 1,
            content:
              'Uji kesiapan Anda dengan paket evaluasi komprehensif berdurasi 120 menit (2 jam) mencakup Matematika Kasir, Deret Angka, Ketelitian Data, Logika Gambar, Verbal, Penalaran Logis, dan Sikap Kerja.',
            quiz: {
              id: 'quiz-evaluasi-retail',
              lesson_id: 'les-ret-quiz',
              title: 'Evaluasi Akhir — Psikotes Retail & Korporasi (50 Soal • 5 Subtest)',
              description:
                'Terdiri dari 50 soal komprehensif dalam 5 subtest (Penalaran & Logika, Logika Gambar, Aritmatika, Deret Angka, dan Ketelitian & Verbal). Waktu pengerjaan 120 menit (2 jam).',
              duration_minutes: 120,
              passing_score: 70,
              questions: buildComprehensive50Questions('quiz-evaluasi-retail'),
            },
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 2. LATIHAN SOAL LANGSUNG (120 Menit / 2 Jam — Komprehensif)
  // =========================================================================
  {
    id: 'course-simulasi-retail-langsung',
    teacher_id: 'demo-teacher-1',
    teacher_name: 'Rizco Renova',
    title: 'Simulasi Psikotes Lengkap: Retail Modern & Perusahaan Besar',
    slug: 'simulasi-psikotes-retail-perusahaan-besar',
    description:
      'Latihan soal langsung berdurasi 2 jam (120 menit) dengan format tes seleksi Alfamart, Alfamidi, Indomaret, FamilyMart, dan korporasi besar: Logika Gambar, Deret Angka, Matematika Kasir, Ketelitian, Verbal & Sikap Kerja.',
    category: 'Latihan Langsung',
    level: 'Semua Level',
    estimated_hours: 2.0,
    is_published: true,
    modules: [
      {
        id: 'mod-sim-1',
        course_id: 'course-simulasi-retail-langsung',
        title: 'Paket Simulasi Utama',
        order_index: 1,
        lessons: [
          {
            id: 'les-sim-quiz',
            module_id: 'mod-sim-1',
            title: 'Tryout Psikotes Komprehensif (50 Soal • 5 Subtest • 120 Menit)',
            type: 'quiz',
            duration_minutes: 120,
            order_index: 1,
            content:
              'Simulasi komprehensif berdurasi 2 jam (120 menit) berisi 50 soal pilihan ganda dalam 5 subtest (10 soal per subtest).',
            quiz: {
              id: 'quiz-simulasi-retail-2jam',
              lesson_id: 'les-sim-quiz',
              title: 'Simulasi Psikotes Retail & Perusahaan Besar (50 Soal • 2 Jam)',
              description:
                '50 soal komprehensif (10 soal per subtest): Penalaran & Logika, Logika Gambar, Aritmatika, Deret Angka, serta Ketelitian & Verbal.',
              duration_minutes: 120,
              passing_score: 70,
              questions: buildComprehensive50Questions('quiz-simulasi-retail-2jam'),
            },
          },
        ],
      },
    ],
  },
  ...SCRIPT_COURSES,
  ...apply20ModulesToLanguageCourses(LANGUAGE_COURSES),
  ...WORKPLACE_COURSES,
  ...buildExpandedCatalogCourses(),
  ])
);

export const DEMO_INITIAL_ATTEMPTS: QuizAttempt[] = [];

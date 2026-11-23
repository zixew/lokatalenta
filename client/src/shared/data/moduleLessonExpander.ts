import type { Course, Lesson, Question, Quiz } from '../types/lms';

function buildModuleQuiz(
  course: Course,
  moduleTitle: string,
  modId: string,
  orderIndex: number
): Lesson {
  const quizId = `quiz-${modId}`;
  const isJa = course.category.toLowerCase().includes('jepang');
  const isKo = course.category.toLowerCase().includes('korea');
  const isEn = course.category.toLowerCase().includes('inggris');

  const tag = isJa
    ? 'Bahasa Jepang'
    : isKo
    ? 'Bahasa Korea'
    : isEn
    ? 'Bahasa Inggris'
    : course.category;

  const sampleQuestions: Question[] = [
    {
      id: `${quizId}-q1`,
      quiz_id: quizId,
      category_tag: tag,
      question_text: `Pada modul "${moduleTitle}", langkah pertama yang paling tepat sebelum mempraktikkan materi adalah ...`,
      options: [
        { key: 'A', text: 'Memahami konsep dasar, konteks penggunaan, dan pola intinya terlebih dahulu' },
        { key: 'B', text: 'Langsung menghafal tanpa membaca contoh penerapan' },
        { key: 'C', text: 'Melewatkan rangkuman dan aturan dasar' },
        { key: 'D', text: 'Mengabaikan kesalahan umum yang sering terjadi' },
        { key: 'E', text: 'Hanya membaca judul modul saja' },
      ],
      correct_option: 'A',
      explanation: `Penguasaan "${moduleTitle}" dimulai dari memahami konsep dasar, pola inti, dan contoh penerapannya.`,
      order_index: 1,
    },
    {
      id: `${quizId}-q2`,
      quiz_id: quizId,
      category_tag: tag,
      question_text: `Mengapa penting mempelajari bagian kesalahan umum pada "${moduleTitle}"?`,
      options: [
        { key: 'A', text: 'Agar dapat mengenali jebakan umum dan menghindari kesalahan berulang saat praktik' },
        { key: 'B', text: 'Karena materi konsep inti tidak diperlukan lagi' },
        { key: 'C', text: 'Supaya durasi belajar menjadi lebih lama tanpa hasil' },
        { key: 'D', text: 'Agar tidak perlu mengerjakan latihan soal' },
        { key: 'E', text: 'Karena rangkuman modul tidak berisi poin penting' },
      ],
      correct_option: 'A',
      explanation: 'Mengetahui kesalahan umum membantu pelajar lebih teliti dan percaya diri saat praktik nyata.',
      order_index: 2,
    },
    {
      id: `${quizId}-q3`,
      quiz_id: quizId,
      category_tag: tag,
      question_text: `Urutan belajar yang paling efektif pada modul "${moduleTitle}" sesuai alur pembelajaran terstruktur adalah ...`,
      options: [
        { key: 'A', text: 'Pelajari penjelasan bertahap → baca rangkuman modul → kerjakan latihan soal' },
        { key: 'B', text: 'Kerjakan latihan soal dulu baru membaca pengenalan' },
        { key: 'C', text: 'Hanya membaca rangkuman tanpa memahami contoh' },
        { key: 'D', text: 'Melewatkan seluruh materi dan langsung cetak sertifikat' },
        { key: 'E', text: 'Mempelajari bagian akhir tanpa memahami dasar' },
      ],
      correct_option: 'A',
      explanation: 'Alur terstruktur memastikan pemahaman konsep matang sebelum evaluasi.',
      order_index: 3,
    },
  ];

  const quiz: Quiz = {
    id: quizId,
    lesson_id: `les-${modId}-quiz`,
    title: `Latihan Modul: ${moduleTitle}`,
    description: `Evaluasi pemahaman materi dan rangkuman pada modul ${moduleTitle}.`,
    duration_minutes: 15,
    passing_score: 70,
    use_subtests: false,
    question_limit: 3,
    questions: sampleQuestions,
  };

  return {
    id: `les-${modId}-quiz`,
    module_id: modId,
    title: `Latihan Soal: ${moduleTitle}`,
    type: 'quiz',
    content: `Kerjakan latihan soal untuk mengukur pemahaman Anda setelah mempelajari penjelasan dan rangkuman "${moduleTitle}".`,
    duration_minutes: 15,
    order_index: orderIndex,
    quiz,
  };
}

/**
 * Ensures every structured course module contains at least 5 explanation parts/slides,
 * followed by a module summary ("Rangkuman Modul"), and then the module quiz ("Latihan Soal").
 */
export function expandCourseModulesWithMultiSlideLessons(courses: Course[]): Course[] {
  return courses.map((course) => {
    if (course.category === 'Latihan Langsung') return course;

    return {
      ...course,
      modules: (course.modules ?? []).map((mod) => {
        const existingLessons = [...(mod.lessons ?? [])].sort(
          (a, b) => a.order_index - b.order_index
        );
        const nonQuizLessons = existingLessons.filter((l) => l.type !== 'quiz');
        const quizLessons = existingLessons.filter((l) => l.type === 'quiz');

        // Keep existing non-quiz lessons if already >= 5, else expand to 5 detailed explanation parts
        const explanationParts: Lesson[] = [...nonQuizLessons];
        const baseLesson = nonQuizLessons[0];

        const slideTemplates = [
          {
            suffix: 'slide-1',
            title: `Bagian 1: Pengenalan & Konsep Dasar — ${mod.title}`,
            content:
              `Tujuan Pembelajaran:\n` +
              `Pada bagian pertama ini, Anda akan memahami fondasi utama dari "${mod.title}" dalam kursus "${course.title}".\n\n` +
              `Mengapa materi ini penting?\n` +
              `Pemahaman konsep dasar membantu Anda mengenali konteks penggunaan secara tepat sebelum masuk ke aturan teknis dan latihan soal.`,
          },
          {
            suffix: 'slide-2',
            title: `Bagian 2: Penjelasan Mendalam & Aturan Inti`,
            content:
              `Prinsip & Aturan Utama:\n` +
              `1. Pahami struktur inti yang membentuk materi "${mod.title}".\n` +
              `2. Perhatikan perbedaan fungsi antar elemen agar tidak tertukar saat praktik.\n` +
              `3. Hubungkan konsep baru ini dengan materi pada modul sebelumnya.\n\n` +
              `Catatan: Luangkan waktu sejenak untuk membaca ulang setiap poin sebelum lanjut ke bagian contoh.`,
          },
          {
            suffix: 'slide-3',
            title: `Bagian 3: Contoh Penerapan & Konteks Nyata`,
            content:
              `Contoh Kontekstual:\n` +
              `• Situasi 1 (Dasar): Penerapan langsung dalam skenario sehari-hari atau tugas standar.\n` +
              `• Situasi 2 (Menengah): Kombinasi pola dengan variasi kondisi di lapangan.\n\n` +
              `Dengan mempelajari contoh nyata, Anda dapat melihat bagaimana teori bekerja secara langsung.`,
          },
          {
            suffix: 'slide-4',
            title: `Bagian 4: Analisis Kesalahan Umum & Cara Menghindarinya`,
            content:
              `Hal yang Sering Keliru:\n` +
              `1. Terburu-buru menyimpulkan tanpa mengecek konteks kalimat atau data secara utuh.\n` +
              `2. Mengabaikan detail kecil (seperti partikel, angka, atau pengecualian aturan).\n\n` +
              `Tips Praktis:\n` +
              `Selalu lakukan pengecekan ulang 2 langkah sebelum menentukan jawaban akhir.`,
          },
          {
            suffix: 'slide-5',
            title: `Bagian 5: Studi Kasus & Pendalaman Praktik`,
            content:
              `Studi Kasus Terpadu:\n` +
              `Gabungkan seluruh konsep dari Bagian 1 hingga Bagian 4 untuk menganalisis kasus nyata pada topik "${mod.title}".\n\n` +
              `Latihan Mandiri:\n` +
              `Cobalah simulasikan atau catat poin kunci Anda di tab Catatan Pribadi sebelum melanjutkan ke Rangkuman Modul.`,
          },
        ];

        let partIdx = explanationParts.length;
        while (explanationParts.length < 5) {
          const tpl = slideTemplates[partIdx] ?? slideTemplates[slideTemplates.length - 1];
          explanationParts.push({
            id: `${mod.id}-${tpl.suffix}-${explanationParts.length + 1}`,
            module_id: mod.id,
            title: tpl.title,
            type: 'article',
            content:
              partIdx === 0 && baseLesson?.content
                ? `${baseLesson.content}\n\n${tpl.content}`
                : tpl.content,
            duration_minutes: 6,
            order_index: explanationParts.length + 1,
          });
          partIdx += 1;
        }

        // Ensure a dedicated Rangkuman Modul before the quiz
        const hasSummary = explanationParts.some((l) =>
          l.title.toLowerCase().includes('rangkuman')
        );
        if (!hasSummary) {
          explanationParts.push({
            id: `${mod.id}-rangkuman`,
            module_id: mod.id,
            title: `Rangkuman Modul: ${mod.title}`,
            type: 'article',
            content:
              `Ringkasan Poin Penting "${mod.title}":\n` +
              `1. Konsep Dasar: Memahami tujuan dan peran materi ini dalam keseluruhan kursus.\n` +
              `2. Aturan Inti: Menguasai pola dan struktur utama tanpa tertukar.\n` +
              `3. Contoh Penerapan: Mampu menerapkan materi pada konteks nyata.\n` +
              `4. Ketelitian: Mewaspadai kesalahan umum sebelum mengerjakan evaluasi.\n\n` +
              `Setelah memahami rangkuman ini, silakan lanjut ke Latihan Soal Modul di langkah berikutnya.`,
            duration_minutes: 4,
            order_index: explanationParts.length + 1,
          });
        }

        const finalQuizzes =
          quizLessons.length > 0
            ? quizLessons
            : [buildModuleQuiz(course, mod.title, mod.id, explanationParts.length + 1)];

        const reindexed = [...explanationParts, ...finalQuizzes].map((les, idx) => ({
          ...les,
          order_index: idx + 1,
        }));

        return {
          ...mod,
          lessons: reindexed,
        };
      }),
    };
  });
}

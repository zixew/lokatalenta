import type { Course, Question, VoiceLine } from '../types/lms';

function makeQ(
  quizId: string,
  items: Omit<Question, 'id' | 'quiz_id' | 'order_index'>[]
): Question[] {
  return items.map((q, idx) => ({
    ...q,
    id: `${quizId}-q${idx + 1}`,
    quiz_id: quizId,
    order_index: idx + 1,
  }));
}

function buildLanguageModuleQuiz(
  quizId: string,
  lessonId: string,
  title: string,
  description: string,
  questions: Omit<Question, 'id' | 'quiz_id' | 'order_index'>[]
) {
  return {
    id: quizId,
    lesson_id: lessonId,
    title,
    description,
    duration_minutes: 10,
    passing_score: 70,
    use_subtests: false,
    questions: makeQ(quizId, questions),
  };
}

export const LANGUAGE_COURSES: Course[] = [
  // =========================================================================
  // BAHASA JEPANG (Ref: Marugoto JF, Irodori, Minna no Nihongo, Genki)
  // =========================================================================
  {
    id: 'course-jp-pemula',
    teacher_id: 'demo-teacher-1',
    teacher_name: 'Rizco Renova',
    title: 'Bahasa Jepang Pemula (Starter A1 / N5) — Marugoto & Minna no Nihongo',
    slug: 'bahasa-jepang-pemula-a1',
    description:
      'Kursus terstruktur ala Japan Foundation (Can-Do & Katsudō/Rikai) untuk pemula mutlak: Hiragana, Katakana, perkenalan, waktu, belanja, dan aktivitas harian.',
    category: 'Bahasa Jepang',
    level: 'Pemula',
    estimated_hours: 4.5,
    is_published: true,
    modules: [
      {
        id: 'mod-jp1-1',
        course_id: 'course-jp-pemula',
        title: 'Modul 1: Aksara Hiragana, Katakana & Can-Do Perkenalan',
        order_index: 1,
        lessons: [
          {
            id: 'les-jp1-1',
            module_id: 'mod-jp1-1',
            title: 'Katsudō & Rikai: Hiragana, Katakana & Salam Sopan',
            type: 'video',
            video_url: 'https://www.youtube.com/embed/6p9Il_j0zjc',
            duration_minutes: 15,
            order_index: 1,
            content: `Target Can-Do (Standar JF): Saya dapat menyapa dengan sopan dan memperkenalkan nama serta asal saya dalam bahasa Jepang.

• Hiragana (ひらがな): Aksara asli bahasa Jepang (contoh: わたし = saya, よろしく = salam hormat).
• Katakana (カタカナ): Aksara khusus kata serapan asing & nama non-Jepang (contoh: インドネシア = Indonesia, コーヒー = kopi).
• Pola Perkenalan (Minna no Nihongo Bab 1):
  [Nama] は (wa) [Profesi/Asal] です (desu).`,
            voice_lines: [
              {
                text: 'おはようございます。はじめまして。',
                romaji: 'Ohayō gozaimasu. Hajimemashite.',
                translation: 'Selamat pagi. Perkenalkan.',
                lang: 'ja-JP',
              },
              {
                text: 'わたしはナディアです。インドネシアからきました。',
                romaji: 'Watashi wa Nadia desu. Indonesia kara kimashita.',
                translation: 'Saya Nadia. Saya berasal dari Indonesia.',
                lang: 'ja-JP',
              },
              {
                text: 'どうぞよろしくお願いします。',
                romaji: 'Dōzo yoroshiku onegaishimasu.',
                translation: 'Senang berkenalan dengan Anda.',
                lang: 'ja-JP',
              },
            ] satisfies VoiceLine[],
          },
          {
            id: 'les-jp1-1q',
            module_id: 'mod-jp1-1',
            title: 'Latihan Modul 1: Aksara & Perkenalan',
            type: 'quiz',
            duration_minutes: 10,
            order_index: 2,
            content: 'Uji penguasaan Hiragana, Katakana, dan pola perkenalan dasar.',
            quiz: buildLanguageModuleQuiz(
              'quiz-jp1-m1',
              'les-jp1-1q',
              'Latihan Modul 1 — Bahasa Jepang A1',
              'Capai skor minimal 70% untuk melanjutkan ke Modul 2.',
              [
                {
                  category_tag: 'Bahasa Jepang A1',
                  question_text: 'Aksara Jepang manakah yang dipakai untuk menulis kata "Indonesia" (インドネシア)?',
                  options: [
                    { key: 'A', text: 'Hiragana' },
                    { key: 'B', text: 'Katakana' },
                    { key: 'C', text: 'Kanji' },
                    { key: 'D', text: 'Hangeul' },
                    { key: 'E', text: 'Romaji' },
                  ],
                  correct_option: 'B',
                  explanation: 'Katakana digunakan untuk menulis nama negara dan kata serapan asing.',
                },
                {
                  category_tag: 'Bahasa Jepang A1',
                  question_text: 'Arti dari ungkapan "Indonesia kara kimashita" adalah...',
                  options: [
                    { key: 'A', text: 'Saya tinggal di Tokyo.' },
                    { key: 'B', text: 'Saya berasal dari Indonesia.' },
                    { key: 'C', text: 'Saya suka kopi Indonesia.' },
                    { key: 'D', text: 'Saya mau pergi ke Indonesia.' },
                    { key: 'E', text: 'Saya seorang guru.' },
                  ],
                  correct_option: 'B',
                  explanation: '[Negara] + kara kimashita berarti "datang/berasal dari [Negara]".',
                },
              ]
            ),
          },
        ],
      },
      {
        id: 'mod-jp1-2',
        course_id: 'course-jp-pemula',
        title: 'Modul 2: Can-Do Belanja, Harga & Restoran',
        order_index: 2,
        lessons: [
          {
            id: 'les-jp1-2',
            module_id: 'mod-jp1-2',
            title: 'Menanyakan Harga (Ikura) & Memesan Makanan (Kudasai)',
            type: 'article',
            duration_minutes: 15,
            order_index: 1,
            content: `Target Can-Do (Irodori Starter): Saya dapat menanyakan harga barang dan memesan makanan/minuman sederhana di toko atau restoran.

• Menunjuk benda: これ (kore = ini), それ (sore = itu dekat lawan), あれ (are = itu jauh).
• Menanyakan harga: これは いくら ですか (Kore wa ikura desu ka).
• Memesan/meminta: [Menu/Barang] を ください (o kudasai).`,
            voice_lines: [
              {
                text: 'すみません、これはいくらですか。',
                romaji: 'Sumimasen, kore wa ikura desu ka.',
                translation: 'Permisi, ini harganya berapa?',
                lang: 'ja-JP',
              },
              {
                text: 'これをふたつください。',
                romaji: 'Kore o futatsu kudasai.',
                translation: 'Tolong berikan ini dua buah.',
                lang: 'ja-JP',
              },
            ],
          },
          {
            id: 'les-jp1-2q',
            module_id: 'mod-jp1-2',
            title: 'Latihan Modul 2: Belanja & Restoran',
            type: 'quiz',
            duration_minutes: 10,
            order_index: 2,
            content: 'Uji kemampuan menanyakan harga dan memesan dalam bahasa Jepang.',
            quiz: buildLanguageModuleQuiz(
              'quiz-jp1-m2',
              'les-jp1-2q',
              'Latihan Modul 2 — Belanja & Restoran',
              'Capai skor minimal 70% untuk membuka Modul 3.',
              [
                {
                  category_tag: 'Bahasa Jepang A1',
                  question_text: 'Dengarkan audio percakapan berikut! Apa yang sebenarnya diminta oleh pembicara?',
                  audio_text: 'すみません、これをふたつください。',
                  audio_lang: 'ja-JP',
                  options: [
                    { key: 'A', text: 'Meminta dua buah barang ini' },
                    { key: 'B', text: 'Menanyakan harga barang' },
                    { key: 'C', text: 'Mengucapkan selamat pagi' },
                    { key: 'D', text: 'Menanyakan lokasi stasiun' },
                    { key: 'E', text: 'Meminta segelas air' },
                  ],
                  correct_option: 'A',
                  explanation: 'Audio berbunyi "Sumimasen, kore o futatsu kudasai" (Permisi, tolong berikan ini dua buah).',
                },
                {
                  category_tag: 'Bahasa Jepang A1',
                  question_text: 'Kata tunjuk untuk benda yang berada dekat dengan pembicara ("ini") adalah...',
                  options: [
                    { key: 'A', text: 'kore (これ)' },
                    { key: 'B', text: 'sore (それ)' },
                    { key: 'C', text: 'are (あれ)' },
                    { key: 'D', text: 'dore (どれ)' },
                    { key: 'E', text: 'doko (どこ)' },
                  ],
                  correct_option: 'A',
                  explanation: 'Kore = ini (dekat pembicara), Sore = itu (dekat pendengar), Are = itu (jauh).',
                },
                {
                  category_tag: 'Bahasa Jepang A1',
                  question_text: 'Kalimat "Mizu o kudasai" artinya...',
                  options: [
                    { key: 'A', text: 'Airnya tidak ada.' },
                    { key: 'B', text: 'Tolong berikan air.' },
                    { key: 'C', text: 'Airnya mahal.' },
                    { key: 'D', text: 'Di mana airnya?' },
                    { key: 'E', text: 'Saya tidak minum air.' },
                  ],
                  correct_option: 'B',
                  explanation: '[Objek] o kudasai digunakan untuk memesan atau meminta barang.',
                },
              ]
            ),
          },
        ],
      },
      {
        id: 'mod-jp1-3',
        course_id: 'course-jp-pemula',
        title: 'Modul 3: Aktivitas Harian (~masu) & Evaluasi A1',
        order_index: 3,
        lessons: [
          {
            id: 'les-jp1-3',
            module_id: 'mod-jp1-3',
            title: 'Bentuk ~masu / ~masen / ~mashita & Ajakan (~masen ka)',
            type: 'article',
            duration_minutes: 15,
            order_index: 1,
            content: `Target Can-Do: Saya dapat menceritakan kegiatan sehari-hari dan mengajak teman dengan sopan.
• Positif: ~ます (~masu)  |  Negatif: ~ません (~masen)
• Lampau: ~ました (~mashita)  |  Ajakan sopan: ~ませんか (~masen ka)`,
            voice_lines: [
              {
                text: 'まいにち七時におきます。',
                romaji: 'Mainichi shichiji ni okimasu.',
                translation: 'Setiap hari saya bangun pukul 7.',
                lang: 'ja-JP',
              },
              {
                text: 'いっしょにひるごはんをたべませんか。',
                romaji: 'Issho ni hirugohan o tabemasen ka.',
                translation: 'Maukah makan siang bersama?',
                lang: 'ja-JP',
              },
            ],
          },
          {
            id: 'les-jp1-final',
            module_id: 'mod-jp1-3',
            title: 'Evaluasi Akhir Level Pemula (A1)',
            type: 'quiz',
            duration_minutes: 15,
            order_index: 2,
            content: 'Evaluasi kelulusan Bahasa Jepang Level Pemula (A1).',
            quiz: buildLanguageModuleQuiz(
              'quiz-jp1-final',
              'les-jp1-final',
              'Evaluasi Akhir — Bahasa Jepang A1',
              'Capai skor minimal 70% untuk mendapatkan sertifikat Level A1.',
              [
                {
                  category_tag: 'Bahasa Jepang A1',
                  question_text: 'Bentuk lampau dari "tabemasu" (makan) adalah...',
                  options: [
                    { key: 'A', text: 'tabemasen' },
                    { key: 'B', text: 'tabemashita' },
                    { key: 'C', text: 'tabemashō' },
                    { key: 'D', text: 'tabetai' },
                    { key: 'E', text: 'taberu' },
                  ],
                  correct_option: 'B',
                  explanation: '~masu berubah menjadi ~mashita untuk menyatakan kejadian lampau.',
                },
                {
                  category_tag: 'Bahasa Jepang A1',
                  question_text: 'Partikel waktu yang digunakan setelah jam ("shichiji ___ okimasu") adalah...',
                  options: [
                    { key: 'A', text: 'ni (に)' },
                    { key: 'B', text: 'o (を)' },
                    { key: 'C', text: 'ka (か)' },
                    { key: 'D', text: 'no (の)' },
                    { key: 'E', text: 'e (へ)' },
                  ],
                  correct_option: 'A',
                  explanation: 'Partikel に (ni) dipakai setelah penanda waktu spesifik seperti jam.',
                },
              ]
            ),
          },
        ],
      },
    ],
  },

  {
    id: 'course-jp-menengah',
    teacher_id: 'demo-teacher-1',
    teacher_name: 'Rizco Renova',
    title: 'Bahasa Jepang Menengah (Elementary A2 / N4) — Irodori & Genki II',
    slug: 'bahasa-jepang-menengah-a2',
    description:
      'Tingkatkan kemampuan percakapan ke level A2/N4: kata kerja bentuk ~te (meminta tolong & izin), bentuk kamus, rencana, serta menceritakan pengalaman.',
    category: 'Bahasa Jepang',
    level: 'Menengah',
    estimated_hours: 5.0,
    is_published: true,
    modules: [
      {
        id: 'mod-jp2-1',
        course_id: 'course-jp-menengah',
        title: 'Modul 1: Kata Kerja Bentuk ~te (Permintaan & Izin)',
        order_index: 1,
        lessons: [
          {
            id: 'les-jp2-1',
            module_id: 'mod-jp2-1',
            title: 'Pola ~te kudasai, ~te mo ii desu ka & ~te wa ikemasen',
            type: 'article',
            duration_minutes: 15,
            order_index: 1,
            content: `Target Can-Do (Marugoto A2): Saya dapat meminta tolong secara sopan, meminta izin, dan memahami aturan/larangan.
• Meminta tolong: [Bentuk ~te] + ください (kudasai) — Contoh: ちょっと まって ください (Chotto matte kudasai = Tolong tunggu sebentar).
• Meminta izin: ~ても いいですか (~te mo ii desu ka) — Contoh: しゃしんを とっても いいですか (Bolehkah saya mengambil foto?).
• Larangan: ~ては いけません (~te wa ikemasen) — Tidak boleh melakukan...`,
            voice_lines: [
              {
                text: 'すみません、ちょっと待ってください。',
                romaji: 'Sumimasen, chotto matte kudasai.',
                translation: 'Maaf, tolong tunggu sebentar.',
                lang: 'ja-JP',
              },
              {
                text: 'ここで写真をとってもいいですか。',
                romaji: 'Koko de shashin o totte mo ii desu ka.',
                translation: 'Bolehkah mengambil foto di sini?',
                lang: 'ja-JP',
              },
            ],
          },
          {
            id: 'les-jp2-1q',
            module_id: 'mod-jp2-1',
            title: 'Latihan Modul 1: Bentuk ~te & Aturan',
            type: 'quiz',
            duration_minutes: 10,
            order_index: 2,
            content: 'Uji penggunaan bentuk ~te untuk meminta tolong dan izin.',
            quiz: buildLanguageModuleQuiz(
              'quiz-jp2-m1',
              'les-jp2-1q',
              'Latihan Modul 1 — Bentuk ~te',
              'Capai skor minimal 70% untuk membuka Modul 2.',
              [
                {
                  category_tag: 'Bahasa Jepang A2',
                  question_text: 'Pola kalimat yang digunakan untuk meminta izin ("Bolehkah saya...?") adalah...',
                  options: [
                    { key: 'A', text: '~te mo ii desu ka' },
                    { key: 'B', text: '~te wa ikemasen' },
                    { key: 'C', text: '~masen ka' },
                    { key: 'D', text: '~ta koto ga arimasu' },
                    { key: 'E', text: '~deshō' },
                  ],
                  correct_option: 'A',
                  explanation: '[Kata kerja ~te] + mo ii desu ka berarti "Bolehkah...?".',
                },
                {
                  category_tag: 'Bahasa Jepang A2',
                  question_text: 'Arti dari kalimat "Koko de tabete wa ikemasen" adalah...',
                  options: [
                    { key: 'A', text: 'Silakan makan di sini.' },
                    { key: 'B', text: 'Tidak boleh makan di sini.' },
                    { key: 'C', text: 'Saya sudah makan di sini.' },
                    { key: 'D', text: 'Ayo makan di sini.' },
                    { key: 'E', text: 'Saya ingin makan di sini.' },
                  ],
                  correct_option: 'B',
                  explanation: '~te wa ikemasen menyatakan larangan ("Tidak boleh...").',
                },
              ]
            ),
          },
        ],
      },
      {
        id: 'mod-jp2-2',
        course_id: 'course-jp-menengah',
        title: 'Modul 2: Pengalaman (~ta koto ga arimasu) & Evaluasi A2',
        order_index: 2,
        lessons: [
          {
            id: 'les-jp2-2',
            module_id: 'mod-jp2-2',
            title: 'Menceritakan Pengalaman & Rencana (~tsumori desu)',
            type: 'article',
            duration_minutes: 15,
            order_index: 1,
            content: `• Pengalaman: [Bentuk ~ta] + ことがあります (koto ga arimasu) = Pernah melakukan...
• Rencana: [Bentuk Kamus] + つもりです (tsumori desu) = Berencana melakukan...`,
            voice_lines: [
              {
                text: '日本へ行ったことがあります。',
                romaji: 'Nihon e itta koto ga arimasu.',
                translation: 'Saya pernah pergi ke Jepang.',
                lang: 'ja-JP',
              },
            ],
          },
          {
            id: 'les-jp2-final',
            module_id: 'mod-jp2-2',
            title: 'Evaluasi Akhir Level Menengah (A2)',
            type: 'quiz',
            duration_minutes: 15,
            order_index: 2,
            content: 'Evaluasi akhir Bahasa Jepang Level Menengah (A2 / N4).',
            quiz: buildLanguageModuleQuiz(
              'quiz-jp2-final',
              'les-jp2-final',
              'Evaluasi Akhir — Bahasa Jepang A2',
              'Capai skor minimal 70% untuk lulus Level A2.',
              [
                {
                  category_tag: 'Bahasa Jepang A2',
                  question_text: 'Pola kalimat untuk menyatakan pengalaman ("pernah melakukan sesuatu") adalah...',
                  options: [
                    { key: 'A', text: '~ta koto ga arimasu' },
                    { key: 'B', text: '~te kudasai' },
                    { key: 'C', text: '~masen deshita' },
                    { key: 'D', text: '~nakereba narimasen' },
                    { key: 'E', text: '~ka dō ka' },
                  ],
                  correct_option: 'A',
                  explanation: '[Kata kerja bentuk ~ta] + koto ga arimasu menyatakan pengalaman.',
                },
                {
                  category_tag: 'Bahasa Jepang A2',
                  question_text: 'Jika Anda berencana bekerja di Tokyo tahun depan, pola akhirannya adalah...',
                  options: [
                    { key: 'A', text: '~tsumori desu' },
                    { key: 'B', text: '~te wa ikemasen' },
                    { key: 'C', text: '~ta koto ga arimasen' },
                    { key: 'D', text: '~mashita' },
                    { key: 'E', text: '~naide kudasai' },
                  ],
                  correct_option: 'A',
                  explanation: '[Bentuk kamus] + tsumori desu menyatakan rencana/niat.',
                },
              ]
            ),
          },
        ],
      },
    ],
  },

  {
    id: 'course-jp-lanjutan',
    teacher_id: 'demo-teacher-1',
    teacher_name: 'Rizco Renova',
    title: 'Bahasa Jepang Lanjutan (Intermediate B1–Mahir / N3) — Keigo & Bisnis',
    slug: 'bahasa-jepang-lanjutan-b1',
    description:
      'Kuasai bentuk biasa (Futsuukei), menyampaikan opini (~to omoimasu), pengandaian (~tara), dan bahasa sopan bisnis Jepang (Keigo: Sonkeigo & Kenjōgo).',
    category: 'Bahasa Jepang',
    level: 'Lanjutan',
    estimated_hours: 6.0,
    is_published: true,
    modules: [
      {
        id: 'mod-jp3-1',
        course_id: 'course-jp-lanjutan',
        title: 'Modul 1: Bahasa Sopan Bisnis (Keigo) & Pengandaian',
        order_index: 1,
        lessons: [
          {
            id: 'les-jp3-1',
            module_id: 'mod-jp3-1',
            title: 'Membedakan Sonkeigo (Meninggikan Lawan) & Kenjōgo (Merendahkan Diri)',
            type: 'article',
            duration_minutes: 15,
            order_index: 1,
            content: `Di lingkungan kerja Jepang (N3+), penggunaan Keigo sangat penting saat berbicara dengan atasan atau klien:
• Sonkeigo (尊敬語): Meninggikan tindakan atasan/tamu (contoh: irassharu = ada/pergi/datang, meshiagaru = makan/minum).
• Kenjōgo (謙譲語): Merendahkan tindakan diri sendiri terhadap atasan/tamu (contoh: mairu = pergi/datang, itadaku = makan/menerima).`,
            voice_lines: [
              {
                text: '社長、ただいま参ります。',
                romaji: 'Shachō, tadaima mairimasu.',
                translation: 'Pak Direktur, saya segera datang.',
                lang: 'ja-JP',
              },
              {
                text: 'ご確認いただけますでしょうか。',
                romaji: 'Gokakunin itadakemasu deshō ka.',
                translation: 'Bisakah Anda berkenan memeriksanya?',
                lang: 'ja-JP',
              },
            ],
          },
          {
            id: 'les-jp3-final',
            module_id: 'mod-jp3-1',
            title: 'Evaluasi Akhir Level Lanjutan (B1 / N3)',
            type: 'quiz',
            duration_minutes: 15,
            order_index: 2,
            content: 'Evaluasi penguasaan Keigo dan komunikasi bisnis Jepang.',
            quiz: buildLanguageModuleQuiz(
              'quiz-jp3-final',
              'les-jp3-final',
              'Evaluasi Akhir — Bahasa Jepang Lanjutan',
              'Capai skor minimal 70% untuk lulus Level Lanjutan.',
              [
                {
                  category_tag: 'Bahasa Jepang B1',
                  question_text: 'Jenis Keigo yang digunakan untuk merendahkan tindakan diri sendiri saat berbicara kepada atasan atau klien adalah...',
                  options: [
                    { key: 'A', text: 'Sonkeigo' },
                    { key: 'B', text: 'Kenjōgo' },
                    { key: 'C', text: 'Futsuukei' },
                    { key: 'D', text: 'Katakana' },
                    { key: 'E', text: 'Romaji' },
                  ],
                  correct_option: 'B',
                  explanation: 'Kenjōgo merendahkan tindakan pembicara sebagai bentuk penghormatan.',
                },
                {
                  category_tag: 'Bahasa Jepang B1',
                  question_text: 'Ungkapan sopan bisnis "Gokakunin itadakemasu deshō ka" digunakan untuk...',
                  options: [
                    { key: 'A', text: 'Meminta atasan/klien berkenan memeriksa dokumen' },
                    { key: 'B', text: 'Menolak pekerjaan lembur' },
                    { key: 'C', text: 'Mengucapkan selamat ulang tahun' },
                    { key: 'D', text: 'Memesan makanan di kantin' },
                    { key: 'E', text: 'Menanyakan arah stasiun' },
                  ],
                  correct_option: 'A',
                  explanation: '"Kakunin" berarti konfirmasi/periksa; "itadakemasu deshō ka" adalah permohonan sangat sopan.',
                },
              ]
            ),
          },
        ],
      },
    ],
  },

  // =========================================================================
  // BAHASA INGGRIS (Ref: Oxford English File, Cambridge Interchange, Murphy)
  // =========================================================================
  {
    id: 'course-en-pemula',
    teacher_id: 'demo-teacher-1',
    teacher_name: 'Rizco Renova',
    title: 'Bahasa Inggris Pemula (Starter A1) — Oxford English File',
    slug: 'bahasa-inggris-pemula-a1',
    description:
      'Mulai belajar bahasa Inggris dari nol: To Be (am/is/are), Simple Present, angka, arah jalan, dan percakapan perkenalan sehari-hari lengkap dengan video & audio.',
    category: 'Bahasa Inggris',
    level: 'Pemula',
    estimated_hours: 4.0,
    is_published: true,
    modules: [
      {
        id: 'mod-en1-1',
        course_id: 'course-en-pemula',
        title: 'Modul 1: To Be, Simple Present & Perkenalan',
        order_index: 1,
        lessons: [
          {
            id: 'les-en1-1',
            module_id: 'mod-en1-1',
            title: 'Fondasi To Be (am/is/are) & Rutinitas Harian',
            type: 'video',
            video_url: 'https://www.youtube.com/embed/L9AWrJnhsRI',
            duration_minutes: 15,
            order_index: 1,
            content: `• Verb To Be: I am, You/We/They are, He/She/It is.
• Simple Present: Gunakan Verb 1 (tambahkan -s/-es untuk He/She/It).`,
            voice_lines: [
              {
                text: 'Hello, my name is Nadia. I am from Indonesia.',
                translation: 'Halo, nama saya Nadia. Saya berasal dari Indonesia.',
                lang: 'en-US',
              },
              {
                text: 'I wake up at six o’clock every morning.',
                translation: 'Saya bangun pukul enam setiap pagi.',
                lang: 'en-US',
              },
            ],
          },
          {
            id: 'les-en1-final',
            module_id: 'mod-en1-1',
            title: 'Evaluasi Level Pemula (A1)',
            type: 'quiz',
            duration_minutes: 10,
            order_index: 2,
            content: 'Uji pemahaman To Be dan Simple Present.',
            quiz: buildLanguageModuleQuiz(
              'quiz-en1-final',
              'les-en1-final',
              'Evaluasi Akhir — Bahasa Inggris A1',
              'Capai skor minimal 70% untuk lulus Level A1.',
              [
                {
                  category_tag: 'Bahasa Inggris A1',
                  question_text: 'Dengarkan audio berikut! Di manakah pembicara bekerja?',
                  audio_text: 'Hello, my name is Nadia. I work at a retail store in Jakarta.',
                  audio_lang: 'en-US',
                  options: [
                    { key: 'A', text: 'Di sebuah toko ritel di Jakarta' },
                    { key: 'B', text: 'Di sebuah rumah sakit di Bandung' },
                    { key: 'C', text: 'Di sebuah sekolah di Surabaya' },
                    { key: 'D', text: 'Di sebuah restoran di Bali' },
                    { key: 'E', text: 'Di sebuah bank di Medan' },
                  ],
                  correct_option: 'A',
                  explanation: 'Audio menyebutkan "I work at a retail store in Jakarta."',
                },
                {
                  category_tag: 'Bahasa Inggris A1',
                  question_text: '"She ___ a store manager at a retail company."',
                  options: [
                    { key: 'A', text: 'am' },
                    { key: 'B', text: 'is' },
                    { key: 'C', text: 'are' },
                    { key: 'D', text: 'do' },
                    { key: 'E', text: 'be' },
                  ],
                  correct_option: 'B',
                  explanation: 'Subjek tunggal "She" berpasangan dengan "is".',
                },
                {
                  category_tag: 'Bahasa Inggris A1',
                  question_text: '"___ you speak English?"',
                  options: [
                    { key: 'A', text: 'Does' },
                    { key: 'B', text: 'Is' },
                    { key: 'C', text: 'Do' },
                    { key: 'D', text: 'Are' },
                    { key: 'E', text: 'Has' },
                  ],
                  correct_option: 'C',
                  explanation: 'Subjek "you" dengan kata kerja utama "speak" menggunakan Do.',
                },
              ]
            ),
          },
        ],
      },
    ],
  },

  {
    id: 'course-en-menengah',
    teacher_id: 'demo-teacher-1',
    teacher_name: 'Rizco Renova',
    title: 'Bahasa Inggris Menengah (Elementary–Pre-Int A2/B1) — Interchange',
    slug: 'bahasa-inggris-menengah-a2-b1',
    description:
      'Kuasai Simple Past, Future (Will/Going to), Present Perfect, dan percakapan sehari-hari di restoran, bandara, dan kantor.',
    category: 'Bahasa Inggris',
    level: 'Menengah',
    estimated_hours: 5.0,
    is_published: true,
    modules: [
      {
        id: 'mod-en2-1',
        course_id: 'course-en-menengah',
        title: 'Modul 1: Past Tense, Future & Percakapan Harian',
        order_index: 1,
        lessons: [
          {
            id: 'les-en2-1',
            module_id: 'mod-en2-1',
            title: 'Menceritakan Pengalaman Lampau & Membuat Rencana',
            type: 'article',
            duration_minutes: 15,
            order_index: 1,
            content: `• Simple Past: Gunakan Verb 2 untuk kejadian selesai di masa lalu (I went to Surabaya yesterday).
• Present Perfect: Have/Has + Verb 3 untuk pengalaman hingga kini (I have worked here for two years).`,
            voice_lines: [
              {
                text: 'Yesterday I checked all the store inventory.',
                translation: 'Kemarin saya memeriksa seluruh stok toko.',
                lang: 'en-US',
              },
              {
                text: 'I am going to attend a training session tomorrow.',
                translation: 'Saya akan mengikuti sesi pelatihan besok.',
                lang: 'en-US',
              },
            ],
          },
          {
            id: 'les-en2-final',
            module_id: 'mod-en2-1',
            title: 'Evaluasi Level Menengah (A2/B1)',
            type: 'quiz',
            duration_minutes: 10,
            order_index: 2,
            content: 'Uji penggunaan Past Tense dan Present Perfect.',
            quiz: buildLanguageModuleQuiz(
              'quiz-en2-final',
              'les-en2-final',
              'Evaluasi Akhir — Bahasa Inggris Menengah',
              'Capai skor minimal 70% untuk lulus Level Menengah.',
              [
                {
                  category_tag: 'Bahasa Inggris A2/B1',
                  question_text: '"Did she ___ the monthly report yesterday?"',
                  options: [
                    { key: 'A', text: 'finish' },
                    { key: 'B', text: 'finished' },
                    { key: 'C', text: 'finishing' },
                    { key: 'D', text: 'finishes' },
                    { key: 'E', text: 'to finish' },
                  ],
                  correct_option: 'A',
                  explanation: 'Setelah "Did", kata kerja kembali ke bentuk dasar (Verb 1).',
                },
                {
                  category_tag: 'Bahasa Inggris A2/B1',
                  question_text: '"We ___ lived in Jakarta since 2020."',
                  options: [
                    { key: 'A', text: 'have' },
                    { key: 'B', text: 'has' },
                    { key: 'C', text: 'are' },
                    { key: 'D', text: 'did' },
                    { key: 'E', text: 'were' },
                  ],
                  correct_option: 'A',
                  explanation: 'Subjek "We" pada Present Perfect menggunakan "have".',
                },
              ]
            ),
          },
        ],
      },
    ],
  },

  {
    id: 'course-en-lanjutan',
    teacher_id: 'demo-teacher-1',
    teacher_name: 'Rizco Renova',
    title: 'Bahasa Inggris Lanjutan (Intermediate–Mahir B2/C1) — Business & Fluency',
    slug: 'bahasa-inggris-lanjutan-b2-c1',
    description:
      'Kuasai Conditionals, Passive Voice, negosiasi bisnis, presentasi eksekutif, dan diskusi profesional secara fasih.',
    category: 'Bahasa Inggris',
    level: 'Lanjutan',
    estimated_hours: 5.5,
    is_published: true,
    modules: [
      {
        id: 'mod-en3-1',
        course_id: 'course-en-lanjutan',
        title: 'Modul 1: Conditionals, Passive Voice & Negosiasi',
        order_index: 1,
        lessons: [
          {
            id: 'les-en3-1',
            module_id: 'mod-en3-1',
            title: 'Komunikasi Bisnis Tingkat Lanjut & Negosiasi Sopan',
            type: 'article',
            duration_minutes: 15,
            order_index: 1,
            content: `• Second Conditional (Pengandaian): If + Past Simple, ... would + Verb 1.
• Passive Voice (Fokus pada hasil/proses): The report was approved by the board yesterday.
• Negosiasi Sopan: "Would you be open to..." atau "If we agree on..., we could..."`,
            voice_lines: [
              {
                text: 'If we optimized the delivery schedule, we would reduce costs by ten percent.',
                translation: 'Jika kita mengoptimalkan jadwal pengiriman, kita dapat menekan biaya sebesar 10%.',
                lang: 'en-US',
              },
              {
                text: 'Would you be open to extending the deadline until Friday?',
                translation: 'Apakah Anda bersedia memperpanjang tenggat waktu hingga Jumat?',
                lang: 'en-US',
              },
            ],
          },
          {
            id: 'les-en3-final',
            module_id: 'mod-en3-1',
            title: 'Evaluasi Akhir Level Lanjutan (B2/C1)',
            type: 'quiz',
            duration_minutes: 15,
            order_index: 2,
            content: 'Evaluasi penguasaan tata bahasa tingkat lanjut dan negosiasi bisnis.',
            quiz: buildLanguageModuleQuiz(
              'quiz-en3-final',
              'les-en3-final',
              'Evaluasi Akhir — Bahasa Inggris Lanjutan',
              'Capai skor minimal 70% untuk lulus Level Lanjutan.',
              [
                {
                  category_tag: 'Bahasa Inggris B2/C1',
                  question_text: 'Kalimat pasif yang benar untuk "The manager approved the budget yesterday" adalah...',
                  options: [
                    { key: 'A', text: 'The budget was approved by the manager yesterday.' },
                    { key: 'B', text: 'The budget is approve by the manager yesterday.' },
                    { key: 'C', text: 'The budget were approved yesterday.' },
                    { key: 'D', text: 'The manager was approved the budget.' },
                    { key: 'E', text: 'The budget approving yesterday.' },
                  ],
                  correct_option: 'A',
                  explanation: 'Passive Voice bentuk lampau tunggal: was + Verb 3 (approved).',
                },
                {
                  category_tag: 'Bahasa Inggris B2/C1',
                  question_text: 'Ungkapan diplomatis untuk menawar tenggat waktu secara sopan adalah...',
                  options: [
                    { key: 'A', text: 'Would you be open to extending the deadline until Friday?' },
                    { key: 'B', text: 'Change the deadline now!' },
                    { key: 'C', text: 'I refuse to finish today.' },
                    { key: 'D', text: 'You must give me Friday.' },
                    { key: 'E', text: 'Why is the deadline so early?' },
                  ],
                  correct_option: 'A',
                  explanation: '"Would you be open to..." adalah frasa negosiasi profesional.',
                },
              ]
            ),
          },
        ],
      },
    ],
  },

  // =========================================================================
  // BAHASA KOREA (Ref: SNU Korean, Talk To Me In Korean, Sejong Korean)
  // =========================================================================
  {
    id: 'course-ko-pemula',
    teacher_id: 'demo-teacher-1',
    teacher_name: 'Rizco Renova',
    title: 'Bahasa Korea Pemula (Starter A1 / TOPIK I-1) — SNU Korean & TTMIK',
    slug: 'bahasa-korea-pemula-a1',
    description:
      'Belajar membaca Hangeul dari nol, partikel topik (은/는), salam sopan, angka Korea, serta memesan makanan (-주세요), dilengkapi video & audio native.',
    category: 'Bahasa Korea',
    level: 'Pemula',
    estimated_hours: 4.5,
    is_published: true,
    modules: [
      {
        id: 'mod-ko1-1',
        course_id: 'course-ko-pemula',
        title: 'Modul 1: Hangeul & Salam Sopan Sehari-hari',
        order_index: 1,
        lessons: [
          {
            id: 'les-ko1-1',
            module_id: 'mod-ko1-1',
            title: 'Membaca Hangeul (한글) & Salam Dasar Korea',
            type: 'video',
            video_url: 'https://www.youtube.com/embed/85qJXvyFrIc',
            duration_minutes: 15,
            order_index: 1,
            content: `• Vokal dasar: ㅏ (a), ㅓ (eo), ㅗ (o), ㅜ (u), ㅡ (eu), ㅣ (i).
• Konsonan dasar: ㄱ (g/k), ㄴ (n), ㄷ (d/t), ㄹ (r/l), ㅁ (m), ㅂ (b/p), ㅅ (s), ㅇ (diam di awal / ng di akhir).
• Salam sopan: 안녕하세요 (Halo), 감사합니다 (Terima kasih), 죄송합니다 (Mohon maaf).`,
            voice_lines: [
              {
                text: '안녕하세요. 저는 나디아예요.',
                romaji: 'Annyeonghaseyo. Jeoneun Nadiayeyo.',
                translation: 'Halo. Saya Nadia.',
                lang: 'ko-KR',
              },
              {
                text: '감사합니다. 물 주세요.',
                romaji: 'Gamsahamnida. Mul juseyo.',
                translation: 'Terima kasih. Tolong berikan air.',
                lang: 'ko-KR',
              },
            ],
          },
          {
            id: 'les-ko1-final',
            module_id: 'mod-ko1-1',
            title: 'Evaluasi Level Pemula (A1)',
            type: 'quiz',
            duration_minutes: 10,
            order_index: 2,
            content: 'Uji penguasaan Hangeul, salam, dan ungkapan dasar.',
            quiz: buildLanguageModuleQuiz(
              'quiz-ko1-final',
              'les-ko1-final',
              'Evaluasi Akhir — Bahasa Korea A1',
              'Capai skor minimal 70% untuk lulus Level A1.',
              [
                {
                  category_tag: 'Bahasa Korea A1',
                  question_text: 'Dengarkan audio berikut! Apa yang dipesan oleh pembicara?',
                  audio_text: '아이스 아메리카노 한 잔 주세요.',
                  audio_lang: 'ko-KR',
                  options: [
                    { key: 'A', text: 'Satu gelas es americano' },
                    { key: 'B', text: 'Dua botol air mineral' },
                    { key: 'C', text: 'Satu porsi bibimbap' },
                    { key: 'D', text: 'Tiga potong roti' },
                    { key: 'E', text: 'Secangkir teh hijau panas' },
                  ],
                  correct_option: 'A',
                  explanation: 'Audio berbunyi "Aiseu amerikano han jan juseyo" (Tolong satu gelas es americano).',
                },
                {
                  category_tag: 'Bahasa Korea A1',
                  question_text: 'Untuk memesan kopi ("Tolong berikan kopi") secara sopan di kafe Korea, ucapkan...',
                  options: [
                    { key: 'A', text: '커피 주세요 (Keopi juseyo)' },
                    { key: 'B', text: '커피 아니요 (Keopi aniyo)' },
                    { key: 'C', text: '커피 미안해요 (Keopi mianhaeyo)' },
                    { key: 'D', text: '커피 얼마예요 (Keopi eolmayeyo)' },
                    { key: 'E', text: '커피 안녕하세요 (Keopi annyeonghaseyo)' },
                  ],
                  correct_option: 'A',
                  explanation: '[Barang] + 주세요 (juseyo) digunakan untuk meminta/memesan.',
                },
                {
                  category_tag: 'Bahasa Korea A1',
                  question_text: 'Konsonan "ㅇ" jika berada di awal suku kata (contoh: 아) dibaca...',
                  options: [
                    { key: 'A', text: 'Tidak berbunyi (mengikuti vokalnya: a)' },
                    { key: 'B', text: 'nga' },
                    { key: 'C', text: 'ka' },
                    { key: 'D', text: 'sa' },
                    { key: 'E', text: 'ma' },
                  ],
                  correct_option: 'A',
                  explanation: 'ㅇ di posisi awal hanya berfungsi sebagai penahan vokal.',
                },
              ]
            ),
          },
        ],
      },
    ],
  },

  {
    id: 'course-ko-menengah',
    teacher_id: 'demo-teacher-1',
    teacher_name: 'Rizco Renova',
    title: 'Bahasa Korea Menengah (Elementary A2 / TOPIK I-2) — SNU Korean 1B–2',
    slug: 'bahasa-korea-menengah-a2',
    description:
      'Kuasai konjugasi -아요/-어요, partikel lokasi (에/에서), bentuk lampau (-았/었어요), dan mengungkapkan keinginan (-고 싶어요).',
    category: 'Bahasa Korea',
    level: 'Menengah',
    estimated_hours: 5.0,
    is_published: true,
    modules: [
      {
        id: 'mod-ko2-1',
        course_id: 'course-ko-menengah',
        title: 'Modul 1: Bentuk Lampau, Lokasi & Keinginan',
        order_index: 1,
        lessons: [
          {
            id: 'les-ko2-1',
            module_id: 'mod-ko2-1',
            title: 'Partikel Lokasi (에 vs 에서) & Bentuk Lampau (-았/었어요)',
            type: 'article',
            duration_minutes: 15,
            order_index: 1,
            content: `• Partikel 에 (e): Untuk tempat tujuan pergi/datang (학교에 가요 = pergi ke sekolah).
• Partikel 에서 (eseo): Untuk tempat melakukan suatu aktivitas (카페에서 커피를 마셔요 = minum kopi di kafe).
• Bentuk Lampau: -았어요 / -었어요 (어제 영화를 봤어요 = kemarin menonton film).`,
            voice_lines: [
              {
                text: '어제 카페에서 친구를 만났어요.',
                romaji: 'Eoje kape-eseo chingureul mannasseoyo.',
                translation: 'Kemarin saya bertemu teman di kafe.',
                lang: 'ko-KR',
              },
              {
                text: '내년에 한국에 가고 싶어요.',
                romaji: 'Naenyeone hanguge gago sipeoyo.',
                translation: 'Tahun depan saya ingin pergi ke Korea.',
                lang: 'ko-KR',
              },
            ],
          },
          {
            id: 'les-ko2-final',
            module_id: 'mod-ko2-1',
            title: 'Evaluasi Level Menengah (A2)',
            type: 'quiz',
            duration_minutes: 10,
            order_index: 2,
            content: 'Uji penggunaan partikel lokasi dan bentuk lampau.',
            quiz: buildLanguageModuleQuiz(
              'quiz-ko2-final',
              'les-ko2-final',
              'Evaluasi Akhir — Bahasa Korea Menengah',
              'Capai skor minimal 70% untuk lulus Level Menengah.',
              [
                {
                  category_tag: 'Bahasa Korea A2',
                  question_text: 'Partikel yang tepat untuk menyatakan tempat berlangsungnya aktivitas ("belajar di perpustakaan": 도서관 ___ 공부해요) adalah...',
                  options: [
                    { key: 'A', text: '에서 (eseo)' },
                    { key: 'B', text: '에 (e)' },
                    { key: 'C', text: '을 (eul)' },
                    { key: 'D', text: '는 (neun)' },
                    { key: 'E', text: '도 (do)' },
                  ],
                  correct_option: 'A',
                  explanation: '에서 (eseo) digunakan untuk menandai lokasi tempat aktivitas berlangsung.',
                },
                {
                  category_tag: 'Bahasa Korea A2',
                  question_text: 'Akhiran untuk menyatakan keinginan ("Saya ingin...") adalah...',
                  options: [
                    { key: 'A', text: '-고 싶어요' },
                    { key: 'B', text: '-았어요' },
                    { key: 'C', text: '-주세요' },
                    { key: 'D', text: '-입니까' },
                    { key: 'E', text: '-이/가' },
                  ],
                  correct_option: 'A',
                  explanation: '-고 싶어요 berarti "ingin melakukan...".',
                },
              ]
            ),
          },
        ],
      },
    ],
  },

  {
    id: 'course-ko-lanjutan',
    teacher_id: 'demo-teacher-1',
    teacher_name: 'Rizco Renova',
    title: 'Bahasa Korea Lanjutan (Intermediate–Mahir B1/B2 / TOPIK II) — Bisnis & Honorifik',
    slug: 'bahasa-korea-lanjutan-b1-b2',
    description:
      'Kuasai bentuk honorifik sopan (-(으)시-), pengandaian (-(으)면), kalimat tidak langsung (-다고 해요), dan percakapan profesional dunia kerja Korea.',
    category: 'Bahasa Korea',
    level: 'Lanjutan',
    estimated_hours: 6.0,
    is_published: true,
    modules: [
      {
        id: 'mod-ko3-1',
        course_id: 'course-ko-lanjutan',
        title: 'Modul 1: Honorifik Sopan & Komunikasi Kerja Korea',
        order_index: 1,
        lessons: [
          {
            id: 'les-ko3-1',
            module_id: 'mod-ko3-1',
            title: 'Bentuk Honorifik -(으)시- & Pengandaian -(으)면',
            type: 'article',
            duration_minutes: 15,
            order_index: 1,
            content: `• Honorifik -(으)시-: Digunakan untuk menghormati subjek yang lebih tua atau atasan (contoh: 가시다 = pergi [sopan], 말씀하시다 = berbicara [sopan]).
• Pengandaian -(으)면: Berarti "Jika / Apabila" (시간이 있으면 연락해 주세요 = Jika ada waktu, tolong hubungi saya).`,
            voice_lines: [
              {
                text: '시간이 있으시면 확인해 주세요.',
                romaji: 'Sigani isseusimyeon hwaginhae juseyo.',
                translation: 'Apabila Anda ada waktu, mohon berkenan memeriksanya.',
                lang: 'ko-KR',
              },
            ],
          },
          {
            id: 'les-ko3-final',
            module_id: 'mod-ko3-1',
            title: 'Evaluasi Level Lanjutan (TOPIK II)',
            type: 'quiz',
            duration_minutes: 15,
            order_index: 2,
            content: 'Evaluasi penguasaan honorifik dan tata bahasa tingkat lanjut.',
            quiz: buildLanguageModuleQuiz(
              'quiz-ko3-final',
              'les-ko3-final',
              'Evaluasi Akhir — Bahasa Korea Lanjutan',
              'Capai skor minimal 70% untuk lulus Level Lanjutan.',
              [
                {
                  category_tag: 'Bahasa Korea B1/B2',
                  question_text: 'Sisipan tata bahasa yang digunakan untuk menghormati tindakan atasan atau orang yang lebih tua adalah...',
                  options: [
                    { key: 'A', text: '-(으)시-' },
                    { key: 'B', text: '-고 싶-' },
                    { key: 'C', text: '-았/었-' },
                    { key: 'D', text: '-에서' },
                    { key: 'E', text: '-은/는' },
                  ],
                  correct_option: 'A',
                  explanation: 'Sisipan -(으)시- adalah penanda honorifik pada kata kerja/kata sifat.',
                },
                {
                  category_tag: 'Bahasa Korea B1/B2',
                  question_text: 'Akhiran "-(으)면" dalam kalimat "시간이 있으면..." berarti...',
                  options: [
                    { key: 'A', text: 'Jika / Apabila' },
                    { key: 'B', text: 'Karena sudah' },
                    { key: 'C', text: 'Jangan lakukan' },
                    { key: 'D', text: 'Sedang terjadi' },
                    { key: 'E', text: 'Walaupun begitu' },
                  ],
                  correct_option: 'A',
                  explanation: '-(으)면 digunakan untuk menyatakan syarat atau pengandaian ("jika/apabila").',
                },
              ]
            ),
          },
        ],
      },
    ],
  },
];

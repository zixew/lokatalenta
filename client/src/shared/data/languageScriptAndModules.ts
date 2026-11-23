import type { Course, Module, Question, VoiceLine } from '../types/lms';

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

interface ModuleBlueprint {
  title: string;
  lessonTitle: string;
  content: string;
  voiceLines: VoiceLine[];
  quizQuestion: Omit<Question, 'id' | 'quiz_id' | 'order_index'>;
  extraQuestions?: Omit<Question, 'id' | 'quiz_id' | 'order_index'>[];
}

export function build20Modules(
  courseId: string,
  prefix: string,
  blueprints: ModuleBlueprint[]
): Module[] {
  return blueprints.map((bp, idx) => {
    const modNum = idx + 1;
    const modId = `${prefix}-m${modNum}`;
    const lesId = `${prefix}-l${modNum}`;
    const quizLesId = `${prefix}-lq${modNum}`;
    const quizId = `${prefix}-q${modNum}`;

    const questions = [bp.quizQuestion, ...(bp.extraQuestions ?? [])];

    return {
      id: modId,
      course_id: courseId,
      title: `Modul ${modNum}: ${bp.title}`,
      order_index: modNum,
      lessons: [
        {
          id: lesId,
          module_id: modId,
          title: bp.lessonTitle,
          type: modNum === 1 ? 'video' : 'article',
          video_url:
            modNum === 1
              ? bp.voiceLines[0]?.lang === 'ja-JP'
                ? 'https://www.youtube.com/embed/6p9Il_j0zjc'
                : bp.voiceLines[0]?.lang === 'ko-KR'
                ? 'https://www.youtube.com/embed/85qJXvyFrIc'
                : 'https://www.youtube.com/embed/L9AWrJnhsRI'
              : null,
          duration_minutes: 12,
          order_index: 1,
          content: bp.content,
          voice_lines: bp.voiceLines,
        },
        {
          id: quizLesId,
          module_id: modId,
          title: `Latihan Modul ${modNum}: ${bp.title}`,
          type: 'quiz',
          duration_minutes: 10,
          order_index: 2,
          content: `Latihan pemahaman materi dan kosakata pada Modul ${modNum}. Capai skor minimal 70% untuk membuka Modul ${modNum + 1}.`,
          quiz: {
            id: quizId,
            lesson_id: quizLesId,
            title: `Latihan Modul ${modNum} — ${bp.title}`,
            description: `Uji pemahaman ${bp.title}.`,
            duration_minutes: 10,
            passing_score: 70,
            use_subtests: false,
            questions: makeQ(quizId, questions),
          },
        },
      ],
    };
  });
}

// ============================================================================
// 1. KURSUS PENGENALAN HURUF JEPANG (HIRAGANA, KATAKANA & KANJI) — 20 MODUL
// ============================================================================
const JP_SCRIPT_BLUEPRINTS: ModuleBlueprint[] = [
  {
    title: 'Hiragana Vokal (あ・い・う・え・お)',
    lessonTitle: 'Membaca & Melafalkan 5 Vokal Hiragana + Kosakata',
    content: `Lima vokal dasar bahasa Jepang adalah fondasi membaca seluruh teks Hiragana:
• あ (a) — Contoh kosakata: あさ (asa = pagi), あめ (ame = hujan)
• い (i) — Contoh kosakata: いぬ (inu = anjing), いえ (ie = rumah)
• う (u) — Contoh kosakata: うみ (umi = laut), うた (uta = lagu)
• え (e) — Contoh kosakata: えき (eki = stasiun), えん (en = yen)
• お (o) — Contoh kosakata: おちゃ (ocha = teh), おかね (okane = uang)`,
    voiceLines: [
      { text: 'あ、い、う、え、お', romaji: 'a, i, u, e, o', translation: 'Lima vokal dasar Hiragana', lang: 'ja-JP' },
      { text: 'あさ、いえ、うみ、えき、おちゃ', romaji: 'asa, ie, umi, eki, ocha', translation: 'pagi, rumah, laut, stasiun, teh', lang: 'ja-JP' },
    ],
    quizQuestion: {
      category_tag: 'Hiragana',
      question_text: 'Kata Hiragana "えき" dibaca dan memiliki arti...',
      options: [
        { key: 'A', text: 'eki (stasiun)' },
        { key: 'B', text: 'asa (pagi)' },
        { key: 'C', text: 'umi (laut)' },
        { key: 'D', text: 'inu (anjing)' },
        { key: 'E', text: 'ocha (teh)' },
      ],
      correct_option: 'A',
      explanation: 'え dibaca "e" dan き dibaca "ki", sehingga えき = eki (stasiun).',
    },
  },
  {
    title: 'Hiragana Baris K (か・き・く・け・こ)',
    lessonTitle: 'Membaca Baris Ka-Ki-Ku-Ke-Ko & Kosakata',
    content: `• か (ka), き (ki), く (ku), け (ke), こ (ko)
Kosakata sehari-hari: かさ (kasa = payung), き (ki = pohon), くつ (kutsu = sepatu), けさ (kesa = pagi ini), こども (kodomo = anak).`,
    voiceLines: [
      { text: 'かさ、き、くつ、けさ、こども', romaji: 'kasa, ki, kutsu, kesa, kodomo', translation: 'payung, pohon, sepatu, pagi ini, anak', lang: 'ja-JP' },
    ],
    quizQuestion: {
      category_tag: 'Hiragana',
      question_text: 'Huruf Hiragana untuk bunyi "ku" adalah...',
      options: [
        { key: 'A', text: 'か' },
        { key: 'B', text: 'き' },
        { key: 'C', text: 'く' },
        { key: 'D', text: 'け' },
        { key: 'E', text: 'こ' },
      ],
      correct_option: 'C',
      explanation: 'Urutan baris K adalah か(ka), き(ki), く(ku), け(ke), こ(ko).',
    },
  },
  {
    title: 'Hiragana Baris S (さ・し・す・せ・そ)',
    lessonTitle: 'Membaca Baris Sa-Shi-Su-Se-So & Kosakata',
    content: `Perhatikan bahwa huruf kedua dibaca "shi" (bukan "si"):
• さ (sa), し (shi), す (su), せ (se), そ (so)
Kosakata: さかな (sakana = ikan), しごと (shigoto = pekerjaan), すし (sushi), せんせい (sensei = guru), そら (sora = langit).`,
    voiceLines: [
      { text: 'さかな、しごと、すし、せんせい、そら', romaji: 'sakana, shigoto, sushi, sensei, sora', translation: 'ikan, pekerjaan, sushi, guru, langit', lang: 'ja-JP' },
    ],
    quizQuestion: {
      category_tag: 'Hiragana',
      question_text: 'Kata "しごと" dibaca...',
      options: [
        { key: 'A', text: 'sakana' },
        { key: 'B', text: 'shigoto' },
        { key: 'C', text: 'sensei' },
        { key: 'D', text: 'sora' },
        { key: 'E', text: 'sushi' },
      ],
      correct_option: 'B',
      explanation: 'し(shi) + ご(go) + と(to) = shigoto (pekerjaan).',
    },
  },
  {
    title: 'Hiragana Baris T & N (た・ち・つ・て・と / な・に・ぬ・ね・の)',
    lessonTitle: 'Membaca Baris T, Baris N & Kosakata',
    content: `• Baris T: た (ta), ち (chi), つ (tsu), て (te), と (to)
• Baris N: な (na), に (ni), ぬ (nu), ね (ne), の (no)
Kosakata: ともだち (tomodachi = teman), てがみ (tegami = surat), なまえ (namae = nama), ねこ (neko = kucing).`,
    voiceLines: [
      { text: 'ともだち、てがみ、なまえ、ねこ', romaji: 'tomodachi, tegami, namae, neko', translation: 'teman, surat, nama, kucing', lang: 'ja-JP' },
    ],
    quizQuestion: {
      category_tag: 'Hiragana',
      question_text: 'Kata "なまえ" memiliki arti...',
      options: [
        { key: 'A', text: 'Kucing' },
        { key: 'B', text: 'Teman' },
        { key: 'C', text: 'Nama' },
        { key: 'D', text: 'Surat' },
        { key: 'E', text: 'Tangan' },
      ],
      correct_option: 'C',
      explanation: 'なまえ (namae) berarti nama.',
    },
  },
  {
    title: 'Hiragana Baris H, M, Y, R, W & Bunyi Dakuten (が・ざ・だ・ば・ぱ)',
    lessonTitle: 'Melengkapi 46 Huruf Hiragana & Konsonan Bersuara',
    content: `• Baris H (はひふへほ), M (まみむめも), Y (やゆよ), R (らりるれろ), W (わをん).
• Dakuten (゛): か→が (ga), さ→ざ (za), た→だ (da), は→ば (ba). Handakuten (゜): は→ぱ (pa).`,
    voiceLines: [
      { text: 'ほん、みせ、やま、くるま、でんわ', romaji: 'hon, mise, yama, kuruma, denwa', translation: 'buku, toko, gunung, mobil, telepon', lang: 'ja-JP' },
    ],
    quizQuestion: {
      category_tag: 'Hiragana',
      question_text: 'Tanda kutip kecil (dakuten ゛) pada huruf は (ha) mengubah bunyinya menjadi...',
      options: [
        { key: 'A', text: 'ba (ば)' },
        { key: 'B', text: 'pa (ぱ)' },
        { key: 'C', text: 'ga (が)' },
        { key: 'D', text: 'za (ざ)' },
        { key: 'E', text: 'da (だ)' },
      ],
      correct_option: 'A',
      explanation: 'は + ゛ = ば (ba), sedangkan は + ゜ = ぱ (pa).',
    },
  },
  {
    title: 'Katakana Vokal & Baris K (ア・イ・ウ・エ・オ / カ・キ・ク・ケ・コ)',
    lessonTitle: 'Mengenal Katakana Vokal & Baris K untuk Kata Serapan',
    content: `Katakana berbentuk lebih bersudut tajam dan dipakai untuk kata serapan asing:
• Vokal: ア (a), イ (i), ウ (u), エ (e), オ (o)
• Baris K: カ (ka), キ (ki), ク (ku), ケ (ke), コ (ko)
Kosakata: エアコン (eakon = AC), カメラ (kamera), ケーキ (kēki = kue).`,
    voiceLines: [
      { text: 'エアコン、カメラ、ケーキ', romaji: 'eakon, kamera, kēki', translation: 'AC, kamera, kue', lang: 'ja-JP' },
    ],
    quizQuestion: {
      category_tag: 'Katakana',
      question_text: 'Kata Katakana "カメラ" dibaca...',
      options: [
        { key: 'A', text: 'kēki' },
        { key: 'B', text: 'kamera' },
        { key: 'C', text: 'kōhī' },
        { key: 'D', text: 'eakon' },
        { key: 'E', text: 'kuruma' },
      ],
      correct_option: 'B',
      explanation: 'カ(ka) + メ(me) + ラ(ra) = kamera.',
    },
  },
  {
    title: 'Katakana Baris S, T & N (サ・タ・ナ)',
    lessonTitle: 'Membaca Katakana Baris S, T, N & Garis Panjang (ー)',
    content: `Tanda garis panjang "ー" dalam Katakana berarti memanjangkan bunyi vokal sebelumnya:
• コーヒー (kōhī = kopi), タクシー (takushī = taksi), ノート (nōto = buku catatan), ネクタイ (nekutai = dasi).`,
    voiceLines: [
      { text: 'コーヒー、タクシー、ノート、ネクタイ', romaji: 'kōhī, takushī, nōto, nekutai', translation: 'kopi, taksi, buku catatan, dasi', lang: 'ja-JP' },
    ],
    quizQuestion: {
      category_tag: 'Katakana',
      question_text: 'Fungsi tanda strip (ー) pada kata Katakana "コーヒー" adalah...',
      options: [
        { key: 'A', text: 'Memanjangkan bunyi vokal sebelumnya' },
        { key: 'B', text: 'Menghentikan bunyi secara tiba-tiba' },
        { key: 'C', text: 'Menandakan huruf mati' },
        { key: 'D', text: 'Penanda kalimat tanya' },
        { key: 'E', text: 'Penanda nama orang' },
      ],
      correct_option: 'A',
      explanation: 'Chōonpu (ー) memanjangkan vokal pada kata Katakana.',
    },
  },
  {
    title: 'Katakana Baris H, M, Y, R, W & Kata Serapan Dunia Kerja',
    lessonTitle: 'Membaca Katakana Lengkap di Menu & Kantor',
    content: `Kosakata Katakana yang sering muncul di tempat kerja & ritel Jepang:
• パソコン (pasokon = komputer), メール (mēru = email), レシート (reshīto = struk belanja), ホテル (hoteru = hotel), スーパー (sūpā = supermarket).`,
    voiceLines: [
      { text: 'パソコン、メール、レシート、スーパー', romaji: 'pasokon, mēru, reshīto, sūpā', translation: 'komputer, email, struk belanja, supermarket', lang: 'ja-JP' },
    ],
    quizQuestion: {
      category_tag: 'Katakana',
      question_text: 'Arti dari kata Katakana "レシート" (reshīto) adalah...',
      options: [
        { key: 'A', text: 'Komputer' },
        { key: 'B', text: 'Struk belanja' },
        { key: 'C', text: 'Supermarket' },
        { key: 'D', text: 'Hotel' },
        { key: 'E', text: 'Email' },
      ],
      correct_option: 'B',
      explanation: 'レシート berasal dari kata bahasa Inggris "receipt" (struk belanja).',
    },
  },
  {
    title: 'Membedakan Katakana Mirip (シ vs ツ dan ソ vs ン)',
    lessonTitle: 'Trik Membaca Katakana yang Sering Tertukar',
    content: `Empat huruf Katakana paling sering tertukar:
• シ (shi): Dua titik tersusun vertikal, tarikan garis miring naik dari bawah ke atas.
• ツ (tsu): Dua titik tersusun horizontal, tarikan garis miring turun dari atas ke bawah.
• ソ (so) vs ン (n): ソ ditarik dari atas ke bawah; ン ditarik dari bawah ke atas.`,
    voiceLines: [
      { text: 'シャツ、スポーツ、レストラン、パン', romaji: 'shatsu, supōtsu, resutoran, pan', translation: 'kemeja, olahraga, restoran, roti', lang: 'ja-JP' },
    ],
    quizQuestion: {
      category_tag: 'Katakana',
      question_text: 'Kata Katakana "レストラン" dibaca...',
      options: [
        { key: 'A', text: 'resutoran (restoran)' },
        { key: 'B', text: 'shatsu (kemeja)' },
        { key: 'C', text: 'supōtsu (olahraga)' },
        { key: 'D', text: 'takushī (taksi)' },
        { key: 'E', text: 'depāto (department store)' },
      ],
      correct_option: 'A',
      explanation: 'レ(re)+ス(su)+ト(to)+ラ(ra)+ン(n) = resutoran.',
    },
  },
  {
    title: 'Gabungan Konsonan (Yōon: きゃ・しゅ・ちょ) & Konsonan Ganda (っ/ッ)',
    lessonTitle: 'Membaca Bunyi Gabungan & Huruf Kecil っ',
    content: `• Huruf や/ゆ/よ kecil menggabung bunyi (contoh: かいしゃ kaisha = perusahaan, べんきょう benkyō = belajar).
• Huruf つ kecil (っ) menggandakan konsonan berikutnya (contoh: きって kitte = prangko, ざっし zasshi = majalah).`,
    voiceLines: [
      { text: 'かいしゃ、べんきょう、きって、ざっし', romaji: 'kaisha, benkyō, kitte, zasshi', translation: 'perusahaan, belajar, prangko, majalah', lang: 'ja-JP' },
    ],
    quizQuestion: {
      category_tag: 'Hiragana',
      question_text: 'Kata "かいしゃ" dibaca...',
      options: [
        { key: 'A', text: 'kaisha (perusahaan)' },
        { key: 'B', text: 'benkyō (belajar)' },
        { key: 'C', text: 'kitte (prangko)' },
        { key: 'D', text: 'zasshi (majalah)' },
        { key: 'E', text: 'ocha (teh)' },
      ],
      correct_option: 'A',
      explanation: 'し + ゃ kecil = sha, sehingga かいしゃ = kaisha.',
    },
  },
  {
    title: 'Kanji Angka (一・二・三・四・五・六・七・八・九・十・百・千・万)',
    lessonTitle: 'Membaca & Menulis Kanji Angka dan Harga Yen',
    content: `Kanji angka adalah Kanji pertama yang wajib dikuasai untuk membaca harga dan tanggal:
• 一 (1), 二 (2), 三 (3), 四 (4), 五 (5), 六 (6), 七 (7), 八 (8), 九 (9), 十 (10)
• 百 (100 = hyaku), 千 (1.000 = sen), 万 (10.000 = man), 円 (en = Yen).`,
    voiceLines: [
      { text: '百円、千円、一万円', romaji: 'hyaku-en, sen-en, ichiman-en', translation: '100 yen, 1.000 yen, 10.000 yen', lang: 'ja-JP' },
    ],
    quizQuestion: {
      category_tag: 'Kanji',
      question_text: 'Tulisan harga "五千円" dibaca dan bernilai...',
      options: [
        { key: 'A', text: 'Gosen-en (5.000 yen)' },
        { key: 'B', text: 'Gohyaku-en (500 yen)' },
        { key: 'C', text: 'Goman-en (50.000 yen)' },
        { key: 'D', text: 'Sanzen-en (3.000 yen)' },
        { key: 'E', text: 'Ichiman-en (10.000 yen)' },
      ],
      correct_option: 'A',
      explanation: '五 (5) + 千 (1.000) + 円 (yen) = 5.000 yen (gosen-en).',
    },
  },
  {
    title: 'Kanji Hari & Waktu (日・月・火・水・木・金・土・年・時)',
    lessonTitle: 'Membaca Nama Hari & Kalender dalam Kanji',
    content: `• 日曜日 (Nichiyōbi = Minggu), 月曜日 (Getsuyōbi = Senin), 火曜日 (Kayōbi = Selasa), 水曜日 (Suiyōbi = Rabu), 木曜日 (Mokuyōbi = Kamis), 金曜日 (Kin'yōbi = Jumat), 土曜日 (Doyōbi = Sabtu).`,
    voiceLines: [
      { text: '月曜日から金曜日まで働きます。', romaji: 'Getsuyōbi kara kin’yōbi made hatarakimasu.', translation: 'Saya bekerja dari hari Senin sampai Jumat.', lang: 'ja-JP' },
    ],
    quizQuestion: {
      category_tag: 'Kanji',
      question_text: 'Kanji "水曜日" adalah nama hari...',
      options: [
        { key: 'A', text: 'Senin' },
        { key: 'B', text: 'Selasa' },
        { key: 'C', text: 'Rabu' },
        { key: 'D', text: 'Kamis' },
        { key: 'E', text: 'Jumat' },
      ],
      correct_option: 'C',
      explanation: '水 (air) digunakan untuk hari Rabu (Suiyōbi).',
    },
  },
  {
    title: 'Kanji Alam & Tempat (山・川・田・木・花・国)',
    lessonTitle: 'Mengenal Kanji Alam dan Asal-Usul Bentuknya',
    content: `Kanji alam berasal dari gambar (piktograf):
• 山 (yama = gunung), 川 (kawa = sungai), 田 (ta = sawah), 木 (ki = pohon), 花 (hana = bunga), 国 (kuni = negara).`,
    voiceLines: [
      { text: '高い山と長い川', romaji: 'Takai yama to nagai kawa', translation: 'Gunung yang tinggi dan sungai yang panjang', lang: 'ja-JP' },
    ],
    quizQuestion: {
      category_tag: 'Kanji',
      question_text: 'Arti dari Kanji "山" dan "川" secara berurutan adalah...',
      options: [
        { key: 'A', text: 'Gunung dan Sungai' },
        { key: 'B', text: 'Pohon dan Bunga' },
        { key: 'C', text: 'Api dan Air' },
        { key: 'D', text: 'Rumah dan Sekolah' },
        { key: 'E', text: 'Siang dan Malam' },
      ],
      correct_option: 'A',
      explanation: '山 = gunung (yama), 川 = sungai (kawa).',
    },
  },
  {
    title: 'Kanji Manusia & Keluarga (人・男・女・子・父・母・友)',
    lessonTitle: 'Membaca Kanji Orang dan Anggota Keluarga',
    content: `• 人 (hito/jin = orang), 男 (otoko = laki-laki), 女 (onna = perempuan), 子 (ko = anak), 父 (chichi = ayah), 母 (haha = ibu), 友 (tomo = teman).
Contoh gabungan: 日本人 (Nihonjin = orang Jepang), 友達 (tomodachi = teman).`,
    voiceLines: [
      { text: 'インドネシア人、日本人、友達', romaji: 'Indonesia-jin, Nihon-jin, tomodachi', translation: 'Orang Indonesia, orang Jepang, teman', lang: 'ja-JP' },
    ],
    quizQuestion: {
      category_tag: 'Kanji',
      question_text: 'Gabungan Kanji "日本人" dibaca dan berarti...',
      options: [
        { key: 'A', text: 'Nihonjin (orang Jepang)' },
        { key: 'B', text: 'Nihongo (bahasa Jepang)' },
        { key: 'C', text: 'Nichiyōbi (hari Minggu)' },
        { key: 'D', text: 'Tomodachi (teman)' },
        { key: 'E', text: 'Kodomo (anak)' },
      ],
      correct_option: 'A',
      explanation: '日本 (Jepang) + 人 (orang) = Nihonjin.',
    },
  },
  {
    title: 'Kanji Arah & Posisi (上・下・左・右・中・外・前・後)',
    lessonTitle: 'Membaca Papan Petunjuk Arah dalam Kanji',
    content: `Sangat berguna saat berada di stasiun atau gedung di Jepang:
• 上 (ue = atas), 下 (shita = bawah), 左 (hidari = kiri), 右 (migi = kanan), 中 (naka = dalam), 外 (soto = luar), 前 (mae = depan), 後 (ushiro = belakang).`,
    voiceLines: [
      { text: '右へ曲がってください。', romaji: 'Migi e magatte kudasai.', translation: 'Tolong belok ke kanan.', lang: 'ja-JP' },
    ],
    quizQuestion: {
      category_tag: 'Kanji',
      question_text: 'Pasangan Kanji "左" dan "右" berarti...',
      options: [
        { key: 'A', text: 'Atas dan Bawah' },
        { key: 'B', text: 'Kiri dan Kanan' },
        { key: 'C', text: 'Depan dan Belakang' },
        { key: 'D', text: 'Dalam dan Luar' },
        { key: 'E', text: 'Besar dan Kecil' },
      ],
      correct_option: 'B',
      explanation: '左 = hidari (kiri), 右 = migi (kanan).',
    },
  },
  {
    title: 'Kanji Ukuran & Kata Sifat (大・小・高・安・新・古・長)',
    lessonTitle: 'Membaca Kanji Deskripsi Benda & Harga',
    content: `• 大 (ōkii = besar), 小 (chiisai = kecil), 高 (takai = tinggi/mahal), 安 (yasui = murah), 新 (atarashii = baru), 古 (furui = lama/tua), 長 (nagai = panjang).`,
    voiceLines: [
      { text: 'この店は安くておいしいです。', romaji: 'Kono mise wa yasukute oishii desu.', translation: 'Toko ini murah dan enak.', lang: 'ja-JP' },
    ],
    quizQuestion: {
      category_tag: 'Kanji',
      question_text: 'Jika melihat label bertuliskan "安い" pada barang di toko, artinya barang tersebut...',
      options: [
        { key: 'A', text: 'Mahal' },
        { key: 'B', text: 'Murah' },
        { key: 'C', text: 'Baru' },
        { key: 'D', text: 'Kecil' },
        { key: 'E', text: 'Panjang' },
      ],
      correct_option: 'B',
      explanation: '安い (yasui) berarti murah.',
    },
  },
  {
    title: 'Kanji Kata Kerja Dasar I (見・聞・言・読・書・話)',
    lessonTitle: 'Mengenal Kanji Aktivitas Komunikasi & Belajar',
    content: `• 見る (miru = melihat), 聞く (kiku = mendengar), 言う (iu = berkata), 読む (yomu = membaca), 書く (kaku = menulis), 話す (hanasu = berbicara).`,
    voiceLines: [
      { text: '毎日日本語の本を読みます。', romaji: 'Mainichi Nihongo no hon o yomimasu.', translation: 'Setiap hari saya membaca buku bahasa Jepang.', lang: 'ja-JP' },
    ],
    quizQuestion: {
      category_tag: 'Kanji',
      question_text: 'Kanji "書く" (kaku) memiliki arti...',
      options: [
        { key: 'A', text: 'Membaca' },
        { key: 'B', text: 'Menulis' },
        { key: 'C', text: 'Mendengar' },
        { key: 'D', text: 'Melihat' },
        { key: 'E', text: 'Berbicara' },
      ],
      correct_option: 'B',
      explanation: '書く (kaku) berarti menulis.',
    },
  },
  {
    title: 'Kanji Kata Kerja Dasar II (行・来・帰・食・飲・買)',
    lessonTitle: 'Mengenal Kanji Aktivitas Sehari-hari',
    content: `• 行く (iku = pergi), 来る (kuru = datang), 帰る (kaeru = pulang), 食べる (taberu = makan), 飲む (nomu = minum), 買う (kau = membeli).`,
    voiceLines: [
      { text: 'スーパーで果物を買います。', romaji: 'Sūpā de kudamono o kaimasu.', translation: 'Saya membeli buah di supermarket.', lang: 'ja-JP' },
    ],
    quizQuestion: {
      category_tag: 'Kanji',
      question_text: 'Kanji "食べる" dan "飲む" berarti...',
      options: [
        { key: 'A', text: 'Pergi dan Datang' },
        { key: 'B', text: 'Makan dan Minum' },
        { key: 'C', text: 'Membeli dan Menjual' },
        { key: 'D', text: 'Masuk dan Keluar' },
        { key: 'E', text: 'Bangun dan Tidur' },
      ],
      correct_option: 'B',
      explanation: '食べる (taberu) = makan, 飲む (nomu) = minum.',
    },
  },
  {
    title: 'Kanji Tempat & Fasilitas (駅・店・社・校・病・院・口)',
    lessonTitle: 'Membaca Papan Nama Tempat Umum di Jepang',
    content: `• 駅 (eki = stasiun), 店 (mise = toko), 会社 (kaisha = perusahaan), 学校 (gakkō = sekolah), 病院 (byōin = rumah sakit), 入口 (iriguchi = pintu masuk), 出口 (deguchi = pintu keluar).`,
    voiceLines: [
      { text: '北口から出てください。', romaji: 'Kitaguchi kara dete kudasai.', translation: 'Silakan keluar melalui pintu utara.', lang: 'ja-JP' },
    ],
    quizQuestion: {
      category_tag: 'Kanji',
      question_text: 'Papan tanda bertuliskan "出口" di stasiun berarti...',
      options: [
        { key: 'A', text: 'Pintu Masuk' },
        { key: 'B', text: 'Pintu Keluar' },
        { key: 'C', text: 'Rumah Sakit' },
        { key: 'D', text: 'Perusahaan' },
        { key: 'E', text: 'Toilet' },
      ],
      correct_option: 'B',
      explanation: '出 (keluar) + 口 (pintu/mulut) = deguchi (pintu keluar).',
    },
  },
  {
    title: 'Evaluasi Komprehensif: Hiragana, Katakana, Kanji & Kosakata',
    lessonTitle: 'Ujian Akhir Membaca Tulisan Jepang',
    content: `Selamat! Anda telah mempelajari 46 Hiragana, 46 Katakana, bunyi gabungan, serta puluhan Kanji dasar N5–N4. Kerjakan evaluasi akhir ini untuk menguji kemampuan membaca Anda secara menyeluruh.`,
    voiceLines: [
      { text: '日本語の勉強は楽しいです。', romaji: 'Nihongo no benkyō wa tanoshii desu.', translation: 'Belajar bahasa Jepang itu menyenangkan.', lang: 'ja-JP' },
    ],
    quizQuestion: {
      category_tag: 'Evaluasi Akhir',
      question_text: 'Kalimat "毎日会社へ行きます" dibaca dan berarti...',
      options: [
        { key: 'A', text: 'Mainichi kaisha e ikimasu (Setiap hari pergi ke perusahaan)' },
        { key: 'B', text: 'Mainichi gakkō e kimasu (Setiap hari datang ke sekolah)' },
        { key: 'C', text: 'Ashita eki de kaimasu (Besok membeli di stasiun)' },
        { key: 'D', text: 'Kinō mise de tabemashita (Kemarin makan di toko)' },
        { key: 'E', text: 'Kesa uchi e kaerimasu (Pagi ini pulang ke rumah)' },
      ],
      correct_option: 'A',
      explanation: '毎日 (mainichi) + 会社 (kaisha) + へ (e) + 行きます (ikimasu).',
    },
    extraQuestions: [
      {
        category_tag: 'Evaluasi Akhir',
        question_text: 'Kata Katakana "スーパーマーケット" berarti...',
        options: [
          { key: 'A', text: 'Supermarket' },
          { key: 'B', text: 'Apartemen' },
          { key: 'C', text: 'Stasiun kereta' },
          { key: 'D', text: 'Kantor pos' },
          { key: 'E', text: 'Restoran' },
        ],
        correct_option: 'A',
        explanation: 'スーパーマーケット adalah serapan kata bahasa Inggris "supermarket".',
      },
    ],
  },
];

// ============================================================================
// 2. KURSUS PENGENALAN HURUF KOREA (HANGEUL & KOSAKATA) — 20 MODUL
// ============================================================================
const KO_SCRIPT_BLUEPRINTS: ModuleBlueprint[] = [
  {
    title: 'Sejarah Hangeul & Vokal Vertikal (ㅏ・ㅓ・ㅣ)',
    lessonTitle: 'Membaca Vokal Dasar Tegak & Kosakata Awal',
    content: `Hangeul diciptakan Raja Sejong agar mudah dipelajari siapa saja. Suku kata selalu dimulai dengan konsonan (pakai ㅇ jika diawali vokal):
• 아 (a), 어 (eo), 이 (i). Contoh: 아이 (ai = anak), 이 (i = gigi / dua).`,
    voiceLines: [{ text: '아, 어, 이, 아이', romaji: 'a, eo, i, ai', translation: 'a, eo, i, anak', lang: 'ko-KR' }],
    quizQuestion: {
      category_tag: 'Hangeul',
      question_text: 'Kata Hangeul "아이" dibaca dan berarti...',
      options: [
        { key: 'A', text: 'ai (anak)' },
        { key: 'B', text: 'oi (mentimun)' },
        { key: 'C', text: 'uyu (susu)' },
        { key: 'D', text: 'yeo (rubah)' },
        { key: 'E', text: 'ori (bebek)' },
      ],
      correct_option: 'A',
      explanation: '아(a) + 이(i) = ai (anak).',
    },
  },
  {
    title: 'Vokal Horizontal (ㅗ・ㅜ・ㅡ)',
    lessonTitle: 'Membaca Vokal Datar & Kosakata',
    content: `• 오 (o), 우 (u), 으 (eu). Contoh: 오이 (oi = mentimun), 우유 (uyu = susu), 오리 (ori = bebek).`,
    voiceLines: [{ text: '오이, 우유, 오리', romaji: 'oi, uyu, ori', translation: 'mentimun, susu, bebek', lang: 'ko-KR' }],
    quizQuestion: {
      category_tag: 'Hangeul',
      question_text: 'Kata "우유" dibaca dan berarti...',
      options: [
        { key: 'A', text: 'uyu (susu)' },
        { key: 'B', text: 'oi (mentimun)' },
        { key: 'C', text: 'ai (anak)' },
        { key: 'D', text: 'geu (itu)' },
        { key: 'E', text: 'yo (kasur)' },
      ],
      correct_option: 'A',
      explanation: '우(u) + 유(yu) = uyu (susu).',
    },
  },
  {
    title: 'Vokal Y-Glide (ㅑ・ㅕ・ㅛ・ㅠ)',
    lessonTitle: 'Menambah Garis Pendek Menjadi Bunyi Y',
    content: `Menambahkan satu garis pendek pada vokal dasar menghasilkan bunyi "y":
• 야 (ya), 여 (yeo), 요 (yo), 유 (yu). Contoh: 야구 (yagu = bisbol), 요리 (yori = masakan).`,
    voiceLines: [{ text: '야구, 요리, 우유', romaji: 'yagu, yori, uyu', translation: 'bisbol, masakan, susu', lang: 'ko-KR' }],
    quizQuestion: {
      category_tag: 'Hangeul',
      question_text: 'Kata "요리" dibaca...',
      options: [
        { key: 'A', text: 'yori (masakan)' },
        { key: 'B', text: 'yagu (bisbol)' },
        { key: 'C', text: 'uri (kami)' },
        { key: 'D', text: 'ari (semut)' },
        { key: 'E', text: 'ori (bebek)' },
      ],
      correct_option: 'A',
      explanation: '요(yo) + 리(ri) = yori.',
    },
  },
  {
    title: 'Vokal Gabungan (ㅐ・ㅔ・ㅚ・ㅟ・ㅘ・ㅝ)',
    lessonTitle: 'Membaca Vokal Rangkap dalam Percakapan',
    content: `• 애 (ae), 에 (e), 와 (wa), 워 (wo), 외 (oe), 위 (wi).
Kosakata: 개 (gae = anjing), 사과 (sagwa = apel), 회사 (hoesa = perusahaan).`,
    voiceLines: [{ text: '개, 사과, 회사', romaji: 'gae, sagwa, hoesa', translation: 'anjing, apel, perusahaan', lang: 'ko-KR' }],
    quizQuestion: {
      category_tag: 'Hangeul',
      question_text: 'Kata "회사" memiliki arti...',
      options: [
        { key: 'A', text: 'Perusahaan' },
        { key: 'B', text: 'Apel' },
        { key: 'C', text: 'Rumah' },
        { key: 'D', text: 'Sekolah' },
        { key: 'E', text: 'Pasar' },
      ],
      correct_option: 'A',
      explanation: '회사 (hoesa) berarti perusahaan.',
    },
  },
  {
    title: 'Konsonan Dasar I (ㄱ・ㄴ・ㄷ・ㄹ・ㅁ)',
    lessonTitle: 'Membaca 5 Konsonan Pertama & Kosakata',
    content: `• ㄱ (g/k), ㄴ (n), ㄷ (d/t), ㄹ (r/l), ㅁ (m).
Kosakata: 가구 (gagu = perabot), 나무 (namu = pohon), 다리 (dari = kaki/jembatan), 라디오 (radio), 모자 (moja = topi).`,
    voiceLines: [{ text: '가구, 나무, 다리, 모자', romaji: 'gagu, namu, dari, moja', translation: 'perabot, pohon, jembatan, topi', lang: 'ko-KR' }],
    quizQuestion: {
      category_tag: 'Hangeul',
      question_text: 'Kata "나무" dibaca dan berarti...',
      options: [
        { key: 'A', text: 'namu (pohon)' },
        { key: 'B', text: 'gagu (perabot)' },
        { key: 'C', text: 'moja (topi)' },
        { key: 'D', text: 'dari (jembatan)' },
        { key: 'E', text: 'nara (negara)' },
      ],
      correct_option: 'A',
      explanation: 'ㄴ+ㅏ = na, ㅁ+ㅜ = mu → namu (pohon).',
    },
  },
  {
    title: 'Konsonan Dasar II (ㅂ・ㅅ・ㅇ・ㅈ)',
    lessonTitle: 'Membaca Konsonan b, s, ng, j & Kosakata',
    content: `• ㅂ (b/p), ㅅ (s), ㅇ (diam/ng), ㅈ (j).
Kosakata: 바다 (bada = laut), 사과 (sagwa = apel), 주스 (juseu = jus), 바지 (baji = celana).`,
    voiceLines: [{ text: '바다, 주스, 바지', romaji: 'bada, juseu, baji', translation: 'laut, jus, celana', lang: 'ko-KR' }],
    quizQuestion: {
      category_tag: 'Hangeul',
      question_text: 'Kata "바다" berarti...',
      options: [
        { key: 'A', text: 'Laut' },
        { key: 'B', text: 'Langit' },
        { key: 'C', text: 'Gunung' },
        { key: 'D', text: 'Sungai' },
        { key: 'E', text: 'Celana' },
      ],
      correct_option: 'A',
      explanation: '바다 (bada) berarti laut.',
    },
  },
  {
    title: 'Konsonan Aspirasi / Berhembus (ㅊ・ㅋ・ㅌ・ㅍ・ㅎ)',
    lessonTitle: 'Membedakan Bunyi Berhembus Kuat',
    content: `• ㅊ (ch), ㅋ (kh), ㅌ (th), ㅍ (ph), ㅎ (h).
Kosakata: 차 (cha = teh/mobil), 커피 (keopi = kopi), 토마토 (tomato), 포도 (podo = anggur), 하늘 (haneul = langit).`,
    voiceLines: [{ text: '차, 커피, 포도, 하늘', romaji: 'cha, keopi, podo, haneul', translation: 'teh, kopi, anggur, langit', lang: 'ko-KR' }],
    quizQuestion: {
      category_tag: 'Hangeul',
      question_text: 'Kata "커피" dibaca...',
      options: [
        { key: 'A', text: 'keopi (kopi)' },
        { key: 'B', text: 'podo (anggur)' },
        { key: 'C', text: 'cha (teh)' },
        { key: 'D', text: 'haneul (langit)' },
        { key: 'E', text: 'kameura (kamera)' },
      ],
      correct_option: 'A',
      explanation: 'ㅋ+ㅓ = keo, ㅍ+ㅣ = pi → keopi (kopi).',
    },
  },
  {
    title: 'Konsonan Ganda / Tegang (ㄲ・ㄸ・ㅃ・ㅆ・ㅉ)',
    lessonTitle: 'Melafalkan Konsonan Ganda dengan Tegas',
    content: `• ㄲ (kk), ㄸ (tt), ㅃ (pp), ㅆ (ss), ㅉ (jj).
Kosakata: 꼬리 (kkori = ekor), 빵 (ppang = roti), 쓰다 (sseuda = menulis/pahit), 짜다 (jjada = asin).`,
    voiceLines: [{ text: '빵, 꼬리, 쓰다', romaji: 'ppang, kkori, sseuda', translation: 'roti, ekor, menulis', lang: 'ko-KR' }],
    quizQuestion: {
      category_tag: 'Hangeul',
      question_text: 'Kata "빵" dibaca dan berarti...',
      options: [
        { key: 'A', text: 'ppang (roti)' },
        { key: 'B', text: 'bang (kamar)' },
        { key: 'C', text: 'kkot (bunga)' },
        { key: 'D', text: 'ssal (beras)' },
        { key: 'E', text: 'ttang (tanah)' },
      ],
      correct_option: 'A',
      explanation: 'ㅃ + ㅏ + ㅇ = ppang (roti).',
    },
  },
  {
    title: 'Mengenal Batchim (받침) — Konsonan Akhir Suku Kata',
    lessonTitle: 'Aturan Dasar Membaca Konsonan di Bawah Suku Kata',
    content: `Batchim adalah konsonan yang diletakkan di bagian bawah blok suku kata:
• ㄴ (-n): 산 (san = gunung), 문 (mun = pintu)
• ㅁ (-m): 밤 (bam = malam), 마음 (maeum = hati)
• ㅇ (-ng): 방 (bang = kamar), 공 (gong = bola)
• ㄹ (-l): 물 (mul = air), 달 (dal = bulan).`,
    voiceLines: [{ text: '산, 문, 방, 물', romaji: 'san, mun, bang, mul', translation: 'gunung, pintu, kamar, air', lang: 'ko-KR' }],
    quizQuestion: {
      category_tag: 'Batchim',
      question_text: 'Kata "물" memiliki arti...',
      options: [
        { key: 'A', text: 'Air' },
        { key: 'B', text: 'Api' },
        { key: 'C', text: 'Pintu' },
        { key: 'D', text: 'Gunung' },
        { key: 'E', text: 'Kamar' },
      ],
      correct_option: 'A',
      explanation: '물 (mul) berarti air.',
    },
  },
  {
    title: 'Batchim K, T, P & Aturan Penyambungan Bunyi (연음)',
    lessonTitle: 'Membaca Suku Kata yang Mengalir ke Vokal Berikutnya',
    content: `Jika sebuah suku kata berakhiran Batchim dan diikuti oleh huruf ㅇ (vokal), maka bunyi Batchim berpindah ke suku kata berikutnya:
• 한국어 (Han-gug-eo) → dibaca [한구거 / Hangug-eo]
• 직업 (Jig-eop) → dibaca [지겁 / Jigeop] = pekerjaan.`,
    voiceLines: [{ text: '한국어, 직업, 이름이 뭐예요?', romaji: 'Hangug-eo, jigeop, ireumi mwoyeyo?', translation: 'Bahasa Korea, pekerjaan, siapa namanya?', lang: 'ko-KR' }],
    quizQuestion: {
      category_tag: 'Batchim',
      question_text: 'Berdasarkan aturan penyambungan bunyi (연음), kata "한국어" dilafalkan seperti...',
      options: [
        { key: 'A', text: 'Hangug-eo (한구거)' },
        { key: 'B', text: 'Han-guk-nyeo' },
        { key: 'C', text: 'Hang-guk-eo' },
        { key: 'D', text: 'Hak-guk-eo' },
        { key: 'E', text: 'Han-gu-meo' },
      ],
      correct_option: 'A',
      explanation: 'Batchim ㄱ pada 국 menyambung ke vokal 어 menjadi 구거.',
    },
  },
  // Modules 11-20: Vocabulary Themes + Reading Drills
  ...[
    {
      t: 'Kosakata Angka Sino-Korea (일・이・삼・사・오)',
      l: 'Angka Sino-Korea untuk Harga, Tanggal & Nomor Telepon',
      c: '일(1), 이(2), 삼(3), 사(4), 오(5), 육(6), 칠(7), 팔(8), 구(9), 십(10), 백(100), 천(1.000), 만(10.000). Contoh: 오천 원 (ocheon won = 5.000 won).',
      v: [{ text: '일, 이, 삼, 사, 오, 천 원', romaji: 'il, i, sam, sa, o, cheon won', translation: '1, 2, 3, 4, 5, 1.000 won', lang: 'ko-KR' as const }],
      q: 'Angka "오천 원" bernilai...',
      a: '5.000 won',
      opts: ['5.000 won', '500 won', '50.000 won', '3.000 won', '1.000 won'],
    },
    {
      t: 'Kosakata Angka Asli Korea (하나・둘・셋・넷)',
      l: 'Angka Asli Korea untuk Menghitung Jam & Jumlah Barang',
      c: '하나(1), 둘(2), 셋(3), 넷(4), 다섯(5). Saat diikuti satuan (개/잔/명), berubah menjadi 한, 두, 세, 네. Contoh: 커피 한 잔 (1 gelas kopi).',
      v: [{ text: '하나, 둘, 셋, 커피 한 잔', romaji: 'hana, dul, set, keopi han jan', translation: '1, 2, 3, satu gelas kopi', lang: 'ko-KR' as const }],
      q: 'Ungkapan "두 개 주세요" artinya...',
      a: 'Tolong berikan dua buah',
      opts: ['Tolong berikan dua buah', 'Tolong berikan satu buah', 'Tolong berikan lima buah', 'Harganya dua won', 'Jam dua siang'],
    },
    {
      t: 'Kosakata Anggota Keluarga (가족)',
      l: 'Membaca & Melafalkan Sebutan Keluarga',
      c: '아버지 (abeoji = ayah), 어머니 (eomeoni = ibu), 형/오빠 (hyeong/oppa = kakak laki-laki), 누나/언니 (nuna/eonni = kakak perempuan), 동생 (dongsaeng = adik).',
      v: [{ text: '아버지, 어머니, 동생', romaji: 'abeoji, eomeoni, dongsaeng', translation: 'ayah, ibu, adik', lang: 'ko-KR' as const }],
      q: 'Kata "어머니" berarti...',
      a: 'Ibu',
      opts: ['Ibu', 'Ayah', 'Adik', 'Teman', 'Guru'],
    },
    {
      t: 'Kosakata Hari & Waktu (요일・시간)',
      l: 'Membaca Nama Hari & Penanda Waktu',
      c: '오늘 (oneul = hari ini), 내일 (naeil = besok), 어제 (eoje = kemarin), 월요일 (Senin), 화요일 (Selasa), 수요일 (Rabu).',
      v: [{ text: '어제, 오늘, 내일', romaji: 'eoje, oneul, naeil', translation: 'kemarin, hari ini, besok', lang: 'ko-KR' as const }],
      q: 'Arti dari kata "내일" adalah...',
      a: 'Besok',
      opts: ['Besok', 'Kemarin', 'Hari ini', 'Minggu lalu', 'Bulan depan'],
    },
    {
      t: 'Kosakata Makanan & Minuman (음식・음료)',
      l: 'Membaca Menu Restoran & Kafe Korea',
      c: '밥 (bap = nasi), 김치 (kimchi), 불고기 (bulgogi), 비빔밥 (bibimbap), 물 (mul = air), 커피 (keopi = kopi).',
      v: [{ text: '비빔밥하고 물 주세요.', romaji: 'Bibimbaphago mul juseyo.', translation: 'Tolong bibimbap dan air.', lang: 'ko-KR' as const }],
      q: 'Kata "밥" dalam bahasa Korea berarti...',
      a: 'Nasi / Makanan',
      opts: ['Nasi / Makanan', 'Kopi', 'Daging', 'Buah', 'Sayur'],
    },
    {
      t: 'Kosakata Tempat Umum & Transportasi (장소・교통)',
      l: 'Membaca Papan Nama Tempat & Kendaraan',
      c: '학교 (hakgyo = sekolah), 병원 (byeongwon = rumah sakit), 은행 (eunhaeng = bank), 지하철 (jihacheol = kereta bawah tanah), 버스 (beoseu = bus).',
      v: [{ text: '지하철역이 어디예요?', romaji: 'Jihacheoryeogi eodiyeyo?', translation: 'Di mana stasiun kereta bawah tanah?', lang: 'ko-KR' as const }],
      q: 'Kata "은행" berarti...',
      a: 'Bank',
      opts: ['Bank', 'Sekolah', 'Rumah sakit', 'Pasar', 'Kantor pos'],
    },
    {
      t: 'Kosakata Pekerjaan & Dunia Kerja (직업)',
      l: 'Membaca Nama Profesi Sehari-hari',
      c: '학생 (haksaeng = pelajar), 회사원 (hoesawon = karyawan perusahaan), 선생님 (seonsaengnim = guru), 의사 (uisa = dokter), 요리사 (yorisa = koki).',
      v: [{ text: '저는 회사원이에요.', romaji: 'Jeoneun hoesawonieyo.', translation: 'Saya adalah karyawan perusahaan.', lang: 'ko-KR' as const }],
      q: 'Profesi "회사원" (hoesawon) artinya...',
      a: 'Karyawan perusahaan',
      opts: ['Karyawan perusahaan', 'Dokter', 'Koki', 'Pelajar', 'Polisi'],
    },
    {
      t: 'Kosakata Kata Kerja Harian (동사)',
      l: 'Membaca Kata Kerja Dasar Sehari-hari',
      c: '가다 (gada = pergi), 오다 (oda = datang), 먹다 (meokda = makan), 마시다 (masida = minum), 사다 (sada = membeli), 일하다 (ilhada = bekerja).',
      v: [{ text: '일하다, 사다, 먹다, 마시다', romaji: 'ilhada, sada, meokda, masida', translation: 'bekerja, membeli, makan, minum', lang: 'ko-KR' as const }],
      q: 'Kata kerja "일하다" berarti...',
      a: 'Bekerja',
      opts: ['Bekerja', 'Tidur', 'Membaca', 'Berjalan', 'Membeli'],
    },
    {
      t: 'Kosakata Kata Sifat Dasar (형용사)',
      l: 'Mendeskripsikan Benda & Suasana',
      c: '크다 (keuda = besar), 작다 (jakda = kecil), 좋다 (jota = bagus), 맛있다 (masitda = enak), 비싸다 (bissada = mahal), 싸다 (ssada = murah).',
      v: [{ text: '이 커피가 맛있고 싸요.', romaji: 'I keopiga masitgo ssayo.', translation: 'Kopi ini enak dan murah.', lang: 'ko-KR' as const }],
      q: 'Jika makanan terasa enak, dalam bahasa Korea disebut...',
      a: '맛있다 (masitda)',
      opts: ['맛있다 (masitda)', '비싸다 (bissada)', '작다 (jakda)', '춥다 (chupda)', '멀다 (meolda)'],
    },
    {
      t: 'Evaluasi Komprehensif: Membaca Hangeul & Kosakata Inti',
      l: 'Ujian Akhir Pengenalan Huruf & Kosakata Korea',
      c: 'Selamat! Anda telah menyelesaikan 20 modul Hangeul, Batchim, dan ratusan kosakata dasar Korea. Selesaikan evaluasi akhir untuk mendapatkan sertifikat.',
      v: [{ text: '한국어 공부가 정말 재미있어요.', romaji: 'Hangug-eo gongbuga jeongmal jaemiisseoyo.', translation: 'Belajar bahasa Korea sangat menyenangkan.', lang: 'ko-KR' as const }],
      q: 'Kalimat "저는 내일 회사에 가요" dibaca dan berarti...',
      a: 'Jeoneun naeil hoesa-e gayo (Saya besok pergi ke perusahaan)',
      opts: [
        'Jeoneun naeil hoesa-e gayo (Saya besok pergi ke perusahaan)',
        'Jeoneun eoje hakgyo-e gasseoyo (Saya kemarin pergi ke sekolah)',
        'Oneul kape-eseo keopireul masyeoyo (Hari ini minum kopi di kafe)',
        'Eomeoniga jibe gyeseyo (Ibu ada di rumah)',
        'Igeo eolmayeyo (Ini berapa harganya)',
      ],
    },
  ].map((item) => ({
    title: item.t,
    lessonTitle: item.l,
    content: item.c,
    voiceLines: item.v,
    quizQuestion: {
      category_tag: 'Kosakata Korea',
      question_text: item.q,
      options: [
        { key: 'A' as const, text: item.opts[0] },
        { key: 'B' as const, text: item.opts[1] },
        { key: 'C' as const, text: item.opts[2] },
        { key: 'D' as const, text: item.opts[3] },
        { key: 'E' as const, text: item.opts[4] },
      ],
      correct_option: 'A' as const,
      explanation: `Jawaban yang benar adalah ${item.a}.`,
    },
  })),
];

// Helper to expand a structured language level course to 20 comprehensive modules
export function expandCourseTo20Modules(
  courseId: string,
  prefix: string,
  lang: 'ja-JP' | 'en-US' | 'ko-KR',
  levelLabel: string,
  existingModules: Module[],
  extraTopics: { title: string; summary: string; sample: string; romaji?: string; translation: string; qText: string; answer: string; distractors: string[] }[]
): Module[] {
  const needed = Math.max(0, 20 - existingModules.length);
  const generated = build20Modules(
    courseId,
    `${prefix}-ext`,
    extraTopics.slice(0, needed).map((t) => ({
      title: t.title,
      lessonTitle: `Katsudō & Rikai: ${t.title}`,
      content: `Target Can-Do (${levelLabel}): ${t.summary}\n\nContoh Ungkapan Inti:\n• ${t.sample}${t.romaji ? ` (${t.romaji})` : ''} — ${t.translation}`,
      voiceLines: [
        {
          text: t.sample,
          romaji: t.romaji,
          translation: t.translation,
          lang,
        },
      ],
      quizQuestion: {
        category_tag: levelLabel,
        question_text: t.qText,
        options: [
          { key: 'A', text: t.answer },
          { key: 'B', text: t.distractors[0] },
          { key: 'C', text: t.distractors[1] },
          { key: 'D', text: t.distractors[2] },
          { key: 'E', text: t.distractors[3] },
        ],
        correct_option: 'A',
        explanation: `Sesuai materi "${t.title}": ${t.answer}.`,
      },
    }))
  );

  // Merge existing modules first (except move final evaluation to the very end as Modul 20)
  const nonFinal = existingModules.slice(0, -1);
  const finalMod = existingModules[existingModules.length - 1];
  const combined = [...nonFinal, ...generated, finalMod].slice(0, 20);
  return combined.map((m, idx) => ({
    ...m,
    order_index: idx + 1,
    title: m.title.replace(/^Modul \d+:/, `Modul ${idx + 1}:`),
  }));
}

export const SCRIPT_COURSES: Course[] = [
  {
    id: 'course-jp-script-20',
    teacher_id: 'demo-teacher-1',
    teacher_name: 'Rizco Renova',
    title: 'Huruf & Kosakata Jepang Lengkap: Hiragana, Katakana & Kanji (20 Modul)',
    slug: 'huruf-jepang-hiragana-katakana-kanji',
    description:
      'Belajar membaca dan melafalkan 46 Hiragana, 46 Katakana, bunyi gabungan, serta Kanji dasar N5–N4 secara bertahap dalam 20 modul lengkap dengan audio native dan latihan per modul.',
    category: 'Bahasa Jepang',
    level: 'Pemula',
    estimated_hours: 8.0,
    is_published: true,
    modules: build20Modules('course-jp-script-20', 'jps', JP_SCRIPT_BLUEPRINTS),
  },
  {
    id: 'course-ko-script-20',
    teacher_id: 'demo-teacher-1',
    teacher_name: 'Rizco Renova',
    title: 'Huruf & Kosakata Korea Lengkap: Hangeul, Batchim & Kosakata (20 Modul)',
    slug: 'huruf-korea-hangeul-kosakata',
    description:
      'Kuasai cara membaca aksara Hangeul dari nol (vokal, konsonan, konsonan ganda, aturan Batchim) serta ratusan kosakata sehari-hari dalam 20 modul dengan audio native.',
    category: 'Bahasa Korea',
    level: 'Pemula',
    estimated_hours: 8.0,
    is_published: true,
    modules: build20Modules('course-ko-script-20', 'kos', KO_SCRIPT_BLUEPRINTS),
  },
];

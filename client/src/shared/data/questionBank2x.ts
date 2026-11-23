import type { Course, Question, QuizOption } from '../types/lms';

const KEYS: QuizOption['key'][] = ['A', 'B', 'C', 'D', 'E'];

function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seedInput: string) {
  let s = hashSeed(seedInput) || 123456789;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

function shuffleWithSeed<T>(arr: T[], seedInput: string): T[] {
  const rng = makeRng(seedInput);
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildOptions(
  correctText: string,
  distractors: string[],
  seed: string
): { options: QuizOption[]; correct_option: QuizOption['key'] } {
  const uniqueDistractors = Array.from(new Set(distractors.filter((d) => d !== correctText)));
  while (uniqueDistractors.length < 4) {
    uniqueDistractors.push(`Pilihan ${uniqueDistractors.length + 2}`);
  }
  const combined = shuffleWithSeed([correctText, ...uniqueDistractors.slice(0, 4)], seed);
  const options: QuizOption[] = combined.map((text, idx) => ({
    key: KEYS[idx],
    text,
  }));
  const correctIdx = combined.indexOf(correctText);
  return {
    options,
    correct_option: KEYS[correctIdx >= 0 ? correctIdx : 0],
  };
}

function formatRp(n: number): string {
  return `Rp${n.toLocaleString('id-ID')}`;
}

function makeMathQuestion(
  quizId: string,
  categoryTag: string,
  orderIndex: number,
  seed: string
): Question {
  const rng = makeRng(seed);
  const variant = Math.floor(rng() * 4);

  let qText = '';
  let correctStr = '';
  let distractors: string[] = [];
  let explanation = '';

  if (variant === 0) {
    // Diskon kasir / persentase
    const price = (Math.floor(rng() * 18) + 4) * 10000;
    const disc = [10, 15, 20, 25, 30][Math.floor(rng() * 5)];
    const qty = Math.floor(rng() * 3) + 2;
    const total = price * qty * (100 - disc) / 100;
    qText = `Seorang pelanggan membeli ${qty} barang seharga ${formatRp(price)} per item dengan diskon ${disc}%. Berapa total yang harus dibayar?`;
    correctStr = formatRp(total);
    distractors = [
      formatRp(total + 10000),
      formatRp(total - 10000),
      formatRp(price * qty - disc * 1000),
      formatRp(Math.round(total * 1.1)),
    ];
    explanation = `Total sebelum diskon = ${qty} × ${formatRp(price)} = ${formatRp(price * qty)}. Setelah diskon ${disc}% (bayar ${100 - disc}%), total = ${formatRp(total)}.`;
  } else if (variant === 1) {
    // Kembalian kasir
    const itemA = (Math.floor(rng() * 15) + 5) * 2500;
    const itemB = (Math.floor(rng() * 12) + 4) * 2000;
    const total = itemA + itemB;
    const paid = total <= 50000 ? 50000 : total <= 100000 ? 100000 : 150000;
    const change = paid - total;
    qText = `Total belanja pelanggan terdiri dari dua pos masing-masing ${formatRp(itemA)} dan ${formatRp(itemB)}. Jika pelanggan membayar dengan uang ${formatRp(paid)}, berapa kembaliannya?`;
    correctStr = formatRp(change);
    distractors = [
      formatRp(change + 2500),
      formatRp(Math.max(500, change - 2500)),
      formatRp(change + 5000),
      formatRp(paid - itemA),
    ];
    explanation = `Total belanja = ${formatRp(itemA)} + ${formatRp(itemB)} = ${formatRp(total)}. Kembalian = ${formatRp(paid)} - ${formatRp(total)} = ${formatRp(change)}.`;
  } else if (variant === 2) {
    // Rasio & proporsi waktu/produksi
    const workersA = Math.floor(rng() * 4) + 3;
    const units = workersA * (Math.floor(rng() * 6) + 4);
    const mult = Math.floor(rng() * 3) + 2;
    const workersB = workersA * mult;
    const ans = units * mult;
    qText = `Jika ${workersA} staf gudang dapat mengemas ${units} paket dalam 1 jam, berapa paket yang dapat dikemas ${workersB} staf dalam waktu yang sama?`;
    correctStr = `${ans} paket`;
    distractors = [
      `${ans + workersA} paket`,
      `${ans - workersB} paket`,
      `${Math.round(ans / 2)} paket`,
      `${ans + 12} paket`,
    ];
    explanation = `Setiap staf mengemas ${units / workersA} paket/jam. Untuk ${workersB} staf = ${workersB} × ${units / workersA} = ${ans} paket.`;
  } else {
    // Kecepatan & jarak
    const speed = (Math.floor(rng() * 6) + 4) * 10;
    const hours = Math.floor(rng() * 3) + 2;
    const dist = speed * hours;
    qText = `Sebuah armada pengiriman melaju dengan kecepatan rata-rata ${speed} km/jam selama ${hours} jam tanpa berhenti. Berapa jarak yang ditempuh?`;
    correctStr = `${dist} km`;
    distractors = [
      `${dist + 20} km`,
      `${dist - 15} km`,
      `${speed + hours} km`,
      `${dist + speed} km`,
    ];
    explanation = `Jarak = kecepatan × waktu = ${speed} × ${hours} = ${dist} km.`;
  }

  const { options, correct_option } = buildOptions(correctStr, distractors, seed);
  return {
    id: `${quizId}-bank-${orderIndex}`,
    quiz_id: quizId,
    category_tag: categoryTag,
    question_text: qText,
    options,
    correct_option,
    explanation,
    order_index: orderIndex,
  };
}

function makeSeriesQuestion(
  quizId: string,
  categoryTag: string,
  orderIndex: number,
  seed: string
): Question {
  const rng = makeRng(seed);
  const type = Math.floor(rng() * 3);
  let seq: number[] = [];
  let next = 0;
  let explanation = '';

  if (type === 0) {
    // Selisih bertingkat
    const start = Math.floor(rng() * 10) + 2;
    const d0 = Math.floor(rng() * 4) + 2;
    const inc = Math.floor(rng() * 3) + 1;
    seq = [start];
    for (let i = 0; i < 4; i += 1) {
      seq.push(seq[seq.length - 1] + d0 + i * inc);
    }
    next = seq[seq.length - 1] + d0 + 4 * inc;
    explanation = `Pola selisih bertambah +${inc} tiap langkah (mulai dari +${d0}), sehingga suku berikutnya adalah ${seq[seq.length - 1]} + ${d0 + 4 * inc} = ${next}.`;
  } else if (type === 1) {
    // Dua pola berselang-seling
    const a0 = Math.floor(rng() * 10) + 5;
    const b0 = Math.floor(rng() * 15) + 20;
    const da = Math.floor(rng() * 4) + 3;
    const db = Math.floor(rng() * 4) + 2;
    seq = [a0, b0, a0 + da, b0 - db, a0 + 2 * da, b0 - 2 * db];
    next = a0 + 3 * da;
    explanation = `Terdapat 2 deret berselang-seling: posisi ganjil bertambah +${da} (${a0}, ${a0 + da}, ${a0 + 2 * da}, ...), sehingga suku ke-7 adalah ${next}.`;
  } else {
    // Perkalian / rasio + konstanta
    const a0 = Math.floor(rng() * 4) + 2;
    const add = Math.floor(rng() * 3) + 1;
    seq = [a0];
    for (let i = 0; i < 4; i += 1) {
      seq.push(seq[seq.length - 1] * 2 + add);
    }
    next = seq[seq.length - 1] * 2 + add;
    explanation = `Pola tiap suku adalah (suku sebelumnya × 2) + ${add}, sehingga ${seq[seq.length - 1]} × 2 + ${add} = ${next}.`;
  }

  const correctStr = String(next);
  const distractors = [String(next + 2), String(next - 2), String(next + 5), String(next - 4)];
  const { options, correct_option } = buildOptions(correctStr, distractors, seed);
  return {
    id: `${quizId}-bank-${orderIndex}`,
    quiz_id: quizId,
    category_tag: categoryTag,
    question_text: `Tentukan angka berikutnya pada deret berikut: ${seq.join(', ')}, ...`,
    options,
    correct_option,
    explanation,
    order_index: orderIndex,
  };
}

function makeAccuracyQuestion(
  quizId: string,
  categoryTag: string,
  orderIndex: number,
  seed: string
): Question {
  const rng = makeRng(seed);
  const prefix = ['INV', 'SKU', 'TRX', 'DO', 'REG'][Math.floor(rng() * 5)];
  const num = Math.floor(rng() * 8999) + 1000;
  const suffix = ['A', 'B', 'K', 'M', 'X'][Math.floor(rng() * 5)];
  const year = 2024 + Math.floor(rng() * 3);
  const target = `${prefix}-${year}-${num}${suffix}`;

  const mut1 = `${prefix}-${year}-${num + 1}${suffix}`;
  const mut2 = `${prefix}-${year - 1}-${num}${suffix}`;
  const mut3 = `${prefix}-${year}-${String(num).split('').reverse().join('')}${suffix}`;
  const mut4 = `${prefix}-${year}-${num}${suffix === 'A' ? 'B' : 'A'}`;

  const { options, correct_option } = buildOptions(target, [mut1, mut2, mut3, mut4], seed);
  return {
    id: `${quizId}-bank-${orderIndex}`,
    quiz_id: quizId,
    category_tag: categoryTag,
    question_text: `Ketelitian Data: Manakah kode dokumen yang SAMA PERSIS dengan "${target}"?`,
    options,
    correct_option,
    explanation: `Periksa setiap segmen huruf dan angka secara teliti; hanya opsi ${correct_option} yang identik dengan "${target}".`,
    order_index: orderIndex,
  };
}

interface CuratedTemplate {
  q: string;
  correct: string;
  wrong: [string, string, string, string];
  exp: string;
  audio_text?: string;
  audio_lang?: 'ja-JP' | 'en-US' | 'ko-KR';
}

const JA_BANK: CuratedTemplate[] = [
  {
    q: 'Apa arti kata "ありがとうございます" (Arigatou gozaimasu) dalam bahasa Indonesia?',
    correct: 'Terima kasih banyak',
    wrong: ['Selamat pagi', 'Permisi / Maaf', 'Sampai jumpa besok', 'Sama-sama'],
    exp: '"Arigatou gozaimasu" adalah ungkapan terima kasih yang sopan.',
    audio_text: 'ありがとうございます',
    audio_lang: 'ja-JP',
  },
  {
    q: 'Partikel mana yang tepat untuk melengkapi: "わたし ___ がくせいです" (Saya adalah pelajar)?',
    correct: 'は (wa)',
    wrong: ['を (o)', 'へ (e)', 'で (de)', 'から (kara)'],
    exp: 'Partikel は (wa) menandai topik kalimat.',
    audio_text: 'わたしはがくせいです',
    audio_lang: 'ja-JP',
  },
  {
    q: 'Huruf Katakana untuk suku kata "ka" adalah ...',
    correct: 'カ',
    wrong: ['か', 'キ', 'ク', 'サ'],
    exp: 'カ adalah Katakana "ka", sedangkan か adalah Hiragana.',
    audio_text: 'カ',
    audio_lang: 'ja-JP',
  },
  {
    q: 'Kanji "水" dibaca "mizu" dan memiliki arti ...',
    correct: 'Air',
    wrong: ['Api', 'Pohon', 'Gunung', 'Emas'],
    exp: 'Kanji 水 (mizu / sui) berarti air.',
    audio_text: 'みず',
    audio_lang: 'ja-JP',
  },
  {
    q: 'Bagaimana mengucapkan "Selamat pagi" secara sopan dalam bahasa Jepang?',
    correct: 'おはようございます',
    wrong: ['こんばんは', 'おやすみなさい', 'いただきます', 'さようなら'],
    exp: '"Ohayou gozaimasu" digunakan untuk menyapa pada pagi hari.',
    audio_text: 'おはようございます',
    audio_lang: 'ja-JP',
  },
  {
    q: 'Partikel yang digunakan untuk menandai objek langsung kata kerja (mis. makan nasi) adalah ...',
    correct: 'を (o)',
    wrong: ['は (wa)', 'の (no)', 'と (to)', 'より (yori)'],
    exp: 'Partikel を (o) menghubungkan objek langsung dengan kata kerja transitif.',
  },
  {
    q: 'Apa arti kalimat "いくらですか" (Ikura desu ka) saat berbelanja?',
    correct: 'Berapa harganya?',
    wrong: ['Di mana stasiun?', 'Jam berapa sekarang?', 'Siapa nama Anda?', 'Boleh saya masuk?'],
    exp: '"Ikura desu ka" digunakan untuk menanyakan harga barang.',
    audio_text: 'いくらですか',
    audio_lang: 'ja-JP',
  },
  {
    q: 'Kanji "山" berarti ...',
    correct: 'Gunung',
    wrong: ['Sungai', 'Langit', 'Bulan', 'Matahari'],
    exp: 'Kanji 山 (yama / san) berarti gunung.',
    audio_text: 'やま',
    audio_lang: 'ja-JP',
  },
  {
    q: 'Bentuk lampau sopan dari kata kerja "たべます" (makan) adalah ...',
    correct: 'たべました',
    wrong: ['たべません', 'たべたい', 'たべて', 'たべる'],
    exp: 'Akhiran -masu berubah menjadi -mashita untuk bentuk lampau positif.',
    audio_text: 'たべました',
    audio_lang: 'ja-JP',
  },
  {
    q: 'Kata tunjuk "これ" (kore) digunakan untuk benda yang ...',
    correct: 'Dekat dengan pembicara',
    wrong: ['Dekat dengan lawan bicara', 'Jauh dari keduanya', 'Berada di masa lalu', 'Tidak terlihat'],
    exp: 'Kore = ini (dekat pembicara), Sore = itu (dekat lawan bicara), Are = itu (jauh).',
    audio_text: 'これはほんです',
    audio_lang: 'ja-JP',
  },
];

const KO_BANK: CuratedTemplate[] = [
  {
    q: 'Apa arti ungkapan "감사합니다" (Gamsahamnida)?',
    correct: 'Terima kasih',
    wrong: ['Selamat tidur', 'Maafkan saya', 'Apa kabar', 'Selamat datang'],
    exp: '"Gamsahamnida" adalah ucapan terima kasih formal dalam bahasa Korea.',
    audio_text: '감사합니다',
    audio_lang: 'ko-KR',
  },
  {
    q: 'Huruf vokal Hangeul "ㅏ" dibaca seperti bunyi ...',
    correct: 'a',
    wrong: ['o', 'u', 'i', 'e'],
    exp: 'Vokal dasar ㅏ berbunyi "a" seperti pada kata "ayah".',
    audio_text: '아',
    audio_lang: 'ko-KR',
  },
  {
    q: 'Partikel penanda tempat berlangsungnya suatu aktivitas adalah ...',
    correct: '에서 (eseo)',
    wrong: ['은/는 (eun/neun)', '와/과 (wa/gwa)', '도 (do)', '만 (man)'],
    exp: '에서 (eseo) menyatakan lokasi terjadinya aksi, mis. 집에서 공부해요.',
  },
  {
    q: 'Bagaimana cara menyapa "Halo / Apa kabar" secara sopan dalam bahasa Korea?',
    correct: '안녕하세요',
    wrong: ['안녕히 가세요', '죄송합니다', '괜찮아요', '주세요'],
    exp: '"Annyeonghaseyo" adalah sapaan sopan standar di Korea.',
    audio_text: '안녕하세요',
    audio_lang: 'ko-KR',
  },
  {
    q: 'Kata "물 주세요" (Mul juseyo) di restoran berarti ...',
    correct: 'Tolong beri saya air',
    wrong: ['Tolong beri saya tagihan', 'Makanannya sangat pedas', 'Saya sudah kenyang', 'Di mana kasirnya'],
    exp: '물 = air, 주세요 = tolong berikan.',
    audio_text: '물 주세요',
    audio_lang: 'ko-KR',
  },
  {
    q: 'Konsonan Hangeul "ㅁ" melambangkan bunyi ...',
    correct: 'm',
    wrong: ['n', 'b', 's', 'k'],
    exp: 'ㅁ (mieum) dibaca "m".',
  },
  {
    q: 'Angka Sino-Korea untuk 1, 2, 3 secara berurutan adalah ...',
    correct: '일, 이, 삼 (il, i, sam)',
    wrong: ['하나, 둘, 셋', '사, 오, 육', '칠, 팔, 구', '열, 스물, 서른'],
    exp: 'Sistem Sino-Korea menggunakan 일(1), 이(2), 삼(3) untuk tanggal, harga, dan menit.',
    audio_text: '일, 이, 삼',
    audio_lang: 'ko-KR',
  },
  {
    q: 'Akhiran sopan informal yang paling umum digunakan sehari-hari adalah ...',
    correct: '-아요 / -어요',
    wrong: ['-습니다만', '-겠습니까', '-더라', '-군요'],
    exp: 'Bentuk -아요/-어요 (haeyoche) paling sering dipakai dalam percakapan sopan sehari-hari.',
  },
];

const EN_BANK: CuratedTemplate[] = [
  {
    q: 'Choose the correct form: "She ___ to the office every morning at 8 AM."',
    correct: 'goes',
    wrong: ['go', 'going', 'gone', 'went'],
    exp: 'Simple Present Tense dengan subjek orang ketiga tunggal ("She") menggunakan kata kerja + -es ("goes").',
    audio_text: 'She goes to the office every morning at 8 AM.',
    audio_lang: 'en-US',
  },
  {
    q: 'Which expression is most polite when asking a customer to wait?',
    correct: 'Could you please hold on for a moment?',
    wrong: ['Wait right there!', 'Do not move.', 'Stay quiet.', 'Just wait for me.'],
    exp: '"Could you please hold on for a moment?" adalah ungkapan sopan standar di dunia kerja.',
    audio_text: 'Could you please hold on for a moment?',
    audio_lang: 'en-US',
  },
  {
    q: 'Complete the sentence: "We have been working on this project ___ January."',
    correct: 'since',
    wrong: ['for', 'during', 'until', 'from'],
    exp: '"Since" digunakan untuk menunjukkan titik awal waktu tertentu (January).',
  },
  {
    q: 'What is the synonym of "essential" in a business context?',
    correct: 'Crucial',
    wrong: ['Optional', 'Trivial', 'Delayed', 'Temporary'],
    exp: '"Crucial" berarti sangat penting/esensial.',
  },
  {
    q: 'Choose the correct conditional: "If it rains tomorrow, we ___ the meeting indoors."',
    correct: 'will hold',
    wrong: ['held', 'would held', 'holding', 'had held'],
    exp: 'First Conditional (kemungkinan nyata di masa depan): If + Simple Present, will + Verb 1.',
  },
  {
    q: 'Which sentence uses Passive Voice correctly?',
    correct: 'The monthly report was submitted by the team yesterday.',
    wrong: [
      'The monthly report submitted by the team yesterday.',
      'The monthly report was submit by the team yesterday.',
      'The monthly report is submitting by the team yesterday.',
      'The monthly report were submitted by the team yesterday.',
    ],
    exp: 'Passive voice lampau tunggal menggunakan "was + Verb 3 (submitted)".',
  },
];

const GENERAL_LOGIC_BANK: CuratedTemplate[] = [
  {
    q: 'Semua kasir wajib melakukan serah terima laci kas di akhir shift. Rina adalah kasir shift pagi. Kesimpulan yang tepat adalah ...',
    correct: 'Rina wajib melakukan serah terima laci kas di akhir shift',
    wrong: [
      'Rina tidak perlu serah terima karena shift pagi',
      'Hanya kepala toko yang wajib serah terima',
      'Rina boleh langsung pulang tanpa serah terima',
      'Tidak dapat disimpulkan',
    ],
    exp: 'Silogisme langsung: Rina termasuk himpunan kasir, sehingga aturan berlaku penuh untuk Rina.',
  },
  {
    q: 'Jika stok barang di rak kosong, maka pramuniaga harus melakukan pengisian ulang dari gudang. Diketahui pramuniaga tidak melakukan pengisian ulang. Kesimpulan yang sah adalah ...',
    correct: 'Stok barang di rak tidak kosong',
    wrong: [
      'Gudang sedang kehabisan barang',
      'Stok barang di rak pasti kosong',
      'Pramuniaga sedang beristirahat',
      'Barang sudah terjual habis',
    ],
    exp: 'Modus Tollens: Jika P maka Q; bukan Q, maka bukan P (stok tidak kosong).',
  },
  {
    q: 'Dalam antrean layanan, Andi berada di depan Budi, dan Cici berada di belakang Budi. Dedi berada tepat di depan Andi. Siapakah yang berada di urutan paling depan?',
    correct: 'Dedi',
    wrong: ['Andi', 'Budi', 'Cici', 'Andi dan Dedi bersamaan'],
    exp: 'Urutan dari depan ke belakang: Dedi → Andi → Budi → Cici.',
  },
  {
    q: 'Sinonim yang paling tepat untuk kata "AKURAT" adalah ...',
    correct: 'Tepat dan saksama',
    wrong: ['Terburu-buru', 'Kira-kira', 'Berlebihan', 'Sementara'],
    exp: 'Akurat berarti teliti, tepat, dan benar sesuai fakta.',
  },
  {
    q: 'Antonim yang paling tepat untuk kata "EFISIEN" adalah ...',
    correct: 'Boros',
    wrong: ['Hemat', 'Cepat', 'Teratur', 'Ringkas'],
    exp: 'Efisien berarti tepat guna dan hemat sumber daya; lawannya adalah boros.',
  },
  {
    q: 'Analogi: DOKTER : PASIEN = PENGAJAR : ...',
    correct: 'Pelajar',
    wrong: ['Sekolah', 'Buku', 'Papan tulis', 'Ujian'],
    exp: 'Dokter melayani/membimbing pasien; pengajar melayani/membimbing pelajar.',
  },
  {
    q: 'Logika Gambar / Pola Visual: Sebuah persegi diputar 90° searah jarum jam sebanyak 3 kali berturut-turut. Posisi akhirnya setara dengan putaran ...',
    correct: '90° berlawanan arah jarum jam dari posisi awal',
    wrong: [
      '180° dari posisi awal',
      'Kembali ke posisi awal (0°)',
      '45° searah jarum jam',
      '360° searah jarum jam',
    ],
    exp: '3 × 90° searah jarum jam = 270° searah jarum jam, yang ekuivalen dengan 90° berlawanan arah jarum jam.',
  },
  {
    q: 'Sikap Kerja: Saat jam sibuk, dua pelanggan menanyakan lokasi produk di saat bersamaan ketika Anda sedang merapikan rak. Tindakan terbaik adalah ...',
    correct: 'Menyapa ramah keduanya, menjawab singkat yang paling dekat, lalu segera membantu pelanggan kedua',
    wrong: [
      'Mengabaikan pelanggan sampai rak selesai dirapikan',
      'Meminta pelanggan mencari sendiri di aplikasi',
      'Meninggalkan area kerja tanpa memberi tahu siapa pun',
      'Menjawab dengan nada tinggi karena sedang sibuk',
    ],
    exp: 'Pelayanan prima mengutamakan respons ramah, tanggap, dan adil saat jam sibuk.',
  },
];

function fromCuratedTemplate(
  tpl: CuratedTemplate,
  quizId: string,
  categoryTag: string,
  orderIndex: number,
  seed: string
): Question {
  const { options, correct_option } = buildOptions(tpl.correct, tpl.wrong, seed);
  return {
    id: `${quizId}-bank-${orderIndex}`,
    quiz_id: quizId,
    category_tag: categoryTag,
    question_text: tpl.q,
    audio_text: tpl.audio_text ?? null,
    audio_lang: tpl.audio_lang ?? null,
    options,
    correct_option,
    explanation: tpl.exp,
    order_index: orderIndex,
  };
}

function generateOneBankQuestion(
  quizId: string,
  courseContext: string,
  categoryTag: string,
  orderIndex: number,
  existingTexts: Set<string>
): Question {
  const ctx = `${courseContext} ${categoryTag}`.toLowerCase();
  const seed = `${quizId}:${categoryTag}:${orderIndex}`;

  if (ctx.includes('aritmatika') || ctx.includes('kasir') || ctx.includes('numerik') || ctx.includes('hitung')) {
    return makeMathQuestion(quizId, categoryTag, orderIndex, seed);
  }
  if (ctx.includes('deret') || ctx.includes('pola bilangan')) {
    return makeSeriesQuestion(quizId, categoryTag, orderIndex, seed);
  }
  if (ctx.includes('ketelitian') || ctx.includes('data') || ctx.includes('sku')) {
    return makeAccuracyQuestion(quizId, categoryTag, orderIndex, seed);
  }

  let pool: CuratedTemplate[] = GENERAL_LOGIC_BANK;
  if (ctx.includes('jepang') || ctx.includes('hiragana') || ctx.includes('katakana') || ctx.includes('kanji') || ctx.includes('jlpt')) {
    pool = JA_BANK;
  } else if (ctx.includes('korea') || ctx.includes('hangeul') || ctx.includes('topik')) {
    pool = KO_BANK;
  } else if (ctx.includes('inggris') || ctx.includes('english') || ctx.includes('toefl') || ctx.includes('ielts')) {
    pool = EN_BANK;
  }

  const unused = pool.filter((item) => !existingTexts.has(item.q));
  if (unused.length > 0) {
    const picked = unused[hashSeed(seed) % unused.length];
    existingTexts.add(picked.q);
    return fromCuratedTemplate(picked, quizId, categoryTag, orderIndex, seed);
  }

  // Fallback to deterministic math / accuracy / series variation so every question remains unique
  const fallbackMode = orderIndex % 3;
  if (fallbackMode === 0) return makeMathQuestion(quizId, categoryTag, orderIndex, seed);
  if (fallbackMode === 1) return makeSeriesQuestion(quizId, categoryTag, orderIndex, seed);
  return makeAccuracyQuestion(quizId, categoryTag, orderIndex, seed);
}

/**
 * Ensures every quiz in the catalog has a question bank sized 2x its per-session question count.
 */
export function applyQuestionBank2x(courses: Course[]): Course[] {
  return courses.map((course) => ({
    ...course,
    modules: (course.modules ?? []).map((mod) => ({
      ...mod,
      lessons: (mod.lessons ?? []).map((lesson) => {
        if (!lesson.quiz || !lesson.quiz.questions || lesson.quiz.questions.length === 0) {
          return lesson;
        }
        const base = lesson.quiz.questions;
        const limit = lesson.quiz.question_limit ?? base.length;
        const targetBankSize = limit * 2;
        if (base.length >= targetBankSize) {
          return {
            ...lesson,
            quiz: { ...lesson.quiz, question_limit: limit },
          };
        }

        const existingTexts = new Set(base.map((q) => q.question_text));
        const categoryTags = base.map((q) => q.category_tag || 'Umum');
        const extraNeeded = targetBankSize - base.length;
        const extras: Question[] = [];
        const courseCtx = `${course.title} ${course.category} ${lesson.quiz.title}`;

        for (let i = 0; i < extraNeeded; i += 1) {
          const tag = categoryTags[i % categoryTags.length];
          const orderIdx = base.length + i + 1;
          extras.push(
            generateOneBankQuestion(lesson.quiz.id, courseCtx, tag, orderIdx, existingTexts)
          );
        }

        return {
          ...lesson,
          quiz: {
            ...lesson.quiz,
            question_limit: limit,
            questions: [...base, ...extras],
          },
        };
      }),
    })),
  }));
}

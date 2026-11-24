export interface StarCompetencyCheck {
  id: string;
  label: string;
  section: 'situation' | 'task' | 'action' | 'result';
}

export interface StarScenario {
  id: string;
  title: string;
  competency: string;
  targetRole: string;
  difficulty: 'Pemula' | 'Menengah' | 'Lanjutan';
  recommendedMinutes: number;
  prompt: string;
  tips: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  checklist: StarCompetencyCheck[];
  sampleOutline: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
}

export interface StarAttemptRecord {
  id: string;
  user_id: string;
  scenario_id: string;
  scenario_title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  checked_items: string[];
  duration_seconds: number;
  word_count: number;
  completeness_score: number;
  created_at: string;
}

export const STAR_INTERVIEW_SCENARIOS: StarScenario[] = [
  {
    id: 'star-conflict-deadline',
    title: 'Konflik Tim & Tenggat Ketat',
    competency: 'Conflict Resolution & Collaboration',
    targetRole: 'Management Trainee / BUMN / Corporate',
    difficulty: 'Menengah',
    recommendedMinutes: 5,
    prompt:
      'Ceritakan pengalaman ketika Anda harus bekerja dengan rekan tim yang memiliki pendekatan berbeda di tengah tenggat waktu yang sangat ketat. Bagaimana Anda menyelesaikannya?',
    tips: {
      situation: 'Jelaskan konteks proyek, tenggat waktu, dan sumber perbedaan pendapat secara objektif tanpa menyalahkan pihak lain.',
      task: 'Tegaskan tanggung jawab spesifik Anda untuk menjaga kualitas dan ketepatan waktu tim.',
      action: 'Sebutkan langkah konkret (1-on-1, menyamakan metrik/prioritas, pembagian tugas ulang) yang Anda inisiasi.',
      result: 'Cantumkan hasil terukur (proyek selesai tepat waktu, peningkatan efisiensi, atau hubungan kerja yang membaik).',
    },
    checklist: [
      { id: 'c1', label: 'Konteks proyek & tenggat waktu disebutkan jelas', section: 'situation' },
      { id: 'c2', label: 'Peran pribadi (bukan hanya "kami") terdefinisi', section: 'task' },
      { id: 'c3', label: 'Ada langkah mediasi/komunikasi aktif yang diambil', section: 'action' },
      { id: 'c4', label: 'Dampak terukur (angka, waktu, atau feedback) disertakan', section: 'result' },
    ],
    sampleOutline: {
      situation: 'Saat persiapan peluncuran kampanye kampus H-5, divisi desain dan konten berbeda pendapat soal alur revisi materi.',
      task: 'Sebagai koordinator proyek, saya bertugas memastikan seluruh materi final disetujui 24 jam sebelum acara.',
      action: 'Saya mengadakan sinkronisasi 15 menit, menyepakati template standar, dan membagi PIC per kanal agar tidak tumpang tindih.',
      result: 'Materi selesai 12 jam lebih awal dari deadline dan tingkat partisipasi acara naik 28% dibanding tahun sebelumnya.',
    },
  },
  {
    id: 'star-crisis-problem-solving',
    title: 'Keputusan Cepat Saat Krisis Operasional',
    competency: 'Problem Solving & Agility',
    targetRole: 'Operations / Retail / Product',
    difficulty: 'Menengah',
    recommendedMinutes: 5,
    prompt:
      'Ceritakan situasi ketika rencana kerja Anda tiba-tiba terganggu oleh masalah tak terduga. Langkah apa yang Anda ambil untuk meminimalkan dampaknya?',
    tips: {
      situation: 'Gambarkan insiden tak terduga dan dampaknya terhadap pelanggan atau operasional.',
      task: 'Jelaskan target pemulihan yang harus Anda capai dalam waktu singkat.',
      action: 'Uraikan triase masalah, komunikasi ke stakeholder, dan solusi sementara maupun permanen.',
      result: 'Sertakan metrik pemulihan (SLA terpenuhi, keluhan turun, atau pencegahan terulang).',
    },
    checklist: [
      { id: 'c1', label: 'Akar masalah dan urgensi situasi tergambar', section: 'situation' },
      { id: 'c2', label: 'Target/SLA pemulihan dijelaskan', section: 'task' },
      { id: 'c3', label: 'Langkah mitigasi cepat & jangka panjang dijelaskan', section: 'action' },
      { id: 'c4', label: 'Hasil kuantitatif atau pembelajaran sistemik disebutkan', section: 'result' },
    ],
    sampleOutline: {
      situation: 'Pada hari promo besar, sistem kasir cabang mengalami sinkronisasi lambat saat antrean mencapai 25 pelanggan.',
      task: 'Saya harus menjaga waktu tunggu di bawah 5 menit agar pelanggan tidak membatalkan transaksi.',
      action: 'Saya mengaktifkan mode pencatatan cadangan terstruktur, memisahkan jalur pembayaran non-tunai, dan menugaskan 1 staf sebagai pengarah antrean.',
      result: 'Seluruh 140 transaksi tetap tercatat akurat, waktu tunggu rata-rata turun menjadi 3,5 menit, dan omzet harian melampaui target 12%.',
    },
  },
  {
    id: 'star-data-initiative',
    title: 'Inisiatif Perbaikan Berbasis Data',
    competency: 'Analytical Thinking & Initiative',
    targetRole: 'Data / Business Analyst / Finance',
    difficulty: 'Lanjutan',
    recommendedMinutes: 6,
    prompt:
      'Berikan contoh saat Anda menemukan pola masalah dari data atau laporan rutin, lalu mengusulkan perbaikan yang sebelumnya tidak diminta atasan Anda.',
    tips: {
      situation: 'Jelaskan proses awal yang Anda amati dan anomali data yang Anda temukan.',
      task: 'Nyatakan tujuan analisis dan perubahan proses yang ingin Anda dorong.',
      action: 'Paparkan cara Anda mengolah data, menyusun rekomendasi ringkas, dan meyakinkan tim.',
      result: 'Tunjukkan penghematan waktu, biaya, atau peningkatan akurasi dalam persentase/angka.',
    },
    checklist: [
      { id: 'c1', label: 'Anomali atau peluang dari data dijelaskan', section: 'situation' },
      { id: 'c2', label: 'Inisiatif pribadi di luar tugas rutin terlihat', section: 'task' },
      { id: 'c3', label: 'Metode analisis dan cara presentasi ke tim diuraikan', section: 'action' },
      { id: 'c4', label: 'Efisiensi/dampak bisnis terukur disampaikan', section: 'result' },
    ],
    sampleOutline: {
      situation: 'Saat merekap laporan mingguan, saya melihat 18% stok barang fast-moving sering kosong di akhir pekan.',
      task: 'Saya berinisiatif menyusun model reorder point sederhana tanpa mengganggu jadwal pelaporan utama.',
      action: 'Saya menganalisis histori penjualan 12 minggu di spreadsheet, membuat indikator stok minimum otomatis, dan memaparkannya ke supervisor.',
      result: 'Frekuensi stock-out turun dari 18% menjadi 4% dalam satu bulan dan waktu rekap mingguan berkurang 40 menit.',
    },
  },
  {
    id: 'star-leadership-influence',
    title: 'Memimpin Tanpa Otoritas Formal',
    competency: 'Leadership & Stakeholder Influence',
    targetRole: 'Project Lead / Fresh Graduate / Specialist',
    difficulty: 'Pemula',
    recommendedMinutes: 4,
    prompt:
      'Ceritakan pengalaman ketika Anda harus menggerakkan orang lain atau lintas tim yang bukan bawahan langsung Anda untuk mencapai satu tujuan bersama.',
    tips: {
      situation: 'Sebutkan proyek lintas fungsi dan tantangan menyelaraskan kepentingan tiap pihak.',
      task: 'Jelaskan hasil akhir yang menjadi tanggung jawab Anda.',
      action: 'Tekankan cara Anda membangun kesepakatan, mendengarkan kekhawatiran pihak lain, dan menjaga ritme tindak lanjut.',
      result: 'Sampaikan keberhasilan kolaborasi dan dampak positif bagi organisasi/tim.',
    },
    checklist: [
      { id: 'c1', label: 'Konteks lintas tim tanpa otoritas langsung jelas', section: 'situation' },
      { id: 'c2', label: 'Tujuan bersama yang ingin dicapai spesifik', section: 'task' },
      { id: 'c3', label: 'Strategi persuasi/komunikasi kolaboratif dijelaskan', section: 'action' },
      { id: 'c4', label: 'Capaian akhir & respon stakeholder disebutkan', section: 'result' },
    ],
    sampleOutline: {
      situation: 'Proyek digitalisasi arsip membutuhkan dukungan tim operasional dan IT yang masing-masing sedang padat tugas rutin.',
      task: 'Saya bertugas menyusun alur migrasi dokumen agar selesai dalam 3 minggu.',
      action: 'Saya memetakan manfaat langsung bagi beban kerja mereka, menyepakati slot 30 menit per minggu, dan menyiapkan template unggah yang mudah.',
      result: '100% dokumen prioritas berhasil dimigrasi tepat waktu dan waktu pencarian arsip berkurang dari 15 menit menjadi di bawah 1 menit.',
    },
  },
];

export interface StarCompletenessInput {
  situation: string;
  task: string;
  action: string;
  result: string;
  checkedCount?: number;
  totalChecklist?: number;
}

export function computeStarCompleteness(input: StarCompletenessInput): {
  wordCount: number;
  score: number;
  filledSections: number;
} {
  const sections = [input.situation, input.task, input.action, input.result].map((s) => s.trim());
  const filledSections = sections.filter((s) => s.length >= 20).length;
  const wordCount = sections
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;

  // Base 60% from 4 STAR boxes having substantive content, 20% from word count (>= 80 words), 20% from checklist
  const boxScore = (filledSections / 4) * 60;
  const lengthScore = Math.min(20, Math.round((wordCount / 80) * 20));
  const totalCheck = input.totalChecklist ?? 0;
  const checked = input.checkedCount ?? 0;
  const checkScore = totalCheck > 0 ? Math.round((checked / totalCheck) * 20) : 20;

  return {
    wordCount,
    score: Math.min(100, Math.round(boxScore + lengthScore + checkScore)),
    filledSections,
  };
}

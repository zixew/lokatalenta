export interface TypingPromptPreset {
  id: string;
  title: string;
  category: 'Indonesia' | 'English' | 'Angka & Data Entry';
  text: string;
}

export const TYPING_PROMPTS: TypingPromptPreset[] = [
  {
    id: 'id-karier-1',
    title: 'Administrasi & Layanan Pelanggan',
    category: 'Indonesia',
    text: 'Ketelitian dalam mencatat laporan harian sangat menentukan kelancaran operasional tim. Pastikan setiap angka transaksi, nama pelanggan, dan tanggal pengiriman diperiksa ulang sebelum disimpan ke sistem arsip digital perusahaan.',
  },
  {
    id: 'id-karier-2',
    title: 'Komunikasi Profesional & Rapat',
    category: 'Indonesia',
    text: 'Rapat koordinasi mingguan membahas target pencapaian kuartal ini, pembagian tugas antar divisi, serta tindak lanjut keluhan mitra strategis agar seluruh tenggat proyek dapat terpenuhi tepat waktu.',
  },
  {
    id: 'en-business-1',
    title: 'Business Email & Operations',
    category: 'English',
    text: 'Clear written communication helps cross-functional teams align on priorities, track deliverables, and resolve blockers quickly. Always review key figures and action items before sending a summary report to stakeholders.',
  },
  {
    id: 'num-data-1',
    title: 'Input Kode SKU, Tanggal & Nominal',
    category: 'Angka & Data Entry',
    text: 'INV-2026-0419 | Rp 1.450.000 | QTY: 24 | SKU-8831-B | 19/11/2026 | INV-2026-0420 | Rp 2.785.500 | QTY: 18 | SKU-9042-A | 20/11/2026 | TOTAL: Rp 4.235.500 | STATUS: LUNAS-100%',
  },
];

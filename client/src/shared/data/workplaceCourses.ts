import type { Course, Question } from '../types/lms';

function makeQuestions(
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

const OFFICE_ADMIN_QUESTIONS: Omit<Question, 'id' | 'quiz_id' | 'order_index'>[] = [
  // Excel
  {
    category_tag: 'Microsoft Excel',
    question_text:
      'Rumus Excel yang digunakan untuk menjumlahkan data pada rentang sel G2 sampai G15 adalah...',
    options: [
      { key: 'A', text: '=COUNT(G2:G15)' },
      { key: 'B', text: '=SUM(G2:G15)' },
      { key: 'C', text: '=AVERAGE(G2:G15)' },
      { key: 'D', text: '=TOTAL(G2:G15)' },
      { key: 'E', text: '=ADD(G2:G15)' },
    ],
    correct_option: 'B',
    explanation: 'Fungsi SUM digunakan untuk menjumlahkan seluruh angka dalam rentang sel.',
  },
  {
    category_tag: 'Microsoft Excel',
    question_text:
      'Jika sel C2 berisi Golongan ("A" atau "B"), manakah rumus yang tepat untuk menentukan Gaji Pokok Rp4.000.000 bagi Golongan A dan Rp3.000.000 bagi Golongan B?',
    options: [
      { key: 'A', text: '=IF(C2="A", 4000000, 3000000)' },
      { key: 'B', text: '=SUM(C2="A", 4000000, 3000000)' },
      { key: 'C', text: '=VLOOKUP(C2, 4000000, 3000000)' },
      { key: 'D', text: '=COUNTIF(C2, "A")' },
      { key: 'E', text: '=IF(C2=A; 3000000; 4000000)' },
    ],
    correct_option: 'A',
    explanation:
      'Fungsi IF menguji kondisi C2="A"; jika benar menghasilkan 4000000, jika salah menghasilkan 3000000.',
  },
  {
    category_tag: 'Microsoft Excel',
    question_text:
      'Pada rumus =VLOOKUP(C2, $F$2:$G$6, 2, FALSE), fungsi tanda dolar ($) pada $F$2:$G$6 adalah...',
    options: [
      { key: 'A', text: 'Mengubah format angka menjadi mata uang Dolar' },
      { key: 'B', text: 'Mengunci referensi tabel agar tidak bergeser saat rumus disalin ke bawah' },
      { key: 'C', text: 'Menghapus data duplikat di dalam tabel referensi' },
      { key: 'D', text: 'Mengurutkan tabel referensi dari A ke Z' },
      { key: 'E', text: 'Mengambil 2 karakter pertama dari sel C2' },
    ],
    correct_option: 'B',
    explanation:
      'Tanda $ (Absolute Reference) mengunci baris dan kolom tabel referensi agar tetap sama saat rumus ditarik ke sel lain.',
  },
  {
    category_tag: 'Microsoft Excel',
    question_text:
      'Fitur di Microsoft Excel yang berfungsi menahan baris judul (header) tabel agar tetap terlihat saat halaman digulir ke bawah adalah...',
    options: [
      { key: 'A', text: 'Wrap Text' },
      { key: 'B', text: 'Merge & Center' },
      { key: 'C', text: 'Freeze Panes' },
      { key: 'D', text: 'Conditional Formatting' },
      { key: 'E', text: 'Data Validation' },
    ],
    correct_option: 'C',
    explanation: 'Freeze Panes mengunci baris atau kolom tertentu agar tetap terlihat saat scroll.',
  },
  {
    category_tag: 'Microsoft Excel',
    question_text:
      'Untuk menghitung berapa kali kata "Lunas" muncul pada rentang sel D2:D50, rumus yang tepat adalah...',
    options: [
      { key: 'A', text: '=COUNT(D2:D50, "Lunas")' },
      { key: 'B', text: '=COUNTA(D2:D50)' },
      { key: 'C', text: '=COUNTIF(D2:D50, "Lunas")' },
      { key: 'D', text: '=SUMIF(D2:D50, "Lunas")' },
      { key: 'E', text: '=IF(D2:D50="Lunas")' },
    ],
    correct_option: 'C',
    explanation: 'COUNTIF menghitung jumlah sel yang memenuhi kriteria tertentu.',
  },
  // Word
  {
    category_tag: 'Microsoft Word',
    question_text:
      'Fungsi utama fitur Mail Merge pada Microsoft Word dalam pekerjaan administrasi adalah...',
    options: [
      { key: 'A', text: 'Menggabungkan dua file PDF menjadi satu dokumen' },
      { key: 'B', text: 'Membuat surat atau sertifikat massal secara otomatis dari sumber data Excel' },
      { key: 'C', text: 'Menghitung total angka di dalam tabel Word' },
      { key: 'D', text: 'Mengunci dokumen dengan kata sandi' },
      { key: 'E', text: 'Mengubah orientasi kertas menjadi Landscape' },
    ],
    correct_option: 'B',
    explanation:
      'Mail Merge menghubungkan template dokumen Word dengan daftar penerima (misal dari Excel) untuk menghasilkan dokumen massal secara otomatis.',
  },
  {
    category_tag: 'Microsoft Word',
    question_text:
      'Agar Microsoft Word dapat membuat Daftar Isi (Table of Contents) secara otomatis, judul tiap bab harus diberi gaya format...',
    options: [
      { key: 'A', text: 'Bold dan Underline manual' },
      { key: 'B', text: 'Heading 1, Heading 2, dan seterusnya' },
      { key: 'C', text: 'WordArt' },
      { key: 'D', text: 'Text Box' },
      { key: 'E', text: 'Bullet & Numbering' },
    ],
    correct_option: 'B',
    explanation: 'Daftar Isi otomatis membaca struktur gaya Heading 1, Heading 2, dst.',
  },
  {
    category_tag: 'Microsoft Word',
    question_text:
      'Tombol pintas (shortcut) di keyboard untuk meratakan teks rata kiri-kanan (Justify) pada dokumen resmi adalah...',
    options: [
      { key: 'A', text: 'Ctrl + L' },
      { key: 'B', text: 'Ctrl + E' },
      { key: 'C', text: 'Ctrl + R' },
      { key: 'D', text: 'Ctrl + J' },
      { key: 'E', text: 'Ctrl + B' },
    ],
    correct_option: 'D',
    explanation: 'Ctrl + J digunakan untuk Justify (rata kiri-kanan).',
  },
  // PowerPoint & Administrasi
  {
    category_tag: 'PowerPoint & Administrasi',
    question_text:
      'Untuk memastikan logo perusahaan dan footer tampil konsisten di seluruh slide presentasi tanpa perlu menempelkannya satu per satu, fitur yang digunakan di PowerPoint adalah...',
    options: [
      { key: 'A', text: 'Slide Transition' },
      { key: 'B', text: 'Slide Master' },
      { key: 'C', text: 'Animation Pane' },
      { key: 'D', text: 'SmartArt' },
      { key: 'E', text: 'Presenter View' },
    ],
    correct_option: 'B',
    explanation: 'Slide Master mengatur tata letak, font, logo, dan footer induk bagi seluruh slide.',
  },
  {
    category_tag: 'PowerPoint & Administrasi',
    question_text:
      'Lemari besi berlaci (umumnya 4 laci) yang digunakan di kantor untuk menyimpan arsip atau map gantung disebut...',
    options: [
      { key: 'A', text: 'Locker' },
      { key: 'B', text: 'Filling Cabinet' },
      { key: 'C', text: 'Ordner' },
      { key: 'D', text: 'Perforator' },
      { key: 'E', text: 'Numerator' },
    ],
    correct_option: 'B',
    explanation: 'Filling Cabinet adalah lemari berlaci khusus untuk penyimpanan arsip/map gantung.',
  },
  {
    category_tag: 'PowerPoint & Administrasi',
    question_text:
      'Dalam etika menerima telepon masuk dari mitra bisnis di kantor, langkah pertama yang paling profesional adalah...',
    options: [
      { key: 'A', text: 'Langsung bertanya "Ini dari siapa dan ada perlu apa?"' },
      { key: 'B', text: 'Mengucapkan salam, menyebutkan nama perusahaan/bagian, dan menawarkan bantuan' },
      { key: 'C', text: 'Meminta penelepon menunggu tanpa penjelasan' },
      { key: 'D', text: 'Mengangkat telepon lalu diam menunggu penelepon berbicara dulu' },
      { key: 'E', text: 'Meminta penelepon mengirim pesan teks saja' },
    ],
    correct_option: 'B',
    explanation:
      'Standar etika telepon kantor adalah salam, identitas perusahaan/unit kerja, dan menawarkan bantuan dengan ramah.',
  },
  {
    category_tag: 'PowerPoint & Administrasi',
    question_text:
      'Alat kantor yang digunakan untuk melubangi kertas sebelum dimasukkan ke dalam map ordner disebut...',
    options: [
      { key: 'A', text: 'Stapler' },
      { key: 'B', text: 'Perforator' },
      { key: 'C', text: 'Paper Clip' },
      { key: 'D', text: 'Cutter' },
      { key: 'E', text: 'Binder' },
    ],
    correct_option: 'B',
    explanation: 'Perforator adalah alat pelubang kertas untuk keperluan pengarsipan.',
  },
];

const EXCEL_DRILL_QUESTIONS: Omit<Question, 'id' | 'quiz_id' | 'order_index'>[] = [
  ...OFFICE_ADMIN_QUESTIONS.slice(0, 5),
  {
    category_tag: 'Microsoft Excel',
    question_text:
      'Fungsi =COUNTA(A1:A10) berbeda dengan =COUNT(A1:A10) karena COUNTA menghitung...',
    options: [
      { key: 'A', text: 'Hanya sel yang berisi angka saja' },
      { key: 'B', text: 'Semua sel yang tidak kosong (baik teks maupun angka)' },
      { key: 'C', text: 'Hanya sel yang kosong' },
      { key: 'D', text: 'Rata-rata seluruh angka' },
      { key: 'E', text: 'Nilai tertinggi di rentang sel' },
    ],
    correct_option: 'B',
    explanation: 'COUNT hanya menghitung sel berisi angka, sedangkan COUNTA menghitung semua sel yang terisi.',
  },
  {
    category_tag: 'Microsoft Excel',
    question_text:
      'Jika sel A2 berisi kode produk "IDM-2026-SNK", rumus untuk mengambil 3 huruf pertama ("IDM") adalah...',
    options: [
      { key: 'A', text: '=RIGHT(A2, 3)' },
      { key: 'B', text: '=LEFT(A2, 3)' },
      { key: 'C', text: '=MID(A2, 3, 1)' },
      { key: 'D', text: '=LEN(A2)' },
      { key: 'E', text: '=TRIM(A2)' },
    ],
    correct_option: 'B',
    explanation: 'LEFT(teks, jumlah_karakter) mengambil karakter dari sisi paling kiri.',
  },
  {
    category_tag: 'Microsoft Excel',
    question_text:
      'Untuk menjumlahkan total penjualan KHUSUS kategori "Minuman" dari kolom B (kategori) dan kolom C (nilai penjualan), rumus yang tepat adalah...',
    options: [
      { key: 'A', text: '=SUM(B2:B20, "Minuman", C2:C20)' },
      { key: 'B', text: '=SUMIF(B2:B20, "Minuman", C2:C20)' },
      { key: 'C', text: '=COUNTIF(B2:B20, "Minuman")' },
      { key: 'D', text: '=VLOOKUP("Minuman", B2:C20, 2, FALSE)' },
      { key: 'E', text: '=AVERAGEIF(B2:B20, "Minuman")' },
    ],
    correct_option: 'B',
    explanation: 'SUMIF(rentang_kriteria, kriteria, rentang_jumlah) menjumlahkan nilai berdasarkan syarat tertentu.',
  },
  {
    category_tag: 'Microsoft Excel',
    question_text:
      'Fitur di Excel yang digunakan untuk meringkas ratusan baris data transaksi menjadi tabel rekap per cabang atau per bulan secara cepat tanpa menulis rumus manual adalah...',
    options: [
      { key: 'A', text: 'Goal Seek' },
      { key: 'B', text: 'PivotTable' },
      { key: 'C', text: 'Text to Columns' },
      { key: 'D', text: 'Page Break' },
      { key: 'E', text: 'Flash Fill' },
    ],
    correct_option: 'B',
    explanation: 'PivotTable adalah fitur utama Excel untuk meringkas dan menganalisis data besar secara instan.',
  },
  {
    category_tag: 'Microsoft Excel',
    question_text:
      'Pesan error "#N/A" yang muncul pada rumus VLOOKUP biasanya menandakan...',
    options: [
      { key: 'A', text: 'Terjadi pembagian dengan angka nol' },
      { key: 'B', text: 'Data yang dicari tidak ditemukan di kolom pertama tabel referensi' },
      { key: 'C', text: 'Lebar kolom terlalu sempit untuk menampilkan angka' },
      { key: 'D', text: 'Nama fungsi salah eja' },
      { key: 'E', text: 'File Excel belum disimpan' },
    ],
    correct_option: 'B',
    explanation: '#N/A (Not Available) berarti nilai pencarian tidak cocok dengan data mana pun di tabel referensi.',
  },
];

const CS_COMMS_QUESTIONS: Omit<Question, 'id' | 'quiz_id' | 'order_index'>[] = [
  {
    category_tag: 'Customer Service',
    question_text:
      'Saat menghadapi pelanggan yang marah karena barang yang dibelinya rusak, langkah pertama dalam teknik de-eskalasi adalah...',
    options: [
      { key: 'A', text: 'Langsung memotong pembicaraan pelanggan untuk menjelaskan kebijakan toko' },
      { key: 'B', text: 'Mendengarkan keluhan secara aktif tanpa menyela, lalu menyampaikan empati dan permintaan maaf yang tulus' },
      { key: 'C', text: 'Meminta pelanggan menurunkan suaranya terlebih dahulu dengan nada tegas' },
      { key: 'D', text: 'Menyalahkan pihak ekspedisi atau supplier' },
      { key: 'E', text: 'Meninggalkan meja layanan untuk memanggil keamanan' },
    ],
    correct_option: 'B',
    explanation:
      'Active listening dan empati meredakan emosi pelanggan sebelum solusi teknis ditawarkan.',
  },
  {
    category_tag: 'Customer Service',
    question_text:
      'Apa yang dimaksud dengan "Active Listening" saat melayani pelanggan atau berdiskusi dengan rekan kerja?',
    options: [
      { key: 'A', text: 'Sambil mendengarkan sambil membalas pesan di ponsel' },
      { key: 'B', text: 'Fokus penuh pada pembicara, memahami inti masalah, dan mengonfirmasi ulang poin penting' },
      { key: 'C', text: 'Menyiapkan argumen balasan sebelum lawan bicara selesai menjelaskan' },
      { key: 'D', text: 'Mengangguk saja tanpa memahami isi pembicaraan' },
      { key: 'E', text: 'Berbicara lebih banyak daripada pelanggan' },
    ],
    correct_option: 'B',
    explanation: 'Active listening menuntut perhatian penuh dan konfirmasi agar tidak terjadi salah paham.',
  },
  {
    category_tag: 'Komunikasi Profesional',
    question_text:
      'Saat mengirim email lamaran kerja atau laporan resmi kepada atasan, bagian "Subject" (Subjek Email) sebaiknya...',
    options: [
      { key: 'A', text: 'Dikosongkan saja agar penerima penasaran membukanya' },
      { key: 'B', text: 'Diisi singkat, jelas, dan spesifik mencerminkan isi email' },
      { key: 'C', text: 'Ditulis seluruhnya dengan huruf kapital dan banyak tanda seru' },
      { key: 'D', text: 'Berisi seluruh isi pesan yang panjang' },
      { key: 'E', text: 'Diisi kata "Urgent" meskipun tidak mendesak' },
    ],
    correct_option: 'B',
    explanation: 'Subjek email yang jelas dan spesifik memudahkan penerima memprioritaskan dan mencari email.',
  },
  {
    category_tag: 'Komunikasi Profesional',
    question_text:
      'Dalam wawancara kerja dengan metode STAR (Situation, Task, Action, Result), bagian "Action" sebaiknya berfokus pada...',
    options: [
      { key: 'A', text: 'Langkah konkret yang Anda lakukan sendiri untuk menyelesaikan masalah' },
      { key: 'B', text: 'Kesalahan rekan kerja lain yang menyebabkan masalah' },
      { key: 'C', text: 'Deskripsi panjang tentang profil perusahaan sebelumnya' },
      { key: 'D', text: 'Rencana liburan Anda setelah diterima kerja' },
      { key: 'E', text: 'Hanya menceritakan pencapaian orang lain di tim' },
    ],
    correct_option: 'A',
    explanation: 'Pewawancara ingin mengetahui kontribusi nyata dan langkah konkret yang Anda ambil.',
  },
  {
    category_tag: 'Customer Service',
    question_text:
      'Jika Anda belum mengetahui jawaban atas pertanyaan teknis seorang pelanggan, respons yang paling profesional adalah...',
    options: [
      { key: 'A', text: 'Mengarang jawaban agar terlihat menguasai produk' },
      { key: 'B', text: 'Mengatakan "Saya tidak tahu, silakan tanya ke cabang lain"' },
      { key: 'C', text: 'Mengucapkan terima kasih, jujur bahwa Anda akan memastikannya kepada tim terkait, dan memberikan estimasi waktu kabar kembali' },
      { key: 'D', text: 'Mengalihkan pembicaraan ke produk promo lain' },
      { key: 'E', text: 'Membiarkan pelanggan menunggu tanpa kepastian' },
    ],
    correct_option: 'C',
    explanation: 'Kejujuran disertai komitmen tindak lanjut dan estimasi waktu menjaga kepercayaan pelanggan.',
  },
  {
    category_tag: 'Komunikasi Profesional',
    question_text:
      'Perbedaan fungsi kolom "CC" dan "BCC" pada email bisnis adalah...',
    options: [
      { key: 'A', text: 'CC menyembunyikan alamat penerima, BCC menampilkannya ke semua orang' },
      { key: 'B', text: 'CC menampilkan alamat penerima salinan ke semua orang, sedangkan BCC menyembunyikan alamat penerima tersebut dari penerima lain' },
      { key: 'C', text: 'CC hanya untuk file gambar, BCC untuk file PDF' },
      { key: 'D', text: 'Tidak ada perbedaan di antara keduanya' },
      { key: 'E', text: 'BCC hanya bisa digunakan untuk mengirim email ke atasan' },
    ],
    correct_option: 'B',
    explanation:
      'BCC (Blind Carbon Copy) menjaga privasi daftar alamat email penerima agar tidak terlihat satu sama lain.',
  },
];

const BUSINESS_ENGLISH_QUESTIONS: Omit<Question, 'id' | 'quiz_id' | 'order_index'>[] = [
  {
    category_tag: 'Business English',
    question_text:
      'Kalimat pembuka email bisnis yang paling sopan dan profesional kepada rekan kerja atau klien baru adalah...',
    options: [
      { key: 'A', text: 'Hey buddy, what is up?' },
      { key: 'B', text: 'Dear Mr. Andi, I hope this email finds you well.' },
      { key: 'C', text: 'Yo Andi, read this fast!' },
      { key: 'D', text: 'Give me the report now.' },
      { key: 'E', text: 'To whoever cares,' },
    ],
    correct_option: 'B',
    explanation: '"Dear [Title + Name], I hope this email finds you well" adalah salam pembuka formal standar bisnis.',
  },
  {
    category_tag: 'Business English',
    question_text:
      'Istilah "Attached please find the monthly sales report" dalam email bisnis berarti...',
    options: [
      { key: 'A', text: 'Laporan penjualan bulanan masih belum selesai' },
      { key: 'B', text: 'Terlampir bersama email ini adalah laporan penjualan bulanan' },
      { key: 'C', text: 'Mohon hapus laporan penjualan bulan lalu' },
      { key: 'D', text: 'Rapat penjualan bulanan dibatalkan' },
      { key: 'E', text: 'Tolong kirimkan laporan penjualan Anda' },
    ],
    correct_option: 'B',
    explanation: '"Attached" berarti terlampir bersama email tersebut.',
  },
  {
    category_tag: 'Business English',
    question_text:
      'Jika Anda ingin menjadwal ulang rapat ke hari Kamis pukul 10.00 karena bentrok agenda, kalimat yang paling tepat adalah...',
    options: [
      { key: 'A', text: 'I cannot come today, bye.' },
      { key: 'B', text: 'Could we possibly reschedule our meeting to Thursday at 10:00 AM?' },
      { key: 'C', text: 'Change the meeting to Thursday!' },
      { key: 'D', text: 'I forgot we have a meeting.' },
      { key: 'E', text: 'You must wait until Thursday.' },
    ],
    correct_option: 'B',
    explanation: 'Penggunaan "Could we possibly reschedule..." terdengar sopan, kolaboratif, dan profesional.',
  },
  {
    category_tag: 'Business English',
    question_text:
      'Dalam korespondensi kantor, singkatan "ASAP" merupakan kependekan dari...',
    options: [
      { key: 'A', text: 'Always Stay At Place' },
      { key: 'B', text: 'As Soon As Possible' },
      { key: 'C', text: 'After Sunday Afternoon Party' },
      { key: 'D', text: 'All Staff Are Present' },
      { key: 'E', text: 'Ask Someone About Project' },
    ],
    correct_option: 'B',
    explanation: 'ASAP berarti "As Soon As Possible" (sesegera mungkin).',
  },
  {
    category_tag: 'Business English',
    question_text:
      'Penutup email formal yang paling tepat sebelum menuliskan nama Anda adalah...',
    options: [
      { key: 'A', text: 'See ya,' },
      { key: 'B', text: 'Best regards,' },
      { key: 'C', text: 'Good luck bro,' },
      { key: 'D', text: 'Whatever,' },
      { key: 'E', text: 'Talk later,' },
    ],
    correct_option: 'B',
    explanation: '"Best regards," atau "Sincerely," adalah penutup standar profesional.',
  },
];

export const WORKPLACE_COURSES: Course[] = [
  // KURSUS TERSTRUKTUR 2: MICROSOFT OFFICE & ADMINISTRASI
  {
    id: 'course-office-admin',
    teacher_id: 'demo-teacher-1',
    teacher_name: 'Rizco Renova',
    title: 'Microsoft Excel, Word & Administrasi Perkantoran Modern',
    slug: 'microsoft-office-administrasi-perkantoran',
    description:
      'Kuasai rumus Excel yang paling sering diuji perusahaan (IF, VLOOKUP, SUMIF, COUNTIF, PivotTable), format surat resmi & Mail Merge di Word, Slide Master PowerPoint, serta tata kelola arsip kantor.',
    category: 'Microsoft Office & Admin',
    level: 'Pemula',
    estimated_hours: 3.5,
    is_published: true,
    modules: [
      {
        id: 'mod-off-1',
        course_id: 'course-office-admin',
        title: 'Modul 1: Microsoft Excel untuk Pengolahan Data Kerja',
        order_index: 1,
        lessons: [
          {
            id: 'les-off-1',
            module_id: 'mod-off-1',
            title: 'Rumus Wajib Staf Admin: SUM, IF, COUNTIF & SUMIF',
            type: 'article',
            duration_minutes: 12,
            order_index: 1,
            content: `Hampir seluruh tes praktek komputer untuk posisi Staf Administrasi, Finance, Operasional, dan Kasir menguji penguasaan rumus dasar berikut:

1. Agregasi Dasar:
• =SUM(G2:G15) → menjumlahkan seluruh angka pada rentang sel.
• =AVERAGE(G2:G15) → mencari nilai rata-rata.
• =COUNT(A2:A15) vs =COUNTA(A2:A15) → COUNT hanya menghitung sel berisi angka, sedangkan COUNTA menghitung semua sel yang tidak kosong (termasuk teks).

2. Logika Kondisional (IF):
• =IF(C2="A", 4000000, 3000000) → Jika sel C2 bernilai "A", hasilnya 4.000.000; jika bukan, hasilnya 3.000.000.

3. Rekap Bersyarat (COUNTIF & SUMIF):
• =COUNTIF(D2:D50, "Lunas") → menghitung berapa baris yang bertuliskan "Lunas".
• =SUMIF(B2:B20, "Minuman", C2:C20) → menjumlahkan nilai di kolom C khusus untuk baris yang kolom B-nya bertuliskan "Minuman".`,
          },
          {
            id: 'les-off-2',
            module_id: 'mod-off-1',
            title: 'Menguasai VLOOKUP, Referensi Absolut ($) & PivotTable',
            type: 'article',
            duration_minutes: 12,
            order_index: 2,
            content: `Saat Anda diminta menggabungkan dua tabel (misal mengambil Tunjangan atau Nama Barang dari tabel referensi), rumus andalannya adalah VLOOKUP:

=VLOOKUP(nilai_yang_dicari, tabel_referensi, nomor_kolom_hasil, FALSE)

Poin penting yang sering membuat peserta tes gagal:
• Selalu gunakan tanda dolar ($) pada tabel referensi, contoh: $F$2:$G$6. Tujuannya agar posisi tabel tidak bergeser saat rumus ditarik/disalin ke bawah.
• Selalu isi argumen terakhir dengan FALSE (atau 0) agar Excel mencari kecocokan persis.
• Jika muncul error #N/A, artinya data yang dicari tidak ada di kolom pertama tabel referensi.
• Gunakan Freeze Panes (menu View) untuk mengunci baris judul tabel agar tetap terlihat saat digulir, serta PivotTable untuk meringkas ribuan transaksi dalam hitungan detik.`,
          },
          {
            id: 'les-off-1-quiz',
            module_id: 'mod-off-1',
            title: 'Latihan Modul 1: Rumus & Fitur Microsoft Excel',
            type: 'quiz',
            duration_minutes: 10,
            order_index: 3,
            content:
              'Latihan ini menguji pemahaman Anda tentang rumus SUM, IF, COUNTIF, referensi absolut $ pada VLOOKUP, dan Freeze Panes yang dibahas di Modul 1.',
            quiz: {
              id: 'quiz-mod-off-1',
              lesson_id: 'les-off-1-quiz',
              title: 'Latihan Modul 1 — Rumus Microsoft Excel',
              description:
                'Capai skor minimal 70% untuk melanjutkan ke Modul 2.',
              duration_minutes: 10,
              passing_score: 70,
              use_subtests: false,
              questions: makeQuestions('quiz-mod-off-1', OFFICE_ADMIN_QUESTIONS.slice(0, 5)),
            },
          },
        ],
      },
      {
        id: 'mod-off-2',
        course_id: 'course-office-admin',
        title: 'Modul 2: Microsoft Word, PowerPoint & Administrasi Kantor',
        order_index: 2,
        lessons: [
          {
            id: 'les-off-3',
            module_id: 'mod-off-2',
            title: 'Standar Surat Resmi, Mail Merge & Daftar Isi Otomatis',
            type: 'article',
            duration_minutes: 10,
            order_index: 1,
            content: `Kerapian dokumen mencerminkan ketelitian seorang staf administrasi. Berikut standar yang paling sering dinilai:

• Margin Surat Resmi (Page Setup): Umumnya Kiri 4 cm, Atas/Kanan/Bawah 3 cm, menggunakan rata kiri-kanan (Justify / Ctrl + J).
• Mail Merge: Fitur untuk membuat surat undangan, surat tugas, atau sertifikat massal secara otomatis dengan menarik daftar nama & alamat dari file Excel.
• Daftar Isi Otomatis: Gunakan gaya teks Heading 1 untuk judul bab dan Heading 2 untuk sub-bab, lalu sisipkan Table of Contents dari menu References.`,
          },
          {
            id: 'les-off-4',
            module_id: 'mod-off-2',
            title: 'Slide Master PowerPoint, Pengarsipan & Etika Telepon Kantor',
            type: 'article',
            duration_minutes: 10,
            order_index: 2,
            content: `• Slide Master (PowerPoint): Gunakan Slide Master agar logo perusahaan, jenis huruf, dan footer tampil seragam di seluruh slide tanpa menyalin manual.
• Pengelolaan Arsip: Gunakan Perforator untuk melubangi dokumen sebelum disimpan ke dalam map Ordner, dan simpan berkas folder gantung ke dalam Filling Cabinet.
• Etika Telepon Bisnis: Saat mengangkat telepon masuk, ucapkan salam terlebih dahulu, sebutkan nama perusahaan/unit kerja, dan tawarkan bantuan dengan ramah dan jelas.`,
          },
          {
            id: 'les-off-2-quiz',
            module_id: 'mod-off-2',
            title: 'Latihan Modul 2: Word, PowerPoint & Administrasi Kantor',
            type: 'quiz',
            duration_minutes: 10,
            order_index: 3,
            content:
              'Latihan ini menguji pemahaman Anda tentang Mail Merge, Heading, Ctrl+J, Slide Master, Filling Cabinet, dan etika telepon dari Modul 2.',
            quiz: {
              id: 'quiz-mod-off-2',
              lesson_id: 'les-off-2-quiz',
              title: 'Latihan Modul 2 — Word, PowerPoint & Administrasi',
              description:
                'Capai skor minimal 70% untuk melanjutkan ke Modul 3.',
              duration_minutes: 10,
              passing_score: 70,
              use_subtests: false,
              questions: makeQuestions('quiz-mod-off-2', OFFICE_ADMIN_QUESTIONS.slice(5, 11)),
            },
          },
        ],
      },
      {
        id: 'mod-off-3',
        course_id: 'course-office-admin',
        title: 'Modul 3: Evaluasi Akhir Office & Administrasi',
        order_index: 3,
        lessons: [
          {
            id: 'les-off-quiz',
            module_id: 'mod-off-3',
            title: 'Evaluasi Akhir: Microsoft Office & Administrasi (12 Soal)',
            type: 'quiz',
            duration_minutes: 25,
            order_index: 1,
            content:
              'Uji pemahaman Anda mengenai rumus Microsoft Excel, fitur Word, PowerPoint, dan administrasi perkantoran.',
            quiz: {
              id: 'quiz-evaluasi-office',
              lesson_id: 'les-off-quiz',
              title: 'Evaluasi Akhir — Microsoft Office & Administrasi',
              description:
                'Terdiri dari 12 soal terbagi dalam 3 bagian (Microsoft Excel, Microsoft Word, dan PowerPoint & Administrasi).',
              duration_minutes: 25,
              passing_score: 70,
              use_subtests: true,
              questions: makeQuestions('quiz-evaluasi-office', OFFICE_ADMIN_QUESTIONS),
            },
          },
        ],
      },
    ],
  },

  // KURSUS TERSTRUKTUR 3: CUSTOMER SERVICE & KOMUNIKASI PROFESIONAL
  {
    id: 'course-cs-komunikasi',
    teacher_id: 'demo-teacher-1',
    teacher_name: 'Rizco Renova',
    title: 'Customer Service Excellence & Komunikasi Profesional',
    slug: 'customer-service-komunikasi-profesional',
    description:
      'Pelajari teknik melayani pelanggan dengan empati, menangani keluhan secara tenang (de-eskalasi), etika email bisnis, serta metode STAR untuk wawancara kerja.',
    category: 'Komunikasi & Pelayanan',
    level: 'Pemula',
    estimated_hours: 2.0,
    is_published: true,
    modules: [
      {
        id: 'mod-cs-1',
        course_id: 'course-cs-komunikasi',
        title: 'Modul 1: Pelayanan Pelanggan & Penanganan Keluhan',
        order_index: 1,
        lessons: [
          {
            id: 'les-cs-1',
            module_id: 'mod-cs-1',
            title: 'Active Listening, Empati & Teknik Meredakan Keluhan',
            type: 'article',
            duration_minutes: 10,
            order_index: 1,
            content: `Baik di industri ritel, perbankan, maupun layanan pelanggan korporasi, menghadapi komplain adalah bagian dari tugas sehari-hari.

Gunakan kerangka 4 langkah berikut saat menghadapi pelanggan yang kecewa:
1. Active Listening: Dengarkan penuh tanpa menyela. Biarkan pelanggan merasa didengar dan dihargai.
2. Empati & Permintaan Maaf: Sampaikan permohonan maaf atas ketidaknyamanan yang dialami tanpa menyalahkan rekan kerja atau departemen lain.
3. Klarifikasi & Solusi Konkret: Konfirmasi ulang inti masalahnya dan tawarkan solusi sesuai prosedur yang berlaku.
4. Tindak Lanjut Jelas: Jika perlu eskalasi ke tim lain, berikan estimasi waktu yang pasti kapan pelanggan akan mendapat kabar.`,
          },
          {
            id: 'les-cs-2',
            module_id: 'mod-cs-1',
            title: 'Etika Email Bisnis & Teknik Wawancara STAR',
            type: 'article',
            duration_minutes: 10,
            order_index: 2,
            content: `• Etika Email: Selalu isi Subject (subjek) secara singkat dan spesifik. Pahami perbedaan CC (salinan terbuka) dan BCC (salinan tersembunyi untuk menjaga privasi daftar alamat penerima).
• Metode STAR dalam Wawancara Kerja: Saat diminta menceritakan pengalaman menyelesaikan masalah, susun jawaban secara berurutan: Situation (konteks), Task (tanggung jawab Anda), Action (langkah nyata yang Anda lakukan), dan Result (hasil terukur yang dicapai).`,
          },
          {
            id: 'les-cs-1-quiz',
            module_id: 'mod-cs-1',
            title: 'Latihan Modul 1: Pelayanan Pelanggan & Komunikasi',
            type: 'quiz',
            duration_minutes: 10,
            order_index: 3,
            content:
              'Latihan ini menguji pemahaman Anda tentang langkah de-eskalasi keluhan, active listening, etika email CC/BCC, dan metode STAR dari Modul 1.',
            quiz: {
              id: 'quiz-mod-cs-1',
              lesson_id: 'les-cs-1-quiz',
              title: 'Latihan Modul 1 — Pelayanan & Komunikasi',
              description:
                'Capai skor minimal 70% untuk membuka Evaluasi Akhir.',
              duration_minutes: 10,
              passing_score: 70,
              use_subtests: false,
              questions: makeQuestions('quiz-mod-cs-1', CS_COMMS_QUESTIONS.slice(0, 4)),
            },
          },
        ],
      },
      {
        id: 'mod-cs-2',
        course_id: 'course-cs-komunikasi',
        title: 'Modul 2: Evaluasi Studi Kasus Pelayanan & Komunikasi',
        order_index: 2,
        lessons: [
          {
            id: 'les-cs-quiz',
            module_id: 'mod-cs-2',
            title: 'Evaluasi: Studi Kasus Customer Service & Komunikasi (6 Soal)',
            type: 'quiz',
            duration_minutes: 15,
            order_index: 1,
            content:
              'Uji pemahaman Anda melalui studi kasus nyata pelayanan pelanggan dan komunikasi profesional.',
            quiz: {
              id: 'quiz-evaluasi-cs',
              lesson_id: 'les-cs-quiz',
              title: 'Evaluasi — Customer Service & Komunikasi',
              description:
                '6 soal studi kasus seputar penanganan komplain, etika email, dan wawancara kerja.',
              duration_minutes: 15,
              passing_score: 70,
              use_subtests: false,
              questions: makeQuestions('quiz-evaluasi-cs', CS_COMMS_QUESTIONS),
            },
          },
        ],
      },
    ],
  },

  // LATIHAN LANGSUNG 2: RUMUS & STUDI KASUS EXCEL (TANPA SUBTEST)
  {
    id: 'course-latihan-excel',
    teacher_id: 'demo-teacher-1',
    teacher_name: 'Rizco Renova',
    title: 'Latihan Soal: Rumus & Studi Kasus Microsoft Excel',
    slug: 'latihan-soal-microsoft-excel',
    description:
      'Latihan soal langsung untuk menguji penguasaan rumus Excel dunia kerja: SUM, IF, VLOOKUP, COUNTIF, SUMIF, LEFT, COUNTA, Freeze Panes, dan PivotTable.',
    category: 'Latihan Langsung',
    level: 'Semua Level',
    estimated_hours: 0.5,
    is_published: true,
    modules: [
      {
        id: 'mod-lex-1',
        course_id: 'course-latihan-excel',
        title: 'Latihan Excel',
        order_index: 1,
        lessons: [
          {
            id: 'les-lex-quiz',
            module_id: 'mod-lex-1',
            title: 'Latihan Soal Microsoft Excel (10 Soal)',
            type: 'quiz',
            duration_minutes: 20,
            order_index: 1,
            content: '10 soal pilihan ganda seputar rumus dan fitur utama Microsoft Excel.',
            quiz: {
              id: 'quiz-latihan-excel',
              lesson_id: 'les-lex-quiz',
              title: 'Latihan Soal Microsoft Excel (10 Soal)',
              description:
                'Uji penguasaan rumus Excel yang paling sering muncul di tes kerja Staf Admin, Finance, dan Operasional.',
              duration_minutes: 20,
              passing_score: 70,
              use_subtests: false,
              questions: makeQuestions('quiz-latihan-excel', EXCEL_DRILL_QUESTIONS),
            },
          },
        ],
      },
    ],
  },

  // LATIHAN LANGSUNG 3: BAHASA INGGRIS BISNIS (TANPA SUBTEST)
  {
    id: 'course-latihan-english',
    teacher_id: 'demo-teacher-1',
    teacher_name: 'Rizco Renova',
    title: 'Latihan Soal: Bahasa Inggris Bisnis & Email Kerja',
    slug: 'latihan-soal-bahasa-inggris-bisnis',
    description:
      'Latihan soal langsung untuk melatih pemahaman korespondensi email profesional, penjadwalan rapat, dan istilah umum dunia kerja dalam bahasa Inggris.',
    category: 'Latihan Langsung',
    level: 'Pemula',
    estimated_hours: 0.5,
    is_published: true,
    modules: [
      {
        id: 'mod-len-1',
        course_id: 'course-latihan-english',
        title: 'Latihan Business English',
        order_index: 1,
        lessons: [
          {
            id: 'les-len-quiz',
            module_id: 'mod-len-1',
            title: 'Latihan Bahasa Inggris Bisnis (5 Soal)',
            type: 'quiz',
            duration_minutes: 15,
            order_index: 1,
            content: '5 soal praktis seputar korespondensi bisnis dalam bahasa Inggris.',
            quiz: {
              id: 'quiz-latihan-english',
              lesson_id: 'les-len-quiz',
              title: 'Latihan Bahasa Inggris Bisnis',
              description: 'Uji pemahaman email formal, frasa rapat, dan istilah kantor.',
              duration_minutes: 15,
              passing_score: 70,
              use_subtests: false,
              questions: makeQuestions('quiz-latihan-english', BUSINESS_ENGLISH_QUESTIONS),
            },
          },
        ],
      },
    ],
  },
];

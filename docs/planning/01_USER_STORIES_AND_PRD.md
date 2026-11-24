# Product Requirements Document (PRD) & User Stories (`v1.10.0` → `v2.0.0`)

**Produk:** LokaTalenta — Akademi Bahasa, Simulasi Psikotes & Kesiapan Karier  
**Baseline Versi Saat Ini:** `v1.9.1`  
**Target Rilis:** Sprint 7 (`v1.10.0` Minor) s.d. Sprint 10 (`v2.0.0` Major)

---

## 1. Ringkasan Eksekutif & Tujuan Produk
Hingga `v1.9.1`, LokaTalenta telah memiliki katalog 120+ program, Course Player interaktif (Flashcard, Audio, Kanji Canvas, Quick Check, Catatan Pribadi), Simulasi Psikotes CAT, Simulator Kraepelin/Pauli, Tryout Akbar, Komunitas, Teacher Studio (Bulk CSV + Analitik), serta Admin Panel (Moderasi + Audit Log).

Tahap pengembangan berikutnya (**Sprint 7 s.d. Sprint 10**) berfokus pada:
1. **Cloud Persistence penuh di Supabase** untuk seluruh data belajar personal (catatan materi, target karier/XP, posisi materi terakhir, dan audit log admin) agar tersinkron lintas perangkat.
2. **Kompetisi Multi-User & Adaptive Drill** (Duel 1v1 tersimpan di database & latihan adaptif otomatis pada subtest terlemah).
3. **Kemudahan Authoring Pengajar** (Update soal in-place di database & duplikasi paket kuis).
4. **Lompatan Major `v2.0.0` (Talent Readiness Passport)**: Portofolio kesiapan karier publik (`/talent/:code`) yang merangkum sertifikat terverifikasi, skor psikotes per dimensi, dan grafik ketahanan Kraepelin untuk ditinjau langsung oleh HR/perekrut.

---

## 2. Daftar User Stories & Acceptance Criteria

### A. Epik 1 — Cloud Sync Personalisasi & Catatan Belajar (`Sprint 7` • `v1.10.0` Minor)

#### `US-21` (BL-21): Sinkronisasi Catatan Materi Lintas Perangkat
- **User Story:** *Sebagai **Pelajar**, saya ingin catatan pribadi di setiap materi tersimpan di akun cloud saya (bukan hanya di browser lokal), sehingga ketika saya berganti perangkat (HP ke laptop), catatan saya tetap tersedia.*
- **Acceptance Criteria:**
  - **Given** pelajar sudah login dan membuka materi bacaan/video di Course Player,
  - **When** pelajar menuliskan catatan dan menekan **Simpan Catatan**,
  - **Then** catatan tersimpan ke tabel `public.lesson_notes` di Supabase (dengan fallback `localStorage` saat offline) dan otomatis termuat saat dibuka di perangkat lain.

#### `US-22` (BL-22): Sinkronisasi Target Karier, Target XP Harian & Resume Materi di Profil Cloud
- **User Story:** *Sebagai **Pelajar**, saya ingin pilihan jalur karier (`BUMN & CPNS`, `Psikotes`, `Bahasa`), target XP harian (`30/60/100 XP`), dan materi terakhir yang dibuka tersimpan di profil akun saya, sehingga rekomendasi belajar selalu konsisten di semua perangkat.*
- **Acceptance Criteria:**
  - **Given** pelajar memilih jalur karier atau membuka materi ke-N di sebuah kursus,
  - **When** pelajar login di sesi/perangkat baru,
  - **Then** jalur karier, target XP harian, dan tombol **Lanjutkan Materi Terakhir** langsung menampilkan posisi terakhir dari tabel `public.user_study_preferences`.

#### `US-23` (BL-23): Ekspor Ringkasan Catatan Belajar Kursus (Markdown / Cetak)
- **User Story:** *Sebagai **Pelajar**, saya ingin mengunduh atau mencetak seluruh kumpulan catatan pribadi saya dalam satu kursus, sehingga saya bisa mengulas rangkuman materi menjelang hari ujian.*
- **Acceptance Criteria:**
  - **Given** pelajar memiliki minimal 1 catatan materi pada suatu kursus,
  - **When** pelajar menekan tombol **Unduh Semua Catatan Kursus (.md)** di Course Player,
  - **Then** file ringkasan berisi judul modul, judul materi, dan isi catatan berhasil terunduh.

#### `US-23B` (BL-23B): Lab Spreadsheet & Rumus Excel Interaktif di Course Player (*Hands-On Formula Sandbox*)
- **User Story:** *Sebagai **Mentee / Pelajar** pada kursus teknis (Excel, Komisi & Bonus, Akuntansi, Rekonsiliasi Data, Administrasi), saya ingin mencoba mengetik rumus Excel (`=SUM`, `=AVERAGE`, `=IF`, `=VLOOKUP`, operasi aritmetika sel) langsung pada tabel spreadsheet interaktif di dalam halaman materi, sehingga saya benar-benar paham cara kerja rumus secara praktik tanpa harus pindah aplikasi.*
- **Acceptance Criteria:**
  - **Given** mentee membuka materi pada kursus teknis (atau mengaktifkan **Lab Spreadsheet Interaktif** di Course Player),
  - **When** mentee memilih sel (mis. `B6`, `D2`, `E2`), mengetik rumus pada Formula Bar `fx` (contoh: `=SUM(B2:B5)`, `=AVERAGE(B2:B5)`, `=IF(B2>=10000000,"Bonus 10%","Bonus 5%")`, `=VLOOKUP("A02",A2:C5,3,FALSE)`, atau `=B2*C2`),
  - **Then** spreadsheet menghitung hasil rumus secara *real-time*, menampilkan evaluasi **Misi Praktik Rumus** (Benar / Petunjuk Perbaikan), dan menyediakan pilihan skenario latihan (*Rekap Penjualan `SUM/AVERAGE`*, *Komisi Bertingkat `IF`*, *Lookup Barang `VLOOKUP`*).

#### `US-23C` (BL-23C): Security Hardening, HTTP Security Headers & Automated Performance Benchmark Gate
- **User Story:** *Sebagai **Tim Engineering & Pengelola Platform**, saya ingin seluruh input pengguna, ekspor/impor CSV, evaluator rumus spreadsheet, serta header HTTP diamankan dari celah XSS/CSV-Injection/Clickjacking dan diuji dengan **Performance Benchmark Test** otomatis di setiap sprint, sehingga aplikasi tetap cepat (< 50ms komputasi berat, < 250 kB per chunk) dan aman di produksi.*
- **Acceptance Criteria:**
  - **Given** kode aplikasi dijalankan pada pipeline test & deployment Vercel,
  - **When** suite keamanan & performa (`securityAndPerf.test.ts`) dijalankan,
  - **Then** seluruh pengujian sanitasi XSS, proteksi CSV Formula Injection, rate-limit guard, HTTP security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` di `vercel.json`), serta benchmark kecepatan komputasi (1.000 evaluasi rumus spreadsheet < 50ms, filter 1.000 kursus < 15ms, ukuran chunk JS < 250 kB) dinyatakan **PASS**.

---

### B. Epik 2 — Multi-User 1v1 Duel Arena & Adaptive Subtest Drill (`Sprint 8` • `v1.11.0` Minor)

#### `US-24` (BL-24): Persistensi Tantangan Duel 1v1 di Database
- **User Story:** *Sebagai **Pelajar**, saya ingin tantangan 1v1 yang saya bagikan tercatat di database beserta skor teman yang menerima tantangan, sehingga kami berdua bisa melihat riwayat duel dan papan skor head-to-head.*
- **Acceptance Criteria:**
  - **Given** Pelajar A menyelesaikan kuis dan membuat link tantangan 1v1,
  - **When** Pelajar B membuka link tersebut, mengerjakan kuis, dan men-submit hasil,
  - **Then** hasil duel (`win` / `lose` / `draw`) tercatat di tabel `public.quiz_challenges` dan tampil di riwayat duel kedua pelajar.

#### `US-25` (BL-25): Mode Latihan Adaptif Subtest Terlemah (*Smart Drill*)
- **User Story:** *Sebagai **Pelajar**, saya ingin menekan satu tombol **"Latih Subtest Terlemah"** dari halaman hasil kuis atau profil, sehingga sistem otomatis menyajikan 10 soal latihan khusus dari kategori dengan akurasi terendah saya.*
- **Acceptance Criteria:**
  - **Given** pelajar memiliki `category_breakdown` dengan subtest terlemah (mis. `Numerik 40%`),
  - **When** pelajar menekan **Mulai Smart Drill Subtest Ini**,
  - **Then** `QuizRunnerPage` membuka sesi latihan terfokus yang hanya menarik soal-soal dari kategori tersebut.

#### `US-26` (BL-26): Riwayat & Grafik Perkembangan Ketahanan Kraepelin/Pauli
- **User Story:** *Sebagai **Pelajar**, saya ingin hasil simulasi Tes Kraepelin/Pauli saya (kecepatan KPM, akurasi %, stabilitas) tersimpan ke riwayat akun, sehingga saya bisa memantau tren peningkatan ketelitian saya dari waktu ke waktu.*
- **Acceptance Criteria:**
  - **Given** pelajar menyelesaikan simulasi di `/kraepelin`,
  - **When** hasil simulasi tampil,
  - **Then** skor tersimpan ke `public.kraepelin_attempts` (dengan fallback lokal) dan menampilkan daftar 5 percobaan terakhir beserta indikator tren naik/turun.

---

### C. Epik 3 — Teacher Question Versioning & Database Admin Governance (`Sprint 9` • `v1.12.0` Minor)

#### `US-27` (BL-27): Update Soal In-Place & Duplikasi Paket Kuis di Teacher Studio
- **User Story:** *Sebagai **Pengajar**, saya ingin mengedit soal yang sudah ada secara langsung (*update in-place* tanpa harus membuat soal baru lalu menghapus soal lama) serta menduplikasi paket kuis, sehingga revisi typo atau kunci jawaban menjadi jauh lebih cepat.*
- **Acceptance Criteria:**
  - **Given** pengajar menekan tombol **Edit (`Pencil`)** pada salah satu soal di daftar bank soal `/teacher`,
  - **When** pengajar mengubah teks/opsi/kunci lalu menekan **Perbarui Soal Ini**,
  - **Then** data soal dengan `id` tersebut diperbarui langsung di database (`lmsApi.updateQuestionInQuiz`) dan banner konfirmasi tampil.

#### `US-28` (BL-28): Persistensi Admin Audit Log di Supabase PostgreSQL
- **User Story:** *Sebagai **Admin**, saya ingin seluruh jejak audit (`ROLE_UPDATED`, `USER_STATUS_CHANGED`, `COURSE_PUBLISH_TOGGLED`) tersimpan permanen di tabel database `public.admin_audit_logs`, sehingga seluruh admin dapat mengaudit perubahan sistem secara transparan.*
- **Acceptance Criteria:**
  - **Given** seorang admin mengubah role user, menonaktifkan akun, atau memoderasi kursus di `/admin`,
  - **When** mutasi berhasil,
  - **Then** log tercatat di tabel `public.admin_audit_logs` di Supabase dan tab **Audit Log** menampilkan data lintas sesi lengkap dengan filter aksi & pencarian.

#### `US-29` (BL-29): Ekspor Laporan Audit & Statistik Sistem (CSV) di Admin Panel
- **User Story:** *Sebagai **Admin**, saya ingin mengunduh laporan daftar pengguna dan log audit dalam format `.CSV`, sehingga pelaporan tata kelola berkala menjadi mudah.*
- **Acceptance Criteria:**
  - **Given** admin membuka tab **Manajemen Pengguna** atau **Audit Log** di `/admin`,
  - **When** admin menekan tombol **Unduh CSV**,
  - **Then** file `.csv` terunduh dengan struktur kolom yang valid.

---

### D. Epik 4 — LokaTalenta 2.0: Talent Readiness Passport & Radar Kompetensi (`Sprint 10` • `v2.0.0` Major)

#### `US-30` (BL-30): Radar Kompetensi 5-Dimensi di Halaman Profil & Sertifikat
- **User Story:** *Sebagai **Pelajar**, saya ingin melihat visualisasi **Radar Kompetensi Karier** (Verbal, Numerik, Logika/Spasial, Ketelitian Kraepelin, dan Kemahiran Bahasa) di halaman profil saya, sehingga saya memahami peta kekuatan saya secara menyeluruh.*
- **Acceptance Criteria:**
  - **Given** pelajar membuka `/profile`,
  - **When** data attempt kuis, Kraepelin, dan progres kursus dihitung,
  - **Then** tampil grafik SVG **Radar Kompetensi 5-Dimensi** (skala 0–100) beserta label kesiapan karier (*Starter*, *Job-Ready*, *Top Talent*).

#### `US-31` (BL-31): Halaman Publik Talent Readiness Passport (`/talent/:userId`) untuk Perekrut
- **User Story:** *Sebagai **Pelajar / Pencari Kerja**, saya ingin membagikan tautan publik **Talent Readiness Passport** (`/talent/:userId`) di CV atau LinkedIn saya, sehingga HR/perekrut dapat melihat ringkasan sertifikat resmi, skor kesiapan psikotes, dan lencana kompetensi saya tanpa perlu login.*
- **Acceptance Criteria:**
  - **Given** pelajar menyalin tautan **Bagikan Talent Passport** dari `/profile`,
  - **When** perekrut (publik/tanpa login) membuka `/talent/:userId`,
  - **Then** tampil profil kesiapan kandidat, Radar Kompetensi 5-Dimensi, daftar sertifikat lulus beserta link verifikasi `/verify/:certCode`, serta status **Terverifikasi oleh LokaTalenta**.

#### `US-32` (BL-32): Portal Pencarian & Verifikasi Kandidat Terpadu (`/verify` Revamp 2.0)
- **User Story:** *Sebagai **Perekrut / HR**, saya ingin halaman `/verify` tidak hanya mengecek kode sertifikat tunggal, tetapi juga dapat memverifikasi kode **Talent Passport** kandidat dan menampilkan ringkasan skor kompetensinya.*
- **Acceptance Criteria:**
  - **Given** perekrut membuka `/verify`,
  - **When** perekrut memasukkan Kode Sertifikat (`LT-...`) atau ID Talent Passport,
  - **Then** sistem menampilkan hasil verifikasi keaslian beserta tautan menuju **Talent Readiness Passport** kandidat tersebut.

#### `US-32B` (BL-32B): Isolasi UI & Role Guard Khusus Admin Dashboard (`ADM-06`)
- **User Story:** *Sebagai **Admin Platform**, saya ingin akun Admin hanya memiliki akses dan navigasi yang berhubungan dengan **Admin Dashboard** (`/admin`), sehingga akun Admin tidak dapat mengakses halaman Pelajar maupun halaman Pengajar.*
- **Acceptance Criteria:**
  - **Given** pengguna login sebagai `admin`,
  - **When** melihat `TopbarNav` atau mencoba mengakses rute Pelajar (`/`, `/courses/:slug`, `/quiz/:quizId`, `/kraepelin`, `/tryout`, `/community`, `/profile`, `/certificate`) maupun rute Pengajar (`/teacher`),
  - **Then** menu navigasi hanya menampilkan **Admin Dashboard** (`/admin`) dan tombol tema/keluar, serta seluruh rute non-admin otomatis di-redirect ke `/admin`.

---

### E. Epik 5 — Cohort Kelas Privat, Timeline Tugas & SQL Sandbox (`Sprint 11` • `v2.1.0` Minor)

#### `US-33` (BL-33): Manajemen Cohort / Kelas Privat & Kode Undangan
- **User Story:** *Sebagai **Pengajar**, saya ingin membuat grup Cohort/Batch dengan kode undangan unik, sehingga peserta pelatihan atau kandidat rekrutmen dapat bergabung ke kelas privat dan dipantau progresnya dalam satu kelompok.*
- **Acceptance Criteria:**
  - **Given** pengajar membuka tab baru **Cohort** di `/teacher`,
  - **When** pengajar membuat cohort baru dan membagikan kode (mis. `BUMN-BATCH-01`),
  - **Then** pelajar dapat memasukkan kode di `/profile` atau `/` dan otomatis tergabung ke daftar peserta cohort tersebut.

#### `US-34` (BL-34): Timeline Jadwal Belajar & Tenggat Tugas Mingguan
- **User Story:** *Sebagai **Pelajar**, saya ingin melihat ringkasan jadwal Tryout Akbar, sesi live mentor, dan tenggat tugas dalam satu panel timeline terpadu, sehingga tidak ada jadwal penting yang terlewat.*
- **Acceptance Criteria:**
  - **Given** pelajar membuka `/profile` atau dashboard utama,
  - **When** terdapat tugas aktif, sesi live, atau tryout terdaftar,
  - **Then** tampil panel **Agenda & Tenggat Terdekat** yang diurutkan berdasarkan waktu terdekat.

#### `US-35` (BL-35): Lab Query SQL Interaktif untuk Kursus Data & Administrasi
- **User Story:** *Sebagai **Mentee** pada kursus teknis data/administrasi, saya ingin mengetik query SQL dasar (`SELECT`, `WHERE`, `ORDER BY`, `COUNT`) langsung pada tabel dataset contoh di Course Player, sehingga saya menguasai logika pengolahan data selain Excel.*
- **Acceptance Criteria:**
  - **Given** mentee membuka tab **Lab SQL** di Course Player kursus teknis,
  - **When** mentee mengetik query valid (mis. `SELECT nama, nilai FROM kandidat WHERE nilai >= 80 ORDER BY nilai DESC`) dan menekan **Jalankan Query**,
  - **Then** hasil tabel terfilter tampil instan beserta evaluasi misi praktik SQL.

---

### F. Epik 6 — Adaptive Diagnostic Plan, Bookmark Soal & Telemetry (`Sprint 12` • `v2.2.0` Minor)

#### `US-36` (BL-36): Diagnostic Study Plan Otomatis
- **User Story:** *Sebagai **Pelajar**, saya ingin sistem menyusun rencana belajar mingguan otomatis berdasarkan subtest terlemah saya, sehingga waktu belajar lebih terarah.*
- **Acceptance Criteria:**
  - **Given** pelajar telah mengerjakan minimal 1 simulasi/kuis,
  - **When** pelajar membuka tab **Rencana Belajar** di `/profile`,
  - **Then** sistem merekomendasikan 3 langkah prioritas (materi + Smart Drill) sesuai skor subtest terendah.

#### `US-37` (BL-37): Bookmark Soal Sulit & Dek Ulasan Pribadi
- **User Story:** *Sebagai **Pelajar**, saya ingin menandai (*bookmark*) soal-soal sulit pada halaman hasil kuis, sehingga saya dapat mengulasnya kembali kapan saja dari halaman profil.*
- **Acceptance Criteria:**
  - **Given** pelajar membuka ringkasan pembahasan di `QuizResultPage`,
  - **When** pelajar menekan tombol **Simpan ke Bookmark Soal Sulit**,
  - **Then** soal beserta pembahasan tersimpan dan dapat diakses/dihapus pada tab **Soal Tersimpan** di `/profile`.

#### `US-38` (BL-38): Observability & Health Telemetry Panel di Admin
- **User Story:** *Sebagai **Admin**, saya ingin memantau ringkasan metrik kesehatan aplikasi (jumlah error client tertangkap, status PWA/cache, dan performa lokal) di Admin Panel, sehingga isu pasca-rilis cepat terdeteksi.*
- **Acceptance Criteria:**
  - **Given** admin membuka `/admin` tab **Kesehatan Sistem**,
  - **When** halaman dimuat,
  - **Then** tampil ringkasan versi aktif, status storage/SW, serta log error runtime yang tertangkap oleh ErrorBoundary.

#### `US-38B` (BL-38B): Tes Kecepatan & Ketepatan Mengetik (`Typing Speed & Accuracy Test`)
- **User Story:** *Sebagai **Pelajar**, saya ingin berlatih kecepatan dan ketepatan mengetik (WPM, CPM, akurasi karakter %, dan tingkat salah ketik) dengan highlight huruf real-time dan riwayat progres, sehingga siap menghadapi tes administrasi/data entry maupun seleksi kerja.*
- **Acceptance Criteria:**
  - **Given** pelajar membuka `/typing` (atau menu **Tes Mengetik**),
  - **When** pelajar memilih durasi (30s / 60s) atau paket teks (Indonesia / Inggris / Angka & Simbol) lalu mulai mengetik,
  - **Then** sistem menampilkan **WPM**, **CPM**, **Akurasi (%)**, highlight karakter benar/salah secara real-time, serta menyimpan riwayat hasil latihan ke lokal/cloud (`typing_attempts`).

#### `US-38C` (BL-38C — Student POV): Pelacak XP Harian Real-Time & Leaderboard Per Event Tryout
- **User Story:** *Sebagai **Pelajar**, saya ingin melihat progress bar XP harian terhadap target (30/60/100 XP), tautan aksi langsung dari Radar 5D ke latihan terkait, serta papan peringkat khusus per event Tryout dan filter/pencarian forum Komunitas, sehingga target harian dan kompetisi event lebih terukur.*
- **Acceptance Criteria:**
  - **Given** pelajar login di `/` atau membuka `/tryout` dan `/community`,
  - **When** pelajar menyelesaikan materi/kuis atau membuka tab event Tryout tertentu,
  - **Then** bar XP Harian menampilkan `earnedToday / xpTarget`, Leaderboard Tryout menampilkan peringkat khusus event tersebut, dan forum Komunitas mendukung pencarian serta sorting Terpopuler.

#### `US-38D` (BL-38D — Teacher POV): Mode Pratinjau Mentor, Manajemen Anggota Cohort & Ringkasan Mengajar
- **User Story:** *Sebagai **Mentor / Pengajar**, saya ingin mempratinjau kursus/soal buatan sendiri (`?preview=true`), melihat/mengeluarkan anggota cohort, mengedit metadata kursus & judul modul, serta melihat Ringkasan Mengajar di `/profile`, sehingga pengelolaan kelas lebih tuntas.*
- **Acceptance Criteria:**
  - **Given** pengajar membuka `/teacher` atau `/profile`,
  - **When** pengajar menekan **Pratinjau Kursus** atau membuka detail Cohort,
  - **Then** `/courses/:slug?preview=true` terbuka dalam mode read-only (tanpa mencatat progres/XP) khusus pemilik kursus, daftar anggota cohort tampil lengkap dengan opsi arsip/keluarkan anggota, dan `/profile` mentor menampilkan ringkasan kursus & jadwal live.

#### `US-38E` (BL-38E — Admin POV): Preview Kursus Read-Only, Moderasi Komunitas & Revoke Sertifikat
- **User Story:** *Sebagai **Admin Platform**, saya ingin meninjau struktur modul/materi kursus sebelum menerbitkan, memoderasi postingan forum Komunitas langsung dari `/admin`, memantau metrik status akun/distribusi role, dan mencabut (*revoke*) sertifikat jika terjadi pelanggaran.*
- **Acceptance Criteria:**
  - **Given** admin membuka `/admin`,
  - **When** admin memilih **Preview Kursus**, tab **Moderasi Komunitas**, atau tab **Sertifikat**,
  - **Then** modal read-only menampilkan daftar modul & lesson tanpa membuka rute `/courses/:slug`, admin dapat menghapus postingan bermasalah atau mencabut sertifikat dengan pencatatan otomatis ke `admin_audit_logs`.

#### `US-38F` (BL-38F — UI Revamp): Katalog Interaktif, Hero Bento Hub & Micro-Interactions (Student POV)
- **User Story:** *Sebagai **Pelajar**, saya ingin tampilan beranda dan katalog terasa modern, responsif, dan interaktif (bukan sekadar daftar statis), sehingga pengalaman belajar lebih memotivasi.*
- **Acceptance Criteria:**
  - **Given** pelajar membuka `/` (`CatalogPage`),
  - **When** halaman dimuat atau pelajar mengarahkan kursor/memfilter kursus,
  - **Then** tampil **Hero Bento Hub** dengan ring progres XP harian interaktif & quick-launch latihan, kartu kursus dengan *hover elevation*, *quick preview syllabus drawer*, badge fitur (*Lab Interaktif*, *Audio TTS*, *Sertifikat*), serta *skeleton shimmer* saat loading.

#### `US-38G` (BL-38G — UI Revamp): Course Player Zen Mode, Quiz Feedback Ekspresif & Grafik Interaktif
- **User Story:** *Sebagai **Pelajar**, saya ingin tampilan Course Player, QuizRunner, Kraepelin, dan Radar 5D lebih dinamis dan memuaskan secara visual saat berlatih.*
- **Acceptance Criteria:**
  - **Given** pelajar belajar di `CoursePlayerPage`, mengerjakan `QuizRunnerPage`, atau memantau `/kraepelin` & `/profile`,
  - **When** pelajar menyelesaikan modul/kuis atau memeriksa grafik ketahanan/Radar 5D,
  - **Then** tersedia toggle **Zen / Focus Mode** pada Player, progress ring per modul di sidebar kurikulum, animasi perayaan (*milestone toast*) saat lulus modul/kuis, serta *interactive hover tooltip* pada grafik Kraepelin dan Radar Kompetensi 5D.

---

### G. Epik 7 — Multi-Format Assessment, Proctoring Lite & Stress Gate (`Sprint 13` • `v2.3.0` Minor)

#### `US-39` (BL-39): Indikator Integritas Fokus (Anti-Tab-Switch / Proctoring Lite)
- **User Story:** *Sebagai **Pengajar / Penyelenggara Tryout**, saya ingin mengetahui berapa kali peserta berpindah tab selama ujian resmi berlangsung, sehingga integritas hasil evaluasi lebih terjaga.*
- **Acceptance Criteria:**
  - **Given** pelajar mengerjakan kuis dengan mode ujian aktif di `QuizRunnerPage`,
  - **When** pelajar berpindah tab/window (`visibilitychange`),
  - **Then** peringatan fokus tampil dan jumlah perpindahan tab tersimpan di ringkasan attempt.

#### `US-40` (BL-40): Soal Isian Singkat / Formula & Auto-Keyword Scoring
- **User Story:** *Sebagai **Pengajar**, saya ingin membuat soal isian singkat (angka, kata kunci, atau rumus Excel) selain pilihan ganda A–E, sehingga evaluasi lebih realistis.*
- **Acceptance Criteria:**
  - **Given** pengajar membuat/mengimpor soal bertipe `short_answer`,
  - **When** pelajar mengetik jawaban pada QuizRunner,
  - **Then** sistem mencocokkan jawaban secara *case-insensitive trimmed* dan menghitung skor otomatis.

#### `US-40B` (BL-40B — Student & Teacher POV): Simulasi Interview STAR, Penugasan Per Cohort & Item Analysis
- **User Story:** *Sebagai **Pelajar** dan **Mentor**, saya ingin berlatih wawancara metode STAR (*Situation–Task–Action–Result*), menargetkan tugas/pengumuman khusus `cohort_id`, melihat drill-down rapor individual siswa, dan analitik butir soal (*Item Analysis*).*
- **Acceptance Criteria:**
  - **Given** pelajar berlatih di Course Player atau mentor membuka `/teacher`,
  - **When** mentor membuat tugas bertarget cohort atau membuka analitik butir soal,
  - **Then** hanya anggota cohort terkait yang menerima tugas/pengumuman, dan grafik persentase benar per butir soal tampil di `TeacherAnalyticsPanel`.

#### `US-40C` (BL-40C — Teacher & Admin POV): Duplikasi Kursus/Soal, Supervisi Cohort & Pengumuman Global
- **User Story:** *Sebagai **Mentor** dan **Admin**, saya ingin menduplikasi template kursus/paket soal, mengawasi seluruh cohort aktif lintas pengajar, serta mengirim pengumuman global platform (*System-Wide Banner*).*
- **Acceptance Criteria:**
  - **Given** mentor di `/teacher` atau admin di `/admin`,
  - **When** mentor menekan **Duplikasi Kursus/Quiz** atau admin mengirim **Broadcast Pengumuman**,
  - **Then** salinan kursus/quiz berstatus Draft terbuat instan dan banner pengumuman global tampil di header aplikasi seluruh pengguna.

#### `US-40D` (BL-40D — UI Revamp): Mentor Studio Drag-and-Drop & Admin Interactive Drawer/Charts
- **User Story:** *Sebagai **Mentor** dan **Admin**, saya ingin antarmuka `/teacher` dan `/admin` lebih interaktif dengan drag-and-drop, split preview, grafik distribusi, serta modal/toast modern pengganti dialog browser bawaan.*
- **Acceptance Criteria:**
  - **Given** mentor membuka `/teacher` atau admin membuka `/admin`,
  - **When** mentor menyusun modul/materi/soal atau admin menginspeksi pengguna/kursus & melakukan aksi sensitif,
  - **Then** mentor dapat melakukan *drag-and-drop* urutan modul/lesson & *live split preview* soal, sementara admin memiliki *slide-over detail drawer*, grafik distribusi role/pertumbuhan interaktif, dan modal konfirmasi + toast modern (menggantikan `window.confirm`).

#### `US-41` (BL-41): Security & Stress Benchmark Suite v2 (5.000 Operasi)
- **User Story:** *Sebagai **Tim Engineering**, saya ingin menguji performa parser rumus, filter katalog, dan sanitasi payload pada skala 5.000 operasi sebelum masuk ke rilis Major `v3.0.0`.*
- **Acceptance Criteria:**
  - **Given** suite `sprint13StressAndSecurity.test.ts` dijalankan,
  - **When** 5.000 kalkulasi & sanitasi dijalankan,
  - **Then** seluruh benchmark selesai di bawah batas latensi target tanpa *memory leak* atau *bypass* sanitasi.

---

### H. Epik 8 — LokaTalenta 3.0: Recruiter Portal & Multi-Tenant Assessment (`Sprint 14` • `v3.0.0` MAJOR)

#### `US-42` (BL-42): Portal Perekrut & Talent Discovery (`/recruiter`)
- **User Story:** *Sebagai **Perekrut / HR Perusahaan**, saya ingin mengakses dashboard khusus `/recruiter` untuk menelusuri kandidat berprestasi berdasarkan Radar Kompetensi 5-Dimensi, skor Kraepelin, dan sertifikat terverifikasi, lalu menyimpannya ke daftar **Shortlist Kandidat**.*
- **Acceptance Criteria:**
  - **Given** user login dengan role `recruiter` (atau `admin`),
  - **When** user membuka `/recruiter`, memfilter kandidat berdasarkan minimal skor/kompetensi, dan menekan **Simpan ke Shortlist**,
  - **Then** kandidat tersimpan di daftar shortlist dan tautan Talent Passport kandidat dapat dibuka langsung.

#### `US-43` (BL-43): Custom Assessment Link untuk Seleksi Perusahaan
- **User Story:** *Sebagai **Perekrut / Pengajar**, saya ingin membuat tautan undangan asesmen khusus perusahaan (`/quiz/:quizId?org=...&invite=...`) beserta rekap hasil kandidat yang mengikuti tautan tersebut.*
- **Acceptance Criteria:**
  - **Given** perekrut membuat undangan asesmen di `/recruiter`,
  - **When** kandidat mengakses tautan undangan dan menyelesaikan tes,
  - **Then** nama organisasi tampil di header ujian dan skor kandidat masuk ke rekap asesmen perekrut.

#### `US-44` (BL-44): Multi-Tenant Organization Branding & Role `recruiter` (`v3.0.0` Major)
- **User Story:** *Sebagai **Admin & Perekrut**, saya ingin platform mendukung role `recruiter` di manajemen pengguna serta menampilkan identitas organisasi mitra pada halaman asesmen & sertifikat resmi.*
- **Acceptance Criteria:**
  - **Given** admin menetapkan role `recruiter` pada pengguna di `/admin`,
  - **When** perekrut login,
  - **Then** navbar (`TopbarNav`) menampilkan akses **Portal Perekrut (`/recruiter`)**, aplikasi berjalan pada rilis **`v3.0.0`**, dan seluruh regresi QA v1–v3 lulus 100%.

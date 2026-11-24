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

# Changelog — LokaTalenta

Seluruh perubahan pada project **LokaTalenta** dicatat secara terstruktur menggunakan standar **Semantic Versioning (`MAJOR.MINOR.PATCH`)**, dimulai dari **`1.0.0`**.

## Aturan Versioning & Wajib Deskripsi Perubahan

Setiap melakukan perubahan yang siap dirilis (atau menggunakan `./scripts/release.sh`), **wajib** menuliskan deskripsi perubahan sesuai levelnya:

- **`PATCH` (`1.0.x`)** — Perbaikan bug, perbaikan tampilan/responsivitas, optimasi query, atau patch keamanan tanpa mengubah alur fitur utama.
- **`MINOR` (`1.x.0`)** — Penambahan fitur baru, peningkatan interaktivitas, atau perluasan fungsionalitas yang tetap kompatibel dengan versi sebelumnya.
- **`MAJOR` (`x.0.0`)** — Perubahan besar pada arsitektur, skema database yang memecah kompatibilitas lama, atau perombakan total alur autentikasi/bisnis.

Gunakan CLI rilis berikut agar versi `client/package.json`, `CHANGELOG.md`, dan Git Tag selalu sinkron:
```bash
./scripts/release.sh patch "Perbaikan bug ..."
./scripts/release.sh minor "Penambahan fitur ..."
./scripts/release.sh major "Perubahan arsitektur ..."
```

---

## [2.1.0] - 2026-11-24

### Minor
- Sprint 11: Cohort Kelas Privat (BL-33), Agenda Belajar & Tenggat (BL-34), dan Lab Query SQL Interaktif (BL-35)

---

## [2.0.1] - 2026-11-24

### Hotfix
- Stabilization v2.0.1: bug TeacherStudio, single Catatan Pribadi, dark mode, mobile Admin cards, desktop auto-filter & security hardening

---

## [2.0.0] - 2026-11-24

### Major
- LokaTalenta 2.0: Radar Kompetensi 5-Dimensi (BL-30), Talent Readiness Passport (BL-31), Portal Verifikasi 2.0 (BL-32), & Isolasi UI Admin Dashboard (BL-32B)

---

## [1.12.0] - 2026-11-24

### Minor
- Sprint 9: Edit Soal In-Place di Teacher Studio (BL-27), Cloud Admin Audit Log (BL-28), dan Ekspor CSV Governance (BL-29)

---

## [1.11.1] - 2026-11-24

### Hotfix
- Mode Latihan hanya dapat dipilih 1x sebelum memulai sesi latihan

---

## [1.11.0] - 2026-11-24

### Minor
- Sprint 8: Riwayat Duel 1v1 (BL-24), Smart Subtest Drill (BL-25), dan Riwayat & Tren Kraepelin (BL-26)

---

## [1.10.1] - 2026-11-24

### Hotfix
- Fix cloud lesson_notes column name (content instead of note_text) on production

---

## [1.10.0] - 2026-11-24

### Minor
- Sprint 7: Cloud Sync Catatan & Preferensi (BL-21, BL-22), Ekspor Catatan .md (BL-23), Lab Spreadsheet Excel Interaktif (BL-23B), serta Security Hardening & Performance Benchmark Suite (BL-23C)

---

## [1.9.1] - 2026-11-24

### Patch
- Perbaikan Filter Kursus & Latihan: item radio ter-select dengan highlight, tap di luar menutup drawer & membatalkan draft, dan filter baru diterapkan saat klik Terapkan

---

## [1.9.0] - 2026-11-23

### Minor
- Sprint 6: Search/Filter & Load-to-Editor Bank Soal (BL-18), Admin Audit Log (BL-19), dan PWA Manifest Shortcuts & Offline Cache v2 (BL-20)

---

## [1.8.0] - 2026-11-23

### Minor
- Sprint 5: Target Karier & XP Harian (BL-15), Resume Last Lesson & Shortcut Hint (BL-16), dan Duel 1v1 Score Comparison (BL-17)

---

## [1.7.0] - 2026-11-23

### Minor
- Sprint 4: Code-Splitting Vendor < 250kB (BL-11), Callback Reset Password (BL-12), Persistensi & Filter Tryout Akbar (BL-13), dan E2E Recovery Suite (BL-14)

---

## [1.6.1] - 2026-11-23

### Patch
- Perbaikan UI Topbar dengan komponen TopbarNav dan menu dropdown Lainnya agar bebas tabrakan

---

## [1.6.0] - 2026-11-23

### Minor
- Sprint 3: Challenge 1v1 & Share Skor/Sertifikat (BL-07), Forgot Password (BL-08), Tryout Akbar (BL-09), dan Playwright E2E Suite (BL-10)

---

## [1.5.0] - 2026-11-23

### Minor
- Sprint 2: Quick Check & Catatan Pribadi (BL-04), Bulk CSV Import Soal (BL-05), dan Analitik Teacher Studio (BL-06)

---

## [1.4.0] - 2026-11-23

### Minor
- BL-03: Global Leaderboard RPC (get_public_leaderboard) untuk peringkat XP, level, materi selesai, dan kuis lulus lintas siswa secara real-time

---

## [1.3.0] - 2026-11-23

### Minor
- BL-02: Mode Latihan (Instant Feedback) vs Mode Ujian dengan RPC check_practice_answer dan pembahasan langsung per soal

---

## [1.2.0] - 2026-11-23

### Minor
- BL-01: Simulator Tes Kraepelin / Pauli (Tes Ketelitian Angka) dengan preset latihan, input keyboard/keypad 0-9, dan kurva kecepatan & ketelitian per kolom

---

## [1.1.0] - 2026-11-23

### Minor
- Menghapus OTP saat registrasi, mempertahankan validasi format email & cek duplikasi email, serta memperbarui test case AUTH-01 dan AUTH-03

---

## [1.0.0] - 2026-11-23 — Initial Production Release

### Major / Core Platform
- **Platform LMS & Simulasi Psikotes LokaTalenta:** Katalog 123+ program (Psikotes Retail & Korporasi, Bahasa Jepang/Korea/Inggris, Keterampilan Kerja) terhubung ke Supabase (`prod` & `dev` terpisah) dan ter-deploy di Vercel (`https://lokatalenta.vercel.app`).
- **Sistem Autentikasi, RBAC & Keamanan Sesi:**
  - Registrasi akun pelajar dengan verifikasi **Email OTP (6–8 digit)** dan sinkronisasi profil.
  - **Single Active Session per Account** (`active_session_id` + `scope: 'others'` + Supabase Realtime): sesi lama otomatis keluar jika ada login baru dengan akun yang sama.
  - Guard timeout sesi (`Sesi anda telah habis.`) dan proteksi rute berbasis peran (`student`, `teacher`, `admin`).

### Minor / Fitur Interaktif & Pengalaman Pengguna
- **Quiz Runner & Result (Fase 1):**
  - Bank soal 2× dengan prioritas soal baru, cooldown 60 detik, dan shortcut keyboard (`A`–`E` / `1`–`5`, `←`/`→`, `F` untuk Ragu-ragu).
  - Filter **Navigasi Soal** (`Semua`, `Kosong`, `Ragu`) beserta progress bar pengerjaan.
  - **Rekomendasi Fokus Subtes Terlemah**, pill filter per subtes, dan tombol **Tanyakan Soal Ini ke Komunitas** yang otomatis mengisi draft topik diskusi.
- **Course Player Interaktif:** Course Overview Gate, **Mode Flashcard SRS**, **Latihan Menulis (Kanvas)**, **Latihan Bicara (Shadowing)**, serta tab **Tugas Upload File & Rubrik Penilaian 1–5**.
- **Katalog, Gamifikasi & Komunitas:** Widget **Misi Belajar Aktif (*Daily Quests*)**, Onboarding Goal Picker, XP/Level/Streak & Leaderboard di `/profile`, **Sertifikat Digital + Verifikasi Publik** (`/verify/:certCode`), serta guard `1× Dukung` di `/community`.
- **Teacher Studio & Admin Panel:** Pencarian, filter, moderasi kursus, manajemen bank soal on-demand per kuis, interaksi mentor (Q&A, pesan 1-on-1, sesi live), dan guard anti-nonaktifkan/turunkan role akun admin sendiri.

### Patch / Perbaikan QA Post-Deployment
- Optimasi query `listPublishedCourses` & `listAllCoursesForManagement` agar bebas *statement timeout* (`HTTP 500`) di Supabase Free Tier.
- Perbaikan seeder (`seedSupabase.ts`) untuk kolom `lessons.voice_lines` (`NOT NULL`) dan normalisasi `question_id` → `id` pada `getAttemptResult`.
- Perbaikan responsivitas mobile `390×844` (`0px` *horizontal overflow* di `/` & Mode Flashcard, penyembunyian subtitle navbar agar tidak menabrak ikon notifikasi, skala teks kanvas menulis, dan feedback error Speech API).
- Penambahan guard `isLiking` pada tombol `Dukung`, `htmlFor`/`id` pada form `/auth`, dan `<PageLoader />` pada `RequireRole`.

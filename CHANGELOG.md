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

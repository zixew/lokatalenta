# Analisis Komprehensif Backlog & Roadmap Teknis LokaTalenta
## Evaluasi Baseline v2.3.0 Menuju Milestone v3.0.0 (Sprint 14A/14B) dan Horizon Strategis Sprints 15–20+

**Dokumen:** Analisis Backlog, Audit Sistem Produksi, Arsitektur Backend, Evaluasi UI/UX, dan Perencanaan QA/DevOps  
**Tanggal Evaluasi:** 24 November 2026 (Revisi Iterasi 2 — Technical Hardening)  
**Baseline Versi:** `v2.3.0` (Sprint 13 Selesai)  
**Lingkungan Produksi:** [https://lokatalenta.vercel.app](https://lokatalenta.vercel.app)  
**Target Milestone Terdekat:** Sprint 13.1 (Hotfix), Sprint 14A (Foundation & RBAC), Sprint 14B (`v3.0.0` GA — Corporate Assessments & CRM)  
**Target Horizon Jangka Panjang:** Sprints 15–20+ (`v3.1.0` s.d. `v4.0.0` Major)  
**Repository Kerja:** `/Users/a2299/Documents/Projects/lms-psikotes`

---

## 1. Executive Summary & Baseline Assessment

### 1.1 Baseline Sistem Saat Ini (`v2.3.0`)
LokaTalenta telah berhasil menyelesaikan 13 siklus sprint pengembangan produk secara disiplin melalui metodologi GitFlow v2. Status operasional sistem per rilis `v2.3.0` ditandai dengan metrik berikut:
- **Katalog & Modul Pembelajaran:** 123 program aktif yang mencakup kursus persiapan BUMN, CPNS, Seleksi Kerja Swasta, Simulasi Psikotes CAT, Bahasa Asing (Jepang, Korea, Inggris), serta hands-on lab teknis (Excel Spreadsheet Sandbox, SQL Sandbox, STAR Interview, dan Typing Speed).
- **Pengujian & Keandalan Kode:**
  - **Unit & Integration Tests:** 26 test file Vitest mencakup 90 pengujian unit/stress/security dengan tingkat kelulusan **100% PASS** dalam durasi eksekusi ~950ms.
  - **Manual QA Test Cases:** 107 skenario end-to-end terverifikasi penuh (`POST-01` s.d. `SEC-02` pada `docs/qa/QA_TEST_CASES.md`) tanpa duplikasi ID dan 100% lulus.
  - **Analisis Statis:** Zero warning dan zero error pada `oxlint` di seluruh 138 file sumber aplikasi.
  - **Budget Kinerja Bundle:** Seluruh chunk JavaScript hasil build Vite berada strictly di bawah anggaran performa 250 kB (misalnya: `demoSeed`: 225.57 kB, `supabase-vendor`: 217.54 kB, `react-vendor`: 210.53 kB, `TeacherStudioPage`: 122.97 kB, `QuizRunnerPage`: 26.73 kB).
- **Audit Lingkungan Produksi Live (`https://lokatalenta.vercel.app`):**
  - Protokol HTTP/2 dengan status code `200 OK`.
  - Header keamanan web aktif: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), microphone=(self), geolocation=()`.
  - PWA Web App Manifest tervalidasi dengan mode `standalone`, theme color `#0F766E`, background `#F6F5F1`, dan shortcut navigasi langsung ke `/kraepelin` dan `/tryout`.

### 1.2 Titik Infleksi Strategis: B2C Learning LMS Menuju B2B Enterprise Screening
Hingga rilis `v2.3.0`, arsitektur dan model bisnis LokaTalenta berfokus pada **B2C (Business-to-Consumer)**: memfasilitasi talenta (pelamar kerja, fresh graduates, career switchers) dalam mengasah kemampuan kognitif, ketahanan kerja (Kraepelin), dan keahlian teknis secara mandiri.

Namun, untuk mencapai skalabilitas bisnis dan memenuhi kebutuhan industri, LokaTalenta kini berada pada **titik infleksi strategis (strategic inflection point)**:
```
           +-------------------------------------------------------+
           |                    LokaTalenta                        |
           +-------------------------------------------------------+
                                      |
         +----------------------------+----------------------------+
         |                                                         |
         v                                                         v
+-----------------------------------+     +-----------------------------------+
|         Fase 1: B2C LMS           |     |     Fase 2: B2B Enterprise        |
|      (Sprints 1 - 13: v1 - v2)    |     |      (Sprints 14 - 20: v3 - v4)   |
+-----------------------------------+     +-----------------------------------+
| - Model: Pelajar Mandiri          |     | - Model: Multi-Tenant Korporat    |
| - Akses: Katalog Terbuka          |     | - Akses: Undangan Asesmen Privat  |
| - Penilaian: Latihan / CAT Biner  |     | - Penilaian: Psikotes Terstandar  |
| - Data: Flat Single-Tenant        |     | - Data: Multi-Tenancy + RLS       |
| - Output: Kesiapan Pribadi        |     | - Output: Rekrutmen & Shortlist   |
+-----------------------------------+     +-----------------------------------+
```

Peralihan ini menuntut rekayasa ulang pada lapisan arsitektur data, tata kelola keamanan, pengalaman pengguna (UI/UX), dan instrumen psikometri:
1. **Multi-Tenancy & Isolasi Data:** Perusahaan klien menuntut isolasi mutlak atas hasil tes kandidat, daftar pelamar, dan token ujian berbayar mereka agar tidak bocor ke publik atau kompetitor.
2. **Standardisasi Psikometri Institusional:** Perekrut HR membutuhkan instrumen yang diakui secara saintifik (DISC, MBTI, Big Five OCEAN, CFIT Skala 2/3, Papikostick) dengan kurva norma nasional, bukan sekadar kuis pilihan ganda biner (benar/salah).
3. **Integritas Ujian Tingkat Tinggi:** Ujian seleksi kerja berisiko tinggi (*high-stakes testing*) memerlukan proctoring yang andal (lockdown fullscreen, deteksi kehilangan fokus yang tercatat di cloud, dan verifikasi identitas).
4. **Kepatuhan Regulasi:** Pengelolaan data kandidat dan riwayat penilaian wajib mematuhi Undang-Undang Perlindungan Data Pribadi (UU PDP No. 27/2022) di Indonesia.

---

## 2. Product & Roadmap Deep-Dive

### 2.1 Analisis Multi-Persona & Dukungan Alur Pengguna (User Journey)
Platform LokaTalenta melayani empat persona pengguna utama. Tabel berikut menyajikan analisis komparatif antara tujuan, pain point, dukungan fitur saat ini (`v2.3.0`), serta kesenjangan (*gaps*) kritis yang ditemukan:

| Persona | Definisi & Tujuan Utama | Pain Point Utama | Dukungan Saat Ini (`v2.3.0`) | Kesenjangan Kritis & Missing Flows |
| :--- | :--- | :--- | :--- | :--- |
| **Talent / Pelajar** *(Jobseeker & Testee)* | Mempersiapkan ujian seleksi kerja BUMN/CPNS/Swasta, melatih ketahanan kognitif, membuktikan kompetensi terverifikasi ke HR. | Rasa cemas menghadapi ujian, latihan tanpa kalibrasi standar industri, catatan hilang antar gawai, diskualifikasi sepihak akibat kendala teknis browser. | Goal picker, interactive labs (Spreadsheet, SQL, STAR Interview, Typing), Kraepelin/Pauli simulator, Smart Subtest Drill, Diagnostic Study Plan, 5D Competency Radar, Talent Passport publik (`/talent/:userId`). | 1. **Guided Onboarding Wizard:** Tidak ada panduan awal untuk benchmark psikotes baseline saat pendaftaran baru.<br>2. **Exam Retake / Dispute Workflow:** Tidak ada mekanisme banding jika koneksi terputus atau tab berpindah secara tidak sengaja (`REC-07`).<br>3. **Unggah Berkas CV/Portofolio:** Talent Passport belum mendukung dokumen pendukung lamaran. |
| **Recruiter / HR** *(Mitra Korporat B2B)* | Menjaring kandidat berkualitas tinggi, menyaring ribuan pelamar dengan asesmen objektif, memangkas biaya vendor psikotes pihak ketiga. | Memilah CV manual yang tidak tervalidasi, mahalnya biaya tes psikologi perorangan, ketidakmampuan membuat asesmen beridentitas perusahaan (*co-branding*). | Verifikasi sertifikat publik (`/verify/:code`) dan lookup skor Talent Passport 2.0 (`/verify`). | 1. **Ketiadaan Portal Perekrut (`/recruiter`):** Belum ada akses login khusus HR.<br>2. **Shortlist CRM & Komparasi:** Tidak bisa menyimpan kandidat favorit atau membandingkan 2–4 kandidat *side-by-side*.<br>3. **Undangan Asesmen Kustom:** Belum bisa membuat link ujian khusus berlogo korporat dengan kuota dan batas waktu. |
| **Admin / Operator** *(Governance Platform)* | Menjaga stabilitas operasional sistem, memoderasi konten/sertifikat, memastikan isolasi hak akses dan kepatuhan hukum data pribadi. | Serangan eskalasi hak akses (*privilege escalation*), injeksi formula CSV, crash runtime yang tidak terpantau, salah hapus/kunci akun sendiri. | Dashboard `/admin`, RBAC isolation (`ADM-06`), User Management anti-lockout, Course Preview, Moderasi Forum, Audit Log Supabase (`admin_audit_logs`), Ekspor CSV tersanitasi, Health Telemetry (`ADM-07`), Pengumuman Global (`ADM-09`), Supervisi Cohort. | 1. **Konsol Provisioning Organisasi:** Belum ada antarmuka membuat tenant organisasi, konfigurasi kuota, atau penetapan domain kustom.<br>2. **Operasi Massal (*Bulk Actions*):** Tidak ada fitur aktivasi/role change massal.<br>3. **Executive Analytics:** Tidak ada metrik DAU/MAU, rasio kelulusan seleksi B2B, atau analisis pendapatan lisensi. |
| **Mentor / Pengajar** *(Instruktur Kelas)* | Membuat silabus, menyusun paket bank soal, mendampingi siswa di cohort, mengevaluasi tugas berdasar rubrik objektif. | Repetisi input soal yang lambat, kesulitan mengetahui butir soal yang membingungkan siswa, penilaian manual yang memakan waktu. | Studio `/teacher`, Drag-and-Drop kurikulum, Split-pane preview bank soal, Import CSV massal, Update soal in-place, Kode invite cohort, Penilaian rubrik tugas (1–5 bintang), Analisis butir soal (*Item Difficulty %*), Duplikasi kursus ke Draft. | 1. **Kolaborasi Multi-Instruktur:** Belum ada fitur co-teacher untuk satu kursus.<br>2. **Drip Content Scheduling:** Belum ada otomasi pembukaan materi berbasis tanggal/jadwal.<br>3. **Penilaian Tugas Massal:** Evaluasi tugas masih dilakukan perorangan tanpa filter status periksa cepat. |

#### Analisis 6 Missing User Flows Utama:
1. **Talent Guided Onboarding & Psychometric Baseline:** Pengguna yang baru mendaftar langsung diarahkan ke katalog umum tanpa orientasi awal. Seharusnya sistem memandu talent menentukan minat karier, mengerjakan psikotes diagnostik singkat (15 menit), menghasilkan baseline Radar 5D perdana, dan mengatur preferensi privasi Talent Passport (`Publik` vs `Privat`).
2. **Recruiter Candidate Comparison Matrix & Shortlist CRM:** Perekrut membutuhkan tampilan matriks perbandingan untuk memilih kandidat terbaik dari 2 hingga 4 pelamar secara berdampingan (*side-by-side comparison*) meliputi dimensi verbal, numerik, logika, Kraepelin (KPM & stabilitas), dan riwayat tugas.
3. **Bulk Operations Management:** Ketiadaan operasi massal (bulk invitation via CSV email upload, bulk role update, bulk certificate revocation) menjadi hambatan adopsi enterprise berskala ribuan kandidat.
4. **Disconnection, Crash & Retake Dispute Workflow (`REC-07`):** Ketika kandidat mengalami pemadaman listrik, crash sistem operasi, atau false positive proctoring, sistem saat ini mengunci sesi ujian secara permanen. Diperlukan alur pengajuan tiket banding (*dispute request*) oleh siswa dan panel persetujuan re-attempt oleh admin/perekrut (dipromosikan ke prioritas **P1 High**).
5. **Pusat Notifikasi Terpadu Multi-Channel:** Belum tersedianya orkestrasi notifikasi transaksional melalui email (menggunakan Resend/SendGrid pada Sprint 16 `ARC-07`). Pada Sprint 14B, pengiriman link asesmen mengandalkan mekanisme direct URL sharing.
6. **Executive Business Analytics:** Ketiadaan dashboard metrik bisnis untuk memantau pemanfaatan lisensi enterprise, retensi kandidat, dan reliabilitas butir soal antar batch seleksi.

---

### 2.2 Matriks Kelengkapan Fitur: Sprint 1–13 Terkirim vs Spesifikasi PRD

Tabel di bawah ini menguraikan 100% kelengkapan fitur yang telah berhasil dikembangkan, diverifikasi, dan dideploy pada baseline `v2.3.0`:

| Sprint & Versi | Epik / Domain | Item Backlog Terkirim | Verifikasi Teknis & Bukti Kode | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Sprints 1–6** (`v1.0.0`–`v1.9.1`) | Foundation LMS, CAT Psychometrics & Kraepelin | Core Catalog, Quiz Runner, Kraepelin Simulator, Community, SRS Flashcards, Tryout Akbar, Basic Audit | Live produksi Vercel; 63 QA test cases (`POST-01` s.d. `PWA-01`) lulus 100%. | **TERKIRIM** |
| **Sprint 7** (`v1.10.0`) | Cloud Personalization & Security Benchmark | `BL-21`, `BL-22`, `BL-23`, `BL-23B`, `BL-23C` | Sinkronisasi `lesson_notes`, preferensi `user_study_preferences`, Sandbox Excel (`=SUM`, `=AVERAGE`, `=IF`, `=VLOOKUP`), Suite keamanan & latensi. | **TERKIRIM** |
| **Sprint 8** (`v1.11.0`) | 1v1 Duel Arena, Smart Drill & Kraepelin Trend | `BL-24`, `BL-25`, `BL-26` | Persistensi duel `quiz_challenges`, latihan terfokus `?subtest=` (Smart Drill), tren riwayat Kraepelin `kraepelin_attempts`. | **TERKIRIM** |
| **Sprint 9** (`v1.12.0`) | Teacher Inline Edit & Admin Cloud Audit | `BL-27`, `BL-28`, `BL-29` | RPC `updateQuestionInQuiz`, tabel `admin_audit_logs` di Supabase, ekspor CSV tersanitasi anti-formula injection. | **TERKIRIM** |
| **Sprint 10** (`v2.0.0` Major) | Talent Passport & 5-Dimension Competency Radar | `BL-30`, `BL-31`, `BL-32`, `BL-32B` | Algoritma SVG 5D Radar (`talentRadar.ts`), profil publik `/talent/:userId`, verifikasi portal `/verify` 2.0, isolasi admin (`ADM-06`). | **TERKIRIM** |
| **Sprint 11** (`v2.1.0`) | Private Cohorts, Study Agenda & SQL Lab | `BL-33`, `BL-34`, `BL-35` | Manajemen cohort & kode invite (`cohorts`), kalender agenda & ekspor `.ics`, Sandbox SQL (`sqlSandboxEngine.ts`). | **TERKIRIM** |
| **Sprint 12** (`v2.2.0`) | Diagnostic Plan, Bookmarks, Telemetry & UI Revamp | `BL-36`, `BL-37`, `BL-38`, `BL-38B` s.d. `BL-38G` | Rekomendasi belajar adaptif, bookmark soal, error telemetry, typing speed simulator (`/typing`), Bento Hero, Zen Mode. | **TERKIRIM** |
| **Sprint 13** (`v2.3.0`) | Proctoring Lite, Short Answer & Studio Revamp | `BL-39`, `BL-40`, `BL-40B` s.d. `BL-40E`, `BL-41` | Telemetri `tab_switch_count`, soal isian singkat & formula, lab interview STAR, kloning kursus ke Draft, broadcast banner, stress test 5.000 ops. | **TERKIRIM** |
| **Sprint 14** (`v3.0.0` Major) | Recruiter Portal & B2B Multi-Tenancy | `BL-42`, `BL-43`, `BL-44` | Spesifikasi siap dalam PRD; diputuskan dipecah menjadi Sprint 14A dan 14B untuk stabilitas dan mitigasi risiko regresi. | **PLANNED** |

---

### 2.3 Analisis Risiko Bundling Sprint 14 & Usulan Pembagian Sprint 14A / 14B

#### Identifikasi Risiko Bundling Monolitik Sprint 14 (`v3.0.0` Major)
Dalam rencana sprint backlog awal (`03_FINAL_SPRINT_BACKLOG_MINOR_TO_MAJOR.md`), Sprint 14 direncanakan menggabungkan tiga fitur besar sekaligus:
1. `BL-42`: Recruiter Portal (`/recruiter`), Talent Search dengan slider 5D Radar, dan Shortlist CRM.
2. `BL-43`: Custom Assessment Link Engine (`/quiz/:id?invite=...`) dengan batasan kuota dan rekap hasil tes.
3. `BL-44`: Multi-Tenant Organization Branding & penetapan role `recruiter` pada autentikasi, router, dan sertifikat resmi.

Penggabungan seluruh kapabilitas ini ke dalam satu siklus sprint menghadirkan **tiga risiko kritis**:
- **Risiko Kerapuhan Arsitektur Data (Data Model Prerequisite Gap):** `BL-42` dan `BL-43` membutuhkan fondasi relasi organisasi (`organizations`, `organization_members`) dan RLS multi-tenant yang sangat kuat. Membangun UI rekrutmen sebelum skema multi-tenancy stabil berisiko memicu kebocoran data kandidat antar perusahaan (*cross-tenant leakage*).
- **Risiko Regresi Luas (Broad Regression Impact):** Penambahan role `recruiter` ke dalam router (`AppRouter.tsx`), model user (`lms.ts`), dan layout navigasi (`TopbarNav.tsx`) berpotensi mengganggu 107 QA test cases yang telah berjalan stabil.
- **Beban Kognitif Pengujian (Testing Overload):** Menguji alur pencarian kandidat, generasi token ujian, restriksi RLS, dan penyesuaian CSS brand variables secara serentak dalam satu QA cycle melebihi kapasitas pengujian yang andal.

#### Solusi Strategis: Pemecahan Menjadi Sprint 14A dan Sprint 14B

```
+-----------------------------------------------------------------------------------+
|                        STRATEGI STAGED SPRINT 14                                  |
+-----------------------------------------------------------------------------------+
                                          |
          +-------------------------------+-------------------------------+
          |                                                               |
          v                                                               v
+-----------------------------------+           +-----------------------------------+
|     Sprint 14A (Fondasi & RBAC)   |           |    Sprint 14B (Asesmen & CRM)     |
+-----------------------------------+           +-----------------------------------+
| 1. Skema public.organizations     |           | 1. Skema assessment_invitations   |
| 2. Skema organization_members     |           | 2. Generator link ujian kustom    |
| 3. Role 'recruiter' di Auth & RLS |           | 3. Branded Exam Environment       |
| 4. Portal /recruiter (Pencarian)  |           | 4. Shortlist CRM & Catatan HR     |
| 5. Theme Engine (CSS Custom Props)|           | 5. Mobile Floating Question Drawer|
| 6. Konsolidasi Modal Accessible   |           | 6. Rekap Hasil Ujian Khusus Org   |
| 7. QAE-14A: Automated RBAC Tests  |           | 7. QAE-14B: Automated Invitations |
+-----------------------------------+           +-----------------------------------+
```

- **Sprint 14A (`v3.0.0-alpha` / `v3.0.0-rc1`):** Fokus pada integritas data, skema tenant, otorisasi RBAC, isolasi navigasi, antarmuka pencarian kandidat Talent Discovery, pembersihan hutang teknis frontend (Theme Engine & Konsolidasi Modal), serta suite pengujian otomatis `QAE-14A` (`REC-01..03`, `ORG-01..03`, `A11Y-01`).
- **Sprint 14B (`v3.0.0` GA):** Fokus pada mesin asesmen korporat (token undangan via direct URL sharing, isolasi hasil tes dari Talent Passport publik, header co-branding), CRM Shortlist pelamar, pengoptimalan UX ujian mobile, serta suite pengujian otomatis `QAE-14B` (`REC-04..05`, `INV-01..04`, `SEC-03`, `DS-01..03`).

---

### 2.4 Cakupan Roadmap Horizon Strategis (Sprints 15–20+)

Berdasarkan analisis kebutuhan industri psikotes kerja dan seleksi institusional, berikut adalah peta jalan strategis rilis pasca-`v3.0.0`:

#### Sprint 15 (`v3.1.0` Minor): Enterprise ATS Kanban Pipeline & Psychometric Engine Foundation
- **ATS Kanban Board (`REC-06`):** Pipeline pelamar interaktif (Tahapan: *Invited → In Progress → Evaluated → Shortlisted → Selected / Rejected*) dengan drag-and-drop, catatan evaluasi internal HR, dan tagging kandidat.
- **Matriks Komparasi Kandidat:** Antarmuka komparatif berdampingan (*side-by-side*) untuk 2–4 kandidat, membandingkan skor 5D Radar, tren Kraepelin, dan rekam jejak hands-on lab.
- **Alur Banding Ujian & Diskualifikasi (`REC-07` — Promoted to P1 High):** Formulir pengajuan ujian ulang bagi kandidat yang mengalami kendala teknis terverifikasi (gangguan sinyal, browser crash), dilengkapi konsol persetujuan bagi Recruiter dan Admin.
- **Ergonomi Mobile Kraepelin (`UI-15A` — Rebalanced to P1 High):** Penguncian viewport `h-dvh overflow-hidden` dan penggantian keypad 5-kolom dengan format 3x4 telephone numpad zero-scroll.
- **Mesin Psikotes DISC & MBTI (`ARC-05`):** Dukungan struktur soal dikotomi biner (MBTI) dan format ipsatif Most/Least (DISC) dengan visualisasi hasil 4 kuadran.

#### Sprint 16 (`v3.2.0` Minor): Multi-Tenant Subdomain, Tata Kelola Org & Live Proctoring
- **Wildcard Subdomain Routing (`ARC-04` — `<tenant>.lokatalenta.app`):** Dynamic tenant resolver yang membaca host header, memuat konfigurasi warna, logo korporat, dan katalog asesmen internal secara otomatis.
- **Konsol Tata Kelola Admin Organisasi (`org_admin`):** Dashboard manajemen keanggotaan institusi, kuota lisensi, dan log aktivitas internal staf HR.
- **Mesin Psikotes Kognitif & Norma (`ARC-06` — CFIT Skala 2/3 & Papikostick):** Tabel konversi norma IQ terstandarisasi Indonesia untuk CFIT dan kalkulasi 20 aspek arah kepribadian kerja PAPI Kostick.
- **Supabase Edge Functions & Email Transaksional (`ARC-07`):** Runtime serverless Deno untuk pengiriman undangan ujian otomatis via Resend/SendGrid dan pembuatan dokumen laporan psikotes PDF otomatis. (Pada Sprint 14B sebelumnya, link asesmen disebarkan secara direct URL sharing).
- **Hub WebSocket Live Proctoring:** Pemantauan status pengerjaan kandidat secara real-time (aktif, kehilangan fokus, peringatan tab) menggunakan Supabase Realtime Broadcast.

#### Sprint 17 (`v3.3.0` Minor): AI STAR Interview Evaluator & Prediksi Job-Fit
- **AI STAR Evaluator (`REC-11`):** Pemanfaatan LLM untuk mengevaluasi jawaban simulasi interview STAR (Situation, Task, Action, Result), memberikan umpan balik atas kekuatan kata kerja aksi, spesifisitas metrik, dan tingkat kejelasan respon.
- **Algoritma Skor Job-Fit Otomatis:** Perhitungan keselarasan kandidat terhadap profil pekerjaan (Job Profile Persona Matching) berdasarkan gabungan skor kognitif, ketahanan Kraepelin, dan profil kepribadian.

#### Sprint 18 (`v3.4.0` Minor): Enterprise Anti-Cheat Lockdown Mode
- **Lockdown Ujian Tingkat Enterprise (`SEC-04`):** Mode layar penuh wajib (*mandatory fullscreen*), pencegahan tombol ESC/Alt+Tab, pemblokiran salin-tempel (*clipboard block*), dan deteksi gawai multi-monitor.

#### Sprint 19 (`v3.5.0` Minor): Saldo Kredit Asesmen B2B & Integrasi Billing Payment Gateway
- **Sistem Kredit Asesmen Korporat (`FIN-01`):** Model monetisasi *pay-per-completed-assessment* dengan pengurangan saldo kredit otomatis saat kandidat men-submit asesmen.
- **Otomasi Penagihan & Checkout (Midtrans / Xendit):** Pembelian paket kuota ujian korporat melalui Virtual Account, QRIS, dan invoice penagihan resmi otomatis.

#### Sprint 20 (`v4.0.0` Major): Open Assessment REST API & Ekosistem Webhooks
- **Open REST & GraphQL API (`ARC-10`):** Akses terprogram bagi perusahaan untuk mengintegrasikan LokaTalenta dengan sistem HRIS pihak ketiga (Workday, SAP SuccessFactors, BambooHR, Mekari Talenta).
- **Sistem Webhooks Real-time:** Pengiriman event webhook instan (`assessment.started`, `assessment.completed`, `proctoring.flagged`) ke endpoint korporat dengan mekanisme auto-retry dan HMAC signature verification.

---

## 3. Architecture & Backend Engineering Deep-Dive

### 3.1 Reality Check Arsitektur & Tech Stack
Pemeriksaan menyeluruh pada konfigurasi sistem (`client/package.json`, `client/vercel.json`, `supabase/migrations/`) menegaskan realitas teknologi berikut:
- **Client App Shell:** Pure Single Page Application (SPA) berbasis React 19.3.1, Vite 8.3.6, TypeScript ~7.0.2, Tailwind CSS v4.3.5, React Router v7.18.6, TanStack Query v5.108.3, dan Zustand v5.1.0. Routing Vercel menggunakan rewrite URL SPA `/(.*) -> /index.html`.
- **Ketiadaan Server Tradisional:** **TIDAK ADA server Next.js, TIDAK ADA Express/Node.js backend, dan TIDAK ADA custom API gateway tersendiri.**
- **Backend Architecture:** Pure Backend-as-a-Service (BaaS) menggunakan Supabase (PostgreSQL 15+, PostgREST, Supabase Auth, Row-Level Security, dan 14 fungsi RPC `SECURITY DEFINER`).
- **Paradoks Dual-Mode Local Storage:** Seluruh service API di `lmsApi.ts` membungkus pemanggilan Supabase dalam blok `try/catch` dengan fallback ke `localStorage`. Walaupun menjamin keandalan demo offline 100%, strategi ini menyamarkan *silent bugs* pada migrasi database cloud, karena fungsi lokal JavaScript berjalan normal meskipun RPC Supabase mengalami kegagalan.

---

### 3.2 Post-Mortem Defek Backend Kritis Sprint 13 & Patch Lengkap

#### Defek 1: Kegagalan Penilaian Soal Isian Singkat (`short_answer`) pada Supabase RPC
- **Deskripsi Masalah:** Pada migrasi `20261125100000_sprint13_proctoring_short_answer_star.sql:9-17`, tabel `public.questions` dimodifikasi dengan menghapus batasan `NOT NULL` pada `correct_option` dan menambahkan kolom `accepted_answers TEXT[]` serta `case_sensitive BOOLEAN`. Namun, fungsi RPC `public.submit_quiz_attempt` (`202611230008_backend_sync_and_assignment_rubric.sql:59-61`) **tidak diperbarui**.
- **Mekanisme Kegagalan:** Pada soal bertipe `short_answer`, nilai `v_rec.correct_option` adalah `NULL`. Di dalam SQL standard, evaluasi `'jawaban_kandidat' = NULL` selalu menghasilkan `NULL` (bernilai salah / FALSE). Akibatnya, seluruh soal isian singkat yang dikerjakan kandidat menggunakan cloud Supabase dinilai salah dan menghasilkan skor 0%.

#### Defek 2: Telemetri Proctoring Hilang pada Pengiriman Cloud
- **Deskripsi Masalah:** Migrasi Sprint 13 telah menambahkan kolom `tab_switch_count INT DEFAULT 0` dan `focus_loss_events JSONB DEFAULT '[]'::jsonb` ke dalam `public.quiz_attempts`. Di sisi frontend, `QuizRunnerPage.tsx:199-201` memanggil `persistFocusIntegrityForAttempt(attempt.id, tabSwitchCount, focusLossEvents)`.
- **Mekanisme Kegagalan:** Fungsi `persistFocusIntegrityForAttempt` (`useFocusIntegrityMonitor.ts:97`) **hanya menyimpan data ke `localStorage`**. Saat memanggil `lmsApi.submitQuizAttempt(attempt.id, answers)`, payload hanya mempassing `p_attempt_id` dan `p_answers`.
- **Dampak:** Di database Supabase, kolom `tab_switch_count` pada riwayat ujian kandidat selalu bernilai `0` dan `focus_loss_events` selalu kosong. Integritas proctoring tidak tercatat di cloud dan tidak dapat diakses oleh perekrut atau admin dari gawai lain.

#### Patch PL/pgSQL Lengkap dan Robust untuk `submit_quiz_attempt` (Sprint 13.1 Hotfix)
Berikut adalah kode executable lengkap fungsi `submit_quiz_attempt` yang menyelesaikan defek penilaian isian singkat, normalisasi spasi multi-karakter, pengecekan sensitivitas huruf, serta persistensi telemetri proctoring:

```sql
-- SPRINT 13.1 HOTFIX: Patch Komprehensif submit_quiz_attempt
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  p_attempt_id UUID,
  p_answers JSONB,
  p_tab_switch_count INT DEFAULT 0,
  p_focus_loss_events JSONB DEFAULT '[]'::jsonb
)
RETURNS public.quiz_attempts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt public.quiz_attempts;
  v_quiz public.quizzes;
  v_total INT := 0;
  v_correct INT := 0;
  v_score INT := 0;
  v_breakdown JSONB := '{}'::jsonb;
  v_rec RECORD;
  v_cat_total INT;
  v_cat_correct INT;
  v_student_ans TEXT;
  v_is_match BOOLEAN;
  v_norm_student TEXT;
BEGIN
  -- 1. Validasi keberadaan record pengerjaan kuis
  SELECT * INTO v_attempt FROM public.quiz_attempts WHERE id = p_attempt_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;

  -- 2. Verifikasi kepemilikan attempt (otorisasi pengguna)
  IF v_attempt.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: attempt does not belong to current authenticated user';
  END IF;

  -- 3. Idempotency guard: jika sudah disubmit, kembalikan record tanpa kalkulasi ulang
  IF v_attempt.submitted_at IS NOT NULL THEN
    RETURN v_attempt;
  END IF;

  -- 4. Ambil definisi kuis
  SELECT * INTO v_quiz FROM public.quizzes WHERE id = v_attempt.quiz_id;

  -- 5. Fallback jika p_answers kosong
  IF p_answers IS NULL OR p_answers = '{}'::jsonb THEN
    p_answers := COALESCE(v_attempt.answers, '{}'::jsonb);
  END IF;

  -- 6. Evaluasi seluruh butir soal yang ditarik (drawn questions)
  FOR v_rec IN
    SELECT id, category_tag, correct_option, question_type, accepted_answers, case_sensitive
    FROM public.questions
    WHERE quiz_id = v_attempt.quiz_id
      AND (
        v_attempt.question_ids IS NULL
        OR array_length(v_attempt.question_ids, 1) IS NULL
        OR id = ANY(v_attempt.question_ids)
      )
  LOOP
    v_total := v_total + 1;
    v_cat_total := COALESCE((v_breakdown -> v_rec.category_tag ->> 'total')::INT, 0) + 1;
    v_cat_correct := COALESCE((v_breakdown -> v_rec.category_tag ->> 'correct')::INT, 0);
    v_is_match := FALSE;

    IF v_rec.question_type = 'short_answer' THEN
      v_student_ans := p_answers ->> v_rec.id::TEXT;
      IF v_student_ans IS NOT NULL AND TRIM(v_student_ans) <> '' THEN
        -- Normalisasi spasi berulang dan whitespace
        v_norm_student := regexp_replace(TRIM(v_student_ans), '\s+', ' ', 'g');
        
        IF v_rec.case_sensitive IS TRUE THEN
          SELECT EXISTS (
            SELECT 1 FROM unnest(v_rec.accepted_answers) AS ans
            WHERE regexp_replace(TRIM(ans), '\s+', ' ', 'g') = v_norm_student
          ) INTO v_is_match;
        ELSE
          SELECT EXISTS (
            SELECT 1 FROM unnest(v_rec.accepted_answers) AS ans
            WHERE LOWER(regexp_replace(TRIM(ans), '\s+', ' ', 'g')) = LOWER(v_norm_student)
          ) INTO v_is_match;
        END IF;
      END IF;
    ELSE
      -- Logika pilihan ganda standar (MCQ)
      IF (p_answers ->> v_rec.id::TEXT) = v_rec.correct_option THEN
        v_is_match := TRUE;
      END IF;
    END IF;

    IF v_is_match THEN
      v_correct := v_correct + 1;
      v_cat_correct := v_cat_correct + 1;
    END IF;

    v_breakdown := jsonb_set(
      v_breakdown,
      ARRAY[v_rec.category_tag],
      jsonb_build_object('total', v_cat_total, 'correct', v_cat_correct),
      true
    );
  END LOOP;

  -- 7. Kalkulasi persentase skor akhir
  IF v_total > 0 THEN
    v_score := ROUND((v_correct::NUMERIC / v_total::NUMERIC) * 100);
  END IF;

  -- 8. Simpan jawaban, skor, rincian kategori, serta telemetri anti-cheat
  UPDATE public.quiz_attempts
  SET
    answers = p_answers,
    score = v_score,
    category_breakdown = v_breakdown,
    submitted_at = now(),
    tab_switch_count = COALESCE(p_tab_switch_count, tab_switch_count),
    focus_loss_events = CASE
      WHEN p_focus_loss_events IS NOT NULL AND p_focus_loss_events <> '[]'::jsonb
        THEN p_focus_loss_events
      ELSE focus_loss_events
    END
  WHERE id = p_attempt_id
  RETURNING * INTO v_attempt;

  RETURN v_attempt;
END;
$$;
```

#### Patch Penilaian Latihan Soal Mandiri (`check_practice_answer`)
```sql
-- SPRINT 13.1 HOTFIX: Penilaian Soal Isian Singkat pada Mode Latihan
CREATE OR REPLACE FUNCTION public.check_practice_answer(
  p_question_id UUID,
  p_selected_option TEXT
)
RETURNS TABLE (
  is_correct BOOLEAN,
  correct_option TEXT,
  explanation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_q public.questions;
  v_is_match BOOLEAN := FALSE;
  v_norm_selected TEXT;
BEGIN
  SELECT * INTO v_q FROM public.questions WHERE id = p_question_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question not found';
  END IF;

  IF v_q.question_type = 'short_answer' THEN
    IF p_selected_option IS NOT NULL AND TRIM(p_selected_option) <> '' THEN
      v_norm_selected := regexp_replace(TRIM(p_selected_option), '\s+', ' ', 'g');
      IF v_q.case_sensitive IS TRUE THEN
        SELECT EXISTS (
          SELECT 1 FROM unnest(v_q.accepted_answers) AS ans
          WHERE regexp_replace(TRIM(ans), '\s+', ' ', 'g') = v_norm_selected
        ) INTO v_is_match;
      ELSE
        SELECT EXISTS (
          SELECT 1 FROM unnest(v_q.accepted_answers) AS ans
          WHERE LOWER(regexp_replace(TRIM(ans), '\s+', ' ', 'g')) = LOWER(v_norm_selected)
        ) INTO v_is_match;
      END IF;
    END IF;
    
    RETURN QUERY
    SELECT
      v_is_match AS is_correct,
      COALESCE(array_to_string(v_q.accepted_answers, ' / '), '') AS correct_option,
      v_q.explanation;
  ELSE
    RETURN QUERY
    SELECT
      (v_q.correct_option = p_selected_option) AS is_correct,
      v_q.correct_option,
      v_q.explanation;
  END IF;
END;
$$;
```

---

### 3.3 Desain Arsitektur B2B Multi-Tenancy (Decoupled Staged Migrations)

Untuk menjamin pemisahan tanggung jawab (*separation of concerns*) dan menghindari kegagalan dependensi skema yang belum ada, migrasi DDL multi-tenancy dipecah secara ketat ke dalam **Sprint 14A** (Fondasi Organisasi & RBAC) dan **Sprint 14B** (Asesmen Korporat & Shortlist CRM).

#### 1. Sprint 14A Foundation Migration (`202611260001_sprint14a_multitenancy_foundation.sql`)
Tahap ini meletakkan entitas organisasi dan keanggotaan staf, memperbarui batasan role pada `profiles`, serta menambahkan tenant scoping dasar pada pengerjaan tes tanpa mereferensikan tabel undangan asesmen yang baru hadir di Sprint 14B:

```sql
-- ============================================================================
-- SPRINT 14A MIGRATION: Multi-Tenancy Foundation & RBAC
-- ============================================================================

-- 1. Perbarui batasan check role pada profiles untuk menyertakan 'recruiter'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('student', 'teacher', 'admin', 'recruiter'));

-- 2. Tabel Organisasi Klien / Institusi Mitra B2B
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  custom_domain TEXT UNIQUE,
  logo_url TEXT,
  brand_primary TEXT NOT NULL DEFAULT '#0F766E',
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'enterprise')),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_custom_domain ON public.organizations(custom_domain);

-- 3. Tabel Keanggotaan Staf & Hak Akses Organisasi (RBAC Internal)
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('org_admin', 'recruiter', 'proctor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

CREATE INDEX idx_organization_members_user ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_org ON public.organization_members(org_id);

-- 4. Tambahkan Kolom Scoping Organisasi pada Tabel Ujian & Kuis Eksisting
-- (PERHATIAN: JANGAN mereferensikan assessment_invitations pada Sprint 14A!)
ALTER TABLE public.quiz_attempts
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_public_b2c BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.kraepelin_attempts
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_public_b2c BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_public_catalog BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX idx_quiz_attempts_org ON public.quiz_attempts(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_kraepelin_attempts_org ON public.kraepelin_attempts(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_quizzes_org ON public.quizzes(organization_id) WHERE organization_id IS NOT NULL;
```

#### 2. Sprint 14B Corporate Assessments Migration (`202611270001_sprint14b_corporate_assessments.sql`)
Setelah skema fondasi Sprint 14A stabil dan terverifikasi oleh suite `QAE-14A`, Sprint 14B mengintroduksi entitas undangan asesmen privat berkuota, shortlist kandidat CRM, serta menghubungkan referensi `invitation_id` ke `public.quiz_attempts`:

```sql
-- ============================================================================
-- SPRINT 14B MIGRATION: Corporate Assessment Invitations & Shortlist CRM
-- ============================================================================

-- 1. Tabel Undangan Asesmen Korporat Berkuota (Link Token)
-- Catatan Teknis: Kolom quiz_id strictly bertipe UUID merujuk ke public.quizzes(id)
CREATE TABLE public.assessment_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  candidate_email TEXT NULL,
  invite_token TEXT UNIQUE NOT NULL,
  max_uses INT NOT NULL DEFAULT 1,
  current_uses INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'exhausted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessment_invitations_token ON public.assessment_invitations(invite_token);
CREATE INDEX idx_assessment_invitations_org ON public.assessment_invitations(organization_id);
CREATE INDEX idx_assessment_invitations_quiz ON public.assessment_invitations(quiz_id);

-- 2. Tabel Manajemen Kandidat Favorit (Shortlist CRM & Pipeline Pelamar)
CREATE TABLE public.recruiter_shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'shortlisted' 
    CHECK (stage IN ('applied', 'screening', 'shortlisted', 'interview', 'offered', 'rejected')),
  notes TEXT DEFAULT '',
  rating INT CHECK (rating BETWEEN 1 AND 5),
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, candidate_id)
);

CREATE INDEX idx_recruiter_shortlists_org ON public.recruiter_shortlists(organization_id);
CREATE INDEX idx_recruiter_shortlists_candidate ON public.recruiter_shortlists(candidate_id);

-- 3. Hubungkan invitation_id pada quiz_attempts (Hanya pada Sprint 14B!)
ALTER TABLE public.quiz_attempts
  ADD COLUMN IF NOT EXISTS invitation_id UUID REFERENCES public.assessment_invitations(id) ON DELETE SET NULL;

CREATE INDEX idx_quiz_attempts_invitation ON public.quiz_attempts(invitation_id) WHERE invitation_id IS NOT NULL;
```

---

### 3.4 Kebijakan Eksplisit Row Level Security (RLS) pada 4 Tabel Multi-Tenant

Untuk menjamin isolasi data setingkat kernel database, seluruh tabel multi-tenant dilindungi oleh kebijakan PostgreSQL RLS native menggunakan fungsi helper keamanan `SECURITY DEFINER`:

#### 1. Security Helper Functions
```sql
-- Helper 1: Mendapatkan daftar organization_id tempat user saat ini terdaftar
CREATE OR REPLACE FUNCTION public.current_user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id
  FROM public.organization_members
  WHERE user_id = auth.uid();
$$;

-- Helper 2: Validasi apakah pengguna adalah anggota organisasi dengan peran tertentu
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id UUID, p_roles TEXT[] DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_role TEXT;
  v_member_role TEXT;
BEGIN
  -- Superadmin platform selalu memiliki hak akses penuh (bypass guard)
  SELECT role INTO v_profile_role FROM public.profiles WHERE id = auth.uid();
  IF v_profile_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Periksa keanggotaan dalam tabel organization_members
  SELECT role INTO v_member_role
  FROM public.organization_members
  WHERE org_id = p_org_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Jika p_roles tidak ditentukan, cukup pastikan anggota terdaftar
  IF p_roles IS NULL OR array_length(p_roles, 1) IS NULL THEN
    RETURN TRUE;
  END IF;

  RETURN v_member_role = ANY(p_roles);
END;
$$;
```

#### 2. Kebijakan RLS Lengkap dan Executable

```sql
-- ----------------------------------------------------------------------------
-- A. RLS POLICIES: public.organizations
-- ----------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organizations visible to members, admins, or active lookup" ON public.organizations;
CREATE POLICY "Organizations visible to members, admins, or active lookup"
  ON public.organizations FOR SELECT TO authenticated, anon
  USING (
    is_active = TRUE
    OR id IN (SELECT public.current_user_org_ids())
    OR public.current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Organizations modifiable by org_admin or platform admin" ON public.organizations;
CREATE POLICY "Organizations modifiable by org_admin or platform admin"
  ON public.organizations FOR UPDATE TO authenticated
  USING (
    public.is_org_member(id, ARRAY['org_admin'])
    OR public.current_user_role() = 'admin'
  )
  WITH CHECK (
    public.is_org_member(id, ARRAY['org_admin'])
    OR public.current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Organizations creatable only by platform admin" ON public.organizations;
CREATE POLICY "Organizations creatable only by platform admin"
  ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Organizations deletable only by platform admin" ON public.organizations;
CREATE POLICY "Organizations deletable only by platform admin"
  ON public.organizations FOR DELETE TO authenticated
  USING (public.current_user_role() = 'admin');

-- ----------------------------------------------------------------------------
-- B. RLS POLICIES: public.organization_members
-- ----------------------------------------------------------------------------
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members visible to same org staff or platform admin" ON public.organization_members;
CREATE POLICY "Members visible to same org staff or platform admin"
  ON public.organization_members FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT public.current_user_org_ids())
    OR public.current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Members manageable by org_admin or platform admin" ON public.organization_members;
CREATE POLICY "Members manageable by org_admin or platform admin"
  ON public.organization_members FOR ALL TO authenticated
  USING (
    public.is_org_member(org_id, ARRAY['org_admin'])
    OR public.current_user_role() = 'admin'
  )
  WITH CHECK (
    public.is_org_member(org_id, ARRAY['org_admin'])
    OR public.current_user_role() = 'admin'
  );

-- ----------------------------------------------------------------------------
-- C. RLS POLICIES: public.assessment_invitations
-- ----------------------------------------------------------------------------
ALTER TABLE public.assessment_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Invitations visible to org staff or platform admin" ON public.assessment_invitations;
CREATE POLICY "Invitations visible to org staff or platform admin"
  ON public.assessment_invitations FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT public.current_user_org_ids())
    OR public.current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Invitations manageable by org recruiter, org admin, or platform admin" ON public.assessment_invitations;
CREATE POLICY "Invitations manageable by org recruiter, org admin, or platform admin"
  ON public.assessment_invitations FOR ALL TO authenticated
  USING (
    public.is_org_member(organization_id, ARRAY['org_admin', 'recruiter'])
    OR public.current_user_role() = 'admin'
  )
  WITH CHECK (
    public.is_org_member(organization_id, ARRAY['org_admin', 'recruiter'])
    OR public.current_user_role() = 'admin'
  );

-- ----------------------------------------------------------------------------
-- D. RLS POLICIES: public.recruiter_shortlists
-- ----------------------------------------------------------------------------
ALTER TABLE public.recruiter_shortlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shortlists visible to org staff or platform admin" ON public.recruiter_shortlists;
CREATE POLICY "Shortlists visible to org staff or platform admin"
  ON public.recruiter_shortlists FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT public.current_user_org_ids())
    OR public.current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Shortlists manageable by org recruiter, org admin, or platform admin" ON public.recruiter_shortlists;
CREATE POLICY "Shortlists manageable by org recruiter, org admin, or platform admin"
  ON public.recruiter_shortlists FOR ALL TO authenticated
  USING (
    public.is_org_member(organization_id, ARRAY['org_admin', 'recruiter'])
    OR public.current_user_role() = 'admin'
  )
  WITH CHECK (
    public.is_org_member(organization_id, ARRAY['org_admin', 'recruiter'])
    OR public.current_user_role() = 'admin'
  );

-- ----------------------------------------------------------------------------
-- E. PENYELARASAN RLS PADA public.quiz_attempts (Tenant Scoping)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users manage own quiz attempts" ON public.quiz_attempts;

CREATE POLICY "Candidates view own attempts or org recruiters view tenant attempts"
  ON public.quiz_attempts FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (organization_id IS NOT NULL AND organization_id IN (SELECT public.current_user_org_ids()))
    OR public.current_user_role() IN ('teacher', 'admin')
  );

CREATE POLICY "Candidates insert own attempts"
  ON public.quiz_attempts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Candidates update own unsubmitted attempts"
  ON public.quiz_attempts FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND submitted_at IS NULL)
  WITH CHECK (user_id = auth.uid());
```

---

### 3.5 Mitigasi Kebocoran Data Kandidat pada 5 Vektor Public RPC

Peralihan ke model enterprise mensyaratkan proteksi ketat agar aktivitas, hasil asesmen rahasia korporat, dan kunci jawaban tidak bocor melalui endpoint RPC publik.

#### Vektor 1: Proteksi Kunci Jawaban pada Review Hasil Ujian (`get_attempt_review`)
- **Masalah:** Pada fungsi eksisting, setelah kandidat men-submit ujian, `get_attempt_review` mengembalikan kolom `correct_option` dan `explanation`. Selain itu, recruiter perusahaan yang menyelenggarakan tes terkunci dan tidak dapat melihat lembar jawaban pelamar.
- **Mitigasi:**
  1. Untuk ujian korporat (`is_public_b2c = false` atau `organization_id IS NOT NULL`), nilai `correct_option` dan `explanation` **disembunyikan (NULL)** bagi kandidat. Hal ini mencegah bocornya butir bank soal perusahaan ke publik.
  2. Perekrut yang terdaftar pada organisasi pemilik attempt diberikan hak akses penuh untuk mereview lembar jawaban kandidat.

```sql
DROP FUNCTION IF EXISTS public.get_attempt_review(UUID);
CREATE OR REPLACE FUNCTION public.get_attempt_review(p_attempt_id UUID)
RETURNS TABLE (
  question_id UUID,
  category_tag TEXT,
  question_text TEXT,
  image_url TEXT,
  audio_text TEXT,
  audio_lang TEXT,
  options JSONB,
  correct_option TEXT,
  explanation TEXT,
  order_index INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt public.quiz_attempts;
  v_is_recruiter BOOLEAN := FALSE;
  v_is_owner BOOLEAN := FALSE;
  v_hide_keys BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_attempt FROM public.quiz_attempts WHERE id = p_attempt_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;

  v_is_owner := (v_attempt.user_id = auth.uid());
  
  -- Periksa apakah pemanggil adalah recruiter pada organisasi penyelenggara ujian
  IF v_attempt.organization_id IS NOT NULL THEN
    v_is_recruiter := public.is_org_member(v_attempt.organization_id, ARRAY['org_admin', 'recruiter', 'proctor']);
  END IF;

  -- Otorisasi: hanya pemilik attempt, recruiter organisasi terkait, mentor publik, atau superadmin
  IF NOT v_is_owner AND NOT v_is_recruiter AND public.current_user_role() NOT IN ('teacher', 'admin') THEN
    RAISE EXCEPTION 'Unauthorized to view this attempt review';
  END IF;

  IF v_attempt.submitted_at IS NULL THEN
    RAISE EXCEPTION 'Quiz has not been submitted yet';
  END IF;

  -- Kunci jawaban disembunyikan jika peserta melihat hasil ujian korporat privat
  IF v_is_owner AND NOT v_is_recruiter AND public.current_user_role() <> 'admin' THEN
    IF v_attempt.is_public_b2c IS FALSE OR v_attempt.organization_id IS NOT NULL THEN
      v_hide_keys := TRUE;
    END IF;
  END IF;

  RETURN QUERY
  SELECT 
    q.id AS question_id, 
    q.category_tag, 
    q.question_text, 
    q.image_url, 
    q.audio_text, 
    q.audio_lang, 
    q.options, 
    CASE WHEN v_hide_keys THEN NULL ELSE q.correct_option END AS correct_option, 
    CASE WHEN v_hide_keys THEN NULL ELSE q.explanation END AS explanation, 
    q.order_index
  FROM public.questions q
  WHERE q.quiz_id = v_attempt.quiz_id
    AND (
      v_attempt.question_ids IS NULL
      OR array_length(v_attempt.question_ids, 1) IS NULL
      OR q.id = ANY(v_attempt.question_ids)
    )
  ORDER BY q.order_index ASC;
END;
$$;
```

#### Vektor 2: Pencegahan Kebocoran Skor Korporat pada Leaderboard Publik (`get_public_leaderboard`)
- **Masalah:** Fungsi agregasi XP membaca seluruh pengerjaan di `quiz_attempts`. Nilai ujian seleksi korporat berpotensi mendongkrak peringkat XP publik siswa dan membeberkan aktivitas seleksi kerja privat.
- **Mitigasi:** Tambahkan klausa penyaring ketat `qa.is_public_b2c = TRUE AND qa.organization_id IS NULL`.

```sql
CREATE OR REPLACE FUNCTION public.get_public_leaderboard()
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  xp INT,
  level INT,
  completed_lessons INT,
  passed_quizzes INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH lesson_counts AS (
    SELECT lp.user_id, COUNT(*)::INT AS completed_lessons
    FROM public.lesson_progress lp
    GROUP BY lp.user_id
  ),
  attempt_counts AS (
    SELECT
      qa.user_id,
      COUNT(*) FILTER (WHERE qa.submitted_at IS NOT NULL)::INT AS total_attempts,
      COUNT(*) FILTER (WHERE qa.submitted_at IS NOT NULL AND COALESCE(qa.score, 0) >= 70)::INT AS passed_quizzes
    FROM public.quiz_attempts qa
    -- ISOLASI PRIVASI: Hanya kuis publik mandiri yang dihitung dalam XP leaderboard publik
    WHERE qa.is_public_b2c = TRUE AND qa.organization_id IS NULL
    GROUP BY qa.user_id
  ),
  computed AS (
    SELECT
      p.id AS user_id,
      p.full_name,
      COALESCE(lc.completed_lessons, 0) AS completed_lessons,
      COALESCE(ac.passed_quizzes, 0) AS passed_quizzes,
      (
        COALESCE(lc.completed_lessons, 0) * 20
        + COALESCE(ac.total_attempts, 0) * 40
        + COALESCE(ac.passed_quizzes, 0) * 35
      )::INT AS xp
    FROM public.profiles p
    LEFT JOIN lesson_counts lc ON lc.user_id = p.id
    LEFT JOIN attempt_counts ac ON ac.user_id = p.id
    WHERE p.role = 'student' AND p.is_active = true
  )
  SELECT
    c.user_id,
    c.full_name,
    c.xp,
    (FLOOR(c.xp / 200.0) + 1)::INT AS level,
    c.completed_lessons,
    c.passed_quizzes
  FROM computed c
  ORDER BY c.xp DESC
  LIMIT 50;
$$;
```

#### Vektor 3: Isolasi Analisis Butir Soal Pengajar Publik (`get_quiz_item_analysis`)
- **Masalah:** Guru atau mentor yang mengelola paket kuis publik tidak boleh melihat statistik jawaban dari sesi tes rekrutmen institusi B2B.
- **Mitigasi:** Saring data pengerjaan berdasarkan `qa.is_public_b2c = TRUE AND qa.organization_id IS NULL` saat diakses oleh instruktur publik.

```sql
CREATE OR REPLACE FUNCTION public.get_quiz_item_analysis(p_quiz_id UUID)
RETURNS TABLE (
  question_id UUID,
  question_text TEXT,
  category_tag TEXT,
  question_type TEXT,
  total_attempts INT,
  answered_count INT,
  correct_count INT,
  correct_rate NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.current_user_role() NOT IN ('admin', 'teacher', 'recruiter') THEN
    RAISE EXCEPTION 'Akses analitik butir soal ditolak.';
  END IF;

  RETURN QUERY
  WITH submitted AS (
    SELECT qa.id, qa.answers
    FROM public.quiz_attempts qa
    WHERE qa.quiz_id = p_quiz_id
      AND qa.submitted_at IS NOT NULL
      -- ISOLASI: Pengajar publik hanya melihat agregat ujian publik
      AND (
        public.current_user_role() = 'admin'
        OR (qa.is_public_b2c = TRUE AND qa.organization_id IS NULL)
        OR (qa.organization_id IN (SELECT public.current_user_org_ids()))
      )
  ),
  attempt_stats AS (
    SELECT COUNT(*)::INT AS total_cnt FROM submitted
  )
  SELECT
    q.id AS question_id,
    q.question_text,
    q.category_tag,
    q.question_type,
    ast.total_cnt AS total_attempts,
    COUNT(s.id) FILTER (
      WHERE NULLIF(trim(COALESCE(s.answers ->> q.id::text, '')), '') IS NOT NULL
    )::INT AS answered_count,
    COUNT(s.id) FILTER (
      WHERE CASE
        WHEN q.question_type = 'short_answer' THEN
          EXISTS (
            SELECT 1
            FROM unnest(q.accepted_answers) AS ans
            WHERE CASE
              WHEN q.case_sensitive THEN trim(COALESCE(s.answers ->> q.id::text, '')) = trim(ans)
              ELSE lower(trim(COALESCE(s.answers ->> q.id::text, ''))) = lower(trim(ans))
            END
          )
        ELSE
          upper(trim(COALESCE(s.answers ->> q.id::text, ''))) = upper(trim(COALESCE(q.correct_option, '')))
      END
    )::INT AS correct_count,
    CASE
      WHEN ast.total_cnt = 0 THEN 0::NUMERIC
      ELSE ROUND(
        (
          COUNT(s.id) FILTER (
            WHERE CASE
              WHEN q.question_type = 'short_answer' THEN
                EXISTS (
                  SELECT 1
                  FROM unnest(q.accepted_answers) AS ans
                  WHERE CASE
                    WHEN q.case_sensitive THEN trim(COALESCE(s.answers ->> q.id::text, '')) = trim(ans)
                    ELSE lower(trim(COALESCE(s.answers ->> q.id::text, ''))) = lower(trim(ans))
                  END
                )
              ELSE
                upper(trim(COALESCE(s.answers ->> q.id::text, ''))) = upper(trim(COALESCE(q.correct_option, '')))
            END
          )::NUMERIC / ast.total_cnt::NUMERIC
        ) * 100,
        1
      )
    END AS correct_rate
  FROM public.questions q
  CROSS JOIN attempt_stats ast
  LEFT JOIN submitted s ON true
  WHERE q.quiz_id = p_quiz_id
  GROUP BY q.id, q.question_text, q.category_tag, q.question_type, q.order_index, ast.total_cnt
  ORDER BY q.order_index ASC;
END;
$$;
```

#### Vektor 4: Proteksi Talent Passport Publik (`get_talent_passport`)
- **Masalah:** Fungsi profil publik `/talent/:userId` membaca seluruh tabel `quiz_attempts` dan `kraepelin_attempts`. Jika pelamar gagal pada tes seleksi rahasia sebuah perusahaan, kegagalan tersebut mencemari skor 5D Radar publiknya.
- **Mitigasi:** Tambahkan filter `is_public_b2c = TRUE AND organization_id IS NULL` pada kalkulasi rata-rata skor kuis, rincian radar subtes, dan metrik Kraepelin.

```sql
CREATE OR REPLACE FUNCTION public.get_talent_passport(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile record;
  v_category_scores jsonb := '{}'::jsonb;
  v_avg_quiz_score numeric := 0;
  v_passed_quizzes integer := 0;
  v_kraepelin record;
  v_certs jsonb := '[]'::jsonb;
  v_completed_lessons integer := 0;
BEGIN
  SELECT id, full_name, role, is_active, is_passport_public, created_at
    INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND OR v_profile.is_active IS FALSE OR v_profile.role <> 'student' OR v_profile.is_passport_public IS FALSE THEN
    RETURN NULL;
  END IF;

  -- 1. Agregasi kuis: HANYA pengerjaan publik B2C mandiri
  SELECT
    COALESCE(round(avg(score)::numeric, 1), 0),
    COUNT(*) FILTER (WHERE score >= 70)
  INTO v_avg_quiz_score, v_passed_quizzes
  FROM public.quiz_attempts
  WHERE user_id = p_user_id 
    AND submitted_at IS NOT NULL
    AND is_public_b2c = TRUE 
    AND organization_id IS NULL;

  -- 2. Agregasi Radar 5D: HANYA pengerjaan publik B2C mandiri
  SELECT COALESCE(
    jsonb_object_agg(cat_key, round(avg_pct)),
    '{}'::jsonb
  )
  INTO v_category_scores
  FROM (
    SELECT
      kv.key as cat_key,
      avg(
        CASE
          WHEN COALESCE((kv.value ->> 'total')::numeric, 0) > 0
            THEN ((kv.value ->> 'correct')::numeric / (kv.value ->> 'total')::numeric) * 100
          ELSE 0
        END
      ) as avg_pct
    FROM public.quiz_attempts qa,
      LATERAL jsonb_each(COALESCE(qa.category_breakdown, '{}'::jsonb)) as kv(key, value)
    WHERE qa.user_id = p_user_id 
      AND qa.submitted_at IS NOT NULL
      AND qa.is_public_b2c = TRUE 
      AND qa.organization_id IS NULL
    GROUP BY kv.key
  ) sub;

  -- 3. Agregasi Kraepelin: HANYA pengerjaan publik B2C mandiri
  SELECT
    COALESCE(max(stability_score), 0) as best_stability,
    COALESCE(round(avg(speed_kpm)::numeric, 1), 0) as avg_speed_kpm,
    COALESCE(round(avg(accuracy_pct)::numeric, 1), 0) as avg_accuracy_pct,
    COUNT(*) as total_runs
  INTO v_kraepelin
  FROM public.kraepelin_attempts
  WHERE user_id = p_user_id
    AND is_public_b2c = TRUE 
    AND organization_id IS NULL;

  -- 4. Pelajaran selesai
  SELECT COUNT(*)
  INTO v_completed_lessons
  FROM public.lesson_progress
  WHERE user_id = p_user_id;

  -- 5. Sertifikat publik
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'certificate_code', certificate_code,
        'course_title', course_title,
        'issued_at', issued_at
      )
    ),
    '[]'::jsonb
  )
  INTO v_certs
  FROM public.certificates
  WHERE user_id = p_user_id AND is_revoked = false;

  RETURN jsonb_build_object(
    'user_id', v_profile.id,
    'full_name', v_profile.full_name,
    'member_since', v_profile.created_at,
    'completed_lessons', v_completed_lessons,
    'avg_quiz_score', v_avg_quiz_score,
    'passed_quizzes', v_passed_quizzes,
    'category_scores', v_category_scores,
    'kraepelin', jsonb_build_object(
      'best_stability', v_kraepelin.best_stability,
      'avg_speed_kpm', v_kraepelin.avg_speed_kpm,
      'avg_accuracy_pct', v_kraepelin.avg_accuracy_pct,
      'total_runs', v_kraepelin.total_runs
    ),
    'certificates', v_certs
  );
END;
$$;
```

#### Vektor 5: RPC Atomik Klaim Token Undangan (`claim_and_start_assessment_invitation`) & Candidate Intake Journey
- **Masalah:** Akses token undangan rawan kondisi balapan (*Time-of-Check to Time-of-Use / TOCTOU quota race condition*) jika ribuan kandidat membuka tautan secara bersamaan. Selain itu, ada risiko pemalsuan tenant (*tenant spoofing*).
- **Solusi Rekayasa:** Penguncian baris eksplisit `FOR UPDATE` pada tabel `assessment_invitations`, validasi kedaluwarsa & kuota secara atomik, dan generasi record `quiz_attempts` terikat tenant.

```sql
CREATE OR REPLACE FUNCTION public.claim_and_start_assessment_invitation(
  p_invite_token TEXT,
  p_quiz_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation public.assessment_invitations;
  v_attempt public.quiz_attempts;
  v_existing_attempt public.quiz_attempts;
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Kandidat harus terautentikasi untuk memulai asesmen.';
  END IF;

  -- 1. Row Lock Atomik FOR UPDATE mencegah TOCTOU race conditions
  SELECT * INTO v_invitation
  FROM public.assessment_invitations
  WHERE invite_token = p_invite_token
    AND quiz_id = p_quiz_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token undangan tidak valid atau tidak cocok dengan paket kuis.';
  END IF;

  -- 2. Validasi status kedaluwarsa (expires_at)
  IF v_invitation.expires_at < now() OR v_invitation.status = 'expired' THEN
    UPDATE public.assessment_invitations SET status = 'expired' WHERE id = v_invitation.id;
    RAISE EXCEPTION 'Tautan undangan asesmen telah kedaluwarsa.';
  END IF;

  -- 3. Validasi status pencabutan atau kuota habis
  IF v_invitation.status IN ('revoked', 'exhausted') THEN
    RAISE EXCEPTION 'Tautan undangan asesmen sudah tidak aktif (status: %).', v_invitation.status;
  END IF;

  -- 4. Validasi email target khusus (jika undangan bersifat personal)
  IF v_invitation.candidate_email IS NOT NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    IF v_user_email IS NOT NULL AND LOWER(v_user_email) <> LOWER(v_invitation.candidate_email) THEN
      RAISE EXCEPTION 'Undangan asesmen ini khusus ditujukan untuk email: %', v_invitation.candidate_email;
    END IF;
  END IF;

  -- 5. Cek apakah kandidat telah memiliki pengerjaan aktif di bawah token ini
  SELECT * INTO v_existing_attempt
  FROM public.quiz_attempts
  WHERE user_id = v_user_id
    AND invitation_id = v_invitation.id
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    IF v_existing_attempt.submitted_at IS NULL THEN
      RETURN jsonb_build_object(
        'attempt_id', v_existing_attempt.id,
        'organization_id', v_invitation.organization_id,
        'status', 'in_progress',
        'message', 'Melanjutkan sesi pengerjaan asesmen yang sedang berlangsung.'
      );
    ELSE
      RAISE EXCEPTION 'Anda telah menyelesaikan asesmen untuk undangan ini.';
    END IF;
  END IF;

  -- 6. Validasi kuota penggunaan maksimal
  IF v_invitation.current_uses >= v_invitation.max_uses THEN
    UPDATE public.assessment_invitations SET status = 'exhausted' WHERE id = v_invitation.id;
    RAISE EXCEPTION 'Kuota peserta untuk tautan undangan ini telah habis.';
  END IF;

  -- 7. Inkrementasi kuota secara atomik
  UPDATE public.assessment_invitations
  SET
    current_uses = current_uses + 1,
    status = CASE WHEN current_uses + 1 >= max_uses THEN 'exhausted' ELSE status END
  WHERE id = v_invitation.id;

  -- 8. Buat sesi attempt yang terisolasi ke tenant organisasi
  INSERT INTO public.quiz_attempts (
    user_id,
    quiz_id,
    organization_id,
    invitation_id,
    is_public_b2c,
    started_at
  )
  VALUES (
    v_user_id,
    p_quiz_id,
    v_invitation.organization_id,
    v_invitation.id,
    FALSE,
    now()
  )
  RETURNING * INTO v_attempt;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt.id,
    'organization_id', v_invitation.organization_id,
    'status', 'created',
    'message', 'Sesi asesmen korporat berhasil dimulai.'
  );
END;
$$;
```

#### Alur Masuk Kandidat (Candidate Intake Journey):
1. **Penerimaan Tautan:** Kandidat menerima tautan ujian berformat `https://lokatalenta.vercel.app/quiz/:id?invite=INV-TOKEN-XYZ` (didistribusikan via direct URL sharing pada Sprint 14B).
2. **Autentikasi Kandidat Ringan (Lightweight Candidate Auth):**
   - Jika belum login, kandidat disambut dengan modal login/register minimalis beridentitas organisasi pengundang (*co-branded header*), tanpa navigasi promosi atau katalog B2C yang mengganggu.
   - Pendaftaran kandidat instan meminta: Nama Lengkap, Email, dan Kata Sandi/Magic Link. Profil otomatis terdaftar dengan role `student`.
3. **Klaim Token & Pembukaan Sesi:** Frontend memanggil RPC `claim_and_start_assessment_invitation(invite_token, quiz_id)`. Row locking menjamin kuota tidak terlampaui.
4. **Pengerjaan Terisolasi:** Header ujian menampilkan logo dan warna institusi (`var(--brand-primary)`). Telemetri integritas proctoring diaktifkan. Jawaban disimpan dengan debouncing 3 detik.
5. **Penyerahan & Perisai Privasi:** Setelah selesai, nilai dan rincian jawaban langsung masuk ke dashboard `/recruiter` organisasi pengundang. Kunci jawaban disembunyikan dari kandidat, dan riwayat tes diisolasi dari profil publik `get_talent_passport`.

---

### 3.6 Arsitektur Mesin Psikotes Terstandarisasi (Pluggable Psychometrics Engine)

#### Kesenjangan Instrumen Psikotes Saat Ini:
Seluruh penilaian pada `v2.3.0` mengasumsikan model kognitif benar/salah (skor biner 0 atau 1) dengan 5 kategori tag (`verbal`, `numerik`, `logika`, `kraepelin`, `bahasa`). Model ini tidak dapat memfasilitasi instrumen kepribadian standar HR:
- **DISC (Dominance, Influence, Steadiness, Conscientiousness):** Format ipsatif 4 pernyataan per butir; kandidat wajib memilih 1 *Most* (paling menggambarkan diri) dan 1 *Least* (paling tidak menggambarkan diri).
- **MBTI (16 Tipe Kepribadian):** Format dikotomi berpasangan tanpa jawaban benar/salah, mengukur orientasi dimensi E/I, S/N, T/F, J/P.
- **Big Five (OCEAN):** Skala Likert 5 poin (Sangat Tidak Setuju s.d. Sangat Setuju) dengan pembobotan dimensi positif dan terbalik (*reverse scoring*).
- **CFIT (Culture Fair Intelligence Test) Skala 2 & 3:** Penalaran matriks figural abstrak berbasis batasan waktu ketat per subtes, dikonversi menggunakan tabel norma usia/pendidikan menjadi skor IQ standar dan persentil.
- **PAPI Kostick (Personality and Preference Inventory):** 90 butir pernyataan berpasangan tertutup yang menghasilkan grafik 20 aspek arah kerja.

#### Desain Modul Pluggable Psychometrics Engine:
```
                      +---------------------------------+
                      |     Quiz Definition (quizzes)   |
                      |  psychometric_type: DISC/MBTI   |
                      +---------------------------------+
                                       |
                                       v
                      +---------------------------------+
                      |    Strategy Scoring Factory     |
                      +---------------------------------+
                                       |
         +-----------------------------+-----------------------------+
         |                             |                             |
         v                             v                             v
+------------------+         +--------------------+        +--------------------+
|   DISC Strategy  |         |   Big Five Strategy|        |    CFIT Strategy   |
+------------------+         +--------------------+        +--------------------+
| - Most/Least Ips |         | - Likert 1-5       |        | - Matrix Reasoning |
| - 24 Quad Items  |         | - Reverse Scoring  |        | - Time-box subtest |
| - Tallies D,I,S,C|         | - O, C, E, A, N %  |        | - Norm IQ Lookup   |
+------------------+         +--------------------+        +--------------------+
         |                             |                             |
         +-----------------------------+-----------------------------+
                                       |
                                       v
                      +---------------------------------+
                      |   Psychometric Report Payload   |
                      |  (radar_scores, traits, profile)|
                      +---------------------------------+
```

Skema data pendukung pada tabel `quizzes`:
```sql
ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS test_type TEXT NOT NULL DEFAULT 'standard_cognitive' 
  CHECK (test_type IN ('standard_cognitive', 'kraepelin', 'disc', 'mbti', 'big_five', 'cfit', 'papikostick')),
ADD COLUMN IF NOT EXISTS norm_table_id TEXT NULL;
```

---

### 3.7 Konkurensi, Skalabilitas & Keamanan Sistem

1. **Mitigasi Auto-Save Write Storms pada `QuizRunnerPage.tsx`:**
   - *Kondisi Saat Ini:* Setiap kali kandidat memilih salah satu opsi jawaban, fungsi `selectAnswer` langsung mengeksekusi `lmsApi.saveAttemptProgress(attempt.id, next)` tanpa debouncing. Pada sesi tryout akbar atau rekrutmen massal dengan 2.000 kandidat serentak, frekuensi klik memicu ribuan query `UPDATE` per detik ke PostgreSQL Supabase, yang berpotensi memicu connection saturation (*HTTP 503 / 504*).
   - *Solusi Rekayasa:* Terapkan mekanisme **buffered auto-save dengan debouncing 3 detik**. Perubahan jawaban disimpan ke state in-memory lokal seketika (responsif), dan sinkronisasi ke cloud ditunda hingga tidak ada klik baru selama 3.000ms. Tambahkan event listener `window.addEventListener('beforeunload', ...)` yang menembakkan `navigator.sendBeacon` untuk memastikan jawaban terakhir tetap tersimpan saat tab ditutup paksa.
2. **Kebutuhan Supabase Edge Functions (Deno Runtime pada Sprint 16 `ARC-07`):**
   - Mengingat platform tidak memiliki backend server mandiri, seluruh operasi kritis yang memerlukan kredensial privat (API Secret OpenAI/Gemini, API Key Resend/SendGrid, Webhook Signature Xendit) dipindahkan ke **Supabase Edge Functions**. Hal ini mencegah kebocoran private API keys pada bundle klien.
3. **Kepatuhan UU Perlindungan Data Pribadi (UU PDP No. 27/2022):**
   - Tabel `public.admin_audit_logs` diperluas untuk mencatat aktivitas ekspor data pelamar (`CANDIDATE_DATA_EXPORTED`), akses rekap asesmen institusi, dan pengubahan hak akses. Perekrut dilarang mengunduh data sensitif tanpa pencatatan waktu, IP address, dan identitas pengunduh.

---

## 4. Frontend UI/UX & Live Production Inspection Deep-Dive

### 4.1 Hasil Inspeksi Live Production System (`https://lokatalenta.vercel.app`)
Audit langsung pada domain produksi menunjukkan:
- **Pemuatan Aset:** Response time TTFB (Time to First Byte) ~85ms melalui CDN Vercel. Font web (`Inter`, `Plus Jakarta Sans`, `JetBrains Mono`) dimuat asinkron via Google Fonts CDN tanpa memblokir rendering utama.
- **PWA Capabilities:** Service Worker Cache v2 terdaftar dengan baik; shortcut manifest memungkinkan peluncuran instan ke mode latihan Kraepelin.
- **Isolasi Rute:** Upaya langsung membuka rute admin (`/admin`) atau instruktur (`/teacher`) oleh pengguna biasa dialihkan secara benar (*hard redirect*) ke beranda katalog (`/`).

---

### 4.2 Evaluasi Pengalaman Asesmen Kandidat (Candidate Journey)

```
+-----------------------------------------------------------------------------------+
| [X] Keluar Ujian | PT Telkom Indonesia - Asesmen BUMN [Integritas: Normal] [28:45]|
+-----------------------------------------------------------------------------------+
|  Soal 14 / 50  [Numerik & Aritmetika]                        [v] Tandai Ragu-ragu |
|                                                                                   |
|  Sebuah perusahaan logistik mencatat kenaikan volume pengiriman sebesar 15% pada  |
|  kuartal II dan 20% pada kuartal III...                                           |
|                                                                                   |
|  [A] Rp 145.000.000          [B] Rp 168.000.000         [C] Rp 172.500.000        |
|  [D] Rp 180.000.000          [E] Rp 195.000.000                                   |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | [<- Sebelumnya]                 (•) Tersimpan [10:42:15]     [Selanjutnya ->]|  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

- **Header Ujian Bebas Distrasi & Co-Branded:** Menghilangkan navigasi standar sistem untuk mencegah hilangnya fokus peserta. Menampilkan judul tes, logo mitra institusi, badge mode ujian terkunci, indikator telemetri integritas fokus, penghitung waktu mundur, dan tombol submit.
- **Indikator Status Auto-Save Visual:** Menambahkan status badge halus pada footer/header ujian: titik kuning berdenyut ("Menyimpan...") yang berubah menjadi centang hijau tenang ("Tersimpan [hh:mm:ss]").
- **Modal Zoom Soal Penalaran Figural (CFIT):** Soal matriks 3x3 (`comprehensiveQuestions.ts:458`) disajikan dalam elemen `<img>` statis dengan tinggi maksimal `max-h-72`. Diperlukan fitur tap-to-zoom dengan pan dan toggle kontras tinggi untuk mode gelap.

---

### 4.3 Ergonomi Mobile Tes Kraepelin & Pauli (`UI-15A` — Rebalanced to P1 High)

#### Masalah Ergonomi pada Layar Mobile (375x667 s.d. 390x844):
Pada implementasi saat ini (`KraepelinPage.tsx:290-322`), kartu angka diletakkan di atas numpad dalam susunan vertikal standar. Total tinggi komponen melebihi tinggi layar ponsel (*viewport height*), memicu scrolling vertikal saat kandidat mengetik cepat dalam batas waktu 15 detik per kolom. Tombol angka disusun dalam 2 baris 5 kolom yang sangat sempit dan memicu salah sentuh (*mis-hits*) ~18%.

#### Solusi Redesain Ergonomis Kraepelin Mobile:
1. **Viewport Lock Mutlak:** Terapkan `h-dvh overflow-hidden select-none` pada kontainer tes Kraepelin untuk menonaktifkan gesture scrolling halaman.
2. **Layout Numpad 3x4 Gaya Telepon / ATM:**
   ```
   +-------------+-------------+-------------+
   |      1      |      2      |      3      |
   +-------------+-------------+-------------+
   |      4      |      5      |      6      |
   +-------------+-------------+-------------+
   |      7      |      8      |      9      |
   +-------------+-------------+-------------+
   |   (Clear)   |      0      |  (Backsp)   |
   +-------------+-------------+-------------+
   ```
   Layout ini memiliki target sentuh berukuran minimal 54x54 px (mematuhi standar Apple HIG dan Google Material touch target), dilengkapi feedback haptic ringan dan tactile animation `active:scale-95`.

---

### 4.4 Higienitas Design System & Aksesibilitas WCAG

1. **Remediasi Kontras Teks Sekunder (WCAG AA Compliance):**
   - Warna teks sekunder/caption saat ini (`text-[#71717A]`) yang digunakan pada background terang `#F6F5F1` hanya memiliki rasio kontras **4.21:1**.
   - Angka ini **GAGAL (failing)** memenuhi kriteria WCAG AA untuk teks berukuran kecil (< 18pt) yang mensyaratkan rasio minimal **4.5:1**.
   - *Solusi:* Gelapkan token teks sekunder menjadi `#52525B` yang menghasilkan rasio kontras **5.8:1** (LULUS WCAG AA).
2. **Konsolidasi Modal Primitives:**
   - Ditemukan **6 implementasi modal bespoke** yang dibuat secara manual tanpa atribut ARIA accessibility (`role="dialog"`, `aria-modal="true"`) dan tanpa listener keyboard `Escape`:
     1. Modal konfirmasi submit ujian (`QuizRunnerPage.tsx:850`).
     2. Modal peringatan keluar ujian (`QuizRunnerPage.tsx:905`).
     3. Modal pratinjau modul kursus (`AdminPanelPage.tsx:2219`).
     4. Modal pencabutan sertifikat (`AdminPanelPage.tsx:2346`).
     5. Modal siaran pengumuman global (`AdminPanelPage.tsx:2422`).
     6. Modal edit materi silabus (`TeacherStudioPage.tsx:1683`).
   - *Solusi:* Gantikan seluruh modal manual tersebut dengan komponen terpusat `<ModalDialog>` yang memanfaatkan `<dialog>` HTML5 native atau headless trap, serupa dengan `ConfirmDialog.tsx`.
3. **Implementasi Global React `<ErrorBoundary>`:**
   - Bungkus pohon komponen aplikasi dengan Error Boundary bertingkat untuk menangkap galat render SVG atau chart radar tanpa meruntuhkan seluruh halaman (*blank screen*).

---

### 4.5 Theming White-Label Multi-Tenant
Refactor warna utama aplikasi (#0F766E) yang di-hardcode di class Tailwind CSS ke dalam CSS Custom Properties:
```css
:root {
  --brand-primary: #0F766E;
  --brand-primary-hover: #115E59;
  --brand-primary-light: #F0FDFA;
  --brand-accent: #D97706;
}
```
Komponen header ujian dan kartu sertifikat membaca variabel `--brand-primary` secara dinamis sesuai konfigurasi tenant organisasi pengundang.

---

## 5. QA & DevOps Roadmap Deep-Dive

### 5.1 Ekspansi QA Test Suite untuk Multi-Tenancy (107 → 125+ Test Cases)

Untuk mengawal transisi arsitektur enterprise tanpa meninggalkan celah pengujian, alokasi pengujian otomatis disinkronkan langsung ke siklus pengiriman fitur: **`QAE-14A` pada Sprint 14A** dan **`QAE-14B` pada Sprint 14B**. Strategi ini **mengeliminasi kekosongan pengujian 4-sprint** (sebelumnya `QAE-01` tertunda di Sprint 18).

```
+-----------------------------------------------------------------------------------+
|               PENYELARASAN SUITE PENGUJIAN OTOMATIS MULTI-TENANCY                 |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [Sprint 14A]  QAE-14A (Foundation & RBAC): REC-01..03, ORG-01..03, A11Y-01       |
|                -> Menjamin isolasi tenant dan portal recruiter sebelum rilis fitur|
|                                                                                   |
|  [Sprint 14B]  QAE-14B (Assessments & Isolation): REC-04..05, INV-01..04, SEC-03|
|                -> Menjamin kuota token ujian dan isolasi hasil tes korporat       |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

Tabel 18 skenario pengujian baru terpetakan secara ketat ke sprint peluncurannya:

| ID Skenario | Target Suite | Peran | Modul | Tipe Flow | Deskripsi Skenario & Langkah Uji | Ekspektasi Hasil |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **REC-01** | **QAE-14A** | Recruiter | Portal Perekrut | Happy Flow | Akses dashboard `/recruiter` dengan akun recruiter terverifikasi. | Halaman dashboard terbuka menampilkan metrik pencarian kandidat dan panel filter kompetensi. |
| **REC-02** | **QAE-14A** | Student/Mentor | RBAC Guard | Sad Flow | Akun student atau teacher mencoba navigasi paksa ke `/recruiter`. | Akses ditolak dan router langsung me-redirect pengguna kembali ke beranda `/`. |
| **REC-03** | **QAE-14A** | Recruiter | Talent Search | Happy Flow | Filter kandidat dengan slider 5D Radar (Verbal >= 80, Kraepelin Speed >= 45 KPM). | Daftar kandidat yang tampil tersaring secara presisi sesuai ambang batas nilai yang diminta. |
| **ORG-01** | **QAE-14A** | Org Admin | Multi-Tenancy | Happy Flow | Pembuatan organisasi baru di `/admin` dengan penetapan batas kuota kandidat. | Record tersimpan di `public.organizations` dan kuota terpasang akurat. |
| **ORG-02** | **QAE-14A** | All | Multi-Tenancy | Sad Flow | Recruiter dari Org A mencoba membaca daftar anggota milik Org B via API langsung. | PostgreSQL RLS memblokir query dan mengembalikan record kosong (*0 rows*). |
| **ORG-03** | **QAE-14A** | Org Admin | Co-Branding | Happy Flow | Mengunggah logo dan menentukan brand color custom pada pengaturan organisasi. | Header ujian dan kartu sertifikat menampilkan identitas visual mitra secara akurat. |
| **A11Y-01** | **QAE-14A** | All | Aksesibilitas | Happy Flow | Audit rasio kontras teks sekunder `#52525B` pada latar belakang `#F6F5F1`. | Rasio kontras terukur minimal 5.8:1 (Memenuhi standar WCAG AA). |
| **REC-04** | **QAE-14B** | Recruiter | Shortlist CRM | Happy Flow | Klik "Simpan ke Shortlist" pada profil kandidat dan isi catatan internal HR. | Kandidat tersimpan di tabel `recruiter_shortlists` dan catatan internal berhasil dimuat ulang. |
| **REC-05** | **QAE-14B** | Recruiter | Shortlist CRM | Sad Flow | Mencoba menambahkan kandidat yang sama dua kali ke dalam shortlist organisasi. | Sistem mencegah duplikasi dan menampilkan notifikasi "Kandidat sudah ada dalam shortlist". |
| **ORG-04** | **QAE-14B** | Recruiter | Ekspor Data | Happy Flow | Mengunduh berkas CSV kandidat shortlist dengan pemeriksaan sanitasi formula. | File CSV terunduh dengan seluruh karakter prefix berbahaya (`=`, `+`, `-`, `@`) di-escape aman. |
| **INV-01** | **QAE-14B** | Recruiter | Undangan Tes | Happy Flow | Membuat link undangan asesmen khusus (`/quiz/:id?invite=...`) dengan batas kedaluwarsa. | Tautan unik terbuat dengan status aktif dan batas waktu tersimpan di database. |
| **INV-02** | **QAE-14B** | Candidate | Asesmen Privat | Happy Flow | Kandidat membuka link undangan asesmen, menyelesaikan tes, dan men-submit jawaban. | Nama organisasi tampil di header ujian dan skor kandidat masuk ke rekap internal recruiter. |
| **INV-03** | **QAE-14B** | Candidate | Asesmen Privat | Sad Flow | Kandidat mengakses link undangan asesmen yang telah melewati batas `expires_at`. | Layar menampilkan informasi "Tautan Undangan Asesmen Telah Kedaluwarsa". |
| **INV-04** | **QAE-14B** | Candidate | Asesmen Privat | Sad Flow | Kandidat mencoba menggunakan token undangan yang kuota pemakaiannya telah habis. | Sistem menolak memulai tes dan menampilkan pesan "Kuota Asesmen Telah Terpenuhi". |
| **SEC-03** | **QAE-14B** | System | Data Isolation | Sad Flow | Verifikasi eksternal terhadap Talent Passport publik (`/talent/:userId`) milik kandidat. | Hasil tes dari asesmen korporat bertanda `is_public_b2c = false` TIDAK muncul di profil publik. |
| **DS-01** | **QAE-14B** | Candidate | UX Asesmen | Happy Flow | Membuka tes Kraepelin di layar mobile 375px; mengetik angka pada numpad 3x4. | Halaman terkunci tanpa scroll vertikal dan angka terinput instan dengan akurasi 100%. |
| **DS-02** | **QAE-14B** | Candidate | UX Asesmen | Happy Flow | Menjawab soal ujian; mengamati indikator penyimpanan jawaban pada header. | Indikator visual berubah dari "Menyimpan..." menjadi "Tersimpan" dalam waktu < 2 detik. |
| **DS-03** | **QAE-14B** | Candidate | UX Asesmen | Happy Flow | Membuka modal zoom gambar soal matriks figural abstrak 3x3. | Gambar membesar proporsional dengan opsi pan dan inversi warna kontras tinggi. |

---

### 5.2 Validasi Strategi DevOps & Release (GitFlow v2)

#### 1. Kelemahan Pipeline Migrasi Database Saat Ini
Saat ini berkas migrasi SQL pada direktori `supabase/migrations/` dieksekusi maju (*forward migration only*). Tidak tersedia skrip atau pengujian otomatis untuk **migrasi rollback (down-migration)** pada pipeline CI/CD GitHub Actions. Apabila migrasi pada environment staging mengalami kegagalan, tim engineering terpaksa melakukan intervensi manual yang rentan kesalahan.

#### 2. Pola Migrasi Zero-Downtime (*Expand-Contract Pattern*)
Penerapan multi-tenancy pada tabel berukuran besar (`profiles`, `quiz_attempts`, `quizzes`) wajib menerapkan pola migrasi Expand-Contract:
- **Fase 1 (Expand):** Tambahkan kolom baru (`organization_id`, `is_public_b2c`) dengan status `NULLABLE` tanpa mengganggu kode lama.
- **Fase 2 (Deploy Code):** Deploy kode rilis `v3.0.0` yang mulai membaca dan menulis kolom baru.
- **Fase 3 (Backfill):** Eksekusi skrip data backfilling di background untuk mengidentifikasi riwayat data lama sebagai `is_public_b2c = TRUE`.
- **Fase 4 (Contract):** Terapkan batasan integritas `NOT NULL` atau indeks performa baru setelah seluruh data terisi.

#### 3. Verifikasi Subdomain Staging Wildcard
Penerapan wildcard subdomain pada rilis Sprint 16 (`*.lokatalenta.app`) membutuhkan konfigurasi DNS CNAME wildcard pada Vercel dan penyelarasan header CORS Supabase agar sesi autentikasi tetap aman saat melintasi subdomain tenant yang berbeda.

---

## 6. Actionable Prioritized Backlog & Implementation Roadmap

Tabel komprehensif di bawah ini mengkonsolidasikan seluruh rekomendasi teknis lintas domain (Product, Architecture, UI/UX, QA/DevOps) yang telah dinormalisasi menggunakan taksonomi standar PRD: **Fix**, **Gap**, **Enhancement**, dan **UI Revamp**:

| ID Item | Target Sprint | Kategori | Prioritas | Judul Item & Ruang Lingkup Teknis | Rasional Arsitektur & Bisnis |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FIX-01** | **Sprint 13.1** | **Fix (Backend)** | **P0 (Blocker)** | **Patching Evaluasi Soal Isian Singkat pada RPC Supabase**<br>Perbarui PL/pgSQL RPC `submit_quiz_attempt` dan `check_practice_answer` untuk mencocokkan input siswa terhadap array `accepted_answers TEXT[]` dengan normalisasi spasi `regexp_replace` dan opsi `case_sensitive`. | Mencegah pemberian skor 0% permanen pada seluruh soal isian singkat yang dikerjakan menggunakan cloud database Supabase. |
| **FIX-02** | **Sprint 13.1** | **Fix (Backend)** | **P0 (Blocker)** | **Persistensi Telemetri Proctoring ke Database Supabase**<br>Perluas parameter RPC `submit_quiz_attempt` dengan `p_tab_switch_count INT` dan `p_focus_loss_events JSONB`. Update `lmsApi.submitQuizAttempt` agar data tidak hanya tersimpan di `localStorage`. | Menjamin rekam jejak integritas fokus ujian kandidat tersimpan permanen di cloud untuk dievaluasi oleh perekrut. |
| **PERF-03** | **Sprint 13.1** | **Enhancement (Performance)** | **P1 (High)** | **Debouncing & Buffer Auto-Save pada `QuizRunnerPage`**<br>Implementasikan debouncing 3 detik pada penyimpanan jawaban berkala dan tambahkan `navigator.sendBeacon` pada event `beforeunload`. | Mengeliminasi ancaman PostgreSQL write storms saat ribuan kandidat mengerjakan ujian serentak. |
| **ARC-01** | **Sprint 14A** | **Gap (Architecture)** | **P0 (Blocker)** | **Fondasi Skema Multi-Tenancy (`organizations` & `organization_members`)**<br>Buat tabel organisasi, tabel relasi keanggotaan staf, dan tambahkan nilai `'recruiter'` pada batasan check role `profiles`. Konfigurasi RLS isolasi tenant dan helper functions. | Prasyarat mutlak arsitektur B2B sebelum membangun antarmuka perekrut atau asesmen korporat. |
| **REC-01** | **Sprint 14A** | **Enhancement (Product)** | **P0 (Blocker)** | **Portal Penelusuran Kandidat Recruiter (`/recruiter`)**<br>Bangun dashboard pencarian kandidat berbantu multi-slider filter 5D Radar (Verbal, Numerik, Logika, Kraepelin, Bahasa) dan jalur karier. | Memberikan nilai tambah bisnis bagi perusahaan mitra dalam menemukan talenta berkualitas secara objektif. |
| **UI-14A** | **Sprint 14A** | **UI Revamp (Theming)** | **P1 (High)** | **Theme Engine White-Label Berbasis CSS Custom Properties**<br>Refactor token warna hardcoded `#0F766E` ke variabel CSS (`--brand-primary`). Siapkan context provider untuk rendering logo mitra secara dinamis. | Fondasi kustomisasi identitas korporat pada halaman ujian dan sertifikat resmi perusahaan. |
| **UI-14C** | **Sprint 14A** | **UI Revamp (Accessibility)** | **P1 (High)** | **Konsolidasi Modal Primitives & Remediasi Kontras WCAG AA**<br>Gantikan 6 modal manual dengan komponen `<ModalDialog>` terpusat. Gelapkan warna teks caption dari `#71717A` (4.21:1) menjadi `#52525B` (5.8:1). | Menjamin kepatuhan standar aksesibilitas web internasional dan menghilangkan duplikasi kode modal. |
| **QAE-14A** | **Sprint 14A** | **Enhancement (QA/DevOps)** | **P0 (Blocker)** | **Automated Test Suite: Recruiter Portal RBAC & Tenant Isolation**<br>Implementasikan suite pengujian otomatis Vitest & Supabase RLS untuk skenario `REC-01..03`, `ORG-01..03`, dan `A11Y-01`. | Menjamin fondasi multi-tenant bebas dari celah eskalasi hak akses sebelum memasuki fitur asesmen korporat. |
| **ARC-02** | **Sprint 14B** | **Gap (Architecture)** | **P0 (Blocker)** | **Mesin Undangan Asesmen Korporat & Token Isolation**<br>Buat tabel `assessment_invitations` (quiz_id UUID), generator link `/quiz/:id?invite=...` (direct URL sharing), verifikasi kuota atomik `claim_and_start_assessment_invitation`, dan pelindung RLS agar hasil tes tidak bocor ke publik. | Memungkinkan perusahaan menyelenggarakan seleksi ujian mandiri beridentitas institusi dengan isolasi data penuh. |
| **REC-04** | **Sprint 14B** | **Enhancement (Product/CRM)** | **P1 (High)** | **Shortlist CRM Kandidat & Catatan Internal HR**<br>Buat antarmuka penyimpanan kandidat favorit ke dalam daftar shortlist organisasi (`recruiter_shortlists`), dilengkapi kolom catatan kualitatif HR dan pemberian rating bintang. | Mengakomodasi alur kerja seleksi awal tim talent acquisition dalam satu dashboard terpadu. |
| **UI-14D** | **Sprint 14B** | **UI Revamp (Mobile UX)** | **P1 (High)** | **Mobile Floating Question Drawer & Indikator Toast Auto-Save**<br>Sediakan floating bottom sheet untuk navigasi nomor soal pada layar ponsel dan badge visual "Menyimpan... / Tersimpan" pada header ujian. | Menghilangkan friksi pengerjaan tes di layar mobile dan meredakan kecemasan kandidat terkait status simpan jawaban. |
| **QAE-14B** | **Sprint 14B** | **Enhancement (QA/DevOps)** | **P0 (Blocker)** | **Automated Test Suite: Assessment Invitations & Candidate Isolation**<br>Implementasikan suite pengujian otomatis untuk skenario `REC-04..05`, `INV-01..04`, `SEC-03`, dan `DS-01..03`. | Mengeliminasi risiko kebocoran data kandidat pada endpoint publik dan menguji keandalan kuota token undangan. |
| **UI-15A** | **Sprint 15** | **UI Revamp (Ergonomics)** | **P1 (High)** | **Ergonomi Kraepelin Mobile 3x4 Numpad & Viewport Lock**<br>Kunci layar mobile dengan `h-dvh overflow-hidden` dan ganti susunan tombol 5-kolom dengan format 3x4 telephone numpad zero-scroll berukuran 54px. *(Rebalanced to P1 High)* | Mencegah scrolling liar dan memangkas tingkat salah sentuh tombol sebesar ~18% pada simulasi Kraepelin berkecepatan tinggi. |
| **ARC-05** | **Sprint 15** | **Gap (Psychometrics)** | **P1 (High)** | **Fondasi Mesin Psikotes Terstandar (Instrumen DISC & MBTI)**<br>Perluas skema `quizzes` dengan `test_type`, bangun rubrik pilihan dimensional non-biner, dan kembangkan modul kalkulator kepribadian DISC & MBTI. | Mengembangkan kapabilitas platform dari sekadar tes akademik/kognitif menjadi psikotes kepribadian kerja standar HR. |
| **REC-06** | **Sprint 15** | **Enhancement (Product/ATS)** | **P1 (High)** | **ATS Kanban Pipeline Pelamar & Matriks Komparasi Kandidat**<br>Antarmuka papan Kanban rekrutmen (*Invited → Evaluated → Shortlisted → Offered*) dan tabel komparasi berdampingan untuk 2–4 kandidat. | Mentransformasi LokaTalenta menjadi solusi pre-employment screening dan mini-ATS yang mandiri. |
| **REC-07** | **Sprint 15** | **Gap (Governance/Product)** | **P1 (High)** | **Alur Banding Ujian Terputus (Dispute & Retake Workflow)**<br>Sistem pengajuan tiket ujian ulang bagi kandidat yang mengalami kendala teknis dan panel persetujuan re-attempt bagi Recruiter/Admin. *(Promoted to P1 High)* | Menjamin keadilan seleksi bagi kandidat tanpa mengorbankan integritas proctoring platform. |
| **UI-15D** | **Sprint 15** | **Enhancement (Stability)** | **P1 (High)** | **Implementasi Global React `<ErrorBoundary>` & Skeleton Loading**<br>Bungkus pohon komponen aplikasi dengan Error Boundary adaptif dan buat komponen Skeleton reusable yang mendukung tema gelap. | Mencegah insiden layar putih blank saat terjadi galat rendering dan menyempurnakan persepsi loading aplikasi. |
| **ARC-06** | **Sprint 16** | **Gap (Psychometrics)** | **P1 (High)** | **Mesin Konversi Norma Kognitif (CFIT Skala 2/3 & Papikostick)**<br>Bangun modul pencarian tabel norma IQ standar Indonesia untuk CFIT dan kalkulator 20 aspek kepribadian arah kerja PAPI Kostick. | Memenuhi kriteria kepatuhan asesmen psikologi formal untuk seleksi BUMN dan perbankan nasional. |
| **ARC-07** | **Sprint 16** | **Enhancement (Infrastructure)** | **P1 (High)** | **Runtime Supabase Edge Functions & Email Transaksional**<br>Deploy fungsi serverless Deno untuk integrasi email undangan asesmen via Resend/SendGrid dan generasi laporan dossier psikotes PDF otomatis. | Menyediakan infrastruktur pengiriman email transaksional resmi (menggantikan direct URL sharing Sprint 14B) dan pemrosesan dokumen privat. |
| **ARC-04** | **Sprint 16** | **Enhancement (Architecture)** | **P1 (High)** | **Wildcard Subdomain Routing (`*.lokatalenta.app`)**<br>Implementasikan middleware resolver tenant berbasis host header untuk mendeteksi subdomain korporat secara dinamis. | Memberikan pengalaman white-label premium bagi klien institusi enterprise pada domain khusus mereka. |
| **REC-11** | **Sprint 17** | **Enhancement (AI/Product)** | **P1 (High)** | **AI STAR Interview Grader & Job-Fit Scoring Engine**<br>Layanan evaluasi jawaban STAR berbasis LLM dengan pemberian saran kata kerja aksi serta kalkulasi persentase kecocokan profil kandidat terhadap kriteria jabatan. | Memangkas waktu evaluasi wawancara awal bagi HR dan menyediakan bimbingan karir cerdas bagi pencari kerja. |
| **SEC-04** | **Sprint 18** | **Enhancement (Security)** | **P1 (High)** | **Enterprise Lockdown Mode & Anti-Cheat Device Telemetry**<br>Fitur mandatory fullscreen, pencegahan kombinasi tombol keluar, pembatasan copy-paste, dan deteksi penggunaan monitor eksternal. | Memenuhi standar kepatuhan ujian seleksi kerja berisiko tinggi tanpa pengawasan fisik langsung (*unproctored*). |
| **FIN-01** | **Sprint 19** | **Enhancement (Monetization)** | **P2 (Medium)** | **Manajemen Saldo Kredit Asesmen Korporat & Billing Midtrans**<br>Sistem debit saldo kredit per asesmen kandidat yang selesai dan otomasi faktur pembayaran paket korporat via payment gateway. | Mengotomatisasi monetisasi B2B dan siklus penagihan pelanggan korporat secara mandiri. |
| **ARC-10** | **Sprint 20** | **Enhancement (Architecture)** | **P2 (Medium)** | **Open Assessment REST API & Webhooks Engine (`v4.0.0`)**<br>Ekosistem API publik dan dispatcher webhook bertanda tangan HMAC untuk integrasi data hasil asesmen ke sistem HRIS eksternal (Workday, Talenta). | Mentransformasi platform LokaTalenta menjadi infrastruktur terbuka untuk ekosistem rekrutmen regional. |

---

## 7. Rangkuman Kesimpulan & Rekomendasi Eksekusi

1. **Kelayakan Arsitektur Saat Ini:** LokaTalenta berada dalam kondisi sangat sehat pada ranah B2C (`v2.3.0`), terbukti dengan kelulusan 100% dari 107 kasus uji QA, zero lint errors, dan ukuran bundle yang ramping (< 250 kB).
2. **Urgensi Perbaikan Cepat (Sprint 13.1 Hotfix):** Sebelum memulai fitur B2B Sprint 14, tim engineering wajib merilis patch darurat untuk menyelesaikan bug evaluasi soal isian singkat (`short_answer` scoring) dan memastikan telemetri proctoring tersimpan permanen di cloud Supabase melalui fungsi PL/pgSQL `submit_quiz_attempt` dan `check_practice_answer` yang telah disediakan lengkap.
3. **Pembagian Tahapan Rilis Sprint 14 (14A vs 14B):** Membagi rilis Major Sprint 14 menjadi **Sprint 14A** (Fondasi Skema Organisasi, Role RBAC, Discovery UI, Konsolidasi Modal, dan Suite `QAE-14A`) dan **Sprint 14B** (Undangan Asesmen Korporat, CRM Shortlist, Co-Branding, dan Suite `QAE-14B`) adalah strategi paling aman untuk menghindari regresi, menghilangkan testing void, dan menjamin isolasi data multi-tenant.
4. **Isolasi Privasi Kandidat Tanpa Celah:** Seluruh 5 vektor kebocoran data kandidat pada RPC publik (`get_attempt_review`, `get_public_leaderboard`, `get_quiz_item_analysis`, `get_talent_passport`, dan klaim token undangan via `claim_and_start_assessment_invitation` dengan `FOR UPDATE`) telah memiliki remedi teknis konkret dengan kode executable siap pakai.
5. **Evolusi Instrumen Psikometri & Infrastruktur Modern:** Keberhasilan penetrasi pasar B2B sangat ditentukan oleh transisi dari tes pilihan ganda biner biasa menuju **Pluggable Psychometrics Engine** yang mendukung instrumen saintifik (DISC, MBTI, CFIT, Papikostick) dengan tabel norma terkalibrasi, didukung oleh Supabase Edge Functions untuk pengiriman email transaksional dan generasi dokumen laporan PDF pada Sprint 16.

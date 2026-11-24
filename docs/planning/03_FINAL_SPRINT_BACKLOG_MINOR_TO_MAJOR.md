# Master Product & Sprint Backlog — Minor ke Major (`v1.10.0` → `v3.0.0` → `v3.1.0`+)

**Baseline Sistem Saat Ini:** `v3.0.0` Major (Sprint 14 Selesai, Commit `fc5d99b`, Tag `d64ee0d`)  
**Target Milestone Aktif:** Sprint 15 (`v3.1.0` Minor — Enterprise ATS Pipeline, Pluggable Psychometrics & Architecture Hardening)  
**Alur GitFlow Wajib:** `task/<bl-id>` → `feature/<sprint>` → **SIT** → `dev` (**UAT**) → **Demo ke User (User Acceptance Gate)** → **Approval & Checker Team Leader (Rizco Renova)** → `release/<versi>` (**Staging & Release Notes**) → `main` (**Production Deploy**) → sync `main` → `dev`

---

### Aturan Agile SDLC Ceremonies Wajib (Setiap Awal & Akhir Sprint)
Setiap memulai dan mengakhiri sprint, seluruh tim multi-agent lintas 18 peran (Kepemimpinan, Produk, Rekayasa, QA, Keamanan, dan Advokasi Pengguna) **wajib** menjalankan seremoni Agile SDLC berikut:
1. **Sprint Planning (Awal Sprint):** Penentuan prioritas bisnis, arsitektur DB/API & migrasi Supabase, desain komponen & budget bundle `< 250 kB`, serta test plan multi-peran.
2. **Sprint Execution & SIT Gate:** Implementasi per `task/<bl-id>`, validasi linter `oxlint`, pengujian otomatis `vitest`, pemeriksaan build produksi `vite build`, dan SIT lintas seluruh modul fungsional.
3. **UAT & User Demo Gate (Wajib Pasca-UAT):** Setiap selesai UAT di branch `dev` (`https://lokatalenta-git-dev-zixew.vercel.app`), tim/agen **WAJIB** menyelenggarakan sesi demo interaktif kepada User/Stakeholder untuk memastikan kembali seluruh *Acceptance Criteria* (AC) dapat diterima dan memperoleh persetujuan tertulis (*User Acceptance Sign-Off*).
4. **Team Leader Document Checker & Release Approval Gate (Wajib oleh Rizco Renova):** Seluruh dokumen (PRD, TRD, 112 matriks QA, hasil pengujian, limit bundle < 250 kB, dan bukti User Sign-Off) diaudit secara komprehensif oleh **Team Leader: Rizco Renova**. Otorisasi formal rilis (`LEAD-RELEASE-APPROVAL`) wajib diterbitkan sebelum diserahkan kepada DevOps.
5. **Sprint Review & Release (Akhir Sprint - DevOps Execution):** DevOps (Damar "Deva" Gunawan) mengeksekusi `./scripts/release.sh`, rilis live di Production (`main`), verifikasi via browser subagent, dan sinkronisasi 1:1 `QA_TEST_CASES.md` & `QA_TEST_CASES_LOKATALENTA.xlsx`.
6. **Sprint Retrospective (Akhir Sprint):** Evaluasi hal yang berjalan baik (*Keep*), masalah/utang teknis (*Problem*), dan rencana aksi terukur (*Action Items*) untuk sprint berikutnya.

---

## 1. Aturan Semantic Versioning (`Patch` vs `Minor` vs `Major`)

| Tipe Rilis | Pola Versi | Kriteria Perubahan | Contoh di Roadmap Ini |
| :--- | :--- | :--- | :--- |
| **Patch** | `1.9.x` / `3.0.x` | Bugfix UI/UX, perbaikan filter/layout, hotfix backend tanpa rute baru. | `v1.9.1` (Fix Filter Kursus), `v3.0.1` (Hotfix Cloud RPC Scoring) |
| **Minor** | `1.10.0` – `3.1.0` | Penambahan fitur baru, tabel/kolom baru yang *backward-compatible*, modul baru. | Sprint 7 (`v1.10.0`), Sprint 13 (`v2.3.0`), Sprint 15 (`v3.1.0` ATS & Psikometri) |
| **Major** | `2.0.0` / `3.0.0` / `4.0.0` | Lompatan kapabilitas produk utama, ekosistem baru, perombakan paradigma arsitektur. | Sprint 10 (`v2.0.0` Talent Passport), Sprint 14 (`v3.0.0` Recruiter & B2B), Sprint 20 (`v4.0.0` Open API) |

---

## 2. Riwayat Backlog Sprint Terkirim (Sprint 7 s.d. Sprint 14)

### Sprint 7 — Cloud Sync Personalisasi & Ekspor Catatan Belajar (`v1.10.0` • Minor)
- **Status:** **TERKIRIM (SHIPPED)**
- **Branch Feature:** `feature/sprint7-cloud-notes-and-prefs`

| ID | Branch Task | User Story | Scope Implementasi | Test Case QA |
| :--- | :--- | :--- | :--- | :--- |
| **BL-21** | `task/bl-21-cloud-lesson-notes` | `US-21` | Migrasi SQL `lesson_notes` + `syncLessonNoteFromServer` & `saveLessonNoteAsync` di `lessonNotesStorage.ts` dan `LessonNotesAndCheckPanel.tsx`. | `CRS-07` |
| **BL-22** | `task/bl-22-cloud-study-prefs` | `US-22` | Migrasi SQL `user_study_preferences` + sinkronisasi jalur karier, target XP harian, dan `last_lesson_id` lintas perangkat. | `CAT-05` |
| **BL-23** | `task/bl-23-export-course-notes` | `US-23` | Fungsi `buildCourseNotesMarkdown(course, userId)` + tombol **Unduh Catatan Kursus (.md)** di `CoursePlayerPage.tsx` + unit test `sprint7Features.test.ts`. | `CRS-08` |
| **BL-23B** | `task/bl-23b-interactive-spreadsheet-lab` | `US-23B` | `spreadsheetEngine.ts` (`=SUM`, `=AVERAGE`, `=MIN`, `=MAX`, `=COUNT`, `=IF`, `=VLOOKUP`, aritmetika sel) + komponen `InteractiveSpreadsheetLab.tsx` di `CoursePlayerPage.tsx` dengan Formula Bar `fx`, 3 skenario latihan teknis, & auto-grader rumus. | `CRS-09` |
| **BL-23C** | `task/bl-23c-security-and-perf-test` | `US-23C` | `securityGuards.ts` (XSS sanitizer, CSV Formula Injection guard, action rate-limiter), HTTP Security Headers di `client/vercel.json`, serta automated **Security & Performance Benchmark Test Suite** (`securityAndPerf.test.ts`: 1.000 evaluasi rumus < 50ms, 1.000 filter kursus < 15ms, bundle chunk budget < 250 kB). | `SEC-01`, `PERF-01` |

---

### Sprint 8 — Multi-User 1v1 Duel History, Smart Drill & Kraepelin Trend (`v1.11.0` • Minor)
- **Status:** **TERKIRIM (SHIPPED)**
- **Branch Feature:** `feature/sprint8-duel-drill-kraepelin`

| ID | Branch Task | User Story | Scope Implementasi | Test Case QA |
| :--- | :--- | :--- | :--- | :--- |
| **BL-24** | `task/bl-24-duel-history` | `US-24` | Migrasi SQL `quiz_challenges` + penyimpanan & tampilan **Riwayat Duel 1v1 Terbaru** di `QuizResultPage.tsx`. | `QUZ-07` |
| **BL-25** | `task/bl-25-smart-subtest-drill` | `US-25` | Filter query `?subtest=<category>` pada `QuizRunnerPage.tsx` + tombol **Latih Subtest Terlemah (Smart Drill)** di `QuizResultPage.tsx`. | `QUZ-08` |
| **BL-26** | `task/bl-26-kraepelin-history` | `US-26` | Modul `kraepelinHistory.ts` (`recordKraepelinAttempt`, `getKraepelinHistory`, analisis tren KPM/Akurasi) + panel **Riwayat & Tren Ketahanan** di `KraepelinPage.tsx` + unit test `sprint8Features.test.ts`. | `KRP-02` |

---

### Sprint 9 — Teacher Question Update In-Place & Admin Governance Export (`v1.12.0` • Minor)
- **Status:** **TERKIRIM (SHIPPED)**
- **Branch Feature:** `feature/sprint9-teacher-edit-admin-governance`

| ID | Branch Task | User Story | Scope Implementasi | Test Case QA |
| :--- | :--- | :--- | :--- | :--- |
| **BL-27** | `task/bl-27-inline-question-update` | `US-27` | Method `lmsApi.updateQuestionInQuiz(questionId, input)` + state `editingQuestionId` di `TeacherStudioPage.tsx` (mode **Perbarui Soal Ini** vs **Simpan Soal Baru** + tombol **Batal Edit**). | `TCH-06` |
| **BL-28** | `task/bl-28-cloud-admin-audit` | `US-28` | Migrasi SQL `admin_audit_logs` + sinkronisasi cloud & filter aksi (`ALL`, `ROLE_UPDATED`, `USER_STATUS_CHANGED`, `COURSE_PUBLISH_TOGGLED`) di `AdminAuditLogPanel.tsx`. | `ADM-04` |
| **BL-29** | `task/bl-29-admin-csv-export` | `US-29` | Helper `buildUsersCsv` & `buildAuditLogsCsv` + tombol **Unduh CSV Pengguna** dan **Unduh CSV Audit Log** di `AdminPanelPage.tsx` + unit test `sprint9Features.test.ts`. | `ADM-05` |

---

### Sprint 10 — LokaTalenta 2.0: Talent Readiness Passport & Radar Kompetensi (`v2.0.0` • Major)
- **Status:** **TERKIRIM (SHIPPED)**
- **Branch Feature:** `feature/sprint10-lokatalenta-2-0-talent-passport`

| ID | Branch Task | User Story | Scope Implementasi | Test Case QA |
| :--- | :--- | :--- | :--- | :--- |
| **BL-30** | `task/bl-30-competency-radar` | `US-30` | Kalkulator `computeTalentRadarMetrics` (5 dimensi: *Verbal*, *Numerik*, *Logika & Spasial*, *Ketahanan Kraepelin*, *Bahasa & Materi*) + komponen visual `CompetencyRadarCard.tsx` di `ProfilePage.tsx`. | `PRF-04` |
| **BL-31** | `task/bl-31-talent-passport-page` | `US-31` | Halaman publik baru `TalentPassportPage.tsx` (`/talent/:userId`), tombol **Buka & Bagikan Talent Passport** di `ProfilePage.tsx`, serta registrasi rute di `AppRouter.tsx`. | `TLN-01` |
| **BL-32** | `task/bl-32-recruiter-verify-2-0` | `US-32` | Upgrade `VerifyCertificatePage.tsx` (`/verify`) dengan tab/pencarian **Cek Talent Passport Kandidat** + unit test `sprint10Features.test.ts` + rilis major `./scripts/release.sh major`. | `CRT-03` |
| **BL-32B** | `task/bl-32b-admin-only-ui-isolation` | `US-32B` | Isolasi penuh UI & rute khusus Admin: `TopbarNav` hanya menampilkan navigasi **Admin Dashboard** saat login sebagai `admin`, dan `AppRouter.tsx` me-redirect akses admin ke rute Pelajar (`/`, `/courses/*`, `/quiz/*`, `/kraepelin`, `/tryout`, `/community`, `/profile`, `/certificate`) maupun Pengajar (`/teacher`) menuju `/admin`. | `ADM-06` |

---

### Sprint 11 — Cohort Kelas Privat, Agenda Belajar & Lab SQL Interaktif (`v2.1.0` • Minor)
- **Status:** **TERKIRIM (SHIPPED)**
- **Branch Feature:** `feature/sprint11-cohort-agenda-sql-lab`

| ID | Branch Task | User Story | Scope Implementasi | Test Case QA |
| :--- | :--- | :--- | :--- | :--- |
| **BL-33** | `task/bl-33-private-cohorts` | `US-33` | Manajemen Cohort & kode undangan unik di `TeacherStudioPage` + form gabung cohort di `ProfilePage`. | `TCH-07` |
| **BL-34** | `task/bl-34-study-agenda-timeline` | `US-34` | Panel **Agenda & Tenggat Terdekat** (gabungan Tryout, Sesi Live, Tugas) di `ProfilePage`. | `PRF-05` |
| **BL-35** | `task/bl-35-interactive-sql-lab` | `US-35` | `sqlSandboxEngine.ts` (`SELECT`, `WHERE`, `ORDER BY`, `LIMIT`) + UI **Lab SQL Interaktif** di `CoursePlayerPage`. | `CRS-10` |

---

### Sprint 12 — Diagnostic Study Plan, Bookmark Soal, Telemetry, POV Polish & UI Revamp (`v2.2.0` • Minor)
- **Status:** **TERKIRIM (SHIPPED)**
- **Branch Feature:** `feature/sprint12-diagnostic-bookmark-telemetry`

| ID | Branch Task | User Story | Scope Implementasi | Test Case QA |
| :--- | :--- | :--- | :--- | :--- |
| **BL-36** | `task/bl-36-diagnostic-study-plan` | `US-36` | Generator rencana belajar adaptif otomatis dari skor subtest terlemah di `ProfilePage`. | `PRF-06` |
| **BL-37** | `task/bl-37-question-bookmarks` | `US-37` | Tombol **Bookmark Soal Sulit** di `QuizResultPage` + tab **Soal Tersimpan** di `ProfilePage`. | `QUZ-14` |
| **BL-38** | `task/bl-38-admin-health-telemetry` | `US-38` | Telemetry collector & tab **Kesehatan Sistem** di `AdminPanelPage`. | `ADM-07` |
| **BL-38B** | `task/bl-38b-typing-speed-accuracy` | `US-38B` | `typingEngine.ts` (kalkulator WPM, CPM, Akurasi %, Error Rate) + `TypingTestPage.tsx` (`/typing`) dengan highlight karakter real-time, pilihan durasi/teks, & riwayat hasil `typing_attempts`. | `TYP-01` |
| **BL-38C** | `task/bl-38c-student-pov-xp-tryout` | `US-38C` | Pelacak XP Harian real-time (`earnedToday / xpTarget`), tautan aksi Radar 5D, Leaderboard per event Tryout, & search/sort forum Komunitas. | `CAT-08`, `TRY-03` |
| **BL-38D** | `task/bl-38d-mentor-preview-cohort-mgmt` | `US-38D` | Mode Pratinjau Mentor (`/courses/:slug?preview=true`), manajemen anggota cohort (lihat/keluarkan/arsip), edit metadata kursus/modul, & Ringkasan Mengajar di `/profile`. | `TCH-09` |
| **BL-38E** | `task/bl-38e-admin-moderation-cert-revoke` | `US-38E` | Modal Preview Kursus read-only di `/admin`, tab Moderasi Komunitas (`deleteCommunityPost`), metrik distribusi role/status, & tab Cabut (*Revoke*) Sertifikat dengan audit log. | `ADM-08` |
| **BL-38F** | `task/bl-38f-ui-revamp-catalog-bento` | `US-38F` | Revamp UI Katalog & Beranda: Hero Bento Hub (ring XP + quick-launch), *hover elevation*, *quick preview syllabus drawer*, badge fitur, & *skeleton shimmer* loading. | `UIX-01` |
| **BL-38G** | `task/bl-38g-ui-revamp-player-quiz-charts` | `US-38G` | Revamp UI Course Player & Asesmen: sidebar progress ring per modul, **Zen/Focus Mode**, animasi milestone toast lulus, serta *interactive hover tooltip* pada Kraepelin & Radar 5D. | `UIX-02` |

---

### Sprint 13 — Proctoring Lite, Soal Isian Singkat & Stress Gate v2 (`v2.3.0` • Minor)
- **Status:** **TERKIRIM (SHIPPED)**
- **Branch Feature:** `feature/sprint13-proctoring-shortanswer-stress`

| ID | Branch Task | User Story | Scope Implementasi | Test Case QA |
| :--- | :--- | :--- | :--- | :--- |
| **BL-39** | `task/bl-39-focus-integrity-proctoring` | `US-39` | Listener `visibilitychange` penghitung pindah tab + indikator fokus di `QuizRunnerPage` & `QuizResultPage`. | `QUZ-15` |
| **BL-40** | `task/bl-40-short-answer-questions` | `US-40` | Dukungan tipe soal `short_answer` (isian singkat/rumus) + evaluator case-insensitive di `QuizRunnerPage` & `TeacherStudioPage`. | `TCH-08` |
| **BL-40B** | `task/bl-40b-star-interview-cohort-item-analysis` | `US-40B` | Latihan Simulasi Interview metode STAR, penugasan/pengumuman bertarget `cohort_id`, drill-down rapor individual siswa, & Analitik Butir Soal (*Item Analysis*). | `CRS-11`, `TCH-10` |
| **BL-40C** | `task/bl-40c-clone-supervision-broadcast` | `US-40C` | Duplikasi Kursus/Paket Soal di Mentor Studio, Supervisi Cohort lintas pengajar di `/admin`, & Pengumuman Global Platform (*System-Wide Banner*). | `TCH-11`, `ADM-09` |
| **BL-40D** | `task/bl-40d-ui-revamp-studio-admin-interactive` | `US-40D` | Revamp UI `/teacher` & `/admin`: *drag-and-drop* modul/lesson, *live split preview* soal, *slide-over drawer* detail admin, grafik distribusi interaktif, & modal konfirmasi/toast modern. | `UIX-03` |
| **BL-40E** | `task/bl-40e-ui-layout-usability-research` | `US-40E` | Riset tata letak & keterpahaman UI lintas 3 peran menggunakan subagent `student-pov`, `teacher-pov`, dan `admin-pov` (audit *cognitive load*, kejelasan label/CTA, hierarki visual desktop & mobile) beserta perbaikan tata letak. | `UIX-04` |
| **BL-41** | `task/bl-41-stress-and-security-v2` | `US-41` | Suite stress test 5.000 operasi (Excel + SQL + Filter + Sanitasi XSS/CSV) sebelum masuk ke v3.0.0. | `PERF-02`, `SEC-02` |

---

### Sprint 14 — LokaTalenta 3.0: Recruiter Portal, Multi-Tenant & Anti-AI-Slop UI Revamp (`v3.0.0` • MAJOR)
- **Status:** **TERKIRIM (SHIPPED — 24 November 2026)**
- **Release Tag:** `v3.0.0` (Commit `d64ee0d`, Implementasi `26fe1c4`)
- **Branch Feature:** `feature/sprint14-lokatalenta-3-0-recruiter`
- **Hasil Verifikasi Rilis:** 112 skenario QA 100% PASS, 27 suite Vitest (163 tests) 100% PASS, Oxlint 0/0, Seluruh chunk JS < 250 kB, Otorisasi Rilis Resmi `LEAD-RELEASE-APPROVAL-V3.0.0` diterbitkan oleh Team Leader (Rizco Renova).

| ID | Branch Task | User Story | Scope Implementasi | Test Case QA |
| :--- | :--- | :--- | :--- | :--- |
| **BL-42** | `task/bl-42-recruiter-portal` | `US-42` | Halaman baru `RecruiterPortalPage.tsx` (`/recruiter`, 885 baris) dengan filter Radar 5D, batas minimal Kraepelin, status kesiapan kerja, serta Shortlist Drawer dengan catatan evaluasi internal HR. | `REC-01` |
| **BL-43** | `task/bl-43-custom-assessment-invite` | `US-43` | Generator tautan undangan asesmen perusahaan (`/quiz/:quizId?org=...&invite=...`), token unik acak, serta badge co-branding organisasi resmi pada `QuizRunnerPage.tsx`. | `REC-02` |
| **BL-44** | `task/bl-44-multitenant-role-v3` | `US-44` | Penambahan role `recruiter` di union type `UserRole` (`lms.ts:1`), pengamanan rute `AppRouter.tsx`, integrasi navigasi `TopbarNav`, panel `AdminPanelPage`, E2E regression, & rilis major **`v3.0.0`**. | `ADM-10`, `E2E-03` |
| **BL-45** | `task/bl-45-anti-ai-slop-ui-revamp` | `US-45` | **Anti-AI-Slop Visual System & High-Craft UI Revamp**: Menghapus efek pastel/neon blur murahan, beralih ke tipografi tajam editorial berhierarki tegas, batas 1px kontras (`border-zinc-200/800`), kartu berdensitas informasi tinggi, micro-interaction taktil, dan visualisasi Kantor AI 3D interaktif (awalnya `docs/kantor_ai_3d.html`, kini dipisahkan ke [`lokatalenta-office-3d`](https://github.com/zixew/lokatalenta-office-3d) / `../lokatalenta-office-3d`). | `UIX-05` |

---

## 3. Backlog Aktif: Sprint 15 — Enterprise ATS Pipeline, Pluggable Psychometrics & Architecture Hardening (`v3.1.0` • Minor)

- **Target Milestone:** `v3.1.0` (Minor Release)
- **Cabang Fitur Utama:** `feature/sprint15-ats-psychometrics-resilience`
- **Total Alokasi Kapasitas:** **57 Story Points (SP)**
- **Fokus Utama:** Penyelesaian utang teknis kritis P0 backend cloud, implementasi pipeline rekrutmen ATS Kanban, metriks komparasi kandidat, alur banding ujian, ergonomi Kraepelin ponsel, standarisasi PWA iOS iPhone (mandiri tanpa buka browser), fondasi instrumen psikometri DISC/MBTI, serta penguatan stabilitas ErrorBoundary dan test suite.

| ID Story | Branch Task | Kategori | Estimasi SP | Penanggung Jawab (PIC) | Prasyarat Dependensi | Scope Implementasi | Kriteria Penerimaan (Acceptance Criteria) | Test Case QA |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- | :--- |
| **FIX-01** | `task/fix-01-short-answer-scoring-rpc` | Backend Bug | **2 SP** | Bagas Bimo P. (BE) | Akses Migrasi SQL | Patch PL/pgSQL `submit_quiz_attempt` & `check_practice_answer` untuk mencocokkan `accepted_answers TEXT[]` dengan normalisasi spasi regex dan huruf kapital. | Jawaban siswa yang cocok dengan salah satu elemen `accepted_answers` dinilai 100% pada database Supabase cloud; tidak lagi 0%. | `QUZ-16` |
| **FIX-02** | `task/fix-02-proctoring-telemetry-cloud` | Backend Bug | **3 SP** | Bagas Bimo P. (BE) | FIX-01, `quiz_attempts` | Tambahkan parameter `p_tab_switch_count INT` dan `p_focus_loss_events JSONB` pada RPC `submit_quiz_attempt`. Update panggilan di `lmsApi.ts`. | Kolom `tab_switch_count` dan array timestamp blur tersimpan permanen di cloud database Supabase saat pengerjaan kuis diserahkan. | `QUZ-17` |
| **PERF-03** | `task/perf-03-debounced-autosave-quiz` | Kinerja | **3 SP** | Farel Faza N. (FE), Bagas Bimo P. (BE) | `QuizRunnerPage.tsx` | Terapkan debounce 3.000ms pada `saveAttemptProgress` di `QuizRunnerPage.tsx` dan pengiriman `navigator.sendBeacon` pada event `beforeunload`. | Mengurangi frekuensi query HTTP ke database hingga 85%; jawaban terakhir tetap tersimpan saat tab ditutup paksa. | `PERF-03` |
| **REC-06** | `task/rec-06-ats-kanban-pipeline` | Fitur Baru | **8 SP** | Farel Faza N. (FE), Bagas Bimo P. (BE) | `recruiter_shortlists`, `assessment_invitations` | Papan Kanban interaktif (*Invited -> In Progress -> Evaluated -> Shortlisted -> Selected/Rejected*) dengan drag-and-drop HTML5 native, catatan evaluasi internal, dan filter posisi. | Recruiter dapat memindahkan kartu pelamar lintas kolom tahapan secara mulus; perubahan status terupdate di database real-time. | `REC-03` |
| **REC-08** | `task/rec-08-candidate-comparison-matrix` | Fitur Baru | **5 SP** | Farel Faza N. (FE) | `RecruiterPortalPage.tsx` | Antarmuka komparasi berdampingan mengompilasi Radar 5D, metrik Kraepelin, dan rekam jejak hands-on lab untuk 2–4 kandidat terpilih. | Tabel komparasi menampilkan metrik perbandingan berdampingan secara rapi; tombol dinonaktifkan jika pilihan < 2 atau > 4 kandidat. | `REC-04` |
| **REC-07** | `task/rec-07-exam-retake-dispute-flow` | Fitur Baru | **5 SP** | Bagas Bimo P. (BE), Farel Faza N. (FE) | FIX-02, Skema `exam_disputes` | Formulir pengajuan ujian ulang bagi kandidat yang mengalami kendala teknis dan konsol verifikasi telemetri bagi Recruiter & Admin. | Kandidat dapat mengirim tiket banding; recruiter/admin dapat menyetujui reset attempt dengan data telemetri pendukung. | `REC-05` |
| **UI-15A** | `task/ui-15a-mobile-kraepelin-telephone-numpad` | UI/UX | **5 SP** | Farel Faza N. (FE) | `KraepelinPage.tsx` | Penguncian viewport `h-dvh overflow-hidden` pada peramban mobile dan penggantian keypad sistem dengan dialpad 3x4 fixed (touch target ≥ 48px). | Layar ponsel tidak bergeser (0px scroll) saat tes berlangsung; input angka berlatensi sangat rendah tanpa delay keyboard native. | `KRP-04` |
| **PWA-01** | `task/pwa-01-ios-standalone-pwa` | PWA / Mobile | **5 SP** | Farel Faza N. (FE), Nadia Maharani (UI/UX) | `index.html`, `manifest.webmanifest`, `sw.js` | Standalone PWA Support untuk iOS iPhone: meta `apple-mobile-web-app-capable`, status bar `black-translucent`, icon `apple-touch-icon` resolusi retina, penanganan safe area insets (`viewport-fit=cover`, Dynamic Island & Home indicator padding), dan modal panduan interaktif 'Add to Home Screen' Safari iOS. | Pengguna iPhone dapat memasang aplikasi ke Home Screen dan menjalankannya sebagai aplikasi mandiri full-screen tanpa membuka browser Safari; status bar menyatu, UI bebas tabrakan notch/Dynamic Island. | `PWA-01` |
| **ARC-05** | `task/arc-05-pluggable-psychometrics-disc-mbti` | Arsitektur | **8 SP** | Satria Adhyasta (SA), Bagas Bimo P. (BE) | `quizzes.test_type`, Strategy Factory | Mesin penilaian psikotes terstandarisasi format ipsatif Most/Least (DISC 24 butir) dan dikotomi biner (MBTI 16 tipe) dengan visualisasi 4 kuadran. | Sistem mampu menyajikan dan menilai soal format Most/Least DISC dan dikotomi MBTI, menghasilkan profil kepribadian yang akurat. | `QUZ-18` |
| **UI-15B** | `task/ui-15b-global-error-boundary-skeletons` | Stabilitas | **3 SP** | Farel Faza N. (FE) | `AppRouter.tsx` | Komponen penanganan error runtime adaptif per modul dan placeholder loading Skeleton yang mendukung tema gelap. | Error rendering pada satu komponen tidak mematikan seluruh aplikasi; menampilkan fallback UI ramah pengguna dengan tombol pulihkan. | `UIX-06` |
| **AI-15A** | `task/ai-15a-star-speech-evaluator-lite` | AI (MVP) | **5 SP** | Farel Faza N. (FE) | `SpeechPracticeBox.tsx`, `StarInterviewLab.tsx` | Latihan interview interaktif dengan input suara native Web Speech API dan evaluasi semantik kata kerja aksi / metrik STAR lokal. | Kandidat dapat menjawab dengan suara; parser NLP lokal memberikan skor kelengkapan dan saran kata kerja aksi secara instan. | `CRS-12` |
| **QAE-15** | `task/qae-15-automation-test-matrix-expansion` | Pengujian | **5 SP** | Qaisar Al-G. (QA), Raditya Rama K. (QA) | Vitest, `@playwright/test`, Matriks QA | Penambahan skenario uji otomatis Vitest dan integrasi Playwright untuk fitur ATS Kanban, Kraepelin Mobile, dan Psikometri (target: 190+ tests). | Rangkaian pengujian otomatis lulus 100%; matriks QA tersinkronisasi sempurna antara Markdown dan Excel (125+ kasus uji). | `E2E-04` |

---

## 4. Register Utang Teknis & Mitigasi Risiko (Technical Debt & Risk Register)

| ID Risiko | Deskripsi Masalah / Utang Teknis | Dampak Sistem | Rencana Aksi & Mitigasi | Target Sprint | PIC | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| **DEBT-01** | Fungsi RPC `submit_quiz_attempt` gagal menilai soal `short_answer` di Supabase. | Soal isian singkat mendapat nilai 0% di cloud. | Deploy patch PL/pgSQL dengan normalisasi regex (`FIX-01`). | Sprint 15 (Day 1) | Bagas Bimo P. | 🟡 In Progress |
| **DEBT-02** | Telemetri proctoring `tab_switch_count` tidak dikirim ke RPC Supabase. | Data kecurangan hilang di cloud; hanya ada di localStorage. | Perluas parameter RPC dan update payload di `lmsApi.ts` (`FIX-02`). | Sprint 15 (Day 1) | Bagas Bimo P. | 🟡 In Progress |
| **DEBT-03** | Auto-save kuis memicu mutasi HTTP tanpa debouncing (`PERF-03`). | Risiko koneksi pool exhausted (HTTP 503/504) saat 2.000 user kuis. | Debounce 3s + buffering queue + `sendBeacon` pada `beforeunload`. | Sprint 15 | Farel Faza N. | 🟡 In Progress |
| **DEBT-04** | Header `Permissions-Policy` pada `vercel.json` berisi `camera=()`. | Kamera diblokir mutlak oleh peramban; menghambat video interview. | Ganti konfigurasi menjadi `camera=(self), microphone=(self)`. | Sprint 15 (Day 2) | Damar Deva G. | 🟡 In Progress |
| **DEBT-05** | `recruiterApi.ts` menggunakan localStorage; tabel cloud Supabase yatim piatu. | Data shortlist dan undangan tidak tersinkronisasi lintas gawai. | Sambungkan panggilan ke SDK Supabase dengan fallback localStorage. | Sprint 15 | Bagas Bimo P. | 🟡 In Progress |
| **DEBT-06** | Parameter `inviteToken` tidak diteruskan saat memulai pengerjaan kuis. | Hasil ujian tidak terikat ke tabel `assessment_invitations`. | Tambahkan parameter `invite_token` pada `startQuizAttempt`. | Sprint 15 | Satria Adhyasta | 🟡 In Progress |
| **DEBT-07** | 5 Vektor kebocoran data kandidat pada RPC publik (`SEC-05`). | Potensi kunci jawaban bocor dan skor korporat muncul di publik. | Terapkan patch PL/pgSQL isolasi multi-tenant dan row-locking kuota. | Sprint 15 | Rendra Dananjaya | 🟡 In Progress |
| **DEBT-08** | Ukuran chunk `demoSeed` mencapai 225,57 kB (90,2% batas 250 kB). | Risiko terlampauinya batas anggaran bundle 250 kB saat data ditambah. | Larang penambahan data mock ke demoSeed; lakukan lazy chunking. | Sprint 15 | Pandu Respati | 🟡 Terpantau |
| **DEBT-09** | Ketiadaan `@playwright/test` di `package.json` (`E2E-03` masked). | Pengujian browser end-to-end riil terlewatkan di CI/CD. | Instal `@playwright/test` dan pasang script `test:e2e` di CI. | Sprint 15 (Day 2) | Qaisar Al-G. | 🟡 In Progress |
| **DEBT-10** | Halaman monolitik masif (`AdminPanelPage` 2.701 baris, `TeacherStudio`). | Sulit dirawat, risiko regresi tinggi saat maintenance. | Refactoring bertahap memecah ke sub-modul independen. | Sprint 15-18 | Farel Faza N. | 🔵 Terencana |

---

## 5. Peta Jalan Jangka Panjang: Horison Sprints 16 s.d. 20 (`v3.2.0` s.d. `v4.0.0`)

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                           HORISON PETA JALAN STRATEGIS LOKATALENTA (2026 - 2027)                      │
├───────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                       │
│  [ SPRINT 15: v3.1.0 ] ──► [ SPRINT 16: v3.2.0 ] ──► [ SPRINT 17: v3.3.0 ] ──► [ SPRINT 18: v3.4.0 ]  │
│  • Enterprise ATS Kanban   • Supabase Edge Functions  • Full AI Video Interview   • Anti-Cheat Lockdown│
│  • Psikometri DISC & MBTI  • WebSocket Live Proctor   • Whisper & Job-Fit AI      • Kepatuhan UU PDP   │
│  • P0 Backend Fixes & Perf • Norma CFIT & PAPI        • Bulk Candidate CSV Import • Refactor Monolith  │
│                                                                                                       │
│                                                                                                       │
│  [ SPRINT 19: v3.5.0 ] ────────────────────────────► [ SPRINT 20: v4.0.0 MAJOR ]                      │
│  • Billing & Saldo Korporat                           • Open Assessment REST API & Webhooks Engine    │
│  • Integrasi Payment Gateway Midtrans                 • Integrasi HRIS Enterprise (Workday, Talenta)   │
│  • Otomasi Faktur Pajak B2B                           • Rilis Aplikasi Mobile PWA/TWA Resmi PlayStore │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Rincian Tonggak Horison Strategis:
1. **Sprint 16 (`v3.2.0` Minor — Infrastruktur Serverless & Live Proctoring Hub):**
   - `ARC-07`: Supabase Edge Functions (Deno runtime) & Email Transaksional (Resend/SendGrid).
   - `PRO-01`: WebSocket Realtime Live Proctoring Hub (Supabase Realtime Broadcast + Grid Status Pengawas Ujian).
   - `ARC-06`: Mesin Konversi Norma Psikometri Kognitif (CFIT Skala 2/3 & PAPI Kostick).
   - `ARC-04`: Dynamic Tenant Wildcard Subdomain Routing (`*.lokatalenta.app`).
2. **Sprint 17 (`v3.3.0` Minor — Full AI Video Interview & Job-Fit Scoring Engine):**
   - `REC-11`: Full AI Audio/Video Interview Evaluator (Perekaman WebM, Supabase Storage privat, transkripsi Whisper).
   - `AI-02`: Algoritma Prediksi Kesesuaian Jabatan (*Job-Fit Scoring Engine*) & Rekomendasi Karir Berbasis AI.
   - `REC-12`: Bulk Candidate Invitation & CSV Import dengan validasi kuota instan.
3. **Sprint 18 (`v3.4.0` Minor — Enterprise Security Hardening & Lockdown Mode):**
   - `SEC-04`: Enterprise Anti-Cheat Lockdown Mode (Mandatory Fullscreen, Multi-Monitor Block, Clipboard Block).
   - `SEC-07`: Otomasi Audit Kepatuhan Privasi Data UU PDP No. 27/2022 (Consent Manager & Retention Auto-Purge).
   - `PERF-04`: Refactoring Halaman Raksasa `AdminPanelPage.tsx` & `TeacherStudioPage.tsx` menjadi sub-modul terisolasi.
4. **Sprint 19 (`v3.5.0` Minor — B2B Monetization & Corporate Billing Engine):**
   - `FIN-01`: Manajemen Saldo Kredit Asesmen Korporat & Payment Gateway Midtrans.
   - `FIN-02`: Otomasi Faktur Pembayaran Pajak & Laporan Penggunaan Lisensi Institusi.
5. **Sprint 20 (`v4.0.0` MAJOR — Open Assessment REST API & Ekosistem Terbuka):**
   - `ARC-10`: Open Assessment REST API & Webhooks Engine bertanda tangan HMAC.
   - `INT-01`: Integrasi Resmi ke Sistem HRIS Enterprise (Workday, SAP SuccessFactors, Talenta).
   - `MOB-01`: Peluncuran Resmi Aplikasi Mobile Native PWA TWA (Google Play Store).

---

## 6. Persetujuan & Tanda Tangan Transisi Rilis

Dokumen perencanaan dan backlog ini telah ditelaah, diselaraskan dengan hasil sintesis retrospektif Sprint 14, dan disetujui secara mufakat oleh seluruh 18 peran tim LokaTalenta:

- **Team Leader (Rizco Renova):** `APPROVED — AUTH: RIZCO-LEAD-AUTH-20261124-v3.0.0`
- **Bisnis Lead (Bramantyo Daniswara):** `APPROVED — AUTH: BRAM-BIZ-AUTH-20261124-B2B`
- **Product Owner (Pranadipa Wicaksana):** `APPROVED — AUTH: DIPA-PO-AUTH-20261124-PRD`
- **System Analyst (Satria Adhyasta):** `APPROVED — AUTH: SATRIA-SA-AUTH-20261124-FLOW`
- **IT Solution Architect (Ir. Arkananta Dewantara):** `APPROVED — AUTH: ARKAN-ARCH-AUTH-20261124-RLS`
- **Frontend Engineer (Farel Faza Nugraha):** `APPROVED — AUTH: FAREL-FE-AUTH-20261124-UI`
- **Backend Engineer (Bagas Bimo Prasetyo):** `APPROVED — AUTH: BAGAS-BE-AUTH-20261124-SQL`
- **DevOps Engineer (Damar Deva Gunawan):** `APPROVED — AUTH: DEVA-OPS-AUTH-20261124-DEPLOY`
- **Technical Writer (Tara Wulandari):** `APPROVED — AUTH: TARA-TW-AUTH-20261124-DOCS`
- **QA Tester Manual (Qonita Anindya):** `APPROVED — AUTH: QONITA-QA-AUTH-20261124-MANUAL`
- **QA Automation Lead (Qaisar Al-Ghaffar):** `APPROVED — AUTH: QAISAR-AUTO-AUTH-20261124-VITEST`
- **Performance Tester (Pandu Respati):** `APPROVED — AUTH: PANDU-PERF-AUTH-20261124-BUDGET`
- **Regression Tester (Raditya Rama Kusuma):** `APPROVED — AUTH: RADIT-REG-AUTH-20261124-112QA`
- **Penetration Tester (Rendra Dananjaya):** `APPROVED — AUTH: RENDRA-RED-AUTH-20261124-DAST`
- **IT Security & Compliance (Ir. Saskia Wardhani):** `APPROVED — AUTH: SASKIA-SEC-AUTH-20261124-PDP`
- **POV Student (Surya Dimas Pratama):** `APPROVED — AUTH: SURYA-STUDENT-AUTH-20261124-UX`
- **POV Teacher (Ibu Triastuti Rahayu):** `APPROVED — AUTH: TIAS-TEACHER-AUTH-20261124-RUBRIC`
- **POV Admin (Agung Abimanyu Santoso):** `APPROVED — AUTH: AGUNG-ADMIN-AUTH-20261124-AUDIT`

---
*Dokumen ini merupakan Dokumen Perencanaan Resmi (Single Source of Truth) repositori LokaTalenta. Diperbarui pada 24 November 2026.*

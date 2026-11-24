# Final Product & Sprint Backlog (`BL-21` s.d. `BL-32`) — Minor ke Major (`v1.10.0` → `v2.0.0`)

**Baseline Saat Ini:** `v1.9.1`  
**Alur GitFlow Wajib:** `task/<bl-id>` → `feature/<sprint>` → **SIT** → `dev` (**UAT**) → `release/<versi>` (**Staging & Release Notes**) → `main` (**Production Deploy**) → sync `main` → `dev`

---

## 1. Aturan Semantic Versioning (`Patch` vs `Minor` vs `Major`)

| Tipe Rilis | Pola Versi | Kriteria Perubahan | Contoh di Roadmap Ini |
| :--- | :--- | :--- | :--- |
| **Patch** | `1.9.x` | Bugfix UI/UX, perbaikan filter/layout, optimasi kecil tanpa fitur/rute baru. | `v1.9.1` (Fix Filter Kursus & Latihan) |
| **Minor** | `1.10.0` – `1.12.0` | Penambahan fitur baru, tabel/kolom baru yang *backward-compatible*, tab/panel baru di halaman yang ada. | Sprint 7 (`v1.10.0`), Sprint 8 (`v1.11.0`), Sprint 9 (`v1.12.0`) |
| **Major** | `2.0.0` | Lompatan kapabilitas produk utama: ekosistem publik baru (**Talent Readiness Passport** `/talent/:userId`), Radar Kompetensi 5-Dimensi, & integrasi Portal Perekrut 2.0. | Sprint 10 (`v2.0.0`) |

---

## 2. Rincian Backlog per Sprint

### Sprint 7 — Cloud Sync Personalisasi & Ekspor Catatan Belajar (`v1.10.0` • Minor)
- **Branch Feature:** `feature/sprint7-cloud-notes-and-prefs`
- **Daftar Task & Sub-Backlog:**

| ID | Branch Task | User Story | Scope Implementasi | Test Case QA |
| :--- | :--- | :--- | :--- | :--- |
| **BL-21** | `task/bl-21-cloud-lesson-notes` | `US-21` | Migrasi SQL `lesson_notes` + `syncLessonNoteFromServer` & `saveLessonNoteAsync` di `lessonNotesStorage.ts` dan `LessonNotesAndCheckPanel.tsx`. | `CRS-07` |
| **BL-22** | `task/bl-22-cloud-study-prefs` | `US-22` | Migrasi SQL `user_study_preferences` + sinkronisasi jalur karier, target XP harian, dan `last_lesson_id` lintas perangkat. | `CAT-05` |
| **BL-23** | `task/bl-23-export-course-notes` | `US-23` | Fungsi `buildCourseNotesMarkdown(course, userId)` + tombol **Unduh Catatan Kursus (.md)** di `CoursePlayerPage.tsx` + unit test `sprint7Features.test.ts`. | `CRS-08` |
| **BL-23B** | `task/bl-23b-interactive-spreadsheet-lab` | `US-23B` | `spreadsheetEngine.ts` (`=SUM`, `=AVERAGE`, `=MIN`, `=MAX`, `=COUNT`, `=IF`, `=VLOOKUP`, aritmetika sel) + komponen `InteractiveSpreadsheetLab.tsx` di `CoursePlayerPage.tsx` dengan Formula Bar `fx`, 3 skenario latihan teknis, & auto-grader rumus. | `CRS-09` |
| **BL-23C** | `task/bl-23c-security-and-perf-test` | `US-23C` | `securityGuards.ts` (XSS sanitizer, CSV Formula Injection guard, action rate-limiter), HTTP Security Headers di `client/vercel.json`, serta automated **Security & Performance Benchmark Test Suite** (`securityAndPerf.test.ts`: 1.000 evaluasi rumus < 50ms, 1.000 filter kursus < 15ms, bundle chunk budget < 250 kB). | `SEC-01`, `PERF-01` |

---

### Sprint 8 — Multi-User 1v1 Duel History, Smart Drill & Kraepelin Trend (`v1.11.0` • Minor)
- **Branch Feature:** `feature/sprint8-duel-drill-kraepelin`
- **Daftar Task & Sub-Backlog:**

| ID | Branch Task | User Story | Scope Implementasi | Test Case QA |
| :--- | :--- | :--- | :--- | :--- |
| **BL-24** | `task/bl-24-duel-history` | `US-24` | Migrasi SQL `quiz_challenges` + penyimpanan & tampilan **Riwayat Duel 1v1 Terbaru** di `QuizResultPage.tsx`. | `QUZ-07` |
| **BL-25** | `task/bl-25-smart-subtest-drill` | `US-25` | Filter query `?subtest=<category>` pada `QuizRunnerPage.tsx` + tombol **Latih Subtest Terlemah (Smart Drill)** di `QuizResultPage.tsx`. | `QUZ-08` |
| **BL-26** | `task/bl-26-kraepelin-history` | `US-26` | Modul `kraepelinHistory.ts` (`recordKraepelinAttempt`, `getKraepelinHistory`, analisis tren KPM/Akurasi) + panel **Riwayat & Tren Ketahanan** di `KraepelinPage.tsx` + unit test `sprint8Features.test.ts`. | `KRP-02` |

---

### Sprint 9 — Teacher Question Update In-Place & Admin Governance Export (`v1.12.0` • Minor)
- **Branch Feature:** `feature/sprint9-teacher-edit-admin-governance`
- **Daftar Task & Sub-Backlog:**

| ID | Branch Task | User Story | Scope Implementasi | Test Case QA |
| :--- | :--- | :--- | :--- | :--- |
| **BL-27** | `task/bl-27-inline-question-update` | `US-27` | Method `lmsApi.updateQuestionInQuiz(questionId, input)` + state `editingQuestionId` di `TeacherStudioPage.tsx` (mode **Perbarui Soal Ini** vs **Simpan Soal Baru** + tombol **Batal Edit**). | `TCH-06` |
| **BL-28** | `task/bl-28-cloud-admin-audit` | `US-28` | Migrasi SQL `admin_audit_logs` + sinkronisasi cloud & filter aksi (`ALL`, `ROLE_UPDATED`, `USER_STATUS_CHANGED`, `COURSE_PUBLISH_TOGGLED`) di `AdminAuditLogPanel.tsx`. | `ADM-04` |
| **BL-29** | `task/bl-29-admin-csv-export` | `US-29` | Helper `buildUsersCsv` & `buildAuditLogsCsv` + tombol **Unduh CSV Pengguna** dan **Unduh CSV Audit Log** di `AdminPanelPage.tsx` + unit test `sprint9Features.test.ts`. | `ADM-05` |

---

### Sprint 10 — LokaTalenta 2.0: Talent Readiness Passport & Radar Kompetensi (`v2.0.0` • Major)
- **Branch Feature:** `feature/sprint10-lokatalenta-2-0-talent-passport`
- **Daftar Task & Sub-Backlog:**

| ID | Branch Task | User Story | Scope Implementasi | Test Case QA |
| :--- | :--- | :--- | :--- | :--- |
| **BL-30** | `task/bl-30-competency-radar` | `US-30` | Kalkulator `computeTalentRadarMetrics` (5 dimensi: *Verbal*, *Numerik*, *Logika & Spasial*, *Ketahanan Kraepelin*, *Bahasa & Materi*) + komponen visual `CompetencyRadarCard.tsx` di `ProfilePage.tsx`. | `PRF-04` |
| **BL-31** | `task/bl-31-talent-passport-page` | `US-31` | Halaman publik baru `TalentPassportPage.tsx` (`/talent/:userId`), tombol **Buka & Bagikan Talent Passport** di `ProfilePage.tsx`, serta registrasi rute di `AppRouter.tsx`. | `TLN-01` |
| **BL-32** | `task/bl-32-recruiter-verify-2-0` | `US-32` | Upgrade `VerifyCertificatePage.tsx` (`/verify`) dengan tab/pencarian **Cek Talent Passport Kandidat** + unit test `sprint10Features.test.ts` + rilis major `./scripts/release.sh major`. | `CRT-03` |
| **BL-32B** | `task/bl-32b-admin-only-ui-isolation` | `US-32B` | Isolasi penuh UI & rute khusus Admin: `TopbarNav` hanya menampilkan navigasi **Admin Dashboard** saat login sebagai `admin`, dan `AppRouter.tsx` me-redirect akses admin ke rute Pelajar (`/`, `/courses/*`, `/quiz/*`, `/kraepelin`, `/tryout`, `/community`, `/profile`, `/certificate`) maupun Pengajar (`/teacher`) menuju `/admin`. | `ADM-06` |

---

### Sprint 11 — Cohort Kelas Privat, Agenda Belajar & Lab SQL Interaktif (`v2.1.0` • Minor)
- **Branch Feature:** `feature/sprint11-cohort-agenda-sql-lab`

| ID | Branch Task | User Story | Scope Implementasi | Test Case QA |
| :--- | :--- | :--- | :--- | :--- |
| **BL-33** | `task/bl-33-private-cohorts` | `US-33` | Manajemen Cohort & kode undangan unik di `TeacherStudioPage` + form gabung cohort di `ProfilePage`. | `TCH-07` |
| **BL-34** | `task/bl-34-study-agenda-timeline` | `US-34` | Panel **Agenda & Tenggat Terdekat** (gabungan Tryout, Sesi Live, Tugas) di `ProfilePage`. | `PRF-05` |
| **BL-35** | `task/bl-35-interactive-sql-lab` | `US-35` | `sqlSandboxEngine.ts` (`SELECT`, `WHERE`, `ORDER BY`, `LIMIT`) + UI **Lab SQL Interaktif** di `CoursePlayerPage`. | `CRS-10` |

---

### Sprint 12 — Diagnostic Study Plan, Bookmark Soal & Telemetry (`v2.2.0` • Minor)
- **Branch Feature:** `feature/sprint12-diagnostic-bookmark-telemetry`

| ID | Branch Task | User Story | Scope Implementasi | Test Case QA |
| :--- | :--- | :--- | :--- | :--- |
| **BL-36** | `task/bl-36-diagnostic-study-plan` | `US-36` | Generator rencana belajar adaptif otomatis dari skor subtest terlemah di `ProfilePage`. | `PRF-06` |
| **BL-37** | `task/bl-37-question-bookmarks` | `US-37` | Tombol **Bookmark Soal Sulit** di `QuizResultPage` + tab **Soal Tersimpan** di `ProfilePage`. | `QUZ-09` |
| **BL-38** | `task/bl-38-admin-health-telemetry` | `US-38` | Telemetry collector & tab **Kesehatan Sistem** di `AdminPanelPage`. | `ADM-07` |
| **BL-38B** | `task/bl-38b-typing-speed-accuracy` | `US-38B` | `typingEngine.ts` (kalkulator WPM, CPM, Akurasi %, Error Rate) + `TypingTestPage.tsx` (`/typing`) dengan highlight karakter real-time, pilihan durasi/teks, & riwayat hasil `typing_attempts`. | `TYP-01` |
| **BL-38C** | `task/bl-38c-student-pov-xp-tryout` | `US-38C` | Pelacak XP Harian real-time (`earnedToday / xpTarget`), tautan aksi Radar 5D, Leaderboard per event Tryout, & search/sort forum Komunitas. | `CAT-08`, `TRY-03` |
| **BL-38D** | `task/bl-38d-mentor-preview-cohort-mgmt` | `US-38D` | Mode Pratinjau Mentor (`/courses/:slug?preview=true`), manajemen anggota cohort (lihat/keluarkan/arsip), edit metadata kursus/modul, & Ringkasan Mengajar di `/profile`. | `TCH-09` |
| **BL-38E** | `task/bl-38e-admin-moderation-cert-revoke` | `US-38E` | Modal Preview Kursus read-only di `/admin`, tab Moderasi Komunitas (`deleteCommunityPost`), metrik distribusi role/status, & tab Cabut (*Revoke*) Sertifikat dengan audit log. | `ADM-08` |

---

### Sprint 13 — Proctoring Lite, Soal Isian Singkat & Stress Gate v2 (`v2.3.0` • Minor)
- **Branch Feature:** `feature/sprint13-proctoring-shortanswer-stress`

| ID | Branch Task | User Story | Scope Implementasi | Test Case QA |
| :--- | :--- | :--- | :--- | :--- |
| **BL-39** | `task/bl-39-focus-integrity-proctoring` | `US-39` | Listener `visibilitychange` penghitung pindah tab + indikator fokus di `QuizRunnerPage` & `QuizResultPage`. | `QUZ-10` |
| **BL-40** | `task/bl-40-short-answer-questions` | `US-40` | Dukungan tipe soal `short_answer` (isian singkat/rumus) + evaluator case-insensitive di `QuizRunnerPage` & `TeacherStudioPage`. | `TCH-08` |
| **BL-40B** | `task/bl-40b-star-interview-cohort-item-analysis` | `US-40B` | Latihan Simulasi Interview metode STAR, penugasan/pengumuman bertarget `cohort_id`, drill-down rapor individual siswa, & Analitik Butir Soal (*Item Analysis*). | `CRS-11`, `TCH-10` |
| **BL-40C** | `task/bl-40c-clone-supervision-broadcast` | `US-40C` | Duplikasi Kursus/Paket Soal di Mentor Studio, Supervisi Cohort lintas pengajar di `/admin`, & Pengumuman Global Platform (*System-Wide Banner*). | `TCH-11`, `ADM-09` |
| **BL-41** | `task/bl-41-stress-and-security-v2` | `US-41` | Suite stress test 5.000 operasi (Excel + SQL + Filter + Sanitasi XSS/CSV) sebelum masuk ke v3.0.0. | `PERF-02`, `SEC-02` |

---

### Sprint 14 — LokaTalenta 3.0: Recruiter Portal & Multi-Tenant Assessment (`v3.0.0` • MAJOR)
- **Branch Feature:** `feature/sprint14-lokatalenta-3-0-recruiter`

| ID | Branch Task | User Story | Scope Implementasi | Test Case QA |
| :--- | :--- | :--- | :--- | :--- |
| **BL-42** | `task/bl-42-recruiter-portal` | `US-42` | Halaman baru `RecruiterPortalPage.tsx` (`/recruiter`) dengan filter Radar 5D, skor Kraepelin, & Shortlist Kandidat. | `REC-01` |
| **BL-43** | `task/bl-43-custom-assessment-invite` | `US-43` | Generator tautan undangan asesmen perusahaan (`/quiz/:quizId?org=...&invite=...`) + badge organisasi di `QuizRunnerPage`. | `REC-02` |
| **BL-44** | `task/bl-44-multitenant-role-v3` | `US-44` | Penambahan role `recruiter` di `UserRole`, `AdminPanelPage`, `TopbarNav`, E2E regression, & rilis major **`v3.0.0`**. | `ADM-07`, `E2E-03` |

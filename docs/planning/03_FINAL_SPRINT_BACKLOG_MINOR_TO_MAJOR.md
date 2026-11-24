# Final Product & Sprint Backlog (`BL-21` s.d. `BL-32`) — Minor ke Major (`v1.10.0` → `v2.0.0`)

**Baseline Saat Ini:** `v1.9.1`  
**Alur GitFlow Wajib:** `feature/<sprint>` → `task/<bl-id>` → merge ke `feature/*` → **SIT** → merge ke `dev` (**UAT**) → merge ke `prod` (**Staging**) → merge ke `main` (**Full Release + Tag**)

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

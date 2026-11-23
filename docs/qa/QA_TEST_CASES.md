# QA Comprehensive Test Cases — LokaTalenta (Post-Deployment)

> **Target Pengujian:** Production (`https://lokatalenta.vercel.app`) & Dev Preview (`https://lokatalenta-git-dev-zixew.vercel.app`)  
> **Tanggal Audit:** 2026-11-23

---

## 1. Post-Deployment & Infrastruktur (`POST`)
| ID | Role | Flow | Skenario | Langkah Uji | Ekspektasi | Status Post-Deploy |
|---|---|---|---|---|---|---|
| POST-01 | Guest | Happy | Akses beranda Production & muat 123 program | Buka `https://lokatalenta.vercel.app/` | Halaman termuat `HTTP 200`, 123 program tampil, `0` console/network error | **FAIL** *(Intermittent Supabase HTTP 500 statement timeout)* |
| POST-02 | Guest | Happy | SPA Rewrite / Direct Deep-Link & Refresh | Buka langsung & refresh `/verify/LT-INVALID-999` | Vercel mengembalikan `HTTP 200` (bukan 404), tampil `"Sertifikat Tidak Ditemukan"` | **PASS** |
| POST-03 | Guest | Happy | Isolasi Environment Dev vs Production | Buka `https://lokatalenta-git-dev-zixew.vercel.app/` | Terhubung ke Supabase Dev (`mbhvnmtyaccjganddeyt`), terpisah dari Prod | **PASS** |

---

## 2. Autentikasi, Validasi Email & Keamanan Sesi (`AUTH`)
| ID | Role | Flow | Skenario | Langkah Uji | Ekspektasi | Status Post-Deploy |
|---|---|---|---|---|---|---|
| AUTH-01 | Guest | Happy | Registrasi akun pelajar baru tanpa OTP | Buka `/auth` → **Gabung Sekarang** → isi Nama, Email valid baru, Password ≥ 6 → klik **Daftar Sekarang** | Akun terbuat, langsung masuk sebagai Pelajar, redirect ke `/` | **PASS** |
| AUTH-02 | Guest | Sad | Login dengan password salah | Buka `/auth` → isi email valid + password salah → klik **Masuk** | Muncul error `"Invalid login credentials"`, tetap di `/auth` | **PASS** |
| AUTH-03 | Guest | Sad | Registrasi dengan email duplikat | Daftar ulang memakai email yang sudah terdaftar (`nadia@pelajar.id`) | Registrasi ditolak dengan pesan `"Email sudah terdaftar. Silakan masuk."` | **PASS** |
| AUTH-04 | All | Sad | Login akun yang dinonaktifkan Admin | Admin menonaktifkan akun → user mencoba login | Login ditolak dengan pesan `"Akun Anda sedang dinonaktifkan oleh Admin."` | **PASS** |
| AUTH-05 | Guest | Happy | Pembersihan input password saat ganti mode | Isi password di mode Masuk → klik **Gabung Sekarang** | Input password otomatis dikosongkan | **PASS** |
| AUTH-06 | Guest | Sad | Validasi format email & panjang password < 6 | Isi `"bukanemail"` / password `"123"` saat daftar | Form menolak submit dengan pesan validasi yang jelas | **PASS** |
| AUTH-07 | All | Happy | Single Active Session (Login perangkat/sesi lain) | Login akun yang sama di sesi/browser kedua | Sesi lama otomatis keluar dan redirect ke `/auth` dengan notifikasi sesi berpindah | **PASS** |
| AUTH-08 | Student | Sad | RBAC Guard akses `/admin` & `/teacher` | Login sebagai Pelajar → akses langsung `/admin` dan `/teacher` | Otomatis dialihkan ke `/` | **PASS** |

---

## 3. Katalog, Onboarding & Misi Belajar (`CAT`)
| ID | Role | Flow | Skenario | Langkah Uji | Ekspektasi | Status Post-Deploy |
|---|---|---|---|---|---|---|
| CAT-01 | Guest/Student | Happy | Filter Kategori, Tipe Program & Kesulitan | Pilih `Latihan Soal Langsung`, kategori, & tingkat kesulitan | Jumlah & daftar kartu program sesuai filter | **PASS** *(Selama tidak kena HTTP 500)* |
| CAT-02 | Guest/Student | Sad | Pencarian tidak ditemukan & Reset Filter | Ketik `"zzzznotfound"` → klik **Reset Filter** | Tampil empty state lalu semua 123 program kembali tampil | **PASS** |
| CAT-03 | Student | Happy | Onboarding Goal Picker & Rekomendasi | Pilih tujuan belajar di panel **Rekomendasi Jalur Belajar** | Muncul 3 kursus rekomendasi yang sesuai | **PASS** |
| CAT-04 | Student | Happy | Lanjutkan Belajar Anda | Login & buka `/` setelah gabung ≥ 1 kursus | Tampil kartu progres & tombol Lanjutkan | **PASS** |
| CAT-05 | Student | Happy | Misi Belajar Aktif (*Daily Quests*) | Login & buka `/` | Tampil checklist 3 misi (`0/3`–`3/3`) + progress bar | **PASS** |

---

## 4. Course Gate, Player, Flashcard SRS & Latihan Bicara (`CRS`)
| ID | Role | Flow | Skenario | Langkah Uji | Ekspektasi | Status Post-Deploy |
|---|---|---|---|---|---|---|
| CRS-01 | Student | Sad | Akses materi sebelum Gabung Course | Buka `/courses/:slug` sebelum bergabung | Materi terkunci; tampil Ringkasan, Silabus, Total Siswa & tombol **Gabung Course** | **PASS** *(Bug pada role Teacher/Admin)* |
| CRS-02 | Student | Happy | Gabung Course & Akses Pelajaran | Klik **Gabung Course** → klik **Selesai & Lanjut** | Materi terbuka dan progres bertambah | **PASS** |
| CRS-03 | Student | Happy | Flashcard SRS flip, rating & progres | Uji **Mode Flashcard** (`Balik` → `Mudah`) | `SRS Dikuasai` bertambah dan lanjut ke kartu berikutnya | **FAIL (Mobile)** *(Overflow `17px` di `390x844`)* |
| CRS-04 | Student | Happy/Sad | Kanvas Menulis & Latihan Bicara (*Shadowing*) | Uji **Latihan Menulis** & tombol **Mulai Ucapkan** | Kanvas muat seluruh karakter panduan; Mic beri feedback/fallback jelas | **FAIL** *(Teks multi-karakter terpotong; Mic gagal tanpa pesan)* |

---

## 5. Tugas Upload File & Penilaian Rubrik 1–5 (`ASG`)
| ID | Role | Flow | Skenario | Langkah Uji | Ekspektasi | Status Post-Deploy |
|---|---|---|---|---|---|---|
| ASG-01 | Student | Sad | Submit tugas tanpa memilih file | Buka tab **Tugas** tanpa pilih file | Tombol **Kumpulkan Tugas** berstatus `disabled` | **PASS** |
| ASG-02 | Teacher | Sad | Tolak tugas tanpa alasan | Klik **Tolak & Minta Upload Ulang** dengan alasan kosong | Validasi menolak aksi dan meminta alasan | **PASS** |
| ASG-03 | Student/Teacher | Happy | Upload → Tolak → Upload Ulang → Terima (★ 5) | Alur lengkap upload & penilaian rubrik 1–5 | Status & notifikasi terkirim ke siswa | **PASS** *(Pre-deploy unit/UI verified)* |

---

## 6. Simulasi Psikotes, Navigasi & Rekomendasi (`QUZ`)
| ID | Role | Flow | Skenario | Langkah Uji | Ekspektasi | Status Post-Deploy |
|---|---|---|---|---|---|---|
| QUZ-01 | Student | Happy | Pengerjaan & Kembali ke Kursus | Mulai kuis → jawab → Selesai | Skor, `Jawaban Benar` & `Jawaban Salah` akurat; tombol kembali sesuai konteks | **PASS** |
| QUZ-02 | Student | Happy | Bank Soal 2× Prioritas Soal Baru | Selesaikan attempt 1 → mulai attempt 2 | Paket soal attempt 2 berbeda sebelum reset acak | **PASS** |
| QUZ-03 | Student | Sad | Mengulang sebelum cooldown 60 detik | Gagal kuis → cek tombol **Ulangi Latihan** < 60 dtk | Tombol disabled dengan countdown (`Ulangi dalam ... dtk`) | **PASS** |
| QUZ-04 | Student | Sad | Mengulang setelah lulus (≥ 70%) | Akses ulang `/quiz/:id` setelah lulus | Diarahkan ke halaman hasil | **PASS** |
| QUZ-05 | Student | Happy | Filter Navigasi Soal (`Semua`/`Kosong`/`Ragu`) | Klik pill `Ragu`, `Kosong`, `Semua` saat kuis | Grid nomor soal terfilter akurat | **PASS** |
| QUZ-06 | Student | Happy | Keyboard Shortcuts (`A`–`E`, `←`/`→`, `F`) | Tekan `A`/`B`, `ArrowRight`, dan `F` saat kuis | Opsi terpilih, pindah soal, & soal ditandai Ragu-ragu | **FAIL** *(Tombol `F` tidak menandai Ragu-ragu)* |
| QUZ-07 | Student | Happy | Rekomendasi Fokus Subtes Terlemah & Filter Subtes | Klik **Fokus Soal [Subtes]** di `QuizResultPage` | List pembahasan otomatis terfilter ke soal salah subtes terlemah | **PASS** |
| QUZ-08 | Student | Happy | Klik **Ulangi Latihan** setelah cooldown habis | Tunggu cooldown 60 dtk → klik **Ulangi Latihan** | Layar berpindah ke Quiz Runner dan memuat soal baru | **PASS** |
| QUZ-09 | Student | Happy | Mode Latihan (*Instant Feedback*) di Quiz Runner | Aktifkan toggle **Mode Latihan** → pilih opsi jawaban → klik **Cek Jawaban & Pembahasan** | Tampil status Benar/Kurang Tepat + kunci jawaban & penjelasan soal langsung tanpa menunggu selesai | **PASS** |
| KRP-01 | Public/Student | Happy | Simulator Tes Kraepelin / Pauli (`/kraepelin`) | Pilih preset → klik **Mulai Simulasi Sekarang** → jawab beberapa pasangan dengan keypad/keyboard → klik **Selesai** | Tampil hasil Total Terjawab, Akurasi %, Kecepatan rata-rata, Konsistensi %, & Kurva per kolom | **PASS** |
| KRP-02 | Public/Student | Sad/Mobile | Kraepelin Mobile `390×844` & selesai 0 jawaban | Buka `/kraepelin` di `390×844`, mulai lalu klik **Selesai** tanpa menjawab | `0px` horizontal overflow dan semua metrik tampil `0%` (tanpa `NaN`) | **PASS** |

---

## 7. Komunitas, Interaksi Mentor & Profil (`COM`, `MNT`, `PRF`)
| ID | Role | Flow | Skenario | Langkah Uji | Ekspektasi | Status Post-Deploy |
|---|---|---|---|---|---|---|
| COM-01 | Student | Happy | Buat topik, balas, & hapus topik | Buat topik baru di `/community` lalu hapus | Post tersimpan (`201`) dan terhapus (`204`) | **PASS** |
| COM-02 | Student | Sad | Guard `Dukung` 1× & double-click cepat | Klik cepat `Dukung` 2× berturut-turut | Hanya 1 request terkirim, `0` error `HTTP 409`, toggle +1/-1 akurat | **PASS** |
| COM-03 | Student | Happy | Deep-link **Tanyakan Soal Ini ke Komunitas** | Klik tombol di `QuizResultPage` | Composer `/community` otomatis terbuka & terisi kutipan soal + opsi | **PASS** |
| MNT-01 | Student/Teacher | Happy | Q&A berulir, konsultasi 1-on-1 & Sesi Live | Kirim pertanyaan/balasan & daftar sesi | Tersimpan & notifikasi terkirim | **PASS** |
| MNT-02 | Student | Sad | Booking Sesi Live saat kuota penuh | Coba daftar sesi yang penuh | Ditolak dengan pesan `Kuota sesi sudah penuh.` | **PASS** |
| PRF-01 | Student | Happy | Konsistensi XP, Streak, Global Leaderboard & Riwayat Kuis | Buka `/profile` setelah belajar & mengerjakan kuis | XP, materi, tes dikerjakan, dan Global Leaderboard (`get_public_leaderboard`) sinkron lintas siswa | **PASS** |
| PRF-02 | Student/Guest | Happy/Sad | Edit Bio/Nama & akses `/profile` tanpa login | Edit bio + reload; buka `/profile` saat logout | Perubahan bio tersimpan; guest diarahkan ke `/auth` | **PARTIAL FAIL** *(Edit bio PASS; guest `/profile` blank)* |

---

## 8. Sertifikat, Teacher Studio, Admin & UI/UX (`CRT`, `TCH`, `ADM`, `UI`)
| ID | Role | Flow | Skenario | Langkah Uji | Ekspektasi | Status Post-Deploy |
|---|---|---|---|---|---|---|
| CRT-01 | Public | Happy | Verifikasi Sertifikat Valid | Buka `/verify/:certCode` terdaftar | Tampil badge **Sertifikat Asli & Terverifikasi** | **PASS** |
| CRT-02 | Public | Sad | Verifikasi Sertifikat Tidak Ditemukan | Buka `/verify/LT-INVALID-999` | Tampil pesan **Sertifikat Tidak Ditemukan** | **PASS** |
| TCH-01 | Teacher | Happy | Teacher Studio 5 Tab & Bank Soal | Login `rizco@pengajar.id` → buka `/teacher` | Seluruh tab & data kursus/bank soal termuat `HTTP 200` | **FAIL** *(Nested query `questions(*)` kena HTTP 500)* |
| TCH-02 | Teacher | Sad | Validasi form kosong di Teacher Studio | Submit soal/pengumuman/tugas/sesi kosong | Validasi form menolak submit | **PASS** |
| ADM-01 | Admin | Happy | Manajemen User, Filter & Moderasi Kursus | Login `admin@ruanglatih.id` → `/admin` | Tabel user + Moderasi Kursus (`123`) tampil normal | **FAIL** *(Moderasi Kursus `0/0` karena HTTP 500)* |
| ADM-02 | Admin | Sad | Guard anti-nonaktifkan/turunkan role diri sendiri | Cek baris akun admin yang sedang login di `/admin` | Tombol `Nonaktifkan` & turun role pada diri sendiri dinonaktifkan/ditolak | **FAIL (CRITICAL)** *(Admin bisa menonaktifkan dirinya sendiri & langsung terkunci)* |
| UI-01 | All | Happy | Dark/Light Mode & Responsivitas Mobile `390x844` | Uji tema & horizontal scroll di `/`, `/courses/...` | `0px` horizontal overflow & navbar tidak bertabrakan | **FAIL** *(Overflow `3px` di `/`, `17px` di Flashcard, navbar subtitle tabrakan)* |
| CRS-05 | Student | Happy | Quick Check & Catatan Pribadi di Course Player (BL-04) | Buka materi artikel/video, jawab Quick Check, simpan catatan pribadi & reload | Feedback Quick Check tampil instan & catatan tersimpan per user/lesson | **READY FOR SIT** |
| TCH-03 | Teacher | Happy | Bulk Import Soal CSV + Live Preview (BL-05) | Buka tab Bank Soal `/teacher`, isi contoh CSV / unggah file, cek Live Preview & klik Impor | Preview menampilkan soal valid & seluruh soal tersimpan ke bank soal | **READY FOR SIT** |
| TCH-04 | Teacher | Happy | Analitik Kelulusan, Drop-off Funnel & Kategori Soal (BL-06) | Buka tab Progres Siswa `/teacher` | Tampil KPI Pass Rate, rata-rata skor, funnel progres kursus, & distribusi kategori | **READY FOR SIT** |
| QUZ-05 | Student | Happy | Tantangan 1v1 & Share Skor/Sertifikat (BL-07) | Buka hasil kuis / sertifikat, salin link tantangan 1v1, buka link tantangan | Banner Tantangan 1v1 tampil di QuizRunner & link WA/LinkedIn valid | **READY FOR SIT** |
| AUTH-04 | Public | Happy | Lupa Password / Reset Password Flow (BL-08) | Klik `Lupa Password?` di `/auth`, isi email valid & submit | Konfirmasi pengiriman tautan reset password tampil | **READY FOR SIT** |
| TRY-01 | Public/Student | Happy | Tryout Akbar Terjadwal & Leaderboard Event (BL-09) | Buka `/tryout`, daftar event aktif, cek status & Leaderboard | Event Live/Upcoming/Ended tampil, daftar berhasil, & Top 10 tampil | **READY FOR SIT** |
| E2E-01 | All | Happy | Regression Suite Playwright & CI (BL-10) | Jalankan `client/e2e/lms-flows.spec.ts` & unit tests | Seluruh skenario inti lulus | **READY FOR SIT** |
| PRF-03 | System | Happy | Code-Splitting Vendor Bundle < 250 kB (BL-11) | Jalankan `npm run build` | Seluruh chunk (`index`, `react-vendor`, `supabase-vendor`, `query-vendor`) < 250 kB tanpa warning | **PASS** |
| AUTH-05 | Public | Happy | Callback Form Buat Password Baru (`?type=recovery`) (BL-12) | Buka `/auth?type=recovery`, isi password baru & konfirmasi | Form Buat Password Baru tampil & validasi min 6 karakter bekerja | **READY FOR SIT** |
| TRY-02 | Student | Happy | Filter Kategori & Sync Pendaftaran Tryout Akbar (BL-13) | Buka `/tryout`, filter kategori `CPNS & Kedinasan`, daftar event | Daftar event terfilter sesuai kategori & status Terdaftar persisten | **READY FOR SIT** |
| E2E-02 | System | Happy | Suite E2E Recovery & Topbar Navigation (BL-14) | Jalankan `npm test` & verifikasi E2E | Seluruh unit test & skenario recovery lulus | **READY FOR SIT** |
| CAT-04 | Public/Student | Happy | Target Karier (`Seleksi BUMN & CPNS`) & Target XP Harian (BL-15) | Buka `/`, pilih `100 XP Intensif` & jalur `Seleksi BUMN & CPNS` | Badge Fokus & 3 rekomendasi kursus berubah sesuai jalur | **READY FOR SIT** |
| CRS-06 | Student | Happy | Resume Last Opened Lesson & Keyboard Shortcut Hint (BL-16) | Buka materi ke-2 di Course Player, reload; buka QuizRunner | Materi terakhir otomatis terbuka & bar Shortcut Cepat tampil | **READY FOR SIT** |
| QUZ-06 | Student | Happy | Duel 1v1 Score Comparison di QuizResultPage (BL-17) | Kerjakan kuis dengan `?challengeScore=80&challenger=Budi` hingga submit | Tampil kartu **Hasil Duel 1v1** (MENANG/SERI/BELUM MENANG vs Budi) | **READY FOR SIT** |
| TCH-05 | Teacher | Happy | Search, Filter Kategori & Load-to-Editor Bank Soal (BL-18) | Buka `/teacher`, cari teks soal, filter kategori, klik tombol Edit (`Pencil`) | Daftar soal terfilter & soal terpilih dimuat ke form editor | **READY FOR SIT** |
| ADM-03 | Admin | Happy | Tab Audit Log & Rekam Jejak Aksi Admin (BL-19) | Buka `/admin`, lakukan perubahan role/publikasi, buka tab `Audit Log` | Entri audit (`ROLE_UPDATED` / `COURSE_PUBLISH_TOGGLED`) tercatat lengkap | **READY FOR SIT** |
| PWA-01 | All | Happy | PWA Manifest, App Shortcuts & Footer Badge (BL-20) | Periksa `/manifest.webmanifest`, `/sw.js`, dan badge `PWA Ready` di footer | Manifest valid dengan shortcut `/kraepelin` & `/tryout` serta badge `PWA Ready` tampil | **READY FOR SIT** |

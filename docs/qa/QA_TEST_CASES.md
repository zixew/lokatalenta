# QA Comprehensive Test Cases — LokaTalenta

## 1. Autentikasi & Sesi (`AuthPage`)
| ID | Flow | Skenario | Langkah Uji | Ekspektasi |
|---|---|---|---|---|
| AUTH-01 | Happy | Registrasi akun pelajar baru | Buka `/auth` → klik **Gabung Sekarang** → isi Nama, Email baru, Password ≥ 6 karakter → klik **Daftar Sekarang** | Akun terbuat, masuk sebagai Pelajar, redirect ke `/` |
| AUTH-02 | Sad | Login dengan password salah | Buka `/auth` → isi email valid + password salah → klik **Masuk** | Muncul pesan error, tetap di `/auth` |
| AUTH-03 | Sad | Registrasi dengan email duplikat | Daftar ulang memakai email yang sudah terdaftar | Muncul error email sudah terdaftar |
| AUTH-04 | Sad | Akun dinonaktifkan oleh Admin | Admin menonaktifkan akun → user mencoba login | Login ditolak |

## 2. Katalog, Filter & Onboarding (`CatalogPage`)
| ID | Flow | Skenario | Langkah Uji | Ekspektasi |
|---|---|---|---|---|
| CAT-01 | Happy | Filter & Pencarian Marketplace | Pilih Kategori, Tipe Program, Tingkat Kesulitan, dan kata kunci pencarian | Jumlah program & kartu sesuai filter |
| CAT-02 | Sad | Pencarian tidak ditemukan | Ketik `"zzzznotfound"` di kotak pencarian | Tampil *empty state* + tombol **Reset** mengembalikan seluruh program |
| CAT-03 | Happy | Onboarding Goal Picker & Continue Learning | Pilih salah satu tujuan belajar di beranda | Muncul 3 kursus rekomendasi yang sesuai |

## 3. Course Overview Gate & Materi (`CourseOverviewGate` & `CoursePlayerPage`)
| ID | Flow | Skenario | Langkah Uji | Ekspektasi |
|---|---|---|---|---|
| CRS-01 | Sad | Akses materi sebelum bergabung | Buka `/courses/:slug` dengan akun pelajar yang belum join | Materi terkunci; tampil Ringkasan, Alur Modul, Total Siswa, Ulasan & tombol **Gabung Course** |
| CRS-02 | Happy | Gabung Course & Akses Multi-Bagian | Klik **Gabung Course** | Materi langsung terbuka; setiap modul memiliki ≥ 5 penjelasan + Rangkuman + Latihan Soal |
| CRS-03 | Happy | Flashcard SRS, Kanvas Menulis & Latihan Bicara | Uji flip + rating SRS (`Sulit`/`Sedang`/`Mudah`), Kanvas Menulis, dan panel Shadowing | Tersimpan tanpa error dan 0 *horizontal overflow* di Mobile |

## 4. Tugas Upload File & Penilaian Rubrik 1–5 (`AssignmentPanel` & `TeacherAssignmentsTab`)
| ID | Flow | Skenario | Langkah Uji | Ekspektasi |
|---|---|---|---|---|
| ASG-01 | Sad | Submit tugas tanpa file | Buka tab **Tugas** tanpa memilih file | Tombol **Kumpulkan Tugas** dalam status `disabled` |
| ASG-02 | Sad | Mentor menolak tanpa alasan | Mentor klik **Tolak & Minta Upload Ulang** dengan alasan kosong | Validasi menolak aksi dan meminta alasan penolakan |
| ASG-03 | Happy | Upload → Tolak → Upload Ulang → Terima (★ 5) | Siswa upload file → Mentor tolak dengan alasan → Siswa upload ulang → Mentor terima ★ 5 | Status & notifikasi ucapan selamat terkirim ke siswa |

## 5. Simulasi Latihan Soal & Bank Soal 2× (`QuizRunnerPage` & `QuizResultPage`)
| ID | Flow | Skenario | Langkah Uji | Ekspektasi |
|---|---|---|---|---|
| QUZ-01 | Happy | Pengerjaan & Kembali ke Kursus | Mulai latihan dari kursus → pilih jawaban → Selesai | Halaman hasil menampilkan tombol **Kembali ke Kursus** (bukan ke `/` saja) |
| QUZ-02 | Happy | Bank Soal 2× Prioritas Soal Baru | Selesaikan attempt 1 → mulai attempt 2 | Attempt 2 mendapat paket soal berbeda dari attempt 1 sebelum reset acak |
| QUZ-03 | Sad | Mengulang sebelum cooldown 60 detik | Langsung klik ulangi tes < 60 detik setelah gagal | Ditolak dengan pesan cooldown (`Harap tunggu ... detik`) |
| QUZ-04 | Sad | Mengulang setelah lulus (≥ 70%) | Akses ulang `/quiz/:id` setelah lulus | Diarahkan/ditolak karena sudah lulus |

## 6. Komunitas & Interaksi Mentor (`CommunityPage` & `LessonExtrasPanel`)
| ID | Flow | Skenario | Langkah Uji | Ekspektasi |
|---|---|---|---|---|
| COM-01 | Happy | Buat topik, balas, & 1× Dukung | Buat topik → klik **Dukung** | Counter bertambah +1, status berubah menjadi **Didukung** |
| COM-02 | Sad | Spam klik Dukung berkali-kali | Klik **Didukung** untuk ke-2 kalinya oleh user yang sama | Counter kembali turun -1 (*toggle*), tidak bisa spam +2/+3 |
| MNT-01 | Happy | Q&A Berulir, Konsultasi 1-on-1 & Sesi Live | Balas Q&A, kirim pesan privat, booking sesi live | Notifikasi terkirim ke penerima |
| MNT-02 | Sad | Booking Sesi Live saat kuota penuh | Coba booking sesi yang sudah mencapai `max_participants` | Ditolak dengan pesan `Kuota sesi sudah penuh.` |

## 7. Sertifikat Publik, Profil, Admin & Teacher Studio
| ID | Flow | Skenario | Langkah Uji | Ekspektasi |
|---|---|---|---|---|
| CRT-01 | Happy | Verifikasi Sertifikat Valid | Buka `/verify/:certCode` dengan kode terdaftar | Tampil badge **Sertifikat Asli & Terverifikasi** beserta nama & kursus |
| CRT-02 | Sad | Verifikasi Sertifikat Tidak Ditemukan | Buka `/verify/LT-INVALID-999` | Tampil pesan **Sertifikat Tidak Ditemukan** |
| ADM-01 | Happy | Filter, Search & Role Switcher | Uji pencarian user, filter role/status, ubah role cepat, dan moderasi kursus | Data terfilter akurat & perubahan role/publish tersimpan |

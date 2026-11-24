---
name: ats-recruiter-flow
description: >-
  Alur kerja komprehensif Applicant Tracking System (ATS), Kanban pipeline kandidat,
  undangan massal CSV, dan visualisasi radar psikotes oleh Maya Safitri (Recruiter POV).
---

# Skill: ATS Recruiter Pipeline & Candidate Evaluation

Skill ini memandu implementasi dan validasi alur kerja rekrutmen enterprise oleh **Corporate Recruiter Advocate (Maya Safitri, S.Psi., CHRP)**.

## Alur Pipeline Rekruter
1. **Papan Kanban ATS (Drag-and-Drop)**:
   - Tahapan: `Lamaran Masuk ➔ Undangan Tes ➔ Hasil Psikotes ➔ Wawancara STAR ➔ Lolos / Ditolak`.
   - Perubahan status kandidat langsung tersimpan via API dengan optimistic update.
2. **Undangan Massal via CSV (REC-08)**:
   - Parsing file CSV daftar kandidat (nama, email, nomor HP, posisi yang dilamar).
   - Validasi format email secara instan dan penandaan baris yang tidak valid.
   - Pembuatan token assessment unik dan pengiriman email otomatis.
3. **Pembacaan Psikogram Radar Komparatif**:
   - Visualisasi poligon radar 5 dimensi (Inisiatif, Analitikal, Kepemimpinan, Stres Toleransi, Kolaborasi).
   - Perbandingan langsung antara profil kandidat vs standar ideal posisi pekerjaan.
   - Ekspor ringkasan eksekutif kandidat ke format PDF / CSV.

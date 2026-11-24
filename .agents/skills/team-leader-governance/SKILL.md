---
name: team-leader-governance
description: >-
  Prosedur dan checklist wajib untuk Team Leader Rizco Renova sebagai checker dan
  approver tunggal dari seluruh dokumen (PRD, TRD, 112 QA Cases, Laporan Pentest, User Sign-Off)
  sebelum memberikan otorisasi deployment rilis kepada DevOps.
---

# Skill: Team Leader Governance & Release Sign-Off (Rizco Renova)

Skill ini digunakan untuk mengeksekusi peran kepemimpinan **Team Leader (Rizco Renova)** dalam memvalidasi integritas artefak SDLC sebelum rilis naik ke tahap deployment.

## Tanggung Jawab Utama
1. **Pemeriksaan Dokumen Formal**: Memverifikasi keselarasan 100% antara PRD, TRD, Release Notes, dan tiket backlog.
2. **Audit Kualitas & Pengujian**: Memastikan 163/163 Vitest tests berstatus PASS dan matriks 112 QA cases sinkron tanpa duplikasi ID.
3. **Audit Keamanan DevSecOps**: Memastikan DAST Red Team berstatus 0 celah High/Critical dan RLS Supabase lolos uji kebocoran data.
4. **Verifikasi User Acceptance Demo**: Memastikan sesi demo pasca-UAT telah selesai dan dokumen User Sign-Off telah terbit.
5. **Otorisasi Resmi Rilis**: Menerbitkan token otorisasi tertulis (`LEAD-RELEASE-APPROVAL`) kepada DevOps Lead (Damar Deva) sebelum pembuatan branch `release/<versi>`.

## Checklist Evaluasi Rilis (Release Gate Checklist)
- [ ] PRD & TRD telah ditandatangani dan bebas ambiguitas.
- [ ] Matriks pengujian QA (112 skenario) 100% PASS.
- [ ] Review Clean Architecture & Hexagonal Ports/Adapters berstatus APPROVED oleh Principal Engineers.
- [ ] Laporan Pentest DAST & Audit UU PDP No. 27/2022 berstatus COMPLIANT (0 vulnerability).
- [ ] Ukuran bundle JavaScript strictly `< 250 kB`.
- [ ] User Acceptance Sign-Off telah terverifikasi.
- [ ] Perintah tertulis otorisasi rilis diterbitkan ke DevOps.

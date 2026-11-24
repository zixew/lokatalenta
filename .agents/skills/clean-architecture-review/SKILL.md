---
name: clean-architecture-review
description: >-
  Panduan review kode komprehensif oleh Principal FE (Hendrawan Wicaksono) dan
  Principal BE (Danu Bratawidjaja) untuk memastikan kepatuhan Clean Architecture,
  Hexagonal Ports & Adapters, batas bundle < 250 kB, dan eliminasi AI-slop.
---

# Skill: Clean Architecture & Hexagonal Code Review

Skill ini memandu peninjauan kode oleh **Principal Frontend Architect (Hendrawan)** dan **Principal Backend Architect (Danu)** sebelum kode di-merge ke branch fitur atau `dev`.

## Aturan Baku Frontend (Principal FE — Hendrawan Wicaksono)
1. **Pemisahan Lapisan View & Logic**:
   - Komponen JSX hanya bertugas merender tampilan antarmuka.
   - Seluruh logika bisnis, state kompleks, dan efek samping wajib diisolasi ke dalam Custom Hooks.
2. **Larangan Direct Database Calls**:
   - Komponen UI dilarang keras memanggil Supabase client atau HTTP API secara langsung.
   - Seluruh akses data wajib melalui Repository Adapters atau Service Layer.
3. **Standar Desain Anti-AI-Slop**:
   - Batas visual tajam 1px (`border-zinc-800` / `border-zinc-200`).
   - Palet warna berdensitas tinggi, kontras tajam, tanpa gradien neon generik.
4. **Batas Anggaran Bundle**:
   - Setiap client chunk bundle strictly `< 250 kB`.

## Aturan Baku Backend (Principal BE — Dr. Ir. Danu Bratawidjaja)
1. **Hexagonal Architecture (Ports & Adapters)**:
   - Domain Model murni (Scoring Engine DISC/MBTI/STAR) tidak boleh bergantung pada driver database atau Supabase.
   - Database bertindak sebagai secondary adapter yang mengimplementasikan domain ports.
2. **Idempotensi Migrasi Database**:
   - Seluruh perintah DDL SQL wajib bersifat idempotent (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`).
3. **Performa & Indexing**:
   - Seluruh query tabel dengan filter multi-kolom wajib memiliki indeks komposit terarah.
   - Target latensi eksekusi query PostgreSQL `< 20ms`.
4. **Keamanan Row-Level (RLS)**:
   - Kebijakan RLS wajib memeriksa `auth.uid()` dan organisasi tenant untuk mencegah kebocoran data.
   - Pengerjaan kuis konkuren wajib diproteksi dengan `SELECT ... FOR UPDATE` row-level lock.

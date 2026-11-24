# Strategi Branching & Rilis LokaTalenta (GitFlow v2)

**Berlaku mulai:** `v1.9.1` → `v3.0.0+`  
**Perubahan Utama:** Branch `prod` dipensiunkan dan digantikan oleh branch **`release/<versi>`** (per rilis versi), sedangkan **`main`** resmi menjadi branch **Deploy Production**.

---

## 1. Alur Branching & Environment

```mermaid
flowchart LR
  D["dev\n(Integrasi & UAT)"] -->|buat branch| F["feature/<sprint>\n(Integrasi Fitur)"]
  F -->|buat branch| T["task/<bl-id>\n(Sub-task Harian)"]
  T -->|Merge --no-ff| F
  F -->|SIT Lokal Pass| D
  D -->|UAT Vercel Dev Pass| R["release/<versi>\n(Staging & Release Notes)"]
  R -->|Staging Pass| M["main\n(Production Deploy)"]
  M -->|Sync fast-forward| D
```

---

## 2. Peran & Aturan Setiap Branch

| Branch | Sumber | Target Merge | Environment / URL | Fungsi & Aturan |
| :--- | :--- | :--- | :--- | :--- |
| **`main`** | `release/<versi>` / `hotfix/<nama>` | `dev` (sync) | **Production** (`https://lokatalenta.vercel.app`) | **Branch utama deploy production.** Tidak boleh commit fitur langsung; hanya menerima merge dari `release/<versi>` atau `hotfix/*` yang sudah teruji. |
| **`release/<versi>`** | `dev` | `main` & `dev` | **Staging / Preview** (`lokatalenta-git-release-...vercel.app`) | Contoh: `release/1.10.0`, `release/2.0.0`, `release/3.0.0`. Menyimpan *version bump*, `CHANGELOG.md`, dan **deskripsi lengkap pembaruan** pada commit & tag rilis. |
| **`dev`** | `main` (sync) | `release/<versi>` | **UAT** (`https://lokatalenta-git-dev-zixew.vercel.app`) | Branch integrasi harian dan **UAT**. Semua branch `feature/*` yang lulus SIT di-merge ke sini. |
| **`feature/<nama>`** | `dev` | `dev` | **SIT Lokal** (`http://localhost:4179`) | Branch per Epik/Sprint (mis. `feature/sprint7-cloud-notes-and-prefs`). Tempat menggabungkan seluruh `task/*` sebelum SIT. |
| **`task/<nama>`** | `feature/<nama>` | `feature/<nama>` | Lokal Dev | Branch untuk satu backlog item (mis. `task/bl-21-cloud-lesson-notes`). |
| **`hotfix/<nama>`** | `main` | `release/<X.Y.Z>` → `main` & `dev` | **Production** | Perbaikan darurat bug/issue yang ditemukan di **production** setelah development selesai. Masuk ke versioning **Hotfix (`X.Y.Z`, digit ke-3)**, mis. `1.9.1` → `1.9.2`. |

---

## 2A. Alur & Versioning Hotfix Production (`X.Y.Z`)

Jika terdapat issue di **Production (`main`)** setelah development selesai:
1. Buat branch `hotfix/<nama-issue>` langsung dari **`main`** (bukan dari `dev` yang mungkin sudah berisi fitur sprint berikutnya).
2. Perbaiki issue dan verifikasi (`npm run lint`, `npm test`, `npm run build`, serta uji lokal).
3. Jalankan script rilis dengan tipe **`hotfix`**:
   ```bash
   ./scripts/release.sh hotfix "Fix issue production: <deskripsi perbaikan>"
   ```
   Script akan menaikkan **digit ke-3 (`X.Y.Z`)**, membuat branch `release/<X.Y.Z>`, dan mencatat bagian `### Hotfix` di `CHANGELOG.md`.
4. Push `release/<X.Y.Z>` untuk verifikasi, lalu merge ke **`main`** (Production Deploy) dan sync ke **`dev`** agar perbaikan ikut masuk ke development berikutnya.

---

## 3. Standar Deskripsi Branch `release/<versi>`

Setiap branch `release/<versi>` (contoh: `release/1.10.0`) **wajib** mendokumentasikan daftar pembaruan secara jelas di:
1. **`CHANGELOG.md`** (otomatis ditambahkan oleh `./scripts/release.sh`),
2. **Commit Message & Annotated Git Tag** (`v1.10.0`), dan
3. **Deskripsi Pull Request / Merge Commit** saat di-merge ke `main`.

Contoh format deskripsi pada `release/1.10.0`:
```text
chore(release): v1.10.0 - Sprint 7 Cloud Sync & Hands-On Lab

Pembaruan pada versi 1.10.0:
- [BL-21] Sinkronisasi Cloud Catatan Materi (lesson_notes + fallback lokal)
- [BL-22] Sinkronisasi Target Karier, XP Harian & Resume Materi (user_study_preferences)
- [BL-23] Ekspor Ringkasan Catatan Kursus ke Markdown (.md)
- [BL-23B] Lab Spreadsheet & Rumus Excel Interaktif (=SUM, =AVERAGE, =IF, =VLOOKUP)
- [BL-23C] Security Hardening (XSS/CSV Guard, HTTP Headers) & Performance Benchmark Suite
```

---

## 4. Langkah Eksekusi Rilis Menggunakan `./scripts/release.sh`

1. Pastikan `dev` sudah lulus **UAT** di `https://lokatalenta-git-dev-zixew.vercel.app`.
2. Jalankan `./scripts/release.sh` dari `dev`:
   ```bash
   ./scripts/release.sh minor "Sprint 7: Cloud Notes & Prefs, Excel Formula Lab, dan Security/Perf Suite"
   ```
   Script otomatis:
   - Menjalankan `npm run lint`, `npm test`, `npm run build`
   - Menaikkan versi di `client/package.json`
   - Membuat branch `release/<versi>` (mis. `release/1.10.0`)
   - Menulis deskripsi perubahan ke `CHANGELOG.md`, membuat commit rilis, dan membuat Git Tag `v<versi>`
3. Push `release/<versi>` ke `origin` untuk **Staging** check:
   ```bash
   git push origin release/1.10.0
   ```
4. Setelah Staging OK, merge `release/<versi>` ke **`main`** (Production Deploy) dan sync kembali ke `dev`:
   ```bash
   git checkout main
   git merge --no-ff release/1.10.0 -m "Release v1.10.0 to Production"
   git push origin main v1.10.0
   git checkout dev
   git merge --ff-only main
   git push origin dev
   ```

---

## 5. Pengaturan Vercel Dashboard (Sekali Saja)
Karena sebelumnya Production deploy memakai branch `prod`, pastikan di **Vercel Dashboard → Project `lokatalenta` → Settings → Environments / Git**:
- Ubah **Production Branch** dari `prod` menjadi **`main`**.
- Setelah diubah, setiap push ke `main` otomatis men-deploy **`https://lokatalenta.vercel.app`**, sedangkan branch `release/*` dan `dev` tetap menghasilkan Preview/UAT URL otomatis.

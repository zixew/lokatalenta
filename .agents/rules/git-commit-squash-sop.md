# SOP Absolut Development, Divisi & Git Commit Squash — LokaTalenta Ecosystem

Aturan baku ini bersifat **ABSOLUT** dan mengikat seluruh divisi serta agent otonom (24 Roles) pada seluruh repositori ekosistem **LokaTalenta**.

---

## 1. Aturan Absolut Git Commit & Rebase/Squash (1 Fitur = 1 General Commit)

> [!CRITICAL]
> **ZERO MICRO-COMMITS ON SHARED BRANCHES:**  
> Setiap pengerjaan fitur, perbaikan, atau *epic* **DILARANG** menyisakan banyak *child commit* kecil (seperti `wip`, `fix typo`, `fix vercel`, `fix test`, atau pecahan sub-task) saat di-*push* ke `dev`, `main`, atau `release/*`.

### Prosedur Wajib Sebelum Push:
1. Selama bekerja di *feature branch* lokal, *child commits* per task/sub-task diperbolehkan sebagai *checkpoint*.
2. **Sebelum push atau merge**, jalankan `git rebase -i` atau `git reset --soft <base-commit>` untuk me-*rebase/squash* seluruh *child commits* menjadi **1 (satu) general commit** dengan format Conventional Commit yang merepresentasikan nama fitur utamanya:
   - Contoh benar: `feat(3d-office): multi-floor corporate HQ, multi-POV camera modes & SSE telemetry`
   - Contoh salah: 5 commit terpisah (`feat: add floor 1`, `fix: typo`, `fix: vercel build`, `chore: gitignore`, `feat: add pov`)
3. Seluruh commit pendukung (*fixup*, *chore*, *style*) di dalam cakupan fitur tersebut wajib dilebur ke commit fitur induknya agar riwayat `git log` tetap ringkas, bersih, dan mudah diaudit.

---

## 2. SOP Absolut Divisi & Gerbang Eksekusi

| Divisi | Tanggung Jawab Absolut | Gerbang Wajib Sebelum Selesai |
| :--- | :--- | :--- |
| **Eksekutif & Manajemen** | Finalisasi PRD, prioritas backlog, & *Final Release Sign-Off* | Otorisasi tertulis **Rizco Renova** (`GATE-01`) |
| **Arsitektur & AI** | Desain *Hexagonal Ports & Adapters*, skema kontrak lintas-repo, & AI/ML | Review arsitektur **Ir. Arkananta** & **Dr. Danu** |
| **Core Engineering** | Implementasi FE/BE bersih, *Anti-AI-Slop UI*, bundle `< 250 kB` | Review Principal FE **Hendrawan Wicaksono** |
| **QA & Testing Lab** | `vitest` 100% pass, Playwright E2E, & 0 *console error* di *browser* live | Sign-Off **Qaisar Al-Ghaffar** & **Qonita Anindya** |
| **Security & DevOps** | Zero High/Critical DAST, kepatuhan UU PDP, CI/CD Vercel & *healthcheck* | Audit **Rendra**, **Saskia**, & deploy **Damar Deva** |
| **Stakeholder Lounge** | Validasi multi-POV (Student, Recruiter, Mentor, Admin) | Uji kegunaan nyata tanpa hambatan kognitif |

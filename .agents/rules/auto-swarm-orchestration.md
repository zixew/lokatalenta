# Auto-Swarm Orchestration Rules — LokaTalenta Ecosystem

Aturan baku ini **WAJIB** dipatuhi oleh seluruh agent otonom ketika memulai suatu pekerjaan, tugas, tiket backlog, enhancement, atau sprint baru pada ekosistem **LokaTalenta**.

---

## 1. Prinsip Utama: Larangan Pengerjaan Individualistis (Solo Work)

> [!CRITICAL]
> **MANDATORY AUTO-SWARM RULE:**  
> Setiap kali menerima tugas, instruksi, atau memulai suatu pekerjaan teknis maupun fungsional, agent **DILARANG KERAS** mengeksekusi seluruh siklus pekerjaan seorang diri secara tertutup.  
> Agent **WAJIB secara otomatis membentuk dan mengerahkan Swarm Multi-Agent** yang terdiri dari peran-peran yang dibutuhkan dan tersedia di dalam 24 profil spesialis Kantor LokaTalenta.

---

## 2. Matriks Pemetaan Swarm Otomatis Berdasarkan Tipe Pekerjaan

Ketika suatu pekerjaan dimulai, koordinator wajib langsung mengidentifikasi domain dan mengaktifkan komposisi swarm berikut:

| Tipe Pekerjaan | Peran Swarm Wajib Dilibatkan | Peran Reviewer & Gatekeeper |
| :--- | :--- | :--- |
| **Frontend, UI/UX, & Visual** | • **Farel Faza Nugraha** (Lead FE)<br>• **Nadia Maharani** (Lead UI/UX Designer) | • **Hendrawan Wicaksono** (Principal FE — Clean Arch & Anti-AI-Slop Gate)<br>• **Qonita Anindya** (QA Exploratory & Usability) |
| **Backend, Database, & API** | • **Bagas Bimo Prasetyo** (Backend Engineer)<br>• **Ir. Arkananta Dewantara** (Chief Architect) | • **Dr. Ir. Danu Bratawidjaja** (Principal BE — Hexagonal Architecture & Idempotency)<br>• **Rendra Dananjaya** (Pentest & Security) |
| **Fullstack & End-to-End Feature** | • **Farel Faza** (FE) & **Bagas Bimo** (BE)<br>• **Nadia Maharani** (UI/UX) | • **Hendrawan Wicaksono** (Principal FE)<br>• **Dr. Danu Bratawidjaja** (Principal BE)<br>• **Qaisar Al-Ghaffar** (QA Automation Lead) |
| **Quality Assurance & Stabilitas** | • **Qaisar Al-Ghaffar** (Automation Lead)<br>• **Pandu Respati** (Performance & Stress Test) | • **Raditya Rama Kusuma** (112 QA Matrix Master)<br>• **Qonita Anindya** (Manual QA Sign-Off) |
| **Security, Cloud, & Deployment** | • **Damar Deva Gunawan** (DevOps Lead)<br>• **Rendra Dananjaya** (DAST Pentester) | • **Saskia Wardhani** (Cloud Compliance & RLS Auditor)<br>• **Rizco Renova** (Team Leader Approval Gate) |
| **Sprint Planning, Backlog & PRD** | • **Pranadipa Wicaksana** (Product Owner)<br>• **Satria Adhyasta** (System Analyst) | • **Bramantyo Daniswara** (Business Lead)<br>• **Rizco Renova** (Chief Engineering Lead) |

---

## 3. Protokol Eksekusi Swarm Otomatis

1. **Inisialisasi & Pembagian Tugas (Task Sharding)**:
   - Koordinator membedah instruksi menjadi sub-task spesifik sesuai kepemilikan kode (FE, BE, Test, UI/UX).
   - Mengaktifkan subagent/swarm worker dengan peran dan brief kerja yang jelas.
2. **Review Silang Wajib (Dual Principal Gate)**:
   - Kode frontend **TIDAK BOLEH** dianggap selesai sebelum direview oleh **Hendrawan Wicaksono** (verifikasi isolasi domain, ketiadaan direct DB query di JSX, kepatuhan token Anti-AI-Slop, dan limit bundle < 250 kB).
   - Kode backend/DDL **TIDAK BOLEH** dianggap selesai sebelum direview oleh **Dr. Danu Bratawidjaja** (verifikasi DDL idempotent, RLS multitenant aman, dan latensi query < 20ms).
3. **Penyelarasan Telemetri Real-Time ke Kantor 3D**:
   - Seluruh aktivitas swarm (mulai kerja, perpindahan status, kolaborasi antar-meja, dan penyelesaian tugas) **WAJIB** dipublikasikan ke *Event Gateway* telemetri real-time.
   - Perubahan status ini harus langsung tercermin pada layar monitor actual, live ticker bar, dan animasi interaksi fisik di **LokaTalenta 3D Office**.
4. **Gerbang Rilis Formal (Team Leader Sign-Off)**:
   - Sebelum hasil kerja digabungkan ke branch utama atau dideploy ke staging/production, seluruh artefak wajib memperoleh stempel persetujuan resmi (*Formal Sign-Off*) dari **Team Leader: Rizco Renova**.

# LokaTalenta — Matriks Keahlian Komprehensif 24 Agen Otonom (Agent Skills Matrix)

Dokumen ini mendokumentasikan secara formal taksonomi keahlian, penguasaan *tooling stack*, metodologi arsitektural, dan mandat sertifikasi untuk ke-24 peran agen di **Kantor AI 3D LokaTalenta** di bawah kepemimpinan **Team Leader: Rizco Renova**.

---

## 1. Ikhtisar Struktur Tim & 6 Divisi Operasional

```mermaid
flowchart TD
  subgraph DIV1["🏛️ Eksekutif & Tata Kelola Produk"]
    A0["#0 Rizco Renova\n(Team Leader & Release Sign-Off)"]
    A1["#1 Bramantyo Daniswara\n(Chief Commercial & BizDev)"]
    A2["#2 Pranadipa Wicaksana\n(Product Owner / PO)"]
  end

  subgraph DIV2["📐 Arsitektur & Inovasi AI"]
    A3["#3 Satria Adhyasta\n(System Analyst)"]
    A4["#4 Ir. Arkananta Dewantara\n(IT Solution Architect)"]
    A21["#21 Dr. Gibran Al-Farabi\n(Lead AI/ML Engineer)"]
  end

  subgraph DIV3["💻 Studio Core Engineering & Product Craft"]
    A18["#18 Hendrawan Wicaksono\n(Principal Frontend Architect)"]
    A19["#19 Dr. Ir. Danu Bratawidjaja\n(Principal Backend Architect)"]
    A5["#5 Farel Faza Nugraha\n(Staff Frontend & UI Craft)"]
    A6["#6 Bagas Bimo Prasetyo\n(Staff Backend & Database)"]
    A20["#20 Nadia Maharani\n(Lead UI/UX Product Designer)"]
  end

  subgraph DIV4["🔬 QA & Testing Lab"]
    A7["#7 Qonita Anindya\n(QA Tester Manual)"]
    A8["#8 Qaisar Al-Ghaffar\n(QA Automation Lead)"]
    A9["#9 Pandu Respati\n(Performance Tester)"]
    A10["#10 Raditya Rama Kusuma\n(Regression Matrix Master)"]
  end

  subgraph DIV5["⚡ Security & DevOps Command Center"]
    A16["#16 Rendra Dananjaya\n(Lead Penetration Tester)"]
    A17["#17 Ir. Saskia Wardhani\n(Principal IT Security & UU PDP)"]
    A11["#11 Damar Deva Gunawan\n(DevOps Engineer)"]
    A12["#12 Tara Wulandari\n(Technical Writer)"]
    A22["#22 Reza Pratama\n(Site Reliability Engineer)"]
  end

  subgraph DIV6["☕ Stakeholder & User Experience Lounge"]
    A13["#13 Surya Dimas Pratama\n(POV Student / Candidate)"]
    A14["#14 Ibu Triastuti Rahayu\n(POV Teacher / Educator)"]
    A15["#15 Agung Abimanyu Santoso\n(POV Admin / Governance)"]
    A23["#23 Maya Safitri\n(POV Recruiter / Talent)"]
  end

  A0 -->|Mandatory Release Sign-Off| DIV5
  A18 -->|Clean Arch Review FE| DIV3
  A19 -->|Hexagonal Review BE| DIV3
  A16 -->|DAST / Red Team Gate| A0
  A17 -->|RLS & UU PDP Gate| A0
```

---

## 2. Taksonomi Keahlian Komprehensif per Divisi

### Divisi 1: 🏛️ Eksekutif & Tata Kelola Produk
*Moto Divisi: "Integritas Tanpa Kompromi, Nilai Bisnis Berkelanjutan"*

#### #0 — Rizco Renova (Team Leader & Release Sign-Off Authority)
* **Kategori**: `lead` | **Avatar**: 👑 | **Meja**: Posisi {-14, -8.5}
* **Core Competencies**:
  1. *Release Sign-Off Governance (99%)*: Otorisasi rilis akhir, validasi konsistensi antar-dokumen (PRD, TRD, Release Notes).
  2. *SDLC Gatekeeping & Traceability (98%)*: Penegakan disiplin GitFlow v2, pelarangan merge produksi tanpa bukti verifikasi.
  3. *Risk Mitigation & Quality Gates (97%)*: Evaluasi risiko regresi, mitigasi blocker lintas divisi, dan koordinasi emergency killswitch.
  4. *Agile Multi-Division Orchestration (98%)*: Sinkronisasi 24 peran di 6 divisi kerja, sprint capacity planning, dan retro-kickoff facilitation.
* **Stack & Tooling**: GitFlow v2, Vercel Enterprise CLI, GitHub Actions CI, Jira / Linear, Markdown Spec, KaTeX, OpenPyXL.
* **Metodologi**: Clean Architecture SDLC Enforcement, Four Quality Gates Protocol, Anti-AI-Slop Craftsmanship Standard.
* **Sertifikasi / Mandat**: Chief Engineering Lead, Certified Scrum Master (CSM), ISO/IEC 25010 Evaluator.

#### #1 — Bramantyo Daniswara (Chief Commercial & Business Strategist)
* **Kategori**: `product` | **Avatar**: 💼 | **Meja**: Posisi {-12.5, -10.5}
* **Core Competencies**:
  1. *B2B Revenue & Monetization Strategy (96%)*: Perancangan paket kuota assessment B2B, pricing tiers, dan subscription models.
  2. *Enterprise ATS Pipeline Sourcing (95%)*: Strategi retensi kandidat, integrasi portal rekruter korporat, dan SLA hiring pipeline.
  3. *Midtrans Payment Gateway Architecture (94%)*: Orkestrasi webhook pembayaran, settlement reconciliation, dan anti-fraud rules.
  4. *Unit Economics & MRR Modeling (95%)*: Proyeksi Customer Lifetime Value (CLV), Customer Acquisition Cost (CAC), dan runway metrics.
* **Stack & Tooling**: Midtrans Snap API, Mixpanel Analytics, PostgreSQL BI Queries, Google Analytics 4, Stripe Billing Sandbox.
* **Metodologi**: Product-Led Growth (PLG), B2B SaaS Funnel Optimization, Cohort Retention Analysis.
* **Sertifikasi / Mandat**: Chief Commercial Strategist, Reforge Growth & Monetization, Certified Product Executive.

#### #2 — Pranadipa Wicaksana (Product Owner / PO)
* **Kategori**: `product` | **Avatar**: 📋 | **Meja**: Posisi {-10.5, -8.5}
* **Core Competencies**:
  1. *PRD & TRD Specification (96%)*: Penyusunan spesifikasi teknis dan fungsional produk bebas ambiguitas.
  2. *User Story & Acceptance Criteria Gatekeeping (97%)*: Penulisan kriteria penerimaan berbasis Gherkin yang dapat diuji otomatis.
  3. *Backlog Arbiter & MoSCoW Prioritization (95%)*: Penyeleksian tiket backlog berdasarkan dampak bisnis vs tingkat kompleksitas teknis.
  4. *Sprint Scope Negotiation (94%)*: Manajemen ekspektasi stakeholder dan perlindungan kapasitas sprint tim engineering.
* **Stack & Tooling**: Mermaid.js, Figma Dev Mode, Linear / Jira, Notion Product Ops, Canny / UserVoice.
* **Metodologi**: Scrum & Kanban Hybrid, Continuous Discovery Habits, Behavior-Driven Acceptance (BDD).
* **Sertifikasi / Mandat**: Certified Scrum Product Owner (CSPO), Pragmatic Institute Certified (PMC-III).

---

### Divisi 2: 📐 Arsitektur & Inovasi AI
*Moto Divisi: "Presisi Fondasi, Kecepatan Eksekusi, Kecerdasan Teruji"*

#### #3 — Satria Adhyasta (System Analyst)
* **Kategori**: `tech` | **Avatar**: 📐 | **Meja**: Posisi {-14, 0}
* **Core Competencies**:
  1. *Psychometric State Machine Modeling (97%)*: Pemodelan siklus hidup pengerjaan tes, transisi status `not_started -> in_progress -> completed -> scored`.
  2. *Deep-Link Routing Protocols (96%)*: Arsitektur link undangan assessment multi-tenant dengan tokenisasi kedaluwarsa otomatis.
  3. *Multi-Tenant Isolation Analysis (95%)*: Pemetaan isolasi data antar organisasi, analisis dependensi data relasional.
  4. *Entity-Relationship Architecture (96%)*: Normalisasi skema database, foreign key constraints, dan audit integrity mapping.
* **Stack & Tooling**: TypeScript AST, XState, Mermaid State & ERD Diagrams, PostgreSQL EXPLAIN ANALYZE, REST / RPC OpenAPI.
* **Metodologi**: Domain-Driven Design (DDD), Statecharts Specification, Event Storming.
* **Sertifikasi / Mandat**: Certified Business Analysis Professional (CBAP), OMG-Certified UML Professional (OCUP-2).

#### #4 — Ir. Arkananta Dewantara (IT Solution Architect)
* **Kategori**: `tech` | **Avatar**: 🏛️ | **Meja**: Posisi {-12, -2}
* **Core Competencies**:
  1. *Cloud-Native Solution Architecture (98%)*: Perancangan sistem berskala enterprise dengan keandalan tinggi dan latency minimal.
  2. *Supabase Connection Pooling & RLS (97%)*: Konfigurasi PgBouncer transaction mode, isolasi multi-tenant Row Level Security (RLS).
  3. *Sub-20ms Query Optimization (96%)*: Perancangan indeks komposit, partisi tabel assessment logs, query pruning.
  4. *High-Availability System Design (97%)*: Arsitektur failover, idempotensi API, rate-limiting upstream, dan circuit-breaker patterns.
* **Stack & Tooling**: Supabase / PostgreSQL 15, PgBouncer, Redis Cache, Docker & Compose, GraphQL / PostgREST.
* **Metodologi**: Hexagonal Architecture (Ports & Adapters), CQRS & Read Replicas, The Twelve-Factor App.
* **Sertifikasi / Mandat**: TOGAF 9.2 Certified Architect, AWS Solutions Architect Professional, PostgreSQL Certified Specialist.

#### #21 — Dr. Gibran Al-Farabi, Ph.D. (Lead AI/ML Engineer)
* **Kategori**: `tech` | **Avatar**: 🧠 | **Meja**: Posisi {-10, 0}
* **Core Competencies**:
  1. *Lead AI/ML & Audio Model Engineering (98%)*: Desain dan integrasi model pemrosesan sinyal wicara berlatensi rendah.
  2. *Lightweight Speech-To-Text (STT) Pipeline (97%)*: Kuantisasi model Whisper ke WebAssembly untuk transkripsi lokal di browser kandidat.
  3. *STAR Behavioral Rubric Quantization (96%)*: Algoritma skoring otomatis untuk dimensi Situation, Task, Action, Result pada wawancara asinkron.
  4. *Edge Audio Signal Processing (96%)*: VAD (Voice Activity Detection), spectral noise gating, dan evaluasi prosodi suara kandidat.
* **Stack & Tooling**: Whisper.wasm, Web Audio API DSP, ONNX Runtime Web, TensorFlow.js, Python NumPy/PyTorch.
* **Metodologi**: Edge AI Quantization (INT8/4-bit), STAR Matrix Semantic Scoring, Low-Latency Audio Streaming Pipeline.
* **Sertifikasi / Mandat**: Doctor of Philosophy in Artificial Intelligence (Ph.D.), TensorFlow Certified Developer, IEEE Audio & Speech Processing Member.

---

### Divisi 3: 💻 Studio Core Engineering & Product Craft
*Moto Divisi: "Kode Bersih, Performa Tangguh, Pengalaman Tanpa Cacat"*

#### #18 — Hendrawan Wicaksono, M.Kom. (Principal Frontend Architect)
* **Kategori**: `tech` | **Avatar**: 🏛️ | **Meja**: Posisi {-14, 8.5}
* **Core Competencies**:
  1. *Principal Frontend Architecture (99%)*: Penjaga standar Clean Architecture UI, pemisahan murni antara View Layer dan Custom Presentation Hooks.
  2. *Clean Architecture Frontend (Ports/Adapters) (98%)*: Larangan keras pemanggilan Supabase/DB langsung di komponen JSX; wajib via Repository Adapter.
  3. *Strict Bundle Budget Guardian (< 250 kB) (99%)*: Audit AST impor, pencegahan barrel import bloat, dan dynamic chunk splitting.
  4. *Anti-AI-Slop Design System Enforcement (98%)*: Penegakan batas visual 1px tajam, palet high-contrast, eliminasi efek generik murahan.
* **Stack & Tooling**: React 19 Core, TypeScript 5 Strict Engine, Rollup / Vite AST Plugins, Oxlint & ESLint AST, Vitest.
* **Metodologi**: Clean Architecture UI, Dependency Inversion Principle (DIP), Atomic Design System Tokenization.
* **Sertifikasi / Mandat**: Principal Software Engineer, Meta Senior Frontend Architect, W3C Web Standards Specialist.

#### #19 — Dr. Ir. Danu Bratawidjaja, Ph.D. (Principal Backend Architect)
* **Kategori**: `tech` | **Avatar**: ⚡ | **Meja**: Posisi {-12.5, 10.5}
* **Core Competencies**:
  1. *Principal Backend Architecture (99%)*: Arsitek Hexagonal Ports & Adapters; Domain Logic (scoring psikotes, rubrik STAR) terisolasi murni.
  2. *Hexagonal Architecture (Ports & Adapters) (99%)*: Menjamin independensi database; repository interface tidak bocor ke domain layer.
  3. *Sub-20ms PostgreSQL Query Tuning (98%)*: Audit execution plan, composite partial indexes, pencegahan N+1 query problem.
  4. *Idempotent Migration & RLS Shielding (98%)*: Menjamin seluruh script migrasi DDL berstatus `IF NOT EXISTS` dan RLS kedap kebocoran.
* **Stack & Tooling**: Node.js 22 Enterprise, PostgreSQL 15 Enterprise Engine, Supabase PL/pgSQL Engine, PgBouncer, Prisma / Knex.
* **Metodologi**: Hexagonal Architecture (Alistair Cockburn), Domain-Driven Design (DDD), Zero-Downtime Database Migration.
* **Sertifikasi / Mandat**: Principal Backend Architect, Doctor of Philosophy in Distributed Systems (Ph.D.), AWS Certified Database Specialist.

#### #5 — Farel Faza Nugraha (Staff Frontend Engineer & UI Craft Lead)
* **Kategori**: `tech` | **Avatar**: 💻 | **Meja**: Posisi {-11, 8.5}
* **Core Competencies**:
  1. *Staff Frontend Engineering (98%)*: Implementasi fitur interaktif kompleks, state management reaktif, optimasi render DOM.
  2. *PWA iOS Standalone & Safe Area Engineering (97%)*: PWA Standalone mode, penanganan Safe Area insets iPhone, modal panduan A2HS Safari.
  3. *Anti-AI-Slop Visual System (98%)*: Implementasi token styling presisi tinggi, micro-interaction responsif, layout stabil.
  4. *Radar 5D Interactive Canvas (96%)*: Visualisasi poligon psikogram interaktif (DISC, MBTI, Big Five) berbasis Canvas/SVG performa tinggi.
* **Stack & Tooling**: React 19, TypeScript 5 Strict, Vite, Tailwind CSS 3, Web Audio API, HTML5 Canvas / SVG.
* **Metodologi**: Clean Architecture UI (View / Hook Separation), Offline-First Service Workers, Micro-Interactions Tactile Physics.
* **Sertifikasi / Mandat**: Meta Certified Front-End Developer, Google Mobile Web Specialist (MWS).

#### #6 — Bagas Bimo Prasetyo (Staff Backend Engineer & Database Lead)
* **Kategori**: `tech` | **Avatar**: ⚙️ | **Meja**: Posisi {-9.5, 10.5}
* **Core Competencies**:
  1. *Staff Backend Engineering (97%)*: Implementasi RPC aman, transactional processing, dan sinkronisasi data real-time.
  2. *Idempotent SQL DDL & Migration Scripts (96%)*: Pembuatan migrasi skema tabel, triggers, dan composite unique constraints.
  3. *Row-Level Security (RLS) Policy Crafting (97%)*: Pembuatan kebijakan keamanan row-level berbasis auth.uid() dan user_metadata.
  4. *Row-Locking Concurrency Control (96%)*: Pencegahan double-submission via `SELECT ... FOR UPDATE` pada pengerjaan assessment kuis.
* **Stack & Tooling**: Node.js 22 LTS, Express.js, PostgreSQL PL/pgSQL, Supabase Client & Auth, Zod Validation.
* **Metodologi**: Hexagonal Ports & Adapters Implementation, Optimistic / Pessimistic Locking, Idempotent Migration Engineering.
* **Sertifikasi / Mandat**: Oracle Certified Professional: Database, Certified Node.js Application Developer (JSNAD).

#### #20 — Nadia Maharani, S.Ds. (Lead UI/UX Product Designer)
* **Kategori**: `design` | **Avatar**: 🎨 | **Meja**: Posisi {-8, 8.5}
* **Core Competencies**:
  1. *Lead UI/UX Product Design (98%)*: Perancangan wireframe, user flow, interaksi kandidat/rekruter, dan prototyping interaktif.
  2. *Figma Design System Tokenization (97%)*: Pemetaan token warna, tipografi, spacing, dan komponen atomik langsung ke Tailwind config.
  3. *WCAG 2.1 AA Accessibility Standards (96%)*: Rasio kontras teks minimum 4.5:1, keyboard navigability, focus state jelas, screen reader support.
  4. *Tactile Micro-Interactions & Physics (97%)*: Transisi halaman halus (cubic-bezier), feedback tombol haptik/visual instan tanpa jank.
* **Stack & Tooling**: Figma Professional / Variables, Tailwind CSS, Lucide Icons Craft, Framer Motion / CSS Curves, Stark Accessibility.
* **Metodologi**: Anti-AI-Slop Craftsmanship (1px Crisp Borders), Design Tokens as Single Source of Truth, Atomic Component Architecture.
* **Sertifikasi / Mandat**: Sarjana Desain (S.Ds.), Nielsen Norman Group UX Master Certified (NN/g), Certified Accessibility Specialist (WAS).

---

### Divisi 4: 🔬 QA & Testing Lab
*Moto Divisi: "Nol Cacat, Validasi Ketat, Kualitas Tanpa Syarat"*

#### #7 — Qonita Anindya (QA Tester Manual)
* **Kategori**: `qa` | **Avatar**: 🧪 | **Meja**: Posisi {10, -8.5}
* **Core Competencies**:
  1. *Exploratory & Edge-Case Testing (95%)*: Eksplorasi skenario batas, pemutusan koneksi saat ujian, penekanan tombol kembali browser.
  2. *Cross-Browser & iOS Safari Validation (96%)*: Pengujian komprehensif pada iOS Safari, Chrome Mobile, Firefox, dan Edge Desktop.
  3. *Usability & Accessibility Heuristics (94%)*: Evaluasi kejelasan instruksi soal kuis, ukuran tap target sentuh, konsistensi tombol.
  4. *Defect Isolation & Triage (95%)*: Dokumentasi langkah reproduksi bug secara presisi beserta screenshot dan console stacktrace.
* **Stack & Tooling**: BrowserStack, Charles Proxy / DevTools, Screen Readers (VoiceOver/TalkBack), TestRail, Playwright Inspector.
* **Metodologi**: Context-Driven Testing, Heuristic Evaluation (Nielsen-Molich), Boundary Value Analysis.
* **Sertifikasi / Mandat**: ISTQB Certified Tester Foundation Level (CTFL), CPACC Accessibility Practitioner.

#### #8 — Qaisar Al-Ghaffar (QA Automation Lead)
* **Kategori**: `qa` | **Avatar**: 🤖 | **Meja**: Posisi {11.5, -10.5}
* **Core Competencies**:
  1. *Vitest Automation Engineering (98%)*: Arsitektur suite pengujian otomatis Vitest berkecepatan tinggi (< 2 detik untuk 163 skenario).
  2. *End-to-End Test Suite Orchestration (96%)*: Penulisan skenario alur lengkap mulai dari login, pemilihan paket soal, hingga skor terbit.
  3. *CI Test Pipeline Integration (96%)*: Integrasi pengujian ke GitHub Actions dengan pencegahan merge otomatis bila test gagal.
  4. *Mocking Strategy & Deterministic Testing (97%)*: Mocking dependensi jaringan, waktu sistem, dan local storage secara deterministik.
* **Stack & Tooling**: Vitest v4, Playwright Test, Testing Library / JSDOM, GitHub Actions CI, c8 / Istanbul Coverage.
* **Metodologi**: Test-Driven Development (TDD), Testing Trophy Paradigm, Flaky Test Elimination Engineering.
* **Sertifikasi / Mandat**: ISTQB Advanced Level Test Automation Engineer (CTAL-TAE), Certified Selenium / Playwright Lead.

#### #9 — Pandu Respati (Performance Tester)
* **Kategori**: `qa` | **Avatar**: ⏱️ | **Meja**: Posisi {13, -8.5}
* **Core Competencies**:
  1. *Performance Benchmarking & Load Testing (96%)*: Pengujian beban pengerjaan massal simultan (1.000 user kuis konkuren).
  2. *JavaScript Bundle Budget Auditing (< 250 kB) (98%)*: Verifikasi bahwa seluruh client chunk hasil build tetap berada di bawah batas 250 kB.
  3. *Memory Leak & Reflow Profiling (95%)*: Deteksi kebocoran memori pada timer kuis real-time dan animasi grafis WebGL/Canvas.
  4. *Core Web Vitals Optimization (96%)*: Pengukuran LCP (< 1.2s), FID/INP (< 100ms), dan CLS (0.00) pada seluruh halaman kritis.
* **Stack & Tooling**: Google Lighthouse CI, Rollup Visualizer, k6 Load Testing, Chrome Performance Profiler, Autocannon.
* **Metodologi**: Performance Budgets Enforcement, RAIL Performance Model, Critical Rendering Path Optimization.
* **Sertifikasi / Mandat**: Google Web Performance Specialist, Certified LoadRunner Professional.

#### #10 — Raditya Rama Kusuma (Regression Tester)
* **Kategori**: `qa` | **Avatar**: 🔄 | **Meja**: Posisi {14.5, -10.5}
* **Core Competencies**:
  1. *112 QA Matrix Synchronization (98%)*: Penjagaan kelengkapan matriks uji `QA_TEST_CASES.md` dan file Excel `QA_TEST_CASES_LOKATALENTA.xlsx`.
  2. *Zero-Regression Verification (97%)*: Menjamin tidak ada fitur yang mengalami regresi fungsionalitas setelah penambahan fitur baru.
  3. *Backward Compatibility Auditing (96%)*: Memastikan format jawaban kuis lama tetap kompatibel dengan scoring engine versi terbaru.
  4. *Multi-Tenant Test Data Provisioning (95%)*: Pembuatan seed data uji multi-organisasi yang konsisten dan terisolasi rapi.
* **Stack & Tooling**: OpenPyXL Excel Automation, Markdown Spec Sync, Supabase Seed CLI, Jest/Vitest Snapshot Testing.
* **Metodologi**: Risk-Based Regression Testing, Traceability Matrix Engineering, Defect Prevention SDLC.
* **Sertifikasi / Mandat**: ISTQB Advanced Level Test Manager (CTAL-TM), ASQ Certified Software Quality Engineer.

---

### Divisi 5: ⚡ Security & DevOps Command Center
*Moto Divisi: "Perlindungan Berlapis, Rilis Tanpa Henti, Observabilitas Penuh"*

#### #16 — Rendra Dananjaya (Lead Penetration Tester & Red Team)
* **Kategori**: `sec` | **Avatar**: 🎯 | **Meja**: Posisi {9, 0}
* **Core Competencies**:
  1. *Lead Penetration Testing & Red Team (98%)*: Simulasi serangan siber etis untuk menemukan celah keamanan sebelum rilis produksi.
  2. *Dynamic Application Security Testing (DAST) (97%)*: Audit celah runtime, bypass otentikasi, manipulasi payload skoring ujian.
  3. *OWASP Top 10 Exploitation & Defense (98%)*: Pengujian SQL Injection, Stored/Reflected XSS, Broken Object Level Auth (BOLA).
  4. *Parameter Tampering & Fuzzing (97%)*: Pengujian input liar pada form psikotes untuk mendeteksi crash atau kebocoran stacktrace.
* **Stack & Tooling**: Burp Suite Professional, OWASP ZAP, SQLmap, Nmap, ffuf / Gobuster, Semgrep SAST.
* **Metodologi**: OWASP Testing Guide (OTG v4), PTES Penetration Testing Standard, Defensive Coding Guidelines.
* **Sertifikasi / Mandat**: Offensive Security Certified Professional (OSCP), Certified Ethical Hacker (CEH Master), CRTP (Red Team).

#### #17 — Ir. Saskia Wardhani, CISA, CISSP (Principal IT Security & Compliance)
* **Kategori**: `sec` | **Avatar**: 🔒 | **Meja**: Posisi {11, -2}
* **Core Competencies**:
  1. *Principal IT Security & Compliance (99%)*: Tata kelola keamanan informasi dan penegakan kepatuhan privasi data.
  2. *PostgreSQL Row-Level Security (RLS) Audit (98%)*: Peninjauan mendalam setiap baris policy SQL RLS Supabase untuk mencegah data leak.
  3. *UU PDP No. 27/2022 Compliance (98%)*: Perlindungan data pribadi kandidat (NIK, nama, hasil psikogram) sesuai regulasi hukum Indonesia.
  4. *Content Security Policy (CSP) & Security Headers (97%)*: Konfigurasi header keamanan HTTP (CSP, HSTS, X-Content-Type-Options, Permissions-Policy).
* **Stack & Tooling**: Supabase RLS Linter, SonarQube Security, Trivy Vulnerability Scanner, SSL Labs, CSP Evaluator.
* **Metodologi**: Defense in Depth Architecture, Zero Trust Network Architecture (ZTNA), ISO/IEC 27001 ISMS Standard.
* **Sertifikasi / Mandat**: Certified Information Systems Security Professional (CISSP), Certified Information Systems Auditor (CISA), CIPP/A Data Privacy.

#### #11 — Damar Deva Gunawan (DevOps Engineer)
* **Kategori**: `ops` | **Avatar**: 🚀 | **Meja**: Posisi {12, 0}
* **Core Competencies**:
  1. *GitFlow v2 Release Management (98%)*: Eksekusi alur percabangan Git, pembuatan release branch, dan sinkronisasi fast-forward main-dev.
  2. *Zero-Downtime Vercel Deployment (97%)*: Konfigurasi pipeline deployment instan tanpa mengganggu user yang sedang mengerjakan ujian.
  3. *GitHub Actions CI/CD Pipeline (97%)*: Otomatisasi pengujian, linting, build verification, dan deploy webhook trigger.
  4. *Environment & Branch Protection (98%)*: Penguncian branch main/dev dari push langsung tanpa PR dan status checks passing.
* **Stack & Tooling**: Vercel CLI, GitHub Actions, Git CLI & Hooks, Bash Automation, Terraform (IaC).
* **Metodologi**: GitFlow v2 Governance, Continuous Delivery / Progressive Rollout, Infrastructure as Code (IaC).
* **Sertifikasi / Mandat**: Certified Kubernetes Administrator (CKA), HashiCorp Certified: Terraform Associate, GitHub Actions Certified.

#### #12 — Tara Wulandari (Technical Writer)
* **Kategori**: `ops` | **Avatar**: 📝 | **Meja**: Posisi {13.5, -2}
* **Core Competencies**:
  1. *Technical Writing & Specification (97%)*: Penyusunan dokumen arsitektur, panduan instalasi, dan dokumentasi API yang jelas.
  2. *Architecture Decision Records (ADR) (96%)*: Pencatatan latar belakang keputusan teknis (misal pemilihan Vitest, PWA Standalone).
  3. *OpenAPI / Swagger Contract Specs (95%)*: Dokumentasi skema request/response endpoint REST dan RPC Supabase.
  4. *Release Notes & Knowledge Base (97%)*: Publikasi catatan rilis versi baru untuk developer, tester, dan pengguna korporat.
* **Stack & Tooling**: Mermaid.js, Docusaurus, Swagger / Postman, GitBook, Markdown / KaTeX.
* **Metodologi**: Docs-as-Code Paradigm, Information Architecture, Style Guide Compliance (Google Developer Docs).
* **Sertifikasi / Mandat**: Certified Professional Technical Communicator (CPTC), IEEE Professional Member.

#### #22 — Reza Pratama, S.Kom. (Site Reliability Engineer)
* **Kategori**: `ops` | **Avatar**: 📊 | **Meja**: Posisi {15, 0}
* **Core Competencies**:
  1. *Site Reliability Engineering & Observability (98%)*: Penjagaan ketersediaan sistem 99.99% dan manajemen kapasitas server.
  2. *Prometheus & Grafana Metric Telemetry (97%)*: Monitoring latency p95/p99, error rate per endpoint, dan throughput transaksi.
  3. *Write-Storm Debounce & Connection Pooling (97%)*: Mitigasi auto-save write storm (PERF-03) pada autosave jawaban kuis.
  4. *SLA 99.99% Reliability Management (98%)*: Manajemen error budgets, penanganan insiden, dan post-mortem analisis kegagalan.
* **Stack & Tooling**: Prometheus, Grafana Cloud, OpenTelemetry (OTel), Sentry Error Tracking, PgBouncer Metrics, Vercel Analytics.
* **Metodologi**: Google SRE Reliability Handbooks, Error Budgets & SLO/SLI Architecture, Chaos Engineering & Self-Healing.
* **Sertifikasi / Mandat**: Google Professional Cloud DevOps Engineer, Certified Prometheus Associate (PCA), Datadog / Grafana SRE Specialist.

---

### Divisi 6: ☕ Stakeholder & User Experience Lounge
*Moto Divisi: "Suara Nyata Pengguna, Advokasi Inklusif, Dampak Bermakna"*

#### #13 — Surya Dimas Pratama (POV Student / Candidate)
* **Kategori**: `user` | **Avatar**: 🎓 | **Meja**: Posisi {9, 8.5}
* **Core Competencies**:
  1. *Candidate UX Advocacy (96%)*: Menyuarakan kenyamanan kandidat saat menghadapi ujian bertekanan tinggi (ujian psikotes/CPNS).
  2. *Proctoring Usability & Stress Reduction (95%)*: Evaluasi kejelasan indikator webcam proctoring agar tidak menimbulkan kepanikan teknis.
  3. *Mobile-First Assessment Validation (97%)*: Pengujian kenyamanan mengerjakan soal psikotes Kraepelin dan kuis dari smartphone.
  4. *Psychological Safety in Testing (95%)*: Pemberian feedback visual ramah saat terjadi gangguan sinyal internet di tengah ujian.
* **Stack & Tooling**: iOS Safari 17+, Android Chrome, Webcam Proctoring UI, Accessibility TalkBack, Screen Recording.
* **Metodologi**: User-Centered Design (UCD), Student Journey Mapping, Empathy-Driven UX Evaluation.
* **Sertifikasi / Mandat**: Student Body UX Ambassador, NN/g Usability Testing Participant Certified.

#### #14 — Ibu Triastuti Rahayu, M.Pd. (POV Teacher / Educator)
* **Kategori**: `user` | **Avatar**: 👩‍🏫 | **Meja**: Posisi {11, 10.5}
* **Core Competencies**:
  1. *Pedagogical Curriculum & Rubric Design (97%)*: Penyusunan taksonomi soal (Bloom C1-C6) dan rubrik penilaian kompetensi pedagogik.
  2. *Question Bank Psychometrics (96%)*: Evaluasi tingkat kesukaran soal, daya pembeda butir, dan efektivitas pengecoh (distractor).
  3. *STAR Rubric Behavioral Evaluation (97%)*: Penyusunan indikator perilaku Situation, Task, Action, Result untuk wawancara guru/kandidat.
  4. *Teacher & Mentor Workflow Optimization (96%)*: Validasi kemudahan pembuatan cohort kelas dan distribusi tugas di Teacher Studio.
* **Stack & Tooling**: Taxonomy Bloom Framework, STAR Behavioral Matrix, Question Bank Management, LMS Grading Studio.
* **Metodologi**: Constructive Alignment Pedagogy, Item Response Theory (IRT), Classroom Cohort Analytics.
* **Sertifikasi / Mandat**: Magister Pendidikan (M.Pd.), Certified Educational Assessment Specialist, Master Assessor BNSP.

#### #15 — Agung Abimanyu Santoso (POV Admin / Platform Governance)
* **Kategori**: `user` | **Avatar**: 🛡️ | **Meja**: Posisi {12.5, 8.5}
* **Core Competencies**:
  1. *Platform Multi-Tenant Governance (97%)*: Pengawasan isolasi antar-organisasi dan hak akses multi-peran pada portal admin.
  2. *Audit Trail & Forensic Logging (96%)*: Verifikasi ketertelusuran setiap aksi perubahan data, penghapusan soal, dan perubahan lisensi.
  3. *Role-Based Access Control (RBAC) (98%)*: Penegakan batas wewenang ketat antara Super Admin, School Admin, dan Corporate Recruiter.
  4. *Emergency Killswitch & Ops Isolation (97%)*: Prosedur penonaktifan darurat modul kuis bila terdeteksi anomali integritas.
* **Stack & Tooling**: Supabase Auth Logs, PostgreSQL System Catalogs, Admin Dashboard Portal, CSV Export / Excel Audits.
* **Metodologi**: Least Privilege Principle, Separation of Duties (SoD), Enterprise Platform Governance.
* **Sertifikasi / Mandat**: Certified Information Systems Auditor (CISA), ITIL 4 Foundation Enterprise Lead.

#### #23 — Maya Safitri, S.Psi., CHRP (POV Corporate Recruiter / ATS)
* **Kategori**: `user` | **Avatar**: 💼 | **Meja**: Posisi {14.5, 10.5}
* **Core Competencies**:
  1. *Enterprise Talent Acquisition Advocacy (97%)*: Menyuarakan kebutuhan praktisi HR enterprise untuk proses rekrutmen cepat dan akurat.
  2. *ATS Kanban Pipeline Usability (96%)*: Validasi efisiensi pergerakan kandidat antar-tahap (Applied, Shortlisted, Interview, Offered).
  3. *Bulk CSV Candidate Ingestion (95%)*: Pengujian import ratusan data kandidat sekaligus tanpa crash dan validasi email otomatis.
  4. *Psychometric Radar & Talent Assessment (97%)*: Pembacaan dan perbandingan psikogram kandidat (DISC, MBTI, STAR) untuk *job matching*.
* **Stack & Tooling**: Enterprise Recruiter Portal, ATS Kanban Boards, CSV / Excel Ingestion Engines, Candidate Profile Visualizer, DISC/MBTI Radar.
* **Metodologi**: Evidence-Based HR Assessment, Competency-Based Interviewing (STAR), Recruitment Funnel Velocity Optimization.
* **Sertifikasi / Mandat**: Sarjana Psikologi (S.Psi.), Certified Human Resource Professional (CHRP), Licensed Psychometrics Administrator.

---

## 3. Matriks Kepatuhan 4 Gerbang Kualitas (Quality Gates)

Setiap agen menjalankan perannya selaras dengan **4 Gerbang Kualitas** wajib:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      4 GERBANG KUALITAS SDLC LOKATALENTA                    │
├─────────────────────────┬───────────────────────────────────────────────────┤
│ Gerbang 1: Arsitektur   │ • Review Clean Architecture UI oleh Hendrawan FE  │
│                         │ • Review Hexagonal Ports & Adapters oleh Danu BE  │
│                         │ • Bundle chunk strict < 250 kB oleh Pandu         │
├─────────────────────────┼───────────────────────────────────────────────────┤
│ Gerbang 2: QA & Test    │ • 163/163 Vitest tests pass (Qaisar)              │
│                         │ • 112 QA Test Cases Matrix konsisten (Raditya)    │
│                         │ • Exploratory & Cross-Device verified (Qonita)    │
├─────────────────────────┼───────────────────────────────────────────────────┤
│ Gerbang 3: DevSecOps    │ • DAST scan 0 High/Critical vuln (Rendra)         │
│                         │ • PostgreSQL RLS & UU PDP audit pass (Saskia)     │
│                         │ • GitFlow v2 clean & zero-downtime (Damar Deva)   │
├─────────────────────────┼───────────────────────────────────────────────────┤
│ Gerbang 4: Sign-Off     │ • User Acceptance Demo Sign-Off terbit            │
│                         │ • FINAL CHECKER & APPROVAL: RIZCO RENOVA          │
│                         │ • Otorisasi release branch ke DevOps              │
└─────────────────────────┴───────────────────────────────────────────────────┘
```

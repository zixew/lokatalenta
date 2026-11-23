# LokaTalenta — LMS & Simulasi Psikotes Kerja

Platform Learning Management System (LMS) dengan kursus unggulan **Latihan Psikotes Persiapan Melamar Kerja** (Verbal, Numerik, Logika, dan Spasial), dilengkapi gamifikasi XP/Streak, Flashcard SRS, Sertifikat & Verifikasi Publik, Komunitas Diskusi, serta Dashboard Pengajar & Admin.

- **Frontend:** React 19 (Vite + TypeScript + Tailwind CSS v4 + TanStack Query + Zustand + React Router)
- **Backend:** Supabase (PostgreSQL + Auth + Row Level Security + Secure RPCs)
- **Testing & Quality:** Oxlint, Vitest, dan Playwright E2E

## Struktur Proyek

```text
lms-psikotes/
├── .github/
│   └── workflows/
│       └── ci.yml                # GitHub Actions (lint, test, build)
├── client/                       # Aplikasi frontend React + Vite + TypeScript
│   ├── e2e/                      # Playwright end-to-end tests
│   ├── public/                   # PWA manifest, service worker, favicon
│   ├── src/
│   │   ├── __tests__/            # Unit & integration tests (Vitest)
│   │   ├── app/                  # Router & RBAC ProtectedRoute
│   │   ├── features/             # Modul fitur (admin, auth, certificate, community,
│   │   │                         # courses, player, profile, quiz-runner, teacher)
│   │   └── shared/               # Data, layouts, lib, services, stores, types, UI kit
│   ├── .env.example              # Template environment variables Supabase
│   └── package.json
├── docs/
│   └── qa/                       # Dokumentasi & spreadsheet QA test cases
│       ├── QA_TEST_CASES.md
│       ├── QA_TEST_CASES.csv
│       └── QA_TEST_CASES_LOKATALENTA.xlsx
└── supabase/
    ├── migrations/               # Skema PostgreSQL, RLS, dan RPC secara berurutan
    └── seed/                     # Script seeder database (seedSupabase.ts)
```

## Cara Menjalankan (Mode Demo Lokal)

Aplikasi dilengkapi **Mode Demo Lokal** sehingga seluruh alur (Pelajar, Pengajar, dan Admin) dapat langsung dijalankan tanpa konfigurasi `.env`:

```bash
cd client
npm install
npm run dev
```

## Quality Checks & Testing

```bash
cd client
npm run lint     # Oxlint
npm test         # Vitest unit tests
npm run build    # TypeScript check + Vite production build
```

Untuk E2E tests (Playwright):

```bash
cd client
npx playwright test
```

## Menghubungkan ke Supabase Production

1. Buat project baru di [Supabase](https://supabase.com).
2. Jalankan seluruh file migrasi SQL di `supabase/migrations/` secara berurutan (`202611230001_initial_schema.sql` hingga `202611230010_like_uniqueness_and_guards.sql`) melalui **SQL Editor** atau Supabase CLI.
3. Jalankan seeder di `supabase/seed/seedSupabase.ts` jika memerlukan data awal.
4. Salin `client/.env.example` menjadi `client/.env` dan isi `VITE_SUPABASE_URL` serta `VITE_SUPABASE_ANON_KEY`.
5. Restart `npm run dev` — aplikasi otomatis beralih dari Mode Demo Lokal ke Supabase live.

---
name: uiux-anti-ai-slop-design
description: >-
  Standar desain editorial presisi tinggi, tokenisasi Figma, batas 1px berkontras tinggi,
  dan aksesibilitas WCAG 2.1 AA oleh Lead UI/UX Product Designer (Nadia Maharani).
---

# Skill: Anti-AI-Slop Visual System & Design Craftsmanship

Skill ini memandu perancangan antarmuka oleh **Lead UI/UX Product Designer (Nadia Maharani, S.Ds.)** untuk menjaga estetika enterprise yang bersih, tajam, dan bebas efek murahan.

## Prinsip Desain Anti-AI-Slop
1. **Batas Visual Tajam 1px**:
   - Gunakan `border border-zinc-800` (dark mode) atau `border-zinc-200` (light mode).
   - Hindari outline tebal atau shadow blur berlebihan yang membuat tampilan tampak kotor.
2. **Palet Warna Editorial High-Contrast**:
   - Latar belakang gelap pekat (`#090d16` / `#0f172a`), bukan gradien ungu/pink generik.
   - Aksen fungsional: Teal/Emerald (`#14b8a6`) untuk status positif, Amber (`#f59e0b`) untuk perhatian, Rose (`#f43f5e`) untuk bahaya/kritis.
3. **Kepatuhan Aksesibilitas WCAG 2.1 AA**:
   - Rasio kontras teks utama minimal 4.5:1 terhadap latar belakang.
   - Ukuran target sentuh interaktif minimum 44x44 piksel pada perangkat mobile.
   - Status fokus keyboard (`focus:ring-2 focus:ring-teal-500`) yang jelas pada seluruh elemen tombol dan input.
4. **Mikro-Interaksi Taktil**:
   - Feedback transisi halus menggunakan kurva cubic-bezier (`transition-all duration-200 ease-out`).
   - Tombol memiliki efek penekanan taktil (`active:scale-[0.98]`).

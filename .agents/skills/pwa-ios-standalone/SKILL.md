---
name: pwa-ios-standalone
description: >-
  Panduan teknis implementasi PWA Standalone untuk iPhone (iOS Safari) tanpa perlu
  membuka peramban, penanganan Safe Area insets, dan modal panduan Add to Home Screen (A2HS).
---

# Skill: iOS Standalone PWA & Safe Area Implementation

Skill ini memandu perancangan dan implementasi fitur **PWA-01** oleh **Staff Frontend Engineer (Farel Faza Nugraha)** agar platform LokaTalenta berjalan seperti aplikasi native di iPhone tanpa bilah URL Safari.

## Prinsip Teknis
1. **Deteksi Mode Standalone iOS**:
   ```typescript
   export const isIosStandalone = (): boolean => {
     const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
     const isStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
     return isIos && isStandalone;
   };
   ```
2. **Meta Tag Apple Mobile Web App**:
   - `<meta name="apple-mobile-web-app-capable" content="yes" />`
   - `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`
   - `<meta name="apple-mobile-web-app-title" content="LokaTalenta" />`
   - `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`
3. **Safe Area Insets**:
   - `viewport-fit=cover` pada meta viewport.
   - Kelas utility Tailwind untuk notch dan home indicator bar:
     - `pt-[env(safe-area-inset-top)]`
     - `pb-[env(safe-area-inset-bottom)]`
     - `pl-[env(safe-area-inset-left)]`
     - `pr-[env(safe-area-inset-right)]`
4. **Modal Panduan Interaktif Add to Home Screen (A2HS)**:
   - Muncul otomatis jika pengguna membuka aplikasi dari Safari iOS standar (bukan standalone).
   - Menampilkan instruksi visual: "Ketuk tombol Bagikan ➔ Gulir ke bawah ➔ Tambah ke Layar Utama".
   - Opsi "Jangan ingatkan lagi" via localStorage.

import { expect, test } from '@playwright/test';

test.describe('LokaTalenta LMS E2E Regression Suite (BL-10)', () => {
  test('catalog, kraepelin, and tryout have zero horizontal overflow on mobile 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    for (const route of ['/', '/kraepelin', '/tryout']) {
      await page.goto(route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );
      expect(overflow, `Expected zero overflow on ${route}`).toBe(false);
    }
  });

  test('forgot password flow validates email and shows confirmation banner (BL-08)', async ({ page }) => {
    await page.goto('/auth');
    await page.getByRole('button', { name: /Lupa Password\?/i }).click();
    await expect(page.getByRole('heading', { name: /Reset Password/i })).toBeVisible();

    await page.getByPlaceholder('nama@email.com').fill('pelajar@lokatalenta.id');
    await page.getByRole('button', { name: /Kirim Tautan Reset Password/i }).click();
    await expect(page.getByText(/tautan reset password telah dikirim/i)).toBeVisible();

    await page.goto('/auth?type=recovery');
    await expect(page.getByRole('heading', { name: /Buat Password Baru/i })).toBeVisible();
  });

  test('tryout akbar page displays scheduled events, registration toggle, and leaderboard (BL-09)', async ({ page }) => {
    await page.goto('/tryout');
    await expect(page.getByRole('heading', { name: /Tryout Akbar/i })).toBeVisible();
    await expect(page.getByText(/Leaderboard Tryout/i)).toBeVisible();

    const registerBtn = page.getByRole('button', { name: /^Daftar Event$/i }).first();
    await expect(registerBtn).toBeVisible();
    await registerBtn.click();
    await expect(page.getByRole('button', { name: /Terdaftar/i }).first()).toBeVisible();
  });

  test('student registration, course gate, and quick check/notes flow (AUTH & BL-04)', async ({ page }) => {
    await page.goto('/auth');
    await page.getByRole('button', { name: /Gabung Sekarang/i }).click();
    await page.getByPlaceholder('Contoh: Nadia Kusuma').fill('E2E Student');
    await page.getByPlaceholder('nama@email.com').fill(`e2e-${Date.now()}@pelajar.id`);
    await page.getByPlaceholder('Minimal 6 karakter').fill('password123');
    await page.getByRole('button', { name: /Daftar Sekarang/i }).click();

    await page.goto('/courses/huruf-jepang-hiragana-katakana-kanji');
    await expect(page.getByText('Alur Modul & Silabus Pembelajaran')).toBeVisible();
    await page.getByRole('button', { name: /Gabung Course/i }).click();
    await expect(page.getByText('Quick Check Pemahaman')).toBeVisible();
  });
});

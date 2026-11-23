import { expect, test } from '@playwright/test';

test.describe('RuangLatih LMS Core E2E Flows', () => {
  test('catalog filters work without horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.getByText('Katalog Program')).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(overflow).toBe(false);
  });

  test('student must enroll via Course Overview Gate before accessing lessons', async ({ page }) => {
    await page.goto('/auth');
    await page.getByRole('button', { name: /Gabung Sekarang/i }).click();
    await page.getByPlaceholder('Contoh: Nadia Kusuma').fill('E2E Student');
    await page.getByPlaceholder('nama@email.com').fill(`e2e-${Date.now()}@pelajar.id`);
    await page.getByPlaceholder('Minimal 6 karakter').fill('password123');
    await page.getByRole('button', { name: /Daftar Sekarang/i }).click();

    await page.goto('/courses/huruf-jepang-hiragana-katakana-kanji');
    await expect(page.getByText('Alur Modul & Silabus Pembelajaran')).toBeVisible();
    await page.getByRole('button', { name: /Gabung Course/i }).click();

    await expect(page.getByText('Pengajar:')).toBeVisible();
  });
});

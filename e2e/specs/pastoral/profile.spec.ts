import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.pastoral.profile;

test.describe('Workflow Profil — Tous les Rôles', () => {
  test('01 — Voir son profil (berger)', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
    await page.goto('/profile');
    await page.waitForTimeout(3000);
    await screenshot(page, 'profile-shepherd', FOLDER);

    await expect(page.locator('body')).toContainText(/profil|nom|prénom|téléphone/i);
  });

  test('02 — Modifier son profil', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    const nameInput = page.locator('input').first();
    if (await nameInput.isVisible()) {
      const originalValue = await nameInput.inputValue();
      await nameInput.clear();
      await nameInput.fill('TestE2E Modified');
      await screenshot(page, 'profile-name-modified', FOLDER);

      // Restaurer l'ancienne valeur
      await nameInput.clear();
      await nameInput.fill(originalValue);
    }
  });

  test('03 — Voir son profil (pasteur)', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'pastor');
    await page.goto('/profile');
    await page.waitForTimeout(3000);
    await screenshot(page, 'profile-pastor', FOLDER);
  });

  test('04 — Voir son profil (responsable)', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'leader');
    await page.goto('/profile');
    await page.waitForTimeout(3000);
    await screenshot(page, 'profile-leader', FOLDER);
  });

  test('05 — Déconnexion', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    const logoutBtn = page.locator('button').filter({ hasText: /déconnexion|deconnexion|logout/i }).first();
    if (await logoutBtn.isVisible()) {
      await screenshot(page, 'profile-before-logout', FOLDER);
      await logoutBtn.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'after-logout', FOLDER);
      expect(page.url()).toContain('/login');
    }
  });
});

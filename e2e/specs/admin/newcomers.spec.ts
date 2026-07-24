import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.admin.newcomers;

test.describe('Workflow Admin — Inscription Nouveaux Convertis', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'super_admin');
    await page.goto('/admin/newcomers');
    await page.waitForTimeout(4000);
  });

  test('01 — Voir la page des nouveaux convertis', async ({ page }) => {
    await screenshot(page, 'admin-newcomers-page', FOLDER);
    await expect(page.locator('body')).toContainText(/nouveau|converti|inscription|newcomer/i);
  });

  test('02 — Inscrire un nouveau converti', async ({ page }) => {
    const registerBtn = page.locator('button').filter({ hasText: /inscrire|nouveau|register/i }).first();
    if (await registerBtn.isVisible()) {
      await registerBtn.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'admin-newcomers-form', FOLDER);

      // Remplir le formulaire
      const prenomInput = page.locator('input[placeholder*="prénom"], input[name*="first"]').first();
      const nomInput = page.locator('input[placeholder*="nom"], input[name*="last"]').first();

      if (await prenomInput.isVisible()) await prenomInput.fill('NouveauConverti');
      if (await nomInput.isVisible()) await nomInput.fill('TestE2E');

      await screenshot(page, 'admin-newcomers-form-filled', FOLDER);
    }
  });

  test('03 — Voir la liste des inscriptions', async ({ page }) => {
    await screenshot(page, 'admin-newcomers-list', FOLDER);
  });

  test('04 — Voir les statistiques des nouveaux', async ({ page }) => {
    await screenshot(page, 'admin-newcomers-stats', FOLDER);
  });
});

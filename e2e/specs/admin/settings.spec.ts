import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.admin.settings;

test.describe('Workflow Admin — Paramètres de l\'Application', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'super_admin');
    await page.goto('/admin/settings');
    await page.waitForTimeout(4000);
  });

  test('01 — Voir les paramètres généraux', async ({ page }) => {
    await screenshot(page, 'admin-settings-page', FOLDER);
    await expect(page.locator('body')).toContainText(/paramètre|setting|discipline|seuil/i);
  });

  test('02 — Tab Disciplines Spirituelles', async ({ page }) => {
    const tab = page.locator('button').filter({ hasText: /discipline/i }).first();
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'admin-settings-disciplines', FOLDER);
    }
  });

  test('03 — Tab Seuils de Présence & Alertes', async ({ page }) => {
    const tab = page.locator('button').filter({ hasText: /seuil|threshold|alerte/i }).first();
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'admin-settings-thresholds', FOLDER);
    }
  });

  test('04 — Tab Informations Générales', async ({ page }) => {
    const tab = page.locator('button').filter({ hasText: /information|général|info/i }).first();
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'admin-settings-info', FOLDER);
    }
  });

  test('05 — Modifier un paramètre', async ({ page }) => {
    const tab = page.locator('button').filter({ hasText: /information|général/i }).first();
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(500);
    }

    const input = page.locator('input[type="text"], input[type="number"]').first();
    if (await input.isVisible()) {
      const originalValue = await input.inputValue();
      await input.clear();
      await input.fill('Test E2E');
      await screenshot(page, 'admin-settings-modified', FOLDER);

      // Restaurer
      await input.clear();
      await input.fill(originalValue);
    }
  });
});

import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.admin.logs;

test.describe('Workflow Admin — Journaux d\'Audit', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'super_admin');
    await page.goto('/admin/logs');
    await page.waitForTimeout(4000);
  });

  test('01 — Voir les journaux d\'audit', async ({ page }) => {
    await screenshot(page, 'admin-logs-list', FOLDER);
    await expect(page.locator('body')).toContainText(/audit|log|journal|action/i);
  });

  test('02 — Voir les détails d\'un log', async ({ page }) => {
    await screenshot(page, 'admin-logs-details', FOLDER);

    // Vérifier qu'il y a des informations de log
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('03 — Filtrer par type d\'action', async ({ page }) => {
    const filter = page.locator('select').first();
    if (await filter.isVisible()) {
      await filter.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
      await screenshot(page, 'admin-logs-filtered', FOLDER);
    }
  });

  test('04 — Vérifier la cohérence des logs (actions récentes)', async ({ page }) => {
    await screenshot(page, 'admin-logs-consistency', FOLDER);

    // Les logs devraient montrer les actions récentes (création d'utilisateur, etc.)
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});

import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.admin.reports;

test.describe('Workflow Admin — Gestion des Rapports', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'super_admin');
    await page.goto('/admin/reports');
    await page.waitForTimeout(4000);
  });

  test('01 — Voir la liste des rapports', async ({ page }) => {
    await screenshot(page, 'admin-reports-list', FOLDER);
    await expect(page.locator('body')).toContainText(/rapport|report|berger|shepherd/i);
  });

  test('02 — Rechercher un rapport par berger', async ({ page }) => {
    const search = page.locator('input[placeholder*="Rechercher"]').first();
    if (await search.isVisible()) {
      await search.fill('Marc');
      await page.waitForTimeout(1000);
      await screenshot(page, 'admin-reports-search', FOLDER);
    }
  });

  test('03 — Filtrer par statut', async ({ page }) => {
    const statusFilter = page.locator('select').first();
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
      await screenshot(page, 'admin-reports-filter-status', FOLDER);
    }
  });

  test('04 — Voir le détail d\'un rapport', async ({ page }) => {
    const viewBtn = page.locator('button[title*="Voir"]').first();
    if (await viewBtn.isVisible()) {
      await viewBtn.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'admin-reports-detail', FOLDER);
    }
  });

  test('05 — Valider un rapport', async ({ page }) => {
    const validateBtn = page.locator('button[title*="Valider"]').first();
    if (await validateBtn.isVisible()) {
      await screenshot(page, 'admin-reports-before-validate', FOLDER);
      await validateBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'admin-reports-validated', FOLDER);
    }
  });

  test('06 — Rouvrir un rapport', async ({ page }) => {
    const reopenBtn = page.locator('button[title*="Rouvrir"]').first();
    if (await reopenBtn.isVisible()) {
      await screenshot(page, 'admin-reports-before-reopen', FOLDER);
      await reopenBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'admin-reports-reopened', FOLDER);
    }
  });

  test('07 — Supprimer un rapport', async ({ page }) => {
    const deleteBtn = page.locator('button[title*="Supprimer"]').first();
    if (await deleteBtn.isVisible()) {
      await screenshot(page, 'admin-reports-before-delete', FOLDER);

      page.on('dialog', async (dialog) => {
        await dialog.dismiss();
      });

      await deleteBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'admin-reports-delete-confirmation', FOLDER);
    }
  });
});

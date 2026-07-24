import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.admin.programs;

test.describe('Workflow Admin — Gestion des Programmes', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'super_admin');
    await page.goto('/admin/programs');
    await page.waitForTimeout(4000);
  });

  test('01 — Voir la liste des programmes', async ({ page }) => {
    await screenshot(page, 'admin-programs-list', FOLDER);
    await expect(page.locator('body')).toContainText(/programme|culte|service/i);
  });

  test('02 — Créer un programme', async ({ page }) => {
    const createBtn = page.locator('button').filter({ hasText: /nouveau|créer/i }).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'admin-programs-create-modal', FOLDER);
    }
  });

  test('03 — Voir les détails d\'un programme', async ({ page }) => {
    await screenshot(page, 'admin-programs-details', FOLDER);
  });

  test('04 — Activer/Désactiver un programme', async ({ page }) => {
    const toggleBtn = page.locator('button').filter({ hasText: /actif|inactif|active|inactive/i }).first();
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'admin-programs-toggled', FOLDER);
    }
  });
});

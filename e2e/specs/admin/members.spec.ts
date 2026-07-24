import { test, expect, loginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.admin.members;

test.describe('Fidèles (Admin)', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await loginAs(page, 'super_admin');
    await page.goto('/admin/members');
    await page.waitForTimeout(3000);
  });

  test('01 - Affichage table membres', async ({ page }) => {
    await screenshot(page, 'admin-members-list', FOLDER);
  });

  test('02 - Recherche par nom', async ({ page }) => {
    const search = page.locator('input[placeholder*="Rechercher"]').first();
    if (await search.isVisible()) {
      await search.fill('Marc');
      await page.waitForTimeout(1000);
      await screenshot(page, 'admin-members-search', FOLDER);
    }
  });

  test('03 - Créer membre', async ({ page }) => {
    const createBtn = page.locator('button').filter({ hasText: /nouveau|créer/i }).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'admin-members-create-modal', FOLDER);
    }
  });

  test('04 - Responsive mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/admin/members');
    await page.waitForTimeout(3000);
    await screenshot(page, 'admin-members-mobile', FOLDER);
  });
});

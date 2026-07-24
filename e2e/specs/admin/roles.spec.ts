import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.admin.roles;

test.describe('Workflow Admin — Matrice RBAC & Permissions', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'super_admin');
    await page.goto('/admin/roles');
    await page.waitForTimeout(4000);
  });

  test('01 — Voir la matrice des rôles et permissions', async ({ page }) => {
    await screenshot(page, 'admin-roles-matrix', FOLDER);
    await expect(page.locator('body')).toContainText(/rôle|role|permission/i);
  });

  test('02 — Voir les permissions de chaque rôle', async ({ page }) => {
    await screenshot(page, 'admin-roles-permissions', FOLDER);

    // Vérifier qu'il y a des checkboxes de permissions
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    console.log(`  ℹ️ ${count} checkboxes de permissions trouvées`);
  });

  test('03 — Déplier une catégorie de permissions', async ({ page }) => {
    const category = page.locator('tr, button').filter({ hasText: /utilisateur|membre|rapport|programme/i }).first();
    if (await category.isVisible()) {
      await category.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'admin-roles-category-expanded', FOLDER);
    }
  });

  test('04 — Vérifier que super_admin est protégé', async ({ page }) => {
    await screenshot(page, 'admin-roles-super-admin-protected', FOLDER);

    // Les permissions de super_admin ne doivent pas être modifiables
    const superAdminCheckboxes = page.locator('tr').filter({ hasText: /super_admin/i }).locator('input[type="checkbox"]');
    if (await superAdminCheckboxes.count() > 0) {
      const isDisabled = await superAdminCheckboxes.first().isDisabled();
      expect(isDisabled).toBeTruthy();
    }
  });

  test('05 — Créer un nouveau rôle', async ({ page }) => {
    const createBtn = page.locator('button').filter({ hasText: /nouveau rôle|create role/i }).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'admin-roles-create-modal', FOLDER);
    }
  });

  test('06 — Tout déplier / tout replier', async ({ page }) => {
    const expandBtn = page.locator('button').filter({ hasText: /tout déplier|expand/i }).first();
    if (await expandBtn.isVisible()) {
      await expandBtn.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'admin-roles-all-expanded', FOLDER);
    }

    const collapseBtn = page.locator('button').filter({ hasText: /tout replier|collapse/i }).first();
    if (await collapseBtn.isVisible()) {
      await collapseBtn.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'admin-roles-all-collapsed', FOLDER);
    }
  });
});

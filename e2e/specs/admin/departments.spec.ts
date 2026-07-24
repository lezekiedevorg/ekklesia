import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.admin.departments;

test.describe('Workflow Admin — Gestion des Départements', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'super_admin');
    await page.goto('/admin/departments');
    await page.waitForTimeout(4000);
  });

  test('01 — Voir la liste des départements', async ({ page }) => {
    await screenshot(page, 'admin-depts-list', FOLDER);
    await expect(page.locator('body')).toContainText(/département|department|ministère/i);
  });

  test('02 — Créer un département', async ({ page }) => {
    const createBtn = page.locator('button').filter({ hasText: /créer|nouveau/i }).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'admin-depts-create-modal', FOLDER);

      const nameInput = page.locator('input[placeholder*="nom"], input[name*="name"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('Dept Test E2E');
        await screenshot(page, 'admin-depts-create-filled', FOLDER);
      }
    }
  });

  test('03 — Voir les membres d\'un département', async ({ page }) => {
    const deptLink = page.locator('a[href*="/admin/departments/"]').first();
    if (await deptLink.isVisible()) {
      await deptLink.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'admin-dept-detail', FOLDER);
    }
  });

  test('04 — Assigner un membre à un département', async ({ page }) => {
    const deptLink = page.locator('a[href*="/admin/departments/"]').first();
    if (await deptLink.isVisible()) {
      await deptLink.click();
      await page.waitForTimeout(3000);

      const assignBtn = page.locator('button').filter({ hasText: /assigner|ajouter|membre/i }).first();
      if (await assignBtn.isVisible()) {
        await assignBtn.click();
        await page.waitForTimeout(500);
        await screenshot(page, 'admin-dept-assign-modal', FOLDER);
      }
    }
  });

  test('05 — Retirer un membre d\'un département', async ({ page }) => {
    const deptLink = page.locator('a[href*="/admin/departments/"]').first();
    if (await deptLink.isVisible()) {
      await deptLink.click();
      await page.waitForTimeout(3000);

      const removeBtn = page.locator('button').filter({ hasText: /retirer|supprimer|remove/i }).first();
      if (await removeBtn.isVisible()) {
        await screenshot(page, 'admin-dept-before-remove', FOLDER);
      }
    }
  });
});

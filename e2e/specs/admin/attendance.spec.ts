import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.admin.attendance;

test.describe('Workflow Admin — Gestion des Pointages', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'super_admin');
    await page.goto('/admin/attendance');
    await page.waitForTimeout(4000);
  });

  test('01 — Voir la liste des pointages', async ({ page }) => {
    await screenshot(page, 'admin-attendance-list', FOLDER);
    await expect(page.locator('body')).toContainText(/pointage|présence|attendance|membre/i);
  });

  test('02 — Filtrer par date', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible()) {
      await dateInput.fill('2026-07-01');
      await page.waitForTimeout(1000);
      await screenshot(page, 'admin-attendance-date-filter', FOLDER);
    }
  });

  test('03 — Filtrer par programme', async ({ page }) => {
    const programFilter = page.locator('select').filter({ hasText: /programme|program/i }).first();
    if (await programFilter.isVisible()) {
      await programFilter.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
      await screenshot(page, 'admin-attendance-program-filter', FOLDER);
    }
  });

  test('04 — Ajouter un pointage', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: /ajouter|add|nouveau/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'admin-attendance-add-modal', FOLDER);
    }
  });

  test('05 — Modifier un pointage (toggle présent/absent)', async ({ page }) => {
    const toggleBtn = page.locator('button').filter({ hasText: /présent|absent|present/i }).first();
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'admin-attendance-toggled', FOLDER);
    }
  });

  test('06 — Supprimer un pointage', async ({ page }) => {
    const deleteBtn = page.locator('button[title*="Supprimer"]').first();
    if (await deleteBtn.isVisible()) {
      await screenshot(page, 'admin-attendance-before-delete', FOLDER);

      page.on('dialog', async (dialog) => {
        await dialog.dismiss();
      });

      await deleteBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'admin-attendance-delete-confirmation', FOLDER);
    }
  });
});

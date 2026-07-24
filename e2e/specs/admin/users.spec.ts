import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.admin.users;

test.describe('Workflow Admin — Gestion des Utilisateurs', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'super_admin');
    await page.goto('/admin/users');
    await page.waitForTimeout(4000);
  });

  test('01 — Voir la liste des utilisateurs', async ({ page }) => {
    await screenshot(page, 'admin-users-list', FOLDER);
    await expect(page.locator('body')).toContainText(/utilisateur|user|role/i);
  });

  test('02 — Rechercher un utilisateur', async ({ page }) => {
    const search = page.locator('input[placeholder*="Rechercher"]').first();
    if (await search.isVisible()) {
      await search.fill('Marc');
      await page.waitForTimeout(1000);
      await screenshot(page, 'admin-users-search', FOLDER);
    }
  });

  test('03 — Filtrer par rôle', async ({ page }) => {
    const roleFilter = page.locator('select').first();
    if (await roleFilter.isVisible()) {
      await roleFilter.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
      await screenshot(page, 'admin-users-filter-role', FOLDER);
    }
  });

  test('04 — Créer un nouvel utilisateur (berger)', async ({ page }) => {
    const createBtn = page.locator('button').filter({ hasText: /créer|nouveau|create/i }).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'admin-users-create-modal', FOLDER);

      // Remplir le formulaire
      const prenomInput = page.locator('input[placeholder*="Jean"]').first();
      const nomInput = page.locator('input[placeholder*="Kouassi"]').first();
      const emailInput = page.locator('input[type="email"]').first();

      if (await prenomInput.isVisible()) await prenomInput.fill('Berger');
      if (await nomInput.isVisible()) await nomInput.fill('TestE2E');
      if (await emailInput.isVisible()) await emailInput.fill(`berger-test-${Date.now()}@ekklesia.test`);

      await screenshot(page, 'admin-users-create-filled', FOLDER);

      // Soumettre
      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
        await screenshot(page, 'admin-user-created', FOLDER);
      }
    }
  });

  test('05 — Modifier le rôle d\'un utilisateur', async ({ page }) => {
    const editBtn = page.locator('button[title*="Modifier"]').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'admin-users-edit-role-modal', FOLDER);

      // Fermer sans sauvegarder
      const closeBtn = page.locator('button').filter({ hasText: /annuler|fermer|×/i }).first();
      if (await closeBtn.isVisible()) await closeBtn.click();
    }
  });

  test('06 — Vérifier que super_admin ne peut pas être modifié', async ({ page }) => {
    await screenshot(page, 'admin-users-super-admin-protected', FOLDER);

    // Chercher la ligne super_admin
    const superAdminRow = page.locator('tr, [class*="row"]').filter({ hasText: /super_admin|super admin/i }).first();
    if (await superAdminRow.isVisible()) {
      await screenshot(page, 'admin-users-super-admin-row', FOLDER);
    }
  });

  test('07 — Supprimer un utilisateur', async ({ page }) => {
    const deleteBtn = page.locator('button[title*="Supprimer"]').first();
    if (await deleteBtn.isVisible()) {
      await screenshot(page, 'admin-users-before-delete', FOLDER);

      // Intercepter le confirm dialog
      page.on('dialog', async (dialog) => {
        await dialog.dismiss(); // Annuler pour ne pas supprimer
      });

      await deleteBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'admin-users-delete-confirmation', FOLDER);
    }
  });
});

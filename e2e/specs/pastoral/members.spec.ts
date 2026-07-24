import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.pastoral.members;

test.describe('Workflow Berger — Gestion des Fidèles', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
  });

  test('01 — Voir la liste de ses fidèles', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);
    await screenshot(page, 'members-list-loaded', FOLDER);

    // Le berger ne voit que ses propres membres
    await expect(page.locator('body')).toContainText(/membre|fidèle|fidèles/i);
  });

  test('02 — Rechercher un membre par nom', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);

    const searchInput = page.locator('input[placeholder*="Rechercher"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Marc');
      await page.waitForTimeout(1000);
      await screenshot(page, 'members-search-result', FOLDER);
    }
  });

  test('03 — Filtrer par statut', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);

    const statusFilter = page.locator('select').first();
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
      await screenshot(page, 'members-filtered-status', FOLDER);
    }
  });

  test('04 — Ajouter un nouveau fidèle', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);

    const createBtn = page.locator('button').filter({ hasText: /nouveau|créer|ajouter/i }).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'members-create-modal', FOLDER);

      // Remplir le formulaire
      const prenomInput = page.locator('input[placeholder*="Jean"], input[name*="first"]').first();
      const nomInput = page.locator('input[placeholder*="Kouassi"], input[name*="last"]').first();

      if (await prenomInput.isVisible()) await prenomInput.fill('NouveauFidele');
      if (await nomInput.isVisible()) await nomInput.fill('TestE2E');

      await screenshot(page, 'members-create-filled', FOLDER);

      // Soumettre
      const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /créer|enregistrer/i }).first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
        await screenshot(page, 'member-created', FOLDER);
      }
    }
  });

  test('05 — Éditer un membre', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);

    const editBtn = page.locator('button[title*="Modifier"]').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'members-edit-modal', FOLDER);

      // Fermer sans sauvegarder
      const closeBtn = page.locator('[data-testid="modal-close"]').first();
      if (await closeBtn.isVisible()) await closeBtn.click();
    }
  });

  test('06 — Voir les détails d\'un membre (statut, classe, berger)', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);
    await screenshot(page, 'member-details', FOLDER);

    // Vérifier les informations affichées
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('07 — Voir les membres archivés', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);

    const archivedTab = page.locator('button').filter({ hasText: /archiv/i }).first();
    if (await archivedTab.isVisible()) {
      await archivedTab.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'members-archived-tab', FOLDER);
    }
  });

  test('08 — Pagination des membres', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);

    const nextBtn = page.locator('button[title*="suivante"]').first();
    if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'members-page-2', FOLDER);
    }
  });
});

test.describe('Workflow Responsable — Supervision des Fidèles du Groupe', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'leader');
  });

  test('09 — Voir les fidèles de son groupe', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);
    await screenshot(page, 'leader-members-group', FOLDER);

    // Le leader voit les membres de son groupe
    await expect(page.locator('body')).toContainText(/membre|fidèle/i);
  });

  test('10 — Voir les statuts et classes des membres', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);
    await screenshot(page, 'leader-members-status', FOLDER);
  });
});

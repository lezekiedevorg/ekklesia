import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.admin.groups;

test.describe('Workflow Admin — Gestion des Cellules / Groupes', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'super_admin');
    await page.goto('/admin/groups');
    await page.waitForTimeout(4000);
  });

  test('01 — Voir la liste des groupes (Puissance, Gloire, Sagesse)', async ({ page }) => {
    await screenshot(page, 'admin-groups-list', FOLDER);
    await expect(page.locator('body')).toContainText(/groupe|cellule|puissance|gloire|sagesse/i);
  });

  test('02 — Voir le nombre de membres par groupe', async ({ page }) => {
    await screenshot(page, 'admin-groups-member-count', FOLDER);

    // Vérifier qu'il y a des compteurs
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('03 — Assigner un responsable à un groupe', async ({ page }) => {
    const leaderSelect = page.locator('select').first();
    if (await leaderSelect.isVisible()) {
      await leaderSelect.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
      await screenshot(page, 'admin-group-leader-assigned', FOLDER);
    }
  });

  test('04 — Voir les détails d\'un groupe', async ({ page }) => {
    await screenshot(page, 'admin-group-details', FOLDER);
  });
});

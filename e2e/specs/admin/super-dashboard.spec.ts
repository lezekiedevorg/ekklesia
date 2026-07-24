import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.admin.superDashboard;

test.describe('Workflow Admin — Centre de Commandement', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'super_admin');
    await page.goto('/admin/super-dashboard');
    await page.waitForTimeout(4000);
  });

  test('01 — Voir les KPIs globaux de l\'église', async ({ page }) => {
    await screenshot(page, 'admin-kpis-global', FOLDER);

    // Vérifier les indicateurs clés
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('02 — Voir l\'organigramme (arbre des bergers)', async ({ page }) => {
    await screenshot(page, 'admin-org-tree', FOLDER);
  });

  test('03 — Voir le résumé de la semaine', async ({ page }) => {
    await screenshot(page, 'admin-week-summary', FOLDER);
  });

  test('04 — Voir la grille des départements', async ({ page }) => {
    await screenshot(page, 'admin-departments-grid', FOLDER);
  });

  test('05 — Voir le panel d\'alertes', async ({ page }) => {
    await screenshot(page, 'admin-alerts-panel', FOLDER);
  });

  test('06 — Tab Comparaison (comparer bergers/groupes)', async ({ page }) => {
    const compTab = page.locator('button, [role="tab"]').filter({ hasText: /comparaison|compar/i }).first();
    if (await compTab.isVisible()) {
      await compTab.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'admin-comparison-tab', FOLDER);
    }
  });

  test('07 — Tab Évolution (tendances temporelles)', async ({ page }) => {
    const evoTab = page.locator('button, [role="tab"]').filter({ hasText: /évolution|evolution/i }).first();
    if (await evoTab.isVisible()) {
      await evoTab.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'admin-evolution-tab', FOLDER);
    }
  });

  test('08 — Changer de période (jour/semaine/mois)', async ({ page }) => {
    const periodBtn = page.locator('button').filter({ hasText: /jour|semaine|mois|day|week|month/i }).first();
    if (await periodBtn.isVisible()) {
      await periodBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'admin-period-changed', FOLDER);
    }
  });
});

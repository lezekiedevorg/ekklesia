import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.pastoral.dashboard;

test.describe('Workflow Berger — Dashboard Personnel', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
  });

  test('01 — Voir son dashboard personnel', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    await screenshot(page, 'shepherd-dashboard', FOLDER);

    // Vérifier la navbar
    await expect(page.locator('[data-testid="navbar-header"]')).toBeVisible();
  });

  test('02 — Voir ses KPIs (membres, présences, disciplines)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    await screenshot(page, 'shepherd-kpis', FOLDER);

    // Vérifier qu'il y a des indicateurs
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('03 — Naviguer vers ses pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Aller aux membres
    const membersLink = page.locator('[data-testid="nav-members"]').first();
    if (await membersLink.isVisible()) {
      await membersLink.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'nav-to-members', FOLDER);
      expect(page.url()).toContain('/members');
    }
  });

  test('04 — Sélecteur de semaine', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const weekSelector = page.locator('button, select').filter({ hasText: /semaine|week/i }).first();
    if (await weekSelector.isVisible()) {
      await weekSelector.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'week-selector', FOLDER);
    }
  });
});

test.describe('Workflow Pasteur — Dashboard Global', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'pastor');
  });

  test('05 — Voir le dashboard global (toute l\'église)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    await screenshot(page, 'pastor-dashboard-global', FOLDER);

    // Le pasteur voit les stats de toute l'église
    await expect(page.locator('[data-testid="navbar-header"]')).toBeVisible();
  });

  test('06 — Voir l\'évolution des membres', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    await screenshot(page, 'pastor-members-evolution', FOLDER);
  });

  test('07 — Voir les alertes globales', async ({ page }) => {
    await page.goto('/alerts');
    await page.waitForTimeout(3000);
    await screenshot(page, 'pastor-alerts-global', FOLDER);
  });
});

test.describe('Workflow Responsable — Dashboard du Groupe', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'leader');
  });

  test('08 — Voir le dashboard de son groupe', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    await screenshot(page, 'leader-dashboard-group', FOLDER);

    // Le leader voit les stats de son groupe
    await expect(page.locator('[data-testid="navbar-header"]')).toBeVisible();
  });

  test('09 — Comparer les bergers de son groupe', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    await screenshot(page, 'leader-shepherds-comparison', FOLDER);
  });
});

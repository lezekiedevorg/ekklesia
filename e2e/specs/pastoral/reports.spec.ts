import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.pastoral.reports;

test.describe('Workflow Berger — Rapports Hebdomadaires', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
  });

  test('01 — Accéder aux rapports et voir l\'aperçu', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    await screenshot(page, 'reports-page-loaded', FOLDER);

    // Vérifier qu'on voit le contenu des rapports
    await expect(page.locator('body')).toContainText(/rapport|report|semaine/i);
  });

  test('02 — Voir les données du rapport (KPIs, présences, disciplines)', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    await screenshot(page, 'report-preview-data', FOLDER);

    // Vérifier qu'il y a des données de rapport
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('03 — Soumettre le rapport hebdomadaire', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    await screenshot(page, 'reports-before-submit', FOLDER);

    const submitBtn = page.locator('button').filter({ hasText: /soumettre|submit/i }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'report-submitted', FOLDER);
    }
  });

  test('04 — Voir le statut du rapport après soumission', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    await screenshot(page, 'report-status', FOLDER);

    // Vérifier le statut affiché
    const body = await page.textContent('body');
    const hasStatus = body?.includes('Soumis') || body?.includes('Validé') || body?.includes('Brouillon');
    expect(hasStatus).toBeTruthy();
  });

  test('05 — Imprimer le rapport (PDF)', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);

    const printBtn = page.locator('button, a').filter({ hasText: /imprimer|print|pdf/i }).first();
    if (await printBtn.isVisible()) {
      await printBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'report-print', FOLDER);
    }
  });
});

test.describe('Workflow Responsable — Validation des Rapports', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'leader');
  });

  test('06 — Voir la liste des rapports de son groupe', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    await screenshot(page, 'leader-reports-list', FOLDER);

    // En tant que leader, on voit les rapports du groupe
    await expect(page.locator('body')).toContainText(/rapport|report/i);
  });

  test('07 — Voir le détail d\'un rapport', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);

    const viewBtn = page.locator('button').filter({ hasText: /voir|détail|detail|expand/i }).first();
    if (await viewBtn.isVisible()) {
      await viewBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'leader-report-detail', FOLDER);
    }
  });

  test('08 — Approuver un rapport', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);

    const approveBtn = page.locator('button').filter({ hasText: /approuver|valider|approve/i }).first();
    if (await approveBtn.isVisible()) {
      await screenshot(page, 'leader-before-approve', FOLDER);
      await approveBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'leader-report-approved', FOLDER);
    }
  });

  test('09 — Voir les KPIs exécutifs', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    await screenshot(page, 'leader-kpis', FOLDER);
  });
});

test.describe('Workflow Pasteur — Supervision Globale des Rapports', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'pastor');
  });

  test('10 — Voir tous les rapports (tous les groupes)', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    await screenshot(page, 'pastor-reports-all', FOLDER);

    // Le pasteur voit tous les rapports
    await expect(page.locator('body')).toContainText(/rapport|report/i);
  });

  test('11 — Filtrer par groupe', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);

    const groupFilter = page.locator('select').filter({ hasText: /groupe|group/i }).first();
    if (await groupFilter.isVisible()) {
      await groupFilter.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
      await screenshot(page, 'pastor-reports-filtered', FOLDER);
    }
  });

  test('12 — Voir l\'évolution temporelle des rapports', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    await screenshot(page, 'pastor-reports-evolution', FOLDER);
  });
});

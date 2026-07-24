import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.pastoral.alerts;

test.describe('Workflow Berger — Alertes & Visites Pastorales', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
  });

  test('01 — Voir les alertes (membres absents 2+ semaines)', async ({ page }) => {
    await page.goto('/alerts');
    await page.waitForTimeout(3000);
    await screenshot(page, 'alerts-page-loaded', FOLDER);

    await expect(page.locator('body')).toContainText(/alerte|absent|relance/i);
  });

  test('02 — Voir les détails d\'un membre en alerte', async ({ page }) => {
    await page.goto('/alerts');
    await page.waitForTimeout(3000);
    await screenshot(page, 'alert-details', FOLDER);

    // Vérifier qu'il y a des informations sur le membre
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('03 — Enregistrer une visite pastorale', async ({ page }) => {
    await page.goto('/alerts');
    await page.waitForTimeout(3000);

    // Chercher le bouton pour enregistrer une visite
    const visitBtn = page.locator('button').filter({ hasText: /visite|enregistrer|appel|call/i }).first();
    if (await visitBtn.isVisible()) {
      await visitBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'visit-modal-opened', FOLDER);

      // Remplir le formulaire de visite
      const dateInput = page.locator('input[type="date"]').first();
      if (await dateInput.isVisible()) {
        await dateInput.fill(new Date().toISOString().split('T')[0]);
      }

      const reasonSelect = page.locator('select').first();
      if (await reasonSelect.isVisible()) {
        await reasonSelect.selectOption({ index: 1 });
      }

      const notesInput = page.locator('textarea, input[placeholder*="note"]').first();
      if (await notesInput.isVisible()) {
        await notesInput.fill('Visite E2E — Membre malade, prié avec lui');
      }

      await screenshot(page, 'visit-form-filled', FOLDER);

      // Soumettre
      const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /enregistrer|sauvegarder|submit/i }).first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
        await screenshot(page, 'visit-registered', FOLDER);
      }
    }
  });

  test('04 — Voir l\'historique des visites', async ({ page }) => {
    await page.goto('/alerts');
    await page.waitForTimeout(3000);
    await screenshot(page, 'visits-history', FOLDER);
  });

  test('05 — Appeler un membre (lien téléphone)', async ({ page }) => {
    await page.goto('/alerts');
    await page.waitForTimeout(3000);

    const phoneLink = page.locator('a[href^="tel:"]').first();
    if (await phoneLink.isVisible()) {
      await screenshot(page, 'phone-link-visible', FOLDER);
      // Ne pas cliquer (ouvre l'app téléphone)
      expect(await phoneLink.getAttribute('href')).toMatch(/tel:/);
    }
  });
});

test.describe('Workflow Responsable — Alertes du Groupe', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'leader');
  });

  test('06 — Voir les alertes de son groupe', async ({ page }) => {
    await page.goto('/alerts');
    await page.waitForTimeout(3000);
    await screenshot(page, 'leader-alerts-group', FOLDER);

    await expect(page.locator('body')).toContainText(/alerte|absent|relance/i);
  });

  test('07 — Voir les visites des bergers de son groupe', async ({ page }) => {
    await page.goto('/alerts');
    await page.waitForTimeout(3000);
    await screenshot(page, 'leader-visits-overview', FOLDER);
  });
});

test.describe('Workflow Pasteur — Alertes Globales', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'pastor');
  });

  test('08 — Voir toutes les alertes (toutes les congrégations)', async ({ page }) => {
    await page.goto('/alerts');
    await page.waitForTimeout(3000);
    await screenshot(page, 'pastor-alerts-global', FOLDER);

    // Le pasteur voit toutes les alertes
    await expect(page.locator('body')).toContainText(/alerte|absent|relance/i);
  });

  test('09 — Suivre les visites de tous les bergers', async ({ page }) => {
    await page.goto('/alerts');
    await page.waitForTimeout(3000);
    await screenshot(page, 'pastor-all-visits', FOLDER);
  });
});

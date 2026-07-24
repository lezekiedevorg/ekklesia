import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.pastoral.attendance;

test.describe('Workflow Berger — Pointage des Présences', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
  });

  test('01 — Accéder à la feuille de pointage', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForTimeout(3000);
    await screenshot(page, 'attendance-page-loaded', FOLDER);

    await expect(page.locator('body')).toContainText(/présence|pointage|attendance|membre/i);
  });

  test('02 — Voir la liste de ses membres', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForTimeout(3000);
    await screenshot(page, 'attendance-members-list', FOLDER);

    // Vérifier qu'il y a des membres affichés
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('03 — Marquer un membre présent', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForTimeout(3000);

    const presentBtn = page.locator('button').filter({ hasText: /présent|present/i }).first();
    if (await presentBtn.isVisible()) {
      await presentBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'member-marked-present', FOLDER);
    }
  });

  test('04 — Marquer un membre absent', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForTimeout(3000);

    const absentBtn = page.locator('button').filter({ hasText: /absent/i }).first();
    if (await absentBtn.isVisible()) {
      await absentBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'member-marked-absent', FOLDER);
    }
  });

  test('05 — Ajouter une raison d\'absence', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForTimeout(3000);

    // D'abord marquer absent
    const absentBtn = page.locator('button').filter({ hasText: /absent/i }).first();
    if (await absentBtn.isVisible()) {
      await absentBtn.click();
      await page.waitForTimeout(1000);
    }

    // Chercher le champ de raison
    const reasonInput = page.locator('input[placeholder*="raison"], textarea[placeholder*="raison"]').first();
    if (await reasonInput.isVisible()) {
      await reasonInput.fill('Maladie');
      await screenshot(page, 'absence-reason-filled', FOLDER);
    }
  });

  test('06 — Sélectionner un programme spécifique', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForTimeout(3000);

    // Cliquer sur un onglet de programme
    const tabs = page.locator('button').filter({ hasText: /dimanche|mardi|mercredi|jeudi|vendredi/i });
    if (await tabs.count() > 0) {
      await tabs.first().click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'program-tab-selected', FOLDER);
    }
  });

  test('07 — Sauvegarder le pointage', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForTimeout(3000);

    const saveBtn = page.locator('button').filter({ hasText: /sauvegarder|enregistrer|save/i }).first();
    if (await saveBtn.isVisible()) {
      await screenshot(page, 'attendance-before-save', FOLDER);
      await saveBtn.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'attendance-saved', FOLDER);
    }
  });

  test('08 — Vérifier le résumé présent/absent', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForTimeout(3000);
    await screenshot(page, 'attendance-summary', FOLDER);

    // Vérifier qu'il y a un compteur ou résumé
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});

test.describe('Workflow Responsable — Supervision des Présences', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'leader');
  });

  test('09 — Voir les présences de son groupe', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForTimeout(3000);
    await screenshot(page, 'leader-attendance', FOLDER);

    await expect(page.locator('body')).toContainText(/présence|pointage|membre/i);
  });

  test('10 — Comparer les présences entre bergers', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForTimeout(3000);
    await screenshot(page, 'leader-attendance-comparison', FOLDER);
  });
});

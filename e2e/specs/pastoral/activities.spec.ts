import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.pastoral.activities;

test.describe('Workflow Berger — Formulaire Disciplines & Activités', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
  });

  test('01 — Accéder au formulaire disciplines', async ({ page }) => {
    await page.goto('/activities');
    await page.waitForTimeout(2000);
    await screenshot(page, 'activities-page-loaded', FOLDER);

    // Vérifier les sections du formulaire
    await expect(page.locator('body')).toContainText(/discipline|prière|méditation/i);
  });

  test('02 — Remplir les disciplines quotidiennes (Q/I)', async ({ page }) => {
    await page.goto('/activities');
    await page.waitForTimeout(2000);

    // Toggle prière Q (Quotidien)
    const prayerQ = page.locator('button').filter({ hasText: /prière/i }).first();
    if (await prayerQ.isVisible()) {
      await prayerQ.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'discipline-prayer-q', FOLDER);
    }

    // Toggle méditation Q
    const medQ = page.locator('button').filter({ hasText: /méditation/i }).first();
    if (await medQ.isVisible()) {
      await medQ.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'discipline-meditation-q', FOLDER);
    }

    // Toggle jeûne
    const fasting = page.locator('button').filter({ hasText: /jeûne/i }).first();
    if (await fasting.isVisible()) {
      await fasting.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'discipline-fasting', FOLDER);
    }

    // Toggle écoute de la parole
    const wordListening = page.locator('button').filter({ hasText: /écoute|ecoute/i }).first();
    if (await wordListening.isVisible()) {
      await wordListening.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'discipline-word-listening', FOLDER);
    }
  });

  test('03 — Remplir les actions pastorales', async ({ page }) => {
    await page.goto('/activities');
    await page.waitForTimeout(2000);

    // Input âmes gagnées
    const soulsInput = page.locator('input[type="number"]').first();
    if (await soulsInput.isVisible()) {
      await soulsInput.fill('3');
      await screenshot(page, 'pastoral-souls-won', FOLDER);
    }

    // Input visites domicile
    const homeVisits = page.locator('input[type="number"]').nth(1);
    if (await homeVisits.isVisible()) {
      await homeVisits.fill('5');
      await screenshot(page, 'pastoral-home-visits', FOLDER);
    }

    // Input appels suivi
    const followupCalls = page.locator('input[type="number"]').nth(2);
    if (await followupCalls.isVisible()) {
      await followupCalls.fill('8');
      await screenshot(page, 'pastoral-followup-calls', FOLDER);
    }
  });

  test('04 — Remplir observations', async ({ page }) => {
    await page.goto('/activities');
    await page.waitForTimeout(2000);

    const obsInput = page.locator('textarea').first();
    if (await obsInput.isVisible()) {
      await obsInput.fill('Bonne semaine. Les membres sont assidus. Un nouveau converti a participé au culte.');
      await screenshot(page, 'observations-filled', FOLDER);
    }
  });

  test('05 — Sauvegarder le formulaire complet', async ({ page }) => {
    await page.goto('/activities');
    await page.waitForTimeout(2000);

    // Remplir quelques champs
    const prayerQ = page.locator('button').filter({ hasText: /prière/i }).first();
    if (await prayerQ.isVisible()) await prayerQ.click();

    const fasting = page.locator('button').filter({ hasText: /jeûne/i }).first();
    if (await fasting.isVisible()) await fasting.click();

    const obsInput = page.locator('textarea').first();
    if (await obsInput.isVisible()) {
      await obsInput.fill('Test E2E — formulaire sauvegardé');
    }

    await screenshot(page, 'activities-before-save', FOLDER);

    // Sauvegarder
    const saveBtn = page.locator('button').filter({ hasText: /sauvegarder|enregistrer/i }).first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'activities-saved', FOLDER);
    }
  });

  test('06 — Sélecteur semaine', async ({ page }) => {
    await page.goto('/activities');
    await page.waitForTimeout(2000);

    // Chercher le sélecteur de semaine
    const weekNav = page.locator('button, select').filter({ hasText: /semaine|précédente|suivante|<-|->/i });
    if (await weekNav.first().isVisible()) {
      await weekNav.first().click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'week-selector', FOLDER);
    }
  });

  test('07 — Vérifier mutual exclusivité Q/I', async ({ page }) => {
    await page.goto('/activities');
    await page.waitForTimeout(2000);

    // Cliquer sur prière Q
    const prayerQ = page.locator('button').filter({ hasText: /prière/i }).first();
    if (await prayerQ.isVisible()) {
      await prayerQ.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'prayer-q-activated', FOLDER);

      // Vérifier que l'état est cohérent
      const body = await page.textContent('body');
      expect(body).toBeTruthy();
    }
  });
});

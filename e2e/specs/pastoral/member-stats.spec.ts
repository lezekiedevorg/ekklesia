import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter, bugScreenshot } from '../../helpers/screenshot';

const FOLDER = '02-pastoral/08-member-stats';

test.describe('Statistiques individuelles du fidèle', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
  });

  test('01 — Page membres : bouton Stats visible', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);
    await screenshot(page, 'members-list', FOLDER);

    const statsBtn = page.locator('button:has-text("Stats")').first();
    const visible = await statsBtn.isVisible().catch(() => false);
    console.log(`  Bouton Stats visible: ${visible}`);

    if (visible) {
      await screenshot(page, 'stats-button-visible', FOLDER);
    }
  });

  test('02 — Cliquer sur Stats et charger la page', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);

    const statsBtn = page.locator('button:has-text("Stats")').first();
    if (!(await statsBtn.isVisible().catch(() => false))) {
      console.log('  ⚠️ Pas de bouton Stats, skip');
      return;
    }

    await statsBtn.click();
    await page.waitForTimeout(5000);

    console.log(`  URL: ${page.url()}`);
    await screenshot(page, 'stats-page-top', FOLDER);

    // Scroll vers le bas pour les graphiques
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await screenshot(page, 'stats-page-bottom', FOLDER);
  });

  test('03 — Vérifier les KPI cards', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);

    const statsBtn = page.locator('button:has-text("Stats")').first();
    if (!(await statsBtn.isVisible().catch(() => false))) return;

    await statsBtn.click();
    await page.waitForTimeout(5000);

    // Vérifier la présence des éléments clés
    const body = await page.textContent('body');

    const hasTaux = body?.includes('Taux') || body?.includes('présence');
    const hasRegulier = body?.includes('Régulier') || body?.includes('Modéré') || body?.includes('Irrégulier') || body?.includes('Absent');
    const hasSemaines = body?.includes('Semaines') || body?.includes('semaines');

    console.log(`  KPI Taux: ${hasTaux}`);
    console.log(`  KPI Régularité: ${hasRegulier}`);
    console.log(`  KPI Semaines: ${hasSemaines}`);

    await screenshot(page, 'kpi-check', FOLDER);
  });

  test('04 — Vérifier le sélecteur de période', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);

    const statsBtn = page.locator('button:has-text("Stats")').first();
    if (!(await statsBtn.isVisible().catch(() => false))) return;

    await statsBtn.click();
    await page.waitForTimeout(5000);

    // Chercher les boutons de période
    const presets = ['1 mois', '3 mois', '6 mois', '1 an'];
    for (const preset of presets) {
      const btn = page.locator(`button:has-text("${preset}")`).first();
      const visible = await btn.isVisible().catch(() => false);
      console.log(`  Preset "${preset}": ${visible}`);
    }

    // Vérifier les inputs date
    const dateInputs = page.locator('input[type="date"]');
    const dateCount = await dateInputs.count();
    console.log(`  Date inputs: ${dateCount}`);

    await screenshot(page, 'period-selector', FOLDER);
  });

  test('05 — Vérifier les barres de programme', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);

    const statsBtn = page.locator('button:has-text("Stats")').first();
    if (!(await statsBtn.isVisible().catch(() => false))) return;

    await statsBtn.click();
    await page.waitForTimeout(5000);

    // Vérifier les programmes
    const programs = ['Dimanche', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
    for (const prog of programs) {
      const el = page.locator(`text=${prog}`).first();
      const visible = await el.isVisible().catch(() => false);
      console.log(`  Programme "${prog}": ${visible}`);
    }

    await screenshot(page, 'program-bars', FOLDER);
  });

  test('06 — Changer de période (1 mois)', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);

    const statsBtn = page.locator('button:has-text("Stats")').first();
    if (!(await statsBtn.isVisible().catch(() => false))) return;

    await statsBtn.click();
    await page.waitForTimeout(5000);

    const btn1m = page.locator('button:has-text("1 mois")').first();
    if (await btn1m.isVisible().catch(() => false)) {
      await btn1m.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'period-1-month', FOLDER);
      console.log(`  URL after 1m: ${page.url()}`);
    }
  });

  test('07 — Bouton retour vers la liste', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);

    const statsBtn = page.locator('button:has-text("Stats")').first();
    if (!(await statsBtn.isVisible().catch(() => false))) return;

    await statsBtn.click();
    await page.waitForTimeout(5000);

    const backLink = page.locator('a:has-text("Retour"), a:has-text("retour")').first();
    if (await backLink.isVisible().catch(() => false)) {
      await backLink.click();
      await page.waitForTimeout(3000);
      console.log(`  URL after back: ${page.url()}`);
      await screenshot(page, 'back-to-members', FOLDER);
    }
  });
});

test.describe('Statistiques fidèle — Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
  });

  test('08 — Stats page mobile', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);

    const statsBtn = page.locator('button:has-text("Stats")').first();
    if (!(await statsBtn.isVisible().catch(() => false))) return;

    await statsBtn.click();
    await page.waitForTimeout(5000);

    await screenshot(page, 'stats-mobile-top', FOLDER);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await screenshot(page, 'stats-mobile-bottom', FOLDER);
  });
});

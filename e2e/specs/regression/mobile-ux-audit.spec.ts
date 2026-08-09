import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.regression;

test.describe('Audit UX Mobile — Navigation & Menu', () => {
  test.beforeEach(() => resetCounter());

  test('01 — Mobile: Menu sidebar super_admin (trop d items)', async ({ page }) => {
    await safeLoginAs(page, 'super_admin');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Screenshot du menu mobile (bottom nav ou hamburger)
    await screenshot(page, '01-mobile-menu-superadmin-home', FOLDER);

    // Ouvrir le menu si hamburger
    const hamburger = page.locator('[data-testid="mobile-menu-toggle"], button:has-text("☰"), [aria-label="Menu"]');
    if (await hamburger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await hamburger.click();
      await page.waitForTimeout(500);
      await screenshot(page, '02-mobile-menu-open-superadmin', FOLDER);

      // Vérifier si le menu déborde
      const menu = page.locator('nav, [role="navigation"], .sidebar, .mobile-nav');
      if (await menu.isVisible({ timeout: 2000 }).catch(() => false)) {
        const box = await menu.boundingBox();
        if (box) {
          console.log(`Menu: x=${box.x}, y=${box.y}, w=${box.width}, h=${box.height}`);
          console.log(`Overflow right: ${(box.x + box.width) > 375}`);
          console.log(`Overflow bottom: ${(box.y + box.height) > 812}`);
        }
      }
    }

    // Compter les items de navigation visibles
    const navItems = page.locator('nav a, [role="navigation"] a, .sidebar a, .mobile-nav a');
    const count = await navItems.count();
    console.log(`Nombre d'items de navigation: ${count}`);

    // Vérifier le scroll
    await page.evaluate(() => {
      const body = document.body;
      console.log(`Body scroll: ${body.scrollHeight} > ${window.innerHeight}`);
    });
  });

  test('02 — Mobile: Dashboard shepherd', async ({ page }) => {
    await safeLoginAs(page, 'shepherd');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForTimeout(2000);
    await screenshot(page, '03-mobile-dashboard-shepherd', FOLDER);

    // Vérifier les cartes/KPI
    const cards = page.locator('[data-testid*="card"], .card, [class*="Card"]');
    const cardCount = await cards.count();
    console.log(`Nombre de cartes: ${cardCount}`);

    // Vérifier le débordement horizontal
    const overflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    console.log(`Horizontal overflow: ${overflow}`);
  });

  test('03 — Mobile: Page Members', async ({ page }) => {
    await safeLoginAs(page, 'super_admin');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/members');
    await page.waitForTimeout(2000);
    await screenshot(page, '04-mobile-members-list', FOLDER);

    // Vérifier la table/liste
    const table = page.locator('table, [role="grid"], .member-list');
    if (await table.isVisible({ timeout: 3000 }).catch(() => false)) {
      const box = await table.boundingBox();
      if (box) {
        console.log(`Table width: ${box.width}px (viewport: 375px)`);
        console.log(`Table overflow: ${box.width > 375}`);
      }
    }
  });

  test('04 — Mobile: Page Attendance', async ({ page }) => {
    await safeLoginAs(page, 'shepherd');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/attendance');
    await page.waitForTimeout(2000);
    await screenshot(page, '05-mobile-attendance', FOLDER);

    // Vérifier les colonnes du tableau
    const columns = page.locator('th, [role="columnheader"]');
    const colCount = await columns.count();
    console.log(`Nombre de colonnes: ${colCount}`);

    // Vérifier si le tableau déborde
    const tableOverflow = await page.evaluate(() => {
      const tables = document.querySelectorAll('table');
      let hasOverflow = false;
      tables.forEach(t => {
        if (t.scrollWidth > t.clientWidth) hasOverflow = true;
      });
      return hasOverflow;
    });
    console.log(`Table overflow: ${tableOverflow}`);
  });

  test('05 — Mobile: Page Activities', async ({ page }) => {
    await safeLoginAs(page, 'shepherd');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/activities');
    await page.waitForTimeout(2000);
    await screenshot(page, '06-mobile-activities', FOLDER);
  });

  test('06 — Mobile: Page Reports', async ({ page }) => {
    await safeLoginAs(page, 'shepherd');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/reports');
    await page.waitForTimeout(2000);
    await screenshot(page, '07-mobile-reports', FOLDER);
  });

  test('07 — Mobile: Page Alerts', async ({ page }) => {
    await safeLoginAs(page, 'shepherd');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/alerts');
    await page.waitForTimeout(2000);
    await screenshot(page, '08-mobile-alerts', FOLDER);
  });

  test('08 — Mobile: Admin Dashboard', async ({ page }) => {
    await safeLoginAs(page, 'super_admin');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    await screenshot(page, '09-mobile-admin-dashboard', FOLDER);
  });

  test('09 — Mobile: Admin Members', async ({ page }) => {
    await safeLoginAs(page, 'super_admin');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/admin/members');
    await page.waitForTimeout(2000);
    await screenshot(page, '10-mobile-admin-members', FOLDER);
  });

  test('10 — Mobile: Admin Stats', async ({ page }) => {
    await safeLoginAs(page, 'super_admin');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/admin/stats');
    await page.waitForTimeout(2000);
    await screenshot(page, '11-mobile-admin-stats', FOLDER);
  });

  test('11 — Mobile: Login page', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');
    await page.waitForTimeout(2000);
    await screenshot(page, '12-mobile-login', FOLDER);
  });

  test('12 — Mobile: Member detail page', async ({ page }) => {
    await safeLoginAs(page, 'super_admin');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/members');
    await page.waitForTimeout(2000);

    // Cliquer sur le premier membre
    const firstMember = page.locator('a[href*="/members/"], [data-testid*="member-card"]').first();
    if (await firstMember.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstMember.click();
      await page.waitForTimeout(2000);
      await screenshot(page, '13-mobile-member-detail', FOLDER);
    }
  });

  test('13 — Mobile: Conversations page', async ({ page }) => {
    await safeLoginAs(page, 'super_admin');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/conversations');
    await page.waitForTimeout(2000);
    await screenshot(page, '14-mobile-conversations', FOLDER);
  });

  test('14 — Mobile: Profile page', async ({ page }) => {
    await safeLoginAs(page, 'shepherd');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/profile');
    await page.waitForTimeout(2000);
    await screenshot(page, '15-mobile-profile', FOLDER);
  });

  test('15 — Mobile: Full scroll audit (super_admin)', async ({ page }) => {
    await safeLoginAs(page, 'super_admin');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Audit complet de la page
    const audit = await page.evaluate(() => {
      const results: string[] = [];

      // Vérifier tous les éléments avec débordement
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth + 5) {
          results.push(`OVERFLOW RIGHT: ${el.tagName}.${el.className.substring(0, 50)} at x=${rect.x} w=${rect.width}`);
        }
        if (rect.bottom > window.innerHeight + 50) {
          results.push(`OVERFLOW BOTTOM: ${el.tagName}.${el.className.substring(0, 50)} at y=${rect.y} h=${rect.height}`);
        }
      });

      // Vérifier les éléments non cliquables
      const buttons = document.querySelectorAll('button, a, [role="button"]');
      buttons.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) {
          results.push(`TAP TARGET TOO SMALL: ${btn.tagName} ${btn.textContent?.substring(0, 30)} (${rect.width}x${rect.height})`);
        }
      });

      return results;
    });

    console.log('=== AUDIT RESULTS ===');
    audit.forEach(r => console.log(r));
    console.log(`Total issues: ${audit.length}`);

    await screenshot(page, '16-mobile-full-audit', FOLDER);
  });
});

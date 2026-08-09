import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.regression;

// Audit approfondi non-admin : on parcourt chaque page pastorale,
// on interagit avec les filtres, les onglets, les modales, les sections
// depliables, le scroll, les champs de saisie, et on capture tout.
test.describe('Audit UX Mobile Approfondi — Pastorale (non-admin)', () => {
  test.beforeEach(() => resetCounter());

  // 01 — Dashboard shepherd complet (scroll inclus)
  test('01 — Dashboard shepherd scroll complet', async ({ page }) => {
    await safeLoginAs(page, 'shepherd');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForTimeout(2500);
    await screenshot(page, 'p01-dashboard-top', FOLDER);

    // Scroll vers le bas
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await screenshot(page, 'p01-dashboard-bottom', FOLDER);

    // Scroll milieu
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(1000);
    await screenshot(page, 'p01-dashboard-mid', FOLDER);
  });

  // 02 — Members : liste + recherche + filtres + tab newcomers + detail
  test('02 — Members liste + tab + recherche', async ({ page }) => {
    await safeLoginAs(page, 'shepherd');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/members');
    await page.waitForTimeout(2500);
    await screenshot(page, 'p02-members-list', FOLDER);

    // Essai recherche
    const search = page.locator('input[placeholder*="Rechercher" i]').first();
    if (await search.isVisible({ timeout: 2000 }).catch(() => false)) {
      await search.fill('Adjoua');
      await page.waitForTimeout(1000);
      await screenshot(page, 'p02-members-search', FOLDER);
      await search.fill('');
      await page.waitForTimeout(500);
    }

    // Clic tab Nouveaux
    const tabNew = page.locator('button, [role="tab"]').filter({ hasText: /Nouveaux|Nouvelles Âmes/i }).first();
    if (await tabNew.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tabNew.click();
      await page.waitForTimeout(1500);
      await screenshot(page, 'p02-members-newcomers', FOLDER);
    }

    // Filtre statut (select)
    const status = page.locator('select').first();
    if (await status.isVisible({ timeout: 2000 }).catch(() => false)) {
      await status.selectOption({ index: 1 }).catch(() => null);
      await page.waitForTimeout(1000);
      await screenshot(page, 'p02-members-status-filter', FOLDER);
    }

    // Clic sur la premiere fiche membre
    const firstCard = page.locator('a[href*="/members/"]').first();
    if (await firstCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstCard.click();
      await page.waitForTimeout(2500);
      await screenshot(page, 'p02-member-detail', FOLDER);

      // Scroll interne
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      await screenshot(page, 'p02-member-detail-bottom', FOLDER);
    }
  });

  // 03 — Attendance : liste, semaine, modal creation
  test('03 — Attendance par semaine + liste', async ({ page }) => {
    await safeLoginAs(page, 'shepherd');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/attendance');
    await page.waitForTimeout(2500);
    await screenshot(page, 'p03-attendance-list', FOLDER);

    // Vue semaine
    const weekTab = page.locator('button, [role="tab"]').filter({ hasText: /semaine/i }).first();
    if (await weekTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await weekTab.click();
      await page.waitForTimeout(1500);
      await screenshot(page, 'p03-attendance-week', FOLDER);

      // Scroll vers le bas pour voir le bouton save
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      await screenshot(page, 'p03-attendance-week-bottom', FOLDER);
    }

    // Vue membres
    const memberTab = page.locator('button, [role="tab"]').filter({ hasText: /Membres/i }).first();
    if (await memberTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await memberTab.click();
      await page.waitForTimeout(1500);
      await screenshot(page, 'p03-attendance-members', FOLDER);
    }

    // Vue nouveaux
    const newTab = page.locator('button, [role="tab"]').filter({ hasText: /Nouveaux/i }).first();
    if (await newTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await newTab.click();
      await page.waitForTimeout(1500);
      await screenshot(page, 'p03-attendance-new', FOLDER);
    }

    // Filtre vue jour
    const dayTab = page.locator('button, [role="tab"]').filter({ hasText: /jour/i }).first();
    if (await dayTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dayTab.click();
      await page.waitForTimeout(1500);
      await screenshot(page, 'p03-attendance-day', FOLDER);
    }
  });

  // 04 — Activities (discipline) : tous les champs
  test('04 — Activities / Discipline', async ({ page }) => {
    await safeLoginAs(page, 'shepherd');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/activities');
    await page.waitForTimeout(2500);
    await screenshot(page, 'p04-activities-top', FOLDER);

    // Scroll bas
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await screenshot(page, 'p04-activities-bottom', FOLDER);

    // Semaine precedente
    const prev = page.locator('button').filter({ hasText: /Semaine précédente|←|‹/ }).first();
    if (await prev.isVisible({ timeout: 2000 }).catch(() => false)) {
      await prev.click();
      await page.waitForTimeout(1500);
      await screenshot(page, 'p04-activities-prev', FOLDER);
    }
  });

  // 05 — Reports : liste + selection
  test('05 — Reports liste', async ({ page }) => {
    await safeLoginAs(page, 'shepherd');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/reports');
    await page.waitForTimeout(2500);
    await screenshot(page, 'p05-reports-top', FOLDER);

    // Scroll bas
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await screenshot(page, 'p05-reports-bottom', FOLDER);

    // semaine selector
    const sel = page.locator('select').first();
    if (await sel.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sel.selectOption({ index: 1 }).catch(() => null);
      await page.waitForTimeout(1000);
      await screenshot(page, 'p05-reports-filtered', FOLDER);
    }
  });

  // 06 — Alerts
  test('06 — Alerts', async ({ page }) => {
    await safeLoginAs(page, 'shepherd');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/alerts');
    await page.waitForTimeout(2500);
    await screenshot(page, 'p06-alerts', FOLDER);

    // Bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await screenshot(page, 'p06-alerts-bottom', FOLDER);

    // Filtre si dispo
    const filters = page.locator('button, [role="tab"]');
    const count = await filters.count();
    for (let i = 0; i < Math.min(3, count); i++) {
      const text = await filters.nth(i).textContent();
      if (text && text.length < 20) {
        try {
          await filters.nth(i).click({ timeout: 1000 });
          await page.waitForTimeout(800);
          await screenshot(page, `p06-alerts-tab-${i}`, FOLDER);
        } catch {}
      }
    }
  });

  // 07 — Profile
  test('07 — Profile', async ({ page }) => {
    await safeLoginAs(page, 'shepherd');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/profile');
    await page.waitForTimeout(2500);
    await screenshot(page, 'p07-profile', FOLDER);

    // Scroll bas
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await screenshot(page, 'p07-profile-bottom', FOLDER);

    // Toggle role
    const roleSelect = page.locator('select').first();
    if (await roleSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await roleSelect.scrollIntoViewIfNeeded();
      await screenshot(page, 'p07-profile-role-select', FOLDER);
    }

    // Logout button visibility
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) =>
        /Déconnexion|Logout/i.test(b.textContent || ''),
      );
      if (btn) btn.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(500);
    await screenshot(page, 'p07-profile-logout', FOLDER);
  });

  // 08 — Login + pastorale vide
  test('08 — Login + erreurs', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');
    await page.waitForTimeout(2000);
    await screenshot(page, 'p08-login-empty', FOLDER);

    // Erreur creds
    await page.fill('[data-testid="login-email"]', 'wrong@user.com');
    await page.fill('[data-testid="login-password"]', 'wrongpass');
    await page.click('[data-testid="login-submit"]');
    await page.waitForTimeout(3000);
    await screenshot(page, 'p08-login-error', FOLDER);
  });

  // 09 — Test du Plus menu (overflow)
  test('09 — Bottom nav: ouverture du menu Plus', async ({ page }) => {
    await safeLoginAs(page, 'super_admin');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForTimeout(2500);
    await screenshot(page, 'p09-nav-closed', FOLDER);

    // Clic sur Plus
    const plus = page.locator('[data-testid="nav-plus"]');
    if (await plus.isVisible({ timeout: 2000 }).catch(() => false)) {
      await plus.click();
      await page.waitForTimeout(800);
      await screenshot(page, 'p09-nav-plus-open', FOLDER);

      // Hover overlay items
      const overlayItems = page.locator('[role="menu"] a');
      const count = await overlayItems.count();
      console.log(`  Plus menu items: ${count}`);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      await screenshot(page, 'p09-nav-plus-content', FOLDER);

      // Ferme
      await page.keyboard.press('Escape').catch(() => null);
      await page.locator('body').click({ position: { x: 10, y: 10 } }).catch(() => null);
      await page.waitForTimeout(500);
    }
  });

  // 10 — Edge: super_admin pese 360px (Galaxy)
  test('10 — Edge viewport 360x780 (Galaxy)', async ({ page }) => {
    await safeLoginAs(page, 'super_admin');
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/');
    await page.waitForTimeout(2500);
    await screenshot(page, 'p10-360-superadmin-home', FOLDER);

    await page.goto('/members');
    await page.waitForTimeout(2000);
    await screenshot(page, 'p10-360-members', FOLDER);

    await page.goto('/attendance');
    await page.waitForTimeout(2000);
    await screenshot(page, 'p10-360-attendance', FOLDER);
  });

  // 11 — Bottom nav: clic chaque item
  test('11 — Navigation bottom nav click-to-navigate', async ({ page }) => {
    await safeLoginAs(page, 'shepherd');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForTimeout(2500);

    const items = ['Fidèles', 'Présences', 'Discipline', 'Alertes'];
    for (const label of items) {
      const nav = page.locator(`nav[aria-label="Navigation principale"] a, nav[aria-label="Navigation principale"] button`)
        .filter({ hasText: new RegExp('^' + label, 'i') })
        .first();
      if (await nav.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nav.click({ timeout: 3000 }).catch(() => null);
        await page.waitForTimeout(2000);
        await screenshot(page, `p11-nav-go-${label}`, FOLDER);
        await page.goto('/');
        await page.waitForTimeout(2000);
      }
    }
  });

  // 12 — Member detail page actions
  test('12 — Member detail interagit', async ({ page }) => {
    await safeLoginAs(page, 'shepherd');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/members');
    await page.waitForTimeout(2500);

    const firstCard = page.locator('a[href*="/members/"]').first();
    if (await firstCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstCard.click();
      await page.waitForTimeout(2500);
      await screenshot(page, 'p12-member-detail-top', FOLDER);

      // Boutons d'action (Stat, Edit, etc.)
      const buttons = page.locator('button, a[role="button"]');
      const count = await buttons.count();
      for (let i = 0; i < Math.min(5, count); i++) {
        const text = await buttons.nth(i).textContent();
        if (text && /Stat|Modifier|Appeler|Appel|Edit|Visit|Visite/i.test(text)) {
          try {
            await buttons.nth(i).scrollIntoViewIfNeeded({ timeout: 1000 });
            await buttons.nth(i).click({ timeout: 2000 });
            await page.waitForTimeout(2000);
            await screenshot(page, `p12-member-action-${i}`, FOLDER);
            await page.goBack();
            await page.waitForTimeout(1500);
            break;
          } catch {}
        }
      }
    }
  });

  // 13 — Profile menu admin (super_admin doit avoir accès au backoffice)
  test('13 — Bottom nav backoffice mobile', async ({ page }) => {
    await safeLoginAs(page, 'super_admin');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForTimeout(2000);

    const admin = page.locator('[data-testid="nav-backoffice"]').first();
    if (await admin.isVisible({ timeout: 2000 }).catch(() => false)) {
      await admin.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'p13-backoffice-mobile', FOLDER);

      // sortir
      await page.goto('/');
      await page.waitForTimeout(2000);
    }
  });

  // 14 — Error states & 404
  test('14 — Page 404 + erreurs', async ({ page }) => {
    await safeLoginAs(page, 'shepherd');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/this-does-not-exist');
    await page.waitForTimeout(2000);
    await screenshot(page, 'p14-404', FOLDER);
  });

  // 15 — Pastorale vide (compte sans membres)
  test('15 — Empty state pastoral', async ({ page }) => {
    // On force un etat vide via intercept : on stub les queries
    await safeLoginAs(page, 'shepherd');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.route('**/rest/v1/members**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    await page.goto('/members');
    await page.waitForTimeout(2000);
    await screenshot(page, 'p15-members-empty', FOLDER);

    await page.goto('/attendance');
    await page.waitForTimeout(2000);
    await screenshot(page, 'p15-attendance-empty', FOLDER);
  });
});

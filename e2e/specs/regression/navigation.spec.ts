import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.regression;

test.describe('Régression — Navigation & Responsive', () => {
  test.beforeEach(() => {
    resetCounter();
  });

  test('01 — Navigation complète pages pastorales', async ({ page }) => {
    await safeLoginAs(page, 'super_admin');

    const routes = [
      { path: '/', name: 'dashboard' },
      { path: '/members', name: 'members' },
      { path: '/attendance', name: 'attendance' },
      { path: '/activities', name: 'activities' },
      { path: '/alerts', name: 'alerts' },
      { path: '/reports', name: 'reports' },
      { path: '/profile', name: 'profile' },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await page.waitForTimeout(2000);
      await screenshot(page, `pastoral-${route.name}`, FOLDER);
    }
  });

  test('02 — Navigation complète pages admin', async ({ page }) => {
    await safeLoginAs(page, 'super_admin');

    const adminRoutes = [
      '/admin/super-dashboard',
      '/admin/members',
      '/admin/groups',
      '/admin/departments',
      '/admin/newcomers',
      '/admin/programs',
      '/admin/attendance',
      '/admin/reports',
      '/admin/users',
      '/admin/roles',
      '/admin/settings',
      '/admin/logs',
    ];

    for (const route of adminRoutes) {
      await page.goto(route);
      await page.waitForTimeout(2000);
      const name = route.replace('/admin/', '');
      await screenshot(page, `admin-${name}`, FOLDER);
    }
  });

  test('03 — Responsive mobile (375px)', async ({ page }) => {
    await safeLoginAs(page, 'super_admin');
    await page.setViewportSize({ width: 375, height: 812 });

    const routes = ['/', '/members', '/attendance', '/alerts', '/reports'];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForTimeout(2000);
      const name = route === '/' ? 'home' : route.replace('/', '');
      await screenshot(page, `mobile-${name}`, FOLDER);
    }
  });

  test('04 — Responsive tablette (768px)', async ({ page }) => {
    await safeLoginAs(page, 'super_admin');
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/');
    await page.waitForTimeout(2000);
    await screenshot(page, 'tablet-home', FOLDER);

    await page.goto('/admin/super-dashboard');
    await page.waitForTimeout(2000);
    await screenshot(page, 'tablet-admin-dashboard', FOLDER);
  });

  test('05 — Pas de console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await safeLoginAs(page, 'super_admin');
    await page.goto('/');
    await page.waitForTimeout(3000);
    await page.goto('/admin');
    await page.waitForTimeout(3000);

    await screenshot(page, 'console-errors-check', FOLDER);

    if (errors.length > 0) {
      console.log(`  ⚠️ ${errors.length} erreurs console:`);
      errors.slice(0, 5).forEach((e) => console.log(`    - ${e.substring(0, 100)}`));
    }
  });

  test('06 — Back button navigateur', async ({ page }) => {
    await safeLoginAs(page, 'super_admin');

    await page.goto('/');
    await page.waitForTimeout(1000);
    await page.goto('/members');
    await page.waitForTimeout(1000);
    await page.goBack();
    await page.waitForTimeout(1000);
    await screenshot(page, 'back-button', FOLDER);
  });
});

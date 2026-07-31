import { test, expect } from '@playwright/test';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = '02-pastoral/08-member-stats';

test.describe('Stats fidèle — Visual', () => {
  test('01 — Login → Members → Stats → Capture complète', async ({ page }) => {
    resetCounter();

    // Login
    await page.goto('/login', { timeout: 60_000 });
    await page.waitForSelector('[data-testid="login-email"]', { timeout: 15_000 });
    await page.fill('[data-testid="login-email"]', 'ezekiel@eglise.org');
    await page.fill('[data-testid="login-password"]', 'azerty');
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
    await page.waitForTimeout(2000);
    console.log(`  After login: ${page.url()}`);

    // Members page
    await page.goto('/members', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    console.log(`  Members: ${page.url()}`);
    await screenshot(page, 'members-list', FOLDER);

    // Stats button
    const statsBtn = page.locator('button:has-text("Stats")').first();
    const visible = await statsBtn.isVisible().catch(() => false);
    console.log(`  Stats button: ${visible}`);

    if (visible) {
      await statsBtn.click();
    } else {
      // Fallback: find member ID in page
      const html = await page.content();
      const match = html.match(/\/members\/([a-f0-9-]{36})/);
      if (match) {
        console.log(`  Fallback to: /members/${match[1]}`);
        await page.goto(`/members/${match[1]}`);
      }
    }

    await page.waitForTimeout(5000);
    console.log(`  Stats URL: ${page.url()}`);
    await screenshot(page, 'stats-page', FOLDER);
    await page.screenshot({ path: `e2e/test-results/screenshots/${FOLDER}/stats-full.png`, fullPage: true });

    // Scroll down for charts
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(1000);
    await screenshot(page, 'stats-charts', FOLDER);

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await screenshot(page, 'stats-bottom', FOLDER);

    // Vérifier contenu
    const body = await page.textContent('body');
    const content = body?.substring(0, 1000) || '';
    console.log(`\n  === PAGE CONTENT ===`);
    console.log(content);
    console.log(`  === END ===\n`);
  });

  test('02 — Vue mobile', async ({ page }) => {
    resetCounter();
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/login', { timeout: 60_000 });
    await page.waitForSelector('[data-testid="login-email"]', { timeout: 15_000 });
    await page.fill('[data-testid="login-email"]', 'ezekiel@eglise.org');
    await page.fill('[data-testid="login-password"]', 'azerty');
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
    await page.waitForTimeout(2000);

    await page.goto('/members', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const html = await page.content();
    const match = html.match(/\/members\/([a-f0-9-]{36})/);
    if (match) {
      await page.goto(`/members/${match[1]}`);
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `e2e/test-results/screenshots/${FOLDER}/mobile-full.png`, fullPage: true });
      console.log(`  Mobile stats: ${page.url()}`);
    }
  });
});

import { test, expect, safeLoginAs } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = '02-pastoral/08-member-stats';

test.describe('Stats fidèle — Diagnostic', () => {
  test('01 — Contenu de la page stats', async ({ page }) => {
    resetCounter();
    const role = await safeLoginAs(page, 'super_admin');
    console.log(`  Logged in as: ${role}`);

    // Members page
    await page.goto('/members', { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(3000);
    console.log(`  Members URL: ${page.url()}`);

    // Click Stats
    const statsBtn = page.locator('button:has-text("Stats")').first();
    const visible = await statsBtn.isVisible().catch(() => false);
    console.log(`  Stats button: ${visible}`);

    if (visible) {
      await statsBtn.click();
      await page.waitForTimeout(5000);
    } else {
      // Fallback: find member ID
      const html = await page.content();
      const match = html.match(/\/members\/([a-f0-9-]{36})/);
      if (match) {
        await page.goto(`/members/${match[1]}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
      }
    }

    console.log(`  Stats URL: ${page.url()}`);

    // Check elements
    const checks = [
      ['Retour', 'a:has-text("Retour")'],
      ['Période', 'text=Période'],
      ['1 mois', 'button:has-text("1 mois")'],
      ['Taux', 'text=Taux'],
      ['Régularité', 'text=Régularité'],
      ['Semaines', 'text=Semaines'],
      ['Évolution', 'text=Évolution'],
      ['Programmes', 'text=programme'],
      ['Dimanche', 'text=Dimanche'],
      ['Recharts', '.recharts-responsive-container'],
      ['Error', '[class*="error"]'],
    ];

    for (const [name, sel] of checks) {
      const count = await page.locator(sel).count();
      const vis = count > 0 ? await page.locator(sel).first().isVisible().catch(() => false) : false;
      console.log(`  ${vis ? '✅' : '❌'} ${name} (${count})`);
    }

    // Main content
    const main = await page.locator('.min-h-screen').first().textContent().catch(() => '');
    console.log(`\n  === CONTENT (1500) ===`);
    console.log(main?.substring(0, 1500));
    console.log(`  === END ===\n`);

    await screenshot(page, 'diag-stats', FOLDER);
  });
});

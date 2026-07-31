import { test, expect, safeLoginAs } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = '02-pastoral/08-member-stats';

test.describe('Stats fidèle — Vérification boutons', () => {
  test('01 — Boutons dans les tuiles membres', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'super_admin');

    await page.goto('/members', { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(3000);

    await screenshot(page, 'members-cards-buttons', FOLDER);

    // Vérifier que les boutons sont visibles et dans les cartes
    const statsBtns = page.locator('button:has-text("Stats"), button[title*="statistiques"]');
    const statsCount = await statsBtns.count();
    console.log(`  Stats buttons: ${statsCount}`);

    // Vérifier qu'aucun bouton ne dépasse de la carte
    const cards = page.locator('.card-luxe');
    const cardCount = await cards.count();
    console.log(`  Member cards: ${cardCount}`);

    // Vérifier le overflow
    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      const card = cards.nth(i);
      const cardBox = await card.boundingBox();
      if (!cardBox) continue;

      const buttons = card.locator('button');
      const btnCount = await buttons.count();
      for (let j = 0; j < btnCount; j++) {
        const btn = buttons.nth(j);
        const btnBox = await btn.boundingBox();
        if (!btnBox) continue;
        const overflow = btnBox.x + btnBox.width > cardBox.x + cardBox.width + 2;
        if (overflow) {
          console.log(`  ❌ Button ${j} overflows card ${i}: btn right=${(btnBox.x + btnBox.width).toFixed(0)}, card right=${(cardBox.x + cardBox.width).toFixed(0)}`);
        }
      }
    }

    // Full page screenshot
    await page.screenshot({ path: `e2e/test-results/screenshots/${FOLDER}/buttons-check-full.png`, fullPage: true });
    console.log(`  URL: ${page.url()}`);
  });

  test('02 — Stats page mobile', async ({ page }) => {
    resetCounter();
    await page.setViewportSize({ width: 375, height: 812 });
    await safeLoginAs(page, 'super_admin');

    await page.goto('/members', { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(3000);

    await screenshot(page, 'mobile-members-buttons', FOLDER);
    await page.screenshot({ path: `e2e/test-results/screenshots/${FOLDER}/mobile-buttons-full.png`, fullPage: true });
  });
});

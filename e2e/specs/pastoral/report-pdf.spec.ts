import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';
import * as fs from 'fs';
import * as path from 'path';

const FOLDER = SCREENSHOT_FOLDERS.pastoral.reports;
const PDF_DIR = path.join('e2e', 'test-results', 'pdfs');

test.describe('Rapport PDF — génération et capture', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
  });

  test('capture-pdf — Génère le PDF via émulation print media et sauvegarde le fichier', async ({ page, browser }) => {
    fs.mkdirSync(PDF_DIR, { recursive: true });

    // Login as shepherd
    await safeLoginAs(page, 'shepherd');

    // Aller sur la page des rapports
    await page.goto('/reports', { timeout: 60_000 });
    await page.waitForTimeout(3000);

    // Stubber window.print() AVANT le clic pour éviter que la boîte de
    // dialogue native ne bloque Playwright.
    await page.addInitScript(() => {
      // @ts-ignore
      window.print = () => {
        console.log('window.print() intercepté');
      };
    });
    // Recharger pour appliquer le stub
    await page.goto('/reports', { timeout: 60_000 });
    await page.waitForTimeout(3000);

    // Cliquer sur le bouton "Télécharger (PDF)"
    const pdfBtn = page.locator('button').filter({ hasText: /télécharger.*pdf|pdf/i }).first();
    await pdfBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await pdfBtn.click();

    // Attendre que le bloc #shepherd-report soit dans le DOM
    await page.waitForSelector('#shepherd-report', { state: 'attached', timeout: 10_000 });
    await page.waitForTimeout(1500);

    // Vérifier que printData est bien set
    const debugInfo = await page.evaluate(() => {
      const el = document.getElementById('shepherd-report');
      const h1 = el?.querySelector('h1');
      const rect = el?.getBoundingClientRect();
      const h1Rect = h1?.getBoundingClientRect();
      const cs = el ? getComputedStyle(el) : null;
      const csH1 = h1 ? getComputedStyle(h1) : null;
      return {
        exists: !!el,
        innerHTMLLength: el?.innerHTML?.length || 0,
        bodyHeight: document.body.scrollHeight,
        elRect: rect ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height } : null,
        h1Text: h1?.textContent?.slice(0, 80),
        h1Rect: h1Rect ? { top: h1Rect.top, left: h1Rect.left, width: h1Rect.width, height: h1Rect.height } : null,
        elDisplay: cs?.display,
        elPosition: cs?.position,
        elVisibility: cs?.visibility,
        h1Display: csH1?.display,
        h1Visibility: csH1?.visibility,
        h1Height: csH1?.height,
      };
    });
    console.log(`  🔍 Debug: ${JSON.stringify(debugInfo)}`);

    // Capture d'écran du DOM en mode SCREEN (avant d'émuler print)
    // On isole complètement le bloc .print-only du reste de la page.
    await page.addStyleTag({
      content: `
        @media screen {
          .print-only {
            display: block !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 99999 !important;
            background: white !important;
            overflow: auto !important;
          }
          .print-only * { visibility: visible !important; }
        }
      `,
    });
    await page.waitForTimeout(500);

    try {
      await page.locator('#shepherd-report').screenshot({
        path: path.join(PDF_DIR, 'shepherd-report-dom.png'),
        timeout: 10_000,
      });
      console.log(`  📸 DOM capturé: shepherd-report-dom.png`);
    } catch (e) {
      console.log(`  ⚠️ Screenshot DOM impossible: ${(e as Error).message}`);
    }

    // Émuler le média "print" pour le PDF
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(500);

    const pdfPath = path.join(PDF_DIR, 'shepherd-report.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      landscape: true,
      margin: { top: '8mm', right: '8mm', bottom: '8mm', left: '8mm' },
      printBackground: true,
    });

    // Restaurer le média écran pour la suite
    await page.emulateMedia({ media: 'screen' });

    // Vérifier que le PDF a bien été créé et a une taille raisonnable
    const stat = fs.statSync(pdfPath);
    console.log(`  📄 PDF généré: ${pdfPath} (${(stat.size / 1024).toFixed(1)} Ko)`);
    expect(stat.size).toBeGreaterThan(5_000);

    // Vérifier le contenu via un second passage Playwright sur le PDF
    const ctx = await browser.newContext();
    const pdfPage = await ctx.newPage();
    // Le viewer natif Chromium ne charge pas les PDF — on vérifie au moins
    // que le fichier commence par %PDF (magic bytes) et a plusieurs pages.
    const header = fs.readFileSync(pdfPath, { encoding: 'binary' }).slice(0, 4);
    expect(header).toBe('%PDF');

    // Compter les pages via le nombre d'occurrences "/Type /Page" (hors /Pages)
    const buf = fs.readFileSync(pdfPath, 'binary');
    const pageMatches = buf.match(/\/Type\s*\/Page[^s]/g) || [];
    console.log(`  📄 Nombre de pages détectées: ${pageMatches.length}`);
    expect(pageMatches.length).toBe(1); // On veut exactement 1 page

    // Dimensions de chaque page (MediaBox)
    const mediaBoxes = buf.match(/\/MediaBox\s*\[\s*[\d.]+\s+[\d.]+\s+[\d.]+\s+[\d.]+\s*\]/g) || [];
    console.log(`  📐 MediaBoxes: ${mediaBoxes.join(' | ')}`);

    // Métadonnées ProdBuilder / Creator
    const creator = (buf.match(/\/Creator\s*\(([^)]*)\)/) || [])[1];
    const producer = (buf.match(/\/Producer\s*\(([^)]*)\)/) || [])[1];
    console.log(`  📝 Creator: ${creator} | Producer: ${producer}`);

    await ctx.close();
  });
});
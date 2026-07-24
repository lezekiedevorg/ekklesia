import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

let stepCounter = 0;

/**
 * Capture un screenshot nommé et organisé dans l'arborescence.
 *
 * @param page - Instance Playwright Page
 * @param name - Descriptif du screenshot (ex: "members-list", "modal-create-open")
 * @param folder - Dossier relatif dans screenshots/ (ex: "02-pastoral/02-members")
 */
export async function screenshot(page: Page, name: string, folder: string) {
  stepCounter++;
  const padded = String(stepCounter).padStart(2, '0');
  const fileName = `${padded}-${name}.png`;

  const dirPath = path.join('e2e', 'test-results', 'screenshots', folder);
  fs.mkdirSync(dirPath, { recursive: true });

  const filePath = path.join(dirPath, fileName);

  await page.screenshot({
    path: filePath,
    fullPage: true,
  });

  console.log(`  📸 Screenshot: ${filePath}`);
}

/**
 * Capture un screenshot de bug avec métadonnées.
 */
export async function bugScreenshot(page: Page, bugId: string, description: string) {
  const fileName = `${bugId}-${description.replace(/\s+/g, '-').toLowerCase()}.png`;
  const dirPath = path.join('e2e', 'test-results', 'screenshots', '_bugs');
  fs.mkdirSync(dirPath, { recursive: true });

  const filePath = path.join(dirPath, fileName);

  await page.screenshot({
    path: filePath,
    fullPage: true,
  });

  console.log(`  🐛 Bug screenshot: ${filePath}`);
  return filePath;
}

/**
 * Remet le compteur à zéro (appeler au début de chaque test).
 */
export function resetCounter() {
  stepCounter = 0;
}

/**
 * Génère le rapport de bugs en markdown.
 */
export function generateBugReport(bugs: Array<{
  id: string;
  title: string;
  screenshot: string;
  video?: string;
  role: string;
  page: string;
  steps: string;
  expected: string;
  actual: string;
}>) {
  const lines = [
    '# Rapport de Bugs — Tests E2E',
    '',
    `Date: ${new Date().toISOString()}`,
    `Total bugs trouvés: ${bugs.length}`,
    '',
    '---',
    '',
  ];

  for (const bug of bugs) {
    lines.push(
      `## ${bug.id}: ${bug.title}`,
      '',
      `- **Screenshot**: \`${bug.screenshot}\``,
      bug.video ? `- **Video**: \`${bug.video}\`` : '',
      `- **Rôle**: ${bug.role}`,
      `- **Page**: ${bug.page}`,
      `- **Étapes**: ${bug.steps}`,
      `- **Attendu**: ${bug.expected}`,
      `- **Résultat**: ${bug.actual}`,
      '',
      '---',
      '',
    );
  }

  const reportPath = path.join('e2e', 'test-results', 'BUG-REPORT.md');
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf-8');
  console.log(`\n📋 Rapport de bugs généré: ${reportPath}`);
}

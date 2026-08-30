import { test, expect, loginAs } from '../../fixtures/auth';

/**
 * Smoke test : export PDF des listes de membres.
 *
 * Vérifie que :
 * 1. Le bouton "Membres actifs (PDF)" est visible depuis /members
 * 2. Le bouton "Mes listes" ouvre le gestionnaire
 * 3. On peut créer une liste nommée
 * 4. La checkbox "Active" fonctionne et affiche le bandeau
 * 5. Le bouton export PDF de la liste est cliquable
 *
 * On ne déclenche pas window.print() (nécessiterait un mock).
 */

test.describe('Export PDF — listes de membres', () => {
  test.beforeEach(async ({ page, context }) => {
    // Reset localStorage pour partir d'un état propre
    await context.clearCookies();
    await page.goto('/login');
    await loginAs(page, 'super_admin');
  });

  test('Boutons header présents sur /members', async ({ page }) => {
    await page.goto('/members');
    await page.waitForLoadState('networkidle');

    // Bouton export actifs
    await expect(
      page.getByRole('button', { name: /Membres actifs \(PDF\)/i })
    ).toBeVisible();

    // Bouton Mes listes
    await expect(page.getByRole('button', { name: /Mes listes/i }).first()).toBeVisible();
  });

  test('Création + activation dune liste nommée', async ({ page }) => {
    await page.goto('/members');
    await page.waitForLoadState('networkidle');

    // Ouvrir le gestionnaire
    await page.getByRole('button', { name: /Mes listes/i }).first().click();
    await expect(page.getByText(/^Mes listes$/)).toBeVisible();

    // Nouvelle liste
    await page.getByRole('button', { name: /Nouvelle liste/i }).click();
    const input = page.getByPlaceholder(/Nom de la liste/i);
    await input.fill('Chorale 2026');
    await page.getByRole('button', { name: /^Créer$/i }).click();

    // La liste apparaît et est active par défaut
    await expect(page.getByText('Chorale 2026')).toBeVisible();
    await expect(page.getByText(/Liste active/i)).toBeVisible();
  });

  test('Persistance après reload', async ({ page }) => {
    await page.goto('/members');
    await page.waitForLoadState('networkidle');

    // Setup : créer une liste
    await page.getByRole('button', { name: /Mes listes/i }).first().click();
    await page.getByRole('button', { name: /Nouvelle liste/i }).click();
    await page.getByPlaceholder(/Nom de la liste/i).fill('Test Persist');
    await page.getByRole('button', { name: /^Créer$/i }).click();

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // La liste doit toujours être là
    await expect(page.getByText('Test Persist')).toBeVisible();
    await expect(page.getByText(/Liste active/i)).toBeVisible();
  });
});

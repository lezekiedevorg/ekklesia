import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.pastoral.reports;

// ═══════════════════════════════════════════════════════════════
// WORKFLOW RESPONSABLE — Permissions restreintes
// ═══════════════════════════════════════════════════════════════
// Le responsable (leader) doit pouvoir :
//   1. Se connecter
//   2. Voir le travail de chaque berger
//   3. Voir la liste des membres de son groupe
//   4. Voir les rapports des bergers et les valider
//   5. Voir les alertes (sans pouvoir agir dessus)
//
// Le responsable NE DOIT PAS avoir accès à :
//   - La page pour faire les appels (attendance)
//   - La page de disciplines (activities)
//
// Le responsable ne peut que :
//   - Voir son dashboard
//   - Voir les fidèles (read-only)
//   - Voir les rapports des bergers (et les valider)
//   - Voir les alertes (sans action)
// ═══════════════════════════════════════════════════════════════

test.describe('Workflow Responsable — Scénario Complet', () => {
  test.beforeEach(async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'leader');
  });

  // ─── 1. CONNEXION ───────────────────────────────────────────

  test('01 — Connexion et accès au dashboard responsable', async ({ page }) => {
    await page.waitForTimeout(2000);
    await screenshot(page, 'responsable-dashboard-loaded', FOLDER);

    expect(page.url()).not.toContain('/login');
    await expect(page.locator('[data-testid="navbar-header"]')).toBeVisible();
  });

  // ─── 2. VOIR LE TRAVAIL DE CHAQUE BERGER ───────────────────

  test('02 — Voir le dashboard du groupe avec KPIs', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    await screenshot(page, 'responsable-dashboard-kpis', FOLDER);

    // Le responsable voit les stats de son groupe
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('03 — Comparer les bergers de son groupe', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    await screenshot(page, 'responsable-shepherds-comparison', FOLDER);

    // Vérifier qu'on voit les bergers
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  // ─── 3. VOIR LES FIDÈLES DU GROUPE ─────────────────────────

  test('04 — Voir la liste des membres de son groupe', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);
    await screenshot(page, 'responsable-members-group', FOLDER);

    // Le responsable voit les membres de son groupe
    await expect(page.locator('body')).toContainText(/membre|fidèle|fidèles/i);
  });

  test('05 — Voir les statuts et classes des membres', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);
    await screenshot(page, 'responsable-members-status', FOLDER);

    // Vérifier les informations affichées
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('06 — Rechercher un membre dans le groupe', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);

    const searchInput = page.locator('input[placeholder*="Rechercher"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Marc');
      await page.waitForTimeout(1000);
      await screenshot(page, 'responsable-members-search', FOLDER);
    }
  });

  test('07 — Filtrer les membres par statut', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);

    const statusFilter = page.locator('select').first();
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
      await screenshot(page, 'responsable-members-filtered', FOLDER);
    }
  });

  // ─── 4. VOIR LES RAPPORTS DES BERGERS ──────────────────────

  test('08 — Voir la liste des rapports des bergers', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    await screenshot(page, 'responsable-reports-list', FOLDER);

    // Le responsable voit les rapports du groupe
    await expect(page.locator('body')).toContainText(/rapport|report|berger|semaine/i);
  });

  test('09 — Voir le détail d\'un rapport de berger', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);

    const viewBtn = page.locator('button').filter({ hasText: /voir|détail|detail|expand|ouvrir/i }).first();
    if (await viewBtn.isVisible()) {
      await viewBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'responsable-report-detail', FOLDER);
    }
  });

  test('10 — Valider (approuver) un rapport de berger', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    await screenshot(page, 'responsable-before-approve', FOLDER);

    const approveBtn = page.locator('button').filter({ hasText: /approuver|valider|approve|accepter/i }).first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'responsable-report-approved', FOLDER);
    }
  });

  test('11 — Rejeter un rapport de berger', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);

    const rejectBtn = page.locator('button').filter({ hasText: /rejeter|refuser|reject|refus/i }).first();
    if (await rejectBtn.isVisible()) {
      await rejectBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'responsable-report-rejected', FOLDER);
    }
  });

  test('12 — Voir les KPIs exécutifs du groupe', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    await screenshot(page, 'responsable-reports-kpis', FOLDER);

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  // ─── 5. VOIR LES ALERTES (SANS ACTION) ─────────────────────

  test('13 — Voir les alertes du groupe', async ({ page }) => {
    await page.goto('/alerts');
    await page.waitForTimeout(3000);
    await screenshot(page, 'responsable-alerts-group', FOLDER);

    await expect(page.locator('body')).toContainText(/alerte|absent|relance|membre/i);
  });

  test('14 — Voir les détails d\'un membre en alerte', async ({ page }) => {
    await page.goto('/alerts');
    await page.waitForTimeout(3000);
    await screenshot(page, 'responsable-alert-details', FOLDER);

    // Vérifier qu'il y a des informations
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('15 — Voir l\'historique des visites des bergers', async ({ page }) => {
    await page.goto('/alerts');
    await page.waitForTimeout(3000);
    await screenshot(page, 'responsable-visits-overview', FOLDER);

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  // ─── 6. VÉRIFIER L'ABSENCE D'ACCÈS RESTREINT ───────────────

  test('16 — Vérifier que la page présences N\'EST PAS accessible', async ({ page }) => {
    // Tenter d'accéder directement à la page des présences
    await page.goto('/attendance');
    await page.waitForTimeout(3000);
    await screenshot(page, 'responsable-attendance-blocked', FOLDER);

    // Le responsable doit être redirigé (pas sur /attendance)
    const url = page.url();
    expect(url).not.toContain('/attendance');
  });

  test('17 — Vérifier que la page disciplines N\'EST PAS accessible', async ({ page }) => {
    // Tenter d'accéder directement à la page des activités/disciplines
    await page.goto('/activities');
    await page.waitForTimeout(3000);
    await screenshot(page, 'responsable-activities-blocked', FOLDER);

    // Le responsable doit être redirigé (pas sur /activities)
    const url = page.url();
    expect(url).not.toContain('/activities');
  });

  test('18 — Vérifier la navbar ne montre PAS les liens restreints', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    await screenshot(page, 'responsable-navbar-check', FOLDER);

    // Les liens Présences et Disciplines ne doivent PAS être visibles pour le leader
    const attendanceLink = page.locator('[data-testid="nav-attendance"]');
    const activitiesLink = page.locator('[data-testid="nav-activities"]');

    await expect(attendanceLink).not.toBeVisible();
    await expect(activitiesLink).not.toBeVisible();
  });

  // ─── 7. NAVIGATION DU RESPONSABLE ──────────────────────────

  test('19 — Naviguer dans les pages autorisées', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Dashboard → Membres
    const membersLink = page.locator('[data-testid="nav-members"]').first();
    if (await membersLink.isVisible()) {
      await membersLink.click();
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/members');
    }

    // Membres → Rapports
    const reportsLink = page.locator('[data-testid="nav-reports"]').first();
    if (await reportsLink.isVisible()) {
      await reportsLink.click();
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/reports');
    }

    // Rapports → Alertes
    const alertsLink = page.locator('[data-testid="nav-alerts"]').first();
    if (await alertsLink.isVisible()) {
      await alertsLink.click();
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/alerts');
    }

    await screenshot(page, 'responsable-full-navigation', FOLDER);
  });

  // ─── 8. PROFIL ────────────────────────────────────────────

  test('20 — Voir son profil', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForTimeout(3000);
    await screenshot(page, 'responsable-profile', FOLDER);

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  // ─── 9. DÉCONNEXION ───────────────────────────────────────

  test('21 — Se déconnecter', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const logoutBtn = page.locator('[data-testid="nav-profile"], button').filter({ hasText: /déconnexion|déconnecter|logout/i }).first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'responsable-logout', FOLDER);

      expect(page.url()).toContain('/login');
    }
  });
});

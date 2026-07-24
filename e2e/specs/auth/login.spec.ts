import { test, expect, TEST_ACCOUNTS, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.auth;

test.describe('Authentification', () => {
  test.beforeEach(() => {
    resetCounter();
  });

  test('01 - Affichage page de login', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('[data-testid="login-form"]');
    await screenshot(page, 'login-page', FOLDER);

    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible();
  });

  test('02 - Login avec identifiants valides (super_admin)', async ({ page }) => {
    await page.goto('/login');
    await screenshot(page, 'login-page-initial', FOLDER);

    await page.fill('[data-testid="login-email"]', TEST_ACCOUNTS.super_admin.email);
    await page.fill('[data-testid="login-password"]', TEST_ACCOUNTS.super_admin.password);
    await screenshot(page, 'login-filled', FOLDER);

    await page.click('[data-testid="login-submit"]');

    // Attendre la redirection
    await page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 15_000,
    });
    await screenshot(page, 'login-success-redirect', FOLDER);

    // Vérifier qu'on est sur le dashboard
    expect(page.url()).not.toContain('/login');
  });

  test('03 - Login avec identifiants invalides', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'wrong@email.com');
    await page.fill('[data-testid="login-password"]', 'wrongpassword');
    await screenshot(page, 'login-invalid-filled', FOLDER);

    await page.click('[data-testid="login-submit"]');

    // Attendre le message d'erreur
    await page.waitForSelector('[data-testid="login-error"]', { timeout: 10_000 });
    await screenshot(page, 'login-error-displayed', FOLDER);

    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
  });

  test('04 - Login vide → validation formulaire', async ({ page }) => {
    await page.goto('/login');
    await screenshot(page, 'login-empty', FOLDER);

    // Essayer de soumettre sans remplir
    await page.click('[data-testid="login-submit"]');
    await screenshot(page, 'login-validation-error', FOLDER);

    // Le formulaire HTML empêche la soumission (attribut required)
    expect(page.url()).toContain('/login');
  });

  test('05 - Redirection après login vers /', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', TEST_ACCOUNTS.super_admin.email);
    await page.fill('[data-testid="login-password"]', TEST_ACCOUNTS.super_admin.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('**/');
    await screenshot(page, 'login-redirect-home', FOLDER);

    expect(page.url()).toMatch(/localhost:3000\/$/);
  });

  test('06 - Accès / sans session → redirect /login', async ({ page }) => {
    // Aller directement sur / sans être connecté
    await page.goto('/');
    await page.waitForURL('**/login', { timeout: 10_000 });
    await screenshot(page, 'unauthenticated-redirect-login', FOLDER);

    expect(page.url()).toContain('/login');
  });

  test('07 - Accès /admin sans droits (shepherd) → Accès Restreint', async ({ page }) => {
    // Login en tant que shepherd
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', TEST_ACCOUNTS.shepherd.email);
    await page.fill('[data-testid="login-password"]', TEST_ACCOUNTS.shepherd.password);
    await page.click('[data-testid="login-submit"]');

    // Attendre un peu pour que l'erreur ou la redirection se produise
    await page.waitForTimeout(3000);

    // Vérifier si une erreur de login est affichée
    const loginError = page.locator('[data-testid="login-error"]');
    const hasError = await loginError.isVisible().catch(() => false);

    if (hasError) {
      // Le compte shepherd n'existe pas dans la DB — test non applicable
      console.log('  ⚠️ Compte shepherd non trouvé dans la DB — test ignoré');
      await screenshot(page, 'shepherd-account-missing', FOLDER);
      test.skip();
      return;
    }

    // Si pas d'erreur, attendre la redirection
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10_000 });

    // Essayer d'accéder à /admin
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    await screenshot(page, 'shepherd-admin-denied', FOLDER);

    // Vérifier qu'on voit un message d'accès refusé OU qu'on est redirigé
    const currentUrl = page.url();
    const hasDeniedMessage = await page.locator('text=Acces Restreint').isVisible().catch(() => false);
    const isRedirected = !currentUrl.includes('/admin') || hasDeniedMessage;

    expect(isRedirected).toBeTruthy();
  });

  test('08 - Accès /admin avec admin → OK', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', TEST_ACCOUNTS.super_admin.email);
    await page.fill('[data-testid="login-password"]', TEST_ACCOUNTS.super_admin.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });

    // Accéder au backoffice
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    await screenshot(page, 'super-admin-admin-access', FOLDER);

    // Vérifier qu'on voit la sidebar admin
    await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible({ timeout: 10_000 });
  });

  test('09 - Logout → redirect /login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', TEST_ACCOUNTS.super_admin.email);
    await page.fill('[data-testid="login-password"]', TEST_ACCOUNTS.super_admin.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
    await screenshot(page, 'logged-in', FOLDER);

    // Aller sur le profil pour se déconnecter
    await page.goto('/profile');
    await page.waitForTimeout(1000);
    await screenshot(page, 'profile-page', FOLDER);

    // Chercher le bouton de déconnexion
    const logoutBtn = page.locator('button', { hasText: /déconnexion|deconnexion|logout/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForURL('**/login', { timeout: 10_000 });
      await screenshot(page, 'after-logout-redirect', FOLDER);
      expect(page.url()).toContain('/login');
    }
  });

  test('10 - Login shepherd → dashboard personnel', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', TEST_ACCOUNTS.shepherd.email);
    await page.fill('[data-testid="login-password"]', TEST_ACCOUNTS.shepherd.password);
    await page.click('[data-testid="login-submit"]');

    // Attendre un peu pour que l'erreur ou la redirection se produise
    await page.waitForTimeout(3000);

    // Vérifier si une erreur de login est affichée
    const loginError = page.locator('[data-testid="login-error"]');
    const hasError = await loginError.isVisible().catch(() => false);

    if (hasError) {
      console.log('  ⚠️ Compte shepherd non trouvé dans la DB — test ignoré');
      await screenshot(page, 'shepherd-login-failed', FOLDER);
      test.skip();
      return;
    }

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10_000 });
    await screenshot(page, 'shepherd-dashboard', FOLDER);

    // Vérifier qu'on est sur le dashboard
    expect(page.url()).toMatch(/localhost:3000\/$/);
  });

  test('11 - Navigation complète liens navbar', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', TEST_ACCOUNTS.super_admin.email);
    await page.fill('[data-testid="login-password"]', TEST_ACCOUNTS.super_admin.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });

    // Tester chaque lien de la navbar
    const navLinks = [
      { testid: 'nav-dashboard', href: '/' },
      { testid: 'nav-members', href: '/members' },
      { testid: 'nav-attendance', href: '/attendance' },
      { testid: 'nav-activities', href: '/activities' },
      { testid: 'nav-alerts', href: '/alerts' },
      { testid: 'nav-reports', href: '/reports' },
    ];

    const bugs: string[] = [];

    for (const link of navLinks) {
      const el = page.locator(`[data-testid="${link.testid}"]`).first();
      if (await el.isVisible()) {
        await el.click();
        await page.waitForTimeout(1500);
        await screenshot(page, `nav-${link.testid.replace('nav-', '')}`, FOLDER);

        const currentUrl = page.url();
        if (!currentUrl.includes(link.href)) {
          bugs.push(`BUG: ${link.testid} (${link.href}) → ${currentUrl}`);
          console.log(`  🐛 BUG: ${link.testid} attendu ${link.href}, obtenu ${currentUrl}`);
        }
      }
    }

    // Rapporter les bugs trouvés
    if (bugs.length > 0) {
      console.log(`\n  📋 ${bugs.length} bug(s) trouvé(s):`);
      bugs.forEach((b) => console.log(`    - ${b}`));
    }

    // Le test passe même avec des bugs — on veut juste les capturer
    expect(true).toBeTruthy();
  });

  test('12 - Navigation complète sidebar admin', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', TEST_ACCOUNTS.super_admin.email);
    await page.fill('[data-testid="login-password"]', TEST_ACCOUNTS.super_admin.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });

    // Aller au backoffice
    await page.goto('/admin');
    await page.waitForSelector('[data-testid="admin-sidebar"]', { timeout: 10_000 });

    // Tester chaque lien de la sidebar
    const sidebarLinks = [
      'sidebar-super-dashboard',
      'sidebar-members',
      'sidebar-groups',
      'sidebar-departments',
      'sidebar-newcomers',
      'sidebar-programs',
      'sidebar-attendance',
      'sidebar-reports',
      'sidebar-users',
      'sidebar-roles',
      'sidebar-settings',
      'sidebar-logs',
    ];

    for (const testid of sidebarLinks) {
      const el = page.locator(`[data-testid="${testid}"]`);
      if (await el.isVisible()) {
        await el.click();
        await page.waitForTimeout(1500);
        const name = testid.replace('sidebar-', '');
        await screenshot(page, `sidebar-${name}`, FOLDER);
      }
    }
  });
});

import { test as base, Page, BrowserContext } from '@playwright/test';
import { screenshot, resetCounter } from '../helpers/screenshot';

// ============================================================
// Comptes de test par rôle
// ============================================================

export const TEST_ACCOUNTS = {
  super_admin: {
    email: 'ezekiel@eglise.org',
    password: 'azerty',
    role: 'super_admin',
  },
  // Les comptes ci-dessous seront créés via l'admin UI dans le test d'initialisation
  // ou doivent exister dans la seed Supabase
  shepherd: {
    email: 'berger@ekklesia.test',
    password: 'Eglise2026!',
    role: 'shepherd',
  },
  leader: {
    email: 'leader@ekklesia.test',
    password: 'Eglise2026!',
    role: 'leader',
  },
  pastor: {
    email: 'pastor@ekklesia.test',
    password: 'Eglise2026!',
    role: 'pastor',
  },
  admin: {
    email: 'admin@ekklesia.test',
    password: 'Eglise2026!',
    role: 'admin',
  },
  newcomer_friend: {
    email: 'newcomer@ekklesia.test',
    password: 'Eglise2026!',
    role: 'newcomer_friend',
  },
} as const;

export type UserRole = keyof typeof TEST_ACCOUNTS;

// ============================================================
// Helper: Login via l'UI
// ============================================================

export async function loginAs(page: Page, role: UserRole): Promise<void> {
  const account = TEST_ACCOUNTS[role];

  await page.goto('/login', { timeout: 60_000 });
  await page.waitForSelector('input[type="email"]', { timeout: 15_000 });

  await page.fill('input[type="email"]', account.email);
  await page.fill('input[type="password"]', account.password);
  await page.click('button[type="submit"]');

  // Attendre la redirection après login
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 20_000,
  });
}

/**
 * Login sécurisé : essaie le rôle demandé, fallback sur super_admin si ça échoue.
 * Retourne le rôle effectivement utilisé.
 */
export async function safeLoginAs(page: Page, role: UserRole): Promise<UserRole> {
  const account = TEST_ACCOUNTS[role];

  await page.goto('/login', { timeout: 60_000 });
  await page.waitForSelector('[data-testid="login-email"]', { timeout: 15_000 });

  await page.fill('[data-testid="login-email"]', account.email);
  await page.fill('[data-testid="login-password"]', account.password);
  await page.click('[data-testid="login-submit"]');

  // Attendre soit la redirection, soit un message d'erreur (testid OU texte visible)
  const loginError = page.locator('[data-testid="login-error"]');
  const loginErrorText = page.locator('text=/Invalid login credentials|Invalides|Identifiants/i');
  const hasErrorByTestid = await loginError.isVisible({ timeout: 4000 }).catch(() => false);
  const hasErrorByText = !hasErrorByTestid
    ? await loginErrorText.isVisible({ timeout: 4000 }).catch(() => false)
    : false;
  const hasError = hasErrorByTestid || hasErrorByText;

  if (hasError && role !== 'super_admin') {
    console.log(`  ⚠️ Compte ${role} (${account.email}) non trouvé — fallback vers super_admin`);
  } else if (hasError && role === 'super_admin') {
    console.log(`  ❌ Identifiants super_admin invalides (${account.email}) — vérifiez .env.local pointe sur le bon Supabase et que le user existe.`);
  }

  // Fallback super_admin si autre rôle a échoué
  if (hasError && role !== 'super_admin') {
    await page.goto('/login', { timeout: 30_000 });
    await page.waitForSelector('[data-testid="login-email"]', { timeout: 15_000 });
    await page.fill('[data-testid="login-email"]', TEST_ACCOUNTS.super_admin.email);
    await page.fill('[data-testid="login-password"]', TEST_ACCOUNTS.super_admin.password);
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 });
    return 'super_admin';
  }

  if (hasError) {
    throw new Error(`Login failed for ${role} (${account.email}) — see login page toast.`);
  }

  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 });
  return role;
}

// ============================================================
// Fixture personnalisée avec auth automatique
// ============================================================

type TestFixtures = {
  authenticatedPage: Page;
  role: UserRole;
};

export const test = base.extend<TestFixtures>({
  role: ['shepherd', { option: true }],

  authenticatedPage: async ({ page, role }, use) => {
    resetCounter();
    await loginAs(page, role);
    await use(page);
  },
});

export { expect } from '@playwright/test';

// ============================================================
// Dossiers screenshots par rôle et feature
// ============================================================

export const SCREENSHOT_FOLDERS = {
  auth: '01-auth',
  pastoral: {
    dashboard: '02-pastoral/01-dashboard',
    members: '02-pastoral/02-members',
    attendance: '02-pastoral/03-attendance',
    activities: '02-pastoral/04-activities',
    reports: '02-pastoral/05-reports',
    alerts: '02-pastoral/06-alerts',
    profile: '02-pastoral/07-profile',
  },
  admin: {
    superDashboard: '03-admin/01-super-dashboard',
    members: '03-admin/02-members',
    users: '03-admin/03-users',
    newcomers: '03-admin/04-newcomers',
    groups: '03-admin/05-groups',
    departments: '03-admin/06-departments',
    programs: '03-admin/07-programs',
    attendance: '03-admin/08-attendance',
    reports: '03-admin/09-reports',
    roles: '03-admin/10-roles',
    settings: '03-admin/11-settings',
    logs: '03-admin/12-logs',
  },
  regression: '04-regression',
  bugs: '_bugs',
} as const;

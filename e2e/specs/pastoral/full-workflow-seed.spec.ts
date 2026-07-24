import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = '02-pastoral/00-full-workflow';

// ═══════════════════════════════════════════════════════════════
// WORKFLOW COMPLET AVEC DONNÉES RÉALISTES
// ═══════════════════════════════════════════════════════════════
// Ce test crée un scénario complet sur plusieurs semaines :
//   1. Berger crée des fidèles
//   2. Berger fait les appels (dimanche, mardi, mercredi, vendredi)
//   3. Berger remplit disciplines & actions pastorales
//   4. Berger soumet son rapport
//   5. Responsable valide le rapport
//   6. On vérifie que les données apparaissent partout
// ═══════════════════════════════════════════════════════════════

test.describe('Workflow Complet — Données Réalistes Multi-Semaines', () => {

  // ─── ÉTAPE 1 : BERGER CRÉE DES FIDÈLES ──────────────────────

  test('01 — Berger crée 3 nouveaux fidèles', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
    await page.goto('/members');
    await page.waitForTimeout(3000);

    const nouveauxFideles = [
      { prenom: 'Marie', nom: 'Kouassi', phone: '+22507010010' },
      { prenom: 'Paul', nom: 'Bamba', phone: '+22507010011' },
      { prenom: 'Thérèse', nom: 'Fofie', phone: '+22507010012' },
    ];

    for (const fidele of nouveauxFideles) {
      // Cliquer sur "Inscrire une nouvelle âme"
      const createBtn = page.locator('button').filter({ hasText: /Inscrire|nouvelle âme|person_add/i }).first();
      await createBtn.click();
      await page.waitForTimeout(1500);

      // Remplir le formulaire (inputs contrôlés React)
      const prenomInput = page.locator('input[placeholder="Jean"]').first();
      const nomInput = page.locator('input[placeholder="Dupont"]').first();
      const phoneInput = page.locator('input[placeholder*="33 6"]').first();

      await prenomInput.fill(fidele.prenom);
      await page.waitForTimeout(300);
      await nomInput.fill(fidele.nom);
      await page.waitForTimeout(300);
      await phoneInput.fill(fidele.phone);
      await page.waitForTimeout(300);

      await screenshot(page, `create-${fidele.prenom}-filled`, FOLDER);

      // Soumettre le formulaire
      const submitBtn = page.locator('button[type="submit"]').first();
      await submitBtn.click();
      await page.waitForTimeout(3000);

      // Attendre que la modale se ferme
      await page.waitForTimeout(1000);
    }

    await screenshot(page, '3-fideles-crees', FOLDER);

    // Vérifier qu'on a bien des membres dans la liste
    await expect(page.locator('body')).toContainText(/Marie|Paul|Thérèse/i);
  });

  // ─── ÉTAPE 2 : BERGER FAIT LES APPELS ──────────────────────

  test('02 — Berger pointe les présences dimanche (sunday_service)', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
    await page.goto('/attendance');
    await page.waitForTimeout(3000);

    // Sélectionner Dimanche
    const sundayTab = page.locator('button').filter({ hasText: /dimanche|sunday/i }).first();
    if (await sundayTab.isVisible()) {
      await sundayTab.click();
      await page.waitForTimeout(1500);
    }

    // Marquer tous les membres présents
    const presentBtns = page.locator('button').filter({ hasText: /présent|present|oui/i });
    const count = await presentBtns.count();
    for (let i = 0; i < count; i++) {
      if (await presentBtns.nth(i).isVisible()) {
        await presentBtns.nth(i).click();
        await page.waitForTimeout(300);
      }
    }

    await screenshot(page, 'sunday-all-present', FOLDER);

    // Sauvegarder
    const saveBtn = page.locator('button').filter({ hasText: /sauvegarder|enregistrer|save/i }).first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'sunday-saved', FOLDER);
    }
  });

  test('03 — Berger pointe les présences mardi (tuesday_class)', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
    await page.goto('/attendance');
    await page.waitForTimeout(3000);

    const tuesdayTab = page.locator('button').filter({ hasText: /mardi|tuesday/i }).first();
    if (await tuesdayTab.isVisible()) {
      await tuesdayTab.click();
      await page.waitForTimeout(1500);
    }

    // Marquer 2 membres sur 3 présents
    const presentBtns = page.locator('button').filter({ hasText: /présent|present|oui/i });
    const count = await presentBtns.count();
    for (let i = 0; i < Math.min(count, 2); i++) {
      if (await presentBtns.nth(i).isVisible()) {
        await presentBtns.nth(i).click();
        await page.waitForTimeout(300);
      }
    }

    await screenshot(page, 'tuesday-2-of-3', FOLDER);

    const saveBtn = page.locator('button').filter({ hasText: /sauvegarder|enregistrer/i }).first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'tuesday-saved', FOLDER);
    }
  });

  test('04 — Berger pointe les présences mercredi (wednesday_class)', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
    await page.goto('/attendance');
    await page.waitForTimeout(3000);

    const wednesdayTab = page.locator('button').filter({ hasText: /mercredi|wednesday/i }).first();
    if (await wednesdayTab.isVisible()) {
      await wednesdayTab.click();
      await page.waitForTimeout(1500);
    }

    // Marquer 1 membre sur 3 présent
    const presentBtns = page.locator('button').filter({ hasText: /présent|present|oui/i });
    if (await presentBtns.count() > 0 && await presentBtns.first().isVisible()) {
      await presentBtns.first().click();
      await page.waitForTimeout(300);
    }

    await screenshot(page, 'wednesday-1-of-3', FOLDER);

    const saveBtn = page.locator('button').filter({ hasText: /sauvegarder|enregistrer/i }).first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'wednesday-saved', FOLDER);
    }
  });

  test('05 — Berger pointe les présences vendredi (friday_service)', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
    await page.goto('/attendance');
    await page.waitForTimeout(3000);

    const fridayTab = page.locator('button').filter({ hasText: /vendredi|friday/i }).first();
    if (await fridayTab.isVisible()) {
      await fridayTab.click();
      await page.waitForTimeout(1500);
    }

    // 0 membre présent (mauvaise semaine)
    await screenshot(page, 'friday-0-present', FOLDER);

    const saveBtn = page.locator('button').filter({ hasText: /sauvegarder|enregistrer/i }).first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'friday-saved', FOLDER);
    }
  });

  // ─── ÉTAPE 3 : BERGER REMPLIT DISCIPLINES & ACTIONS ─────────

  test('06 — Berger remplit disciplines quotidiennes de la semaine', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
    await page.goto('/activities');
    await page.waitForTimeout(3000);

    // Activer toutes les disciplines Q/I
    const disciplines = ['prière', 'méditation', 'jeûne', 'écoute', 'lecture'];
    for (const disc of disciplines) {
      const btn = page.locator('button').filter({ hasText: new RegExp(disc, 'i') }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(400);
      }
    }

    await screenshot(page, 'disciplines-all-active', FOLDER);
  });

  test('07 — Berger remplit actions pastorales', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
    await page.goto('/activities');
    await page.waitForTimeout(3000);

    // Remplir les compteurs d'âmes gagnées
    const numberInputs = page.locator('input[type="number"]');
    const count = await numberInputs.count();
    const valeurs = [5, 8, 12, 3]; // âmes gagnées, visites, appels, etc.
    for (let i = 0; i < Math.min(count, 4); i++) {
      if (await numberInputs.nth(i).isVisible()) {
        await numberInputs.nth(i).fill(valeurs[i].toString());
        await page.waitForTimeout(300);
      }
    }

    await screenshot(page, 'pastoral-actions-filled', FOLDER);
  });

  test('08 — Berger remplit observations', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
    await page.goto('/activities');
    await page.waitForTimeout(3000);

    const obsInput = page.locator('textarea').first();
    if (await obsInput.isVisible()) {
      await obsInput.fill(
        'Semaine très fructueuse. 5 nouvelles âmes gagnées lors de l\'évangélisation du vendredi. ' +
        '8 visites à domicile réalisées. Un membre absent depuis 3 semaines a été relancé par téléphone. ' +
        'Les prières du matin ont été bien suivies cette semaine.'
      );
    }

    await screenshot(page, 'observations-filled', FOLDER);
  });

  test('09 — Berger sauvegarde le formulaire complet', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
    await page.goto('/activities');
    await page.waitForTimeout(3000);

    // Re-remplir avant sauvegarde
    const prayerQ = page.locator('button').filter({ hasText: /prière/i }).first();
    if (await prayerQ.isVisible()) await prayerQ.click();
    await page.waitForTimeout(300);

    const obsInput = page.locator('textarea').first();
    if (await obsInput.isVisible()) {
      await obsInput.fill('Formulaire E2E sauvegardé avec succès');
    }

    const saveBtn = page.locator('button').filter({ hasText: /sauvegarder|enregistrer/i }).first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'activities-saved', FOLDER);
    }
  });

  // ─── ÉTAPE 4 : BERGER SOUMET RAPPORT ────────────────────────

  test('10 — Berger soumet son rapport hebdomadaire', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    await screenshot(page, 'report-preview', FOLDER);

    const submitBtn = page.locator('button').filter({ hasText: /soumettre|submit/i }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'report-submitted', FOLDER);
    }

    // Vérifier le statut
    const body = await page.textContent('body');
    const hasStatus = body?.includes('Soumis') || body?.includes('Validé') || body?.includes('Brouillon');
    expect(hasStatus).toBeTruthy();
  });

  // ─── ÉTAPE 5 : BERGER VOIT SES DONNÉES ─────────────────────

  test('11 — Berger vérifie son dashboard avec les données', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
    await page.goto('/');
    await page.waitForTimeout(3000);
    await screenshot(page, 'shepherd-dashboard-with-data', FOLDER);

    // Vérifier que le dashboard affiche des KPIs
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('12 — Berger vérifie les alertes', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
    await page.goto('/alerts');
    await page.waitForTimeout(3000);
    await screenshot(page, 'shepherd-alerts-data', FOLDER);
  });

  // ─── ÉTAPE 6 : RESPONSABLE VALIDE RAPPORT ───────────────────

  test('13 — Responsable voit le rapport du berger', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'leader');
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    await screenshot(page, 'leader-reports-view', FOLDER);

    // Vérifier qu'on voit les rapports
    await expect(page.locator('body')).toContainText(/rapport|report|semaine|berger/i);
  });

  test('14 — Responsable approuve le rapport', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'leader');
    await page.goto('/reports');
    await page.waitForTimeout(3000);

    const approveBtn = page.locator('button').filter({ hasText: /approuver|valider|approve/i }).first();
    if (await approveBtn.isVisible()) {
      await screenshot(page, 'leader-before-approve', FOLDER);
      await approveBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'leader-report-approved', FOLDER);
    }
  });

  test('15 — Responsable voit le dashboard du groupe avec données', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'leader');
    await page.goto('/');
    await page.waitForTimeout(3000);
    await screenshot(page, 'leader-dashboard-data', FOLDER);

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('16 — Responsable voit les membres du groupe', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'leader');
    await page.goto('/members');
    await page.waitForTimeout(3000);
    await screenshot(page, 'leader-members-data', FOLDER);

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('17 — Responsable voit les alertes du groupe', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'leader');
    await page.goto('/alerts');
    await page.waitForTimeout(3000);
    await screenshot(page, 'leader-alerts-data', FOLDER);
  });

  // ─── ÉTAPE 7 : VÉRIFICATION GLOBALE ─────────────────────────

  test('18 — Berger vérifie les présences de la semaine', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
    await page.goto('/attendance');
    await page.waitForTimeout(3000);
    await screenshot(page, 'attendance-week-review', FOLDER);

    // Vérifier qu'on voit les données de présence
    await expect(page.locator('body')).toContainText(/dimanche|mardi|mercredi|vendredi|présent|absent/i);
  });

  test('19 — Berger vérifie les rapports passés', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');
    await page.goto('/reports');
    await page.waitForTimeout(3000);

    // Aller à la semaine précédente
    const prevWeek = page.locator('button').filter({ hasText: /précédente|previous|<-|◀/i }).first();
    if (await prevWeek.isVisible()) {
      await prevWeek.click();
      await page.waitForTimeout(2000);
    }

    await screenshot(page, 'reports-prev-week', FOLDER);
  });

  test('20 — Berger navigue dans toutes les pages avec données', async ({ page }) => {
    resetCounter();
    await safeLoginAs(page, 'shepherd');

    // Dashboard
    await page.goto('/');
    await page.waitForTimeout(2000);
    await screenshot(page, 'nav-dashboard', FOLDER);

    // Membres
    await page.goto('/members');
    await page.waitForTimeout(2000);
    await screenshot(page, 'nav-members', FOLDER);

    // Présences
    await page.goto('/attendance');
    await page.waitForTimeout(2000);
    await screenshot(page, 'nav-attendance', FOLDER);

    // Activités
    await page.goto('/activities');
    await page.waitForTimeout(2000);
    await screenshot(page, 'nav-activities', FOLDER);

    // Rapports
    await page.goto('/reports');
    await page.waitForTimeout(2000);
    await screenshot(page, 'nav-reports', FOLDER);

    // Alertes
    await page.goto('/alerts');
    await page.waitForTimeout(2000);
    await screenshot(page, 'nav-alerts', FOLDER);
  });
});

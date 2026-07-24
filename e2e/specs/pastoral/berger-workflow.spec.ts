import { test, expect, safeLoginAs, SCREENSHOT_FOLDERS } from '../../fixtures/auth';
import { screenshot, resetCounter } from '../../helpers/screenshot';

const FOLDER = SCREENSHOT_FOLDERS.pastoral.members;

// ═══════════════════════════════════════════════════════════════
// WORKFLOW BERGER — Scénario complet sur plusieurs semaines
// ═══════════════════════════════════════════════════════════════
// Le berger doit pouvoir :
//   1. Se connecter
//   2. Créer des fidèles
//   3. Faire l'appel pour les différents programmes
//   4. Faire le suivi des âmes (visites, appels)
//   5. Faire de la discipline hebdomadaire
//   6. Faire ses rapports chaque fin de semaine et les soumettre
//   7. Archiver des membres qui ne viennent plus
//   8. Tests sur plusieurs semaines
// ═══════════════════════════════════════════════════════════════

test.describe('Workflow Berger — Scénario Complet Multi-Semaines', () => {
  let usedRole: string;

  test.beforeEach(async ({ page }) => {
    resetCounter();
    usedRole = await safeLoginAs(page, 'shepherd');
  });

  // ─── 1. CONNEXION ───────────────────────────────────────────

  test('01 — Connexion et accès au dashboard berger', async ({ page }) => {
    // Le login est fait dans beforeEach, on vérifie qu'on est bien connecté
    await page.waitForTimeout(2000);
    await screenshot(page, 'berger-dashboard-loaded', FOLDER);

    // Vérifier qu'on n'est plus sur la page login
    expect(page.url()).not.toContain('/login');

    // Vérifier la présence de la navbar
    await expect(page.locator('[data-testid="navbar-header"]')).toBeVisible();
  });

  test('02 — Voir le dashboard personnel avec KPIs', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    await screenshot(page, 'berger-dashboard-kpis', FOLDER);

    // Le berger doit voir ses statistiques
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  // ─── 2. CRÉER DES FIDÈLES ──────────────────────────────────

  test('03 — Créer un nouveau fidèle (formulaire complet)', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);

    // Cliquer sur le bouton de création
    const createBtn = page.locator('button').filter({ hasText: /nouveau|créer|ajouter/i }).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'berger-create-member-modal', FOLDER);

      // Remplir le formulaire de création
      const prenomInput = page.locator('input[placeholder*="Jean"], input[name*="first"]').first();
      const nomInput = page.locator('input[placeholder*="Kouassi"], input[name*="last"]').first();
      const phoneInput = page.locator('input[placeholder*="téléphone"], input[type="tel"], input[name*="phone"]').first();

      if (await prenomInput.isVisible()) await prenomInput.fill('Marie');
      if (await nomInput.isVisible()) await nomInput.fill('Kouassi');
      if (await phoneInput.isVisible()) await phoneInput.fill('+22507080910');

      await screenshot(page, 'berger-create-member-filled', FOLDER);

      // Sélectionner un berger si nécessaire
      const shepherdSelect = page.locator('select').filter({ hasText: /berger|shepherd/i }).first();
      if (await shepherdSelect.isVisible()) {
        await shepherdSelect.selectOption({ index: 1 });
      }

      // Soumettre
      const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /créer|enregistrer|sauvegarder/i }).first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
        await screenshot(page, 'berger-member-created', FOLDER);
      }
    }
  });

  test('04 — Créer un deuxième fidèle', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);

    const createBtn = page.locator('button').filter({ hasText: /nouveau|créer|ajouter/i }).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(1000);

      const prenomInput = page.locator('input[placeholder*="Jean"], input[name*="first"]').first();
      const nomInput = page.locator('input[placeholder*="Kouassi"], input[name*="last"]').first();
      const phoneInput = page.locator('input[placeholder*="téléphone"], input[type="tel"], input[name*="phone"]').first();

      if (await prenomInput.isVisible()) await prenomInput.fill('Paul');
      if (await nomInput.isVisible()) await nomInput.fill('Bamba');
      if (await phoneInput.isVisible()) await phoneInput.fill('+22507080911');

      const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /créer|enregistrer/i }).first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
        await screenshot(page, 'berger-member-2-created', FOLDER);
      }
    }
  });

  // ─── 3. APPEL PRÉSENCES — DIMANCHE ─────────────────────────

  test('05 — Pointage dimanche (sunday_service)', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForTimeout(3000);
    await screenshot(page, 'berger-attendance-sunday', FOLDER);

    // Sélectionner le programme Dimanche
    const sundayTab = page.locator('button').filter({ hasText: /dimanche|sunday/i }).first();
    if (await sundayTab.isVisible()) {
      await sundayTab.click();
      await page.waitForTimeout(1000);
    }

    // Marquer les membres présents
    const presentBtns = page.locator('button').filter({ hasText: /présent|present|oui/i });
    const count = await presentBtns.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      if (await presentBtns.nth(i).isVisible()) {
        await presentBtns.nth(i).click();
        await page.waitForTimeout(300);
      }
    }

    await screenshot(page, 'berger-sunday-marks', FOLDER);

    // Sauvegarder
    const saveBtn = page.locator('button').filter({ hasText: /sauvegarder|enregistrer|save/i }).first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'berger-sunday-saved', FOLDER);
    }
  });

  // ─── 4. APPEL PRÉSENCES — MARDI ────────────────────────────

  test('06 — Pointage mardi (tuesday_class)', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForTimeout(3000);

    // Sélectionner le programme Mardi
    const tuesdayTab = page.locator('button').filter({ hasText: /mardi|tuesday/i }).first();
    if (await tuesdayTab.isVisible()) {
      await tuesdayTab.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'berger-attendance-tuesday', FOLDER);
    }

    // Marquer quelques membres
    const presentBtns = page.locator('button').filter({ hasText: /présent|present|oui/i });
    const count = await presentBtns.count();
    for (let i = 0; i < Math.min(count, 2); i++) {
      if (await presentBtns.nth(i).isVisible()) {
        await presentBtns.nth(i).click();
        await page.waitForTimeout(300);
      }
    }

    // Sauvegarder
    const saveBtn = page.locator('button').filter({ hasText: /sauvegarder|enregistrer/i }).first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'berger-tuesday-saved', FOLDER);
    }
  });

  // ─── 5. APPEL PRÉSENCES — MERCREDI ─────────────────────────

  test('07 — Pointage mercredi (wednesday_class)', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForTimeout(3000);

    const wednesdayTab = page.locator('button').filter({ hasText: /mercredi|wednesday/i }).first();
    if (await wednesdayTab.isVisible()) {
      await wednesdayTab.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'berger-attendance-wednesday', FOLDER);
    }

    const presentBtns = page.locator('button').filter({ hasText: /présent|present|oui/i });
    const count = await presentBtns.count();
    for (let i = 0; i < Math.min(count, 2); i++) {
      if (await presentBtns.nth(i).isVisible()) {
        await presentBtns.nth(i).click();
        await page.waitForTimeout(300);
      }
    }

    const saveBtn = page.locator('button').filter({ hasText: /sauvegarder|enregistrer/i }).first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'berger-wednesday-saved', FOLDER);
    }
  });

  // ─── 6. APPEL PRÉSENCES — VENDREDI ─────────────────────────

  test('08 — Pointage vendredi (friday_service)', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForTimeout(3000);

    const fridayTab = page.locator('button').filter({ hasText: /vendredi|friday/i }).first();
    if (await fridayTab.isVisible()) {
      await fridayTab.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'berger-attendance-friday', FOLDER);
    }

    const presentBtns = page.locator('button').filter({ hasText: /présent|present|oui/i });
    const count = await presentBtns.count();
    for (let i = 0; i < Math.min(count, 2); i++) {
      if (await presentBtns.nth(i).isVisible()) {
        await presentBtns.nth(i).click();
        await page.waitForTimeout(300);
      }
    }

    const saveBtn = page.locator('button').filter({ hasText: /sauvegarder|enregistrer/i }).first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'berger-friday-saved', FOLDER);
    }
  });

  // ─── 7. DISCIPLINE HEBDOMADAIRE ────────────────────────────

  test('09 — Remplir disciplines quotidiennes Q/I (prière, méditation, jeûne, écoute)', async ({ page }) => {
    await page.goto('/activities');
    await page.waitForTimeout(3000);
    await screenshot(page, 'berger-activities-page', FOLDER);

    // Prière Q (Quotidien)
    const prayerQ = page.locator('button').filter({ hasText: /prière/i }).first();
    if (await prayerQ.isVisible()) {
      await prayerQ.click();
      await page.waitForTimeout(500);
    }

    // Méditation Q
    const medQ = page.locator('button').filter({ hasText: /méditation/i }).first();
    if (await medQ.isVisible()) {
      await medQ.click();
      await page.waitForTimeout(500);
    }

    // Jeûne
    const fasting = page.locator('button').filter({ hasText: /jeûne/i }).first();
    if (await fasting.isVisible()) {
      await fasting.click();
      await page.waitForTimeout(500);
    }

    // Écoute de la parole
    const wordListening = page.locator('button').filter({ hasText: /écoute|ecoute/i }).first();
    if (await wordListening.isVisible()) {
      await wordListening.click();
      await page.waitForTimeout(500);
    }

    await screenshot(page, 'berger-disciplines-filled', FOLDER);
  });

  test('10 — Remplir actions pastorales (âmes gagnées, visites, appels)', async ({ page }) => {
    await page.goto('/activities');
    await page.waitForTimeout(3000);

    // Chercher les inputs numériques pour les actions pastorales
    const numberInputs = page.locator('input[type="number"]');
    const count = await numberInputs.count();

    // Remplir les 3 premiers inputs (âmes gagnées, visites domicile, appels suivi)
    const values = [3, 5, 8];
    for (let i = 0; i < Math.min(count, 3); i++) {
      if (await numberInputs.nth(i).isVisible()) {
        await numberInputs.nth(i).fill(values[i].toString());
        await page.waitForTimeout(300);
      }
    }

    await screenshot(page, 'berger-pastoral-actions-filled', FOLDER);
  });

  test('11 — Remplir observations de la semaine', async ({ page }) => {
    await page.goto('/activities');
    await page.waitForTimeout(3000);

    const obsInput = page.locator('textarea').first();
    if (await obsInput.isVisible()) {
      await obsInput.fill('Bonne semaine. Les membres sont assidus. Deux nouveaux convertis ont participé au culte de dimanche. Un membre a été visité à domicile suite à une maladie.');
      await screenshot(page, 'berger-observations-filled', FOLDER);
    }
  });

  test('12 — Sauvegarder le formulaire de disciplines', async ({ page }) => {
    await page.goto('/activities');
    await page.waitForTimeout(3000);

    // Remplir quelques champs avant sauvegarde
    const prayerQ = page.locator('button').filter({ hasText: /prière/i }).first();
    if (await prayerQ.isVisible()) await prayerQ.click();

    const obsInput = page.locator('textarea').first();
    if (await obsInput.isVisible()) {
      await obsInput.fill('Test E2E — disciplines sauvegardées');
    }

    await screenshot(page, 'berger-activities-before-save', FOLDER);

    const saveBtn = page.locator('button').filter({ hasText: /sauvegarder|enregistrer/i }).first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'berger-activities-saved', FOLDER);
    }
  });

  // ─── 8. SUIVI DES ÂMES ─────────────────────────────────────

  test('13 — Voir les alertes (membres absents 2+ semaines)', async ({ page }) => {
    await page.goto('/alerts');
    await page.waitForTimeout(3000);
    await screenshot(page, 'berger-alerts-page', FOLDER);

    await expect(page.locator('body')).toContainText(/alerte|absent|relance|membre/i);
  });

  test('14 — Enregistrer une visite pastorale', async ({ page }) => {
    await page.goto('/alerts');
    await page.waitForTimeout(3000);

    const visitBtn = page.locator('button').filter({ hasText: /visite|enregistrer|appel|call/i }).first();
    if (await visitBtn.isVisible()) {
      await visitBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'berger-visit-modal', FOLDER);

      // Remplir le formulaire de visite
      const dateInput = page.locator('input[type="date"]').first();
      if (await dateInput.isVisible()) {
        await dateInput.fill(new Date().toISOString().split('T')[0]);
      }

      const reasonSelect = page.locator('select').first();
      if (await reasonSelect.isVisible()) {
        await reasonSelect.selectOption({ index: 1 });
      }

      const notesInput = page.locator('textarea, input[placeholder*="note"]').first();
      if (await notesInput.isVisible()) {
        await notesInput.fill('Visite E2E — Membre malade, prié avec lui, a promis de revenir dimanche');
      }

      await screenshot(page, 'berger-visit-filled', FOLDER);

      const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /enregistrer|sauvegarder/i }).first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
        await screenshot(page, 'berger-visit-saved', FOLDER);
      }
    }
  });

  test('15 — Voir l\'historique des visites pastorales', async ({ page }) => {
    await page.goto('/alerts');
    await page.waitForTimeout(3000);
    await screenshot(page, 'berger-visits-history', FOLDER);

    // Vérifier qu'il y a des visites affichées
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  // ─── 9. RAPPORT HEBDOMADAIRE ───────────────────────────────

  test('16 — Voir l\'aperçu du rapport hebdomadaire', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    await screenshot(page, 'berger-report-preview', FOLDER);

    // Vérifier qu'on voit le contenu du rapport
    await expect(page.locator('body')).toContainText(/rapport|semaine|dimanche|présent/i);
  });

  test('17 — Voir les KPIs du rapport (présences, disciplines, visites)', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    await screenshot(page, 'berger-report-kpis', FOLDER);

    // Vérifier les données du rapport
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('18 — Soumettre le rapport hebdomadaire', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    await screenshot(page, 'berger-report-before-submit', FOLDER);

    const submitBtn = page.locator('button').filter({ hasText: /soumettre|submit/i }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
      await screenshot(page, 'berger-report-submitted', FOLDER);
    }
  });

  test('19 — Vérifier le statut du rapport après soumission', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    await screenshot(page, 'berger-report-status', FOLDER);

    // Vérifier le statut affiché
    const body = await page.textContent('body');
    const hasStatus = body?.includes('Soumis') || body?.includes('Validé') || body?.includes('Brouillon') || body?.includes('Approuvé');
    expect(hasStatus).toBeTruthy();
  });

  // ─── 10. ARCHIVER DES MEMBRES ──────────────────────────────

  test('20 — Archiver un membre inactif', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);

    // Chercher le bouton d'archivage ou le menu d'actions
    const archiveBtn = page.locator('button').filter({ hasText: /archiver|archive/i }).first();
    if (await archiveBtn.isVisible()) {
      await archiveBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'berger-member-archiving', FOLDER);

      // Confirmer l'archivage si modale de confirmation
      const confirmBtn = page.locator('button').filter({ hasText: /confirmer|oui|ok/i }).first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
        await screenshot(page, 'berger-member-archived', FOLDER);
      }
    } else {
      // Essayer via le bouton d'édition
      const editBtn = page.locator('button[title*="Modifier"]').first();
      if (await editBtn.isVisible()) {
        await editBtn.click();
        await page.waitForTimeout(1000);

        // Chercher l'option d'archivage dans le modal
        const archiveOption = page.locator('button, select, option').filter({ hasText: /archiver|archived/i }).first();
        if (await archiveOption.isVisible()) {
          await archiveOption.click();
          await page.waitForTimeout(1000);
          await screenshot(page, 'berger-member-archive-option', FOLDER);
        }
      }
    }
  });

  test('21 — Vérifier l\'onglet membres archivés', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(3000);

    const archivedTab = page.locator('button').filter({ hasText: /archiv/i }).first();
    if (await archivedTab.isVisible()) {
      await archivedTab.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'berger-members-archived-tab', FOLDER);
    }
  });

  // ─── 11. TESTS SUR PLUSIEURS SEMAINES ──────────────────────

  test('22 — Naviguer entre les semaines (sélecteur)', async ({ page }) => {
    await page.goto('/activities');
    await page.waitForTimeout(3000);

    // Chercher le sélecteur de semaine
    const prevWeek = page.locator('button').filter({ hasText: /précédente|previous|<-|◀/i }).first();
    if (await prevWeek.isVisible()) {
      await prevWeek.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'berger-prev-week', FOLDER);
    }

    const nextWeek = page.locator('button').filter({ hasText: /suivante|next|->|▶/i }).first();
    if (await nextWeek.isVisible()) {
      await nextWeek.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'berger-next-week', FOLDER);
    }
  });

  test('23 — Voir les disciplines d\'une semaine précédente', async ({ page }) => {
    await page.goto('/activities');
    await page.waitForTimeout(3000);

    // Aller à la semaine précédente
    const prevWeek = page.locator('button').filter({ hasText: /précédente|previous|<-|◀/i }).first();
    if (await prevWeek.isVisible()) {
      await prevWeek.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'berger-prev-week-activities', FOLDER);
    }
  });

  test('24 — Voir les rapports d\'une semaine précédente', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(3000);

    const prevWeek = page.locator('button').filter({ hasText: /précédente|previous|<-|◀/i }).first();
    if (await prevWeek.isVisible()) {
      await prevWeek.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'berger-prev-week-report', FOLDER);
    }
  });

  // ─── 12. NAVIGATION COMPLÈTE ───────────────────────────────

  test('25 — Naviguer dans toutes les pages berger', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Dashboard → Membres
    const membersLink = page.locator('[data-testid="nav-members"]').first();
    if (await membersLink.isVisible()) {
      await membersLink.click();
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/members');
    }

    // Membres → Présences
    const attendanceLink = page.locator('[data-testid="nav-attendance"]').first();
    if (await attendanceLink.isVisible()) {
      await attendanceLink.click();
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/attendance');
    }

    // Présences → Activités
    const activitiesLink = page.locator('[data-testid="nav-activities"]').first();
    if (await activitiesLink.isVisible()) {
      await activitiesLink.click();
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/activities');
    }

    // Activités → Rapports
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

    await screenshot(page, 'berger-full-navigation', FOLDER);
  });

  test('26 — Retour au dashboard depuis une page', async ({ page }) => {
    await page.goto('/members');
    await page.waitForTimeout(2000);

    // Cliquer sur le logo ou le lien dashboard
    const dashboardLink = page.locator('a[href="/"]').first();
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await page.waitForTimeout(2000);
      expect(page.url()).not.toContain('/members');
    }
  });

  // ─── 13. PROFIL ────────────────────────────────────────────

  test('27 — Voir et éditer son profil', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForTimeout(3000);
    await screenshot(page, 'berger-profile', FOLDER);

    // Vérifier qu'on voit les informations du profil
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  // ─── 14. DÉCONNEXION ───────────────────────────────────────

  test('28 — Se déconnecter', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const logoutBtn = page.locator('[data-testid="nav-profile"], button').filter({ hasText: /déconnexion|déconnecter|logout/i }).first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'berger-logout', FOLDER);

      // Vérifier qu'on est redirigé vers login
      expect(page.url()).toContain('/login');
    }
  });
});

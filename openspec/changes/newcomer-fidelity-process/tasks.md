## 1. Migration DB — Modification du trigger

- [x] 1.1 Créer la migration `supabase/migrations/20260803000000_newcomer_no_absent_to_relaunch.sql` avec la fonction `handle_sunday_attendance_update` modifiée
- [x] 1.2 Supprimer la transition `new → absent_to_relaunch` dans le ELSE (absent) : les nouveaux restent `'new'`, seul `consecutive_absences` s'incrémente
- [x] 1.3 Vérifier que les autres transitions sont préservées : `absent_to_relaunch → new` (retour), `absent_to_relaunch → member` (graduation), graduation `new → member` à 4 présences

## 2. Onglet Nouvelles Âmes — Page Membres

- [x] 2.1 Ajouter le 3ème onglet "Nouvelles Âmes" dans `src/app/members/page.tsx` avec compteur
- [x] 2.2 Modifier le filtre de l'onglet "Actifs" pour exclure `status='new'`
- [x] 2.3 Implémenter le filtre de l'onglet "Nouveaux" : `status='new'` uniquement
- [x] 2.4 Créer la carte dédiée pour les nouveaux : nom, téléphone, date 1ère visite, invité par, berger, progression X/4, absences consécutives, dernière venue
- [x] 2.5 Récupérer les données de `newcomer_registrations` (date inscription, invité par) via jointure Supabase
- [x] 2.6 Modifier la modale de création pour forcer `status='new'` et retirer les radio boutons de statut

## 3. Appel de présence du BERGER (`/attendance`)

- [x] 3.1 Dans `src/app/attendance/page.tsx`, ajouter un badge "Nouveau" pour les membres avec `status='new'` dans la vue Semaine et la vue Jour
- [x] 3.2 Ajouter une séparation visuelle : les nouveaux en haut avec en-tête "Nouvelles Âmes (X)", puis les membres confirmés
- [x] 3.3 Afficher la progression d'intégration (X/4 dimanches) à côté de chaque nouveau dans la feuille de présence
- [x] 3.4 Ajouter un filtre "Tous" | "Nouveaux" | "Membres" dans la toolbar de la feuille de présence
- [x] 3.5 Dans le mode Wizard (pas-à-pas), afficher le badge "Nouveau" et la progression X/4

## 4. Alertes différenciées

- [x] 4.1 Dans `src/app/alerts/page.tsx`, modifier la requête pour les nouveaux : `status='new' AND consecutive_absences >= 1`
- [x] 4.2 Modifier la requête pour les membres : `status='absent_to_relaunch' OR (status != 'new' AND consecutive_absences >= 2)`
- [x] 4.3 Créer la section "🌟 Nouveaux à relancer" avec style visuel distinct (badge, couleur)
- [x] 4.4 Conserver la section "🔴 Membres à relancer" avec le style existant
- [x] 4.5 Vérifier que la visite pastorale pour un nouveau réinitialise `consecutive_absences` sans changer le statut

## 5. Statistiques des nouvelles âmes — Dashboard BERGER

- [x] 5.1 Dans `src/lib/utils/stats.ts`, implémenter `getNewcomersByPeriod(shepherdId, startDate, endDate, granularity)` retournant `TrendPoint[]`
- [x] 5.2 Implémenter `getNewcomerRetentionRate(shepherdId?, period?)` retournant les taux de rétention 2e/3e/4e dimanche
- [x] 5.3 Implémenter `getAverageIntegrationTime(shepherdId?, period?)` retournant le nombre moyen de jours d'intégration
- [x] 5.4 Implémenter `getNewcomerConversionRate(shepherdId?, period?)` retournant `{ total_new, graduated, rate_pct }`
- [x] 5.5 Dans `src/app/page.tsx` (dashboard berger), ajouter le KPI "Nouvelles Âmes" cliquable vers `/members`
- [x] 5.6 Dans `src/app/reports/page.tsx`, enrichir la section "Progression Nouveaux Membres" avec taux de retour hebdomadaire et nouveaux inscrits
- [x] 5.7 Dans `src/app/admin/super-dashboard/components/EvolutionTab.tsx`, ajouter le graphique "Nouvelles Âmes par Période" (secondaire, pour le pasteur)
- [x] 5.8 Dans `src/app/admin/super-dashboard/page.tsx`, ajouter les KPIs globaux nouveaux (secondaire)

## 6. Vérification

- [x] 6.1 Appliquer la migration DB et vérifier qu'un nouveau absent reste `status='new'`
- [x] 6.2 Vérifier que l'onglet "Nouveaux" affiche les `status='new'` et que l'onglet "Actifs" les exclut
- [x] 6.3 Vérifier que la feuille de présence du berger (`/attendance`) distingue les nouveaux avec badge et progression
- [x] 6.4 Vérifier que les alertes se déclenchent dès 1 absence pour les nouveaux
- [x] 6.5 Vérifier que le KPI "Nouvelles Âmes" s'affiche sur le dashboard berger (`/`)
- [x] 6.6 Vérifier que les rapports (`/reports`) affichent la progression X/4 et le taux de retour
- [x] 6.7 Vérifier la graduation automatique après 4 présences dimanche
- [x] 6.8 Exécuter `npm run build` et vérifier l'absence d'erreurs

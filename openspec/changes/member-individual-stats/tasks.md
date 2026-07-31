# Tâches : Statistiques Individuelles du Fidèle

## 1. Installation des dépendances

- [x] 1.1 Installer `recharts` (`npm install recharts`)

## 2. Fonctions stats backend

- [x] 2.1 Implémenter `getMemberStats()` dans `src/lib/utils/stats.ts`
- [x] 2.2 Implémenter `getMemberAttendanceTrend()` dans `src/lib/utils/stats.ts`
- [ ] 2.3 Tester les calculs manuellement avec des données réelles

## 3. Composants UI

- [x] 3.1 Créer `PeriodSelector.tsx` — presets + date range custom
- [x] 3.2 Créer `MemberRegularityBadge.tsx` — badge spectre 4 niveaux
- [x] 3.3 Créer `MemberStatsKPIs.tsx` — 4 cartes KPI
- [x] 3.4 Créer `MemberAttendanceChart.tsx` — courbe multi-programmes Recharts
- [x] 3.5 Créer `MemberProgramBars.tsx` — barres horizontales par programme

## 4. Page dédiée

- [x] 4.1 Créer `src/app/members/[id]/page.tsx` — Server Component avec layout
- [x] 4.2 Intégrer tous les composants dans la page
- [x] 4.3 Gérer le cas membre archivé (message d'information)
- [x] 4.4 Gérer le cas membre inexistant (404)

## 5. Navigation

- [x] 5.1 Ajouter bouton "Voir stats" sur chaque carte dans `src/app/members/page.tsx`
- [x] 5.2 Ajouter bouton "← Retour" dans la page stats
- [x] 5.3 Passer la période via URL search params (`?from=&to=`)

## 6. Validation

- [x] 6.1 Vérifier que les calculs respectent l'éligibilité par classe
- [x] 6.2 Vérifier que la courbe est lisible avec 5 programmes
- [x] 6.3 Vérifier le responsive mobile
- [x] 6.4 Vérifier la navigation retour depuis la page stats

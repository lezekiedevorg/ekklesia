## ADDED Requirements

### Requirement: KPI Nouvelles Âmes sur le dashboard du berger
Le dashboard personnel du berger (`/`) SHALL afficher un KPI "Nouvelles Âmes" avec le nombre de membres ayant `status='new'` assignés au berger. Ce KPI SHALL être cliquable et rediriger vers l'onglet "Nouveaux" de la page `/members`.

#### Scenario: KPI sur le dashboard berger
- **WHEN** un berger consulte son dashboard personnel (`/`)
- **THEN** un bloc KPI "Nouvelles Âmes" est visible avec le compteur de ses nouveaux
- **AND** cliquer sur ce KPI redirige vers `/members` (onglet Nouveaux)

### Requirement: Progression des nouveaux dans les rapports hebdomadaires
La section "Progression Nouveaux Membres" des rapports (`/reports`) SHALL afficher la liste des nouveaux du berger avec leur progression X/4 et le taux de retour de la semaine.

#### Scenario: Rapport hebdomadaire enrichi
- **WHEN** un berger consulte l'aperçu de son rapport hebdomadaire sur `/reports`
- **THEN** la section nouveaux affiche chaque nouveau avec sa progression (X/4 dimanches)
- **AND** un taux de retour indique le pourcentage de nouveaux de la semaine dernière qui sont revenus
- **AND** le nombre de nouveaux inscrits cette semaine est affiché

### Requirement: Fonctions de stats nouveaux (serveur)
Le système SHALL fournir les fonctions suivantes dans `src/lib/utils/stats.ts`, filtrables par `shepherdId` :

#### Scenario: getNewcomersByPeriod
- **WHEN** le système appelle `getNewcomersByPeriod(shepherdId, startDate, endDate, granularity)`
- **THEN** il retourne un tableau `TrendPoint[]` avec le nombre de nouveaux créés par semaine ou mois

#### Scenario: getNewcomerRetentionRate
- **WHEN** le système appelle `getNewcomerRetentionRate(shepherdId, period)`
- **THEN** il retourne `{ returned_2nd, returned_3rd, returned_4th }` avec les pourcentages de rétention

#### Scenario: getAverageIntegrationTime
- **WHEN** le système appelle `getAverageIntegrationTime(shepherdId, period)`
- **THEN** il retourne le nombre moyen de jours entre `created_at` et la graduation en `status='member'`

#### Scenario: getNewcomerConversionRate
- **WHEN** le système appelle `getNewcomerConversionRate(shepherdId, period)`
- **THEN** il retourne `{ total_new, graduated, rate_pct }` avec le taux de conversion

### Requirement: KPIs et graphique dans le super-dashboard admin (secondaire)
Le super-dashboard admin (`/admin/super-dashboard`) SHALL afficher des KPIs globaux et un graphique d'évolution des nouvelles âmes pour le pasteur.

#### Scenario: KPI dans la Vue Globale admin
- **WHEN** un administrateur consulte l'onglet "Vue Globale" du super-dashboard
- **THEN** un bloc KPI "Nouvelles âmes (période)" est visible avec le compteur global de nouveaux

#### Scenario: Graphique dans l'onglet Evolution admin
- **WHEN** un administrateur consulte l'onglet "Evolution" du super-dashboard
- **THEN** un graphique "Nouvelles Âmes par Période" affiche le nombre de nouveaux créés par semaine/mois

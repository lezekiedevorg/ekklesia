## Why

L'administrateur de l'église a besoin d'une vue complète et centralisée de toute l'activité ecclésiale. Actuellement, les bergers, leaders et pasteurs ont chacun leur scope de visibilité, mais il n'existe pas de "centre de commandement" qui offre à l'administrateur une vision transversale : départements ministériels, comparaison des bergers, évolution des groupes et statistiques globales. De plus, le processus d'accueil des nouveaux venus (dimanche) n'est pas formalisé dans le système — le département "Amis des Nouveaux" n'a pas d'outil dédié pour enregistrer et suivre les nouveaux convertis.

## What Changes

- **Départements ministériels** : nouvelle entité (Jeunesse, Musique, Ordre, Amis des Nouveaux, Prière, Évangélisation) avec gestion many-to-many membres-départements.
- **Enregistrement des nouveaux venus** : workflow dédié pour le département "Amis des Nouveaux" — formulaire d'enregistrement avec assignment automatique du berger (via l'inviteur ou choix manuel pour les walk-in).
- **Super Dashboard** : centre de commandement avec KPIs globaux, arbre organisationnel, alertes et vue hebdomadaire.
- **Moteur de statistiques** : agrégation centralisée (assiduité, discipline, évangélisation, rapports) avec scoring configurable des bergers.
- **Stats comparatives** : comparaison bergers vs bergers, groupes vs groupes, départements vs départements.
- **Évolution temporelle** : graphiques weekly/monthly avec période personnalisable — évolution des membres et de l'assiduité par programme.

## Capabilities

### New Capabilities
- `department-management`: CRUD départements + assignation membres (many-to-many), gestion des rôles dans les départements
- `newcomer-registration`: Workflow d'accueil et enregistrement des nouveaux venus avec assignment automatique du berger (inviter ou walk-in)
- `super-admin-dashboard`: Centre de commandement avec KPIs globaux, arbre organisationnel, alertes et vue hebdomadaire
- `stats-engine`: Moteur d'agrégation de statistiques (assiduité, discipline, évangélisation, rapports) avec scoring configurable des bergers
- `comparative-stats`: Comparaison multi-entités (bergers, groupes, départements) avec tableaux et graphiques
- `evolution-charts`: Graphiques temporels (weekly/monthly) avec période personnalisable — évolution des membres et assiduité par programme

### Modified Capabilities
- `user-roles-hierarchy`: Ajout de nouvelles permissions (`departments:view/edit/assign`, `newcomers:register/view_all`, `stats:view_global/compare/evolution`, `super_dashboard:view`)

## Impact

- Nouvelle migration SQL : tables `departments`, `member_departments`, `newcomer_registrations` + colonne `residence_location` sur `members`
- Nouveau module `src/lib/utils/stats.ts` (moteur d'agrégation statistique)
- 6 nouvelles routes sous `/admin/` (super-dashboard, departments, departments/[id], newcomers, stats, stats/evolution)
- Nouveaux composants UI pour le dashboard, formulaires et graphiques
- Permissions ajoutées dans `app_permissions` et `app_role_permissions`
- Score berger pondéré configurable via `app_settings` (`shepherd_score_weights`)
- Mise à jour de `src/types/db.ts` avec les nouvelles interfaces

## Context

L'application de gestion ecclésiale compte actuellement ~342 membres répartis en 3 groupes pastoraux (Puissance, Gloire, Sagesse) avec 24 bergers. Le système gère déjà les présences (5 programmes), les disciplines spirituelles, les rapports hebdomadaires et les alertes pastorales. Cependant :

- Aucune vue centralisée pour l'administrateur/pasteur sur l'ensemble de l'église
- Pas de concept de "départements ministériels" (Musique, Jeunesse, etc.)
- Le processus d'accueil des nouveaux venus n'est pas formalisé
- Pas de statistiques comparatives ni d'évolution temporelle
- Le scoring des bergers n'existe pas

Les données existantes (members, attendance, shepherd_activities, weekly_reports) sont suffisantes pour alimenter le moteur de statistiques. La table `app_settings` existe déjà pour la configuration dynamique.

## Goals / Non-Goals

**Goals:**
- Créer un modèle de données pour les départements ministériels (many-to-many avec les membres)
- Formaliser le workflow d'enregistrement des nouveaux venus (Amis des Nouveaux)
- Fournir un centre de commandement (super dashboard) avec KPIs, org tree et alertes
- Construire un moteur de statistiques agrégées (assiduité, discipline, évangélisation)
- Permettre la comparaison multi-entités (bergers, groupes, départements)
- Afficher l'évolution temporelle (weekly/monthly) avec période personnalisable
- Rendre le scoring des berges configurable (poids via app_settings)

**Non-Goals:**
- Multi-église (reporté à plus tard)
- Notifications push ou emails automatiques
- Export PDF/Excel des rapports (existe déjà partiellement)
- Application mobile native
- Intégration avec des services tierces (WhatsApp, etc.)

## Decisions

### D-1: Departments vs Groups — Concepts distincts (modèle matriciel)

**Décision** : Les départements et les groupes pastoraux sont deux concepts orthogonaux.

**Rationale** :
- `groups` (Puissance, Gloire, Sagesse) = axe pastoral — chaque fidèle appartient à UN seul groupe, supervisé par un berger
- `departments` (Jeunesse, Musique, etc.) = axe ministériel — un fidèle peut participer à 0..N départements

**Alternatives considérées** :
- Réutiliser `groups` pour les départements → rejeté car les groupes ont un rôle pastoral sémantique fort (berger attitré, rapports hebdomadaires)
- Créer une hiérarchie departments → groups → members → trop complexe pour le besoin actuel

**Conséquence** : Table de jointure `member_departments` (many-to-many) avec colonne `role` ('member', 'leader', 'responsible').

### D-2: Newcomer Registration — Workflow dédié

**Décision** : Le département "Amis des Nouveaux" a un workflow opérationnel avec assignment automatique du berger.

**Flux d'assignment** :
1. Nouveau arrive (invité par un membre OU walk-in)
2. Si invité : lookup du berger de l'inviteur → assignment automatique
3. Si walk-in : choix manuel du berger par le registrar + flag `is_self_initiated`
4. Le membre est créé avec `status='new'`, `consecutive_sundays_present=1`
5. L'intégration sur 4 dimanches démarre automatiquement (trigger existant)

**Alternatives considérées** :
- Round-robin automatique pour les walk-in → rejeté car le choix humain est préférable (affinités, disponibilité)
- Pas d'assignment auto → rejeté car cela crée des membres orphelins non suivis

### D-3: Stats Engine — On-demand computation

**Décision** : Les statistiques sont calculées à la volée depuis les données brutes, pas pré-agrégées.

**Rationale** :
- Flexibilité : période personnalisable sans limites
- Simplicité : pas de table de snapshots à maintenir
- Performance : les données actuelles (< 1000 membres, < 50 bergers) permettent des requêtes directes performantes

**Alternatives considérées** :
- Materialized views PostgreSQL → surdimensionné pour le volume actuel
- Table de snapshots avec cron job → trop complexe à maintenir

**Fallback** : Si les performances se dégradent (> 1000 membres), ajouter une table `stats_snapshots` avec calcul hebdomadaire.

### D-4: Shepherd Score — Formule configurable

**Décision** : Le score berger est un score composite 0-5 étoiles basé sur des poids configurables via `app_settings`.

**Formule** :
```
score = Σ (normalized_metric × weight) / 100
```

**Métriques et poids par défaut** :
- Assiduité des membres (dimanche) : 30%
- Discipline personnelle (prière + méditation) : 25%
- Évangélisation & âmes gagnées : 20%
- Soumission des rapports : 15%
- Visites & appels pastoraux : 10%

**Normalisation** : chaque métrique est normalisée en 0-5 :
- 0-40% → 1★, 40-60% → 2★, 60-75% → 3★, 75-90% → 4★, 90-100% → 5★

**Stockage** : `app_settings.key = 'shepherd_score_weights'`, value = JSONB avec les poids.

### D-5: Evolution Granularity — Toggle weekly/monthly

**Décision** : Les graphiques d'évolution supportent le basculement weekly/monthly avec période personnalisable.

**Implémentation** : Le client envoie `granularity: 'week' | 'month'` et `startDate/endDate`. L'agrégation groupe les données par semaine (lundi-dimanche) ou par mois (1er-dernier jour) selon le choix.

### D-6: Permissions — Rôles autorisés

**Décision** : super_admin, admin et pasteur peuvent gérer les départements et voir les stats globales. Les leaders et bergers restent dans leur scope pastoral.

**Nouvelles permissions** :
- `departments:view/edit/assign` → super_admin, admin, pastor
- `newcomers:register` → super_admin, admin, pastor, leader, shepherd
- `newcomers:view_all` → super_admin, admin, pastor, leader
- `stats:view_global/compare/evolution` → super_admin, admin, pastor
- `super_dashboard:view` → super_admin, admin, pastor

## Risks / Trade-offs

**[Performance stats on-demand]** → Mitigation : indexation agressive sur les colonnes de jointure et de date. Monitoring des temps de réponse. Fallback : materialized views si > 1000 membres.

**[Complexité du modèle matriciel]** → Mitigation : les RLS policies existantes couvrent déjà les accès via `is_pastor()`. Les nouvelles tables utilisent les mêmes patterns.

**[Score berger subjectif]** → Mitigation : les poids sont configurables par le pasteur. La formule est transparente et auditée.

**[Migration des données existantes]** → Mitigation : pas de migration de données existantes nécessaire. Les départements sont une couche supplémentaire, pas un remplacement.

## Migration Plan

1. Exécuter la migration SQL (tables + seed)
2. Déployer le code backend (stats engine, server actions)
3. Déployer le code frontend (dashboard, pages)
4. Vérifier les permissions et RLS
5. Tester avec les données existantes

**Rollback** : Les nouvelles tables peuvent être supprimées sans affecter les données existantes. Les anciennes routes restent fonctionnelles.

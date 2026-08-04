## Context

Le système de gestion d'église utilise une table `members` avec un statut `member_status` ENUM (`'new'`, `'in_integration'`, `'member'`, `'absent_to_relaunch'`, `'archived'`). Un trigger DB (`handle_sunday_attendance_update`) gère automatiquement les transitions de statut basées sur la présence au culte dominical.

**Problème actuel** : les `status='new'` sont mélangés aux membres confirmés dans la page `/members`. Le trigger passe immédiatement un nouveau en `'absent_to_relaunch'` dès la 1ère absence, ce qui le sort du processus d'intégration au lieu de le maintenir dans un suivi de fidélisation.

**Contraintes** :
- Pas de modification de schéma DB (pas de nouvelles colonnes ou tables)
- Le trigger existe déjà, il faut seulement modifier sa logique
- Les données existantes doivent rester compatibles
- Le système RLS ne change pas

## Goals / Non-Goals

**Goals:**
- Séparer visuellement les nouveaux des membres confirmés dans l'UI
- Maintenir les nouveaux en `status='new'` malgré les absences (pas de `absent_to_relaunch`)
- Alerter le berger dès 1 absence d'un nouveau (vs 2 pour les membres)
- Fournir des stats complètes sur le pipeline des nouvelles âmes
- Permettre l'appel de présence différencié

**Non-Goals:**
- Créer une table `newcomers` séparée (on utilise le champ `status` existant)
- Ajouter un workflow d'intervention en étapes (visite d'accueil, appel, etc.) — rester sur le compteur X/4
- Modifier le système WhatsApp pour les nouveaux
- Gérer les notifications push automatiques

## Decisions

### D1 : Garder `status='new'` au lieu de créer un nouveau statut

**Choix** : Ne pas ajouter de statut `'nouveau'` à l'ENUM DB. Utiliser le `'new'` existant.

**Raison** : L'ENUM est déjà défini dans 3 migrations successives. Ajouter une valeur nécessite une migration ALTER TYPE et potentiellement casser des requêtes existantes. Le statut `'new'` a déjà la bonne sémantique — c'est le filtre UI qui sépare, pas le statut.

**Alternative rejetée** : Ajouter `'nouveau'` à l'ENUM — trop de risques pour un changement cosmétique.

### D2 : Modification du trigger plutôt que logique applicative

**Choix** : Modifier le trigger PL/pgSQL `handle_sunday_attendance_update` dans une nouvelle migration.

**Raison** : Le trigger est la source de vérité pour les transitions de statut. Déplacer la logique côté applicatif créerait une incohérence si quelqu'un insère des données directement en DB. Le trigger est le bon endroit.

**Alternative rejetée** : Logique côté client (React) — non fiable, dépend de l'UI.

### D3 : Deux sections dans la même page d'alertes

**Choix** : Une seule page `/alerts` avec deux sections : "Nouveaux à relancer" et "Membres à relancer".

**Raison** : Créer une page séparée pour les alertes nouveaux fragmenterait l'expérience du berger. Deux sections dans la même page permettent de tout voir en un coup d'œil avec une distinction claire.

**Alternative rejetée** : Page `/alerts/newcomers` séparée — trop de navigation pour le berger.

### D4 : Stats sur le dashboard du berger, pas le super-dashboard admin

**Choix** : Les KPIs et stats des nouveaux sont ajoutés sur le dashboard personnel du berger (`/`) et ses rapports (`/reports`). Le super-dashboard admin reçoit une version secondaire (globale) pour le pasteur.

**Raison** : Le berger ne voit pas le super-dashboard admin. Son interface quotidienne est son dashboard (`/`), ses rapports (`/reports`) et sa feuille de présence (`/attendance`). Les stats doivent être là où il travaille, pas dans un espace admin qu'il n'atteint pas.

**Alternative rejetée** : Tout mettre dans le super-dashboard admin — le berger n'y a pas accès.

## Risks / Trade-offs

| Risque | Mitigation |
|--------|-----------|
| Un nouveau reste `new` indéfiniment s'il ne vient plus | L'onglet "Nouveaux" affiche la date de création. Les alertes se déclenchent dès 1 absence. Le berger peut archiver manuellement après une période raisonnable. |
| Performance de la requête d'alertes avec 2 conditions OR | Les index existants (`idx_members_status`, `idx_members_shepherd_id`) couvrent les filtres. Pas de risque significatif. |
| Les membres déjà en `absent_to_relaunch` avant la migration | Ils continuent de fonctionner normalement. Le trigger ne modifie pas leur comportement existant. |
| Confusion entre "Nouveau" (status) et "Nouveau" (onglet) | L'onglet affiche "Nouvelles Âmes" pour lever l'ambiguïté. Le badge dans l'appel utilise "Nouveau". |

## Migration Plan

1. Créer la migration `20260803000000_newcomer_no_absent_to_relaunch.sql`
2. Modifier la fonction `handle_sunday_attendance_update` : retirer la transition `new → absent_to_relaunch`
3. Appliquer la migration sur la DB
4. Déployer les changements frontend (onglets, alertes, stats)
5. Vérifier : un nouveau absent reste `new`, les alertes se déclenchent correctement

**Rollback** : Restaurer l'ancienne version du trigger depuis `20260721000010_fix_attendance_and_alerts.sql`.

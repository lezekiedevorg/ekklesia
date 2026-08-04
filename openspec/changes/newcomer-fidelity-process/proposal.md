## Why

Les nouveaux fidèles sont actuellement mélangés avec les membres confirmés dans la liste du berger. Un visiteur qui vient une seule fois apparaît immédiatement dans la liste officielle, et s'il manque un seul dimanche, le trigger DB le passe en `"absent_to_relaunch"`, le sortant du processus d'intégration. Il n'y a pas de phase de test, pas de suivi personnalisé des nouvelles âmes, et pas de statistiques sur l'évolution des nouveaux par période.

L'objectif est de mettre en place un processus de fidélisation : les nouveaux doivent être suivis dans un onglet dédié, avec un système d'alertes différencié, un appel de présence distinctif, et des statistiques complètes (rétention, temps d'intégration, conversion).

## What Changes

- **Trigger DB modifié** : les nouveaux (`status='new'`) restent en `"new"` même lorsqu'ils manquent un dimanche (au lieu de passer en `"absent_to_relaunch"`). Le compteur `consecutive_absences` s'incrémente mais le statut ne change que lors de la graduation automatique à 4 présences dimanche.
- **Onglet "Nouveaux"** ajouté dans la page `/members` : affiche uniquement les `status='new'` avec progression d'intégration (X/4 dimanches), date de première visite, invité par, dernier passage.
- **Onglet "Actifs" filtré** : ne contient plus les `status='new'`, seulement les membres confirmés et en intégration.
- **Appel de présence du berger différencié** : badge "Nouveau" dans la feuille de présence du berger (`/attendance`), séparation visuelle entre nouvelles âmes et membres confirmés.
- **Alertes en 2 sections** : "Nouveaux à relancer" (dès 1 absence) et "Membres à relancer" (règles existantes : 2+ absences ou `absent_to_relaunch`).
- **Dashboard du berger enrichi** : KPI "Nouvelles Âmes" sur le dashboard personnel du berger (`/`).
- **Rapports hebdomadaires enrichis** : progression X/4 des nouveaux, taux de retour hebdomadaire dans `/reports`.
- **Statistiques serveur** : fonctions de stats nouveaux (rétention, intégration, conversion) dans `stats.ts`, utilisées par le dashboard et les rapports du berger.
- **Super-dashboard admin (secondaire)** : KPIs et graphique "Nouvelles Âmes" dans le super-dashboard pour le pasteur.

## Capabilities

### New Capabilities
- `newcomer-tab`: Onglet dédié aux nouvelles âmes dans la page membres avec carte de progression d'intégration
- `newcomer-alerts`: Système d'alertes différencié pour les nouveaux (seuil d'absence distinct, section séparée)
- `newcomer-stats`: Statistiques complètes sur les nouvelles âmes (rétention, intégration, conversion, évolution)

### Modified Capabilities
- `attendance-tracking`: Séparation visuelle des nouveaux dans la liste d'appel de présence
- `member-lifecycle`: Modification du trigger DB pour que les nouveaux ne passent pas en `absent_to_relaunch`

## Impact

- **DB** : 1 nouvelle migration SQL (modification du trigger `handle_sunday_attendance_update`). Aucune modification de schéma, aucun changement de colonnes.
- **Frontend** : 8 fichiers modifiés (`members/page.tsx`, `attendance/page.tsx`, `alerts/page.tsx`, `stats.ts`, `page.tsx` (dashboard berger), `reports/page.tsx`, `super-dashboard/page.tsx`, `EvolutionTab.tsx`)
- **Pas de breaking change** : les données existantes restent compatibles. Les membres déjà en `"absent_to_relaunch"` continuent de fonctionner normalement.
- **RLS** : aucune modification des politiques de sécurité nécessaires.

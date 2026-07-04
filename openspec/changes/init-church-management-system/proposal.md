## Why

L'église a besoin d'un outil centralisé et accessible sur smartphone pour permettre le suivi des âmes par les bergers, la supervision par les responsables des 3 groupes (Puissance, Gloire, Sagesse), et la vision stratégique globale par le pasteur. Actuellement, la dispersion des informations rend difficile le suivi spirituel (assiduité, intégration des nouveaux, visites pastorales) et le reporting hebdomadaire.

## What Changes

- Création d'une application web responsive (Next.js PWA) couplée à une base de données cloud moderne (Supabase PostgreSQL + Auth).
- Mise en place d'un système de gestion de profils à 4 niveaux : Pasteur, Responsables de groupe, Bergers et Membres (fidèles).
- Intégration du suivi différencié des présences selon le type de programme (cultes généraux vs classes d'enseignement du mardi/mercredi).
- Suivi automatique de l'intégration des nouveaux sur 4 dimanches avec mise en pause en cas d'absence.
- Système d'alertes automatiques en cas d'absences répétées pour déclencher des visites pastorales (avec enregistrement du motif).
- Clôture et archivage chaque dimanche soir des rapports hebdomadaires par berger (statistiques de présence, liste et motifs des absents, bilan spirituel personnel du berger).

## Capabilities

### New Capabilities
- `user-roles-hierarchy`: Gestion des rôles et de la hiérarchie à 4 niveaux (Pasteur, Responsables des groupes Puissance/Gloire/Sagesse, Bergers, Membres) avec sécurité RLS.
- `attendance-tracking`: Prise de présence pour les programmes généraux (Jeudi en ligne, Vendredi, Dimanche) et les classes (Mardi, Mercredi) avec filtrage des listes.
- `class-progression`: Gestion de l'inscription, de la promotion, de la régression et du retrait des fidèles dans les classes d'enseignement du Mardi et du Mercredi.
- `new-member-integration`: Suivi sur 4 dimanches de présence pour valider l'intégration d'un nouveau, avec logique de suspension et relance sans réinitialisation du compteur.
- `pastoral-care-alerts`: Détection automatique des absences prolongées (2+ dimanches consécutifs), génération d'alertes visuelles et journalisation des visites pastorales avec motifs.
- `shepherd-activities-reporting`: Suivi quotidien de la discipline du berger (méditation, heures de prière, évangélisation, veillée) et génération de rapports hebdomadaires consolidés le dimanche soir.

### Modified Capabilities

## Impact

- Mise en place d'un nouveau repository Next.js (App Router, Tailwind CSS, PWA).
- Configuration d'un projet Supabase avec schémas relationnels SQL, authentification et politiques Row Level Security (RLS).

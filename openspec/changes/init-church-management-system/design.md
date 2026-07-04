## Context

L'église comporte une hiérarchie à 4 niveaux (Pasteur, Responsables des groupes Puissance/Gloire/Sagesse, Bergers, et Fidèles/Âmes). Actuellement, le suivi des présences, l'intégration des nouveaux fidèles et le contrôle des activités spirituelles des bergers sont gérés de manière dispersée, sans outil centralisé. Le besoin est une application mobile-first (responsive web / PWA) permettant une saisie rapide par les bergers, une validation par les responsables et un audit par le pasteur.

## Goals / Non-Goals

**Goals:**
- Mettre en place un backend sécurisé sur Supabase avec des règles Row Level Security (RLS) reflétant la hiérarchie de l'église.
- Développer une interface PWA réactive et optimiste (Optimistic UI) en Next.js pour supporter la prise de présence rapide et les zones à faible connectivité réseau dans l'église.
- Gérer la différenciation des listes de présence entre les cultes généraux et les classes d'enseignement du mardi et mercredi.
- Automatiser le cycle de validation d'un nouveau sur 4 dimanches de présence (avec suspension en cas d'absence) et déclencher des alertes automatiques à 2+ absences consécutives.
- Permettre la consolidation et l'archivage figé des rapports hebdomadaires chaque dimanche soir.

**Non-Goals:**
- Gestion financière (dîmes, offrandes, dons).
- Diffusion vidéo / streaming en direct dans l'application.
- Application mobile native sur les stores (iOS App Store / Google Play Store) au lancement (PWA privilégiée).

## Decisions

### 1. Next.js App Router & PWA vs Application Mobile Native
- **Choix :** Next.js avec capacités PWA.
- **Rationale :** Permet un déploiement instantané sans validation des stores, tout en offrant une installation sur écran d'accueil sur Android et iOS.
- **Alternatives considérées :** React Native / Flutter (coût de maintenance plus élevé, publication plus lente).

### 2. Supabase (PostgreSQL + Auth) vs Firebase NoSQL
- **Choix :** Supabase (PostgreSQL).
- **Rationale :** Les rapports hebdomadaires nécessitent des jointures complexes (Membres -> Bergers -> Groupes) et des calculs d'agrégation précis qui sont naturels et performants en SQL, combinés aux règles RLS natives de PostgreSQL pour sécuriser l'accès par niveau hiérarchique.
- **Alternatives considérées :** Firebase Firestore (requêtes relationnelles limitées et coût de lecture plus élevé sur les rapports agrégés).

### 3. Archivage Snapshot des Rapports Hebdomadaires (`JSONB` dans `weekly_reports`)
- **Choix :** Stocker une capture figée (`JSONB`) des données lors de la soumission du rapport le dimanche soir.
- **Rationale :** Évite qu'une modification ultérieure sur le profil ou la présence d'un membre ne vienne altérer un rapport historique déjà validé par le pasteur ou le responsable.

## Risks / Trade-offs

- [Faible connectivité internet dans les salles de culte] → Mitigation : Utilisation d'Optimistic UI dans les composants de formulaire pour un retour instantané et gestion de cache en arrière-plan.
- [Complexité de saisie pour des utilisateurs peu à l'aise avec la technologie] → Mitigation : Interface épurée avec de grands boutons tactiles et filtrage automatique des listes de présence par classe pour minimiser le nombre de clics.

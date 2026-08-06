## Context

Le projet Church Management est une application Next.js 16 qui utilise Supabase comme backend (Auth + Postgres). Actuellement, une seule instance Supabase est utilisée pour le développement et la production, ce qui pose un risque de corruption des données.

**État actuel** :
- Supabase cloud unique (ref: `lzfnmjojlymmnkhlpcda`)
- Variables d'environnement dans `.env.local` (gitignored)
- WhatsApp via `whatsapp-web.js` (nécessite un vrai téléphone)
- MiniMax AI pour les conversations pastorales
- Cron jobs via routes HTTP protégées par `CRON_SECRET`
- Pas de configuration multi-environnement
- Pas de Docker, pas de CI/CD configuré

**Contraintes** :
- Windows comme OS de développement
- Docker Desktop disponible pour Supabase CLI
- Vercel comme plateforme de déploiement cible

## Goals / Non-Goals

**Goals:**
- Isoler complètement l'environnement de développement de la production
- Permettre le développement sans risque de pollution des données réelles
- Rendre le développement local autonome (pas d'appels API externes en dev)
- Documenter clairement le workflow dev vs prod
- Automatiser le déploiement sur Vercel avec cron jobs

**Non-Goals:**
- Migrer les données de production vers un nouvel environnement
- Changer la stack technique (Next.js, Supabase, Vercel restent)
- Implémenter un système de staging intermédiaire
- Créer des tests d'intégration automatisés (hors scope)
- Gérer plusieurs développeurs simultanément (un seul dev actuellement)

## Decisions

### Décision 1 : Supabase CLI local vs deuxième projet cloud

**Choix** : Supabase CLI local (`supabase start`)

**Raison** :
- Isolation complète des données (Postgres local)
- Pas de dépendance au réseau pour le développement
- Cohérence parfaite avec la prod (mêmes migrations)
- Gratuit (pas de coût Supabase supplémentaire)

**Alternatives considérées** :
- Deuxième projet Supabase cloud : coûteux, toujours dépendant du réseau
- Postgres vanilla sans Supabase : perd Auth/Storage/Edge functions

### Décision 2 : Stub vs Mock pour WhatsApp

**Choix** : Stub complet contrôlé par `WHATSAPP_ENABLED`

**Raison** :
- Pas besoin de téléphone réel en dev
- Pas de risque de blocage de compte WhatsApp
- Développement plus rapide (pas de scan QR)
- Facile à activer/désactiver

**Alternatives considérées** :
- Mode "test" avec un vrai téléphone : risqué, lent
- API Cloud Meta : nécessite compte dev, complexité ajoutée

### Décision 3 : Mock déterministe pour MiniMax

**Choix** : Mock avec réponses fixes contrôlé par `MINIMAX_ENABLED`

**Raison** :
- Pas de consommation API en dev
- Réponses prévisibles pour le debugging
- Peut simuler des cas d'alerte (mots-clés dans le message)

**Alternatives considérées** :
- Clé API dev séparée : coûteux même en dev
- Pas de mock : bloque le développement sans clé

### Décision 4 : Fichiers .env séparés vs single-file

**Choix** : `.env.development` + `.env.production.example`

**Raison** :
- Next.js charge automatiquement `.env.development` quand `NODE_ENV=development`
- Séparation claire des configurations
- `.env.production.example` commité comme template
- Secrets prod dans Vercel dashboard (pas dans les fichiers)

**Alternatives considérées** :
- Un seul fichier avec commentaires : confusion possible
- Outil tiers (dotenv-flow) : dépendance inutile

### Décision 5 : Scripts npm vs Docker Compose

**Choix** : Scripts npm (`db:start`, `db:stop`, etc.)

**Raison** :
- `supabase start` gère déjà Docker en interne
- Plus simple qu'un docker-compose.yml custom
- Cohérent avec l'écosystème npm
- Moins de fichiers à maintenir

**Alternatives considérées** :
- docker-compose.yml custom : redondant avec supabase CLI
- Makefile : moins familier pour les devs JS

## Risks / Trade-offs

**[Risque] Docker Desktop non installé** → **Atténuation** : Documentation claire dans README, alternative manuelle avec Postgres vanilla

**[Risque] WhatsApp-web.js force le build en prod** → **Atténuation** : Import conditionnel via flag `WHATSAPP_ENABLED`, le module n'est pas chargé si désactivé

**[Risque] Dérive entre stub et code réel** → **Atténuation** : Même interface TypeScript, tests E2E peuvent valider le flow complet

**[Risque] Secrets prod accidentellement commités** → **Atténuation** : `.env.production` gitignored, template `.env.production.example` commité, secrets dans Vercel dashboard uniquement

**[Trade-off] Supabase local = Docker obligatoire** → Accepté car Docker Desktop est standard sur Windows dev

**[Trade-off] Mock MiniMax = moins réaliste** → Accepté car le dev se concentre sur la logique, pas la qualité des réponses AI

## Why

Le projet Church Management utilise actuellement une seule configuration Supabase (production). Le développeur travaille directement sur la base de données de production lors du développement, ce qui crée un risque élevé de pollution des données réelles. Ce changement permet d'isoler l'environnement de développement avec une base de données locale Supabase tout en conservant la production sur Supabase cloud + Vercel.

## What Changes

- **Ajouter un environnement de développement local** : Supabase CLI fonctionnant localement via Docker Desktop
- **Créer des stubs/mocks pour les services externes** : WhatsApp et MiniMax AI peuvent être désactivés en dev pour éviter les appels réels
- **Configurer Vercel pour la production** : Déploiement automatisé avec cron jobs planifiés
- **Documenter le setup multi-environnement** : README avec instructions claires pour dev et prod

## Capabilities

### New Capabilities
- `environment-isolation`: Configuration multi-environnement avec `.env.development` et `.env.production`, règles gitignore, chargement automatique des variables selon NODE_ENV
- `whatsapp-mocking`: Stub du client WhatsApp contrôlé par flag `WHATSAPP_ENABLED`, retourne des réponses mock sans appeler whatsapp-web.js ni nécessiter de téléphone réel
- `minimax-mocking`: Mock du client MiniMax AI contrôlé par flag `MINIMAX_ENABLED`, retourne des réponses déterministes sans consommer de ressources API
- `vercel-deployment`: Configuration Vercel avec cron jobs pour `/api/cron/daily-conversations` et `/api/cron/weekly-report`, documentation des variables d'environnement requises

### Modified Capabilities
<!-- Aucune capability existante modifiée (première itération du projet) -->

## Impact

**Fichiers à créer** :
- `.env.development` (gitignored) - Variables pour environnement local
- `.env.production.example` (commité) - Template pour production
- `vercel.json` - Configuration cron jobs
- `supabase/config.toml` - Configuration Supabase CLI local

**Fichiers à modifier** :
- `src/lib/whatsapp/client.ts` - Ajouter support mode stub via `WHATSAPP_ENABLED`
- `src/app/api/whatsapp/qr/route.ts` - Retourner statut stub quand disabled
- `src/app/api/whatsapp/webhook/route.ts` - Gérer mode stub sans erreur
- `src/lib/ai/minimax-client.ts` - Ajouter support mode mock via `MINIMAX_ENABLED`
- `.gitignore` - Ajouter `.env.development`, `.env.production`
- `package.json` - Scripts npm pour gestion DB (db:start, db:stop, db:reset, db:seed)
- `README.md` - Documenter setup dev et prod

**Dépendances à installer** :
- `@supabase/cli` (devDependency) - CLI pour gérer Supabase local

**Prérequis** :
- Docker Desktop installé sur Windows (requis par Supabase CLI)

# Church Management System

Application de gestion d'église construite avec Next.js 16 et Supabase.

## Development Setup

### Prérequis

- **Node.js** v18+ (recommandé : v20+)
- **Docker Desktop** installé et en cours d'exécution (requis par Supabase CLI)

### Installation

```bash
# Installer les dépendances
npm install

# Initialiser Supabase CLI (si ce n'est pas déjà fait)
npx supabase init
```

### Démarrer l'environnement de développement

```bash
# 1. Démarrer Supabase local (Postgres, Auth, Studio)
npm run db:start

# 2. (Optionnel) Réinitialiser la base avec les migrations et données démo
npm run db:reset

# 3. (Optionnel) Créer les utilisateurs de test
npm run db:seed

# 4. Démarrer l'application Next.js
npm run dev
```

L'application est accessible sur http://localhost:3000

### Utilisateurs de test

Après `npm run db:seed`, vous pouvez vous connecter avec :

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| berger@ekklesia.test | Eglise2026! | Berger |
| leader@ekklesia.test | Eglise2026! | Leader |
| pastor@ekklesia.test | Eglise2026! | Pasteur |
| admin@ekklesia.test | Eglise2026! | Admin |
| newcomer@ekklesia.test | Eglise2026! | Nouveau membre |

### Variables d'environnement

Le fichier `.env.development` contient les variables pour le développement local. Il n'est pas versionné (gitignored).

Les variables importantes :
- `WHATSAPP_ENABLED=false` : Désactive les appels WhatsApp réels (mode stub)
- `MINIMAX_ENABLED=false` : Désactive les appels MiniMax AI réels (mode mock)

### Commandes utiles

```bash
npm run db:start      # Démarrer Supabase local
npm run db:stop       # Arrêter Supabase local
npm run db:reset      # Réinitialiser la base de données
npm run db:seed       # Créer les utilisateurs de test
npm run dev           # Démarrer Next.js
npm run dev:all       # Démarrer Supabase + Next.js
npm run build         # Build de production
npm run test:e2e      # Tests E2E
```

## Production Deployment

### Prérequis

- Compte **Vercel** configuré
- Projet **Supabase Cloud** (ref: lzfnmjojlymmnkhlpcda)
- **Docker Desktop** n'est pas nécessaire en production

### Configuration Vercel

1. Connecter le repository GitHub à Vercel
2. Configurer les variables d'environnement dans le dashboard Vercel :

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase Cloud |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique (anon) Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service_role Supabase |
| `MINIMAX_API_KEY` | Clé API MiniMax AI |
| `MINIMAX_GROUP_ID` | ID du groupe MiniMax |
| `MINIMAX_MODEL` | Modèle MiniMax (défaut: abab6.5s-chat) |
| `CRON_SECRET` | Secret pour sécuriser les cron jobs |
| `WHATSAPP_ENABLED` | `true` en production |
| `MINIMAX_ENABLED` | `true` en production |

### Cron Jobs

Les cron jobs sont configurés dans `vercel.json` :
- `/api/cron/daily-conversations` : Tous les jours à 7h00 UTC
- `/api/cron/weekly-report` : Chaque lundi à 8h00 UTC

### Déploiement

Le déploiement est automatique lors du push sur la branche `main`.

```bash
git push origin main
```

Vercel détecte le push, build et déploie automatiquement.

## Architecture

```
src/
├── app/                    # Pages et routes (Next.js App Router)
│   ├── api/               # Routes API
│   │   ├── cron/          # Cron jobs (daily-conversations, weekly-report)
│   │   └── whatsapp/      # Endpoints WhatsApp (qr, send, webhook)
│   └── ...                # Pages UI
├── lib/
│   ├── supabase/          # Clients Supabase (browser, server, admin)
│   ├── whatsapp/          # Client WhatsApp (réel ou stub)
│   └── ai/                # Client MiniMax AI (réel ou mock)
└── types/
    └── db.ts              # Types TypeScript pour la base de données

supabase/
├── migrations/            # Migrations SQL (19 fichiers)
└── config.toml           # Configuration Supabase CLI
```

## Feature Flags

| Flag | Valeur dev | Valeur prod | Description |
|------|-----------|-------------|-------------|
| `WHATSAPP_ENABLED` | `false` | `true` | Active/désactive WhatsApp |
| `MINIMAX_ENABLED` | `false` | `true` | Active/désactive MiniMax AI |

En mode stub/mock :
- WhatsApp retourne des réponses simulées (logs dans la console)
- MiniMax retourne des réponses déterministes (pas d'appel API)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

## 1. Configuration de base

- [x] 1.1 Installer @supabase/cli comme devDependency (`npm install -D @supabase/cli`)
- [x] 1.2 Initialiser Supabase CLI (`npx supabase init`) pour créer `supabase/config.toml`
- [x] 1.3 Créer `.env.development` avec les variables Supabase local (URL localhost:54321, clés demo, WHATSAPP_ENABLED=false, MINIMAX_ENABLED=false)
- [x] 1.4 Renommer `.env.local.example` en `.env.production.example` et mettre à jour les valeurs placeholder
- [x] 1.5 Mettre à jour `.gitignore` pour exclure `.env.development` et `.env.production` mais inclure `.env.production.example`
- [x] 1.6 Ajouter les scripts npm dans `package.json` : `db:start`, `db:stop`, `db:reset`, `db:seed`

## 2. Stub WhatsApp

- [x] 2.1 Modifier `src/lib/whatsapp/client.ts` pour vérifier `WHATSAPP_ENABLED` et retourner un objet mock quand false
- [x] 2.2 Implémenter l'objet mock WhatsApp avec méthodes `isReady()`, `on()`, `destroy()`, `send()`, `sendMessage()` qui loggent dans la console
- [x] 2.3 Modifier `src/app/api/whatsapp/qr/route.ts` pour retourner `{ connected: false, stub: true }` quand `WHATSAPP_ENABLED=false`
- [x] 2.4 Modifier `src/app/api/whatsapp/webhook/route.ts` pour retourner 200 OK sans erreur quand `WHATSAPP_ENABLED=false`
- [x] 2.5 S'assurer que `whatsapp-web.js` n'est pas importé quand `WHATSAPP_ENABLED=false` (import conditionnel)

## 3. Mock MiniMax AI

- [x] 3.1 Modifier `src/lib/ai/minimax-client.ts` pour vérifier `MINIMAX_ENABLED` au début de chaque fonction
- [x] 3.2 Implémenter le mock de `generateOpeningMessage()` qui retourne `[MOCK AI] Bonjour <memberName>, comment allez-vous aujourd'hui ?`
- [x] 3.3 Implémenter le mock de `generateReply()` qui retourne une réponse fixe avec détection d'alerte (mots-clés "urgence", "malade")
- [x] 3.4 Implémenter le mock de `generateConversationSummary()` qui retourne `{ score: 7, status: "stable", prayerTopics: ["Famille", "Santé"] }`
- [x] 3.5 Vérifier que les signatures TypeScript des mocks correspondent aux fonctions réelles

## 4. Configuration Vercel

- [x] 4.1 Créer `vercel.json` avec les cron jobs : `/api/cron/daily-conversations` (0 7 * * *) et `/api/cron/weekly-report` (0 8 * * 1)
- [x] 4.2 Vérifier que les endpoints cron valident `CRON_SECRET` dans le body
- [x] 4.3 Documenter les variables d'environnement requises dans Vercel dashboard

## 5. Documentation

- [x] 5.1 Mettre à jour `README.md` avec section "Development Setup" expliquant : prérequis (Docker Desktop), `npm run db:start`, `npm run db:seed`, `npm run dev`
- [x] 5.2 Ajouter section "Production Deployment" dans README expliquant : configuration Vercel, variables d'environnement requises, cron jobs
- [x] 5.3 Documenter les flags `WHATSAPP_ENABLED` et `MINIMAX_ENABLED` et leur comportement
- [x] 5.4 Ajouter instructions pour obtenir les clés Supabase (dashboard → Settings → API)

## 6. Validation et tests

- [x] 6.1 Tester `npm run db:start` et vérifier que Supabase local démarre sur les ports 54320/54321/9999
- [ ] 6.2 Tester `npm run db:reset` et vérifier que les migrations s'appliquent correctement
- [x] 6.3 Tester `npm run db:seed` et vérifier que les 5 utilisateurs de test sont créés
- [x] 6.4 Tester `npm run dev` avec `.env.development` et vérifier que l'app se connecte à Supabase local
- [x] 6.5 Tester le login avec `berger@ekklesia.test` / `Eglise2026!` en environnement local
- [x] 6.6 Vérifier que les stubs WhatsApp fonctionnent (QR endpoint retourne stub status, webhook retourne 200)
- [x] 6.7 Vérifier que les mocks MiniMax retournent les réponses déterministes attendues
- [x] 6.8 Tester le build de production (`npm run build`) pour s'assurer qu'il n'y a pas d'erreurs TypeScript

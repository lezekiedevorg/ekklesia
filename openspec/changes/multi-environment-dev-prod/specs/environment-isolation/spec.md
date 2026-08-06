## ADDED Requirements

### Requirement: Environment variables loaded based on NODE_ENV
The system SHALL load environment variables from `.env.development` when `NODE_ENV=development` and from `.env.production` when `NODE_ENV=production`. Next.js automatically handles this behavior.

#### Scenario: Development environment loads .env.development
- **WHEN** `NODE_ENV=development` (set by `next dev`)
- **THEN** variables from `.env.development` are available in `process.env`

#### Scenario: Production environment loads production vars
- **WHEN** `NODE_ENV=production` (set by Vercel)
- **THEN** variables from Vercel dashboard are available in `process.env`

### Requirement: .env.development contains local Supabase configuration
The `.env.development` file SHALL contain Supabase connection details pointing to the local instance running on default ports (54321 for API, 9999 for Auth, 54320 for Postgres).

#### Scenario: Local Supabase URL configured
- **WHEN** `.env.development` is loaded
- **THEN** `NEXT_PUBLIC_SUPABASE_URL` SHALL be set to `http://localhost:54321`

#### Scenario: Local Supabase keys configured
- **WHEN** `.env.development` is loaded
- **THEN** `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` SHALL contain the demo keys printed by `supabase start`

### Requirement: .env.production.example serves as template
The `.env.production.example` file SHALL be committed to the repository and contain placeholder values for all required production environment variables. It SHALL NOT contain real secrets.

#### Scenario: Template file is committed
- **WHEN** developer clones the repository
- **THEN** `.env.production.example` SHALL be present with placeholder values

#### Scenario: Template contains all required variables
- **WHEN** developer reads `.env.production.example`
- **THEN** file SHALL contain: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `MINIMAX_API_KEY`, `MINIMAX_GROUP_ID`, `MINIMAX_MODEL`, `WHATSAPP_ENABLED`

### Requirement: .env.development and .env.production are gitignored
The `.gitignore` file SHALL exclude `.env.development` and `.env.production` to prevent accidental commits of environment-specific secrets.

#### Scenario: .env.development not tracked by git
- **WHEN** developer creates `.env.development` with local secrets
- **THEN** `git status` SHALL NOT show `.env.development` as untracked or modified

#### Scenario: .env.production not tracked by git
- **WHEN** developer creates `.env.production` with production secrets
- **THEN** `git status` SHALL NOT show `.env.production` as untracked or modified

### Requirement: .env.production.example is tracked by git
The `.env.production.example` file SHALL be tracked by git to serve as a template for other developers and deployment documentation.

#### Scenario: Template file is tracked
- **WHEN** developer runs `git status`
- **THEN** `.env.production.example` SHALL appear in tracked files

### Requirement: Feature flags control external service behavior
Environment variables `WHATSAPP_ENABLED` and `MINIMAX_ENABLED` SHALL control whether external services are called or stubbed/mocked.

#### Scenario: WhatsApp disabled in development
- **WHEN** `WHATSAPP_ENABLED=false` in `.env.development`
- **THEN** WhatsApp client SHALL return mock responses without calling whatsapp-web.js

#### Scenario: MiniMax disabled in development
- **WHEN** `MINIMAX_ENABLED=false` in `.env.development`
- **THEN** MiniMax client SHALL return deterministic mock responses without calling the API

#### Scenario: Services enabled in production
- **WHEN** `WHATSAPP_ENABLED=true` and `MINIMAX_ENABLED=true` in production environment
- **THEN** services SHALL make real API calls to external providers

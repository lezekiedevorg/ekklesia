## ADDED Requirements

### Requirement: vercel.json configures cron jobs
The `vercel.json` file SHALL define cron schedules for the daily conversations and weekly report endpoints.

#### Scenario: Daily conversations cron configured
- **WHEN** `vercel.json` is read
- **THEN** cron entry SHALL exist for `/api/cron/daily-conversations` with schedule `0 7 * * *` (7:00 AM UTC daily)

#### Scenario: Weekly report cron configured
- **WHEN** `vercel.json` is read
- **THEN** cron entry SHALL exist for `/api/cron/weekly-report` with schedule `0 8 * * 1` (8:00 AM UTC every Monday)

### Requirement: Cron jobs are protected by CRON_SECRET
The cron job endpoints SHALL validate the `CRON_SECRET` from the request body against the environment variable before processing.

#### Scenario: Valid secret allows execution
- **WHEN** POST `/api/cron/daily-conversations` is called with body `{ "cronSecret": "<correct-secret>" }`
- **THEN** endpoint SHALL process the request and return 200 OK

#### Scenario: Invalid secret rejects request
- **WHEN** POST `/api/cron/daily-conversations` is called with body `{ "cronSecret": "<wrong-secret>" }`
- **THEN** endpoint SHALL return 401 Unauthorized without processing

#### Scenario: Missing secret rejects request
- **WHEN** POST `/api/cron/daily-conversations` is called without `cronSecret` in body
- **THEN** endpoint SHALL return 401 Unauthorized

### Requirement: Vercel environment variables documented
The README SHALL document all required environment variables for Vercel deployment, including their purpose and whether they are required or optional.

#### Scenario: Required variables documented
- **WHEN** developer reads README.md "Production Deployment" section
- **THEN** documentation SHALL list: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `MINIMAX_API_KEY`, `MINIMAX_GROUP_ID`, `MINIMAX_MODEL`, `WHATSAPP_ENABLED`

#### Scenario: Variable purposes explained
- **WHEN** developer reads environment variable documentation
- **THEN** each variable SHALL have a description of its purpose (e.g., "Supabase project URL for authentication and database")

#### Scenario: Where to find values documented
- **WHEN** developer reads environment variable documentation
- **THEN** documentation SHALL explain where to obtain each value (e.g., "Supabase Dashboard → Settings → API")

### Requirement: Vercel deployment is automated
The project SHALL be configured for automatic deployment to Vercel when changes are pushed to the main branch.

#### Scenario: Push to main triggers deployment
- **WHEN** code is pushed to `main` branch
- **THEN** Vercel SHALL automatically build and deploy the application

#### Scenario: Environment variables persist across deployments
- **WHEN** new deployment is triggered
- **THEN** environment variables configured in Vercel dashboard SHALL be available to the new deployment

### Requirement: Production uses real external services
In production, `WHATSAPP_ENABLED=true` and `MINIMAX_ENABLED=true` SHALL ensure real API calls are made to external services.

#### Scenario: WhatsApp enabled in production
- **WHEN** `WHATSAPP_ENABLED=true` in Vercel environment
- **THEN** WhatsApp client SHALL make real calls to whatsapp-web.js

#### Scenario: MiniMax enabled in production
- **WHEN** `MINIMAX_ENABLED=true` in Vercel environment
- **THEN** MiniMax client SHALL make real API calls to MiniMax service

### Requirement: Production Supabase configuration
Production SHALL use the cloud Supabase instance (ref: `lzfnmjojlymmnkhlpcda`) with credentials from Vercel environment variables.

#### Scenario: Cloud Supabase URL configured
- **WHEN** application runs in production (Vercel)
- **THEN** `NEXT_PUBLIC_SUPABASE_URL` SHALL point to `https://lzfnmjojlymmnkhlpcda.supabase.co`

#### Scenario: Production credentials used
- **WHEN** application runs in production
- **THEN** `SUPABASE_SERVICE_ROLE_KEY` SHALL be the production service role key from Supabase dashboard

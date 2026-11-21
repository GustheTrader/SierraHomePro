# Sierra Home Pros — Operations, CRM & Maintenance Platform

Operations, dispatch, CRM, and recurring home-maintenance subscription platform tailored for **Sierra Home Pros** (Sparks, NV — serving Reno–Sparks, Carson City, and Lake Tahoe).

## Key Features

- **Daily Operations & Huddle**: Live KPI board, top-3 priority Daily Huddle cards, Northern Nevada weather & exterior paint radar, and proactive budget/schedule risk notifications.
- **CRM & Maintenance Subscriptions**: Homeowner directory, sellable recurring seasonal maintenance plans, seasonal visit checklists, and server-side integration with self-hosted Supabase on Zo Computer.
- **Service Jobs & Field Dispatch**: Active handyman, smart-home, painting, maintenance, and senior-safety job tracking, homeowner requests, supply estimates, technician schedules, and job costing.
- **Client Preview Mode**: Toggleable client-sharing system in Settings to generate temporary expiring read-only project links that strictly mask all internal financial data.
- **Branded Estimates & PDF Reports**: Live homeowner estimate and completion report previews with branded PDF export.
- **Light & Dark Mode**: Sierra Deep Navy & Sierra Copper color system with persistent Light/Dark theme switching.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a local environment file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Fill in your keys:
   - `GEMINI_API_KEY` — Gemini API key for AI Desk & Voice Dispatch
   - `SUPABASE_URL` — Self-hosted Supabase URL (e.g., on Zo Computer)
   - `SUPABASE_SERVICE_ROLE_KEY` — Server-side Supabase service role key (never exposed to the browser)

3. Run the development server (Express API + Vite on port `3000`):
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Self-Hosted Supabase Setup (Zo Computer)

Database migrations, sample seed data, and deployment steps are located in the `supabase/` folder:
- `supabase/migrations/001_sierra_crm_maintenance.sql`
- `supabase/seed.sql`
- `supabase/ZO_SELF_HOSTED_SETUP.md`

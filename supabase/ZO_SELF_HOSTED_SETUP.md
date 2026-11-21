# Self-Hosted Supabase Setup on Zo Computer (Sierra Home Pros)

This app connects to your self-hosted Supabase instance running on a **Zo Computer** through server-side Express proxy routes (`/api/crm/*`, `/api/plans/*`, `/api/subscriptions/*`, `/api/visits/*`). Your Supabase service role key never touches the browser.

## 1. Run Self-Hosted Supabase on Zo Computer

On your Zo Computer (with Docker Engine & Docker Compose enabled):

```bash
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
# Edit .env to set strong POSTGRES_PASSWORD, JWT_SECRET, ANON_KEY, and SERVICE_ROLE_KEY
docker compose pull
docker compose up -d
```

Expose your Zo Computer's Kong API gateway URL (default port `8000`) over HTTPS via Zo's public service domain or tunnel, e.g.:
`https://supabase.<your-zo-handle>.zo.computer`

## 2. Apply the Sierra Home Pros CRM & Maintenance Plans Schema

In your self-hosted **Supabase Studio** (port `3000` / Studio route) -> **SQL Editor**:

1. Run `supabase/migrations/001_sierra_crm_maintenance.sql` to create:
   - `crm_contacts` (Homeowner CRM)
   - `maintenance_plans` (Sellable subscription tiers)
   - `plan_subscriptions` (Member enrollments & billing cycles)
   - `subscription_visits` (Seasonal preventive maintenance visits)
2. Optionally run `supabase/seed.sql` to load the 3 Sierra Home Pros maintenance tiers and starter Northern Nevada records.

## 3. Connect This App via Server Environment Variables

Add these two secrets in your deployment / AI Studio environment (never commit secrets to Git or prefix with `VITE_`):

```env
SUPABASE_URL=https://supabase.<your-zo-handle>.zo.computer
SUPABASE_SERVICE_ROLE_KEY=your-self-hosted-service-role-jwt
```

Once configured and restarted, all CRM contacts, subscription plans, member enrollments, and seasonal maintenance visits read and write directly to your self-hosted Supabase PostgreSQL database on Zo Computer.

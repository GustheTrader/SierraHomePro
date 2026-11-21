-- Sierra Home Pros LLC — CRM & Maintenance Subscription Plans
-- Target: Self-Hosted Supabase (PostgreSQL 15+) on Zo Computer
-- Run in Supabase Studio SQL Editor or via: psql "$DATABASE_URL" -f 001_sierra_crm_maintenance.sql

create extension if not exists "pgcrypto";

-- 1. Homeowner CRM Contacts
create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 140),
  email text not null unique check (position('@' in email) > 1),
  phone text not null default '',
  street_address text not null default '',
  service_area text not null check (service_area in ('Sparks, NV', 'Reno, NV', 'Carson City, NV', 'Lake Tahoe, NV')),
  property_type text not null default 'Single-Family Home'
    check (property_type in ('Single-Family Home', 'Townhome / Condo', 'Mountain Cabin', 'Senior Residence', 'Rental Property')),
  lead_stage text not null default 'New Inquiry'
    check (lead_stage in ('New Inquiry', 'Estimate Sent', 'Active Client', 'Plan Member', 'Inactive')),
  source text not null default 'Website (sierrahomepros.com)',
  lifetime_value numeric(10, 2) not null default 0 check (lifetime_value >= 0),
  notes text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Sellable Home Maintenance Subscription Plans
create table if not exists public.maintenance_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text not null,
  monthly_price numeric(10, 2) not null check (monthly_price > 0),
  annual_price numeric(10, 2) not null check (annual_price > 0),
  visits_per_year integer not null check (visits_per_year between 1 and 12),
  handyman_discount_pct integer not null default 10 check (handyman_discount_pct between 0 and 50),
  priority_window text not null default '48-Hour Priority Dispatch',
  features jsonb not null default '[]'::jsonb,
  is_popular boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Active & Historical Homeowner Plan Subscriptions
create table if not exists public.plan_subscriptions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.crm_contacts(id) on delete cascade,
  plan_id uuid not null references public.maintenance_plans(id) on delete restrict,
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'annual')),
  status text not null default 'active' check (status in ('active', 'paused', 'past_due', 'cancelled')),
  price_usd numeric(10, 2) not null check (price_usd >= 0),
  start_date date not null default current_date,
  next_billing_date date not null,
  next_visit_date date,
  assigned_tech text not null default 'Caleb Martinez',
  auto_renew boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Seasonal Preventive Maintenance Visits
create table if not exists public.subscription_visits (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.plan_subscriptions(id) on delete cascade,
  contact_id uuid not null references public.crm_contacts(id) on delete cascade,
  season text not null check (season in ('Spring', 'Summer', 'Fall', 'Winter')),
  visit_date date not null,
  technician text not null default 'Caleb Martinez',
  status text not null default 'scheduled' check (status in ('scheduled', 'in-progress', 'completed', 'rescheduled')),
  checklist jsonb not null default '[]'::jsonb,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Performance Indexes
create index if not exists idx_crm_contacts_stage on public.crm_contacts(lead_stage);
create index if not exists idx_crm_contacts_area on public.crm_contacts(service_area);
create index if not exists idx_plan_subscriptions_contact on public.plan_subscriptions(contact_id);
create index if not exists idx_plan_subscriptions_status on public.plan_subscriptions(status);
create index if not exists idx_subscription_visits_sub on public.subscription_visits(subscription_id);
create index if not exists idx_subscription_visits_date on public.subscription_visits(visit_date);

-- Updated-at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_crm_contacts_updated on public.crm_contacts;
create trigger trg_crm_contacts_updated before update on public.crm_contacts
  for each row execute function public.set_updated_at();

drop trigger if exists trg_maintenance_plans_updated on public.maintenance_plans;
create trigger trg_maintenance_plans_updated before update on public.maintenance_plans
  for each row execute function public.set_updated_at();

drop trigger if exists trg_plan_subscriptions_updated on public.plan_subscriptions;
create trigger trg_plan_subscriptions_updated before update on public.plan_subscriptions
  for each row execute function public.set_updated_at();

drop trigger if exists trg_subscription_visits_updated on public.subscription_visits;
create trigger trg_subscription_visits_updated before update on public.subscription_visits
  for each row execute function public.set_updated_at();

-- Row Level Security (Service role bypasses RLS; anon access is denied by default)
alter table public.crm_contacts enable row level security;
alter table public.maintenance_plans enable row level security;
alter table public.plan_subscriptions enable row level security;
alter table public.subscription_visits enable row level security;

-- Allow authenticated Sierra Home Pros staff read/write inside Supabase Studio / authenticated JWT clients
create policy "staff_all_crm_contacts" on public.crm_contacts
  for all to authenticated using (true) with check (true);

create policy "staff_all_maintenance_plans" on public.maintenance_plans
  for all to authenticated using (true) with check (true);

create policy "staff_all_plan_subscriptions" on public.plan_subscriptions
  for all to authenticated using (true) with check (true);

create policy "staff_all_subscription_visits" on public.subscription_visits
  for all to authenticated using (true) with check (true);

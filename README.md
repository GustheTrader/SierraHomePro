# Sierra Home Pros — Operations, CRM & Maintenance Platform

An operations, dispatch, homeowner CRM, and recurring maintenance subscription platform built for **Sierra Home Pros LLC** (Sparks, NV — serving **Reno–Sparks**, **Carson City**, and **Lake Tahoe**).

Designed around residential home services—handyman repairs, smart-home installations, interior/exterior painting, senior home-safety upgrades, and seasonal maintenance plans—with full **Light Mode** and **Dark Mode** styling aligned to the Sierra Home Pros Deep Navy (`#132C47`) and Sierra Copper (`#B96626`) brand palette.

---

## Table of Contents

- [Core Features](#core-features)
  - [1. Daily Operations Dashboard](#1-daily-operations-dashboard)
  - [2. Daily Huddle Summary](#2-daily-huddle-summary)
  - [3. Proactive Risk & Budget Notification Center](#3-proactive-risk--budget-notification-center)
  - [4. CRM & Maintenance Subscriptions (Self-Hosted Supabase)](#4-crm--maintenance-subscriptions-self-hosted-supabase)
  - [5. Service Jobs & Project Management](#5-service-jobs--project-management)
  - [6. Homeowner Requests (RFI & Scope Questions)](#6-homeowner-requests-rfi--scope-questions)
  - [7. Estimates & Local Supply Buyout](#7-estimates--local-supply-buyout)
  - [8. Field Dispatch & Quality Execution](#8-field-dispatch--quality-execution)
  - [9. Job Costing (Budget vs. Actuals)](#9-job-costing-budget-vs-actuals)
  - [10. Technician Schedules & Manpower](#10-technician-schedules--manpower)
  - [11. Branded Homeowner PDF Reports & Estimates](#11-branded-homeowner-pdf-reports--estimates)
  - [12. Sierra AI Desk & Voice Dispatch](#12-sierra-ai-desk--voice-dispatch)
  - [13. Client Preview Mode (Temporary Financial-Masked Links)](#13-client-preview-mode-temporary-financial-masked-links)
  - [14. Integrations, Automations & Theme System](#14-integrations-automations--theme-system)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Database Schema & Self-Hosted Supabase Setup (Zo Computer)](#database-schema--self-hosted-supabase-setup-zo-computer)
- [Getting Started](#getting-started)
- [Security & Data Privacy Safeguards](#security--data-privacy-safeguards)

---

## Core Features

### 1. Daily Operations Dashboard
- **Customizable KPI Board**: Switch between role presets (*Dispatch & Field Lead*, *Owner & Written Estimates*, *Homeowner Care & Safety*) or toggle individual KPIs from a 10-metric library (Active Home Jobs, Written Estimates Pipeline, First-Visit Fix Rate, Weather/Risk Holds, Gross Job Margin, Estimate Turnaround, Senior Safety Pass Rate, Maintenance Plan Members, Homeowner CSAT, Van Stock Readiness).
- **Interactive Analytics**: Written estimate vs. actual spend charts, service category distribution, and project completion tracking using Recharts with theme-adaptive tooltips and legends.
- **Northern Nevada Weather & Exterior Paint Radar**: Live weather monitoring for Reno, Sparks, Carson City, and Lake Tahoe with scenario simulations (*Live*, *Tahoe Freeze*, *Zephyr Wind*, *High Heat*) providing technician dispatch guidance and exterior paint/stain curing advisories.

### 2. Daily Huddle Summary
- Surfaces the **top 3 highest-priority projects** for morning crew standups in a scannable card layout.
- Automatically ranks jobs by active risk level, budget utilization ratio, and completion progress, with filtering and direct action recommendations.

### 3. Proactive Risk & Budget Notification Center
- Persistent header notification dashboard that monitors active jobs for potential budget overruns, margin compression, and schedule/weather delays before they escalate.
- Includes unread alert badges, severity grouping (*Critical*, *Warning*, *Info*), AI-backed mitigation recommendations, and one-click actions to mitigate, snooze, or dismiss alerts.

### 4. CRM & Maintenance Subscriptions (Self-Hosted Supabase)
- **Homeowner CRM Directory**: Create, edit, filter, search, and delete homeowner contacts across Reno, Sparks, Carson City, and Lake Tahoe, tracking property types (*Single-Family Home*, *Townhome / Condo*, *Mountain Cabin*, *Senior Residence*, *Rental Property*), lead stages, tags, and lifetime value.
- **Sellable Maintenance Plans**: Manage recurring home maintenance subscription tiers with editable monthly/annual pricing, annual visit counts, handyman discount percentages, priority dispatch windows, and included service features.
- **Subscription Enrollment & Lifecycle**: Enroll homeowners in monthly or annual plans, track MRR/ARR, pause/resume/cancel plans, toggle auto-renew, and assign primary technicians.
- **Seasonal Preventive Maintenance Visits**: Track Spring, Summer, Fall, and Winter home visits with interactive inspection checklists, visit status updates, and field notes.
- **Built-In Zo Computer Setup Kit**: Inspect and copy the production SQL migration, seed script, and Zo Computer self-hosted Supabase setup guide directly inside the app.

### 5. Service Jobs & Project Management
- Full lifecycle management for residential jobs across five service categories: **Handyman Repair**, **Smart Home**, **Interior/Exterior Painting**, **Maintenance Plan**, and **Senior Safety**.
- Filter by status, category, or archive state; create new jobs, inspect milestones, update progress percentages, and adjust risk levels.

### 6. Homeowner Requests (RFI & Scope Questions)
- Tracks homeowner scope clarifications, material preferences, and on-site add-on questions before work proceeds.
- Supports logging new requests, recording resolutions, tracking status, and drafting AI-assisted homeowner responses.

### 7. Estimates & Local Supply Buyout
- Coordinates specialty hardware, paint, smart-home kits, and ADA senior safety supplies across local Reno–Sparks suppliers (*Sherwin-Williams Commercial*, *Home Depot Pro Desk*, *Sierra Lock & Smart Home Supply*, *Reno ADA & Senior Mobility Direct*).
- Compares supplier quotes against budgeted allowances, scores scope coverage, and moves supply packages through assessment, bidding, and execution.

### 8. Field Dispatch & Quality Execution
- Daily field execution tracking for technician checklists, jobsite cleanliness QA, ADA stud-anchor pull-load checks, and visit sign-offs across active service vans.

### 9. Job Costing (Budget vs. Actuals)
- Visual and tabular comparison of **Written Estimate Price** vs. **Actual Materials & Technician Labor Cost** per job.
- Calculates variance, gross margin dollars/percentages, and highlights jobs approaching estimate limits.

### 10. Technician Schedules & Manpower
- Weekly crew and service-van capacity planner across Reno, Sparks, Carson City, and Lake Tahoe.
- Assigns multi-skilled handyman technicians to jobs, spots scheduling overlaps, and balances workload to protect first-visit fix rates.

### 11. Branded Homeowner PDF Reports & Estimates
- Live paper-sheet preview featuring the official **Sierra Home Pros** logo, customer details, job scope, progress summary, and company contact block.
- Generates downloadable **PDF reports** via `jsPDF` styled with Sierra Deep Navy (`#132C47`) headers and Sierra Copper (`#B96626`) dividers.

### 12. Sierra AI Desk & Voice Dispatch
- **Sierra AI Desk**: Multi-agent chat workspace featuring specialized operational personas (*Sierra Scheduler*, *Sierra Estimator*, *Sierra Memory*, *Sierra Safety Check*, *Sierra Route Pro*, *Sierra Supply*, *Sierra Ops Lead*) plus one-click residential quick prompts.
- **Voice Dispatch**: Floating hands-free voice assistant widget powered by the Gemini Live audio API for van updates, job notes, and dispatch queries.

### 13. Client Preview Mode (Temporary Financial-Masked Links)
- **Master Mode Toggle in Settings**: Enable or pause external homeowner preview sharing globally at any time.
- **Temporary Link Generator**: Pick any active project, set an expiration window (**24 Hours**, **72 Hours**, or **7 Days**), and attach an optional homeowner welcome note to generate a unique `?clientPreview=<token>` URL.
- **Standalone Homeowner Portal**: Opens a clean, read-only client view displaying project progress, target dates, lead technician, and milestone checklist—without admin navigation or internal tools.
- **Strict Financial Masking**: Internal costs (`spent`), written estimate totals (`budget`), gross margins, cost breakdowns, and internal risk indicators are excluded on the server before any preview payload is returned.
- **Link Lifecycle Controls**: Copy links with one click, open an in-app preview with an **Exit Client Preview** return path, monitor view counts, or revoke links immediately.

### 14. Integrations, Automations & Theme System
- **Connected Tools**: Manage sync status and manual refresh for *Jobber Dispatch & Estimates*, *QuickBooks Online*, *Home Depot Pro Xtra (Sparks)*, and *Google Calendar Dispatch*.
- **Incoming Estimate Request Queue**: Test Jobber webhooks and import pending `sierrahomepros.com` homeowner leads directly into active Service Jobs.
- **Operations Automations**: Toggle upfront written-estimate gates, Lake Tahoe paint-cure freeze alerts, 30-minute on-my-way homeowner SMS notifications, and senior safety stud-anchor photo checks.
- **Light & Dark Mode**: Persistent header theme switch (`Light` / `Dark`) saved in `localStorage`, adapting surfaces, typography, borders, charts, and modals across both the admin workspace and Client Preview portal.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS, Lucide React, Recharts, jsPDF
- **Backend**: Node.js, Express 5 (`tsx server.ts` in dev with Vite middleware; static `dist/` in production)
- **Database**: Self-hosted Supabase (PostgreSQL 15+) via `@supabase/supabase-js` on the server with automatic local preview fallback when credentials are not yet configured
- **AI & Voice**: `@google/genai` SDK (Gemini text & real-time audio Live API)

---

## Project Structure

```text
├── App.tsx                         # Main app shell, theme state, and ?clientPreview routing
├── server.ts                       # Express API server + Vite middleware / static serving
├── constants.tsx                   # Sierra Home Pros company data, agents, KPIs, initial jobs
├── types.ts                        # Shared TypeScript interfaces (projects, CRM, plans, previews)
├── geminiService.ts                # Gemini AI desk & response helpers
├── index.html                      # Theme variables (Light/Dark Sierra Navy & Copper) & entry HTML
├── components/
│   ├── Dashboard.tsx               # Operations dashboard, KPI board & Recharts analytics
│   ├── DailyHuddleSummary.tsx      # Top-3 priority Daily Huddle cards
│   ├── NotificationDashboard.tsx   # Header proactive budget & schedule risk center
│   ├── WeatherRadar.tsx            # Northern Nevada weather & exterior paint radar
│   ├── CRMSubscriptions.tsx        # CRM contacts, sellable plans, subscriptions & visits
│   ├── ProjectManagement.tsx       # Service jobs lifecycle management
│   ├── RFITracker.tsx              # Homeowner requests & scope clarifications
│   ├── BuyoutModule.tsx            # Estimates & local Reno–Sparks supply buyout
│   ├── ExecutionModule.tsx         # Field dispatch & quality checklists
│   ├── BudgetVsActuals.tsx         # Job costing & gross margin analysis
│   ├── RenoManpowerSchedule.tsx    # Technician & van schedules
│   ├── PDFReportGenerator.tsx      # Branded homeowner preview & jsPDF exporter
│   ├── AgentConsole.tsx            # Sierra AI Desk multi-agent chat
│   ├── VoiceAssistant.tsx          # Hands-free Voice Dispatch widget
│   ├── Settings.tsx                # Client Preview mode, integrations, leads & automations
│   ├── ClientPreviewPortal.tsx     # Read-only homeowner portal (financials masked)
│   └── Sidebar.tsx                 # Branded navigation rail
├── server/
│   ├── supabaseStore.ts            # Server-side Supabase adapter + preview fallback store
│   └── clientPreviewStore.ts       # Cryptographic token store, expiry & financial sanitizer
├── supabase/
│   ├── migrations/
│   │   └── 001_sierra_crm_maintenance.sql
│   ├── seed.sql
│   └── ZO_SELF_HOSTED_SETUP.md
└── public/assets/aistudio/         # Official Sierra Home Pros logo asset
```

---

## API Reference

### CRM & Maintenance Subscriptions
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/crm/overview` | Returns contacts, maintenance plans, subscriptions, seasonal visits, and database mode (`supabase` or `preview`). |
| `POST` | `/api/crm/contacts` | Creates a new homeowner CRM contact. |
| `PATCH` | `/api/crm/contacts/:id` | Updates contact details, lead stage, tags, or notes. |
| `DELETE` | `/api/crm/contacts/:id` | Removes a homeowner contact. |
| `PATCH` | `/api/plans/:id` | Updates sellable maintenance plan pricing, visit counts, discounts, or features. |
| `POST` | `/api/subscriptions` | Enrolls a homeowner in a monthly or annual maintenance plan and schedules the initial seasonal visit. |
| `PATCH` | `/api/subscriptions/:id` | Updates subscription status, billing cycle, assigned technician, or auto-renew state. |
| `PATCH` | `/api/visits/:id` | Updates seasonal visit status, checklist items, technician, date, or field notes. |
| `GET` | `/api/supabase/schema` | Returns the SQL migration, seed script, and Zo Computer setup guide bundle. |

### Client Preview Mode
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/client-preview/links` | Lists active temporary preview links and global toggle state. |
| `PATCH` | `/api/client-preview/config` | Enables or pauses Client Preview sharing globally (`{ enabled: boolean }`). |
| `POST` | `/api/client-preview/links` | Generates a cryptographically random temporary preview link (24h, 72h, or 7d) with all financial fields stripped. |
| `DELETE` | `/api/client-preview/links/:token` | Immediately revokes a temporary client preview link. |
| `GET` | `/api/client-preview/view/:token` | Public read-only endpoint returning only sanitized client-safe project progress (`403` when paused, `410` when expired, `404` when revoked/invalid). |

---

## Database Schema & Self-Hosted Supabase Setup (Zo Computer)

The `supabase/migrations/001_sierra_crm_maintenance.sql` schema provisions four PostgreSQL tables with indexes, `updated_at` triggers, and Row Level Security (RLS):

1. `public.crm_contacts` — Homeowner records, service areas, property types, lead stages, tags, and lifetime value.
2. `public.maintenance_plans` — Sellable recurring plan tiers, monthly/annual prices, annual visits, discounts, and JSONB feature lists.
3. `public.plan_subscriptions` — Active and historical homeowner memberships linked to contacts and plans.
4. `public.subscription_visits` — Seasonal preventive maintenance visits with JSONB inspection checklists and notes.

### Applying to Self-Hosted Supabase on Zo Computer
1. Run the SQL migration in Supabase Studio (or via `psql`):
   ```bash
   psql "$DATABASE_URL" -f supabase/migrations/001_sierra_crm_maintenance.sql
   ```
2. *(Optional)* Load Northern Nevada sample data:
   ```bash
   psql "$DATABASE_URL" -f supabase/seed.sql
   ```
3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your server environment (never prefix with `VITE_`). See `supabase/ZO_SELF_HOSTED_SETUP.md` for full Zo Computer deployment steps.

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm

### Local Development
1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   SUPABASE_URL=https://your-zo-supabase-host
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
   > If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are left blank, the CRM & Subscriptions module runs cleanly in local preview mode until your self-hosted Supabase instance is connected.

3. **Start the development server** (Express API + Vite on port `3000`)
   ```bash
   npm run dev
   ```

4. **Type-check and build for production**
   ```bash
   npm run lint
   npm run build
   ```

---

## Security & Data Privacy Safeguards

- **Server-Side Secrets**: `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` stay strictly on the server and are never bundled into browser code; `.env` files are excluded in `.gitignore`.
- **Financial Masking Allowlist**: Client Preview endpoints enforce an explicit server-side allowlist so `budget`, `spent`, margins, and internal risk fields are never stored in or served from client preview payloads.
- **Expiring, Revocable Tokens**: Client Preview links use 192-bit `crypto.randomBytes(24)` base64url tokens, enforce expiration server-side, send `Cache-Control: no-store`, and support instant revocation or global pause.
- **Validated Inputs**: Express API routes validate enums, numeric ranges, and string lengths before writing to memory or Supabase, and PostgreSQL tables enforce `CHECK` constraints and Row Level Security.

# Cursor Build Prompt — WinkWebHealth (v1 MVP)

Paste everything below into Cursor's Composer/Agent chat, inside your existing WinkWebHealth project. Feed it section by section if the agent starts losing context — Phase 0 → 1 → 2 → 3 → 4 works well as separate messages.

---

## PHASE 0 — Study the existing project first (do this before writing anything)

This is **not a fresh scaffold** — I already have a project set up with its own structure, conventions, and stack. Before proposing or writing any code:

1. Explore the full repo structure (`ls`/tree the project, read `package.json`(s), config files, and any README/docs present) and summarize back to me: the current folder layout, package manager (npm/pnpm/yarn), existing frameworks/libraries in use, how the project is currently structured (monorepo vs single app), and how MongoDB is currently connected (Mongoose? native driver? existing connection helper?).
2. Identify existing conventions: naming patterns, file organization (e.g. feature-based vs type-based folders), existing auth setup if any, existing UI component patterns, linting/formatting rules.
3. Check for any existing models/schemas, API routes, or utilities that overlap with what's being requested below — reuse and extend them instead of creating duplicates.
4. Only after this review, propose how the plan below maps onto the existing structure, and flag anything below that conflicts with what's already there (e.g. if I already have a queue system, an email provider, or an auth solution in place, use those instead of the suggestions below).

Do not run Phase 1 onward until you've done this and confirmed the mapping with me.

---

## PROJECT BRIEF

I'm building a SaaS uptime monitoring tool (like UptimeRobot) called **WinkWebHealth**. This is a v1 MVP built by a solo developer — prioritize working, simple, maintainable code over premature abstraction, and fit it into the existing project rather than reinventing its structure. Use TypeScript everywhere.

### Tech stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Mantine (for forms/tables — already in use)
- **Backend**: Next.js API routes for CRUD + a **separate long-running Node.js worker service** for the actual monitoring checks (do not run checks inside serverless API routes — they need to run continuously)
- **Database**: MongoDB (use Mongoose as the ODM unless the existing project already uses the native driver or something else — match whatever's already there)
- **Queue/Scheduler**: BullMQ + Redis (for scheduling checks and processing alerts)
- **Auth**: NextAuth.js (email/password + optional Google OAuth) — unless an auth solution already exists in the project, in which case extend that instead
- **Billing**: Stripe (subscriptions + one-time SMS credit purchases)
- **Email**: Resend (for alerts + transactional emails)
- **Hosting target**: Frontend on Vercel, worker + MongoDB (Atlas or self-hosted) + Redis on a VPS (Hetzner/DigitalOcean) or Railway — build with env-based config so it's portable

### Core product scope for v1 (do NOT build beyond this list yet)
1. HTTP(S) monitoring — check a URL every N minutes, flag down if non-2xx/3xx or timeout
2. Keyword monitoring — same as above, plus check if a keyword exists/doesn't exist in response body
3. Port monitoring — TCP connect check to host:port
4. Incident tracking — auto-create an incident when a monitor goes down, auto-resolve when it recovers, log duration
5. Alerting — email (via Resend) + Discord/Slack webhook + generic webhook. NO SMS/voice in v1.
6. Public status page — one per account, shows selected monitors' current + historical status, custom subdomain (e.g. `status.yourapp.com/[slug]`)
7. Maintenance windows — mute alerts for a monitor during a scheduled window
8. Billing — Free tier + one paid "Pro" tier via Stripe Checkout + Customer Portal

Explicitly OUT of scope for v1: multi-region checks, DNS/SSL/domain expiry monitoring, cron heartbeat monitoring, mobile app, team roles/seats, SMS/voice alerts. I'll add these later.

---

## PHASE 1 — Extend the existing project with the monitoring data layer

Do NOT scaffold a new monorepo — add this into the existing WinkWebHealth structure identified in Phase 0. If the existing project is a single Next.js app, add a `worker/` service alongside it (or wherever background jobs already live, if that pattern exists); if it's already a monorepo, add the worker as a new package/app following its existing conventions.

### MongoDB models (Mongoose schemas, or match existing ODM/driver pattern)

Design collections/models for:
- `User` — extend the existing user model if one already exists (add `stripeCustomerId`, `plan` enum [FREE, PRO] if not already present) rather than creating a duplicate
- `Monitor` (userId ref, name, type enum [HTTP, KEYWORD, PORT], url/host, port nullable, keyword nullable, keywordType enum [EXISTS, NOT_EXISTS] nullable, intervalSeconds, timeoutSeconds, isActive boolean, currentStatus enum [UP, DOWN, PAUSED, PENDING], lastCheckedAt, createdAt)
- `Check` (monitorId ref, status enum [UP, DOWN], responseTimeMs, statusCode nullable, errorMessage nullable, checkedAt) — this collection will grow fast; add a compound index on `{ monitorId: 1, checkedAt: -1 }`, and consider a TTL index or scheduled pruning job to cap history (e.g. keep 90 days) so it doesn't grow unbounded
- `Incident` (monitorId ref, startedAt, resolvedAt nullable, durationSeconds nullable, cause text)
- `AlertChannel` (userId ref, type enum [EMAIL, DISCORD, SLACK, WEBHOOK], config object, isActive)
- `MonitorAlertChannel` — either an embedded array of alertChannelIds on `Monitor`, or a join collection; pick whichever fits the existing project's data modeling style better
- `MaintenanceWindow` (monitorId ref, startsAt, endsAt, note)
- `StatusPage` (userId ref, slug unique indexed, title, isPublic, customDomain nullable)
- `StatusPageMonitor` — embedded array of `{ monitorId, displayOrder }` on `StatusPage` is likely simplest here

Use MongoDB ObjectIds as primary keys (default). Add indexes as noted above, plus one on `Monitor.userId` and `StatusPage.slug`.

---

## PHASE 2 — Worker service (the actual monitoring engine)

Build the worker as a standalone Node process (location per whatever Phase 0 determined fits the existing project) with two parts:

1. **Scheduler**: On startup, load all active monitors from the DB. For each, register a repeating BullMQ job matching its `intervalSeconds`. Poll the DB every 60s for newly created/updated/deleted monitors and sync the queue accordingly (add/remove/reschedule jobs) — don't require a worker restart when a user adds a monitor.

2. **Check processor**: A BullMQ worker that consumes jobs and:
   - For HTTP/KEYWORD type: makes a GET request with the configured timeout, checks status code is 2xx/3xx, if keyword type also scans body for the keyword per `keywordType`
   - For PORT type: attempts a raw TCP connection to host:port with timeout
   - Records a `Check` row with result + response time
   - Compares against monitor's `currentStatus`:
     - If newly DOWN (was UP, now failing): update monitor status, create an `Incident` row, enqueue an alert job
     - If newly UP (was DOWN, now succeeding): update monitor status, resolve the open `Incident` (set resolvedAt + durationSeconds), enqueue a "recovered" alert job
     - Skip alerting if an active `MaintenanceWindow` covers `now()` for this monitor
   - Use a small retry-before-declaring-down logic: on failure, retry once after 10s before flipping status, to avoid flapping on transient blips

3. **Alert processor**: Separate BullMQ queue/worker that takes alert jobs and fans out to every `AlertChannel` linked to that monitor via `MonitorAlertChannel`:
   - EMAIL → send via Resend with a clean HTML template (monitor name, status, timestamp, response time/error)
   - DISCORD/SLACK → POST formatted payload to the stored webhook URL
   - WEBHOOK → POST a JSON payload of the event to the user's configured URL

Write this defensively — wrap each check in try/catch, log failures, never let one bad monitor crash the worker process. Add basic structured logging (pino or console.log with JSON).

---

## PHASE 3 — Web app: dashboard + monitors CRUD

Build into the existing Next.js app:

1. **Auth** — use the existing auth setup if one already exists in the project; otherwise NextAuth with email/password (bcrypt hash, stored via the existing MongoDB connection) + Google OAuth provider. Protect all `/dashboard/*` routes.

2. **Monitor CRUD**:
   - `/dashboard/monitors` — table view (Mantine Table) of all monitors with status badge (green/red/gray), response time sparkline, last checked time
   - `/dashboard/monitors/new` — form to create a monitor (type-conditional fields: URL for HTTP/KEYWORD, host+port for PORT, keyword+type for KEYWORD)
   - `/dashboard/monitors/[id]` — detail page: uptime % (24h/7d/30d), response time chart (use Recharts, pull from `Check` table aggregated by hour), incident history list, edit/pause/delete actions
   - Enforce plan limits: FREE = max 5 monitors @ 5 min interval, PRO = max 100 monitors @ 1 min interval. Check this server-side on create/update, not just in the UI.

3. **Alert channels**:
   - `/dashboard/alerts` — add/remove email, Discord webhook, Slack webhook, generic webhook channels
   - On monitor create/edit, let the user select which channels apply to that monitor

4. **Maintenance windows** — simple form on monitor detail page to schedule a future start/end datetime with a note

5. **Status pages**:
   - `/dashboard/status-pages` — create a status page, pick a slug, select which monitors to show, toggle public/private
   - `/status/[slug]` — public-facing page (no auth), server-rendered, shows each monitor's current status + a 90-day uptime bar (like GitHub's contribution graph style, green/red blocks) + any open incidents at the top

6. **Billing**:
   - `/dashboard/billing` — show current plan, "Upgrade to Pro" button → Stripe Checkout session
   - Stripe webhook handler (`/api/webhooks/stripe`) to handle `checkout.session.completed`, `customer.subscription.updated/deleted` and update `User.plan`
   - Link to Stripe Customer Portal for managing/cancelling subscription

Use Mantine components throughout for consistency with forms/tables. Keep the UI clean and functional — this is v1, not a design showcase.

---

## PHASE 4 — Polish + deploy readiness

1. Add/update `.env.example` listing all required env vars (MONGODB_URI, REDIS_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID/SECRET, RESEND_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRO_PRICE_ID) — merge with existing env vars rather than overwriting
2. Add/update `docker-compose.yml` for local dev — add a Redis container; only add a MongoDB container if the project isn't already pointing at Atlas or an existing local instance
3. Update the root `README.md` explaining: how to run the monitoring worker locally, how it fits into the existing project structure, how to deploy the worker (Dockerfile) separately from the web app
4. Add basic error boundaries and loading states to the new dashboard pages
5. Add a simple landing page (or update the existing one) with a pricing table and signup CTA for WinkWebHealth — doesn't need to be fancy, just functional

---

## Instructions to Cursor

Start with Phase 0 and don't skip it — confirm your understanding of the existing project with me before writing code. Then work phase by phase; after each phase, run the app/relevant tests and confirm it builds before moving to the next. Ask me before making architectural decisions not covered above (e.g. specific chart library choices, or how to model the join collections). Keep functions small and typed — no `any`. Favor server components in Next.js where possible; only use client components for interactive forms/charts. Match the existing project's naming and folder conventions over the suggestions here wherever they conflict.

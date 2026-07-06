# WinkWebHealth

SaaS uptime monitoring tool — monitor HTTP, keyword, and port checks with alerts and public status pages.

## Project structure

```
Monitoring tools/
├── api-mongoose/     # Express + Mongoose REST API
├── web/              # Vite + React + Mantine dashboard
├── worker/           # BullMQ monitoring worker (checks + alerts)
├── docker-compose.yml
└── .env.example
```

## Quick start

### 1. MongoDB
Point `DB_URL` in `api-mongoose/.env` at your MongoDB instance (Atlas or local).

### 2. Redis
```bash
docker compose up -d redis
```

### 3. API
```bash
cd api-mongoose
npm install
npm run dev
```
Runs on http://localhost:3000

### 4. Worker
```bash
cd worker
npm install
npm run dev
```
The worker schedules checks for all active monitors and processes alerts.

### 5. Web
```bash
cd web
npm install
npm run dev
```
Runs on http://localhost:8080

## Features (v1 MVP)

- **Monitors**: HTTP, keyword, and port checks
- **Incidents**: Auto-created on downtime, auto-resolved on recovery
- **Alerts**: Email, Discord, Slack, generic webhook
- **Status pages**: Public pages at `/status/:slug`
- **Maintenance windows**: Mute alerts during scheduled periods
- **Billing**: Free (5 monitors / 5 min) and Pro (100 monitors / 1 min) via Stripe

## API routes

| Route | Description |
|-------|-------------|
| `POST /auth/signup` | Register |
| `POST /auth/login` | Login |
| `GET /monitors` | List monitors |
| `POST /monitors` | Create monitor |
| `GET /monitors/:id/stats` | Uptime stats + incidents |
| `GET /alert-channels` | List alert channels |
| `GET /status-pages/public/:slug` | Public status page data |
| `POST /billing/checkout` | Stripe checkout |
| `POST /billing/webhook` | Stripe webhook (raw body) |

## Deploying the worker

Build and run as a standalone process:

```bash
cd worker
npm run build
npm start
```

Use a Dockerfile or process manager (PM2, systemd) on your VPS alongside Redis and MongoDB.

## Auth

Uses existing JWT auth from the template. Token is stored in `localStorage` as `cfg` and sent as `Authorization: Bearer <token>`.

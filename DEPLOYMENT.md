# WinkWebHealth — Production deployment (Docker + cPanel/WHM)

Hybrid setup: **Docker runs the app stack**; **cPanel/WHM** handles DNS, SSL, and SMTP.

## Architecture

```
Internet
   │
   ▼
Apache (cPanel, SSL on 443)
   ├── yourdomain.com      ──proxy──► 127.0.0.1:8080  (web container / nginx)
   └── api.yourdomain.com  ──proxy──► 127.0.0.1:4545  (api uses host network)

Docker network (internal)
   ├── redis  (also published 127.0.0.1:6379 for host-network api)
   ├── api    (host network — listens 127.0.0.1:4545 on VPS)
   ├── worker
   └── web

MongoDB Atlas (external)
cPanel mail server (SMTP for alerts)
```

## Prerequisites (VPS)

- WHM/cPanel VPS with root/SSH access
- Docker Engine + Docker Compose plugin installed
- MongoDB Atlas cluster (recommended) with VPS IP allowlisted
- Domain DNS: `A` record → VPS, `api` subdomain → VPS
- cPanel email account for alerts (e.g. `alerts@yourdomain.com`)

## 1. Install Docker (once)

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker
```

Add your deploy user to the `docker` group if needed.

## 2. Clone and configure

```bash
cd /opt
git clone <your-repo> winkwebhealth
cd winkwebhealth
cp .env.docker.example .env
nano .env   # fill production values
```

Required `.env` values:

| Variable | Example |
|----------|---------|
| `PORT` | `4545` |
| `WEB_URL` | `https://winkwebhealth.com` |
| `VITE_API_URL` | `https://api.winkwebhealth.com` |
| `DB_URL` | MongoDB Atlas connection string |
| `JWT_SECRET` | long random string |
| `REDIS_URL` | `redis://redis:6379` (leave as-is for Docker) |
| `SMTP_*` | cPanel mail settings |
| `STRIPE_*` | live keys + webhook secret |

## 3. Build and start

```bash
chmod +x deploy/up.sh
./deploy/up.sh
```

Or manually:

```bash
docker compose up -d --build
```

Verify:

```bash
docker compose ps
docker compose logs -f worker   # should show smtpReady: true, worker running
curl -s http://127.0.0.1:4545/  # API welcome JSON
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/  # 200
```

## 4. Apache reverse proxy (cPanel)

**Recommended:** run the setup script as root:

```bash
sudo ./deploy/apache-proxy-ssh.sh
```

Or paste directives from `deploy/cpanel-apache-directives.txt` / `deploy/apache-vhost.example.conf`.

Enable modules if needed: `proxy`, `proxy_http`, `headers`, `ssl`, `rewrite`

**Important:** Docker binds to `127.0.0.1` only — not exposed to the public internet directly.

## 5. SSL

Use cPanel **AutoSSL** / Let's Encrypt for:

- `winkwebhealth.com`
- `www.winkwebhealth.com`
- `api.winkwebhealth.com`

## 6. Stripe webhooks

Point Stripe webhook to:

```
https://api.yourdomain.com/billing/webhook
```

Use the live `STRIPE_WEBHOOK_SECRET` in `.env`.

## 7. Updates

```bash
cd /opt/winkwebhealth
git pull
docker compose up -d --build
```

To rebuild only the web app after changing `VITE_API_URL`:

```bash
docker compose build web --no-cache
docker compose up -d web
```

## 8. Local development (Redis only in Docker)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up redis -d
cd api-mongoose && npm run dev    # http://localhost:4545
cd worker && npm run dev
cd web && npm run dev             # http://localhost:8080
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| BullMQ lock errors | Ensure only **one** worker container: `docker compose ps worker` |
| No email alerts | Check `docker compose logs worker` for `smtpReady: false` |
| API 502 / 503 from Apache | Re-run `sudo ./deploy/apache-proxy-ssh.sh`; API uses **host network** on `127.0.0.1:4545` |
| Web shows wrong API | Rebuild web with correct `VITE_API_URL` in `.env` |
| MongoDB timeouts | Allowlist VPS public IP in Atlas Network Access |

## Firewall

Allow: **80**, **443**  
Block public access to: **4545**, **6379**, **8080** (Docker maps them to 127.0.0.1 only)

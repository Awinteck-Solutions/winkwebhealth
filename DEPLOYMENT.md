# WinkWebHealth — Production deployment (Docker + cPanel/WHM)

Hybrid setup: **Docker runs the app stack**; **cPanel/WHM** handles DNS, SSL, and SMTP.

## Architecture

```
Internet
   │
   ▼
Apache (cPanel, SSL on 443)
   ├── yourdomain.com      ──proxy──► 127.0.0.1:8080  (web container / nginx)
   └── api.yourdomain.com  ──proxy──► 172.28.10.10:3000  (api container bridge IP)

Docker network `wink` (172.28.10.0/24)
   ├── redis
   ├── api      (fixed IP 172.28.10.10 — no host port publish)
   ├── worker   (single instance only)
   └── web      (published 127.0.0.1:8080 only)

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
curl -s http://172.28.10.10:3000/  # API welcome JSON (bridge IP, not localhost)
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/  # 200
```

## 4. Apache reverse proxy (cPanel)

**Recommended:** run the setup script as root:

```bash
sudo ./deploy/apache-proxy-ssh.sh
```

This proxies the web app via `127.0.0.1:8080` and the API via the container bridge IP **`172.28.10.10:3000`**. The API is **not** published on localhost — `docker-proxy` on port 3000 is unreliable on cPanel VPS.

See also `deploy/apache-vhost.example.conf` and `deploy/cpanel-apache-directives.txt`.

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
cd api-mongoose && npm run dev    # http://localhost:3000
cd worker && npm run dev
cd web && npm run dev             # http://localhost:8080
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| BullMQ lock errors | Ensure only **one** worker container: `docker compose ps worker` |
| No email alerts | Check `docker compose logs worker` for `smtpReady: false` |
| API 502 / connection reset | Re-run `sudo ./deploy/apache-proxy-ssh.sh` — API must proxy to **172.28.10.10:3000**, not localhost:3000 |
| SELinux blocks Apache → Docker | `sudo setsebool -P httpd_can_network_connect 1` |
| Web shows wrong API | Rebuild web with correct `VITE_API_URL` in `.env` |
| MongoDB timeouts | Allowlist VPS public IP in Atlas Network Access |

## Firewall

Allow: **80**, **443**  
Block public access to: **8080** (web only; bound to 127.0.0.1). API has no public host port.

#!/usr/bin/env bash
# Run ON THE VPS as root or deploy user (after git clone).
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/winkwebhealth}"
REPO_URL="${REPO_URL:-}"  # set your git remote

echo "==> WinkWebHealth VPS bootstrap"

if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

if [[ -n "$REPO_URL" && ! -d "$APP_DIR/.git" ]]; then
  mkdir -p "$(dirname "$APP_DIR")"
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

if [[ ! -f .env ]]; then
  echo "Copy .env.docker.example to .env and fill production values, then re-run."
  cp -n .env.docker.example .env || true
  exit 1
fi

chmod +x deploy/*.sh
./deploy/check-env.sh

echo "==> Building and starting stack..."
docker compose up -d --build

echo ""
docker compose ps
echo ""
echo "Next: configure Apache proxy (deploy/apache-vhost.example.conf)"
echo "  winkwebhealth.com     -> 127.0.0.1:8080"
echo "  api.winkwebhealth.com -> 127.0.0.1:3000"
echo ""
echo "Test locally on VPS:"
echo "  curl -s http://127.0.0.1:3000/"
echo "  curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/"

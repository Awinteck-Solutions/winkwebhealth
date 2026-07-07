#!/usr/bin/env bash
# Run on the VPS (SSH session). Clones repo, checks .env, starts Docker stack.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=config.sh
source "$ROOT/deploy/config.sh"

REPO_URL="${REPO_URL:-https://github.com/Awinteck-Solutions/winkwebhealth.git}"
APP_DIR="${APP_DIR:-}"

if [[ -z "$APP_DIR" ]]; then
  if [[ -w /opt ]] || [[ "$(id -u)" -eq 0 ]]; then
    APP_DIR=/opt/winkwebhealth
  else
    APP_DIR="$HOME/winkwebhealth"
  fi
fi

echo "==> WinkWebHealth first-run deploy"
echo "    App dir: $APP_DIR"

if ! command -v docker >/dev/null 2>&1; then
  if [[ "$(id -u)" -ne 0 ]]; then
    echo "Docker not installed. Run as root: curl -fsSL https://get.docker.com | sh"
    exit 1
  fi
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

if ! docker info >/dev/null 2>&1; then
  echo "Cannot run docker. Add user to docker group: sudo usermod -aG docker $USER"
  echo "Then log out and back in, or run this script with sudo."
  exit 1
fi

if [[ ! -d "$APP_DIR/.git" ]]; then
  mkdir -p "$(dirname "$APP_DIR")"
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
git pull --ff-only origin main || true

if [[ ! -f .env ]]; then
  echo ""
  echo "Missing .env — copy from your Mac (new terminal, not SSH):"
  echo "  scp \"/Users/samjay/Development/INTERNAL PROJECTS/Monitoring tools/.env\" vps:$APP_DIR/.env"
  echo ""
  echo "Then re-run: cd $APP_DIR && ./deploy/vps-first-run.sh"
  exit 1
fi

chmod +x deploy/*.sh
./deploy/check-env.sh
./deploy/up.sh

echo ""
echo "==> Local checks on VPS"
curl -sf "${API_UPSTREAM_URL}" | head -c 120 && echo ""
curl -s -o /dev/null -w "Web HTTP: %{http_code}\n" http://127.0.0.1:8080/

PUBLIC_IP="$(curl -sf https://ifconfig.me 2>/dev/null || curl -sf https://api.ipify.org 2>/dev/null || true)"
if [[ -n "$PUBLIC_IP" ]]; then
  echo ""
  echo "VPS public IP: $PUBLIC_IP"
  echo "Add this IP to MongoDB Atlas → Network Access if not already allowlisted."
fi

echo ""
echo "==> Next: Apache proxy (cPanel)"
echo "See deploy/cpanel-apache-directives.txt"
echo "  winkwebhealth.com     -> http://127.0.0.1:8080"
echo "  api.winkwebhealth.com -> ${API_UPSTREAM_URL}"

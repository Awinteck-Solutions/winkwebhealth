#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck source=config.sh
source "$ROOT/deploy/config.sh"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.docker.example to .env and fill in values."
  exit 1
fi

echo "Building and starting WinkWebHealth stack..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo ""
echo "Stack status:"
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

echo ""
echo "Endpoints (via Apache proxy in production):"
echo "  Web:  https://winkwebhealth.com     -> ${WEB_UPSTREAM_URL}"
echo "  API:  https://api.winkwebhealth.com -> ${API_UPSTREAM_URL}"
echo ""
echo "Verify API:"
echo "  curl -s ${API_UPSTREAM_URL}"
echo ""
echo "Configure Apache: sudo ./deploy/apache-proxy-ssh.sh"
echo "Logs: docker compose logs -f api worker web"

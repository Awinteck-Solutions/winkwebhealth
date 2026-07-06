#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.docker.example to .env and fill in values."
  exit 1
fi

echo "Building and starting WinkWebHealth stack..."
docker compose up -d --build

echo ""
echo "Stack status:"
docker compose ps

echo ""
echo "Endpoints (via Apache proxy in production):"
echo "  Web:  https://winkwebhealth.com     -> 127.0.0.1:8080"
echo "  API:  https://api.winkwebhealth.com -> 127.0.0.1:3000"
echo ""
echo "Logs: docker compose logs -f api worker web"

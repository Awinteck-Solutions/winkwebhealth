#!/usr/bin/env bash
# Run on your Mac — copies .env to VPS (requires SSH key passphrase).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env"
SSH_HOST="${SSH_HOST:-vps}"
APP_DIR="${APP_DIR:-}"  # auto-detected on VPS if empty

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

if [[ -z "$APP_DIR" ]]; then
  APP_DIR="$(ssh "$SSH_HOST" 'if [[ -d /opt/winkwebhealth/.git ]]; then echo /opt/winkwebhealth; else echo ~/winkwebhealth; fi')"
fi

echo "Copying .env to $SSH_HOST:$APP_DIR/.env"
scp "$ENV_FILE" "$SSH_HOST:$APP_DIR/.env"
echo "Done."

#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${1:-$ROOT/.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  echo "Run: cp .env.docker.example .env && edit values"
  exit 1
fi

# shellcheck disable=SC1090
set -a
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line//[[:space:]]/}" ]] && continue
  if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
    key="${BASH_REMATCH[1]}"
    val="${BASH_REMATCH[2]}"
    if [[ "$val" =~ ^\'(.*)\'$ ]]; then
      val="${BASH_REMATCH[1]}"
    elif [[ "$val" =~ ^\"(.*)\"$ ]]; then
      val="${BASH_REMATCH[1]}"
    fi
    val="${val//\$\$/\$}"
    printf -v "$key" '%s' "$val"
    export "$key"
  fi
done < "$ENV_FILE"
set +a

missing=()
warn=()

require() {
  local name=$1
  local val=${!name:-}
  if [[ -z "$val" ]] || [[ "$val" == *"change-me"* ]] || [[ "$val" == *"your-"* ]] || [[ "$val" == sk_test_* ]] || [[ "$val" == whsec_...* ]] || [[ "$val" == price_...* ]]; then
    missing+=("$name")
  fi
}

require WEB_URL
require VITE_API_URL
require DB_URL
require JWT_SECRET
require REDIS_URL
require SMTP_HOST
require SMTP_USER
require SMTP_PASS
require SMTP_FROM

[[ "${JWT_SECRET:-}" == "your-jwt-secret" ]] && missing+=("JWT_SECRET (still default)")

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Fix these in .env before production deploy:"
  printf '  - %s\n' "${missing[@]}"
  exit 1
fi

[[ "${STRIPE_SECRET_KEY:-}" == sk_test_* ]] && warn+=("STRIPE_SECRET_KEY is a test key (use sk_live_ before accepting payments)")
[[ "${STRIPE_WEBHOOK_SECRET:-}" == whsec_...* ]] && warn+=("STRIPE_WEBHOOK_SECRET is still a placeholder")
[[ "${STRIPE_PRO_PRICE_ID:-}" == price_...* ]] && warn+=("STRIPE_PRO_PRICE_ID is still a placeholder")

if [[ ${#warn[@]} -gt 0 ]]; then
  echo "Warnings (app can run, but fix before billing goes live):"
  printf '  - %s\n' "${warn[@]}"
fi

echo "Environment check passed."
echo "  WEB_URL=$WEB_URL"
echo "  VITE_API_URL=$VITE_API_URL"
echo "  DB_URL=***"
echo "  SMTP_HOST=$SMTP_HOST"

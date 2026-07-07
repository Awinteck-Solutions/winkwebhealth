#!/usr/bin/env bash
# Configure Apache reverse proxy on cPanel/WHM via SSH (requires root/sudo).
#
# Usage on VPS:
#   cd ~/winkwebhealth
#   sudo ./deploy/apache-proxy-ssh.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=config.sh
source "$ROOT/deploy/config.sh"

CPANEL_USER="${CPANEL_USER:-awinxcxu}"
WEB_DOMAIN="${WEB_DOMAIN:-winkwebhealth.com}"
API_DOMAIN="${API_DOMAIN:-api.winkwebhealth.com}"
WEB_UPSTREAM="${WEB_UPSTREAM:-$WEB_UPSTREAM_URL}"
API_UPSTREAM="${API_UPSTREAM:-$API_UPSTREAM_URL}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run with sudo: sudo $0"
  exit 1
fi

if [[ ! -d /etc/apache2/conf.d/userdata ]]; then
  echo "cPanel Apache userdata not found. Is this a cPanel server?"
  exit 1
fi

for mod in proxy proxy_http headers; do
  if ! httpd -M 2>/dev/null | grep -q "${mod}_module"; then
    echo "Missing Apache module: $mod"
    echo "Enable in WHM → EasyApache 4 → Apache Modules → $mod"
    exit 1
  fi
done

write_proxy_conf() {
  local domain=$1 upstream=$2
  local ssl_dir="/etc/apache2/conf.d/userdata/ssl/2_4/${CPANEL_USER}/${domain}"
  local std_dir="/etc/apache2/conf.d/userdata/std/2_4/${CPANEL_USER}/${domain}"
  local conf_file

  mkdir -p "$ssl_dir" "$std_dir"
  for conf_file in "${ssl_dir}/winkwebhealth-proxy.conf" "${std_dir}/winkwebhealth-proxy.conf"; do
    cat > "$conf_file" <<EOF
ProxyPreserveHost On
RequestHeader set X-Forwarded-Proto "https"
RequestHeader set X-Forwarded-For "%{REMOTE_ADDR}s"
ProxyPass / ${upstream}
ProxyPassReverse / ${upstream}
EOF
  done
  echo "  wrote $domain -> $upstream"
}

if ! curl -sf --max-time 3 "$API_UPSTREAM" >/dev/null 2>&1; then
  echo "WARNING: API not reachable at $API_UPSTREAM yet." >&2
  echo "  Ensure .env has PORT=${API_PORT} and run: docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build api" >&2
fi

if command -v getenforce >/dev/null 2>&1 && [[ "$(getenforce)" == "Enforcing" ]]; then
  if ! getsebool httpd_can_network_connect 2>/dev/null | grep -q ' on$'; then
    echo "==> Enabling SELinux httpd_can_network_connect for Apache -> Docker proxy"
    setsebool -P httpd_can_network_connect 1
  fi
fi

echo "==> Apache proxy for cPanel user: $CPANEL_USER"
write_proxy_conf "$WEB_DOMAIN" "$WEB_UPSTREAM"
write_proxy_conf "$API_DOMAIN" "$API_UPSTREAM"

echo "==> Rebuilding Apache config..."
/scripts/rebuildhttpdconf
/scripts/restartsrv_httpd

echo ""
echo "Done. API upstream: $API_UPSTREAM"
echo "Test:"
echo "  curl -s $API_UPSTREAM"
echo "  curl -sI https://${WEB_DOMAIN}/ | head -5"
echo "  curl -s https://${API_DOMAIN}/"

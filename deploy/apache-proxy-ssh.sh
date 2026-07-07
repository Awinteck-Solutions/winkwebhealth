#!/usr/bin/env bash
# Configure Apache reverse proxy on cPanel/WHM via SSH (requires root/sudo).
#
# Usage on VPS:
#   cd ~/winkwebhealth
#   sudo ./deploy/apache-proxy-ssh.sh
#
# Or with custom cPanel user:
#   sudo CPANEL_USER=awinxcxu ./deploy/apache-proxy-ssh.sh

set -euo pipefail

CPANEL_USER="${CPANEL_USER:-awinxcxu}"
WEB_DOMAIN="${WEB_DOMAIN:-winkwebhealth.com}"
API_DOMAIN="${API_DOMAIN:-api.winkwebhealth.com}"
WEB_UPSTREAM="${WEB_UPSTREAM:-http://127.0.0.1:8080/}"
API_UPSTREAM="${API_UPSTREAM:-http://127.0.0.1:3000/}"

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
  local conf='ProxyPreserveHost On
RequestHeader set X-Forwarded-Proto "https"
RequestHeader set X-Forwarded-For "%{REMOTE_ADDR}s"
ProxyPass / '"${upstream}"'
ProxyPassReverse / '"${upstream}"

  mkdir -p "$ssl_dir" "$std_dir"
  printf '%s\n' "$conf" > "${ssl_dir}/winkwebhealth-proxy.conf"
  printf '%s\n' "$conf" > "${std_dir}/winkwebhealth-proxy.conf"
  echo "  wrote $domain -> $upstream"
}

echo "==> Apache proxy for cPanel user: $CPANEL_USER"
write_proxy_conf "$WEB_DOMAIN" "$WEB_UPSTREAM"
write_proxy_conf "$API_DOMAIN" "$API_UPSTREAM"

echo "==> Rebuilding Apache config..."
/scripts/rebuildhttpdconf
/scripts/restartsrv_httpd

echo ""
echo "Done. Test:"
echo "  curl -sI https://${WEB_DOMAIN}/ | head -5"
echo "  curl -s https://${API_DOMAIN}/"
echo ""
echo "If SSL is not ready yet, run AutoSSL in WHM/cPanel first, then re-run this script."

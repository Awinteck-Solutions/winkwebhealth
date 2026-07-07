#!/usr/bin/env bash
# Shared deploy constants — must match docker-compose.yml port mappings.

export API_HOST_PORT="${API_HOST_PORT:-3001}"
export WEB_HOST_PORT="${WEB_HOST_PORT:-8080}"

export API_UPSTREAM_URL="http://127.0.0.1:${API_HOST_PORT}/"
export WEB_UPSTREAM_URL="http://127.0.0.1:${WEB_HOST_PORT}/"

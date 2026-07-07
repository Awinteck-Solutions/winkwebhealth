#!/usr/bin/env bash
# Shared deploy constants — must match docker-compose.yml and .env PORT.

export API_PORT="${API_PORT:-4545}"
export WEB_HOST_PORT="${WEB_HOST_PORT:-8080}"

export API_UPSTREAM_URL="http://127.0.0.1:${API_PORT}/"
export WEB_UPSTREAM_URL="http://127.0.0.1:${WEB_HOST_PORT}/"

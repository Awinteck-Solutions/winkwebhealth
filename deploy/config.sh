#!/usr/bin/env bash
# Shared deploy constants — must match docker-compose.yml network settings.

export WINK_DOCKER_SUBNET="${WINK_DOCKER_SUBNET:-172.28.10.0/24}"
export API_CONTAINER_IP="${API_CONTAINER_IP:-172.28.10.10}"
export API_CONTAINER_PORT="${API_CONTAINER_PORT:-3000}"
export WEB_HOST_PORT="${WEB_HOST_PORT:-8080}"

export API_UPSTREAM_URL="http://${API_CONTAINER_IP}:${API_CONTAINER_PORT}/"
export WEB_UPSTREAM_URL="http://127.0.0.1:${WEB_HOST_PORT}/"

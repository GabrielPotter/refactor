#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
ENV_FILE="$ROOT_DIR/docker/postgres/postgres.env"

require_compose() {
  if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE=(docker compose)
  elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE=(docker-compose)
  else
    echo "Error: Docker Compose is required but not installed." >&2
    exit 1
  fi
}

compose() {
  "${DOCKER_COMPOSE[@]}" -f "$COMPOSE_FILE" "$@"
}

main() {
  require_compose

  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Error: Missing env file at $ENV_FILE. Run scripts/db-prep.sh first." >&2
    exit 1
  fi

  compose up -d postgres
  echo "Postgres container is starting (detached)."
}

main "$@"

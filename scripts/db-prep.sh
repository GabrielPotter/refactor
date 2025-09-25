#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
ENV_EXAMPLE="$ROOT_DIR/docker/postgres/postgres.env.example"
ENV_FILE="$ROOT_DIR/docker/postgres/postgres.env"
INIT_DIR="$ROOT_DIR/docker/postgres/init"

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
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    echo "Created default Postgres env file at $(realpath "$ENV_FILE")"
    echo "Edit this file to customize credentials before starting the container."
  else
    echo "Using existing env file at $(realpath "$ENV_FILE")"
  fi

  compose pull postgres
  echo "Postgres image pulled and ready."
  echo "SQL files found in $(realpath "$INIT_DIR") will run automatically on first start."
}

main "$@"

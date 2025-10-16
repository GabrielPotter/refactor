#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$ROOT_DIR/docker/postgres/data"
ENV_FILE="$ROOT_DIR/docker/postgres/init/postgres.env"
INIT_DIR="$ROOT_DIR/docker/postgres/init"

mkdir -p "$DATA_DIR"

docker pull postgres:16

docker create \
  --name refactor_postgres \
  --env-file "$ENV_FILE" \
  -p "${POSTGRES_PORT:-5432}:5432" \
  -v "$DATA_DIR:/var/lib/postgresql/data" \
  -v "$INIT_DIR:/docker-entrypoint-initdb.d:ro" \
  postgres:16

# sudo chown -R 999:999 "$DATA_DIR"
# sudo find "$DATA_DIR" -type d -exec chmod 700 {} \;
# sudo find  "$DATA_DIR" -type f -exec chmod 600 {} \;
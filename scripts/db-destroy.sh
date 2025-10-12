#!/usr/bin/env bash
set -euo pipefail

docker stop refactor_postgres
docker rm refactor_postgres
rm -rf ./docker/postgres/data

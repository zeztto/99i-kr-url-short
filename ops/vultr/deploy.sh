#!/usr/bin/env bash

set -euo pipefail

cd /opt/99i-kr-url-short

docker compose --env-file .env.production -f compose.yml --profile migration run --rm migrator
docker compose --env-file .env.production -f compose.yml up -d --build app
docker compose --env-file .env.production -f compose.yml ps

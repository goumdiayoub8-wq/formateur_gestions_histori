#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/backend/.env"
SEED_FILE="$ROOT_DIR/database/seed_data.sql"

read_env_value() {
  local key="$1"

  if [[ ! -f "$ENV_FILE" ]]; then
    return 1
  fi

  local line
  line="$(grep -E "^${key}=" "$ENV_FILE" | tail -n 1 || true)"
  if [[ -z "$line" ]]; then
    return 1
  fi

  printf '%s' "${line#*=}"
}

if ! command -v mysql >/dev/null 2>&1; then
  echo "[ERROR] mysql est requis pour appliquer le seed."
  exit 1
fi

if [[ ! -f "$SEED_FILE" ]]; then
  echo "[ERROR] Fichier introuvable: $SEED_FILE"
  exit 1
fi

DB_HOST="${DB_HOST:-$(read_env_value DB_HOST || printf '127.0.0.1')}"
DB_PORT="${DB_PORT:-$(read_env_value DB_PORT || printf '3306')}"
DB_NAME="${DB_NAME:-$(read_env_value DB_NAME || printf 'gestion_formateurs')}"
DB_USER="${DB_USER:-$(read_env_value DB_USER || printf 'root')}"
DB_PASSWORD="${DB_PASSWORD:-$(read_env_value DB_PASSWORD || printf '')}"

MYSQL_ARGS=(
  -h "$DB_HOST"
  -P "$DB_PORT"
  -u "$DB_USER"
  "$DB_NAME"
)

export MYSQL_PWD="$DB_PASSWORD"
mysql "${MYSQL_ARGS[@]}" < "$SEED_FILE"
unset MYSQL_PWD

echo "[OK] Seed applique sur $DB_NAME ($DB_HOST:$DB_PORT)."

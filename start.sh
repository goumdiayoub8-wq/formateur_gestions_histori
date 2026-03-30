#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_ENV="$BACKEND_DIR/.env"
FRONTEND_ENV="$FRONTEND_DIR/.env.local"

DB_PORT="3307"
BACKEND_PORT="8000"
FRONTEND_PORT="5173"

BACKEND_LOG="/tmp/gestion-formateurs-backend.log"
FRONTEND_LOG="/tmp/gestion-formateurs-frontend.log"
BACKEND_PID_FILE="/tmp/gestion-formateurs-backend.pid"
FRONTEND_PID_FILE="/tmp/gestion-formateurs-frontend.pid"

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

pick_compose_command() {
  if command_exists docker-compose; then
    echo "docker-compose"
    return 0
  fi

  if command_exists docker && docker compose version >/dev/null 2>&1; then
    echo "docker compose"
    return 0
  fi

  return 1
}

port_in_use() {
  local port="$1"
  ss -ltn "( sport = :$port )" 2>/dev/null | rg -q ":$port"
}

wait_for_http() {
  local url="$1"
  local attempts="${2:-30}"

  for ((i = 0; i < attempts; i++)); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done

  return 1
}

ensure_backend_env() {
  cat >"$BACKEND_ENV" <<EOF
DB_HOST=127.0.0.1
DB_PORT=$DB_PORT
DB_NAME=gestion_formateurs
DB_USER=app
DB_PASSWORD=app
APP_FRONTEND_URL=http://127.0.0.1:$FRONTEND_PORT
APP_DEBUG=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=Gestion des horaires
EOF
}

ensure_frontend_env() {
  cat >"$FRONTEND_ENV" <<EOF
VITE_API_BASE=/api
VITE_API_PROXY_TARGET=http://127.0.0.1:$BACKEND_PORT
VITE_DEV_HOST=127.0.0.1
VITE_DEV_PORT=$FRONTEND_PORT
VITE_PREVIEW_PORT=4173
EOF
}

start_database() {
  local compose_cmd
  compose_cmd="$(pick_compose_command || true)"

  if [[ -z "$compose_cmd" ]]; then
    echo "[WARN] Docker Compose introuvable. La base n'a pas ete demarree automatiquement."
    return 0
  fi

  echo "[1/4] Demarrage de la base Docker..."
  (cd "$ROOT_DIR" && eval "$compose_cmd up -d db" >/dev/null)

  for ((i = 0; i < 30; i++)); do
    if mysql -h 127.0.0.1 -P "$DB_PORT" -u app -papp -e "SELECT 1" >/dev/null 2>&1; then
      echo "      Base disponible sur 127.0.0.1:$DB_PORT"
      return 0
    fi
    sleep 2
  done

  echo "[WARN] La base Docker ne repond pas encore sur 127.0.0.1:$DB_PORT."
}

ensure_frontend_dependencies() {
  if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
    echo "[2/4] Installation des dependances frontend..."
    (cd "$FRONTEND_DIR" && npm install)
  else
    echo "[2/4] Dependances frontend deja presentes."
  fi
}

start_backend() {
  echo "[3/4] Backend PHP..."
  if port_in_use "$BACKEND_PORT"; then
    echo "      Port $BACKEND_PORT deja utilise, backend suppose deja demarre."
    return 0
  fi

  (cd "$BACKEND_DIR" && nohup php -S 127.0.0.1:"$BACKEND_PORT" router.php >"$BACKEND_LOG" 2>&1 & echo $! >"$BACKEND_PID_FILE")

  if wait_for_http "http://127.0.0.1:$BACKEND_PORT/" 20; then
    echo "      Backend disponible sur http://127.0.0.1:$BACKEND_PORT"
  else
    echo "[ERROR] Le backend n'a pas demarre correctement. Voir $BACKEND_LOG"
    exit 1
  fi
}

start_frontend() {
  echo "[4/4] Frontend Vite..."
  if port_in_use "$FRONTEND_PORT"; then
    echo "      Port $FRONTEND_PORT deja utilise, frontend suppose deja demarre."
    return 0
  fi

  (cd "$FRONTEND_DIR" && nohup npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" >"$FRONTEND_LOG" 2>&1 & echo $! >"$FRONTEND_PID_FILE")

  if wait_for_http "http://127.0.0.1:$FRONTEND_PORT/" 25; then
    echo "      Frontend disponible sur http://127.0.0.1:$FRONTEND_PORT"
  else
    echo "[ERROR] Le frontend n'a pas demarre correctement. Voir $FRONTEND_LOG"
    exit 1
  fi
}

main() {
  if ! command_exists php; then
    echo "[ERROR] PHP est requis pour lancer le backend."
    exit 1
  fi

  if ! command_exists npm; then
    echo "[ERROR] npm est requis pour lancer le frontend."
    exit 1
  fi

  if ! command_exists ss || ! command_exists curl || ! command_exists rg; then
    echo "[ERROR] Ce script demande ss, curl et rg."
    exit 1
  fi

  ensure_backend_env
  ensure_frontend_env
  start_database
  ensure_frontend_dependencies
  start_backend
  start_frontend

  local_ip=""
  if command_exists hostname; then
    local_ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
  fi

  echo
  echo "Projet pret :"
  echo "  Frontend : http://127.0.0.1:$FRONTEND_PORT"
  echo "  Backend  : http://127.0.0.1:$BACKEND_PORT"
  echo "  MySQL    : 127.0.0.1:$DB_PORT"
  if [[ -n "$local_ip" ]]; then
    echo "  LAN      : http://$local_ip:$FRONTEND_PORT"
  fi
  echo
  echo "Logs :"
  echo "  Backend  : $BACKEND_LOG"
  echo "  Frontend : $FRONTEND_LOG"

  if command_exists xdg-open; then
    xdg-open "http://127.0.0.1:$FRONTEND_PORT" >/dev/null 2>&1 || true
  fi
}

main "$@"

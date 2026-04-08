#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:8000}"
FRONTEND_URL="${PLAYWRIGHT_APP_URL:-http://127.0.0.1:5173}"

backend_pid=""
frontend_pid=""

cleanup() {
  if [[ -n "${frontend_pid}" ]] && kill -0 "${frontend_pid}" 2>/dev/null; then
    kill "${frontend_pid}" 2>/dev/null || true
    wait "${frontend_pid}" 2>/dev/null || true
  fi

  if [[ -n "${backend_pid}" ]] && kill -0 "${backend_pid}" 2>/dev/null; then
    kill "${backend_pid}" 2>/dev/null || true
    wait "${backend_pid}" 2>/dev/null || true
  fi
}

wait_for_url() {
  local url="$1"
  local label="$2"

  for _ in {1..60}; do
    if curl --silent --fail --output /dev/null "${url}"; then
      return 0
    fi
    sleep 1
  done

  echo "Timed out waiting for ${label} at ${url}" >&2
  return 1
}

start_backend_if_needed() {
  if curl --silent --fail --output /dev/null "${BACKEND_URL}"; then
    return 0
  fi

  (
    cd "${ROOT_DIR}"
    php -S 127.0.0.1:8000 -t backend backend/router.php >/tmp/gestion-backend.log 2>&1
  ) &
  backend_pid="$!"
  wait_for_url "${BACKEND_URL}" "backend"
}

start_frontend_if_needed() {
  if curl --silent --fail --output /dev/null "${FRONTEND_URL}"; then
    return 0
  fi

  (
    cd "${ROOT_DIR}/frontend"
    npm run dev -- --host 127.0.0.1 --port 5173 >/tmp/gestion-frontend.log 2>&1
  ) &
  frontend_pid="$!"
  wait_for_url "${FRONTEND_URL}" "frontend"
}

trap cleanup EXIT

cd "${ROOT_DIR}"

if command -v composer >/dev/null 2>&1; then
  composer test
else
  php backend/vendor/bin/phpunit --configuration phpunit.xml
fi

npm run test
start_backend_if_needed
start_frontend_if_needed
npm run test:e2e

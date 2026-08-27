#!/usr/bin/env sh
set -eu

APP_PORT="${WXM_APP_PORT:-8091}"
CMS_PORT="${WXM_CMS_PORT:-8098}"
REMOTE_PORT="${PORT:-8787}"

if ! command -v lsof >/dev/null 2>&1; then
  printf '%s\n' "lsof no encontrado. Cierra los procesos manualmente o reinicia la terminal." >&2
  exit 1
fi

stop_port() {
  name="$1"
  port="$2"
  pids="$(lsof -ti "tcp:$port" || true)"

  if [ -z "$pids" ]; then
    printf '[WXM local] %s no esta activo en puerto %s\n' "$name" "$port"
    return 0
  fi

  printf '[WXM local] Deteniendo %s en puerto %s: %s\n' "$name" "$port" "$pids"
  kill $pids
}

stop_port "app-web" "$APP_PORT"
stop_port "cms-local" "$CMS_PORT"
stop_port "remote-admin" "$REMOTE_PORT"

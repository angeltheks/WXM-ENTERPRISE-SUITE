#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd "$(dirname "$0")/.." && pwd)"
APP_PORT="${WXM_APP_PORT:-8091}"
CMS_PORT="${WXM_CMS_PORT:-8098}"
REMOTE_PORT="${PORT:-8787}"
LOG_DIR="${WXM_LOG_DIR:-/tmp/wxm-enterprise-suite}"

if command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="$(command -v python3)"
else
  printf '%s\n' "python3 no encontrado. No puedo iniciar servidores estaticos locales." >&2
  exit 1
fi

mkdir -p "$LOG_DIR"

port_busy() {
  if command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 "$1" >/dev/null 2>&1
  else
    return 1
  fi
}

suggest_port() {
  base="$1"
  port="$base"
  limit=$((base + 20))

  while [ "$port" -le "$limit" ]; do
    if ! port_busy "$port"; then
      printf '%s\n' "$port"
      return 0
    fi
    port=$((port + 1))
  done
}

start_static_server() {
  name="$1"
  port="$2"
  directory="$3"
  log_file="$LOG_DIR/$name-$port.log"

  if port_busy "$port"; then
    printf '[WXM local] %s ya parece activo en http://127.0.0.1:%s\n' "$name" "$port"
    alt_port="$(suggest_port "$port" || true)"
    if [ -n "$alt_port" ]; then
      printf '[WXM local] Puerto alterno libre sugerido para %s: %s\n' "$name" "$alt_port"
    fi
    return 0
  fi

  cd "$ROOT_DIR"
  "$PYTHON_BIN" -m http.server "$port" --directory "$directory" >"$log_file" 2>&1 &
  printf '[WXM local] %s iniciado en http://127.0.0.1:%s  log=%s\n' "$name" "$port" "$log_file"
}

start_static_server "app-web" "$APP_PORT" "$ROOT_DIR/v2"
start_static_server "cms-local" "$CMS_PORT" "$ROOT_DIR/v2"

if [ -n "${WXM_CMS_ADMIN_PASSWORD:-}" ]; then
  if port_busy "$REMOTE_PORT"; then
    printf '[WXM local] remote-admin ya parece activo en http://127.0.0.1:%s/admin/\n' "$REMOTE_PORT"
    alt_port="$(suggest_port "$REMOTE_PORT" || true)"
    if [ -n "$alt_port" ]; then
      printf '[WXM local] Puerto alterno libre sugerido para remote-admin: PORT=%s sh scripts/start-remote-cms.sh\n' "$alt_port"
    fi
  else
    PORT="$REMOTE_PORT" sh "$ROOT_DIR/scripts/start-remote-cms.sh" >"$LOG_DIR/remote-admin-$REMOTE_PORT.log" 2>&1 &
    printf '[WXM local] remote-admin iniciado en http://127.0.0.1:%s/admin/  log=%s\n' "$REMOTE_PORT" "$LOG_DIR/remote-admin-$REMOTE_PORT.log"
  fi
else
  printf '%s\n' "[WXM local] Remote Admin no se inicio porque falta WXM_CMS_ADMIN_PASSWORD."
  printf '%s\n' "[WXM local] Para incluirlo: export WXM_CMS_ADMIN_PASSWORD='pon-aqui-tu-clave-local' && sh scripts/start-local-suite.sh"
fi

printf '%s\n' ""
printf '%s\n' "URLs:"
printf '  App web:      http://127.0.0.1:%s/index.html?dev=0\n' "$APP_PORT"
printf '  CMS local:    http://127.0.0.1:%s/cms/index.html\n' "$CMS_PORT"
printf '  Remote Admin: http://127.0.0.1:%s/admin/\n' "$REMOTE_PORT"

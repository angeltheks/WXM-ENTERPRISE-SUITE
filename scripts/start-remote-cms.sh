#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd "$(dirname "$0")/.." && pwd)"
REMOTE_DIR="$ROOT_DIR/cms-remote-starter"
CODEX_NODE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"

if [ -z "${NODE_BIN:-}" ]; then
  if command -v node >/dev/null 2>&1; then
    NODE_BIN="$(command -v node)"
  elif [ -x "$CODEX_NODE" ]; then
    NODE_BIN="$CODEX_NODE"
  else
    printf '%s\n' "Node.js no encontrado. Instala Node 18+ o define NODE_BIN=/ruta/a/node." >&2
    exit 1
  fi
fi

if [ -z "${WXM_CMS_ADMIN_PASSWORD:-}" ]; then
  printf '%s\n' "Define WXM_CMS_ADMIN_PASSWORD antes de iniciar el CMS remoto." >&2
  printf '%s\n' "Ejemplo: export WXM_CMS_ADMIN_PASSWORD='pon-aqui-tu-clave-local'" >&2
  exit 1
fi

if [ -z "${WXM_CMS_SESSION_SECRET:-}" ]; then
  if command -v openssl >/dev/null 2>&1; then
    WXM_CMS_SESSION_SECRET="$(openssl rand -hex 32)"
  else
    WXM_CMS_SESSION_SECRET="$("$NODE_BIN" -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
  fi
  export WXM_CMS_SESSION_SECRET
fi

cd "$REMOTE_DIR"
PORT="${PORT:-8787}"
export PORT

printf '[WXM remote CMS] Node: %s\n' "$NODE_BIN"
printf '[WXM remote CMS] URL:  http://127.0.0.1:%s/admin/\n' "$PORT"
exec "$NODE_BIN" server.js

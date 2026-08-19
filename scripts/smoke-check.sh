#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXPECTED_ROOT="${WXM_EXPECTED_ROOT:-/Users/mac/AndroidProjects/Reprov2_NEXTGEN}"

cd "$ROOT_DIR"

info() {
  printf '[WXM smoke] %s\n' "$1"
}

fail() {
  printf '[WXM smoke] ERROR: %s\n' "$1" >&2
  exit 1
}

require_file() {
  [ -f "$1" ] || fail "Missing required file: $1"
}

check_json() {
  "$NODE_BIN" -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$1" >/dev/null
}

info "Root: $ROOT_DIR"
if [ "$ROOT_DIR" != "$EXPECTED_ROOT" ]; then
  if [ "${WXM_STRICT_ROOT:-0}" = "1" ]; then
    fail "Expected root $EXPECTED_ROOT, got $ROOT_DIR"
  fi
  info "Warning: expected local root is $EXPECTED_ROOT"
fi

command -v git >/dev/null 2>&1 || fail "git is required"
if [ -n "${NODE_BIN:-}" ]; then
  [ -x "$NODE_BIN" ] || fail "NODE_BIN is set but not executable: $NODE_BIN"
elif command -v node >/dev/null 2>&1; then
  NODE_BIN="$(command -v node)"
elif [ -x "/Applications/Codex.app/Contents/Resources/cua_node/bin/node" ]; then
  NODE_BIN="/Applications/Codex.app/Contents/Resources/cua_node/bin/node"
else
  fail "node is required"
fi
info "Node: $NODE_BIN"

info "Checking required entry points"
require_file "README.md"
require_file "MCP.md"
require_file "WXM_PROJECT_CONTEXT.md"
require_file "v2/index.html"
require_file "v2/cms/index.html"
require_file "cms-remote-starter/server.js"
require_file "android-webview/settings.gradle"
require_file "android-webview/gradlew"
require_file "android-webview/app/src/main/AndroidManifest.xml"

info "Checking Git hygiene"
forbidden="$(git ls-files | grep -E '(^|/)(build|\.gradle|\.idea|node_modules)(/|$)|(^|/)local\.properties$|\.apk$|\.aab$|(^|/)\.env$|(^|/)\.DS_Store$|^cms-remote-starter/data/|^cms-remote-starter/public/uploads/' || true)"
if [ -n "$forbidden" ]; then
  printf '%s\n' "$forbidden" >&2
  fail "Forbidden tracked files detected"
fi

info "Checking secret guard"
if git grep -nE '(WXM_CMS_ADMIN_PASSWORD=changeme|local-dev-secret|AIza[0-9A-Za-z_-]{20,}|sk-[0-9A-Za-z]{20,}|BEGIN (RSA|PRIVATE) KEY)' -- ':!v2/cms/assets/vendor/**' ':!v2/cms/cms/assets/vendor/**' ':!.github/workflows/ci.yml' ':!scripts/smoke-check.sh'; then
  fail "Potential secret or unsafe placeholder found"
fi

info "Checking JSON contracts"
check_json "v2/assets/data/wxm-cmc.json"
check_json "v2/assets/data/wxm-cms.remote.sample.json"
check_json "v2/cms/assets/maps/countries-110m.json"

info "Checking frontend JavaScript"
"$NODE_BIN" --check v2/assets/js/config.js
"$NODE_BIN" --check v2/assets/js/metadata-service.js
"$NODE_BIN" --check v2/assets/js/audio-engine.js
"$NODE_BIN" --check v2/assets/js/cms-config.js
"$NODE_BIN" --check v2/assets/js/cms-service.js
"$NODE_BIN" --check v2/assets/js/analytics-service.js
"$NODE_BIN" --check v2/assets/js/i18n.js
"$NODE_BIN" --check v2/assets/js/ui-controller.js
"$NODE_BIN" --check v2/assets/js/modules/playlist/playlist-engine.js
"$NODE_BIN" --check v2/assets/js/modules/playlist/playlist-storage.js
"$NODE_BIN" --check v2/assets/js/modules/playlist/playlist-ui.js

info "Checking CMS and remote admin JavaScript"
"$NODE_BIN" --check v2/cms/assets/js/cms.js
"$NODE_BIN" --check v2/cms/assets/react/WxmWorldAtlasMap.runtime.js
"$NODE_BIN" --check cms-remote-starter/server.js

info "Checking interface contracts"
"$NODE_BIN" scripts/interface-smoke.mjs

if [ "${WXM_SMOKE_BUILD_ANDROID:-0}" = "1" ]; then
  info "Building Android debug APK"
  pushd android-webview >/dev/null
  if [ -d "/Applications/Android Studio.app/Contents/jbr/Contents/Home" ]; then
    export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
  fi
  ./gradlew assembleDebug
  popd >/dev/null
fi

info "OK"

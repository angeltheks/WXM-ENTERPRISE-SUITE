#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

command -v java >/dev/null 2>&1 && java -version >/dev/null 2>&1 || {
  echo "ERROR: Java/JDK no esta instalado. Instala JDK 17." >&2
  exit 1
}

command -v gradle >/dev/null 2>&1 || {
  echo "ERROR: Gradle no esta instalado. Instala Gradle o compila desde Android Studio." >&2
  exit 1
}

"$ROOT_DIR/scripts/sync-android-assets.sh"

cd "$ROOT_DIR/android-webview"
gradle assembleDebug

echo
echo "APK generada en:"
echo "$ROOT_DIR/android-webview/app/build/outputs/apk/debug/app-debug.apk"

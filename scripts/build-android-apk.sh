#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -d "/Applications/Android Studio.app/Contents/jbr/Contents/Home" ]; then
  export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
  export PATH="$JAVA_HOME/bin:$PATH"
fi

command -v java >/dev/null 2>&1 && java -version >/dev/null 2>&1 || {
  echo "ERROR: Java/JDK no esta instalado. Instala JDK 17." >&2
  exit 1
}

"$ROOT_DIR/scripts/sync-android-assets.sh"

cd "$ROOT_DIR/android-webview"
./gradlew assembleDebug

echo
echo "APK generada en:"
echo "$ROOT_DIR/android-webview/app/build/outputs/apk/debug/app-debug.apk"

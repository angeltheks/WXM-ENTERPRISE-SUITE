#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT_DIR/android-webview/app/src/main/assets/public"

rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$ROOT_DIR/v2/." "$DEST/"

rm -rf "$DEST/scratch" "$DEST/cms"
rm -f "$DEST/.htaccess" "$DEST/spotify-proxy.php"

find "$DEST" -name ".DS_Store" -delete

echo "Android assets synced."

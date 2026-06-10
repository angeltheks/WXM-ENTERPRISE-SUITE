# WXM Deployment Guide

## Branches

```text
main  Stable production baseline.
dev   Daily integration branch.
```

Promote `dev` to `main` only after local validation and GitHub Actions pass.

## Android APK

Sync web assets before Android builds when `v2/` changes:

```bash
./scripts/sync-android-assets.sh
```

Build debug APK:

```bash
cd android-webview
JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew clean assembleDebug
```

Debug APK:

```text
android-webview/app/build/outputs/apk/debug/app-debug.apk
```

Do not commit APK files. Publish installable builds through GitHub Releases or CI artifacts.

## Local App Preview

```bash
python3 -m http.server 8091 --directory v2
```

Open:

```text
http://127.0.0.1:8091/index.html?dev=0
```

## Local CMS Preview

```bash
python3 -m http.server 8098 --directory v2
```

Open:

```text
http://127.0.0.1:8098/cms/index.html
```

## Remote Admin Starter

```bash
cd cms-remote-starter
export WXM_CMS_ADMIN_PASSWORD='set-a-local-password'
export WXM_CMS_SESSION_SECRET="$(node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")"
npm run dev
```

Open:

```text
http://127.0.0.1:8787/admin/
```


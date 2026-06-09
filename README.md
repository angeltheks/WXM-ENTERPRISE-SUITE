# WXM ONE RADIO NEXTGEN

Baseline oficial de WXM ONE RADIO NEXTGEN: app Android WebView/Media3, frontend `v2`, CMS local y CMS Remote Admin.

## Proyecto oficial

La ruta activa de desarrollo es:

```bash
/Users/mac/AndroidProjects/Reprov2_NEXTGEN
```

La carpeta anterior queda como respaldo. A partir de este baseline, todo cambio debe hacerse sobre `Reprov2_NEXTGEN` y versionarse en Git.

## Estructura

```text
android-webview/           App Android nativa con WebView, Media3, ExoPlayer, service, DSP, cache y bridge.
v2/                        Frontend web/app que se empaqueta dentro de Android.
v2/cms/                    CMS local visual para configurar contenido, analytics, mapa y secciones.
cms-remote-starter/        Servidor remoto minimo: login admin, publicar wxm-cms.json, assets y analytics anonimos.
scripts/                   Utilidades para sincronizar assets y compilar APK.
*.md                       Documentacion tecnica y reporte de migracion.
```

Notas:

- `v2/cms/index.html` es el CMS local activo.
- `v2/cms/cms/` es una copia heredada sincronizada por compatibilidad; no debe ser el punto principal de edicion.
- `v2/scratch/` contiene prototipos visuales; no es runtime de produccion.
- `cms-remote-starter/data/` y `cms-remote-starter/public/uploads/` son runtime local y no se suben a Git.

## Flujo Git

Ramas:

```text
main    Version estable que compila.
dev     Trabajo diario validado antes de merge.
feature/* o fix/* para cambios grandes.
```

Baseline:

```text
v0.1.0-baseline -> primer estado estable subido a GitHub.
```

Antes de cada push:

```bash
git status --short
node --check v2/assets/js/config.js
node --check v2/assets/js/metadata-service.js
node --check v2/assets/js/audio-engine.js
node --check v2/assets/js/cms-service.js
node --check v2/assets/js/ui-controller.js
node --check v2/cms/assets/js/cms.js
node --check v2/cms/assets/react/WxmWorldAtlasMap.runtime.js
node --check cms-remote-starter/server.js
```

## Ver app web local

```bash
python3 -m http.server 8091 --directory v2
```

Abrir:

```text
http://127.0.0.1:8091/index.html?dev=0
```

## Ver CMS local

```bash
python3 -m http.server 8098 --directory v2
```

Abrir:

```text
http://127.0.0.1:8098/cms/index.html
```

## Levantar CMS Remote Admin local

```bash
cd cms-remote-starter
export WXM_CMS_ADMIN_PASSWORD='elige-un-password-local'
export WXM_CMS_SESSION_SECRET="$(node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")"
npm run dev
```

Abrir:

```text
http://127.0.0.1:8787/admin/
```

## Compilar APK Android

Si cambias `v2`, sincroniza assets antes de compilar:

```bash
./scripts/sync-android-assets.sh
```

Compilar:

```bash
cd android-webview
JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew clean assembleDebug
```

APK debug:

```text
android-webview/app/build/outputs/apk/debug/app-debug.apk
```

## No subir a Git

El `.gitignore` bloquea estos archivos/carpetas:

```text
build/
.gradle/
.idea/
local.properties
*.apk
*.aab
.env
*.keystore
*.jks
cms-remote-starter/data/
cms-remote-starter/public/uploads/
```

Las APKs instalables deben ir como GitHub Releases, no como archivos del repo.


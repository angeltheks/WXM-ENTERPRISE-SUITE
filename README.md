# WXM ENTERPRISE SUITE

Suite oficial de WXM ONE RADIO: app Android WebView/Media3, frontend movil, CMS local, CMS Remote Admin, analytics y arquitectura preparada para CRM, streaming management, news, advertising, AI services y World Atlas Dashboard.

## Proyecto oficial

La unica ruta activa de desarrollo es:

```bash
/Users/mac/AndroidProjects/Reprov2_NEXTGEN
```

Carpetas historicas:

```text
/Users/mac/AndroidProjects/Reprov2
/Users/mac/Desktop/Reprov2
```

No se desarrollan cambios activos en carpetas historicas. Si hace falta recuperar un archivo antiguo, se compara, se migra al proyecto oficial y se versiona en Git.

Repositorio oficial:

```text
angeltheks/WXM-ENTERPRISE-SUITE
```

## Estructura

Estructura fisica actual:

```text
android-webview/           App Android nativa con WebView, Media3, ExoPlayer, service, DSP, cache y bridge.
v2/                        Frontend web/app que se empaqueta dentro de Android.
v2/cms/                    CMS local visual para configurar contenido, analytics, mapa y secciones.
cms-remote-starter/        Servidor remoto minimo: login admin, publicar wxm-cms.json, assets y analytics anonimos.
docs/                      Documentacion de arquitectura, seguridad, despliegue, APIs y roadmap.
scripts/                   Utilidades para sincronizar assets y compilar APK.
*.md                       Documentacion tecnica y reporte de migracion.
```

Notas:

- `v2/cms/index.html` es el CMS local activo.
- `v2/cms/cms/` es una copia heredada sincronizada por compatibilidad; no debe ser el punto principal de edicion.
- `v2/scratch/` contiene prototipos visuales; no es runtime de produccion.
- `cms-remote-starter/data/` y `cms-remote-starter/public/uploads/` son runtime local y no se suben a Git.

Estructura enterprise objetivo:

```text
apps/
cms/
analytics/
crm/
streaming/
shared/
infrastructure/
docs/
scripts/
```

La migracion fisica hacia esa estructura debe hacerse en una fase separada para no romper Android packaging, rutas del CMS ni CI.

## Documentacion Oficial

```text
WXM_PROJECT_CONTEXT.md
docs/ARCHITECTURE.md
docs/ROADMAP.md
docs/API_CONTRACT.md
docs/DATABASE.md
docs/SECURITY.md
docs/DEPLOYMENT.md
docs/WORLD_ATLAS.md
```

## Flujo Git

Ramas:

```text
main    Version estable que compila.
dev     Trabajo diario validado antes de merge.
feature/* o fix/* para cambios grandes.
```

No desarrollar directamente sobre `main`.

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

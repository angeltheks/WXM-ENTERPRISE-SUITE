# WXM ONE RADIO NEXTGEN Release Checklist

Usar este checklist antes de subir cambios importantes, generar APK o publicar una version.

## 1. Higiene Git

- Confirmar que estas en la fuente oficial:

```bash
pwd
```

Debe ser:

```text
/Users/mac/AndroidProjects/Reprov2_NEXTGEN
```

- No trabajar releases desde carpetas historicas:

```text
/Users/mac/AndroidProjects/Reprov2
/Users/mac/Desktop/Reprov2
```

- Confirmar que estas en la rama correcta:

```bash
git status --short --branch
```

- No subir artefactos:

```bash
git status --ignored --short
```

Debe quedar ignorado:

```text
build/
.gradle/
.idea/
local.properties
*.apk
*.aab
.env
cms-remote-starter/data/
cms-remote-starter/public/uploads/
```

## 2. Frontend y CMS

Validar sintaxis:

```bash
node --check v2/assets/js/config.js
node --check v2/assets/js/metadata-service.js
node --check v2/assets/js/audio-engine.js
node --check v2/assets/js/cms-service.js
node --check v2/assets/js/ui-controller.js
node --check v2/assets/js/modules/playlist/playlist-engine.js
node --check v2/assets/js/modules/playlist/playlist-storage.js
node --check v2/assets/js/modules/playlist/playlist-ui.js
node --check v2/cms/assets/js/cms.js
node --check v2/cms/assets/react/WxmWorldAtlasMap.runtime.js
```

Pruebas visuales minimas:

- App web abre en `http://127.0.0.1:8091/index.html?dev=0`.
- CMS local abre en `http://127.0.0.1:8098/cms/index.html`.
- Mapa mundial renderiza paises, Caribe, tooltip y rutas.
- Modo claro/oscuro no rompe textos ni botones.
- Play principal responde en navegador y Android.

## 3. CMS Remote Admin

Validar servidor:

```bash
node --check cms-remote-starter/server.js
```

Pruebas minimas:

- `GET /health` responde OK.
- `GET /admin/` abre login.
- Login requiere password por variable de entorno.
- `GET /wxm-cms.json` sirve JSON publico cuando existe publicacion.
- `POST /api/assets/upload` exige sesion.
- `POST /api/analytics/ingest` no guarda datos personales directos.

## 4. Android

Sincronizar assets:

```bash
./scripts/sync-android-assets.sh
```

Compilar:

```bash
cd android-webview
JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew clean assembleDebug
```

Validar en dispositivo o emulador:

- App abre sin pantalla rota.
- Play/pause funciona.
- Audio sigue en segundo plano.
- Lock screen muestra metadata y caratula correcta.
- Notificacion persistente no duplica controles.
- Cambio WiFi/datos no deja el player bloqueado.
- Sin internet muestra estado limpio y recupera al volver la red.

## 5. Seguridad

- No hay `.env` en `git status`.
- No hay claves reales en JS, HTML, PHP o docs.
- `spotify-proxy.php` usa variables de entorno fuera de `v2`.
- CMS remoto se sirve por HTTPS en produccion.
- `WXM_CMS_ADMIN_PASSWORD_SHA256` y `WXM_CMS_SESSION_SECRET` existen en hosting.

## 6. Publicacion

Para release:

```bash
git switch main
git merge --no-ff dev
git tag -a vX.Y.Z -m "WXM ONE RADIO NEXTGEN vX.Y.Z"
git push origin main --tags
```

Subir APK como GitHub Release, no dentro del repo.

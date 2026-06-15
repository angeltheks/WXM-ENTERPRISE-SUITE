# Current State Audit - WXM Enterprise Suite

Fecha: 2026-06-15

Rama auditada:

```text
dev
```

Ruta oficial:

```text
/Users/mac/AndroidProjects/Reprov2_NEXTGEN
```

## Resultado Ejecutivo

El monorepo oficial esta operativo y suficientemente estable para continuar. La auditoria operativa de continuidad quedo cerrada con smoke test unico, build Android validado y CMS remoto starter saneado para pruebas HTTP basicas.

Tres frentes siguen siendo prioridad antes de crecer a funciones grandes:

1. Consolidar el CMS remoto como backend real.
2. Eliminar o aislar copias legacy que ya empiezan a divergir.
3. Agregar smoke visual automatizado para app y CMS.

La app, CMS local, CMS remoto starter y build Android pasan las validaciones tecnicas basicas.

## Modulos Actuales

```text
android-webview/        App Android nativa, WebView bridge, Media3/ExoPlayer, foreground service, DSP y cache.
v2/                     Interfaz web/mobile que se empaqueta dentro de Android.
v2/cms/                 CMS local activo con dashboard, analytics y World Atlas.
cms-remote-starter/     Backend starter para hosting, admin remoto, CMS JSON, uploads y analytics anonimos.
scripts/                Utilidades de sincronizacion, build y smoke test.
docs/                   Documentacion enterprise oficial.
```

## Smoke Tests Ejecutados

Comando rapido:

```bash
scripts/smoke-check.sh
```

Resultado:

```text
OK
```

Cobertura:

- Entry points requeridos.
- Higiene Git.
- Guardia basica contra secretos.
- JSON contracts.
- JavaScript de app.
- JavaScript de CMS local.
- JavaScript de World Atlas runtime.
- Servidor CMS remoto.

Comando completo con Android:

```bash
WXM_SMOKE_BUILD_ANDROID=1 scripts/smoke-check.sh
```

Resultado:

```text
BUILD SUCCESSFUL
OK
```

## Pruebas HTTP Basicas

Servidor temporal:

```bash
python3 -m http.server 8111 --directory v2
```

Resultados:

```text
GET/HEAD /index.html                  200 OK
GET/HEAD /cms/index.html              200 OK
GET/HEAD /assets/data/wxm-cmc.json    200 OK
```

CMS Remote Admin temporal:

```bash
PORT=8791 WXM_CMS_ADMIN_PASSWORD='local-audit-password' WXM_CMS_SESSION_SECRET='...' node server.js
```

Resultados:

```text
HEAD /health        200 OK
HEAD /admin/        200 OK
HEAD /wxm-cms.json  200 OK
```

## Hallazgos

### 1. Fuente De Verdad

Estado: OK.

- El repo oficial esta limpio en `dev`.
- El proyecto oficial es `Reprov2_NEXTGEN`.
- Las carpetas historicas no deben usarse como fuentes activas.

### 2. Android

Estado: OK con advertencias normales.

- `assembleDebug` compila.
- APK debug se genera correctamente.
- Gradle reporta advertencias de deprecacion futuras, no errores.

Riesgo:

- Hay que vigilar compatibilidad futura con Gradle 10 y Java toolchains.

### 3. Frontend App

Estado: OK tecnico.

- Sintaxis JS valida.
- CMC local valido.
- Rutas principales responden por HTTP.

Pendiente:

- Smoke visual automatizado con navegador para verificar layout, botones, tabs, tema claro/oscuro y player.

### 4. CMS Local

Estado: OK tecnico.

- `v2/cms/index.html` responde.
- `cms.js` valida sintaxis.
- World Atlas runtime valida sintaxis.

Riesgo:

- Existe copia legacy `v2/cms/cms/`.
- `index.html` y `cms.js` coinciden con el CMS activo, pero `cms.css` y `WxmWorldAtlasMap.runtime.js` ya difieren.
- Esta divergencia puede provocar confusion de edicion y bugs visuales si alguien abre la copia equivocada.

Recomendacion:

- No borrar todavia.
- Crear una fase corta de consolidacion: decidir si se elimina, se archiva o se convierte en backup documentado fuera del runtime.

### 5. CMS Remote Starter

Estado: funcional como starter.

- `/health` responde.
- `/admin/` responde por `GET` y `HEAD`.
- `/wxm-cms.json` responde por `GET` y `HEAD`.
- `server.js` valida sintaxis.

Pendiente critico para produccion:

- Base de datos real.
- Roles y permisos.
- Auditoria de cambios.
- Gestion robusta de uploads.
- CSRF para acciones admin.
- HTTPS y cookies seguras en hosting.
- Persistencia durable de analytics.

### 6. Analytics / World Atlas

Estado: operativo a nivel frontend/starter.

- Hay dashboard local, analytics starter y mapa React/D3.
- La capa Caribe esta documentada como necesidad especial.

Pendiente:

- Conectar datos reales agregados desde backend persistente.
- Export CSV/JSON protegido.
- Geolocalizacion agregada server-side sin exponer IP.

### 7. Seguridad

Estado: base correcta.

- No se detectaron secretos por la guardia actual.
- No hay APKs, builds, `.env`, `.DS_Store` ni datos runtime trackeados.
- `.gitignore` cubre artefactos principales.

Pendiente:

- Security scan mas profundo para XSS/CSRF/uploads antes de hosting publico.
- Revisar CSP final del CMS remoto.

## Deuda Tecnica Detectada

1. `v2/cms/cms/` duplica parte del CMS y ya tiene divergencias.
2. `v2/scratch/` contiene prototipos utiles, pero no debe confundirse con runtime.
3. `cms-remote-starter/data/` contiene runtime local ignorado; correcto para dev, pero no apto para produccion.
4. `scripts/build-android-apk.sh` ya usa el Gradle Wrapper y el JDK embebido de Android Studio cuando existe.
5. No existe todavia test visual automatizado con navegador.
6. La estructura enterprise `apps/`, `cms/`, `shared/` esta definida como objetivo, pero no migrada fisicamente.

## Correcciones Aplicadas En Esta Auditoria

- Se creo `scripts/smoke-check.sh` como puerta unica de validacion tecnica.
- CI ejecuta el smoke test antes del build Android.
- El smoke test valida entry points, higiene Git, secretos basicos, JSON contracts y sintaxis JS.
- El smoke test usa Node desde `PATH` o el runtime embebido de Codex en macOS.
- `scripts/build-android-apk.sh` usa `android-webview/gradlew`, no Gradle global.
- `scripts/build-android-apk.sh` usa el JDK embebido de Android Studio cuando esta disponible.
- `cms-remote-starter/server.js` soporta `HEAD` en `/health`, `/admin/`, `/wxm-cms.json` y uploads.
- La APK debug fue compilada desde el flujo smoke y desde el script oficial.

## Recomendacion De Siguiente Fase

Siguiente fase recomendada:

```text
Fase 0.7 - Smoke Visual Y Consolidacion De Copias CMS
```

Alcance:

1. Crear smoke visual minimo con Browser/Playwright para app y CMS.
2. Documentar o aislar `v2/cms/cms/` para que no sea fuente paralela.
3. Agregar una matriz de endpoints y flags CMS reales antes de seguir con CRM o news manager.
4. Revisar advertencias Gradle de compatibilidad futura.
5. Preparar checklist manual de APK en dispositivo real.

No recomendado todavia:

- Migrar fisicamente a `apps/` y `cms/` en este momento.
- Separar CMS a otro repo.
- Agregar CRM o advertising antes de endurecer el backend remoto.

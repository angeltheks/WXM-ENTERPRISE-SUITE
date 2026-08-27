# WXM CMS Remote Starter

Servidor minimo para convertir el CMS local en una operacion remota segura:

- Publica `GET /wxm-cms.json` para que la app Android/Web lea configuracion por HTTPS.
- Protege escritura con login y cookie `HttpOnly`.
- Protege mutaciones admin con token CSRF por sesion.
- Limita intentos de login por ventana de tiempo.
- Registra auditoria admin pseudonima en NDJSON.
- Mantiene manifiesto de almacenamiento y snapshots operativos.
- Valida contrato antes de publicar.
- Guarda revision historica y permite rollback.
- Recibe analytics anonimos por `POST /api/analytics/ingest`.
- Expone resumen privado por `GET /api/analytics/summary`.
- Expone resumen privado del proveedor SHOUTcast por `GET /api/stream/shoutcast/summary`.
- Incluye consola admin minima en `GET /admin/` para login, estado, CMS publicado y analytics.

No reemplaza un CMS final con base de datos, roles y subida de imagenes, pero deja una base real para hosting.

## Desarrollo Local

```bash
cd /Users/mac/AndroidProjects/Reprov2_NEXTGEN
export WXM_CMS_ADMIN_PASSWORD='elige-un-password-local'
sh scripts/start-remote-cms.sh
```

Endpoints locales:

- `http://127.0.0.1:8787/health`
- `http://127.0.0.1:8787/wxm-cms.json`
- `http://127.0.0.1:8787/admin`

La consola admin actual es intencionalmente ligera: sirve para verificar servidor, sesion, JSON publicado y resumen de analytics. El editor visual completo sigue viviendo en el CMS local hasta migrarlo a una app admin con roles, auditoria y base de datos.

Si el sistema responde `zsh: command not found: node`, usa `scripts/start-remote-cms.sh` desde la raiz del proyecto. El script detecta Node global o el runtime embebido de Codex mediante `NODE_BIN`.

## Seguridad Admin

El starter incluye una capa de hardening sin dependencias externas:

- cookie `HttpOnly` firmada con HMAC;
- `SameSite=Lax`;
- `Secure` configurable en produccion;
- token CSRF retornado por `POST /api/auth/login` y `GET /api/auth/status`;
- mutaciones protegidas por header `X-WXM-CSRF`;
- rate limit basico de login;
- CSP base para el admin remoto;
- auditoria admin sin IP cruda.

Endpoints protegidos nuevos:

```text
GET /api/admin/status
GET /api/admin/audit?limit=80
GET /api/admin/storage
POST /api/admin/snapshot
GET /api/stream/shoutcast/summary
```

Mutaciones que requieren `X-WXM-CSRF`:

```text
POST /api/auth/logout
POST /api/cms/publish
POST /api/cms/rollback
POST /api/assets/upload
POST /api/admin/snapshot
```

Ejemplo:

```bash
curl -X POST https://tu-dominio.com/api/cms/publish \
  -H 'Content-Type: application/json' \
  -H 'Cookie: wxm_session=...' \
  -H 'X-WXM-CSRF: token-devuelto-por-login' \
  --data-binary @wxm-cms.json
```

## Produccion

1. Copia `.env.example` a `.env` en el servidor.
2. Define `WXM_CMS_ADMIN_PASSWORD_SHA256`.
3. Define `WXM_CMS_SESSION_SECRET` con un valor aleatorio largo.
4. Sirve siempre detras de HTTPS.
5. Configura `WXM_CMS_ALLOWED_ORIGINS` con el dominio real de la app/web.
6. Configura `WXM_CMS_PUBLIC_BASE_URL` con el dominio publico HTTPS del CMS.
7. Ajusta `WXM_CMS_LOGIN_MAX_ATTEMPTS` si necesitas una politica distinta.
8. Publica el endpoint en la app: `https://tu-dominio.com/wxm-cms.json`.
9. Programa backups externos del directorio `WXM_CMS_DATA_DIR` y de `public/uploads`.

Generar hash de password:

```bash
node -e "console.log(require('crypto').createHash('sha256').update(process.argv[1]).digest('hex'))" 'tu-password'
```

## Publicar JSON

Login:

```bash
curl -i -X POST https://tu-dominio.com/api/auth/login \
  -H 'Content-Type: application/json' \
  --data '{"password":"tu-password"}'
```

Publicar usando la cookie devuelta:

```bash
curl -X POST https://tu-dominio.com/api/cms/publish \
  -H 'Content-Type: application/json' \
  -H 'Cookie: wxm_session=...' \
  --data-binary @wxm-cms.json
```

## Subir Assets

El panel CMS puede convertir imagenes locales embebidas en URLs reales usando:

```text
POST /api/assets/upload
```

Payload:

```json
{
  "suggestedName": "banner-home",
  "image": "data:image/webp;base64,..."
}
```

El servidor valida PNG/JPG/WEBP, limita el peso y guarda el archivo en `public/uploads/`. La respuesta incluye `url`, que debe ser HTTPS en produccion.

Listar assets subidos:

```bash
curl https://tu-dominio.com/api/assets/list -H 'Cookie: wxm_session=...'
```

## Analytics

La app puede enviar eventos anonimos a:

```text
POST /api/analytics/ingest
```

Payload recomendado:

```json
{
  "name": "playback_started",
  "sourceClient": "wxm_android_app",
  "platform": "android",
  "appVersion": "nextgen-debug",
  "stationId": "main",
  "player": "media3",
  "streamRole": "primary",
  "country": "Dominican Republic",
  "city": "Santo Domingo",
  "referrer": "app",
  "sessionId": "anon-session-id",
  "networkScore": 5,
  "durationSeconds": 0
}
```

El servidor no debe recibir nombres, telefonos, emails, mensajes personales ni IP cruda en analytics. `sessionId` debe ser anonimo; el starter lo transforma en `anonId` hasheado para agregaciones.

Resumen privado para el dashboard CMS:

```text
GET /api/analytics/summary
```

Requiere cookie de admin. Devuelve conteos agregados y un objeto `analytics` compatible con el panel local:

```json
{
  "ok": true,
  "totalEvents": 1,
  "byCountry": { "Dominican Republic": 1 },
  "byPlayer": { "media3": 1 },
  "byReferrer": { "app": 1 },
  "liveConnections": [
    {
      "country": "Dominican Republic",
      "city": "Santo Domingo",
      "player": "media3",
      "sourceClient": "wxm_android_app",
      "ageSeconds": 20
    }
  ],
  "analytics": {
    "kpis": {
      "liveListeners": 1,
      "appUsers": 1,
      "totalListeningHours": 0
    }
  }
}
```

Las horas de escucha solo suben si la app envia `durationSeconds` o eventos de cierre de sesion. No se inventan listening hours.

## Persistencia y snapshots

La fase 5.2 introduce una capa local formal llamada `WxmFileStore`:

```text
cms-remote-starter/lib/storage.js
```

Esta capa centraliza:

- escritura atomica;
- append seguro en NDJSON;
- manifiesto de almacenamiento;
- estado de health;
- snapshots manuales y automaticos tras publish/rollback;
- conteo de CMS actual, revisiones, analytics, auditoria, uploads y snapshots.

Endpoints privados:

```text
GET  /api/admin/storage
POST /api/admin/snapshot
```

El snapshot guarda:

- manifiesto del almacenamiento;
- copia del CMS publico actual;
- resumen de analytics si `includeAnalyticsSummary` es `true`.

Ejemplo:

```bash
curl -X POST https://tu-dominio.com/api/admin/snapshot \
  -H 'Content-Type: application/json' \
  -H 'Cookie: wxm_session=...' \
  -H 'X-WXM-CSRF: token-devuelto-por-login' \
  --data '{"label":"antes-cambio-stream","reason":"backup_manual","includeAnalyticsSummary":true}'
```

Esto no reemplaza una base SQL final, pero deja el servidor preparado para migrar a SQLite/Postgres con un adaptador equivalente.

## SHOUTcast DNAS

La fase 5.2.1 agrega un conector protegido para leer el servidor SHOUTcast/DNAS desde el backend remoto. Esta integracion complementa analytics de la app con datos reales del servidor de streaming:

- oyentes actuales del servidor;
- peak y oyentes unicos;
- streams activos;
- SID principal/secundario;
- path del stream;
- codec, bitrate y sample rate;
- metadata actual;
- estado de listado publico;
- uptime y hits del stream.

Variables recomendadas:

```bash
WXM_SHOUTCAST_BASE_URL=http://jm8n.net:8024
WXM_SHOUTCAST_SIDS=1,5
WXM_SHOUTCAST_PRIMARY_SID=1
WXM_SHOUTCAST_ADMIN_USER=admin
WXM_SHOUTCAST_ADMIN_PASSWORD=tu-password-dnas
WXM_SHOUTCAST_TIMEOUT_MS=6500
WXM_SHOUTCAST_CACHE_TTL_MS=20000
```

Endpoint protegido:

```text
GET /api/stream/shoutcast/summary
```

Requiere cookie admin. El endpoint consulta:

```text
/statistics?json=1
/admin.cgi?sid=<primarySid>&mode=viewjson&page=6
```

El segundo endpoint solo se llama cuando existen credenciales admin. Los authhashes se devuelven redactados (`abcd...1234`) y solo como indicador `hasAuthhash`; nunca se deben guardar completos en Git, en la app Android, en el JSON publico ni en logs.

El Authhash sirve para identidad/listado SHOUTcast. No reemplaza analytics. Para el dashboard profesional se deben fusionar:

- SHOUTcast/DNAS: listeners reales del servidor y metadata del stream.
- WXM app analytics: sesiones, reproduccion, errores, app/web, referrers y retencion.
- Futuro warehouse: paises, ciudades y cohortes agregadas sin IP visible.

## Rollback

Listar revisiones:

```bash
curl https://tu-dominio.com/api/cms/revisions -H 'Cookie: wxm_session=...'
```

Restaurar:

```bash
curl -X POST https://tu-dominio.com/api/cms/rollback \
  -H 'Content-Type: application/json' \
  -H 'Cookie: wxm_session=...' \
  --data '{"file":"wxm-cms-YYYYMMDDTHHMMSSZ-abc123.json"}'
```

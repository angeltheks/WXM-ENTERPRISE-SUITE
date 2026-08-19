# WXM CMS Remote Starter

Servidor minimo para convertir el CMS local en una operacion remota segura:

- Publica `GET /wxm-cms.json` para que la app Android/Web lea configuracion por HTTPS.
- Protege escritura con login y cookie `HttpOnly`.
- Protege mutaciones admin con token CSRF por sesion.
- Limita intentos de login por ventana de tiempo.
- Registra auditoria admin pseudonima en NDJSON.
- Valida contrato antes de publicar.
- Guarda revision historica y permite rollback.
- Recibe analytics anonimos por `POST /api/analytics/ingest`.
- Expone resumen privado por `GET /api/analytics/summary`.
- Incluye consola admin minima en `GET /admin/` para login, estado, CMS publicado y analytics.

No reemplaza un CMS final con base de datos, roles y subida de imagenes, pero deja una base real para hosting.

## Desarrollo Local

```bash
cd cms-remote-starter
export WXM_CMS_ADMIN_PASSWORD='elige-un-password-local'
export WXM_CMS_SESSION_SECRET="$(node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")"
npm run dev
```

Endpoints locales:

- `http://127.0.0.1:8787/health`
- `http://127.0.0.1:8787/wxm-cms.json`
- `http://127.0.0.1:8787/admin`

La consola admin actual es intencionalmente ligera: sirve para verificar servidor, sesion, JSON publicado y resumen de analytics. El editor visual completo sigue viviendo en el CMS local hasta migrarlo a una app admin con roles, auditoria y base de datos.

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
```

Mutaciones que requieren `X-WXM-CSRF`:

```text
POST /api/auth/logout
POST /api/cms/publish
POST /api/cms/rollback
POST /api/assets/upload
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

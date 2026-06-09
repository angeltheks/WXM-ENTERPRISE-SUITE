# CMS Remote Starter - WXM ONE RADIO

## Que Es

`cms-remote-starter/` es una base minima de servidor para alojar el control remoto de WXM sin meter el CMS dentro del APK.

Sirve para:

- Publicar `GET /wxm-cms.json` por HTTPS.
- Proteger publicacion con login y cookie `HttpOnly`.
- Validar el contrato antes de publicar.
- Guardar revision historica de cada publicacion.
- Hacer rollback a una revision anterior.
- Subir imagenes locales del CMS y servirlas como assets publicos versionados.
- Recibir analytics anonimos de la app y web.

## Endpoints

- `GET /health`
- `GET /wxm-cms.json`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/status`
- `GET /api/cms/current`
- `POST /api/cms/publish`
- `GET /api/cms/revisions`
- `POST /api/cms/rollback`
- `POST /api/assets/upload`
- `GET /api/assets/list`
- `POST /api/analytics/ingest`
- `GET /api/analytics/summary`

## Archivos

- `cms-remote-starter/server.js`: servidor Node sin dependencias externas.
- `cms-remote-starter/package.json`: scripts `start`, `dev`, `check`.
- `cms-remote-starter/.env.example`: variables requeridas.
- `cms-remote-starter/data/current/wxm-cms.json`: JSON actualmente publicado.
- `cms-remote-starter/data/revisions/`: backups de publicaciones.
- `cms-remote-starter/data/analytics/`: eventos anonimos NDJSON.
- `cms-remote-starter/public/uploads/`: imagenes subidas por el CMS remoto.
- `cms-remote-starter/public/admin/index.html`: pantalla base del admin remoto.

## Seguridad

- No guarda secretos en el JSON publico.
- No acepta HTTP para streams, metadata ni endpoints de analytics.
- Usa cookie `HttpOnly` para sesion.
- Firma sesiones con HMAC SHA-256.
- Valida tamano maximo de payload.
- Valida MIME y firma binaria de imagenes PNG/JPG/WEBP.
- Guarda publicaciones de forma atomica.
- Limita ingesta de analytics por IP.
- No almacena nombres, telefonos, emails, mensajes personales ni IP cruda en analytics.
- Genera `anonId` hasheado para conteos agregados de audiencia.

## Assets

El endpoint `POST /api/assets/upload` recibe imagenes locales embebidas por el panel CMS, valida el archivo y devuelve una URL publica:

```json
{
  "suggestedName": "hero-main",
  "image": "data:image/webp;base64,..."
}
```

Respuesta:

```json
{
  "ok": true,
  "path": "/uploads/2026/05/hero-main-abcd1234.webp",
  "url": "https://cms.wxmoneradio.com/uploads/2026/05/hero-main-abcd1234.webp"
}
```

En produccion define `WXM_CMS_PUBLIC_BASE_URL` para que el servidor devuelva URLs HTTPS reales. El panel CMS reemplaza las imagenes embebidas por esas URLs antes de publicar el JSON.

## Analytics Remoto

`POST /api/analytics/ingest` recibe eventos anonimos de app/web/player. Campos recomendados:

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

`GET /api/analytics/summary` requiere sesion admin y devuelve una estructura lista para el CMS:

- KPIs: live listeners, peak audience, app users, total listening hours.
- Dashboard: tendencia de horas, audiencia realtime y conexiones vivas.
- Paises: access, unique listeners, live y listening hours.
- Players: app Android, web, externos o Media3.
- Referidores: app, directo, web o partners.

Las horas de escucha solo se calculan con `durationSeconds` real. Si la app todavia no envia duracion, el dashboard muestra 0 en listening hours para evitar metricas falsas.

## Pendiente

- Integrar visualmente el panel CMS completo con las APIs remotas.
- Roles: admin, editor, operador.
- Galeria avanzada de assets con borrado, reemplazo y metadatos.
- Filtros avanzados por fecha, pais, player y origen sobre el resumen analytics remoto.
- Base de datos real si la operacion crece.
- Despliegue definitivo detras de Nginx/Caddy/Cloudflare con HTTPS.

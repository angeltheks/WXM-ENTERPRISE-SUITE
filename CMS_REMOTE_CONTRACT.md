# CMS Remoto - WXM ONE RADIO

## Objetivo

Este contrato define el JSON que el CMS alojado en hosting debe publicar por HTTPS para controlar contenido, funciones, stream y experiencia visual/audio de la app sin recompilar la APK.

La app debe aceptar dos formatos compatibles:

- **CMC bruto**: formato editorial interno usado por el panel local, con `station`, `stream`, `content`, `features`, `visual`, `audioExperience` y `emergency`.
- **CMS app contract**: formato de publicacion con `rails`, `homeRails` y `exploreRails`. Desde 2026-05-30 la app tambien deriva `content` desde esos `rails`, por lo que puede consumir el JSON exportado por el panel como `wxm-cms.json`.

## Flujo

```text
CMS privado con login
        |
        | valida contrato y publica JSON atomico
        v
https://tu-dominio.com/wxm-cms.json
        |
        | app descarga, sanitiza, limita y cachea/fallback local
        v
WXM ONE RADIO Android/Web
```

## Reglas De Produccion

- Produccion debe usar `https://`.
- El JSON publicado no debe incluir secretos, claves privadas, tokens ni credenciales.
- No se ejecuta HTML remoto.
- Textos se tratan como texto plano.
- Imagenes: `https://...` o assets locales `assets/img/...`.
- URLs de accion: `https://`, `mailto:` o `tel:`.
- Stream principal, metadata API, fallbacks y stream de emergencia deben ser HTTPS.
- El CMS debe validar antes de publicar. Si hay errores, no se descarga `wxm-cms.json`.
- Si el CMS remoto falla, la app vuelve a cache remota valida o al CMC local.

## Endpoint

Durante desarrollo se puede configurar desde la app:

`Mi WXM -> CMS / CMC -> Endpoint`

Ejemplo:

```text
https://tu-dominio.com/wxm-cms.json
```

## Campos Principales

```json
{
  "revision": "2026-05-30-production",
  "source": "cms-panel",
  "station": {
    "name": "WXM ONE RADIO",
    "domain": "wxmoneradio.com",
    "slogan": "La radio que conecta al mundo",
    "logo": "assets/img/brand/wxm-emblem-square.png"
  },
  "stream": {
    "primaryUrl": "https://jm8n.net:8024/stream",
    "fallbackUrls": [],
    "infoApi": "https://jm8n.net/cp/get_info.php?p=8024",
    "reconnectIntervalMs": 5000,
    "maxRetries": 5
  },
  "features": {
    "miniPlayer": true,
    "languageSelector": true,
    "programs": true,
    "requests": true,
    "secondaryStations": true,
    "podcasts": true,
    "news": true,
    "presenters": true,
    "polls": true,
    "sponsors": true,
    "audioExperience": true,
    "emergencyMode": false
  },
  "visual": {
    "themeDefault": "dark",
    "allowLightTheme": true,
    "heroImage": "assets/img/brand/hero-world-wide.png",
    "logoImage": "assets/img/brand/wxm-emblem-square.png",
    "accentColor": "#e91e63"
  },
  "audioExperience": {
    "recommendedProfile": "standard",
    "defaultProfile": "standard",
    "enabled": true,
    "allowUserProfiles": true,
    "lowDataMode": false,
    "networkWarning": true
  },
  "emergency": {
    "enabled": false,
    "severity": "info",
    "title": "WXM en vivo",
    "message": "La senal opera normalmente.",
    "streamUrl": ""
  },
  "content": {
    "schedule": [],
    "highlights": [],
    "banners": [],
    "presenters": [],
    "articles": [],
    "podcasts": [],
    "stations": [],
    "polls": [],
    "sponsors": []
  },
  "homeRails": [],
  "exploreRails": ["secondaryStations", "podcasts", "news", "presenters", "polls", "sponsors"],
  "rails": {
    "news": {
      "feature": "news",
      "titleKey": "cms.rails.news",
      "layout": "article-row",
      "items": [
        {
          "title": "WXM prepara nuevos especiales",
          "subtitle": "Contenido editorial desde CMS.",
          "image": "assets/img/brand/hero-world-wide.png",
          "badge": "Noticias",
          "body": "Texto de la noticia como contenido plano.",
          "url": "https://wxmoneradio.com"
        }
      ]
    }
  }
}
```

## Gate De Publicacion

El panel local `v2/cms/index.html` valida antes de descargar/copiar el contrato de app:

- Revision presente.
- Stream principal HTTPS.
- Metadata API HTTPS cuando exista.
- Hero/logo seguros.
- Rails referenciados existen.
- Items con titulo.
- Imagenes seguras.
- URLs seguras.
- Payload razonable.
- Advertencias cuando faltan fallback streams o analytics remoto.

## Pendiente Para CMS Real

- Panel privado remoto completo con login y roles.
- Guardado en base de datos.
- Publicacion atomica de `wxm-cms.json`.
- Historial de revisiones y rollback.
- Subida/gestion de imagenes.
- Backend de analytics real.
- Push notifications.
- Prueba de CORS y cache headers en hosting.

## CMS Remote Starter

Desde 2026-05-30 existe una base de servidor en `cms-remote-starter/`.

Incluye:

- `GET /wxm-cms.json` publico para la app.
- Login por `POST /api/auth/login`.
- Publicacion protegida por `POST /api/cms/publish`.
- Validacion server-side del contrato.
- Backups por revision y rollback.
- Ingesta anonima de analytics en `POST /api/analytics/ingest`.
- Resumen privado en `GET /api/analytics/summary`.

Esto no sustituye el CMS final con roles, base de datos y gestor de imagenes, pero ya permite probar un flujo real de hosting: panel local exporta, servidor valida/publica, app consume HTTPS y vuelve a cache/local si falla.

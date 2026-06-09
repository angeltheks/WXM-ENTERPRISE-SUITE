# WXM ONE RADIO - Guia de despliegue seguro

## Archivos a publicar

Publica solo el contenido de `v2/` como webroot del reproductor.

No publiques archivos de trabajo de la raiz del proyecto:

- `Reproductor.xml`
- `extracted_code.html`
- `extract_script.py`
- `PROMPT_BLINDAJE_SEGURIDAD.md`
- `.DS_Store`
- `v2/scratch/`
- backups, volcados, logs o archivos temporales

Usa `.deployignore` como lista de exclusion si tu herramienta de despliegue lo permite.

## Secretos de Spotify

No pongas `SPOTIFY_CLIENT_ID` ni `SPOTIFY_CLIENT_SECRET` dentro de `v2/` ni en JavaScript.

Opcion recomendada en hosting compartido:

```php
<?php
define('SPOTIFY_CLIENT_ID', 'TU_CLIENT_ID_REAL');
define('SPOTIFY_CLIENT_SECRET', 'TU_CLIENT_SECRET_REAL');
```

Guarda ese archivo una carpeta por encima del webroot:

```text
/home/tu_usuario/spotify-secrets.php
/home/tu_usuario/public_html/spotify-proxy.php
```

Si las credenciales estuvieron publicadas alguna vez, rotalas en el panel de Spotify Developer antes del despliegue.

## Dominio y CORS

En `v2/spotify-proxy.php`, ajusta `ALLOWED_ORIGIN` al origen real que consumira el proxy.

```php
define('ALLOWED_ORIGIN', 'https://wxmoneradio.com');
```

El proxy no devuelve tokens al navegador. El cliente solo debe llamar:

```text
spotify-proxy.php?action=search&q=ARTISTA%20TITULO
```

## Cabeceras HTTP

El archivo `v2/.htaccess` define:

- `Content-Security-Policy`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Strict-Transport-Security`
- reglas de cache
- bloqueo de `scratch/` y archivos sensibles

Si el reproductor se sirve desde un subdominio y debe ser embebido en otro dominio propio, ajusta `frame-ancestors` con orígenes exactos. No uses `X-Frame-Options` si necesitas permitir más de un origen.

## Checklist antes de subir

- Ejecutar `node --check` sobre los archivos JS.
- Ejecutar `php -l v2/spotify-proxy.php` en el servidor o en un entorno con PHP.
- Confirmar que `spotify-secrets.php` existe fuera del webroot.
- Confirmar que `v2/.htaccess` está activo en Apache/Hostinger.
- Probar play, stop, mute, sync, metadata, carátulas y playlist.
- Probar metadata maliciosa: etiquetas HTML, `javascript:`, `data:` y texto largo.
- Confirmar que `v2/scratch/` devuelve 403 si existe en el servidor.

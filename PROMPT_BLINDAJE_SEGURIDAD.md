# Prompt para blindar la aplicacion contra vulnerabilidades

Actua como un auditor senior de seguridad ofensiva y defensiva, con experiencia en aplicaciones web estaticas, JavaScript modular, PHP, APIs externas, CORS, cabeceras HTTP, gestion de secretos, XSS, supply chain y despliegues en hosting compartido.

Tu tarea es auditar y endurecer esta aplicacion completa:

- Proyecto: WXM ONE RADIO player
- Raiz: `/Users/mac/Desktop/Reprov2`
- Entrada principal: `v2/index.html`
- Embed: `v2/embed.html`
- JavaScript: `v2/assets/js/`
- CSS: `v2/assets/css/main.css`
- Proxy PHP: `v2/spotify-proxy.php`
- Assets: `v2/assets/img/`
- Archivos heredados: `Reproductor.xml`, `extracted_code.html`, `extract_script.py`

## Objetivo

Blindar la aplicacion contra vulnerabilidades reales y probables sin romper la experiencia del reproductor. No prometas "seguridad absoluta"; identifica riesgos, prioriza por impacto y probabilidad, implementa mitigaciones concretas, y deja una guia de despliegue seguro.

## Reglas de trabajo

1. Lee primero la estructura del proyecto y entiende como se ejecuta.
2. No elimines funcionalidades sin justificarlo.
3. No introduzcas frameworks pesados si el proyecto puede mantenerse como HTML/CSS/JS/PHP simple.
4. Mantén los cambios pequenos, revisables y compatibles con hosting compartido.
5. Evita cambios esteticos salvo que sean necesarios para seguridad o accesibilidad.
6. Nunca hardcodees secretos, tokens, claves privadas ni credenciales.
7. Si encuentras secretos existentes, marca el hallazgo como critico y recomienda rotacion inmediata.
8. Valida sintaxis y comportamiento despues de modificar.
9. Documenta cada cambio de seguridad aplicado.

## Superficie de ataque a revisar

Revisa, como minimo:

- XSS por datos de metadata, historial, titulos, artistas, covers o contenido externo.
- Inyeccion HTML por uso de `innerHTML`.
- URLs externas no confiables en `img.src`, `fetch`, links o parametros.
- CORS demasiado permisivo.
- Credenciales expuestas en PHP o JavaScript.
- Uso inseguro de tokens de Spotify.
- Falta de validacion en parametros `GET` del proxy PHP.
- Falta de allowlist para dominios de imagenes y APIs.
- Falta de timeouts o control de errores en `fetch`.
- Dependencias CDN sin Subresource Integrity.
- Riesgos de cargar Font Awesome y Google Fonts desde terceros.
- Falta de Content Security Policy.
- Falta de cabeceras HTTP de seguridad.
- Riesgos de `localStorage`: corrupcion, tamano, datos inyectados, persistencia maliciosa.
- Manipulacion del DOM por datos del stream.
- Riesgos del modo embed en iframes.
- Rutas absolutas locales en archivos `scratch/` o scripts.
- Archivos temporales, `.DS_Store`, scratch files y artefactos heredados que no deben desplegarse.
- Manejo de errores que filtra informacion sensible.
- Autoplay/audio y permisos del navegador.
- Clickjacking, si el reproductor no debe ser embebido por terceros.
- Cache, service workers si existieran, y assets versionados.
- Proteccion contra abuso del proxy PHP como proxy abierto.
- Rate limiting basico o mitigaciones posibles en hosting compartido.

## Cambios esperados

Implementa o propone patches para:

### 1. Gestion de secretos

- Mover `SPOTIFY_CLIENT_ID` y `SPOTIFY_CLIENT_SECRET` fuera del codigo.
- Leer secretos desde variables de entorno cuando sea posible.
- Si el hosting no permite variables de entorno, usar un archivo PHP privado fuera del webroot, por ejemplo `spotify-secrets.php`, y documentar que no debe subirse publicamente.
- Recomendar rotar cualquier secreto que ya haya estado expuesto.

### 2. Proxy PHP seguro

Endurece `v2/spotify-proxy.php`:

- Validar `action` contra una allowlist.
- Validar y limitar `q`, `type` y cualquier parametro recibido.
- No aceptar tokens arbitrarios del cliente si se puede evitar.
- Obtener el token en servidor y usarlo internamente.
- Restringir `Access-Control-Allow-Origin` al dominio real de produccion.
- Devolver codigos HTTP correctos.
- Manejar errores sin filtrar detalles internos.
- Aplicar timeout a cURL.
- Verificar que `curl_exec` no devuelva falso.
- Definir `Content-Type: application/json; charset=utf-8`.
- Desactivar metodos no necesarios.

### 3. Proteccion XSS en frontend

- Reemplazar renderizado peligroso con `textContent`, `createElement`, templates seguros o funcion de escape.
- Sanitizar o validar datos externos antes de ponerlos en DOM.
- Escapar `track.title`, `track.artist`, `track.time`, `track.cover`, `dayName` y cualquier texto derivado del stream.
- Validar URLs de caratulas con una allowlist de protocolos y dominios.
- No permitir `javascript:`, `data:` no autorizado, URLs relativas inesperadas o valores vacios peligrosos en imagenes remotas.

### 4. Content Security Policy

Proponer una CSP compatible con este proyecto. Debe considerar:

- Scripts locales tipo modulo.
- CSS local y, si se mantienen, CDNs de Font Awesome y Google Fonts.
- Imagenes locales, Spotify/iTunes y caratulas externas permitidas.
- Audio desde `https://jm8n.net:8024/stream`.
- Fetch hacia `https://jm8n.net`, `https://itunes.apple.com` y el proxy local.
- Bloquear `object-src`.
- Restringir `base-uri`.
- Definir politica de `frame-ancestors` segun si el embed debe ser publico o restringido.

Incluye version para `.htaccess` si aplica a Apache/Hostinger.

### 5. Cabeceras HTTP

Proponer configuracion para:

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`
- `Permissions-Policy`
- `Strict-Transport-Security` si el sitio va por HTTPS
- `X-Frame-Options` solo si no contradice `frame-ancestors`
- `Cache-Control` razonable para HTML, JS, CSS e imagenes

### 6. Supply chain

- Revisar CDNs.
- Si se mantienen CDNs, agregar SRI donde sea viable.
- Preferir vendorizacion local de iconos/fuentes si reduce riesgo y dependencia externa.
- Confirmar que no se cargan scripts innecesarios.

### 7. Limpieza de despliegue

Crear o proponer una lista de exclusion para produccion:

- `.DS_Store`
- `scratch/`
- XML original si no es necesario publicarlo
- scripts de extraccion
- archivos de prueba
- backups
- cualquier archivo con rutas `file://` o `/Users/...`

### 8. Validaciones y pruebas

Despues de implementar, ejecutar:

- Validacion de sintaxis JS con `node --check`.
- Validacion PHP con `php -l` si PHP esta disponible.
- Busqueda de secretos con `rg`.
- Busqueda de usos peligrosos de `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval`, `Function`, URLs no validadas.
- Prueba manual en navegador del play, stop, mute, sync, metadata, playlist y modal.
- Prueba con metadata maliciosa simulada, por ejemplo:
  - `<img src=x onerror=alert(1)>`
  - `"><script>alert(1)</script>`
  - `javascript:alert(1)`
  - texto extremadamente largo
  - URL de imagen con dominio no permitido

## Formato de entrega

Entrega:

1. Resumen ejecutivo de riesgos encontrados.
2. Lista de hallazgos priorizados: Critico, Alto, Medio, Bajo.
3. Patches aplicados, con archivos y lineas relevantes.
4. Cambios que requieren accion fuera del codigo, como rotar claves o configurar hosting.
5. Guia de despliegue seguro.
6. Checklist final de verificacion.

## Prioridad inicial para este proyecto

Empieza por estos puntos porque ya fueron detectados:

- Credenciales de Spotify hardcodeadas en `v2/spotify-proxy.php`.
- `Access-Control-Allow-Origin: *` en el proxy.
- Renderizado con `innerHTML` en la playlist usando datos externos.
- `extract_script.py` con rutas absolutas antiguas.
- `v2/scratch/` con referencias `file://` y rutas locales.
- `v2/embed.html` posiblemente desalineado con las clases CSS actuales.
- Uso de CDNs externos sin SRI.

## Criterio de aceptacion

La tarea se considera terminada cuando:

- No hay secretos reales en el codigo publico.
- El proxy PHP no funciona como proxy abierto.
- Los datos externos no pueden ejecutar HTML o JavaScript en el DOM.
- Existe una CSP razonable y documentada.
- Existen instrucciones claras de despliegue seguro.
- Se han validado los cambios con comandos y pruebas manuales posibles.
- La app sigue reproduciendo audio y mostrando metadata, caratulas y playlist.

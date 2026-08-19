# MCP - WXM ONE RADIO App

## Vision

WXM ONE RADIO debe evolucionar de reproductor web a una app de radio completa: en vivo, programacion, comunidad, contenido editorial, favoritos, audio nativo y experiencia movil premium. La app debe sentirse como una emisora viva, no como un player aislado.

## Principios

- El audio en vivo es el nucleo, pero no la unica funcion.
- La primera pantalla debe responder: que esta pasando ahora, que viene despues y que puedo hacer.
- La experiencia movil no debe obligar al usuario a subir y bajar para controlar el reproductor.
- Toda informacion externa debe renderizarse con DOM seguro, no HTML inyectado.
- La app debe funcionar en web, Android WebView y futuro iOS/Capacitor.
- Las funciones sin backend deben usar datos locales/mock editables y localStorage seguro.
- Mientras no exista CMS remoto, la app debe consumir un CMC local en JSON validado y preparado para migrar a HTTPS.
- El proxy Spotify vive en servidor HTTPS; la app movil no ejecuta PHP.
- La reproduccion Android debe vivir en servicio nativo para segundo plano, pantalla bloqueada y controles de sistema.

## Gobernanza Oficial Del Proyecto

Desde 2026-06-10 existe una sola fuente de verdad:

```text
/Users/mac/AndroidProjects/Reprov2_NEXTGEN
```

Repositorio oficial:

```text
angeltheks/WXM-ENTERPRISE-SUITE
```

Carpetas historicas, no activas:

```text
/Users/mac/AndroidProjects/Reprov2
/Users/mac/Desktop/Reprov2
```

Reglas permanentes:

- No desarrollar en carpetas historicas.
- Si se necesita un archivo legacy, comparar versiones, verificar diferencias y migrar solo lo necesario al repo oficial.
- Trabajar en `dev` o `feature/*`; nunca directo en `main`.
- Mantener el proyecto como monorepo enterprise.
- No crear sistemas paralelos si existe un modulo equivalente.
- Refactorizar antes de duplicar.
- Documentar cambios de arquitectura en `docs/`, `MCP.md` y `WXM_PROJECT_CONTEXT.md`.
- No mover fisicamente `android-webview/`, `v2/` ni `cms-remote-starter/` sin una fase de migracion controlada, porque hoy esas rutas sostienen Android packaging, previews locales y CI.

Arquitectura objetivo:

```text
apps/
cms/
analytics/
crm/
streaming/
shared/
infrastructure/
scripts/
docs/
```

## Fase 0.6 - Auditoria Operativa De Continuidad - 2026-06-15

Estado: completada.

Objetivo:

- Recuperar el punto exacto tras desconexiones/interrupciones.
- Validar que `Reprov2_NEXTGEN` sigue siendo la unica fuente activa.
- Evitar que nuevas funciones se monten sobre una base no comprobada.

Implementado:

- `scripts/smoke-check.sh` como smoke test unico para app, CMS, contratos JSON, seguridad basica y JS.
- CI ejecuta el smoke test antes de compilar Android.
- `scripts/build-android-apk.sh` usa Gradle Wrapper y JDK de Android Studio cuando esta disponible.
- CMS Remote Starter soporta `HEAD` en rutas publicas criticas:
  - `/health`
  - `/admin/`
  - `/wxm-cms.json`
- Reporte `docs/CURRENT_STATE_AUDIT.md` con estado real, deuda tecnica y siguiente fase.

Validacion:

- Smoke rapido: OK.
- Smoke con Android build: `BUILD SUCCESSFUL`.
- Build APK oficial: `BUILD SUCCESSFUL`.
- CMS remoto temporal: `HEAD /health`, `HEAD /admin/` y `HEAD /wxm-cms.json` respondieron `200 OK`.

Siguiente recomendacion:

- Fase 0.7: smoke visual automatizado y consolidacion de copias CMS antes de expandir CRM, news manager o publicidad.

## Fase 0.7 - Smoke De Interfaz Y Disciplina CMS - 2026-08-20

Objetivo:

- Cerrar la brecha de validacion visual/semantica antes de abrir mas fases funcionales.
- Evitar regresiones en app mobile, CMS, Analytics, Sistema y World Atlas.
- Mantener una sola fuente activa del CMS aunque exista un espejo legacy de continuidad.

Implementado:

- `scripts/interface-smoke.mjs` valida contratos criticos de interfaz sin dependencias externas:
  - vistas principales de la app;
  - mini player;
  - controles play/stop/sync;
  - historial semanal;
  - tabs y paneles de Analytics;
  - tabs y paneles de Sistema;
  - inputs de imagen;
  - World Atlas y sus guardas anti-regresion para Caribe/zoom;
  - paridad entre CMS activo y espejo legacy en archivos criticos.
- `scripts/smoke-check.sh` ejecuta ahora el smoke de interfaz dentro del smoke general.
- `package.json` agrega:
  - `npm run smoke`
  - `npm run smoke:interface`
- Nueva documentacion: `docs/INTERFACE_QA.md`.
- `docs/ROADMAP.md` agrega un track inmediato de estabilizacion antes de CRM, publicidad o IA.

Reglas:

- El CMS activo es `v2/cms/index.html` y `v2/cms/assets/`.
- `v2/cms/cms/` queda como espejo legacy, no como fuente de desarrollo.
- Cualquier cambio visual importante debe pasar por `npm run smoke`.

Pendiente recomendado:

- Agregar Playwright real con screenshots desktop/mobile cuando se instalen dependencias de test.
- Conectar Analytics a backend persistente real.
- Endurecer CMS Remote Admin antes de exponerlo en hosting publico.

## Fase 5.1 - CMS Remote Admin Hardening Base - 2026-08-20

Objetivo:

- Convertir el `cms-remote-starter` en una base remota mas seria antes de hosting publico.
- Proteger mutaciones admin contra CSRF.
- Agregar trazabilidad basica sin guardar IP cruda.
- Dejar el panel remoto mostrando estado de seguridad y auditoria.

Implementado:

- Token CSRF por sesion:
  - `POST /api/auth/login` devuelve `csrfToken`.
  - `GET /api/auth/status` devuelve `csrfToken` si la sesion es valida.
  - Mutaciones admin requieren header `X-WXM-CSRF`.
- Mutaciones protegidas:
  - `POST /api/auth/logout`
  - `POST /api/cms/publish`
  - `POST /api/cms/rollback`
  - `POST /api/assets/upload`
- Rate limit basico para intentos de login mediante `WXM_CMS_LOGIN_MAX_ATTEMPTS`.
- Auditoria admin pseudonima:
  - archivo local `data/audit/admin.ndjson`;
  - endpoint protegido `GET /api/admin/audit`;
  - no muestra IP cruda, usa hash pseudonimo.
- Endpoint protegido `GET /api/admin/status` con estado de hardening.
- CSP base en respuestas del servidor remoto.
- Admin remoto muestra:
  - hardening del servidor;
  - auditoria reciente;
  - botones para refrescar estado y auditoria.
- Smoke de interfaz valida ahora el contrato del Admin remoto.

Validacion:

- `node --check cms-remote-starter/server.js`: OK.
- Flujo local temporal:
  - login OK con `csrfToken`;
  - status protegido OK;
  - admin status OK;
  - logout sin CSRF rechazado con `403 csrf_required`;
  - audit protegido OK;
  - logout con CSRF OK.
- `scripts/smoke-check.sh`: OK.

Pendiente para produccion:

- Base de datos real.
- RBAC/roles por usuario.
- CSRF con cookies `Secure` obligatorias detras de HTTPS real.
- Auditoria durable en base de datos.
- Hash de password con KDF fuerte (`argon2`/`bcrypt`) cuando se permita dependencia externa.
- Backups, rotacion de logs y alertas.

## Fase actual

Estado al 2026-06-02: Fase 1 y Fase 1.5 estabilizadas, Fase 2 avanzada con CMC local, CMS UI local, modulos editoriales/media renderizados en la app y Analytics/CMS local organizada en vistas operativas. Backend remoto de recoleccion pendiente.

- Fase 1: app radio real mobile-first, home, en vivo, programas, historial, favoritos, peticiones locales y confianza basica.
- Fase 1.5: Android nativo base con MediaSession, notificacion persistente, lock screen, caratula e iconografia WXM.
- Fase 2: backend/CMS, push, analytics y datos reales. Iniciada a nivel de arquitectura, no culminada.
- Fase CMC 1: configuracion local por JSON dentro de la app, con validacion, flags de funciones e imagenes seguras.
- Fase CMS UI 1: panel local ultra moderno para editar, previsualizar y exportar el CMC.
- Fase CMC Media 1: banners, locutores, noticias, podcasts/replays, canales secundarios, encuestas, sponsors, emergencia, visual y audio experience administrables.
- Fase Audio 1: menu de audio inmersivo y efectos nativos Android.
- Fase Audio 2: migracion de MediaPlayer a Media3/ExoPlayer.
- Fase Audio 3: motor DSP WXM propio en tiempo real sobre ExoPlayer AudioProcessor.
- Fase Analytics/CMS 1: local organizada. Dashboard, quick stats, paises, players, referidores, eventos anonimos y usuarios provenientes de la app WXM; backend remoto pendiente.

## CMC local y CMS futuro

### Implementado

- Archivo local `v2/assets/data/wxm-cmc.json` como fuente de configuracion editable.
- Panel local `v2/cms/index.html` para administrar el CMC sin backend todavia.
- Editor de identidad de emisora, stream principal, metadata API, fallbacks, flags de funciones, programacion, destacados, banners, locutores, noticias, podcasts/replays, radios secundarias, encuestas, sponsors, emergencia, visual y audio experience.
- Vista previa movil para revisar la experiencia antes de exportar.
- Exportacion y copia de `wxm-cmc.json` listo para hosting.
- Guardado de borrador local en `localStorage` bajo `wxm_cmc_admin_draft`.
- Campo para guardar endpoint HTTPS futuro bajo `wxm_cmc_endpoint`.
- Carga previa de runtime config desde `loadRuntimeConfig()` antes de inicializar la UI.
- Validacion de URLs: streams y APIs deben ser HTTPS; assets locales solo bajo `assets/img/`.
- Whitelist de campos configurables para evitar que un JSON externo controle codigo arbitrario.
- Flags remotos/locales para activar o desactivar funciones:
  - `banners`
  - `programs`
  - `presenters`
  - `editorialHighlights`
  - `requests`
  - `history`
  - `favorites`
  - `sleepTimer`
  - `fallbackStreams`
  - `audioProfiles`
  - `secondaryStations`
  - `podcasts`
  - `mixes`
  - `news`
  - `videos`
  - `songQuiz`
  - `replays`
  - `polls`
  - `sponsors`
  - `emergencyMode`
  - `visualConfig`
  - `audioExperience`
- Programacion y destacados editoriales salen del CMC cuando esta disponible.
- Los modulos con imagen aceptan solo `assets/img/...` o HTTPS. Esto aplica a banners, programas, destacados, locutores, noticias, podcasts, radios secundarias, encuestas, sponsors, logo y hero.
- La app renderiza esos modulos con DOM seguro y `textContent`; no se permite HTML remoto.
- Stream principal, fallback streams, metadata API, max retries y reconnect interval salen del CMC.
- Endpoint remoto futuro se podra guardar en `localStorage` bajo la clave `wxm_cmc_endpoint`; solo se acepta HTTPS.
- Si el CMS remoto falla, la app vuelve al CMC local sin romper la experiencia.

### Pendiente

- Panel web real para administrar el JSON desde hosting.
- Publicacion HTTPS del CMS/CMC en dominio propio.
- CORS correcto para que Android WebView y web local puedan leer el JSON remoto.
- Login/roles para operadores, editores y administradores.
- Escritura real al servidor; el panel local actual exporta JSON, no publica automaticamente.
- Cache versionada con firma o checksum.
- Publicacion remota real del modo emergencia y stream alterno.
- Moderacion real de peticiones, mensajes y contenido editorial.
- Push notifications y segmentacion por favoritos.
- Dashboard privado de analytics con datos reales de reproduccion, paises, players, referidores y origen App/Web.
- Backend de ingesta para eventos anonimos de la app y del reproductor web.
- Agregacion horaria/diaria/semanal/mensual de audiencia sin exponer datos personales.
- Endpoints configurables desde CMS:
  - `analytics.ingestEndpoint`
  - `analytics.dashboardEndpoint`

## Fase CMS Remoto 1.2 - Starter De Hosting Y Analytics - 2026-05-30

### Implementado

- Activado el CMS avanzado como panel real en `v2/cms/index.html`; la version con Analytics ya no queda escondida dentro de `v2/cms/cms/`.
- Fusionado el gate de publicacion con el panel avanzado:
  - valida `wxm-cms.json` antes de copiar/descargar;
  - bloquea exportacion si hay errores criticos;
  - muestra advertencias por falta de fallback o endpoints remotos.
- El contrato exportado ahora incluye `station`, `content`, `analytics`, `stream`, `features`, `visual`, `audioExperience`, `homeRails`, `exploreRails` y `rails`.
- Creado `cms-remote-starter/` como base de hosting:
  - endpoint publico `GET /wxm-cms.json`;
  - login privado;
  - publicacion protegida;
  - validacion server-side;
  - backups de revision;
  - rollback;
  - ingesta anonima `POST /api/analytics/ingest`;
  - resumen privado `GET /api/analytics/summary`.
- Actualizado `CMS_REMOTE_STARTER.md` con uso, endpoints, seguridad y pendientes.

### Pendiente

- Integrar el panel visual completo con las APIs remotas para publicar sin usar curl/manual.
- Agregar roles reales: admin, editor, operador.
- Gestionar subida/seleccion de imagenes desde hosting.
- Definir dominio/hosting final y configurar HTTPS, CORS y cache headers.
- Conectar la app a `analytics.ingestEndpoint` remoto real en entorno productivo.

## Fase CMS Remoto 1.3 - Analytics Console UX - 2026-05-30

### Implementado

- Boton `Ocultar preview` en el CMS para esconder la maqueta movil y la validacion cuando el operador necesita concentrarse en datos.
- La seccion `Analytics` activa automaticamente una vista limpia a ancho completo, sin preview lateral.
- La analitica queda dividida por menu horizontal:
  - Dashboard.
  - Quick stats.
  - Paises.
  - Players.
  - Referidores.
  - Eventos app.
- Cada area usa tarjetas independientes para graficas, rankings, mapa agregado, atribucion y eventos anonimos recomendados.
- Esta consola sigue siendo interna de CMS/admin; no debe mostrarse al usuario final de la app.

### Pendiente

- Reemplazar la muestra local por datos reales del backend remoto de analytics.
- Agregar filtros por fecha, export CSV y comparativa por periodo cuando el endpoint remoto este activo.

## Fase CMS Remoto 1.4 - Mapa De Audiencia - 2026-05-31

### Implementado

- La pestana `Paises` del CMS Analytics ahora dibuja usuarios conectados por pais.
- Se agrego proveedor de mapa configurable:
  - `Mapa interno seguro`: funciona sin API key y sin depender de terceros.
  - `Google Maps API`: opcion para usar Google Maps en el dashboard del CMS.
- La Google Maps API key se guarda solo en `localStorage` del navegador del administrador.
- La API key no se exporta dentro de `wxm-cms.json` ni dentro del contrato publico que consume la app.
- Si Google Maps falla o no hay API key, el CMS vuelve automaticamente al mapa interno.

### Reglas de seguridad

- La key de Google Maps debe ser una browser key restringida por dominio HTTP referrer.
- No hardcodear la key en el repositorio.
- No publicar la key dentro del JSON publico de la app.

## Navegacion base

La app tiene cinco areas:

1. Inicio
   - Estado en vivo.
   - Programa actual.
   - Proximo programa.
   - Acciones rapidas.
   - Destacados editoriales.

2. En Vivo
   - Reproductor completo.
   - Metadata actual.
   - Caratula.
   - Historial musical.
   - Favorito de cancion.
   - Sleep timer.
   - Pedir cancion.

3. Programas
   - Parrilla semanal/local.
   - Fichas de programas.
   - Recordatorios locales.
   - Locutor/DJ.

4. Explorar
   - Noticias.
   - Entrevistas.
   - Eventos.
   - Podcasts/replays.
   - Banners editoriales.
   - Radios secundarias preparadas.
   - Encuestas de comunidad.
   - Sponsors/aliados.

5. Mi WXM
   - Canciones favoritas.
   - Programas favoritos.
   - Ajustes.
   - Audio inmersivo.
   - Contacto.
   - Politica de privacidad.

## Audio nativo y DSP

### Implementado

- Reproduccion Android con `RadioPlaybackService` en primer plano.
- Motor Android migrado a Media3/ExoPlayer `1.8.0`, con soporte base para streams progresivos, HLS y DASH.
- `DefaultHttpDataSource` con user-agent WXM, bloqueo de redirecciones cross-protocol y timeouts controlados.
- `DefaultLoadControl` calibrado para radio 24/7 con buffer estable.
- Recuperacion nativa inicial sobre ExoPlayer: hasta 5 reintentos con backoff progresivo ante errores de playback.
- Fallback multi-stream preparado:
  - `CONFIG.STREAM.FALLBACK_URLS` en frontend;
  - puente Android `playSources(JSON)`;
  - `RadioPlaybackService` valida URLs HTTPS, deduplica fuentes y cambia de primary a fallback al agotar reintentos.
- Estado nativo publica `streamRole`, `sourceIndex`, `sourceCount`, `hasFallback` y `retryAttempt`.
- Monitor nativo de red:
  - permiso `ACCESS_NETWORK_STATE`;
  - deteccion basica de WiFi, datos moviles, Ethernet, Bluetooth u offline;
  - estado publicado como `networkConnected` y `networkType`;
  - reintentos mas conservadores cuando Android reporta sin conexion.
- MediaSession con metadata publica para pantalla bloqueada.
- Notificacion persistente Android con accion play/pause.
- Caratula grande de lock screen desde metadata actual o arte oficial WXM.
- Audio Focus nativo para llamadas, otras apps de audio, perdida temporal/permanente de foco y ducking.
- Pausa automatica cuando Android reporta salida de audio desconectada (`ACTION_AUDIO_BECOMING_NOISY`).
- Bridge de estado nativo `getPlaybackStatus()` para que la UI no asuma reproduccion si el servicio todavia esta cargando, pausado o en error.
- Notificacion Android ajustada: accion principal compacta play/pause y accion de detener separada para evitar controles duplicados.
- WebView configurado como app shell: sin zoom manual, sin overview mode y con viewport fijo.

### Pendiente Audio NEXTGEN

- Agregar `AudioProcessor`/DSP real con perfiles WXM.
- Agregar menu `Mi WXM > Audio inmersivo`.
- Persistir perfil de audio en `wxm_audio_profile`.
- Exponer puente JS nativo `setAudioProfile`.
- Implementar perfiles: Estandar, WXM Cinema, WXM Club, WXM Live Stage, WXM Voice+, WXM Night Mode y Wide Stereo.
- Activar efectos Android si el dispositivo los soporta: Equalizer, BassBoost, Virtualizer y LoudnessEnhancer.
- Detectar salida de audio avanzada: cable, Bluetooth, USB, HDMI, BLE y audifonos compatibles.

### Limites reales

- Esto no es Dolby Atmos real. Atmos requiere mezcla multicanal/objetos, hardware compatible y licencia Dolby.
- El sistema genera surround virtual y mejora espacial desde mono/estereo, pero no crea informacion espacial verdadera que no exista en la fuente.
- La calidad final depende del stream, bitrate, audifonos, Bluetooth codec y audio stack del dispositivo.
- Para iOS se necesitara AVAudioEngine/Core Audio en fase separada.
- Para Android Auto/CarPlay se requiere certificacion y otra fase de producto.

## Estado por funciones clave

1. Home de radio real
   - Estado: implementado MVP.
   - Hecho: reproductor compacto, ahora en vivo, programa actual, proximo programa, ultimas canciones, destacados y banner visual WXM.
   - Falta: datos reales desde CMS y calendario editorial administrable.

2. Programacion
   - Estado: implementado MVP local.
   - Hecho: horarios, programas, locutor, descripcion, estado ahora/siguiente y fichas.
   - Falta: recordatorio con push real y administracion CMS.

3. Pantalla del programa
   - Estado: implementado MVP local.
   - Hecho: nombre, locutor, horario, genero, descripcion, compartir y playlist base.
   - Falta: episodios/replays reales, redes reales del locutor y ficha administrable.

4. Historial musical premium
   - Estado: implementado MVP, requiere endurecer persistencia semanal.
   - Hecho: cancion actual, ultimas canciones, historial por dia, buscar/abrir en plataformas, compartir y favoritos.
   - Falta: top semanal real, mas sonadas hoy, descubiertas en WXM y backend para retener historico entre semanas.

5. Favoritos
   - Estado: implementado local.
   - Hecho: canciones y programas favoritos en localStorage.
   - Falta: locutores favoritos, notificaciones personalizadas y sincronizacion con cuenta.

6. Notificaciones push
   - Estado: pendiente Fase 2.
   - Falta: Firebase Cloud Messaging o proveedor equivalente, permisos, segmentacion y panel CMS.

7. Controles nativos de audio
   - Estado: implementado Android base.
   - Hecho: segundo plano, lock screen, caratula, notificacion persistente, metadata, play/pause, Audio Focus, pausa por desconexion de salida, estado real hacia WebView, monitor de red, motor Media3/ExoPlayer, retry nativo inicial y fallback multi-stream preparado.
   - Falta: validacion exhaustiva Samsung/Pixel, Bluetooth fisico, Android Auto futuro, iOS Control Center, CMS real para administrar fallback streams y DSP real sobre pipeline Media3.

8. Modo coche
   - Estado: pendiente.
   - Falta: UI grande, landscape, tema oscuro automatico y controles simplificados.

9. Sleep timer
   - Estado: implementado local.
   - Hecho: apagado por tiempo y fade basico.
   - Falta: integracion con servicio nativo si la app queda cerrada.

10. Alarma despertador
   - Estado: pendiente.
   - Falta: AlarmManager/WorkManager Android, permisos exact alarm si aplica y volumen progresivo.

11. Modo bajo consumo/datos
   - Estado: pendiente parcial.
   - Falta: detectar red movil, reconexion inteligente, indicador de conexion y calidad alternativa si el stream la ofrece.

12. Contenido editorial
   - Estado: implementado mock/local.
   - Hecho: destacados, noticias/eventos base.
   - Falta: CMS real, articulos, entrevistas, lanzamientos y recomendaciones del equipo.

13. Podcasts / replays
   - Estado: pendiente.
   - Falta: estructura de episodios, player on-demand, derechos y descargas offline si procede.

14. Comunidad
   - Estado: prototipo local.
   - Hecho: pedir cancion/contacto.
   - Falta: mensajes a cabina, votaciones, encuestas, reacciones, chat moderado y dedicatorias reales.

15. Sistema de peticiones
   - Estado: prototipo local.
   - Hecho: formulario validado.
   - Falta: cola interna, moderacion, estados y panel de cabina.

16. Mapa de oyentes
   - Estado: pendiente.
   - Falta: datos agregados anonimos, mapa animado y ranking por pais/ciudad.

17. Identidad visual superior
   - Estado: en progreso avanzado.
   - Hecho: tema oscuro premium, cabina digital, movimiento sutil, estados visuales y marca WXM.
   - Falta: pulido continuo por dispositivo, animaciones de programa entrante y version clara opcional.

18. Onboarding
   - Estado: pendiente.
   - Falta: idioma, permiso de notificaciones, intereses y programas favoritos iniciales.

19. Cuenta de usuario
   - Estado: futuro.
   - Falta: Google/Apple login, perfil, sincronizacion y sorteos.

20. CMS para administrar la radio
   - Estado: CMC local y CMS UI local implementados con modulos editoriales/media; CMS remoto pendiente.
   - Hecho: JSON local administrable, panel local, vista previa movil, exportacion JSON, flags de funciones, programacion, destacados, banners, locutores, noticias, podcasts/replays, canales secundarios, encuestas, sponsors, modo emergencia, visual config, audio experience, stream principal, fallback streams preparados, API de metadata y parametros de reintento.
   - Falta: panel web en hosting, autenticacion de administradores, publicacion HTTPS automatica, contenido real desde base de datos, push, peticiones, mensajes moderados, stream config remota y modo emergencia operativo desde servidor.

21. Analytics
   - Estado: iniciado local.
   - Hecho: servicio web de telemetria anonima local, eventos `app_open`, `play_request`, `play_started`, `play_paused`, `buffering_started`, `playback_error`, `metadata_changed`, `favorite_added`, `article_viewed`, `podcast_viewed`, `poll_voted`, `request_song_submitted`, snapshot de audiencia y dimensiones `sourceClient`, `platform`, `appVersion`, `stationId`, `streamRole`, `player`, `referrer`.
   - Hecho: CMS local con dashboard visual de live listeners, peak audience, horas promedio, tiempo promedio, usuarios desde app, tendencia de horas, audiencia realtime, conexiones por pais, top paises, top players, referidores, quick stats y export JSON.
   - Falta: backend de ingesta, base de datos, agregaciones reales, geolocalizacion anonima, cruce con logs Icecast/Shoutcast, DAU real, retencion real, push opens, errores de stream consolidados y seguridad de dashboard en hosting.

## Analytics CMS / Operacion de audiencia

Las metricas de audiencia no deben depender solo del proveedor Icecast/Shoutcast. WXM necesita un dashboard propio dentro del CMS para cruzar datos del stream con eventos anonimos enviados por la app.

### Dashboard requerido

- Live listeners: oyentes/conexiones en vivo.
- Peak audience: pico de audiencia por periodo y hora exacta.
- Avg. hours a day: horas promedio escuchadas por dia.
- Avg. listening time: tiempo promedio de sesion.
- Total listening hours trends: tendencia por semana/mes.
- Total listening hours: horas acumuladas del periodo.
- Audience realtime: curva de audiencia cada 1, 5 o 10 minutos.
- Live connections map: mapa por pais/region/ciudad usando datos agregados.
- Top 5 countries audience.
- Top 5 players audience.
- Quick stats: listening hours, unique listeners, access count por ayer, semana, mes y periodo seleccionado.
- Countries: audiencia por pais con listening hours, distinct IPs, access y unique listeners.
- Players: audiencia por player/dispositivo, por ejemplo Android App, Web Browser, TuneIn, Alexa, iOS futuro, Android Auto futuro y otros.
- Referrers: origen de trafico, por ejemplo app WXM, web oficial, redes sociales, TuneIn, busqueda, directo, campañas y enlaces externos.
- Export CSV/JSON por rango de fechas.

### Metrica obligatoria propia de WXM

- `sourceClient`: distinguir si el usuario viene desde `wxm_android_app`, `wxm_web_app`, `cms_preview`, `external_player`, `tunein`, `alexa`, `unknown`.
- `appVersion`: version de app instalada.
- `platform`: android, web, ios futuro, desktop futuro.
- `sessionId`: identificador anonimo rotativo, no PII.
- `playbackSessionId`: sesion de reproduccion anonima.
- `streamRole`: primary, fallback, emergency o secondary station.
- `stationId`: main, urban, club, latino, chill u otro canal.

### Eventos minimos a recolectar

- `app_open`
- `play_request`
- `play_started`
- `play_paused`
- `play_stopped`
- `playback_error`
- `buffering_started`
- `buffering_ended`
- `stream_recovered`
- `fallback_activated`
- `metadata_changed`
- `favorite_added`
- `program_viewed`
- `article_viewed`
- `podcast_viewed`
- `request_song_submitted`
- `poll_voted`
- `notification_opened`

### Seguridad y privacidad analytics

- No guardar nombres, telefonos, emails ni mensajes personales dentro de analytics.
- IP solo debe usarse para geolocalizacion aproximada y almacenarse truncada o hasheada con rotacion.
- Usar consentimiento/aviso de privacidad si se recolectan eventos de comportamiento.
- Respetar retencion: eventos crudos por tiempo limitado, agregados por mas tiempo.
- Endpoint de ingesta con rate limit, CORS restringido, HTTPS obligatorio y token publico limitado por app.
- El dashboard de analytics debe estar detras de login, roles y auditoria.
- Separar analytics anonimo de peticiones de canciones, mensajes a cabina y formularios con datos personales.

### Arquitectura recomendada

- App/Web envia eventos anonimos a `/api/analytics/ingest`.
- Backend valida schema, version, origen, rate limit y tamano.
- Cola ligera o tabla append-only para eventos crudos.
- Job de agregacion produce tablas por minuto, hora, dia, pais, player, referrer y station.
- Dashboard CMS consume solo agregados, no eventos personales.
- Integracion opcional con logs del servidor Icecast/Shoutcast para comparar conexiones reales vs sesiones app.

### Estado

- Implementado: telemetria local anonima en la app, almacenamiento temporal en `localStorage`, flush preparado via `sendBeacon`/`fetch` hacia endpoint HTTPS, dashboard visual local en CMS, exportacion JSON de analytics y configuracion de endpoints.
- Pendiente: backend de ingesta, base de datos, agregaciones reales, geolocalizacion agregada, segmentacion verificada App/Web/players externos, dashboard remoto protegido y seguridad de administradores.

22. Monetizacion
   - Estado: implementado parcial local.
   - Hecho: sponsors y promociones administrables desde CMC con imagen segura y CTA HTTPS.
   - Falta: venta real, calendario de campanas, audio ads propios, aliados, eventos, membresia, merch y promociones geolocalizadas con cuidado legal.

23. Funciones de confianza
   - Estado: implementado parcial.
   - Hecho: privacidad base, contacto, redes, version y canales oficiales.
   - Falta: terminos completos, reporte de problema, estado publico del stream y creditos finales.

## Requisitos visuales

- Mobile first.
- Apariencia premium de radio real.
- Botones con iconos.
- Navegacion inferior persistente.
- Player compacto pero protagonista.
- Programacion y contenido en cards densas, no landing page.
- Sin textos explicativos de uso dentro de la UI.
- No desbordes horizontales.
- Debe verse bien en 360px a 430px de ancho.
- Historial y listas extensas deben abrir en bottom sheet o pantalla dedicada, no romper el reproductor.

## Seguridad

- No secretos en cliente ni APK.
- El endpoint Spotify remoto debe ser HTTPS.
- Caratulas con allowlist de dominios.
- Metadata renderizada con `textContent`.
- localStorage saneado.
- No `innerHTML` con datos externos.
- No `javascript:` ni `data:` para imagenes remotas.
- Android solo debe aceptar stream HTTPS desde el puente nativo.
- Las peticiones reales deben pasar por backend con validacion, rate limit y moderacion.

## Criterio de aceptacion

- La app abre en Android sin errores de WebView.
- La pantalla inicial ya no parece solo un reproductor.
- El usuario puede navegar entre Inicio, En Vivo, Programas, Explorar y Mi WXM.
- El audio se puede reproducir desde En Vivo.
- El audio sigue sonando en segundo plano y pantalla bloqueada.
- La pantalla bloqueada muestra WXM, metadata y caratula correcta.
- Cancion actual puede guardarse como favorita.
- Los perfiles de audio cambian desde Mi WXM sin reiniciar la app.
- La app se adapta a pantallas moviles sin overflow.
- La app no permite pinch zoom ni zoom tipo foto; la adaptacion debe venir del CSS responsive.
- Los assets Android se sincronizan desde `v2/`.

## Comandos utiles

- Sincronizar assets web a Android:
  - `./scripts/sync-android-assets.sh`

- Compilar APK debug:
  - `JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew assembleDebug`

- APK generada:
  - `android-webview/app/build/outputs/apk/debug/app-debug.apk`

## Proximas decisiones

- Prioridad inmediata: validar el APK `1.1.1` en emulador/dispositivo real con perfiles de audio.
- Despues: corregir cualquier issue de lock screen Samsung/Pixel y confirmar iconos limpios tras desinstalar version anterior.
- Siguiente fase recomendada: crear el panel CMS/CMC remoto minimo en hosting para editar `wxm-cmc.json` y publicar cambios por HTTPS.

## Hotfix APK WebView - 2026-05-21

Motivo:

- En la APK la interfaz aparecia, pero los botones no respondian.
- La causa critica era un error de arranque JavaScript: `ui-controller.js` intentaba usar `#visualizer`, pero el HTML NEXTGEN actual ya no lo incluye.
- Ese fallo detenia la inicializacion de listeners, por eso play, navegacion y ajustes quedaban muertos.

Cambios aplicados:

- `v2/assets/js/ui-controller.js`: el visualizador ahora es opcional y no bloquea el arranque.
- `v2/assets/js/ui-controller.js`: play/home/mini player actualizan iconos con null-safety.
- `v2/assets/js/ui-controller.js`: botones de Idioma, Estado del servicio, CMS/CMC y Motor NEXTGEN abren modales reales y seguros.
- `scripts/sync-android-assets.sh`: ejecutado para llevar el arreglo al WebView Android.
- APK recompilada en `android-webview/app/build/outputs/apk/debug/app-debug.apk`.

## Fase CMS Remoto 1.1 - Gate De Publicacion Y Contrato Dual - 2026-05-30

Objetivo:

- Cerrar la brecha entre el JSON que exporta el CMS local y el JSON que la app realmente consume.
- Preparar el salto a hosting sin publicar contratos invalidos que rompan secciones de la app.

Implementado:

- La app acepta dos formatos:
  - CMC bruto con `station`, `stream`, `content`, `features`, `visual`, `audioExperience` y `emergency`.
  - CMS app contract con `rails`, `homeRails` y `exploreRails`.
- `config.js` deriva contenido real desde `rails` cuando el JSON remoto no trae `content`.
- El contrato exportado por el panel ahora incluye tambien `station` y `content` para compatibilidad progresiva.
- El CMS local valida antes de descargar/copiar `wxm-cms.json`:
  - stream HTTPS,
  - metadata HTTPS,
  - imagenes seguras,
  - URLs seguras,
  - rails existentes,
  - items con titulo,
  - payload razonable,
  - advertencias por falta de fallback o analytics remoto.
- `CMS_REMOTE_CONTRACT.md` queda actualizado y sin duplicados.

Pendiente para produccion:

- Hosting HTTPS real.
- Login y roles de administrador.
- Publicacion atomica del JSON.
- Subida/gestion de imagenes.
- Fallback stream real.
- Backend de analytics real.

Criterio nuevo:

- Ningun elemento opcional del DOM puede romper la inicializacion global de la app.
- Antes de compilar, ejecutar `node --check` sobre scripts tocados y verificar al menos play + un modal en navegador local.

## Fase CMS Remoto 1.5 - Media Picker Local - 2026-05-31

Objetivo:

- El CMS no debe depender solo de pegar rutas de imagen a mano.
- Cada funcion con imagen debe permitir cargar archivo local desde el ordenador, ver preview y conocer el tamano recomendado.
- El flujo de borrador puede usar imagen embebida; produccion debe preferir `assets/img/...` o URL HTTPS/CDN.

Implementado:

- Campos multimedia con:
  - URL manual `assets/img/...` o `https://...`.
  - Browser de archivo local PNG/JPG/WEBP.
  - Preview inmediato.
  - Boton limpiar.
  - Hint de dimensiones recomendadas.
- Recomendaciones actuales:
  - Logo app: 1024x1024 PNG/WEBP.
  - Hero/portada: 1920x1080 o 1600x900 WEBP/JPG.
  - Banner editorial/sponsor: 1600x900 WEBP/JPG.
  - Programa/noticia: 1200x675 WEBP/JPG.
  - Locutor/DJ/canal/podcast: 1080x1080 o 1024x1024.
- El CMS redimensiona y comprime imagenes locales en el navegador antes de guardarlas como borrador.
- El gate permite imagenes locales embebidas, pero muestra advertencia porque aumentan el JSON.

Regla de produccion:

- Para el JSON remoto final, las imagenes deben subirse a hosting/CDN HTTPS y quedar como URL o ruta `assets/img/...`.
- No se deben usar imagenes embebidas en un `wxm-cms.json` publico pesado salvo emergencia o prueba temporal.

## Fase CMS Remoto 1.6 - Asset Pipeline De Produccion - 2026-05-31

Objetivo:

- Convertir imagenes locales embebidas en assets publicos del CMS antes de publicar el JSON de la app.
- Mantener el panel usable sin hosting, pero preparar el flujo real para servidor HTTPS.

Implementado:

- Panel CMS:
  - Campo `Endpoint upload assets`.
  - Boton `Subir imagenes locales`.
  - Boton `Descargar paquete media`.
  - Estado de cuantas imagenes base64 quedan pendientes y cuanto pesan.
- Remote starter:
  - `POST /api/assets/upload` protegido por cookie de sesion.
  - `GET /api/assets/list` para inventario basico.
  - Guardado atomico en `public/uploads/YYYY/MM/`.
  - Validacion de PNG/JPG/WEBP por MIME, firma binaria y tamano.
  - URL publica generada con `WXM_CMS_PUBLIC_BASE_URL`.

Regla de publicacion:

- Antes de publicar a produccion, usar `Subir imagenes locales` y confirmar que el contrato queda con URLs HTTPS.
- Si no hay hosting, usar `Descargar paquete media` como puente temporal para migrar imagenes manualmente.
- El starter remoto debe correr detras de HTTPS, con `WXM_CMS_PUBLIC_BASE_URL` configurado y origenes CORS restringidos.

## Fase CMS Remoto 1.7 - Sistema / Configuracion Centralizada - 2026-05-31

Objetivo:

- Toda configuracion operativa debe vivir en un unico submenu `Sistema / Config`.
- El operador no debe buscar endpoints, stream, assets, emergencia o publicacion en pantallas separadas.
- Cada ajuste debe tener manual tipo FAQ con definicion, proposito, resultado esperado y pasos de configuracion.

Implementado:

- Se removieron `Stream` y `Exportar` del menu principal del CMS para evitar configuracion dispersa.
- `Sistema / Config` ahora contiene pestanas internas:
  - Stream.
  - Analytics.
  - Emergencia.
  - Visual y audio.
  - Assets.
  - Publicacion.
  - Manual / FAQ.
- El panel Analytics conserva solo lectura operativa y exportacion; sus endpoints se configuran desde `Sistema / Config > Analytics`.
- La publicacion del JSON, el endpoint CMS y el endpoint de assets viven en `Sistema / Config`.
- El manual FAQ documenta:
  - Stream principal HTTPS.
  - API de metadata.
  - Fallback streams.
  - Reconexion y reintentos.
  - Analytics endpoints.
  - Google Maps API.
  - Endpoint CMS futuro.
  - Endpoint upload assets.
  - Modo emergencia.
  - Visual y audio.

Regla operativa:

- Ningun endpoint, URL de stream, API key, configuracion de publicacion, configuracion visual global o configuracion de emergencia debe quedar fuera de `Sistema / Config`.
- Las claves sensibles del operador, como Google Maps API key local, no se exportan al contrato publico de la app.

## Fase CMS Remoto 1.8 - Organizacion Profesional Del Control Center - 2026-06-01

Objetivo:

- El CMS debe sentirse como una consola de operacion profesional, no como una lista plana de botones.
- La navegacion debe agrupar tareas por responsabilidad: mando, emisora, contenido, crecimiento y tecnico.
- El dashboard debe guiar al operador hacia acciones reales y frecuentes.

Implementado:

- Sidebar agrupado en:
  - Centro de mando: Dashboard y Analytics.
  - Emisora: Identidad, Programacion, Locutores y Canales.
  - Contenido: Banners, Destacados y Noticias/Replays.
  - Crecimiento: Funciones app, Interaccion y Sponsors.
  - Tecnico: Sistema / Config.
- Dashboard con accesos por flujo:
  - Publicacion.
  - Operacion tecnica.
  - Contenido editorial.
  - Parrilla y talento.
  - Analytics operativo.
  - Comunidad y negocio.
- Se mantiene `Sistema / Config` como unica zona para endpoints, stream, assets, publicacion, emergencia y manual FAQ.

Regla UX:

- El menu principal debe responder a la pregunta "que trabajo quiero hacer" antes que a la estructura interna del JSON.
- Las configuraciones tecnicas no deben mezclarse con tareas editoriales.

## Fase CMS Remoto 1.9 - Configuracion Simplificada Por Capas - 2026-06-01

Objetivo:

- Mantener el poder tecnico del CMS sin obligar al operador diario a ver configuraciones de ingenieria.
- Evitar que `Sistema / Config` se sienta complejo cuando solo se necesita operar la emisora.
- Aplicar divulgacion progresiva: primero operacion, luego app, publicacion y finalmente avanzado.

Implementado:

- `Sistema / Config` se simplifica en 4 pestanas:
  - Operacion: stream principal, metadata, reintentos, fallbacks y modo emergencia.
  - App: tema, color, hero, perfil de audio recomendado y modo bajo consumo.
  - Publicacion: contrato `wxm-cms.json`, endpoint publico futuro y gate de publicacion.
  - Avanzado: analytics remoto, Google Maps, assets de produccion, CMC bruto y manual FAQ.
- Los accesos antiguos a Stream, Analytics, Emergencia, Visual, Assets y FAQ se redirigen internamente a la nueva capa correspondiente para no romper botones existentes.
- El CMC bruto queda fuera del flujo normal de publicacion y se considera herramienta interna.
- Analytics, Google Maps API key y endpoint de assets quedan agrupados como configuraciones avanzadas.
- Se agregan ayudas contextuales dentro de Operacion y App para explicar resultado esperado sin mandar al operador a una FAQ larga.

Regla UX:

- No se deben eliminar capacidades tecnicas; se deben esconder o agrupar cuando no pertenecen a la operacion diaria.
- El operador normal debe poder publicar, cambiar stream, activar emergencia y ajustar apariencia sin entrar en configuraciones de backend.
- Todo lo que requiera hosting, API keys, upload privado, JSON bruto o diagnostico debe vivir en `Avanzado`.

## Fase CMS Remoto 2.0 - Modo Operador Seguro - 2026-06-02

Objetivo:

- Que el CMS abra en modo operativo simple por defecto.
- Reducir riesgo de tocar configuraciones tecnicas por accidente.
- Dar una lectura inmediata del estado de publicacion sin obligar a revisar toda la validacion lateral.

Implementado:

- `Avanzado` queda oculto por defecto dentro de `Sistema / Config`.
- Boton `Mostrar avanzado` permite revelar u ocultar herramientas tecnicas; el estado se guarda localmente.
- Los saltos tecnicos hacia `advanced` lo muestran automaticamente para no romper flujos internos.
- `Avanzado` incluye salida explicita `Salir de avanzado` para regresar a `Operacion` sin exponer al operador al area tecnica.
- El layout de `Sistema / Config` debe impedir que paneles internos se solapen con el preview lateral; todo hub/pestana interna debe usar `min-width: 0` dentro del grid.
- Dashboard agrega tarjeta `Publicacion` con estado:
  - Listo para publicar.
  - Publicable con advertencias.
  - Publicacion bloqueada.
- La tarjeta de publicacion reutiliza el mismo gate de validacion del contrato `wxm-cms.json`.
- `Recargar CMC` pide confirmacion si existe un borrador local para evitar perdida accidental de trabajo.

Regla UX:

- El CMS debe abrir limpio para operacion diaria.
- Las acciones destructivas o que descartan borrador deben pedir confirmacion.
- El estado de publicacion debe ser visible en Dashboard, no solo en el area tecnica.

## Fase CMS Analytics 2.1 - Dashboard Analitico Profesional - 2026-06-02

Objetivo:

- Acercar la analitica local al modelo profesional de dashboard, quick stats, countries, players y referrers.
- Evitar que todas las metricas vivan dentro de una sola tarjeta grande.
- Preparar el contrato de datos para recolectar audiencia real desde la app, web, players externos y futuras integraciones.

Implementado:

- Barra horizontal de Analytics con rango visible de periodo.
- Dashboard con KPIs, tendencias, audiencia realtime, mapa agregado, top 5 paises y top 5 players.
- Dashboard debe incluir tarjeta `Live Connections` con mapa en vivo y lista de conexiones recientes; no debe quedar solo en la pestana `Paises`.
- El mapa oficial del CMS debe ser `WxmWorldAtlasMap.jsx`: World Atlas real con React, D3.js y TopoJSON/GeoJSON, paises reales, fronteras internas visibles, islas principales, zoom/pan, hover por pais, tooltip, selected country con glow blanco y active country con glow magenta WXM.
- El estilo del mapa debe ser dark luxury/global broadcast: fondo #050505, paises inactivos #1A1A1A, paises activos #FF007A/#FF2D95, bordes con glow rosa suave y textura atlas/satelite oscura. No usar mapa cartoon, mapa plano generico ni paletas azul/verde.
- El mapa debe dibujar rutas curvas animadas desde Republica Dominicana hacia Madrid, Barcelona, New York, Miami, Mexico City, Bogota y Dubai, con pulso/dash magenta y nodo central fuerte en Republica Dominicana.
- El fallback SVG interno solo queda como respaldo si React/D3/TopoJSON no cargan; no debe ser el mapa principal de produccion.
- El atlas debe tener controles visibles de zoom in, zoom out y reset/centrar; depender solo de gesto de mouse/touch no es suficiente para CMS.
- El tooltip por pais debe mostrar datos operativos: conexiones agregadas, live, access, usuarios unicos, listening hours y estado del pais.
- Los estados vacios de Analytics deben mostrarse como empty states explicitos, nunca como tarjetas en blanco ni donas con cero artificial.
- La exportacion de Analytics debe descargar JSON completo y CSV operativo para analisis rapido en Excel/Sheets.
- Quick stats con graficas separadas para listening hours, unique listeners y access count.
- Paises con mapa/lista de conexiones y tabla detallada por country, listening hours, access, unique listeners y distinct IPs.
- Players con ranking, grafica y tabla detallada para diferenciar WXM Android App, web y reproductores externos.
- Referidores con ranking, grafica y tabla para separar audiencia proveniente de la app WXM, directo y dominio web.
- Eventos app como contrato operativo para playback, buffering, errores, fallbacks y session_end.
- Datos mock locales en `v2/assets/data/wxm-cmc.json` actualizados para que el CMS no dependa solo de defaults internos.

Regla UX:

- Analytics debe ser una consola de lectura, no una zona de configuracion.
- Cada familia de metricas debe vivir en su propia pestana horizontal.
- Configurar endpoints, Google Maps, assets y claves debe seguir viviendo en `Sistema / Config > Avanzado`.
- La analitica local puede usar datos mock, pero debe conservar la misma estructura que usara el backend remoto.

Pendiente para backend real:

- Endpoint HTTPS para ingest de eventos anonimos.
- Agregacion server-side por pais, player, referidor y periodo.
- Export real CSV/PDF.
- Geolocalizacion agregada sin IP visible para operadores.

## Fase CMS Analytics 2.4 - Adaptador Remoto Seguro - 2026-06-08

Objetivo:

- Conectar el dashboard local del CMS a un endpoint remoto real sin romper el fallback local.
- Permitir que el starter de hosting entregue metricas agregadas listas para `Dashboard`, `Quick stats`, `Paises`, `Players` y `Referidores`.
- Evitar metricas falsas: si la app todavia no envia duracion de escucha, las horas permanecen en 0 hasta que exista evento real de sesion/duracion.

Implementado:

- `analytics.dashboardEndpoint` puede apuntar a un endpoint admin HTTPS. En desarrollo tambien acepta `http://localhost` y `http://127.0.0.1` solo dentro del CMS.
- La app exportada nunca recibe endpoints admin locales; el contrato publico mantiene HTTPS obligatorio.
- Boton `Actualizar remoto` en Analytics para cargar el resumen remoto bajo demanda.
- Fetch remoto con `credentials: include`, timeout, `no-store`, manejo de HTTP error/timeout y fallback a muestra local.
- El starter remoto `GET /api/analytics/summary` ahora devuelve:
  - `analytics` completo compatible con el CMS.
  - `countries`, `players`, `referrers`, `liveConnections`, `quickSeries`, `quickStats` y KPIs.
  - `appUsers` para distinguir usuarios provenientes de `wxm_android_app`.
  - conexiones vivas calculadas con ventana reciente de 5 minutos.
- `POST /api/analytics/ingest` agrega campos seguros: pais, ciudad, player, sourceClient, referrer, networkScore, durationSeconds y anonId pseudonimo.
- El backend no guarda IP cruda en eventos; usa un identificador hash pseudonimo para conteos agregados.

Regla de seguridad:

- El dashboard remoto debe estar detras de login/cookie `HttpOnly`.
- El CMS puede consultar endpoints admin; la app publica solo debe consumir el JSON `wxm-cms.json` y endpoints HTTPS publicos aprobados.
- No enviar nombres, telefonos, emails, mensajes personales ni IP cruda a analytics.
- Para horas reales de escucha, la app debe enviar `durationSeconds` o eventos `session_end`; mientras eso falte, el dashboard no debe inventar listening hours.

Pendiente:

- Persistencia con base de datos real para produccion.
- Geolocalizacion agregada server-side por IP sin exponer IP al operador.
- Retencion, DAU/MAU y sesiones reales por usuario anonimo.
- Export backend CSV/PDF firmado.
- Roles/auditoria de administradores.

## Fase CMS Analytics 2.5 - Admin Remoto Y Caribe Operativo - 2026-06-09

Objetivo:

- Cerrar dos brechas antes de seguir creciendo el CMS: acceso remoto usable y visibilidad real del Caribe dentro del mapa mundial.

Implementado:

- `cms-remote-starter/public/admin/index.html` deja de ser landing minima y pasa a ser una consola admin privada con:
  - login contra `/api/auth/login`;
  - cookie HttpOnly gestionada por el servidor;
  - estado de sesion con `/api/auth/status`;
  - logout;
  - carga protegida de `/api/cms/current`;
  - carga protegida de `/api/analytics/summary`;
  - KPIs basicos, top paises/players y preview segura del contrato CMS.
- `WxmWorldAtlasMap` mantiene TopoJSON real para paises y fronteras, pero agrega una capa Caribe dedicada:
  - Antillas Mayores;
  - Antillas Menores;
  - costa continental caribena;
  - territorios marcados como nodos operativos sin inventar fronteras;
  - boton de zoom `Caribe`;
  - tooltip por isla/pais/territorio;
  - resumen `Caribe WXM` responsive.
- Se agregan codigos de pais caribenos al resolver de analytics para que datos reales por pais puedan activar el atlas.

Reglas:

- El TopoJSON mundial a escala 110m no debe considerarse suficiente para analizar islas pequenas. Para el Caribe se usa overlay de nodos agregados.
- No inventar datos personales ni geolocalizacion exacta. El mapa debe operar con metricas agregadas por pais/territorio/region.
- El panel admin remoto starter no sustituye un CMS enterprise final: faltan roles, auditoria completa, editor visual remoto y base de datos transaccional.

Pendiente recomendado:

- Conectar el admin remoto a un editor CMS real con roles.
- Persistir analytics en base de datos gestionada en hosting.
- Agregar export CSV/JSON protegido desde el admin remoto.
- Si el operador requiere precision cartografica de territorios pequenos, usar dataset GeoJSON caribeno de mayor resolucion solo para esa subregion.

## Fase CMS Analytics 2.6 - World Atlas Polish 1.0 - 2026-06-16

Objetivo:

- Pulir el World Atlas antes de seguir ampliando fases para que el mapa sea mas legible, menos ruidoso y mas cercano a un dashboard premium de radio global.

Implementado:

- `v2/cms/assets/react/WxmWorldAtlasMap.jsx` y su runtime activo `WxmWorldAtlasMap.runtime.js` agregan:
  - modo explicito `Caribe`/`Mundo`;
  - tooltips posicionados dentro del contenedor para evitar desbordes;
  - panel lateral operativo con seleccionado, `Live connections`, top paises y resumen Caribe;
  - rótulos reducidos en vista mundial y mas visibles al enfocar Caribe;
  - panel responsive que se compacta en pantallas moviles;
  - soporte visual para usuarios con `prefers-reduced-motion`.
- `v2/cms/assets/css/cms.css` reduce el ruido del grid/fondo, elimina visualmente el inset Caribe antiguo y estiliza el nuevo panel lateral.

Reglas:

- La ruta activa del CMS local es `v2/cms/index.html` con assets en `v2/cms/assets/`.
- La copia `v2/cms/cms/` queda como legado/backup de continuidad; no debe editarse como fuente principal.
- El dataset `countries-110m.json` sirve para paises grandes y fronteras generales, pero no para precision fina de islas pequenas. Para Caribe se mantiene overlay operativo agregado.
- No usar Google Maps como mapa principal del Atlas WXM; si se usa en el futuro, debe ser opcional para geocoding o vistas administrativas auxiliares.

Pendiente recomendado:

- Migrar a un dataset 50m/10m o GeoJSON dedicado del Caribe cuando haya red/dependencias aprobadas.
- Crear smoke visual automatizado para desktop y mobile del Atlas.
- Archivar o eliminar formalmente `v2/cms/cms/` cuando el equipo confirme que ya no se necesita como respaldo.

## Fase CMS Analytics 2.6.1 - World Atlas Caribe Inspection - 2026-06-17

Objetivo:

- Corregir el problema visual reportado en el mapa donde las rutas animadas, el panel flotante y los elementos en movimiento tapaban los paises del Caribe y dificultaban leer nombres, ciudades y pueblos al acercar el zoom.

Implementado:

- `v2/cms/assets/react/WxmWorldAtlasMap.jsx` y `v2/cms/assets/react/WxmWorldAtlasMap.runtime.js` agregan una capa `CARIBBEAN_PLACES` con ciudades principales:
  - Santo Domingo, Santiago, Punta Cana;
  - San Juan, La Habana, Kingston, Puerto Principe;
  - Nassau, Bridgetown, Port of Spain, Willemstad, Oranjestad, Castries;
  - Cartagena, Panama City y Caracas.
- El zoom maximo sube de `7x` a `9x`.
- El enfoque Caribe usa mayor escala para que Antillas Mayores, Antillas Menores y costa Caribe sean mas legibles.
- El Atlas ahora agrega clase `is-compact-atlas` segun ancho real del componente, no solo segun ancho de viewport.
- `v2/cms/assets/css/cms.css` convierte el modo Caribe en modo inspeccion:
  - oculta rutas animadas;
  - oculta pulsos viajeros;
  - oculta el panel lateral interno que tapaba islas;
  - mantiene leyenda reducida;
  - muestra etiquetas de ciudades principales.

Validacion:

- En el CMS local, el Atlas visible muestra `sidePanelDisplay: none`, rutas `display: none`, `visibleRouteCount: 0`, 11 etiquetas de nodos Caribe y 16 etiquetas de ciudades principales en modo Caribe.

Regla:

- Las rutas de transmision pertenecen al modo `Mundo`. El modo `Caribe` debe priorizar lectura geografica, islas, paises/territorios y ciudades agregadas.

## Fase CMS Analytics 2.6.2 - World Atlas Caribe Visual Cleanup - 2026-06-18

Objetivo:

- Corregir el exceso visual detectado en modo Caribe: mapas de paises poco legibles, etiquetas montadas, puntos blancos demasiado grandes y apariencia poco profesional.

Implementado:

- `v2/cms/assets/react/WxmWorldAtlasMap.jsx` y runtime:
  - reducen el radio de marcadores en modo Caribe para que el zoom no convierta los puntos en circulos gigantes;
  - reducen aun mas los marcadores en zoom Caribe: seleccionados, paises principales, activos e inactivos usan radios separados para no tapar islas;
  - dejan de renderizar el origen global de transmision cuando `atlasMode === "caribbean"`;
  - dejan de renderizar rutas y pulsos animados cuando `atlasMode === "caribbean"`; las transmisiones animadas pertenecen al modo `Mundo`;
  - agregan offsets por pais/isla para separar Cuba, Jamaica, Haiti, Rep. Dominicana, Puerto Rico, Bahamas y costas Caribe;
  - priorizan etiquetas de pais/isla: Cuba, Jamaica, Haiti, Rep. Dominicana, Puerto Rico, Bahamas, Panama, Colombia y Venezuela;
  - convierten ciudades en puntos discretos por defecto y solo muestran etiquetas de ciudades clave en zoom profundo para evitar saturacion visual.
- `v2/cms/assets/css/cms.css`:
  - elimina el look dominante de puntos blancos;
  - usa nodos magenta/dark graphite mas sutiles;
  - baja el tamano de etiquetas en modo Caribe y en modo compacto;
  - reduce la intensidad de paises activos para conservar bordes/silueta geografica;
  - mantiene una defensa CSS que oculta completamente el halo/origen global en modo Caribe si alguna version antigua llegara a renderizarlo.

Regla:

- En modo Caribe el mapa debe verse primero como atlas geografico y segundo como analytics. Los efectos neon deben apoyar la lectura, no tapar islas, paises, ciudades o costas.
- El halo de transmision desde Republica Dominicana solo pertenece al modo `Mundo`; en modo `Caribe` no debe renderizarse.
- Las rutas animadas de transmision solo pertenecen al modo `Mundo`; en modo `Caribe` no deben renderizarse para preservar fronteras, islas y etiquetas.
- Las etiquetas de ciudades del Caribe no deben mostrarse todas por defecto; se activan en zoom profundo o como tooltip/seleccion para mantener lectura profesional.

## Fase CMS Quality 2.6.3 - Semantica De Interfaz - 2026-08-19

Objetivo:

- Elevar la interfaz del CMS de "visual funcional" a "panel profesional operable", con semantica clara para navegacion, tabs, formularios dinamicos y validaciones futuras.

Implementado:

- Los campos dinamicos de imagen generados por `imageField()` ahora tienen IDs unicos, `aria-labelledby`, `aria-describedby`, `autocomplete="off"` y selector de archivo con `aria-label`.
- Los botones `Limpiar` de imagen anuncian a que imagen pertenecen.
- El menu lateral del CMS declara estado real con `aria-current`, `aria-expanded` y `aria-controls`.
- Las secciones principales del CMS tienen ID estable, `aria-labelledby`, `aria-hidden` y `hidden` cuando no estan activas.
- Las pestañas de Analytics y Sistema quedan conectadas con `aria-controls`, paneles `role="tabpanel"`, `aria-labelledby`, `aria-hidden` y `hidden`.
- El sidebar y el preview movil del CMS tienen `aria-label` para diferenciar landmarks.
- Se sincronizaron los cambios en la ruta principal `v2/cms/` y en la copia servida por `/cms/` mientras esa copia siga existiendo.

Validacion:

- Auditoria DOM local en `http://localhost:8126/cms/index.html`: 13 navegaciones, 13 paneles, 10 tabs y 10 tabpanels sin issues.
- Resultado: `0` inputs visibles sin etiqueta, `0` botones visibles sin nombre, `0` paneles con estado oculto inconsistente y `0` overflow horizontal.
- `node --check` OK para ambos `cms.js`.
- `scripts/smoke-check.sh` OK.

Regla:

- Antes de abrir nuevas fases visuales del CMS, la interfaz debe conservar semantica navegable: ningun input sin etiqueta, ningun boton sin nombre, tabs con `aria-controls`, paneles ocultos con `hidden/aria-hidden` y sin overflow horizontal.

## Fase CMS Analytics 2.6.4 - World Atlas Clean Labels - 2026-08-19

Objetivo:

- Corregir la regresion visual del World Atlas donde nombres de paises, ciudades y rutas volvian a renderizarse de forma permanente sobre el mapa, saturando Caribe y rutas globales.

Implementado:

- `v2/cms/assets/react/WxmWorldAtlasMap.jsx` y runtime:
  - eliminan etiquetas fijas de destinos globales como Miami, New York, Mexico City, Barcelona y Dubai;
  - mantienen los destinos como marcadores discretos sin texto permanente;
  - eliminan el texto fijo `REPUBLICA DOMINICANA` del origen global para que el mapa no arranque contaminado visualmente;
  - en modo Caribe, las islas/paises solo muestran nombre cuando estan seleccionados;
  - las ciudades/localidades del Caribe quedan como puntos discretos sin nombre fijo para evitar montajes sobre Republica Dominicana, Haiti, Puerto Rico, Cuba y Antillas Menores.
- Se sincroniza la ruta principal `v2/cms/` y la copia `v2/cms/cms/` para evitar diferencias al servir `/cms/`.

Regla:

- El mapa debe cargar limpio. Los nombres geograficos pertenecen a tooltip, clic/seleccion, panel lateral o hoja de detalle, no a texto permanente encima del SVG.
- La expansion a ciudades, pueblos y localidades debe ser por capas progresivas: pais -> region/provincia -> ciudad -> localidad.
- Las capas de ciudad/localidad deben ser agregadas y privadas: no mostrar ubicacion exacta ni datos con muestra pequena.
- La prioridad visual del Atlas es lectura geografica y decision operativa; los efectos neon y marcadores no deben tapar paises ni islas.

## Fase CMS Analytics 2.6.5 - World Atlas Layout Cleanup - 2026-08-19

Objetivo:

- Corregir la capa operativa interna del World Atlas que duplicaba `Live connections`, `Top paises` y contexto de seleccion encima del SVG, tapando controles de zoom y reduciendo la lectura del Caribe.

Implementado:

- Se elimina el panel interno `wxm-atlas-side-panel` del componente React y de su runtime en `v2/cms/` y `v2/cms/cms/`.
- Se agrega defensa CSS para ocultar cualquier panel interno residual si el navegador conserva runtime viejo en cache.
- Los controles de zoom quedan con `z-index` superior y `pointer-events` activo para que sean clicables.
- En modo mundial se reducen los puntos del Caribe, el halo de origen dominicano, el pulso de rutas y la opacidad de rutas/paises activos.
- El `cache-buster` del CMS cambia a `20260819-atlas-layout-clean` para forzar carga de CSS/runtime nuevo.

Regla:

- El mapa debe ser navegacion y lectura geografica. Los datos operativos viven en paneles externos del dashboard o en tooltips/seleccion, nunca como panel fijo encima del mapa.
- El modo `Mundo` puede tener rutas animadas discretas; el modo `Caribe` debe priorizar siluetas, fronteras e islas pequenas.
- Ninguna tarjeta interna del Atlas debe tapar controles de zoom, boton `Caribe`, boton `Mundo`, paises pequenos o zonas de inspeccion.

## Fase CMS Analytics 2.6.6 - World Atlas Zoom-Safe Markers - 2026-08-19

Objetivo:

- Corregir la regresion donde el halo/punto magenta del origen y los marcadores de rutas crecian con el zoom y tapaban Republica Dominicana, Haiti, Puerto Rico y Antillas.

Implementado:

- Los marcadores operativos del Atlas usan radio compensado por `zoomScale`, por lo que mantienen tamano visual estable al acercar el mapa.
- El halo grande de origen se oculta automaticamente cuando el mapa esta en modo inspeccion/zoom.
- Los pulsos de rutas y marcadores de destino reducen radio y glow en zoom para no cubrir paises pequenos.
- Se agrega clase `is-zoomed-atlas` para CSS de inspeccion: menos glow, rutas mas discretas y nodos activos mas contenidos.
- El `cache-buster` del CMS cambia a `20260819-atlas-zoom-safe`.

Regla:

- Ningun marcador SVG dentro de la capa con zoom puede crecer proporcionalmente con el zoom si puede tapar geografia. Todo punto operativo debe ser screen-space o compensado por escala.
- En Caribe, la lectura de siluetas, fronteras e islas tiene prioridad sobre efectos neon, halos, pulsos y decoracion de transmision.

## Git Baseline Y Flujo Post-Git - 2026-06-10

Objetivo:

- Convertir `Reprov2_NEXTGEN` en la fuente oficial versionada sin perder la posibilidad de volver a un baseline estable.
- Evitar que APKs, builds, caches, credenciales o datos locales entren al repositorio.
- Preparar una disciplina de trabajo por ramas antes de seguir con mas fases.

Implementado:

- Repositorio remoto oficial: `angeltheks/WXM-ENTERPRISE-SUITE`.
- `main` queda como baseline estable inicial con commit `86fdee0`.
- Tag de recuperacion: `v0.1.0-baseline`.
- Rama de trabajo: `dev`.
- Documentacion raiz agregada:
  - `README.md`
  - `RELEASE_CHECKLIST.md`
- CI agregado en `.github/workflows/ci.yml` con:
  - validacion de archivos prohibidos trackeados;
  - guardia basica contra secretos comunes;
  - revision de sintaxis JavaScript critica;
  - build Android debug con Gradle.

Reglas:

- Trabajar en `/Users/mac/AndroidProjects/Reprov2_NEXTGEN` como proyecto activo.
- Mantener `/Users/mac/AndroidProjects/Reprov2` como proyecto original historico, salvo decision explicita.
- Los APKs no se suben al repo como archivos trackeados; deben publicarse por releases o artefactos de CI.
- No trackear `build/`, `.gradle/`, `.idea/`, `node_modules/`, `.env`, `local.properties`, uploads locales ni bases de datos runtime.
- `main` debe recibir cambios solo cuando `dev` compile y pase checklist.
- El CMS local y el CMS Remote Admin son parte del suite; la app Android, el frontend WebView y el CMS deben avanzar coordinados.

Pendiente recomendado:

- Abrir PR de `dev` hacia `main` cuando el CI remoto pase.
- Agregar release workflow firmado cuando exista keystore de produccion.
- Definir issues/milestones por fase para CMS remoto completo, analytics persistente y migracion futura a Jetpack Compose.
- Depurar en una fase futura las copias legacy como `v2/cms/cms/`, sin hacerlo mientras sirvan como respaldo de continuidad.

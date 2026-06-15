# NEXTGEN Migration Report - WXM ONE RADIO

## Fecha

2026-05-15

## Proyecto original protegido

- `/Users/mac/AndroidProjects/Reprov2`

## Proyecto de trabajo NEXTGEN

- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN`

## Estado de proteccion

- Se verifico que el proyecto original existe.
- Se creo una copia completa en `Reprov2_NEXTGEN`.
- Los cambios de esta migracion se hicieron solo dentro de la copia.
- No se modifico `/Users/mac/AndroidProjects/Reprov2`.

## Estado de compilacion

Compilacion NEXTGEN completada correctamente.

- Comando:
  - `JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew assembleDebug`
- Directorio:
  - `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview`
- Resultado:
  - `BUILD SUCCESSFUL`
- APK generado:
  - `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/build/outputs/apk/debug/app-debug.apk`
- Version APK:
  - `versionCode='7'`
  - `versionName='1.1.1'`

Notas:

- Gradle muestra warnings de Java source/target 8 deprecado y APIs deprecadas existentes. No bloquean la APK.
- La limpieza Gradle/Java queda para una fase futura de mantenimiento.

## Archivos creados

- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/MCP.md`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/NEXTGEN_MIGRATION_REPORT.md`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/STREAMING_ENGINE_ARCHITECTURE.md`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/AUDIO_ENGINE_V2.md`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/TESTING_CHECKLIST.md`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/audiofocus/WxmAudioFocusManager.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/bridge/WxmBridgeStatusStore.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/buffer/WxmBufferEngine.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/buffer/WxmBufferProfile.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/config/WxmRemoteConfigManager.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/engine/WxmFallbackManager.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/engine/WxmRetryPolicy.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/engine/WxmStreamEngine.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/engine/WxmStreamHealth.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/engine/WxmStreamSource.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/network/WxmDataSourceFactory.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/network/WxmNetworkConfig.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/network/WxmNetworkMonitor.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/network/WxmNetworkScore.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/routes/WxmAudioRouteManager.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/spatial/WxmSpatialCapabilities.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/telemetry/WxmPlaybackTelemetry.java`

## Archivos modificados

- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/MCP.md`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/v2/index.html`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/v2/assets/css/main.css`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/v2/assets/js/audio-engine.js`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/v2/assets/js/ui-controller.js`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/assets/public/index.html`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/assets/public/assets/css/main.css`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/assets/public/assets/js/audio-engine.js`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/assets/public/assets/js/ui-controller.js`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/AndroidAudioBridge.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/RadioPlaybackService.java`

## Arquitectura agregada

Se agrego la primera base real de arquitectura NEXTGEN:

- `WxmStreamEngine`: coordinador inicial de stream activo, health, retry, fallback y telemetria.
- `WxmFallbackManager`: lista de fuentes, prioridad, fallback y recuperacion al principal.
- `WxmRetryPolicy`: exponential backoff, jitter, maximos por fuente y filtro basico de errores no recuperables.
- `WxmBufferEngine`: perfiles de `DefaultLoadControl` para radio 24/7 segun red.
- `WxmNetworkMonitor`: scoring inicial de red usando `ConnectivityManager` y `NetworkCapabilities`.
- `WxmPlaybackTelemetry`: `AnalyticsListener` de Media3 para errores, buffering, ancho de banda, retries y switches.
- `WxmAudioFocusManager`: audio focus moderno con soporte Android O+, fallback legacy, ducking y recuperacion.
- `WxmRemoteConfigManager`: base local segura para evolucionar a CMS/backend.
- `WxmNetworkEngine` + `WxmNetworkConfig` + `WxmDataSourceFactory`: `OkHttpDataSource.Factory` para Media3 con user-agent WXM, headers seguros, timeouts completos, pool de conexiones y medicion de red.
- `WxmAudioRouteManager`: deteccion inicial de salida de audio.
- `AudioDeviceCallback`: actualizacion de estado al conectar/desconectar salidas de audio.
- `ACTION_AUDIO_BECOMING_NOISY`: pausa segura al desconectar audifonos/Bluetooth.
- `WxmSpatialCapabilities`: deteccion segura de Android Spatializer.
- `WxmBridgeStatusStore`: snapshot JSON para que el frontend vea el estado real del motor nativo.

## Integracion actual

`RadioPlaybackService` ahora:

- Usa `WxmStreamEngine` para resolver la fuente activa.
- Usa `WxmBufferEngine` al crear ExoPlayer.
- Usa `WxmNetworkScore` para ajustar buffer/retry.
- Usa `WxmRetryPolicy` para reintentos controlados.
- Usa `WxmFallbackManager` para cambiar a fallback cuando exista mas de una URL.
- Usa `WxmPlaybackTelemetry` como `AnalyticsListener`.
- Usa `WxmAudioFocusManager` antes de reproducir.
- Mantiene el DSP actual `WxmAudioProcessor`.
- Mantiene los controles de lock screen y notificacion existentes.
- Publica estado tecnico hacia `WXMAndroidAudio.getPlaybackStatus()`.

La UI WebView ahora:

- Agrega `Motor NEXTGEN` en `Mi WXM`.
- Muestra estado, red, buffer, stream, fallback, DSP, salida, Spatializer, retries, buffering, datos transferidos y errores.
- Polling seguro del bridge nativo cuando la app corre en Android.
- Mantiene fallback web si se abre en navegador.

## Pendiente

- Agregar URLs fallback reales desde CMS/configuracion remota. Actualmente solo hay stream principal seguro.
- Persistir telemetria/configuracion critica con Room.
- Migrar gradualmente a Media3 `MediaSessionService`.
- Aplicar politicas automaticas de DSP segun speaker/audifonos/Bluetooth.
- Usar Spatializer API para decisiones automaticas de perfil DSP donde aplique.
- Agregar controles avanzados desde frontend hacia el motor NEXTGEN.
- Crear pruebas automatizadas y ejecutar checklist manual en emulador/dispositivo real.

## Actualizacion UI/CMS 2026-05-14

Archivos creados:

- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/v2/assets/js/cms-config.js`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/v2/assets/js/i18n.js`

Archivos modificados:

- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/MCP.md`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/v2/index.html`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/v2/assets/css/main.css`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/v2/assets/js/ui-controller.js`

Arquitectura agregada:

- CMC/CMS local temporal con feature flags para radios secundarias, podcasts, mixes, noticias, videos, quiz de canciones y mini player.
- Internacionalizacion `system/es/en` con selector visible en `Mi WXM`.
- Mini player persistente sobre la navegacion inferior.
- Pestaña `En vivo` reconstruida como vista de "Ahora suena", controles compactos, acciones e historial musical semanal.
- Rails estilo emisora profesional preparados para activarse solo cuando el CMC tenga contenido real.
- Estado empty profesional en `Explorar` cuando WXM esta en modo radio musical en vivo.

Pendiente especifico:

- Conectar `cms-config.js` a un CMS/backend real.
- Activar secciones avanzadas solo cuando existan fuentes reales de podcasts/noticias/videos/radios.
- Validar visualmente en Android WebView y emulador despues de sincronizar assets.

## Actualizacion CMS remoto 2026-05-15

Estado de compilacion: `BUILD SUCCESSFUL`.

APK generado:

- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/build/outputs/apk/debug/app-debug.apk`

Archivos creados:

- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/CMS_REMOTE_CONTRACT.md`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/v2/assets/js/cms-service.js`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/v2/assets/data/wxm-cms.remote.sample.json`

Archivos modificados:

- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/MCP.md`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/v2/index.html`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/v2/assets/css/main.css`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/v2/assets/js/cms-config.js`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/v2/assets/js/i18n.js`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/v2/assets/js/ui-controller.js`

Arquitectura agregada:

- `CmsConfigService`: carga JSON remoto por HTTPS, valida, sanitiza, limita contenido, usa cache y cae al CMC local si falla.
- Contrato remoto JSON documentado para hosting.
- Sample JSON listo para copiar/adaptar en hosting.
- Entrada `CMS / CMC` en `Mi WXM` para diagnostico: fuente activa, endpoint, revision, error, features y control de endpoint.
- Soporte de cache remota con TTL.
- Soporte de override temporal de endpoint via `localStorage`.

Reglas implementadas:

- Produccion debe usar HTTPS.
- Se bloquea contenido remoto inseguro.
- Las secciones avanzadas solo aparecen si el CMS/CMC las activa y contienen items.
- El panel dentro de la app es solo diagnostico/desarrollo, no admin publico final.

Pendiente especifico:

- Publicar `wxm-cms.json` en hosting real.
- Crear panel admin web privado para editar ese JSON.
- Agregar validacion/preview antes de publicar en el CMS real.
- Conectar streams/fallbacks remotos del CMS al motor Android nativo.

## Cierre De Fases 1 A 2.2 - Auditoria Recursiva 2026-05-15

Resultado:

- Fase 1 queda cerrada como base modular funcional.
- Fase 2.1 queda cerrada en codigo/frontend y empaquetado Android; resta QA manual visual en dispositivo.
- Fase 2.2 queda cerrada como infraestructura CMS-ready frontend con HTTPS, sanitizacion, cache y fallback local.

Correcciones de cierre aplicadas:

- El historial semanal ahora usa una instancia dedicada dentro del sheet completo, evitando conflicto de IDs con el historial inline.
- El boton `Semana` abre la ventana completa de historial en vez de hacer solo scroll.
- La navegacion del WebView ya no acepta `http://` ni carga hosts externos dentro de la WebView; solo mantiene interno `appassets.androidplatform.net` y abre `https://` externos fuera de la app.
- `MCP.md` actualizado para reflejar el estado real de Fase 2.1 y Fase 2.2.

Pendiente fuera del alcance de Fase 1 a 2.2:

- Room Data Layer.
- Media3 `MediaSessionService`.
- CMS admin web privado real.
- Streams/fallbacks remotos nativos.
- QA manual completa en emulador/dispositivo.

## Cierre De Fase 3 - Network Engine 2026-05-15

Resultado:

- Fase 3 queda completada en codigo y compilacion Android.
- La app ya usa `OkHttpDataSource.Factory` de Media3 sobre un `OkHttpClient` propio.
- `RadioPlaybackService` delega la capa HTTP en `WxmNetworkEngine` en vez de conocer detalles del cliente.

Archivos creados:

- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/network/WxmNetworkEngine.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/network/WxmOkHttpClientFactory.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/network/WxmOkHttpEventListener.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/network/WxmHttpsOnlyInterceptor.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/network/WxmSafeLoggingInterceptor.java`

Cambios principales:

- Se agrego `media3-datasource-okhttp`.
- `WxmNetworkConfig` ahora define `connect`, `read`, `write`, `call timeout`, pool de conexiones y politica de retry.
- `WxmDataSourceFactory` paso de `DefaultHttpDataSource` a `OkHttpDataSource.Factory`.
- `WxmHttpsOnlyInterceptor` bloquea cualquier request no HTTPS.
- `WxmSafeLoggingInterceptor` permite logging redacted y desactivado por defecto.
- `WxmOkHttpEventListener` mide host, DNS, TCP, TLS, duracion total y estado HTTP.
- `WxmPlaybackTelemetry` ahora agrega metricas HTTP y es segura para eventos concurrentes.
- `Motor NEXTGEN` muestra salud HTTP y ultima duracion de conexion.

Validacion:

- `./gradlew clean assembleDebug` completo con `BUILD SUCCESSFUL`.

## Fase 0.6 - Auditoria Operativa De Continuidad - 2026-06-15

Objetivo:

- Confirmar que el proyecto oficial sigue siendo `/Users/mac/AndroidProjects/Reprov2_NEXTGEN`.
- Evitar que la desconexion/interrupcion dejara cambios incompletos.
- Crear una puerta de smoke test unica antes de seguir agregando funciones.
- Validar app web, CMS local, CMS remoto starter y build Android debug.

Archivos creados:

- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/scripts/smoke-check.sh`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/docs/CURRENT_STATE_AUDIT.md`

Archivos modificados:

- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/.github/workflows/ci.yml`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/README.md`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/RELEASE_CHECKLIST.md`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/cms-remote-starter/server.js`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/docs/DEPLOYMENT.md`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/scripts/build-android-apk.sh`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/assets/public/assets/data/wxm-cmc.json`

Arquitectura/operacion agregada:

- Smoke test local/CI para entry points, higiene Git, secretos basicos, JSON contracts y sintaxis JS.
- CI de `dev`/`main` ejecuta el smoke test antes del build Android.
- Build script Android usa el Gradle Wrapper del proyecto y el JDK embebido de Android Studio si existe.
- CMS Remote Starter responde correctamente a `HEAD` en rutas criticas.
- Runtime Node del smoke test cae al Node embebido de Codex cuando `node` no existe en `PATH` local.

Validacion:

- `./scripts/smoke-check.sh` completo con `OK`.
- `WXM_SMOKE_BUILD_ANDROID=1 ./scripts/smoke-check.sh` completo con `BUILD SUCCESSFUL` y `OK`.
- `./scripts/build-android-apk.sh` completo con `BUILD SUCCESSFUL`.
- CMS remoto temporal en puerto `8791` respondio `200 OK` en:
  - `HEAD /health`
  - `HEAD /admin/`
  - `HEAD /wxm-cms.json`

APK generado:

- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/build/outputs/apk/debug/app-debug.apk`

Pendiente:

- Smoke visual automatizado con navegador para app, CMS y World Atlas.
- Consolidar o archivar la copia legacy `v2/cms/cms/`.
- Mantener Gradle warnings bajo vigilancia antes de migraciones mayores.

Pendiente fuera de Fase 3:

- Room Data Layer.
- Media3 `MediaSessionService`.
- Streams/fallbacks remotos nativos.
- CMS admin privado real.

## Cierre De Fase 4 - Smart Retry Engine 2026-05-16

Resultado:

- Fase 4 queda completada en codigo.
- `WxmRetryPolicy` deja de ser una politica inicial basica y pasa a clasificar errores, aplicar cooldown por rafaga y resetearse tras recuperacion real.

Archivos modificados:

- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/engine/WxmRetryPolicy.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/engine/WxmStreamEngine.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/STREAMING_ENGINE_ARCHITECTURE.md`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/MCP.md`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/TESTING_CHECKLIST.md`

Cambios principales:

- Se agrego `RetryReason` tipado.
- Se agrego clasificacion para:
  - `offline_wait`
  - `poor_network`
  - `network_timeout`
  - `network_io`
  - `stream_unavailable`
  - `decoder_recoverable`
  - `non_recoverable_format`
- Se agrego cooldown por rafaga de fallos.
- Se agregaron penalizaciones segun calidad de red y tipo de error.
- El estado de rafaga se limpia cuando el stream vuelve a `READY`.
- Se mantiene el limite de intentos por fuente para permitir luego el cambio a fallback.
- Auditoria recursiva posterior:
  - `allowCrossProtocolRedirects` ya se aplica al cliente OkHttp.
  - Los errores no recuperables ahora tienen prioridad sobre el score de red.
  - `offline_wait` y `cooldown` no consumen intentos de fuente.
  - `offline_wait` tampoco alimenta la rafaga de fallos.
  - El estado de rafaga/cooldown ahora vive por `sourceId`; un fallback sano ya no hereda el castigo de otra fuente.

## Auditoria Recursiva Fases 1 A 4 - Endurecimiento 2026-05-16

Resultado:

- Fase 1 deja de ser solo modularizacion inicial y queda endurecida con validacion centralizada y estado observable del stream.
- Fase 2 deja de figurar como parcial: queda completada en codigo base industrial; solo resta validacion operativa con fallbacks reales.
- Fase 3 ya era avanzada, pero se eleva con snapshot de red rico y callbacks de conectividad.
- Fase 4 queda corregida para que el cooldown sea por fuente, no global.

Archivos creados:

- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/engine/WxmStreamUrlPolicy.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/engine/WxmStreamLifecycleState.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/engine/WxmStreamSnapshot.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/network/WxmNetworkSnapshot.java`

Cambios principales:

- `WxmStreamEngine` ya no acepta runtime primary con un chequeo superficial; usa `WxmStreamUrlPolicy`.
- Se publica `streamLifecycle` hacia el bridge con estado, ultimo motivo y cantidad de URLs runtime rechazadas.
- `WxmNetworkMonitor` registra `NetworkCallback` y publica transporte, validacion, red medida y downstream estimado.
- `RadioPlaybackService` publica `network` detallado junto a la telemetria existente.
- `WxmRetryPolicy` mantiene burst/cooldown por `sourceId`.

Pendiente real tras el endurecimiento:

- QA manual en emulador/dispositivo real.
- Fallback URLs reales desde CMS/hosting para validar conmutacion operativa.
- Room Data Layer, Media3 `MediaSessionService`, buffering adaptativo avanzado y telemetria persistente quedan para sus fases posteriores.

## Endurecimiento De Producto Antes De Fase 4 - 2026-05-15

Resultado:

- La app publica ya no muestra `Motor NEXTGEN` ni `CMS / CMC` en `Mi WXM`.
- Ambos paneles siguen disponibles solo en modo desarrollador interno.
- Se agrego `Estado del servicio` para usuario final con lectura simple de reproduccion, conexion, audio, salida e incidencias.
- El modo desarrollador queda apagado por defecto y puede activarse solo en entornos de trabajo con `?dev=1`; `?dev=0` lo desactiva.

Motivo:

- Las metricas crudas de red, fallbacks, TLS y endpoints CMS son utiles para desarrollo/soporte, pero no deben formar parte de la experiencia publica.
- La app publica conserva transparencia operativa sin exponer infraestructura interna ni controles administrativos.

## Cierre De Modo Claro Antes De Fase 4 - 2026-05-15

Hallazgos:

- El modo claro no estaba completo: al iniciar la app se forzaba de nuevo el tema oscuro y se perdia la preferencia del usuario.
- La capa visual de marca mantenia tarjetas oscuras fijas mientras el texto cambiaba a colores de tema claro, provocando bajo contraste.

Correcciones:

- La app conserva `wxm_theme=light` o `dark` entre sesiones.
- Se agrego una capa especifica de modo claro para topbar, tarjetas, navegacion, mini player, modales, CMS rails e historial.
- Las piezas hero de marca conservan tratamiento oscuro intencional, pero el resto de la interfaz pasa a superficies claras reales.
- Se verifico visualmente `Inicio`, `En vivo` y `Mi WXM` en navegador movil local.

## Actualizacion De Controles Multimedia Nativos - 2026-05-16

Archivos creados:

- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/res/drawable/ic_notification_reconnect.xml`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/res/drawable/ic_notification_stop.xml`

Archivos modificados:

- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/RadioPlaybackService.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/MCP.md`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/TESTING_CHECKLIST.md`

Cambios:

- La notificacion multimedia Android deja de publicar una sola accion y pasa a usar una tarjeta `MediaStyle` expandida mas completa.
- Se agregan acciones reales para radio en vivo:
  - `Reconectar`
  - `Reproducir/Pausar`
  - `Detener`
- La vista compacta muestra `Reproducir/Pausar` y `Detener`.
- `PlaybackState` publica tambien `ACTION_STOP`.
- La notificacion usa `setDeleteIntent(stopIntent)` y `setOnlyAlertOnce(true)`.

Decision tecnica:

- No se agregan controles `-30/+30` todavia porque el stream actual es radio en vivo sin timeshift ni replay buffer. Esos botones quedan reservados para una fase futura donde exista reproduccion desplazable real.

## Cierre De Fase 5 - Fallback Streams Ultra 2026-05-16

Resultado:

- La arquitectura de fallback queda completada en codigo y elevada a una politica avanzada por fuente.
- La operacion real queda pendiente de recibir URLs secundarias reales desde hosting/CMS; no se inventaron endpoints.

Archivos modificados:

- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/engine/WxmFallbackManager.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/engine/WxmFallbackPolicy.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/engine/WxmStreamEngine.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/config/WxmRemoteConfigManager.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/RadioPlaybackService.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/v2/assets/js/ui-controller.js`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/MCP.md`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/STREAMING_ENGINE_ARCHITECTURE.md`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/TESTING_CHECKLIST.md`

Cambios principales:

- Se agrego sanitizacion `https://` y deduplicacion de fuentes.
- Se agrego salud por fuente en vez de un unico estado global.
- Se agrego `WxmFallbackPolicy` con:
  - cooldown por fuente
  - cuarentena tras fallos consecutivos
  - intervalo minimo entre probes de recuperacion del primario
- La seleccion de fallback ahora prioriza salud, prioridad y menor historial de fallos.
- Se evita volver a elegir una fuente mientras siga en cooldown o cuarentena.
- Se agregaron snapshots detallados por fuente:
  - `eligible`
  - `totalFailures`
  - `consecutiveFailures`
  - `lastFailureAtMs`
  - `lastHealthyAtMs`
  - `cooldownRemainingMs`
  - `quarantineRemainingMs`
- Se expone:
  - `configuredFallbackCount`
  - `fallbackConfigured`
  - `allStreamsExhausted`
  - `allStreamsUnavailableNow`
  - `streamHealthBySource`
  - `streamSources`
- Cuando no queda ninguna fuente elegible de forma temporal, el bridge publica `waiting_recovery`; cuando todas quedan realmente agotadas, conserva estado `unavailable`.
- La recuperacion al primario ahora usa `tryRecoverPrimary()` en vez de un reset ciego.
- Se evita acumular timers de recuperacion primaria que podian reiniciar un stream ya sano.
- `WxmRemoteConfigManager` queda preparado para recibir listas de fallback, pero su lista local sigue vacia hasta tener endpoints reales.

## Cierre De Fase 6 - Ultra Buffer Engine 2026-05-16

Resultado:

- La fase 6 queda completada en codigo.
- El buffer deja de ser un selector estatico por score de red y pasa a tomar decisiones adaptativas con memoria reciente.

Archivos creados:

- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/buffer/WxmBufferHealth.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/buffer/WxmBufferDecisionReason.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/buffer/WxmBufferSnapshot.java`

Archivos modificados:

- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/buffer/WxmBufferEngine.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/buffer/WxmBufferProfile.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/telemetry/WxmPlaybackTelemetry.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/RadioPlaybackService.java`

Cambios principales:

- Se agrega ventana movil de 120 segundos para medir presion real de buffer.
- Se separa perfil activo de perfil recomendado.
- Se agrega salud `STABLE`, `WATCH`, `PRESSURED`, `CRITICAL`.
- Se agregan razones de decision auditables.
- La proteccion escala de inmediato con mala red o rebuffer alto.
- El regreso a perfiles menos protectores exige estabilidad sostenida para evitar oscilaciones.
- El bridge expone `buffer` con salud, razon, rebuffer reciente, buffering reciente y cambios pendientes.
- `WxmPlaybackTelemetry` ahora incluye buffering en curso dentro del total efectivo y `currentlyBuffering`.

Decision tecnica:

- El `LoadControl` activo de ExoPlayer no se muta de forma agresiva durante playback continuo. El motor recomienda el siguiente perfil y lo aplica al crear el siguiente reproductor o en un reinicio ya necesario, evitando cortes artificiales por sobreoptimizacion.

## Cierre De Fases 7 Y 8 - Network Monitor + Playback Telemetry 2026-05-16

Resultado:

- La fase 7 queda cerrada con red observable, historica y compartida por los motores.
- La fase 8 deja de ser solo contadores aislados y pasa a medir sesiones de reproduccion completas.

Archivos modificados:

- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/network/WxmNetworkSnapshot.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/network/WxmNetworkMonitor.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/telemetry/WxmPlaybackTelemetry.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/RadioPlaybackService.java`

Cambios principales:

- `WxmNetworkSnapshot` agrega `previousScore`, `changeCount`, `lastChangedAtMs`, `lastConnectedAtMs` y `lastDisconnectedAtMs`.
- `WxmNetworkMonitor` cuenta transiciones reales de red sin inflar metricas por polling repetido.
- `WxmPlaybackTelemetry` agrega requests de playback, resumes, pausas, stops, duracion efectiva, startup ultimo/promedio y metadata updates.
- El bridge nativo expone la nueva fotografia de red y de sesion para inspeccion, UI tecnica y futura persistencia en Room.
- La duracion de playback se calcula por segmentos activos para no contar pausas ni interrupciones como escucha real.

Decision tecnica:

- La app conserva telemetria local primero. Persistirla o enviarla a backend queda para la fase de Room/CMS para no mezclar observabilidad con almacenamiento antes de tener el contrato de datos cerrado.

## Inicio De Fase 9 - Room Data Layer 2026-05-16

Resultado:

- La app ya tiene una base Room real y empieza una migracion gradual fuera de `localStorage`.
- El frontend sigue intacto; Android hace doble escritura para preparar el cambio sin romper compatibilidad.

Archivos creados:

- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/cache/FavoriteEntity.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/cache/HistoryEntity.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/cache/TelemetryEntity.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/cache/StreamConfigEntity.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/cache/AudioProfileEntity.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/cache/CoverCacheEntity.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/cache/PlaybackStateEntity.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/cache/FavoriteDao.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/cache/HistoryDao.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/cache/TelemetryDao.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/cache/StreamConfigDao.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/cache/AudioProfileDao.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/cache/CoverCacheDao.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/cache/PlaybackStateDao.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/cache/WxmDatabase.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/cache/WxmDataLayerSnapshot.java`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/cache/WxmDataRepository.java`

Archivos modificados:

- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/build.gradle`
- `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/src/main/java/com/wxmoneradio/player/RadioPlaybackService.java`

Cambios principales:

- Se agrega Room `2.6.1`.
- Se crea `WxmDataRepository` con IO dedicado.
- Se persiste en paralelo:
  - audio profile;
  - playback state;
  - historial desde metadata;
  - stream config segura;
  - snapshots de telemetria cada 30 segundos como maximo.
- El bridge expone `dataLayer` con disponibilidad y timestamps de persistencia.
- `localStorage` no se elimina todavia; la migracion queda preparada, no impuesta.

Pendiente de la fase 9:

- Lecturas nativas hacia la UI.
- Migracion real de favoritos y playlist semanal desde JS.
- Cache fisica de caratulas y politica de limpieza.
- Retencion/compactacion de telemetria antes de un backend real.

## Auditoria Recursiva De Estabilidad De Audio 2026-05-16

Hallazgos corregidos:

- `callTimeout = 30000 ms` era incompatible con un stream vivo infinito y podia provocar cortes periodicos.
- La politica automatica de buffer favorecia `LOW_LATENCY` en redes excelentes, una eleccion agresiva para radio 24/7.
- El frontend Android podia mostrar `playing` por una promocion optimista de 800 ms.
- `BUFFERING` podia quedar sobrescrito por `PAUSED` durante transiciones de ExoPlayer.

Cambios aplicados:

- `WxmNetworkConfig` cambia a `callTimeout = 0` y `readTimeout = 30000`.
- `WxmBufferEngine` recomienda `STABLE_RADIO` para redes `GOOD` y `EXCELLENT`.
- `AudioEngine` sincroniza el estado visual con el bridge nativo y elimina la promocion optimista.
- `RadioPlaybackService` conserva el estado `buffering` cuando ExoPlayer aun esta rebufferizando.
- Se agrega `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/AUDIO_STABILITY_AUDIT.md`.

## Profundizacion De Estabilidad Frente A Referencias Tipo TuneIn 2026-05-17

Hallazgos corregidos:

- La ruta Android seguia recibiendo una URL con `?nocache=<timestamp>`, util para HTML5 web pero impropia para el motor nativo.
- `WxmAudioProcessor` asignaba un frame buffer nuevo por bloque de audio procesado.
- No existia telemetria de `audio underrun`.
- No existia recuperacion automatica cuando el player seguia vivo pero dejaba de avanzar.

Cambios aplicados:

- `v2/assets/js/audio-engine.js` envia a Android la URL canonica estable del stream.
- `WxmAudioProcessor` reserva y reutiliza `frameBuffer` por configuracion.
- `WxmPlaybackTelemetry` publica underruns, ultimo feed tardio, ultimo byte de red y recuperaciones del watchdog.
- `RadioPlaybackService` incorpora watchdog nativo con:
  - recuperacion de `READY` sin progreso tras 15 s;
  - recuperacion de `BUFFERING` prolongado tras 45 s;
  - registro de causa y reintento limpio.

Decision tecnica:

- Si TuneIn reproduce estable mientras WXM falla, la sospecha principal pasa del origen remoto a la implementacion local de la app. Estas correcciones alinean la ruta nativa con una operacion de radio continua mas madura y hacen visible cualquier fallo residual que aun quede.

## Apertura De Fase 9.5 - Estabilizacion Y Cierre Tecnico 2026-05-17

Motivo:

- La auditoria de crisis detecto una brecha entre fases "implementadas en codigo" y fases realmente cerradas en operacion.
- Antes de seguir sumando funciones, la prioridad pasa a ser continuidad, diagnostico, verdad documental y pruebas fisicas.

Cambios aplicados:

- `MCP.md` pasa a fecha 2026-05-17 y declara explicitamente la `Fase 9.5`.
- `STREAMING_ENGINE_ARCHITECTURE.md` deja de describir Room como inexistente y pasa a reflejar migracion abierta.
- `TESTING_CHECKLIST.md` agrega un gate de salida para comparacion contra TuneIn, sesion larga, Room y telemetria critica.
- Room sube a esquema `v2` con migracion formal para persistir:
  - `audioUnderrunCount`
  - `lastAudioUnderrunAtMs`
  - `lastAudioUnderrunElapsedSinceLastFeedMs`
  - `watchdogRecoveryCount`
  - `lastWatchdogReason`
- `WxmDataRepository` deja de degradar Room en silencio:
  - publica `persistenceFailureCount`
  - publica `lastPersistenceFailureAtMs`
  - publica `lastPersistenceFailure`
  - registra advertencias tecnicas locales para soporte.
- `WxmPlaybackTelemetry` separa timestamps visibles de soporte y duraciones internas:
  - mantiene epoch time para eventos;
  - calcula startup, playback activo y buffering con `elapsedRealtime`.
- `WxmRetryPolicy`, `WxmBufferEngine`, `WxmFallbackManager` y el watchdog de `RadioPlaybackService` pasan a medir cooldowns, ventanas operativas y stalls con reloj monotono, no con reloj de pared.
- El panel `Motor NEXTGEN` expone `Room`, `Persistencia` y `Underruns` para hacer visibles los fallos que antes quedaban escondidos.

Pendiente para cerrar la fase:

- Prueba fisica comparativa contra TuneIn con la misma red/dispositivo.
- Validacion de continuidad de 60 minutos con lock screen y background.
- Confirmar que Room persiste telemetria critica y que no hay fallos silenciosos.

## Preparacion Arquitectonica Para Fase 10 - 2026-05-18

Motivo:

- Antes de migrar a `MediaSessionService`, `RadioPlaybackService` seguia concentrando demasiadas responsabilidades.
- Hacer la migracion sobre un servicio monolitico elevaba el riesgo de regresiones en lock screen, notificacion y recuperacion.

Cambios aplicados:

- Se agrega `WxmPlaybackNotificationManager` para canal y renderizado de notificaciones.
- Se agrega `WxmLegacyMediaSessionController` para metadata, playback state y callbacks de la sesion actual.
- Se agrega `WxmArtworkLoader` para descarga HTTPS de caratulas.
- Se agrega `WxmPlaybackRecoveryController` para watchdog y scheduling de recuperacion.
- La descarga de caratulas publica cambios de MediaSession/notificacion desde el hilo principal.
- Se agrega `WxmPlaybackCommand` para normalizar comandos de WebView, notificacion, lock screen y futuras sesiones nativas.
- Se agrega `WxmPlaybackSessionController` para desacoplar `RadioPlaybackService` de la implementacion legacy de sesion.
- `RadioPlaybackService` queda reducido de 1512 a 1317 lineas y conserva la orquestacion principal del motor.

Resultado:

- La siguiente migracion ya no tiene que tocar a la vez stream, caratulas, notificaciones, recovery y sesion.
- Fase 10 puede avanzar por sustitucion progresiva del controlador de sesion sin romper el foreground service actual.
- Los comandos de playback tienen ahora una entrada unica antes de llegar al motor, lo que reduce contradicciones entre UI, bridge y controles nativos.
- La futura sesion Media3 ya tiene un punto de reemplazo claro: implementar otro adaptador de `WxmPlaybackSessionController`.

## Historial Semanal Y Modo Claro - 2026-05-19

Motivo:

- La pestaña `Semana` podia verse con contraste oscuro en modo claro.
- El historial diario estaba limitado a 100 registros, insuficiente para una radio 24/7.

Cambios aplicados:

- Se agregan estilos light-theme especificos para tarjetas de dia, texto, fecha, contador y modal de playlist.
- `CONFIG.PLAYLIST.MAX_TRACKS_PER_DAY` sube a 500.
- `PlaylistStorage` sanitiza y guarda hasta 500 tracks por dia, con fallback compacto a 250 si el almacenamiento local se llena.
- `PlaylistEngine.addHistory` ahora evita duplicados cercanos por ventana temporal de 20 minutos en lugar de bloquear para siempre la misma cancion por titulo/artista.
- Los assets Android fueron resincronizados desde `v2`.

Resultado:

- El modo claro ya tiene contraste dedicado en la vista semanal.
- El historial semanal conserva muchos mas registros por dia y permite repeticiones reales de canciones separadas en el tiempo.
- El historial completo real cuando la app esta cerrada sigue requiriendo backend/CMS historico; el frontend solo puede guardar lo que recibe mientras esta activo.

## Bloqueo De Zoom De Interfaz - 2026-05-19

Motivo:

- La app no debe comportarse como una pagina/foto ampliable con pinch zoom.
- La experiencia correcta para WXM es responsive nativa: adaptarse a cada pantalla sin permitir escalado manual de toda la interfaz.

Cambios aplicados:

- `MainActivity.configureWebView` desactiva soporte de zoom, controles internos de zoom y controles visibles.
- `setLoadWithOverviewMode(false)` evita que Android intente reescalar la pagina completa como documento web.
- `index.html` y `embed.html` fijan viewport con `minimum-scale=1.0`, `maximum-scale=1.0` y `user-scalable=no`.
- Los assets Android fueron resincronizados desde `v2`.

Resultado:

- La interfaz queda bloqueada como app nativa, no como imagen ampliable.
- La adaptacion por dispositivo queda en manos del CSS responsive y no del zoom del WebView.
- APK debug recompilada correctamente tras el cambio.

## Rollback

Si la copia NEXTGEN falla:

1. No tocar `/Users/mac/AndroidProjects/Reprov2`.
2. Eliminar o archivar `/Users/mac/AndroidProjects/Reprov2_NEXTGEN`.
3. Crear una nueva copia desde `/Users/mac/AndroidProjects/Reprov2`.
4. Reaplicar cambios de forma incremental.

## Correccion De Ruta Y Modulos CMS Media - 2026-05-20

Motivo:

- Se detecto que cambios recientes de CMS/panel se habian preparado en `/Users/mac/Desktop/Reprov2`, pero la rama correcta de trabajo y compilacion es `/Users/mac/AndroidProjects/Reprov2_NEXTGEN`.
- La version NEXTGEN ya tenia una arquitectura CMS/CMC mas avanzada, por lo que la correccion se hizo integrando los modulos dentro de ese contrato en lugar de copiar archivos antiguos encima.

Cambios aplicados:

- `v2/assets/js/cms-config.js`: se agregan features CMC para `banners`, `presenters`, `polls`, `sponsors`, `audioExperience` y contenido inicial con imagenes.
- `v2/assets/js/cms-service.js`: el contrato remoto acepta los nuevos rails y sanea configuracion visual/audio remota.
- `v2/assets/js/ui-controller.js`: las tarjetas CMS ahora soportan meta, descripcion, estados enfocables y URLs seguras.
- `v2/assets/js/i18n.js`: traducciones ES/EN para los nuevos rails.
- `v2/assets/css/main.css`: estilos responsive para banners, locutores, encuestas, sponsors y modo claro.
- `v2/assets/data/wxm-cms.remote.sample.json`: sample remoto actualizado con todos los modulos activables.
- `MCP.md`: se documenta que la rama activa es `Reprov2_NEXTGEN` y que el CMS real vivira fuera de la app.

Resultado esperado:

- La app puede mostrar secciones tipo radio profesional al estilo emisora real, controladas por CMC/CMS.
- Las funciones avanzadas pueden activarse o desactivarse sin recompilar cuando exista un JSON remoto en hosting.
- El APK debe compilarse y entregarse desde `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/build/outputs/apk/debug/app-debug.apk`.

## Fichas Internas Para Contenido CMS - 2026-05-21

Motivo:

- Las tarjetas de noticias, podcasts, locutores y otros modulos no deben sentirse como contenido muerto.
- Cuando el usuario toca una noticia, debe abrir una vista con informacion completa, aunque sea contenido de ejemplo mientras no exista CMS real.

Cambios aplicados:

- `v2/assets/js/ui-controller.js`: todas las tarjetas CMS abren una ficha interna accesible por toque o teclado.
- `v2/assets/js/ui-controller.js`: si el item trae `url`, la ficha muestra una accion para abrir el enlace sin sacar al usuario de la app en el primer toque.
- `v2/assets/js/ui-controller.js`: `Ver mas` de cada rail abre el primer contenido disponible como comportamiento temporal hasta tener listados completos.
- `v2/assets/js/cms-config.js`: noticias, podcasts, banners, locutores, encuestas, radios y aliados reciben cuerpo de ejemplo.
- `v2/assets/data/wxm-cms.remote.sample.json`: el contrato remoto documenta tambien el campo `body`.
- `v2/assets/css/main.css`: estilos para ficha interna CMS en modo oscuro y claro.

Resultado:

- Noticias ya pueden desplegar una ficha/pagina interna con noticia de ejemplo.
- Los modulos agregados quedan preparados para contenido real desde CMS/CMC remoto.
- La experiencia queda mas cercana a una app de radio real y menos a simples tarjetas decorativas.

## Panel CMS Local Integrado - 2026-05-21

Motivo:

- Existia un panel CMS local en `/Users/mac/Desktop/Reprov2/v2/cms`.
- El panel era util para continuar el desarrollo, pero exportaba principalmente un CMC bruto que no coincidia 1:1 con el contrato remoto consumido por la app NEXTGEN.

Cambios aplicados:

- Se mantiene y mejora el panel local en `/Users/mac/Desktop/Reprov2/v2/cms`.
- Se agrega export compatible con la app como `wxm-cms.json`.
- Se conserva export de respaldo como `wxm-cmc.json`.
- Se copia el panel a `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/v2/cms`.
- Se copia `wxm-cmc.json` a `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/v2/assets/data/wxm-cmc.json` para que el panel funcione en NEXTGEN.
- `scripts/sync-android-assets.sh` excluye `cms` del APK para evitar exponer herramientas administrativas al usuario final.

Resultado:

- El CMS puede abrirse localmente desde `/cms/index.html` en el servidor de `v2`.
- El JSON correcto para publicar en hosting y conectar con la app es el contrato `wxm-cms.json`.
- La app Android sigue protegida: el CMS no se empaqueta dentro del APK.

## Analytics CMS Local - 2026-05-21

Motivo:

- El CMS debe evolucionar de editor de contenido a consola operativa de emisora.
- Se pidio un dashboard similar a proveedores de radio con live listeners, peak audience, paises, players, referidores y separacion de usuarios provenientes de la app WXM.

Cambios aplicados:

- `v2/cms/index.html`: nueva seccion `Analytics` con KPIs, tendencias, audiencia realtime, mapa agregado, top paises, top players, referidores, quick stats y export.
- `v2/cms/assets/css/cms.css`: estilos del dashboard analytics responsive, cards, charts, rank lists, tabla y mapa agregado.
- `v2/cms/assets/js/cms.js`: contrato `analytics`, normalizacion segura, render del dashboard, export `wxm-analytics-sample.json` y endpoints configurables.
- `v2/assets/data/wxm-cmc.json`: bloque `analytics` con datos de muestra y feature `analyticsDashboard`.
- `v2/assets/js/config.js`: configuracion `CONFIG.ANALYTICS` preparada para endpoint de ingesta HTTPS.
- `v2/assets/js/analytics-service.js`: telemetria anonima local, sessionId anonimo, playbackSessionId, flush preparado por `sendBeacon`/`fetch` y snapshots de audiencia.
- `v2/assets/js/ui-controller.js`: eventos de app/playback/contenido/favoritos/peticiones/encuestas conectados al servicio analytics.
- `ANALYTICS_ENGINE_ARCHITECTURE.md`: arquitectura recomendada para backend de ingesta, agregaciones y dashboard seguro.
- `MCP.md`: se documenta la fase Analytics/CMS y los requisitos de privacidad.

Resultado:

- El CMS local ya muestra la estructura visual y contractual de analytics.
- La app ya genera eventos anonimos preparados para un backend real.
- Todavia no hay backend, base de datos ni agregaciones reales; esa es la siguiente capa de produccion.

## Hotfix APK WebView Interactiva - 2026-05-21

Motivo:

- En dispositivo Android la APK mostraba la UI, pero ninguna opcion respondia.
- El problema era un fallo de inicializacion en `v2/assets/js/ui-controller.js`: el controlador intentaba crear un contexto 2D desde `#visualizer`, un elemento que ya no existe en el `index.html` NEXTGEN actual.

Cambios aplicados:

- `v2/assets/js/ui-controller.js`: `#visualizer` se trata como elemento opcional.
- `v2/assets/js/ui-controller.js`: `_startVisualizer()` sale de forma segura si no hay canvas.
- `v2/assets/js/ui-controller.js`: `_handleStateChange()` evita errores si algun boton/icono opcional no existe.
- `v2/assets/js/ui-controller.js`: se conectan `miniPlayBtn`, `audioSettingsBtn`, `languageSettingsBtn`, `serviceStatusBtn`, `cmsStatusBtn` y `engineStatusBtn`.
- `v2/assets/js/ui-controller.js`: se implementan modales de idioma, estado de servicio, CMS/CMC y motor NEXTGEN.
- `android-webview/app/src/main/assets/public/assets/js/ui-controller.js`: sincronizado desde `v2`.

Validacion:

- `node --check v2/assets/js/ui-controller.js`: OK.
- `node --check android-webview/app/src/main/assets/public/assets/js/ui-controller.js`: OK.
- Navegador local: UI carga sin errores de arranque, play cambia estado y `Estado del servicio` abre modal.
- `./gradlew assembleDebug`: BUILD SUCCESSFUL.

APK:

- Ruta: `android-webview/app/build/outputs/apk/debug/app-debug.apk`.
- Ultima compilacion: 2026-05-21 18:03:44 CEST.
- Tamano aproximado: 11 MB.

## Hotfix UI Inicio / Explorar - 2026-05-22

Motivo:

- La interfaz se veia desorganizada principalmente en `Inicio` y `Explorar`.
- Las tarjetas con imagen no tenian una maqueta compacta propia y algunas portadas CMS heredaban proporciones demasiado grandes.
- El mini reproductor fijo duplicaba controles en `Inicio`/`En vivo` y tapaba contenido visible.

Cambios aplicados:

- `v2/assets/css/main.css`: tarjetas editoriales con imagen convertidas a layout horizontal compacto y estable.
- `v2/assets/css/main.css`: tarjetas CMS compactas con portada lateral, texto limitado y sin imagenes gigantes.
- `v2/assets/css/main.css`: padding inferior revisado para evitar solapes con navegacion inferior.
- `v2/assets/css/main.css`: mini reproductor oculto en `Inicio`, `En vivo` y `Explorar`; se mantiene para vistas donde aporta control rapido.
- `v2/assets/js/ui-controller.js`: `Inicio` y `Explorar` ahora renderizan carriles CMS reales para noticias, podcasts/replays, radios, locutores, encuestas y sponsors.
- `v2/assets/js/ui-controller.js`: las tarjetas CMS abren una ficha/modal interna segura con `textContent`, sin inyectar HTML remoto.
- `android-webview/app/src/main/assets/public`: sincronizado desde `v2`.

Validacion:

- `node --check v2/assets/js/ui-controller.js`: OK.
- Navegador local movil: `Inicio` y `Explorar` sin overflow horizontal.
- `Explorar`: 6 carriles CMS renderizados, tarjetas principales de 132px y tarjetas CMS compactas de 118px.
- Interaccion: una tarjeta CMS abre modal correctamente y el modal cierra sin romper la vista.
- `./scripts/sync-android-assets.sh`: OK.
- `./gradlew clean assembleDebug`: BUILD SUCCESSFUL.

APK:

- Ruta: `android-webview/app/build/outputs/apk/debug/app-debug.apk`.
- Ultima compilacion: 2026-05-22 06:55:24 CEST.
- Tamano aproximado: 11 MB.

## Ajuste final UI Inicio / Explorar - 2026-05-30

Motivo:

- Despues del hotfix anterior, el producto necesitaba separar mejor responsabilidades:
  `Inicio` debe sentirse como portada editorial de radio y `Explorar` como hub de CMS/contenido.
- El mini reproductor habia quedado oculto tambien en `Explorar`, perdiendo control rapido mientras el usuario navega contenido.
- Los assets Android no estaban sincronizados con la version corregida de `v2`, por lo que el APK podia quedar atrasado.

Cambios aplicados:

- `v2/assets/js/ui-controller.js`: `Inicio` ya no renderiza carriles CMS; `homeCmsRails` se limpia y queda oculto.
- `v2/assets/js/ui-controller.js`: `Explorar` conserva los carriles CMS reales: radios secundarias, podcasts, noticias, locutores, encuestas y sponsors.
- `v2/assets/css/main.css`: el mini reproductor sigue oculto en `Inicio` y `En vivo`, pero queda restaurado en `Explorar` como control compacto flotante.
- `v2/assets/css/main.css`: el mini reproductor de `Explorar` usa altura reducida, portada compacta y boton estable para no desordenar la vista.
- `android-webview/app/src/main/assets/public`: sincronizado nuevamente desde `v2`.

Validacion:

- `node --check v2/assets/js/ui-controller.js`: OK.
- `node --check android-webview/app/src/main/assets/public/assets/js/ui-controller.js`: OK.
- Auditoria de assets Android: `homeCmsRails` aparece como oculto/limpio en `Inicio`.
- Auditoria de estilos Android: el mini reproductor esta oculto solo en `Inicio` y `En vivo`; `Explorar` tiene reglas compactas propias.
- `./scripts/sync-android-assets.sh`: OK.
- `./gradlew clean assembleDebug`: BUILD SUCCESSFUL.

APK:

- Ruta: `android-webview/app/build/outputs/apk/debug/app-debug.apk`.
- Ultima compilacion: 2026-05-30 03:02:21 CEST.
- Tamano aproximado: 11 MB.

## CMS Remoto 1.1 - Contrato Dual Y Gate De Publicacion - 2026-05-30

Motivo:

- El panel local generaba un `wxm-cms.json` orientado a `rails`, mientras la app cargaba principalmente el CMC bruto orientado a `content`.
- Esa diferencia podia hacer que un CMS remoto publicado correctamente no alimentara noticias, podcasts, locutores, radios secundarias o sponsors dentro de la app.
- Antes de avanzar a hosting real, era necesario bloquear la publicacion de contratos inseguros o incompletos.

Cambios aplicados:

- `v2/assets/js/config.js`: la app ahora puede consumir CMC bruto y tambien contrato CMS con `rails`.
- `v2/assets/js/config.js`: se agrego derivacion segura de contenido desde `rails` hacia `CONFIG.CONTENT`.
- `v2/cms/assets/js/cms.js`: el contrato exportado por el panel incluye `station`, `stream`, `content`, `features`, `visual`, `audioExperience`, `emergency` y `rails`.
- `v2/cms/assets/js/cms.js`: se agrego gate de validacion para bloquear descarga/copia del JSON de app cuando existan errores criticos.
- `v2/cms/index.html`: se agrego estado visible del gate de publicacion.
- `v2/cms/assets/css/cms.css`: estilos para estado de contrato publicable, advertencias y botones deshabilitados.
- `v2/assets/data/wxm-cms.remote.sample.json`: muestra remota actualizada al contrato v2.
- `CMS_REMOTE_CONTRACT.md`: reescrito para documentar el contrato dual y el flujo real de hosting.
- `MCP.md`: actualizado con la fase CMS Remoto 1.1.

Validacion:

- `node --check v2/assets/js/config.js`: OK.
- `node --check v2/cms/assets/js/cms.js`: OK.
- `node --check v2/assets/js/ui-controller.js`: OK.
- `wxm-cms.remote.sample.json`: JSON valido.
- CMS local en navegador: contrato publicable, sin errores bloqueantes.
- CMS local en navegador: `wxm-cms.json` incluye `station`, `content`, `stream` y 11 rails.
- `./scripts/sync-android-assets.sh`: OK.
- `./gradlew clean assembleDebug`: BUILD SUCCESSFUL.

APK:

- Ruta: `android-webview/app/build/outputs/apk/debug/app-debug.apk`.
- Ultima compilacion: 2026-05-30 17:03:37 CEST.
- Tamano aproximado: 11 MB.

Pendiente:

- Fallback stream real.
- Endpoint de analytics remoto.
- Hosting HTTPS con login/admin y publicacion atomica.

## CMS Remoto 1.2 - Starter De Hosting Y Analytics - 2026-05-30

Motivo:

- El CMS avanzado con Analytics estaba duplicado dentro de `v2/cms/cms/`, mientras el panel activo `v2/cms/index.html` era una version mas simple.
- Era necesario convertir el CMS local en una ruta realista hacia hosting: endpoint publico para la app, publicacion protegida, backups, rollback y analytics anonimos.

Cambios aplicados:

- `v2/cms/index.html`: promovida la version avanzada con Analytics al panel activo.
- `v2/cms/assets/js/cms.js`: fusionado gate de publicacion con Analytics.
- `v2/cms/assets/js/cms.js`: el contrato app exportado incluye `station`, `content`, `analytics`, `stream`, `features`, `visual`, `audioExperience`, `homeRails`, `exploreRails` y `rails`.
- `v2/cms/assets/css/cms.css`: estilos de gate y botones deshabilitados preservados en el CMS avanzado.
- `v2/assets/data/wxm-cms.remote.sample.json`: agregado bloque `analytics`.
- `cms-remote-starter/`: creado starter de backend Node sin dependencias externas.
- `cms-remote-starter/server.js`: endpoints para health, `wxm-cms.json`, login, publicar, listar revisiones, rollback, ingesta analytics y resumen analytics.
- `cms-remote-starter/package.json`: scripts de arranque y validacion.
- `cms-remote-starter/.env.example`: variables de produccion.
- `cms-remote-starter/public/admin/index.html`: landing minima del admin remoto.
- `CMS_REMOTE_STARTER.md`: documentacion operativa.
- `CMS_REMOTE_CONTRACT.md`: actualizado con el starter remoto.
- `MCP.md`: actualizado con la fase CMS Remoto 1.2.

Pendiente:

- Conectar el panel visual completo directamente contra `/api/cms/publish`.
- Definir dominio/hosting real con HTTPS y credenciales.
- Activar endpoint remoto de analytics en produccion.
- Sustituir dashboard local/mock por resumen remoto agregado.

## CMS Remoto 1.3 - Analytics Console UX - 2026-05-30

Motivo:

- El panel de Analytics ocupaba una sola tarjeta grande y mezclaba demasiadas funciones en una vista.
- El preview movil y la validacion eran utiles al editar contenido, pero estorbaban cuando el operador queria revisar analitica.
- Las referencias compartidas pedian navegacion horizontal por areas como dashboard, quick stats, countries, players y referrers.

Cambios aplicados:

- `v2/cms/index.html`: se agrego boton `Ocultar preview`.
- `v2/cms/index.html`: Analytics ahora tiene menu horizontal con Dashboard, Quick stats, Paises, Players, Referidores y Eventos app.
- `v2/cms/assets/js/cms.js`: se agrego estado persistente para ocultar/mostrar preview y control de tabs de analytics.
- `v2/cms/assets/css/cms.css`: Analytics puede ocupar ancho completo y cada modulo queda en tarjetas individuales.
- Se sincronizo el CMS activo y la copia heredada `v2/cms/cms/` para evitar inconsistencias.

Validacion:

- `node --check v2/cms/assets/js/cms.js`: OK.

Pendiente:

- Conectar tabs a datos reales del backend remoto.
- Agregar filtros de fecha, export CSV y comparativas cuando exista endpoint remoto de analytics.

## CMS Remoto 1.4 - Mapa De Audiencia - 2026-05-31

Motivo:

- El dashboard necesitaba ubicar visualmente a los oyentes conectados por pais.
- La integracion con Google Maps es util, pero no debe ser obligatoria ni romper el CMS si falta API key.
- Las claves de terceros no deben exportarse en el contrato publico de la app.

Cambios aplicados:

- `v2/cms/index.html`: se agrego selector `Mapa de audiencia` y campo `Google Maps API key local`.
- `v2/cms/assets/js/cms.js`: se agrego render de mapa interno con marcadores por pais.
- `v2/cms/assets/js/cms.js`: se agrego carga condicional de Google Maps JavaScript API.
- `v2/cms/assets/js/cms.js`: si Google Maps no carga, el CMS vuelve al mapa interno automaticamente.
- `v2/cms/assets/js/cms.js`: la key se guarda solo en `localStorage` del administrador y no se exporta en `wxm-cms.json`.
- `v2/cms/assets/css/cms.css`: estilos para marcadores, mapa interno y estado Google Maps.

Validacion:

- `node --check v2/cms/assets/js/cms.js`: OK.

Pendiente:

- En hosting real, crear una API key restringida por dominio para el CMS.
- Conectar paises reales desde el backend de analytics, no desde muestra local.

## CMS Remoto 1.5 - Media Picker Local - 2026-05-31

Motivo:

- Los campos de imagen del CMS solo aceptaban rutas escritas manualmente.
- El operador necesitaba un selector de archivo para cargar imagenes desde el ordenador.
- Cada modulo necesitaba indicar tamano recomendado para evitar portadas pesadas o mal recortadas.

Cambios aplicados:

- `v2/cms/index.html`: Logo app e Imagen hero ahora tienen input de archivo, preview y recomendacion de tamano.
- `v2/cms/assets/js/cms.js`: los modulos con imagen ahora usan un control multimedia comun con URL manual, selector local, preview y boton limpiar.
- `v2/cms/assets/js/cms.js`: el CMS prepara imagenes locales en canvas, las redimensiona y las embebe como WEBP para borradores.
- `v2/cms/assets/js/cms.js`: la validacion acepta `assets/img/`, HTTPS y archivos locales embebidos seguros.
- `v2/cms/assets/js/cms.js`: el gate de publicacion advierte cuando hay imagenes embebidas, porque en produccion conviene subirlas a hosting/CDN HTTPS.
- `v2/cms/assets/css/cms.css`: estilos para hints, file picker y preview de imagenes.

Validacion:

- `node --check v2/cms/assets/js/cms.js`: OK.

Pendiente:

- En hosting real, reemplazar imagenes embebidas por URLs HTTPS generadas por un uploader del backend.
- Definir limites finales de peso por seccion cuando tengamos CDN o almacenamiento del CMS.

## CMS Remoto 1.6 - Asset Pipeline De Produccion - 2026-05-31

Motivo:

- El picker local resuelve el borrador, pero el JSON publico no debe depender de imagenes base64 pesadas.
- La app necesita recibir URLs estables HTTPS para logos, banners, noticias, programas y sponsors.
- El CMS remoto debe tener una primera ruta real para subir imagenes sin meter dependencias pesadas.

Cambios aplicados:

- `v2/cms/index.html`: se agrego tarjeta `Assets de produccion` con endpoint de subida, boton para subir imagenes locales y export de paquete media.
- `v2/cms/assets/js/cms.js`: se agrego recoleccion de imagenes embebidas, estado de pendientes, paquete `wxm-media-package.json` y subida al endpoint remoto.
- `v2/cms/assets/js/cms.js`: si el backend devuelve URL valida, el CMS reemplaza la imagen base64 por URL y refresca el contrato.
- `cms-remote-starter/server.js`: se agrego `POST /api/assets/upload` protegido por sesion.
- `cms-remote-starter/server.js`: se agrego `GET /api/assets/list` protegido por sesion.
- `cms-remote-starter/server.js`: valida MIME, firma binaria, tamano maximo y guarda archivos en `public/uploads/`.
- `cms-remote-starter/server.js`: sirve `/uploads/...` con cache immutable.
- `cms-remote-starter/.env.example`: se agrego `WXM_CMS_PUBLIC_BASE_URL`.
- `CMS_REMOTE_STARTER.md` y `cms-remote-starter/README.md`: documentacion de assets.

Validacion:

- `node --check v2/cms/assets/js/cms.js`: OK.
- `node --check cms-remote-starter/server.js`: OK.

Pendiente:

- Galeria visual de assets con reemplazo/borrado.
- Integrar login remoto del panel completo contra el starter.
- Configurar dominio HTTPS real para que `url` sea publica y aceptada por la app.

## CMS Remoto 1.7 - Sistema / Configuracion Centralizada - 2026-05-31

Motivo:

- Las configuraciones criticas estaban repartidas entre Stream, Analytics y Exportar.
- El operador necesita un area clara de Sistema donde se configuren endpoints, URLs de stream, publicacion, assets, emergencia, visual y audio.
- Cada campo de configuracion necesitaba una guia practica para evitar errores antes de produccion.

Cambios aplicados:

- `v2/cms/index.html`: se retiro `Stream` y `Exportar` del menu principal.
- `v2/cms/index.html`: `Sistema / Config` ahora incluye pestanas internas para Stream, Analytics, Emergencia, Visual y audio, Assets, Publicacion y Manual / FAQ.
- `v2/cms/index.html`: los campos de Stream principal, metadata API, fallbacks, analytics endpoints, Google Maps, endpoint CMS, endpoint assets, emergencia, visual y audio viven dentro de Sistema.
- `v2/cms/index.html`: Analytics queda como vista operativa y enlaza a su configuracion centralizada.
- `v2/cms/assets/js/cms.js`: se agrego control de tabs de Sistema y saltos directos hacia subpestanas.
- `v2/cms/assets/css/cms.css`: se agregaron estilos para tabs internas, encabezados de sistema y manual FAQ.
- `MCP.md`: se documento la regla de que toda configuracion operativa debe vivir en `Sistema / Config`.

Validacion:

- `node --check v2/cms/assets/js/cms.js`: OK.

Pendiente:

- Convertir el manual FAQ en documentacion editable desde CMS remoto cuando exista login/roles.
- Agregar permisos por rol para separar operador editorial, operador tecnico y administrador.

## CMS Remoto 1.8 - Organizacion Profesional Del Control Center - 2026-06-01

Motivo:

- El menu principal del CMS estaba demasiado plano y mezclaba responsabilidades editoriales, tecnicas y de negocio.
- El Dashboard mostraba metricas, pero no guiaba al operador hacia las tareas comunes.
- Antes de seguir creciendo el CMS, la estructura debia quedar mas clara para evitar desorden operativo.

Cambios aplicados:

- `v2/cms/index.html`: la navegacion principal se agrupo por areas: Centro de mando, Emisora, Contenido, Crecimiento y Tecnico.
- `v2/cms/index.html`: se renombro `Contenido` del menu a `Noticias / Replays` para aclarar su alcance.
- `v2/cms/index.html`: se agrego una grilla de accesos rapidos en Dashboard para Publicacion, Operacion tecnica, Contenido, Emisora, Analytics y Comunidad.
- `v2/cms/assets/css/cms.css`: estilos nuevos para grupos de navegacion, titulos de area y tarjetas de control room.
- `MCP.md`: se documenta la regla UX de separar trabajo editorial, tecnico y de crecimiento.

Validacion:

- `node --check v2/cms/assets/js/cms.js`: OK.
- HTML CMS sin IDs duplicados: OK.
- Navegador local: grupos de menu visibles, 6 accesos rapidos en Dashboard, navegacion a `Sistema / Config > Publicacion` OK y consola sin errores.

Pendiente:

- Definir roles futuros: operador editorial, operador tecnico, analista y administrador.
- En CMS remoto real, ocultar secciones segun permisos.

## CMS Remoto 1.9 - Configuracion Simplificada Por Capas - 2026-06-01

Motivo:

- `Sistema / Config` tenia todas las capacidades necesarias, pero exponia demasiadas opciones tecnicas en el mismo nivel.
- Para operar la emisora diariamente no hace falta ver endpoints avanzados, Google Maps, assets, CMC bruto y manual completo.
- La interfaz necesitaba mantener potencia sin aumentar friccion.

Cambios aplicados:

- `v2/cms/index.html`: `Sistema / Config` se reorganizo en `Operacion`, `App`, `Publicacion` y `Avanzado`.
- `v2/cms/index.html`: stream, metadata, reintentos, fallbacks y emergencia quedaron juntos en `Operacion`.
- `v2/cms/index.html`: tema, color, hero, perfil de audio y bajo consumo quedaron en `App`.
- `v2/cms/index.html`: `Publicacion` muestra solo el contrato que consume la app y el endpoint publico futuro.
- `v2/cms/index.html`: analytics remoto, Google Maps, assets, CMC bruto y Manual / FAQ se movieron a `Avanzado`.
- `v2/cms/assets/js/cms.js`: se agrego compatibilidad por alias para que accesos antiguos a `stream`, `analytics`, `emergency`, `visual`, `assets` y `faq` no rompan.
- `v2/cms/assets/css/cms.css`: estilos para tarjetas de sistema, ayudas contextuales y advertencia de modo avanzado.
- `MCP.md`: se documento la regla de divulgacion progresiva para configuracion operativa.

Validacion:

- Ejecutar `node --check v2/cms/assets/js/cms.js`.
- Verificar en navegador local que las 4 pestanas de Sistema funcionen y que los botones de Dashboard/Analytics salten a la pestana correcta.
- HTML CMS sin IDs duplicados: OK.
- Navegador local: `Operacion`, `App`, `Publicacion` y `Avanzado` activan sus paneles correctos; accesos de Dashboard y Analytics saltan a la pestana esperada.

## CMS Remoto 2.0 - Modo Operador Seguro - 2026-06-02

Motivo:

- Aunque `Sistema / Config` ya estaba simplificado, la pestana `Avanzado` seguia visible al operador normal.
- El Dashboard no mostraba de forma directa si el contrato estaba listo para publicar.
- `Recargar CMC` podia descartar un borrador local sin confirmacion.

Cambios aplicados:

- `v2/cms/index.html`: se agrego tarjeta `Publicacion` en Dashboard con estado resumido del contrato.
- `v2/cms/index.html`: la pestana `Avanzado` queda oculta por defecto y se controla con `Mostrar avanzado`.
- `v2/cms/assets/js/cms.js`: se agrego persistencia local `wxm_cms_advanced_visible`.
- `v2/cms/assets/js/cms.js`: los saltos hacia `advanced` revelan automaticamente el modo avanzado.
- `v2/cms/assets/js/cms.js`: la tarjeta de publicacion usa el mismo gate de validacion que bloquea/copia/descarga `wxm-cms.json`.
- `v2/cms/assets/js/cms.js`: `Recargar CMC` pide confirmacion cuando existe borrador local.
- `v2/cms/assets/js/cms.js`: se agrego salida `Salir de avanzado` para regresar a `Operacion` y ocultar herramientas tecnicas.
- `v2/cms/assets/css/cms.css`: estilos para tarjeta de publicacion, estados `ok/warn/bad`, boton avanzado y layout sin solape con preview.
- `MCP.md`: se documento la regla de modo operador seguro.

Validacion:

- `node --check v2/cms/assets/js/cms.js`: OK.
- HTML CMS sin IDs duplicados: OK, 105 IDs.
- Navegador local: Dashboard muestra tarjeta `Publicacion` con estado `Publicable con advertencias`.
- Navegador local: `Mostrar avanzado` revela herramientas tecnicas y `Salir de avanzado` vuelve a `Operacion`, ocultando `Avanzado`.
- Navegador local: salto desde Analytics a configuracion avanzada revela `Avanzado` automaticamente.
- Navegador local: corregido solape entre `Sistema / Config` y preview lateral usando columnas explicitas, `min-width: 0` y limites de ancho internos.

## CMS Analytics 2.1 - Dashboard Analitico Profesional - 2026-06-02

Motivo:

- La analitica ya tenia secciones importantes, pero todavia no estaba al nivel visual/operativo de los ejemplos de referencia.
- Quick stats, countries, players y referrers necesitaban tablas y graficas propias para no depender de una sola tarjeta generica.
- El CMS debia poder distinguir audiencia de la app WXM frente a navegador, directo, dominio web y reproductores externos.

Cambios aplicados:

- `v2/cms/index.html`: se agrego rango visible de periodo en Analytics.
- `v2/cms/index.html`: Dashboard ahora incluye donuts `Top 5 paises` y `Top 5 players`.
- `v2/cms/index.html`: Dashboard ahora incluye tarjeta `Live Connections` con mapa y lista de conexiones recientes.
- `v2/cms/index.html`: Quick stats ahora tiene tres tarjetas graficas: listening hours, unique listeners y access count.
- `v2/cms/index.html`: Paises, Players y Referidores ahora tienen tablas detalladas propias.
- `v2/cms/assets/js/cms.js`: se agregaron normalizadores para `periodRange`, `quickSeries` y `distinctIps`.
- `v2/cms/assets/js/cms.js`: se agregaron renderizadores reutilizables de donuts y tablas analiticas.
- `v2/cms/assets/js/cms.js`: el renderer de mapa ahora soporta multiples contenedores para Dashboard y Paises, con fallback local y soporte Google Maps.
- `v2/cms/assets/js/cms.js`: el fallback local ahora genera un mapa mundial SVG propio con continentes estilizados, sin depender de imagen externa.
- `v2/cms/assets/js/cms.js`: se agregaron datos de Finland y Hungary al mapa local agregado.
- `v2/cms/assets/css/cms.css`: se agregaron estilos para rango de periodo, grilla quick stats, tarjeta Live Connections, mapa azul con continentes, pines de ubicacion, donuts y tablas detalladas.
- `v2/assets/data/wxm-cmc.json`: se actualizo el mock local de analytics con periodo, quick series, paises, live connections, players, referidores y usuarios desde WXM Android App.
- `MCP.md`: se documento la fase Analytics 2.1 y reglas de UX.

Validacion:

- `node --check v2/cms/assets/js/cms.js`: OK.
- `v2/assets/data/wxm-cmc.json`: JSON valido.
- HTML CMS sin IDs duplicados: OK, 119 IDs.
- Navegador local: Analytics abre correctamente.
- Navegador local: Dashboard muestra 5 tarjetas, 2 graficas y 2 donuts.
- Navegador local: Dashboard muestra `Live Connections` con 5 conexiones recientes y 6 marcadores en mapa.
- Navegador local: Dashboard muestra mapa mundial SVG con 8 masas continentales estilizadas y pines dinamicos.
- Navegador local: Quick stats muestra 3 graficas y tabla comparativa.
- Navegador local: Paises muestra mapa/lista y tabla con 6 paises.
- Navegador local: Players muestra grafica y tabla con WXM Android App, Web Browser y External Player.
- Navegador local: Referidores muestra grafica y tabla con WXM Android App, Direct y wxmoneradio.com.
- Navegador local: Eventos app conserva el contrato de eventos anonimos.

Pendiente:

- Backend remoto de ingest anonimo.
- Agregacion server-side de paises, players, referidores y periodos.
- Export real CSV/PDF desde backend.
- Geolocalizacion agregada sin exponer IPs al operador.

## CMS Analytics 2.1.1 - Mapa Atlas Operativo - 2026-06-03

Motivo:

- El mapa SVG interno anterior funcionaba, pero visualmente no estaba al nivel de un panel de analytics profesional.
- La referencia operativa deseada es un mapa tipo dashboard: paises claros, pais activo resaltado y lectura rapida de conexiones recientes.

Cambios aplicados:

- `v2/cms/assets/js/cms.js`: el fallback local del mapa ahora separa continentes, overlays de paises activos y lineas internas de frontera simuladas.
- `v2/cms/assets/css/cms.css`: el mapa interno cambia a estilo atlas claro, con tierra cian suave, paises activos azules y marcadores compactos de conexiones.
- `v2/cms/index.html`: cache-buster actualizado a `20260603-atlasmap`.
- `MCP.md`: documentada la regla de mapa interno visual aproximado y ruta futura para cartografia precisa con Google Maps o dataset licenciado.

Validacion:

- `node --check v2/cms/assets/js/cms.js`: OK.
- `v2/assets/data/wxm-cmc.json`: JSON valido.

Pendiente:

## CMS Analytics 2.2 - World Atlas React/D3/TopoJSON - 2026-06-05

Motivo:

- El mapa operativo anterior era util como fallback, pero no cumplia el nivel visual solicitado para un dashboard premium tipo global broadcast.
- Se pidio un World Atlas realista con paises reales, fronteras internas, glow magenta WXM, zoom/pan, tooltip y rutas animadas desde Republica Dominicana.

Archivos creados:

- `v2/cms/assets/react/WxmWorldAtlasMap.jsx`: componente fuente React preparado para un build system futuro.
- `v2/cms/assets/react/WxmWorldAtlasMap.runtime.js`: runtime UMD sin build que monta el componente en el CMS vanilla actual.
- `v2/cms/assets/vendor/react.production.min.js`: React local para el CMS.
- `v2/cms/assets/vendor/react-dom.production.min.js`: ReactDOM local para el CMS.
- `v2/cms/assets/vendor/d3.min.js`: D3 local para proyeccion, path y zoom.
- `v2/cms/assets/vendor/topojson-client.min.js`: cliente TopoJSON local.
- `v2/cms/assets/maps/countries-110m.json`: dataset TopoJSON real de paises.

Archivos modificados:

- `v2/cms/index.html`: carga vendor local React/D3/TopoJSON y el runtime del mapa antes de `cms.js`.
- `v2/cms/assets/js/cms.js`: `renderLocalAudienceMap` ahora intenta montar `WxmWorldAtlasMap` y conserva el fallback SVG si el atlas no esta disponible.
- `v2/cms/assets/css/cms.css`: nueva capa visual dark atlas con paises inactivos graphite, activos magenta, rutas animadas, tooltip, leyenda y fondo premium.
- `MCP.md`: regla operativa actualizada para que el mapa oficial del CMS sea React + D3 + TopoJSON.

Arquitectura agregada:

- El CMS sigue siendo vanilla JS, pero ahora puede montar una isla React solamente para el mapa.
- D3 genera la proyeccion `geoNaturalEarth1`, rutas curvas, graticula y zoom/pan.
- TopoJSON entrega paises reales, fronteras internas e islas principales.
- El mapa usa paises activos desde `analytics.countries` y garantiza Republica Dominicana + destinos WXM como nodos de transmision.

Validacion:

- `node --check v2/cms/assets/js/cms.js`: OK.
- `node --check v2/cms/assets/react/WxmWorldAtlasMap.runtime.js`: OK.
- `v2/cms/assets/maps/countries-110m.json`: JSON valido.
- Browser local en `http://localhost:8108/cms/index.html?v=react-atlas-fixed-selected`: OK.
- DOM verificado: 2 instancias de atlas activas, 354 paths de paises en total, 14 rutas animadas en total, 2 nodos de origen, 0 mapas fallback y 0 errores de consola.

Pendiente:

- Conectar datos reales de audiencia por pais desde backend analytics remoto.
- Si se requiere precision por ciudad o coordenadas exactas, agregar geolocalizacion agregada server-side sin exponer IPs al operador.

- Conectar datos reales de pais/ciudad desde backend remoto de analytics.
- Usar Google Maps o dataset cartografico real cuando se necesite precision geografica y zoom por ciudad.
- No se encontro un dataset cartografico local en el proyecto; el mapa interno queda como fallback visual seguro, no como cartografia exacta.

## CMS Analytics 2.3 - Pulido Operativo Atlas/Export - 2026-06-06

Motivo:

- El mapa ya estaba en React/D3/TopoJSON, pero faltaban controles visibles y datos de tooltip utiles para operacion diaria.
- Las secciones vacias de analytics podian parecer rotas si todavia no habia datos reales del backend.
- El boton de exportacion entregaba solo JSON; para operacion de emisora tambien conviene CSV.

Archivos modificados:

- `v2/cms/assets/react/WxmWorldAtlasMap.jsx`: controles +, -, reset, tooltip enriquecido y seleccion accesible por teclado.
- `v2/cms/assets/react/WxmWorldAtlasMap.runtime.js`: runtime del CMS sincronizado con la fuente React.
- `v2/cms/assets/css/cms.css`: estilos de controles de mapa, tooltip con detalle, empty states y ajustes visuales WXM en Live Connections.
- `v2/cms/assets/js/cms.js`: empty states para listas/rankings/donas sin datos y exportacion JSON + CSV.
- `MCP.md`: reglas permanentes para atlas, empty states y export analytics.

Validacion:

- `node --check v2/cms/assets/js/cms.js`: OK.
- `node --check v2/cms/assets/react/WxmWorldAtlasMap.runtime.js`: OK.

Pendiente:

- Verificar visualmente en navegador despues de sincronizar NEXTGEN.
- Conectar el dashboard a un endpoint real de analytics cuando el CMS remoto/hosting este desplegado.

## CMS Analytics 2.4 - Adaptador Remoto Seguro - 2026-06-08

Motivo:

- El panel CMS ya tenia campo `dashboardEndpoint`, pero el dashboard seguia dependiendo de datos locales/mock.
- Para operar como emisora real, el CMS necesita consultar un backend privado de analytics y conservar fallback local si el backend falla.

Archivos modificados:

- `v2/cms/index.html`: se agrego el boton `Actualizar remoto` en la barra de Analytics.
- `v2/cms/assets/js/cms.js`: se agrego adaptador remoto con timeout, credenciales, fallback local, normalizacion de payload remoto y proteccion de endpoint admin.
- `cms-remote-starter/server.js`: `POST /api/analytics/ingest` guarda eventos anonimos enriquecidos y `GET /api/analytics/summary` devuelve un payload `analytics` completo compatible con el CMS.
- `cms-remote-starter/README.md`: documentacion de eventos y resumen analytics remoto.
- `MCP.md`: reglas permanentes para analytics remoto seguro.

Arquitectura agregada:

- El CMS admin puede consultar `analytics.dashboardEndpoint` por HTTPS en produccion y por `localhost/127.0.0.1` solo en desarrollo.
- La app publica no recibe endpoints admin locales en el contrato exportado.
- El starter remoto agrega por pais, player, source client, referrer, conexiones vivas, audiencia realtime y usuarios provenientes de `wxm_android_app`.
- El backend usa `anonId` pseudonimo hasheado y no guarda IP cruda en eventos.
- Las horas de escucha solo se calculan si la app envia `durationSeconds`; mientras no exista ese dato, se muestran en 0 para evitar metricas falsas.

Validacion:

- `node --check v2/cms/assets/js/cms.js`: OK.
- `node --check cms-remote-starter/server.js`: OK.
- Servidor temporal local en `127.0.0.1:8799`: OK.
- `GET /health`: OK.
- `POST /api/auth/login`: OK.
- `POST /api/analytics/ingest`: OK, evento aceptado.
- `GET /api/analytics/summary`: OK, devuelve `analytics`, `liveConnections`, `countries`, `players`, `referrers` y `appUsers`.

Pendiente:

- Sustituir almacenamiento NDJSON por base de datos real para produccion.
- Agregar geolocalizacion agregada server-side sin exponer IP.
- Enviar eventos reales de duracion/session_end desde Android para calcular listening hours.
- Export CSV/PDF desde backend protegido.

## CMS Analytics 2.5 - Admin Remoto Y Caribe Operativo - 2026-06-09

Motivo:

- El servidor remoto ya tenia APIs de login y endpoints protegidos, pero la ruta `/admin` era solo una landing.
- El mapa mundial React/D3/TopoJSON era correcto para paises grandes, pero el Caribe necesitaba lectura operativa propia porque islas y territorios pequenos no se distinguen bien en escala mundial.

Archivos modificados:

- `cms-remote-starter/public/admin/index.html`
- `v2/cms/assets/react/WxmWorldAtlasMap.jsx`
- `v2/cms/assets/react/WxmWorldAtlasMap.runtime.js`
- `v2/cms/assets/css/cms.css`
- `MCP.md`
- `NEXTGEN_MIGRATION_REPORT.md`
- `cms-remote-starter/README.md`

Implementado:

- Consola admin remota minima:
  - login;
  - estado de sesion;
  - logout;
  - lectura de CMS actual;
  - lectura de analytics;
  - KPIs basicos y preview del JSON publicado.
- Atlas con capa Caribe:
  - Antillas Mayores;
  - Antillas Menores;
  - costa continental caribena;
  - territorios como nodos operativos;
  - boton de zoom `Caribe`;
  - tooltips;
  - resumen responsive.
- CSS del atlas ajustado para pantallas estrechas, evitando que controles, leyenda e inset se monten entre si.

Pendiente:

- Convertir la consola admin remota minima en CMS remoto completo con roles, auditoria, editor visual y base de datos.
- Persistir analytics en base de datos productiva.
- Si se requiere precision geografica fina para cada isla, agregar un GeoJSON caribeno de mayor resolucion como capa adicional.

Rollback:

- Reemplazar los archivos anteriores desde la copia original o desactivar el runtime `WxmWorldAtlasMap`; el CMS volvera al fallback SVG interno si React/D3/TopoJSON no cargan.

## Post-Git Operational Baseline - 2026-06-10

Motivo:

- El proyecto ya estaba lo bastante avanzado para versionarlo como suite oficial y dejar un punto estable antes de continuar con cambios de mayor alcance.
- Era necesario separar `main` estable de una rama de trabajo `dev`, agregar reglas de release y automatizar verificaciones minimas.

Archivos creados:

- `README.md`
- `RELEASE_CHECKLIST.md`
- `.github/workflows/ci.yml`

Archivos modificados:

- `MCP.md`
- `NEXTGEN_MIGRATION_REPORT.md`

Git:

- Remoto oficial: `https://github.com/angeltheks/WXM-ENTERPRISE-SUITE`.
- Baseline inicial en `main`: `86fdee0`.
- Tag estable: `v0.1.0-baseline`.
- Rama de trabajo: `dev`.

Arquitectura operativa agregada:

- El README raiz documenta rutas activas, estructura del suite, comandos de CMS, app web, admin remoto y build Android.
- El checklist de release define validaciones antes de generar APK o promover cambios.
- GitHub Actions valida higiene del repo, sintaxis JavaScript critica y build Android debug.

Reglas de continuidad:

- Continuar el desarrollo diario en `dev`.
- Promover a `main` solo cuando compile y pase checklist.
- No subir APKs, builds, `.gradle`, `node_modules`, `.env`, `local.properties`, uploads ni bases de datos runtime.
- Publicar binarios mediante GitHub Releases o artefactos de CI, no como archivos trackeados.

Rollback:

- Para volver al baseline estable:
  - `git switch main`
  - `git reset --hard v0.1.0-baseline`
- Si solo falla la capa post-Git, revertir el commit que agrega `README.md`, `RELEASE_CHECKLIST.md`, `.github/workflows/ci.yml` y esta seccion documental.

Pendiente:

- Subir `dev` y el tag `v0.1.0-baseline` al remoto.
- Confirmar que el CI remoto corre correctamente en GitHub.
- Crear milestones/issues por fase para ordenar el cierre de CMS remoto, analytics persistente, Android media service y futura migracion Compose.

## Project Governance Directive - 2026-06-10

Motivo:

- El proyecto necesitaba una fuente unica de verdad para evitar trabajar en copias paralelas y mezclar APKs, CMS o assets de carpetas historicas.
- La nueva direccion define a WXM como una suite enterprise, no solo como un reproductor Android.

Fuente oficial:

```text
/Users/mac/AndroidProjects/Reprov2_NEXTGEN
```

Repositorios/carpetas historicas:

```text
/Users/mac/AndroidProjects/Reprov2
/Users/mac/Desktop/Reprov2
```

Repositorio oficial:

```text
angeltheks/WXM-ENTERPRISE-SUITE
```

Archivos creados:

- `WXM_PROJECT_CONTEXT.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/API_CONTRACT.md`
- `docs/DATABASE.md`
- `docs/SECURITY.md`
- `docs/DEPLOYMENT.md`
- `docs/WORLD_ATLAS.md`

Archivos modificados:

- `README.md`
- `MCP.md`
- `NEXTGEN_MIGRATION_REPORT.md`

Decision tecnica:

- No se movieron carpetas runtime todavia.
- `android-webview/`, `v2/` y `cms-remote-starter/` permanecen en su ubicacion actual porque Android packaging, previews locales, CMS, scripts y CI dependen de esas rutas.
- La estructura `apps/`, `cms/`, `analytics/`, `crm/`, `streaming/`, `shared/` e `infrastructure/` queda como arquitectura objetivo para una migracion controlada futura.

Rollback:

- Revertir el commit de gobernanza restaura la documentacion anterior.
- No hay cambios funcionales de runtime en esta fase.

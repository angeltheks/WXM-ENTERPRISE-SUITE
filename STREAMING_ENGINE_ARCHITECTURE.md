# Streaming Engine Architecture - WXM ONE RADIO NEXTGEN

## Estado

Implementacion inicial compilada en `/Users/mac/AndroidProjects/Reprov2_NEXTGEN`.

## Flujo actual

```text
WebView UI
  |
AndroidAudioBridge
  |
RadioPlaybackService
  |-- WxmPlaybackNotificationManager
  |-- WxmLegacyMediaSessionController
  |-- WxmArtworkLoader
  |-- WxmPlaybackRecoveryController
  |-- WxmPlaybackCommand
  |
WxmStreamEngine
  |-- WxmFallbackManager
  |-- WxmRetryPolicy
  |-- WxmNetworkMonitor
  |-- WxmPlaybackTelemetry
  |-- WxmDataSourceFactory
  |
ExoPlayer + WxmBufferEngine + WxmAudioProcessor
  |
WxmBridgeStatusStore -> WXMAndroidAudio.getPlaybackStatus() -> WebView UI
```

## Componentes

### WxmStreamEngine

Coordina la fuente activa, marca health del stream, consulta el score de red, decide retry y registra cambios de fallback.

- Valida runtime primary con `WxmStreamUrlPolicy`.
- Mantiene un ciclo de vida observable (`WxmStreamLifecycleState`) y publica `WxmStreamSnapshot`.
- Expone la ultima razon de transicion y cuantos runtime primary inseguros fueron rechazados.

### WxmFallbackManager

Mantiene la lista de fuentes ordenadas por prioridad.

- Sanitiza URLs `https://`.
- Deduplica fuentes por URL.
- Mantiene salud independiente por fuente.
- Soporta primario dinamico y fallbacks configurables.
- Usa `WxmFallbackPolicy` con cooldown por fuente, cuarentena y ventana minima entre probes al primario.
- Selecciona fallback por salud, prioridad y numero de fallos en lugar de recorrer una lista ciega.
- Salta fuentes en cooldown/cuarentena y expone `allStreamsExhausted` junto a `allStreamsUnavailableNow`.
- Publica snapshots por fuente con health, elegibilidad, fallos, ultimo exito, cooldown y cuarentena restante.
- Permite `beginNewFallbackRound()` para reconexion manual y `tryRecoverPrimary()` para recuperacion controlada del primario.
- En operacion actual solo hay una URL real, por lo tanto el codigo esta listo pero necesita URLs fallback reales para probar switch completo.

### WxmRetryPolicy

Implementa:

- exponential backoff con jitter;
- limite por fuente;
- cooldown por rafaga de fallos;
- clasificacion de `offline`, `poor_network`, `network_timeout`, `network_io`, `stream_unavailable`, `decoder_recoverable` y errores no recuperables;
- proteccion contra loops infinitos;
- reset de rafaga al recuperar playback estable.
- Los estados `offline` y `cooldown` no consumen intentos de la fuente.
- El estado `offline` tampoco alimenta la rafaga de fallos, porque describe ausencia de red del dispositivo y no salud de la fuente.
- Los errores no recuperables conservan prioridad sobre el score de red para evitar retries falsos.
- El estado de burst/cooldown se conserva por `sourceId`; cambiar a fallback ya no hereda el castigo de otra fuente.

### WxmBufferEngine

Crea `DefaultLoadControl` con perfiles:

- `STANDARD`
- `LOW_LATENCY`
- `STABLE_RADIO`
- `POOR_NETWORK`
- `BATTERY_SAVER`

El perfil ya no se resuelve solo desde `WxmNetworkScore`.

- Usa una ventana movil de telemetria para medir rebuffer reciente y tiempo acumulado de buffering.
- Clasifica salud de buffer (`STABLE`, `WATCH`, `PRESSURED`, `CRITICAL`).
- Mantiene perfil activo y perfil recomendado por separado.
- Escala proteccion de inmediato cuando sube la presion.
- Solo desescala tras una ventana estable para evitar oscilaciones.
- Tiene en cuenta red medida, red excelente y red pobre.
- Expone `WxmBufferSnapshot` con razon de decision, presion reciente y cambios pendientes.

### WxmNetworkMonitor

Usa `ConnectivityManager` y `NetworkCapabilities` para clasificar la red:

- `OFFLINE`
- `CRITICAL`
- `POOR`
- `ACCEPTABLE`
- `GOOD`
- `EXCELLENT`

Ademas publica `WxmNetworkSnapshot` con:

- conectividad;
- validacion;
- red medida;
- transporte;
- downstream estimado;
- timestamp;
- score anterior;
- contador de cambios;
- ultimo cambio;
- ultima conexion;
- ultima desconexion.

Registra `NetworkCallback` para reaccionar a cambios de red sin depender solo de polling.

### WxmPlaybackTelemetry

Implementa `AnalyticsListener` de Media3 para contabilizar buffering, errores, estimacion de ancho de banda, retries y fallback switches.

Ademas mantiene metricas de sesion:

- requests de reproduccion;
- resumes, pausas y stops;
- duracion efectiva de playback por segmentos activos;
- ultimo y promedio de startup;
- buffering abierto y acumulado;
- metadata recibida;
- ultima razon de pausa;
- ultimo estado del player;
- underruns del sink de audio;
- recuperaciones del watchdog;
- telemetria HTTP de bajo nivel.

### WxmDataSourceFactory

Usa `OkHttpDataSource.Factory` de Media3 con:

- User-Agent propio `WXM-ONE-RADIO-Android/1.1.1 Media3`.
- `connectTimeoutMs`.
- `readTimeoutMs`.
- `writeTimeoutMs`.
- `callTimeoutMs`.
- Headers seguros.
- `Icy-MetaData: 1`.
- Bloqueo de cualquier request no HTTPS.
- Medicion de bytes transferidos hacia telemetria local.

### WxmNetworkEngine

Encapsula la capa de red profesional y evita que `RadioPlaybackService` conozca detalles del cliente HTTP.

- Crea `OkHttpClient` mediante `WxmOkHttpClientFactory`.
- Configura pool de conexiones para streaming continuo.
- Expone `MediaSource.Factory` ya cableado a Media3.
- Mantiene la configuracion de red centralizada.
- Desactiva `callTimeout` global para llamadas de streaming infinitas; usa timeouts de conexion/lectura para detectar fallas sin matar por duracion una emision sana.

### WxmOkHttpClientFactory

Configura:

- `connectTimeout`, `readTimeout`, `writeTimeout`, `callTimeout`.
- `retryOnConnectionFailure`.
- `ConnectionPool`.
- `WxmHttpsOnlyInterceptor`.
- `WxmSafeLoggingInterceptor`.

### WxmDataRepository / Room

La fase de persistencia nativa se introduce sin romper el frontend WebView actual.

Room contiene:

- favoritos;
- historial musical;
- snapshots de telemetria;
- configuracion de streams;
- perfil de audio;
- cache de caratulas;
- ultimo estado de reproduccion.

### Preparacion para MediaSessionService

Antes de iniciar la migracion moderna, `RadioPlaybackService` deja de contener directamente varias piezas perifericas:

- `WxmPlaybackNotificationManager`: canal y construccion de notificaciones multimedia.
- `WxmLegacyMediaSessionController`: estado y metadata de la sesion legacy actual.
- `WxmPlaybackSessionController`: contrato interno para sustituir la sesion legacy por Media3 sin tocar la orquestacion.
- `WxmArtworkLoader`: carga segura HTTPS de caratulas.
- `WxmPlaybackRecoveryController`: watchdog y scheduling de recuperacion.
- `WxmPlaybackCommand`: parser tipado para comandos que llegan desde WebView, notificacion, lock screen y futuras sesiones nativas.

Esta separacion conserva el foreground service actual, pero reduce el radio de cambio cuando se migre a Media3 `MediaSessionService`.

La primera migracion usa doble escritura:

- el frontend conserva `localStorage`;
- Android persiste en paralelo perfil, metadata, streams, estado y telemetria;
- el bridge publica `dataLayer` para verificar disponibilidad y timestamps de escritura.

Esto permite mover las lecturas al almacenamiento nativo en una fase posterior sin perder compatibilidad ni requerir una migracion brusca.

## Estabilidad De Audio

- En radio en vivo no se usa `LOW_LATENCY` automaticamente: el perfil recomendado para red buena/excelente es `STABLE_RADIO`.
- `callTimeout` global se mantiene desactivado para que OkHttp no corte una conexion de streaming por duracion total.
- `BUFFERING` conserva su estado propio y no se convierte artificialmente en `PAUSED`.
- El frontend Android solo muestra `PLAYING` cuando el servicio nativo lo confirma por bridge.
- Android reproduce la URL canonica del stream sin query efimera `?nocache=`.
- `WxmAudioProcessor` reutiliza buffers internos para no provocar asignaciones dentro del camino real-time.
- `RadioPlaybackService` ejecuta un watchdog:
  - recupera `READY` sin progreso a los 15 s;
  - recupera `BUFFERING` prolongado a los 45 s;
  - expone las recuperaciones al bridge y telemetria.
- `WxmOkHttpEventListener`.

### WxmOkHttpEventListener

Registra:

- Inicio y fin de llamada.
- DNS.
- Handshake TLS.
- Conexion TCP.
- Codigo HTTP final.
- Duracion total y fallos de conexion.

### WxmBridgeStatusStore

Publica un snapshot JSON del motor nativo para el frontend:

- Estado de reproduccion.
- Score de red.
- Perfil de buffer.
- Stream activo.
- Health/fallback.
- Perfil DSP.
- Ruta de audio.
- Spatializer.
- Retries y errores.
- `network` detallado.
- `streamLifecycle` detallado.

## Seguridad

- Solo se aceptan URLs `https://`.
- El stream HTTP no seguro se ignora.
- No se agregaron secretos.
- No se agregaron logs sensibles.

## Pendiente NEXTGEN

- Cierre de la migracion Room: lecturas nativas hacia frontend, cache fisica de caratulas y politica de retencion/compactacion.
- Fallback URLs reales desde hosting/CMS para validar conmutacion operativa.
- Cierre operativo de Fase 9.5: validacion fisica prolongada, comparacion contra TuneIn, prueba con cambio de hora del sistema y revision de incidentes de continuidad.

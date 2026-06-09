# Testing Checklist - WXM ONE RADIO NEXTGEN

## Build

- [x] `./gradlew assembleDebug` compila en `Reprov2_NEXTGEN`.
- [x] APK generada en `/Users/mac/AndroidProjects/Reprov2_NEXTGEN/android-webview/app/build/outputs/apk/debug/app-debug.apk`.
- [x] `node --check` valida `v2/assets/js/audio-engine.js`.
- [x] `node --check` valida `v2/assets/js/ui-controller.js`.

## Gate Fase 9.5

- [ ] Ejecutar sesion comparativa contra TuneIn con el mismo telefono/red.
- [ ] Reproducir 60 minutos en Android fisico y registrar cortes, underruns y watchdog recoveries.
- [ ] Confirmar que `dataLayer.persistenceFailureCount` permanece en `0` durante una sesion sana.
- [ ] Confirmar que `telemetry.audioUnderrunCount` y `telemetry.watchdogRecoveryCount` se guardan tambien en Room.
- [ ] Cambiar manualmente la hora del telefono durante playback y confirmar que duraciones, retries y fallback no se alteran.
- [ ] Confirmar que no se abre una fase nueva con pendientes P0/P1 sin resolver.

## Playback

- [ ] Abrir app en emulador.
- [ ] Abrir app en Android fisico.
- [ ] Reproducir stream principal.
- [ ] Pausar desde app.
- [ ] Reanudar desde app.
- [ ] Parar desde notificacion.
- [ ] Confirmar que lock screen muestra metadata y artwork.
- [ ] Confirmar que background playback sigue activo.
- [ ] Confirmar que la notificacion expandida muestra `Reconectar`, `Reproducir/Pausar` y `Detener`.
- [ ] Confirmar que la notificacion compacta muestra `Reproducir/Pausar` y `Detener` sin botones duplicados.
- [ ] Confirmar que `Reconectar` reinicia el stream sin cerrar la app.
- [ ] Reproducir 10 minutos y confirmar que no hay corte periodico por timeout global.
- [ ] Reproducir 30-60 minutos con pantalla bloqueada y confirmar continuidad.
- [ ] Confirmar que la ruta Android usa la URL canonica del stream sin `?nocache=`.

## Network / Retry

- [ ] Activar modo avion y confirmar estado limpio.
- [ ] Desactivar modo avion y confirmar recuperacion.
- [ ] Cambiar WiFi/datos y confirmar continuidad.
- [ ] Confirmar que `network.transport`, `validated`, `metered` y `downstreamKbps` cambian con la red real.
- [ ] Confirmar que `network.previousScore`, `changeCount`, `lastChangedAtMs`, `lastConnectedAtMs` y `lastDisconnectedAtMs` cambian solo con transiciones reales.
- [ ] Simular red lenta y confirmar buffer estable.
- [ ] Forzar timeout y confirmar razon `network_timeout`.
- [ ] Forzar red pobre y confirmar razon `poor_network`.
- [ ] Forzar varias fallas seguidas y confirmar `burst_cooldown`.
- [ ] Confirmar que al volver a `READY` se limpia el estado de rafaga.
- [ ] Confirmar que `offline_wait` no consume intentos de la fuente.
- [ ] Confirmar que `offline_wait` no dispara `burst_cooldown`.
- [ ] Confirmar que un error de formato no recuperable no se reintenta aunque la red sea pobre.
- [ ] Confirmar que el cooldown de retry es por fuente y no se hereda al cambiar a fallback.
- [ ] Probar URL fallback real cuando exista.
- [ ] Confirmar que fuentes `http://` y duplicadas se descartan.
- [ ] Confirmar que un fallback fallido no se vuelve a elegir durante la misma ronda.
- [ ] Confirmar estado `unavailable` cuando todas las fuentes queden agotadas.
- [ ] Confirmar que una fuente entra en cooldown tras fallar y en cuarentena tras fallos consecutivos.
- [ ] Confirmar que `streamSources` expone `eligible`, fallos, cooldown y cuarentena por fuente.
- [ ] Confirmar que la recuperacion al primario respeta el intervalo minimo y no reinicia el stream sano por timers antiguos.
- [ ] Confirmar que `allStreamsUnavailableNow` se activa durante una espera temporal y se limpia al volver a haber una fuente elegible.
- [ ] Confirmar que `networkConfig.callTimeoutMs = 0` durante streaming continuo.

## Buffer Engine

- [ ] Confirmar que el perfil inicial se decide segun `network` y no solo por un valor fijo.
- [ ] Forzar varios rebuffers y confirmar que `buffer.health` sube a `PRESSURED` o `CRITICAL`.
- [ ] Confirmar que `buffer.recommendedProfile` escala a `STABLE_RADIO` o `POOR_NETWORK` bajo presion.
- [ ] Confirmar que `buffer.activeProfile` solo cambia al crear un nuevo reproductor/reinicio controlado.
- [ ] Confirmar que el desescalado respeta la histeresis antes de volver a perfiles menos protectores.
- [ ] Confirmar que red medida estable puede recomendar `BATTERY_SAVER`.
- [ ] Confirmar que redes `GOOD` y `EXCELLENT` recomiendan `STABLE_RADIO`, no `LOW_LATENCY`.
- [ ] Confirmar que `telemetry.currentlyBuffering` refleja buffering en curso.

## Playback Telemetry

- [ ] Confirmar que cada inicio incrementa `playbackRequestCount`.
- [ ] Confirmar que `lastStartupDurationMs` y `averageStartupDurationMs` se completan al llegar a `READY`.
- [ ] Confirmar que `playbackDurationMs` crece solo mientras hay audio reproduciendose.
- [ ] Confirmar que pausar y detener incrementan `playbackPauseCount` y `playbackStopCount`.
- [ ] Confirmar que interrupcion por foco registra `lastPauseReason = audio_focus`.
- [ ] Confirmar que un error corta el segmento activo y registra `lastPauseReason = error`.
- [ ] Confirmar que `metadataUpdateCount` y `lastMetadataUpdatedAtMs` cambian al recibir metadata.
- [ ] Confirmar que `audioUnderrunCount` permanece en `0` durante una sesion sana.
- [ ] Forzar un stall y confirmar que `watchdogRecoveryCount` sube y `lastWatchdogReason` explica la recuperacion.

## Room Data Layer

- [ ] Confirmar que la APK crea la base `wxm_nextgen.db`.
- [ ] Confirmar que `dataLayer.roomReady = true`.
- [ ] Cambiar perfil/volumen y confirmar que `lastAudioProfilePersistAtMs` cambia.
- [ ] Reproducir/pausar/detener y confirmar que `lastPlaybackStatePersistAtMs` cambia.
- [ ] Recibir metadata nueva y confirmar que `lastHistoryPersistAtMs` cambia.
- [ ] Mantener playback activo y confirmar que `lastTelemetryPersistAtMs` cambia sin escribir mas rapido que el throttle.
- [ ] Confirmar que la tabla `telemetry` conserva `audioUnderrunCount`, `lastAudioUnderrunAtMs`, `lastAudioUnderrunElapsedSinceLastFeedMs`, `watchdogRecoveryCount` y `lastWatchdogReason`.
- [ ] Forzar un fallo controlado de Room y confirmar que `persistenceFailureCount`, `lastPersistenceFailureAtMs` y `lastPersistenceFailure` se publican al bridge.
- [ ] Confirmar que la UI web sigue funcionando con `localStorage` durante la migracion.

## Audio Focus

- [ ] Reproducir y recibir llamada.
- [ ] Reproducir y recibir notificacion de otra app.
- [ ] Reproducir otra app de audio y confirmar comportamiento.
- [ ] Conectar Bluetooth.
- [ ] Desconectar Bluetooth.
- [ ] Conectar audifonos.
- [ ] Desconectar audifonos.
- [ ] Confirmar que la app pausa al desconectar la salida de audio externa.
- [ ] Confirmar que `Motor NEXTGEN` actualiza la ruta tras conectar/desconectar audio.

## DSP

- [ ] Probar perfil `standard`.
- [ ] Probar perfil `cinema`.
- [ ] Probar perfil `club`.
- [ ] Probar perfil `live_stage`.
- [ ] Probar perfil `voice`.
- [ ] Probar perfil `night`.
- [ ] Probar perfil `wide`.
- [ ] Confirmar que no hay clipping audible.
- [ ] Confirmar que volumen/mute siguen funcionando.

## UI / Bridge

- [ ] Confirmar que el WebView carga local.
- [x] Confirmar que la interfaz Android no permite pinch zoom ni zoom tipo imagen.
- [ ] Confirmar que controles de la UI siguen llamando al servicio nativo.
- [ ] Confirmar que metadata actualiza notificacion y lock screen.
- [ ] Confirmar que el perfil de audio seleccionado llega al servicio.
- [ ] Abrir `Mi WXM > Motor NEXTGEN`.
- [ ] Confirmar que muestra estado, red, buffer, stream y DSP.
- [ ] Confirmar que en navegador dice `Web fallback`.
- [ ] Confirmar que en Android muestra datos nativos desde `getPlaybackStatus()`.
- [ ] Confirmar que `streamLifecycle` publica transiciones coherentes y cuenta runtime primary rechazados.
- [ ] Confirmar que la UI Android no muestra `playing` hasta que el bridge nativo lo confirme.
- [ ] Confirmar que un rebuffer real se muestra como `buffering` y no como `paused`.

## Pendiente tecnico

- [x] OkHttp custom.
- [~] Room cache: base y doble escritura nativa listas; lecturas hacia frontend y cache fisica pendientes.
- [~] Fase 9.5: codigo tecnico cerrado con observabilidad y relojes monotonicamente endurecidos; cierre operativo pendiente de QA fisica y comparativa contra TuneIn.
- [x] Preparacion para Fase 10: notificaciones, sesion legacy, artwork, recovery y router de comandos extraidos de `RadioPlaybackService`.
- [x] Preparacion para Fase 10: sesion legacy desacoplada detras de `WxmPlaybackSessionController`.
- [x] Modo claro: tarjetas de dias en `Semana` con contraste dedicado.
- [x] Historial semanal: limite subido a 500 canciones por dia y deduplicacion temporal para permitir repeticiones reales.
- [x] App shell Android: zoom del WebView deshabilitado y viewport fijo para UI responsive.
- [ ] Historial completo 24/7 con app cerrada: pendiente de backend/CMS historico del stream.
- [ ] MediaSessionService moderno.
- [ ] Spatializer API como decision activa de DSP.
- [x] Bridge de metricas NEXTGEN.

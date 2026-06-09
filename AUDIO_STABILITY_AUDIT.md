# Audio Stability Audit - WXM ONE RADIO NEXTGEN

Fecha: 2026-05-16

## Hallazgo principal

El corte intermitente de audio tenia una causa de alto impacto:

- `WxmNetworkConfig` usaba `callTimeout = 30000 ms`.
- Un stream en vivo es una llamada HTTP de duracion indefinida.
- En OkHttp, `callTimeout` limita la llamada completa, no solo la conexion inicial.
- Resultado esperado: la conexion podia abortarse periodicamente aunque la UI siguiera indicando reproduccion.

Correccion aplicada:

- `callTimeout = 0` para streaming continuo.
- `readTimeout` sube a `30000 ms` para tolerar pausas transitorias sin perder deteccion de sockets muertos.

## Hallazgos secundarios corregidos

### 1. Buffer demasiado agresivo para radio en vivo

Antes:

- Una red `EXCELLENT` elegia `LOW_LATENCY` automaticamente.
- `GOOD` elegia `STANDARD`.

Problema:

- Para una emisora 24/7 la prioridad no es latencia minima, sino continuidad.
- Clasificar una red como excelente por enlace local no garantiza estabilidad real de internet.

Correccion:

- `GOOD` y `EXCELLENT` ahora recomiendan `STABLE_RADIO`.
- `LOW_LATENCY` queda disponible solo como perfil explicito/futuro, no como decision automatica.

### 2. Estado visual optimista

Antes:

- El frontend Android marcaba `PLAYING` 800 ms despues de pedir play aunque el motor nativo siguiera cargando o recuperando.

Problema:

- La UI podia decir “play” mientras el audio estaba en silencio.

Correccion:

- Se elimina la promocion optimista.
- La UI sincroniza su estado con `getPlaybackStatus()` nativo:
  - `playing`
  - `loading`
  - `buffering`
  - `recovering`
  - `paused`
  - `error`

### 3. `BUFFERING` sobrescrito por `PAUSED`

Antes:

- `onPlaybackStateChanged(BUFFERING)` marcaba buffering.
- Luego `onIsPlayingChanged(false)` podia sustituirlo por paused.

Problema:

- El diagnostico y la UI perdian la diferencia entre una pausa real y un rebuffer.

Correccion:

- Si ExoPlayer esta en `STATE_BUFFERING`, el servicio mantiene `BUFFERING` y no lo degrada a `PAUSED`.

### 4. Identidad inestable del stream nativo

Antes:

- El frontend Android enviaba a ExoPlayer una URL con `?nocache=<timestamp>`.

Problema:

- Esa tecnica sirve para navegadores web, pero en Android rompe la identidad estable del stream.
- Cada sesion parecia una fuente nueva para el motor nativo y complicaba health, recovery y comparacion de sesiones.

Correccion:

- El bridge nativo recibe la URL canonica estable.
- El cache-busting queda solo en la ruta HTML5 web fallback.

### 5. Asignaciones dentro del hilo de audio

Antes:

- `WxmAudioProcessor` creaba un `float[]` nuevo por cada bloque procesado.

Problema:

- En procesamiento en tiempo real, asignar memoria de forma recurrente aumenta presion de GC y puede causar glitches en dispositivos modestos.

Correccion:

- El frame buffer se reserva una vez por configuracion y se reutiliza durante todo el stream.

### 6. Silencio falso sin recuperacion automatica

Antes:

- Si el player quedaba en estado vivo pero el audio dejaba de avanzar, no existia una defensa especifica.

Correccion:

- Se agrega watchdog nativo de playback:
  - detecta `READY` sin progreso durante 15 s;
  - detecta `BUFFERING` prolongado durante 45 s;
  - fuerza recovery limpio y lo registra en telemetria.
- La telemetria ahora publica:
  - `audioUnderrunCount`
  - `lastAudioUnderrunAtMs`
  - `lastAudioUnderrunElapsedSinceLastFeedMs`
  - `watchdogRecoveryCount`
  - `lastWatchdogReason`

## Revision recursiva por fases

### Fases 1-2

- Base funcional y UI avanzada ya existentes.
- Riesgo residual: la experiencia aun depende de frontend WebView para varias lecturas de datos.
- Estado: utilizable, pero no totalmente desacoplada del frontend.

### Fases 3-5

- Networking, retry y fallback estan en nivel avanzado.
- Inconsistencia detectada: `callTimeout` de llamada completa era incompatible con stream infinito.
- Estado despues de la correccion: arquitectura correcta para radio continua.

### Fase 6

- Ultra Buffer Engine ya existe.
- Inconsistencia detectada: la politica automatica premiaba `LOW_LATENCY` en vez de estabilidad.
- Estado despues de la correccion: alineada con radio 24/7.

### Fases 7-8

- Red observable y telemetria de sesion completas.
- Inconsistencia detectada: el frontend podia presentar un estado mas optimista que el motor real.
- Estado despues de la correccion: bridge y UI describen mejor la realidad del playback.

### Fase 9

- Room ya existe con doble escritura inicial.
- Riesgo residual: las lecturas criticas siguen dependiendo de `localStorage` mientras la migracion no se complete.
- Estado: correcto para migracion gradual; no es causa del corte de audio.

## Riesgos que aun deben vigilarse

- Fallbacks reales aun no estan configurados.
- Si el stream origen se cae, hoy no hay segunda URL productiva a la cual saltar.
- `Spatializer` y DSP V2 todavia no aplican bypass adaptativo por carga CPU/dispositivo debil.
- La persistencia Room aun no reemplaza lecturas de favoritos/historial del frontend.
- Falta prueba prolongada real de 30-60 minutos en Android fisico con pantalla bloqueada.

## Pruebas obligatorias posteriores al fix

1. Reproducir minimo 10 minutos y confirmar que ya no existe corte periodico cada ~30 segundos.
2. Reproducir 30-60 minutos con pantalla bloqueada.
3. Verificar que `telemetry.currentlyBuffering`, `rebufferCount` y `totalBufferingMs` reflejan cualquier corte real.
4. Confirmar que al entrar en buffering la UI muestra buffering/reconectando y no sigue fingiendo playing.
5. Confirmar que `networkConfig.callTimeoutMs = 0`.
6. Confirmar que `buffer.recommendedProfile = STABLE_RADIO` en redes `GOOD` y `EXCELLENT`.
7. Confirmar que la ruta Android usa la URL canonica sin `?nocache=`.
8. Confirmar que `audioUnderrunCount` y `watchdogRecoveryCount` permanecen en `0` durante una sesion sana.

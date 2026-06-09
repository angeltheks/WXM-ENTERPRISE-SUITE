# Audio Engine V2 - WXM ONE RADIO NEXTGEN

## Estado

La app mantiene el motor DSP actual y ahora agrega una base de audio focus profesional alrededor del playback.

## Implementado

- `WxmAudioProcessor` como `AudioProcessor` real dentro de `DefaultAudioSink`.
- Perfiles DSP:
  - `standard`
  - `cinema`
  - `club`
  - `live_stage`
  - `voice`
  - `night`
  - `wide`
- Procesamiento PCM 16-bit en tiempo real.
- Widening Mid/Side.
- Bass shaping.
- Presence shaping.
- Compresion ligera.
- Soft limiter.
- Equalizer, BassBoost, Virtualizer y LoudnessEnhancer cuando el dispositivo lo permite.
- `WxmAudioFocusManager` para foco de audio, ducking, perdida temporal/permanente y recuperacion.
- `WxmAudioRouteManager` para identificar salida principal.
- `AudioDeviceCallback` para refrescar el estado cuando cambia la ruta.
- Pausa segura con `ACTION_AUDIO_BECOMING_NOISY` cuando se desconectan audifonos/Bluetooth.
- `WxmSpatialCapabilities` para detectar Android Spatializer sin crashear en dispositivos no compatibles.
- `Motor NEXTGEN` visible en Mi WXM para diagnostico de DSP/ruta/spatial.

## Flujo actual

```text
ExoPlayer
  |
DefaultAudioSink
  |
WxmAudioProcessor
  |
Android AudioTrack
  |
Audio effects Android opcionales
  |
Salida: speaker / headset / Bluetooth / HDMI
  |
WxmAudioRouteManager + WxmSpatialCapabilities
  |
Bridge status visible en Mi WXM
```

## Limites reales

- Esto no es Dolby Atmos licenciado.
- No convierte magicamente una fuente estereo en 5.1/7.1 real.
- El virtual surround depende del dispositivo, auriculares, codec y salida.
- Android Spatializer todavia no esta conectado.
- Android Spatializer se detecta, pero todavia no decide automaticamente el perfil DSP.
- El procesamiento actual es ligero y seguro para bateria; no es un motor HRTF pesado.

## Pendiente V2

- Perfiles DSP por speaker/headphones/Bluetooth.
- Bypass automatico en dispositivos debiles.
- Medicion aproximada de carga CPU.
- Spatializer API como decision activa de pipeline.
- Persistencia del perfil DSP en Room.
- Bridge frontend para mostrar estado real de DSP/audio route.
- Pruebas auditivas A/B por perfil.

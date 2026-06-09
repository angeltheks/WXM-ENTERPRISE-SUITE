# WXM ONE RADIO Android APK

Este proyecto genera una APK instalable directamente en Android, sin pasar por Play Store.

## Compilar con Android Studio

1. Instala Android Studio.
2. Abre la carpeta `android-webview`.
3. Espera a que Android Studio sincronice Gradle.
4. Ve a `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
5. La APK debug quedara en:

```text
android-webview/app/build/outputs/apk/debug/app-debug.apk
```

Para instalar en un movil:

```bash
adb install -r android-webview/app/build/outputs/apk/debug/app-debug.apk
```

Tambien puedes copiar la APK al telefono y abrirla, activando "Instalar apps desconocidas".

## Compilar por terminal

Requisitos:

- JDK 17.
- Android SDK.
- Gradle.

Comando:

```bash
cd android-webview
gradle assembleDebug
```

## Notas

- La app carga el reproductor desde assets locales mediante `WebViewAssetLoader`.
- El proxy PHP de Spotify debe estar desplegado en HTTPS. La app no ejecuta PHP local.
- El endpoint remoto se configura en `v2/assets/js/config.js`, clave `SPOTIFY_PROXY_APP`.
- La reproduccion en Android usa `RadioPlaybackService`, un servicio nativo en primer plano.
- Al abrir la app por primera vez en Android 13+, permite las notificaciones para ver los controles en pantalla bloqueada.
- Si cambias archivos en `v2/`, vuelve a sincronizar assets:

```bash
../scripts/sync-android-assets.sh
```

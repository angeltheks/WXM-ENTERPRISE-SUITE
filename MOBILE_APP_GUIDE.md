# WXM ONE RADIO - Android/iOS con Capacitor

Esta base empaqueta el reproductor web `v2/` como app nativa usando Capacitor.

## Requisitos

- Node.js y npm.
- Android Studio para Play Store.
- Xcode en macOS para App Store.
- Dominio HTTPS publicado con `v2/spotify-proxy.php` y `spotify-secrets.php` fuera del webroot.

## Preparar dependencias

```bash
npm install
```

## Android

```bash
npm run cap:add:android
npm run cap:sync
npm run android
```

En Android Studio:

- Configura el icono de app.
- Configura versionCode/versionName.
- Genera un build firmado `.aab`.
- Sube el `.aab` a Google Play Console.

## iOS

```bash
npm run cap:add:ios
npm run cap:sync
npm run ios
```

En Xcode:

- Configura Team/Signing.
- Configura Bundle Identifier: `com.wxmoneradio.player`.
- Configura iconos.
- Activa Background Modes > Audio si vas a mantener reproducción en segundo plano.
- Archiva y sube a App Store Connect.

## Proxy Spotify en app

La app no ejecuta PHP local. Por eso `v2/assets/js/config.js` usa:

```js
SPOTIFY_PROXY_APP: "https://wxmoneradio.com/spotify-proxy.php"
```

Cambia ese dominio si el proxy queda en otro host.

El proxy permite orígenes Capacitor:

- `capacitor://localhost`
- `ionic://localhost`
- `http://localhost`

## Audio en segundo plano

La reproducción básica funciona con el WebView. Para una experiencia premium en tiendas conviene añadir después:

- controles multimedia de sistema,
- lock screen metadata,
- reproducción estable en segundo plano,
- notificaciones persistentes en Android.

Eso puede hacerse en una segunda fase con plugins nativos de audio/background mode.

## Checklist de tienda

- Nombre: WXM ONE RADIO.
- Bundle/app id: `com.wxmoneradio.player`.
- Política de privacidad publicada.
- Capturas Android y iPhone.
- Icono 1024x1024.
- Descripción corta y larga.
- Clasificación de contenido.
- URL de soporte.
- Prueba en dispositivo real con red móvil y Wi-Fi.

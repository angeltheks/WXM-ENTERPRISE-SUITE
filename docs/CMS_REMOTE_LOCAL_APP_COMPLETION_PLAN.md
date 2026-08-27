# Plan De Implementacion - CMS Remoto, CMS Local Y App

Fecha base: 2026-08-27

## Objetivo

Cerrar WXM ENTERPRISE SUITE como una plataforma operable de radio: CMS local para editar, CMS Remote Admin para publicar y proteger datos privados, app Android/WebView para consumir el contrato publicado y analytics para medir audiencia real.

## Regla Central

El frontend publico y la APK nunca deben guardar ni exponer credenciales, password admin, authhash de SHOUTcast ni endpoints privados. Todo dato sensible vive en el backend remoto o en variables de entorno del servidor.

## Estado Actual

Completado:

- Fuente oficial consolidada en `/Users/mac/AndroidProjects/Reprov2_NEXTGEN`.
- Rama activa `dev`.
- Smoke tecnico general en `scripts/smoke-check.sh`.
- Smoke de interfaz en `scripts/interface-smoke.mjs`.
- CMS local con editor de contenido, preview movil, validacion, analytics, World Atlas y Sistema/Config.
- Remote Admin con login, cookie `HttpOnly`, CSRF, auditoria, snapshots, rollback, assets, analytics anonimos y conector SHOUTcast.
- App Android con base WebView/Media3, servicio de audio, lockscreen/background, DSP base y puente Android/Web.
- World Atlas estabilizado para dashboard con D3/TopoJSON.

## Fase A - Operacion Local Estable

Objetivo: que cualquier operador pueda arrancar, validar y revisar el proyecto sin depender de memoria.

Estado: en curso.

Hecho:

- Script `scripts/start-remote-cms.sh` para iniciar Remote Admin con Node global o Node embebido de Codex.
- Script `scripts/start-local-suite.sh` para iniciar app web, CMS local y Remote Admin desde la raiz.
- Script `scripts/stop-local-suite.sh` para detener puertos locales conocidos.
- Deteccion de puertos ocupados con sugerencia de puerto alterno cercano.
- README actualizado con arranque seguro del Remote Admin.
- Smoke test detecta Node embebido si `node` no esta en PATH.
- CMS local incluye acceso visible a SHOUTcast y documentacion del conector.

Pendiente:

- Ningun pendiente critico en operacion local basica.

## Fase B - CMS Local Operable

Objetivo: que el CMS local sea el taller visual principal.

Pendiente:

- Separar mejor modo operador y modo tecnico.
- Convertir configuraciones criticas en formularios con ayuda contextual y validacion inmediata.
- Reforzar carga de imagenes con dimensiones recomendadas y preview por modulo.
- Exportar reporte de publicacion con advertencias claras.
- Conectar estado SHOUTcast remoto al panel local cuando exista sesion/backend disponible.

## Fase C - CMS Remote Admin MVP De Produccion

Objetivo: que el hosting remoto pueda publicar el JSON oficial y operar datos privados.

Pendiente:

- Panel CRUD remoto para editar contenido basico sin depender del CMS local.
- Roles: owner, editor, analyst, viewer.
- Rotacion de sesiones y expiracion configurable.
- Login con usuario + password, no solo password compartido.
- Historial visual de publicaciones y rollback con comparacion.
- Health checks para SHOUTcast, analytics, assets y almacenamiento.

## Fase D - Analytics Y SHOUTcast Real

Objetivo: unir datos reales de app, web y servidor SHOUTcast.

Pendiente:

- Normalizar listeners actuales desde SHOUTcast `statistics?json=1`.
- Agregar ingestion desde app Android para eventos anonimos: play, pause, error, background, buffer, network score.
- Fusionar audiencia por fuente: WXM Android App, Web Browser, External Player y SHOUTcast DNAS.
- Persistir series temporales por minuto/hora/dia.
- Mostrar paises/ciudades agregadas sin datos personales.
- Exportar CSV/JSON de analytics.

## Fase E - App Android Consumidora Del CMS

Objetivo: que la app consuma el contrato remoto y mantenga fallback local/cache.

Pendiente:

- Conectar endpoint CMS remoto configurado al arranque de la app.
- Mantener cache local del ultimo CMS valido.
- Mostrar contenido CMS segun feature flags.
- Enviar analytics anonimos al Remote Admin.
- Verificar metadata de lockscreen con artwork correcto y sin icono legacy.
- Pruebas reales de background, Bluetooth, auriculares y pantalla bloqueada.

## Fase F - QA, Build Y Release Interno

Objetivo: entregar APK interna confiable.

Pendiente:

- Smoke visual con screenshots desktop/mobile.
- Build Android debug y release interno.
- Checklist manual en telefono fisico.
- Reporte de seguridad antes de hosting publico.
- Push a `dev` y tag interno cuando la build sea estable.

## Comandos Base

CMS local:

```bash
python3 -m http.server 8098 --directory /Users/mac/AndroidProjects/Reprov2_NEXTGEN/v2
```

App web local:

```bash
python3 -m http.server 8091 --directory /Users/mac/AndroidProjects/Reprov2_NEXTGEN/v2
```

Remote Admin:

```bash
cd /Users/mac/AndroidProjects/Reprov2_NEXTGEN
export WXM_CMS_ADMIN_PASSWORD='pon-aqui-tu-clave-local'
sh scripts/start-remote-cms.sh
```

Validacion:

```bash
cd /Users/mac/AndroidProjects/Reprov2_NEXTGEN
scripts/smoke-check.sh
```

Build APK:

```bash
cd /Users/mac/AndroidProjects/Reprov2_NEXTGEN
./scripts/sync-android-assets.sh
cd android-webview
JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew clean assembleDebug
```

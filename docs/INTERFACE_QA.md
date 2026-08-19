# WXM Interface QA

## Objetivo

Esta guia define la validacion minima antes de abrir nuevas fases visuales o de producto.

La prioridad es evitar regresiones en:

- app mobile WebView;
- CMS local;
- Analytics;
- World Atlas;
- tema claro/oscuro;
- tabs y modales;
- controles de reproduccion;
- responsive desktop/tablet/mobile.

## Fuente Activa

El proyecto oficial es:

```text
/Users/mac/AndroidProjects/Reprov2_NEXTGEN
```

El CMS activo es:

```text
v2/cms/index.html
v2/cms/assets/
```

La carpeta siguiente existe solo como espejo legacy de continuidad:

```text
v2/cms/cms/
```

No desarrollar directamente dentro del espejo legacy. Si se toca el CMS activo y la copia debe seguir existiendo, sincronizar los archivos criticos y correr el smoke.

## Smoke De Interfaz

Comando recomendado:

```bash
npm run smoke
```

Solo contrato de interfaz:

```bash
npm run smoke:interface
```

El smoke revisa:

- vistas principales de la app;
- mini player global;
- controles play/stop/sync;
- historial semanal;
- modal base;
- tabs/paneles de Analytics;
- tabs/paneles de Sistema;
- mapa World Atlas;
- listas de live connections;
- inputs de imagen con formatos permitidos;
- selectores CSS que evitan regresiones del Atlas en modo Caribe/zoom;
- paridad entre CMS activo y espejo legacy en archivos criticos.

## Checklist Manual Antes De Nueva Fase

1. Abrir la app:

```text
http://localhost:8127/index.html?dev=0
```

2. Abrir CMS:

```text
http://localhost:8127/cms/index.html?v=qa
```

3. Revisar app mobile en ancho aproximado 390 x 844:

- Inicio no debe hacer zoom como imagen.
- Hero y texto no deben pisarse.
- Mini player aparece fuera de Inicio cuando corresponde.
- Tabs inferiores navegan a Inicio, En vivo, Programas, Explorar y Mi WXM.
- Modal de historial se abre por encima del reproductor.
- Tema claro y oscuro conservan contraste.

4. Revisar CMS desktop:

- Sidebar no tapa contenido.
- Analytics muestra Dashboard, Quick stats, Paises, Players, Referidores y Eventos.
- Sistema muestra Operacion, App y Publicacion; Avanzado solo cuando se activa.
- World Atlas no tapa Caribe con nodos grandes.
- Etiquetas de paises no aparecen fijas; deben aparecer por hover/click o contexto controlado.
- Zoom y Caribe/Mundo son accesibles.

5. Revisar CMS mobile/tablet:

- No hay overflow horizontal.
- Tarjetas se apilan.
- Botones siguen siendo tocables.
- Panel de live connections no tapa controles del mapa.

## Pendiente Para QA Visual Avanzado

- Agregar Playwright real con screenshots desktop/mobile cuando el repo tenga dependencias de test instaladas.
- Comparar screenshots contra baseline.
- Ejecutar el smoke visual en CI con artefactos de imagen.
- Validar APK en dispositivo fisico Samsung y Pixel.

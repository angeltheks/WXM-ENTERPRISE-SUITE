# WXM World Atlas

## Objective

The World Atlas is a strategic analytics module for WXM ENTERPRISE SUITE.

It must look like a premium broadcasting intelligence dashboard, not a generic map.

## Visual Direction

Brand colors:

```text
#050505
#1A1A1A
#FF007A
#FF2D95
#FFFFFF
```

References:

- Spotify Analytics.
- FlightRadar24.
- SiriusXM.
- TradingView Enterprise.

## Requirements

- React component.
- D3.js rendering.
- TopoJSON or GeoJSON real country data.
- Real borders.
- SVG responsive output.
- Zoom and pan.
- Hover by country.
- Tooltip by country.
- Active country magenta glow.
- Selected country white glow.
- Network routes from Dominican Republic.
- Dedicated Caribbean readability layer.

## Current Implementation Notes

The active local CMS implementation lives in:

```text
v2/cms/index.html
v2/cms/assets/react/WxmWorldAtlasMap.jsx
v2/cms/assets/react/WxmWorldAtlasMap.runtime.js
v2/cms/assets/css/cms.css
```

The CMS currently includes a React/D3 World Atlas runtime plus a fallback strategy. The Caribbean needs special handling because low-resolution world datasets do not show small islands with enough operational clarity.

As of World Atlas Polish 1.0, the map includes:

- explicit World/Caribbean focus mode;
- responsive side panel for selected country, live connections, top countries and Caribbean summary;
- reduced route labels in global view;
- expanded Caribbean node labels when the Caribbean focus mode is active;
- tooltip positioning inside the map container;
- reduced-motion CSS fallback for route/pulse animations.

The duplicate folder `v2/cms/cms/` is legacy backup only and must not be used as the active source.

## Rules

- Do not invent personal-level geolocation.
- Use aggregated country, city or region metrics.
- Keep Google Maps API keys out of Git and out of public CMS JSON.
- If exact Caribbean geography is needed, add a dedicated higher-resolution GeoJSON layer for that subregion.
- Do not use Google Maps as the main visual identity of WXM World Atlas. Google Maps can be considered later for internal address/geocoding tools only.
- Do not expose personal location. The map must remain aggregated by country, city or region.

## Next Cartography Upgrade

The current `countries-110m.json` dataset is acceptable for dashboard context but not for high-detail Caribbean visualization.

Recommended future upgrade:

1. Add a vetted 50m/10m TopoJSON dataset for the world map when network/dependency access is available.
2. Add a dedicated Caribbean GeoJSON layer for Antillas Mayores, Antillas Menores and territories.
3. Keep the operational node overlay even after the geographic upgrade, because analytics is aggregated and should not imply exact user position.

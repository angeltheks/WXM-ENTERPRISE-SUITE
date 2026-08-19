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

As of World Atlas Polish 1.1, Caribbean focus mode is treated as an inspection mode:

- animated transmission routes are hidden while the Caribbean is focused, so they do not cover islands, labels or connection nodes;
- the internal side panel is hidden in Caribbean focus, because the dashboard already has a Live Connections panel outside the map;
- city/place nodes are rendered for key Caribbean and Caribbean-coast locations such as Santo Domingo, Santiago, Punta Cana, San Juan, La Habana, Kingston, Nassau, Willemstad, Cartagena and Panama City;
- the zoom ceiling is increased to support closer inspection of small islands and territories;
- compact Atlas styling is driven by component width, not only browser viewport width, because the CMS analytics grid can place the map inside a narrower card on desktop.

As of World Atlas Polish 1.2, Caribbean focus mode is visually restrained:

- operational markers use smaller radii in Caribbean zoom so dots do not become large white circles;
- inactive/territory nodes are dark and subtle, while live/selected nodes keep magenta emphasis;
- labels are priority-based instead of rendering every country and city at the same weight;
- country/island labels use dedicated offsets to reduce overlap around Haiti, Dominican Republic and Puerto Rico;
- place labels are hidden by default and enabled only at deep zoom; secondary places remain as small dots with tooltip context;
- active country fills are less opaque so borders, coastlines and silhouettes remain readable;
- the global Dominican Republic transmission origin halo/core is not rendered in Caribbean focus because it covers the Antilles at inspection zoom;
- global transmission routes and moving pulse dots are not rendered in Caribbean focus; route animation is reserved for the `Mundo` broadcast view;
- CSS also keeps a defensive hide rule for older runtime copies, but the source of truth is the React mode condition.

As of World Atlas Polish 1.3, the Atlas uses clean-label behavior:

- no country, route, city or locality name is rendered permanently on top of the map;
- global route destinations remain as small markers, but their labels are not visible until an interaction pattern is added;
- country/island names are exposed through hover tooltip and click/selected context instead of fixed text;
- Caribbean city/place nodes are visual dots only by default, with future tooltip/drilldown interaction planned;
- the Dominican Republic origin halo remains available in `Mundo`, but its text label is no longer rendered permanently.

As of World Atlas Polish 1.4, the Atlas uses an unobstructed dashboard layout:

- the internal map side panel is removed from the React component and runtime because Analytics already owns the external `Live connections` panel;
- a defensive CSS rule hides stale internal side panels if a browser cache loads older runtime code;
- zoom and focus controls keep a higher interaction layer and must remain clickable at desktop, compact and mobile widths;
- global route animation, pulse dots and Dominican origin halo are visually restrained so the Caribbean is not covered in `Mundo`;
- active country fill is less opaque, preserving borders, coastlines and small-island silhouettes.

As of World Atlas Polish 1.5, the Atlas uses zoom-safe operational markers:

- route pulse dots, destination markers, Caribbean nodes and the Dominican origin core compensate their radius by the current D3 zoom scale;
- the Dominican origin halo is not rendered while the map is in a zoomed inspection state;
- zoomed Atlas styling disables heavy SVG glow on markers and pulse dots so small islands remain readable;
- global routes stay available in `Mundo`, but their visual weight is reduced during inspection zoom.

The duplicate folder `v2/cms/cms/` is legacy backup only and must not be used as the active source.

## Rules

- Do not invent personal-level geolocation.
- Use aggregated country, city or region metrics.
- Keep Google Maps API keys out of Git and out of public CMS JSON.
- Render the WXM transmission origin only in `Mundo`; `Caribe` is an inspection mode and must preserve island/country readability first.
- If exact Caribbean geography is needed, add a dedicated higher-resolution GeoJSON layer for that subregion.
- Do not use Google Maps as the main visual identity of WXM World Atlas. Google Maps can be considered later for internal address/geocoding tools only.
- Do not expose personal location. The map must remain aggregated by country, city or region.
- In Caribbean focus, do not display route animations over the islands. Routes belong to global broadcast mode, not inspection mode.
- In Caribbean focus, do not use large white nodes or full label dumps. The visual priority is country shape, border readability and a small set of high-value labels.
- In Caribbean focus, do not render the global origin halo/core over Dominican Republic. Use the Caribbean node/place layers instead.
- Do not render permanent geographic labels in default map state. Names belong in hover tooltips, selected-country panels, side lists or drilldown sheets.
- Do not render fixed operational panels inside the map when the Atlas is embedded in Analytics. The external dashboard panel owns live connection lists and ranking context.
- Zoom/focus controls must never be covered by route summaries, selected-country cards, live lists or decorative effects.
- SVG markers inside the zoom layer must be scale-compensated or hidden at inspection zoom. They must not grow large enough to cover Caribbean geography.
- City, town and locality layers must be progressive: country first, then region/province, then city/locality only after user zoom or selection.
- City/locality analytics must be aggregated and privacy-safe. Do not show personal-level location or exact listener coordinates.

## Drilldown Layer Strategy

Recommended hierarchy for future analytics:

1. Country layer: active/inactive country fill, aggregated listener count and listening time.
2. Region/province layer: shown only after selecting a country or zooming beyond the country threshold.
3. City layer: clustered markers, hover tooltip and selected city panel; no permanent label dumps.
4. Locality/town layer: optional future layer for admin-only analytics, gated by privacy thresholds and disabled for public dashboards.

Minimum privacy rule: only display region/city/locality metrics when the aggregated sample is large enough to avoid identifying individual listeners.

## Next Cartography Upgrade

The current `countries-110m.json` dataset is acceptable for dashboard context but not for high-detail Caribbean visualization.

Recommended future upgrade:

1. Add a vetted 50m/10m TopoJSON dataset for the world map when network/dependency access is available.
2. Add a dedicated Caribbean GeoJSON layer for Antillas Mayores, Antillas Menores and territories.
3. Keep the operational node overlay even after the geographic upgrade, because analytics is aggregated and should not imply exact user position.

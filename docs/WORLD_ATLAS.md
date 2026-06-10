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

The CMS currently includes a React/D3 World Atlas runtime plus a fallback strategy. The Caribbean needs special handling because low-resolution world datasets do not show small islands with enough operational clarity.

## Rules

- Do not invent personal-level geolocation.
- Use aggregated country, city or region metrics.
- Keep Google Maps API keys out of Git and out of public CMS JSON.
- If exact Caribbean geography is needed, add a dedicated higher-resolution GeoJSON layer for that subregion.


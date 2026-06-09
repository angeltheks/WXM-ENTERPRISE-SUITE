import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";

const COUNTRY_CODE_TO_ID = {
  AR: "032", AU: "036", BR: "076", CA: "124", CL: "152", CN: "156",
  CO: "170", DO: "214", EC: "218", FI: "246", FR: "250", DE: "276",
  HU: "348", IN: "356", IT: "380", JP: "392", MX: "484", NL: "528",
  PA: "591", PE: "604", PR: "630", RU: "643", ES: "724", AE: "784",
  GB: "826", US: "840", VE: "862"
};

const COUNTRY_NAME_TO_CODE = {
  argentina: "AR", australia: "AU", brasil: "BR", brazil: "BR", canada: "CA",
  chile: "CL", china: "CN", colombia: "CO", "dominican republic": "DO",
  "republica dominicana": "DO", ecuador: "EC", finland: "FI", france: "FR",
  germany: "DE", hungary: "HU", india: "IN", italy: "IT", japan: "JP",
  mexico: "MX", netherlands: "NL", panama: "PA", peru: "PE",
  "puerto rico": "PR", russia: "RU", spain: "ES", espana: "ES",
  "united arab emirates": "AE", "united kingdom": "GB",
  "united states": "US", "united states of america": "US",
  "estados unidos": "US", venezuela: "VE"
};

const ORIGIN = { label: "Republica Dominicana", lat: 18.4861, lng: -69.9312, code: "DO" };

const ROUTES = [
  { id: "madrid", label: "Madrid", country: "Espana", lat: 40.4168, lng: -3.7038, code: "ES" },
  { id: "barcelona", label: "Barcelona", country: "Espana", lat: 41.3874, lng: 2.1686, code: "ES" },
  { id: "new-york", label: "New York", country: "EE. UU.", lat: 40.7128, lng: -74.0060, code: "US" },
  { id: "miami", label: "Miami", country: "EE. UU.", lat: 25.7617, lng: -80.1918, code: "US" },
  { id: "mexico-city", label: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332, code: "MX" },
  { id: "bogota", label: "Bogota", country: "Colombia", lat: 4.7110, lng: -74.0721, code: "CO" },
  { id: "dubai", label: "Dubai", country: "Emiratos", lat: 25.2048, lng: 55.2708, code: "AE" }
];

function resolveCountryCode(row) {
  const direct = String(row?.code || "").trim().toUpperCase();
  if (COUNTRY_CODE_TO_ID[direct]) return direct;
  const name = String(row?.country || row?.name || "").trim().toLowerCase();
  return COUNTRY_NAME_TO_CODE[name] || "";
}

function buildActiveRecords(analytics) {
  const records = new Map();
  (analytics?.countries || []).forEach(row => {
    const code = resolveCountryCode(row);
    const id = COUNTRY_CODE_TO_ID[code];
    if (!id) return;
    records.set(id, {
      id,
      code,
      name: row.country || row.name || code,
      value: Number(row.live || row.uniqueListeners || row.access || 1),
      live: Number(row.live || 0),
      access: Number(row.access || 0),
      uniqueListeners: Number(row.uniqueListeners || 0),
      listeningHours: Number(row.listeningHours || 0)
    });
  });
  [ORIGIN, ...ROUTES].forEach(route => {
    const id = COUNTRY_CODE_TO_ID[route.code];
    if (!id || records.has(id)) return;
    records.set(id, {
      id,
      code: route.code,
      name: route.country || route.label,
      value: 0,
      live: 0,
      access: 0,
      uniqueListeners: 0,
      listeningHours: 0,
      routeNode: true
    });
  });
  return records;
}

function formatAtlasNumber(value, suffix = "") {
  const number = Number(value || 0);
  return `${number.toLocaleString("es-ES")}${suffix}`;
}

function buildTooltipPayload(name, record, isActive) {
  if (!record) {
    return {
      name,
      meta: "Sin conexion agregada",
      status: "Inactivo",
      details: ["Pais sin actividad en el periodo seleccionado."]
    };
  }

  const details = [
    `Live: ${formatAtlasNumber(record.live)}`,
    `Access: ${formatAtlasNumber(record.access)}`,
    `Unicos: ${formatAtlasNumber(record.uniqueListeners)}`,
    `Horas: ${formatAtlasNumber(record.listeningHours, "h")}`
  ];

  if (record.routeNode) details.push("Nodo estrategico WXM");

  return {
    name: record.name || name,
    meta: record.routeNode ? "Ruta de transmision WXM" : `${formatAtlasNumber(record.value)} conexiones agregadas`,
    status: isActive ? "Activo WXM" : "Inactivo",
    details
  };
}

function routePath(projection, destination, index) {
  const start = projection([ORIGIN.lng, ORIGIN.lat]);
  const end = projection([destination.lng, destination.lat]);
  if (!start || !end) return "";
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const distance = Math.sqrt(dx * dx + dy * dy);
  const bend = Math.min(150, Math.max(42, distance * 0.23));
  const direction = index % 2 === 0 ? -1 : 1;
  const cx = start[0] + dx * 0.52;
  const cy = start[1] + dy * 0.42 - bend * direction;
  return `M ${start[0].toFixed(2)} ${start[1].toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${end[0].toFixed(2)} ${end[1].toFixed(2)}`;
}

export default function WxmWorldAtlasMap({
  analytics,
  datasetUrl = "assets/maps/countries-110m.json",
  title = "WXM ONE RADIO",
  subtitle = "Global broadcast analytics"
}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const zoomLayerRef = useRef(null);
  const zoomBehaviorRef = useRef(null);
  const [size, setSize] = useState({ width: 1120, height: 520 });
  const [topology, setTopology] = useState(null);
  const [error, setError] = useState("");
  const [tooltip, setTooltip] = useState(null);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    let active = true;
    fetch(datasetUrl, { cache: "force-cache" })
      .then(response => {
        if (!response.ok) throw new Error(`atlas_${response.status}`);
        return response.json();
      })
      .then(payload => {
        if (active) {
          setTopology(payload);
          setError("");
        }
      })
      .catch(err => {
        if (active) setError(err.message || "atlas_error");
      });
    return () => { active = false; };
  }, [datasetUrl]);

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setSize({
        width: Math.max(620, Math.round(rect.width)),
        height: Math.max(330, Math.round(rect.height))
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !zoomLayerRef.current) return undefined;
    const svg = d3.select(svgRef.current);
    const layer = d3.select(zoomLayerRef.current);
    const zoom = d3.zoom()
      .scaleExtent([1, 7])
      .translateExtent([[-size.width, -size.height], [size.width * 2, size.height * 2]])
      .on("zoom", event => layer.attr("transform", event.transform.toString()));
    zoomBehaviorRef.current = zoom;
    svg.call(zoom);
    svg.on("dblclick.zoom", null);
    return () => {
      zoomBehaviorRef.current = null;
      svg.on(".zoom", null);
    };
  }, [size.width, size.height, topology]);

  const mapData = useMemo(() => {
    if (!topology) return null;
    const countries = feature(topology, topology.objects.countries).features;
    const projection = d3.geoNaturalEarth1()
      .fitExtent([[18, 18], [size.width - 18, size.height - 18]], { type: "Sphere" });
    const path = d3.geoPath(projection);
    const graticule = d3.geoGraticule10();
    const activeRecords = buildActiveRecords(analytics);
    const activeIds = new Set(activeRecords.keys());
    return { countries, projection, path, graticule, activeRecords, activeIds };
  }, [topology, analytics, size.width, size.height]);

  if (error) return <div className="wxm-atlas-loading">No se pudo cargar TopoJSON: {error}</div>;
  if (!mapData) return <div className="wxm-atlas-loading">Cargando world atlas real...</div>;

  const { countries, projection, path, graticule, activeRecords, activeIds } = mapData;
  const originPoint = projection([ORIGIN.lng, ORIGIN.lat]);
  const routes = ROUTES.map((route, index) => ({
    ...route,
    path: routePath(projection, route, index),
    point: projection([route.lng, route.lat])
  }));
  const applyZoom = action => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    const transition = svg.transition().duration(260);
    if (action === "in") {
      zoomBehaviorRef.current.scaleBy(transition, 1.35);
      return;
    }
    if (action === "out") {
      zoomBehaviorRef.current.scaleBy(transition, 1 / 1.35);
      return;
    }
    zoomBehaviorRef.current.transform(transition, d3.zoomIdentity);
  };

  return (
    <div className="wxm-atlas-shell" ref={containerRef}>
      <div className="wxm-atlas-hud">
        <div>
          <span className="wxm-atlas-kicker">CMS DASHBOARD</span>
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </div>
        <div className="wxm-atlas-live-pill">TRANSMISION GLOBAL</div>
      </div>

      <div className="wxm-atlas-controls" aria-label="Controles del mapa">
        <button type="button" onClick={() => applyZoom("in")} aria-label="Acercar mapa">+</button>
        <button type="button" onClick={() => applyZoom("out")} aria-label="Alejar mapa">-</button>
        <button type="button" onClick={() => applyZoom("reset")} aria-label="Centrar mapa">0</button>
      </div>

      <svg ref={svgRef} className="wxm-atlas-svg" viewBox={`0 0 ${size.width} ${size.height}`} role="img" aria-label="WXM world atlas analytics map">
        <defs>
          <filter id="wxmAtlasMagentaGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.2" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="wxmAtlasWhiteGlow" x="-55%" y="-55%" width="210%" height="210%">
            <feGaussianBlur stdDeviation="2.4" result="whiteBlur" />
            <feMerge><feMergeNode in="whiteBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="wxmAtlasOcean" cx="50%" cy="44%" r="70%">
            <stop offset="0%" stopColor="#101015" />
            <stop offset="55%" stopColor="#07070a" />
            <stop offset="100%" stopColor="#050505" />
          </radialGradient>
          <pattern id="wxmAtlasTexture" width="9" height="9" patternUnits="userSpaceOnUse">
            <rect width="9" height="9" fill="transparent" />
            <circle cx="1" cy="1" r="0.45" fill="rgba(255,45,149,0.11)" />
            <path d="M0 9 L9 0" stroke="rgba(255,255,255,0.025)" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width={size.width} height={size.height} fill="url(#wxmAtlasOcean)" />
        <rect width={size.width} height={size.height} fill="url(#wxmAtlasTexture)" opacity="0.82" />
        <g ref={zoomLayerRef}>
          <path d={path(graticule)} className="wxm-atlas-graticule" />
          <g className="wxm-atlas-countries">
            {countries.map(country => {
              const id = String(country.id || "");
              const active = activeRecords.get(id);
              const isActive = activeIds.has(id);
              const name = country.properties?.name || id;
              const className = [
                "wxm-atlas-country",
                isActive ? "is-active" : "is-inactive",
                selectedId && id && selectedId === id ? "is-selected" : ""
              ].filter(Boolean).join(" ");
              return (
                <path
                  key={id || name}
                  d={path(country)}
                  className={className}
                  tabIndex={0}
                  role="button"
                  aria-label={`${name} ${isActive ? "activo" : "inactivo"}`}
                  onClick={() => setSelectedId(id)}
                  onKeyDown={event => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedId(id);
                    }
                  }}
                  onMouseMove={event => setTooltip({
                    x: event.clientX + 14,
                    y: event.clientY + 14,
                    ...buildTooltipPayload(name, active, isActive)
                  })}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}
          </g>

          <g className="wxm-atlas-routes">
            {routes.map((route, index) => route.path && (
              <g key={route.id} className="wxm-atlas-route-group">
                <path id={`wxm-route-${route.id}`} d={route.path} className="wxm-atlas-route" style={{ animationDelay: `${index * 0.35}s` }} />
                <circle r="3.8" className="wxm-atlas-route-pulse">
                  <animateMotion dur={`${4.8 + index * 0.24}s`} repeatCount="indefinite" path={route.path} />
                </circle>
              </g>
            ))}
          </g>

          <g className="wxm-atlas-nodes">
            {originPoint && (
              <g className="wxm-atlas-origin" transform={`translate(${originPoint[0]}, ${originPoint[1]})`}>
                <circle r="22" className="wxm-atlas-origin-halo" />
                <circle r="9" className="wxm-atlas-origin-core" />
                <text x="-26" y="34">REPUBLICA</text>
                <text x="-26" y="49">DOMINICANA</text>
              </g>
            )}
            {routes.map(route => route.point && (
              <g key={`${route.id}-label`} className="wxm-atlas-node-label" transform={`translate(${route.point[0]}, ${route.point[1]})`}>
                <circle r="4" className="wxm-atlas-node-dot" />
                <text x="10" y="-8">{route.label}</text>
                <text x="10" y="8" className="is-muted">{route.country}</text>
              </g>
            ))}
          </g>
        </g>
      </svg>

      <div className="wxm-atlas-legend">
        <span><i className="is-active" />Pais activo</span>
        <span><i className="is-live" />En linea ahora</span>
        <span><i className="is-inactive" />Inactivo</span>
      </div>
      {tooltip && (
        <div className="wxm-atlas-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          <strong>{tooltip.name}</strong>
          <span>{tooltip.meta}</span>
          <small>{tooltip.status}</small>
          {tooltip.details?.length ? (
            <ul>
              {tooltip.details.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}

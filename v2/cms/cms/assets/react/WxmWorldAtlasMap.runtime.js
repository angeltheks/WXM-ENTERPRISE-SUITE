(function initWxmWorldAtlasMap(global) {
    "use strict";

    const React = global.React;
    const ReactDOM = global.ReactDOM;
    const d3 = global.d3;
    const topojson = global.topojson;

    const COUNTRY_CODE_TO_ID = {
        AR: "032",
        AU: "036",
        BR: "076",
        CA: "124",
        CL: "152",
        CN: "156",
        CO: "170",
        DO: "214",
        EC: "218",
        FI: "246",
        FR: "250",
        DE: "276",
        HU: "348",
        IN: "356",
        IT: "380",
        JP: "392",
        MX: "484",
        NL: "528",
        PA: "591",
        PE: "604",
        PR: "630",
        RU: "643",
        ES: "724",
        AE: "784",
        GB: "826",
        US: "840",
        VE: "862"
    };

    const COUNTRY_NAME_TO_CODE = {
        argentina: "AR",
        australia: "AU",
        brasil: "BR",
        brazil: "BR",
        canada: "CA",
        chile: "CL",
        china: "CN",
        colombia: "CO",
        "dominican republic": "DO",
        "republica dominicana": "DO",
        ecuador: "EC",
        finland: "FI",
        france: "FR",
        germany: "DE",
        hungary: "HU",
        india: "IN",
        italy: "IT",
        japan: "JP",
        mexico: "MX",
        netherlands: "NL",
        panama: "PA",
        peru: "PE",
        "puerto rico": "PR",
        russia: "RU",
        spain: "ES",
        espana: "ES",
        "united arab emirates": "AE",
        "united kingdom": "GB",
        "united states": "US",
        "united states of america": "US",
        "estados unidos": "US",
        venezuela: "VE"
    };

    const ROUTES = [
        { id: "madrid", label: "Madrid", country: "Espana", lat: 40.4168, lng: -3.7038, code: "ES" },
        { id: "barcelona", label: "Barcelona", country: "Espana", lat: 41.3874, lng: 2.1686, code: "ES" },
        { id: "new-york", label: "New York", country: "EE. UU.", lat: 40.7128, lng: -74.0060, code: "US" },
        { id: "miami", label: "Miami", country: "EE. UU.", lat: 25.7617, lng: -80.1918, code: "US" },
        { id: "mexico-city", label: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332, code: "MX" },
        { id: "bogota", label: "Bogota", country: "Colombia", lat: 4.7110, lng: -74.0721, code: "CO" },
        { id: "dubai", label: "Dubai", country: "Emiratos", lat: 25.2048, lng: 55.2708, code: "AE" }
    ];

    const ORIGIN = {
        label: "Republica Dominicana",
        lat: 18.4861,
        lng: -69.9312,
        code: "DO"
    };

    const e = React?.createElement;
    const roots = new WeakMap();

    function normalizeText(value) {
        return String(value || "").trim();
    }

    function resolveCountryCode(row) {
        const direct = normalizeText(row?.code).toUpperCase();
        if (COUNTRY_CODE_TO_ID[direct]) return direct;
        const name = normalizeText(row?.country || row?.name).toLowerCase();
        return COUNTRY_NAME_TO_CODE[name] || "";
    }

    function buildActiveRecords(analytics) {
        const records = new Map();
        (analytics?.countries || []).forEach(row => {
            const code = resolveCountryCode(row);
            const id = COUNTRY_CODE_TO_ID[code];
            if (!id) return;
            const value = Number(row.live || row.uniqueListeners || row.access || 1);
            records.set(id, {
                id,
                code,
                name: row.country || row.name || code,
                value,
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

    function getFeatureName(feature) {
        return feature?.properties?.name || feature?.id || "Pais";
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

    function NodeLabel({ point, label, country }) {
        if (!point) return null;
        return e("g", {
            className: "wxm-atlas-node-label",
            transform: `translate(${point[0]}, ${point[1]})`
        },
            e("circle", { r: 4, className: "wxm-atlas-node-dot" }),
            e("text", { x: 10, y: -8 }, label),
            country ? e("text", { x: 10, y: 8, className: "is-muted" }, country) : null
        );
    }

    function WxmWorldAtlasMap({
        analytics,
        datasetUrl = "assets/maps/countries-110m.json",
        title = "WXM ONE RADIO",
        subtitle = "Global broadcast analytics"
    }) {
        const containerRef = React.useRef(null);
        const svgRef = React.useRef(null);
        const zoomLayerRef = React.useRef(null);
        const zoomBehaviorRef = React.useRef(null);
        const [size, setSize] = React.useState({ width: 1120, height: 520 });
        const [topology, setTopology] = React.useState(null);
        const [error, setError] = React.useState("");
        const [tooltip, setTooltip] = React.useState(null);
        const [selectedId, setSelectedId] = React.useState("");

        React.useEffect(() => {
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
            return () => {
                active = false;
            };
        }, [datasetUrl]);

        React.useEffect(() => {
            if (!containerRef.current || typeof ResizeObserver === "undefined") return undefined;
            const observer = new ResizeObserver(entries => {
                const rect = entries[0]?.contentRect;
                if (!rect) return;
                const width = Math.max(620, Math.round(rect.width));
                const height = Math.max(330, Math.round(rect.height));
                setSize({ width, height });
            });
            observer.observe(containerRef.current);
            return () => observer.disconnect();
        }, []);

        React.useEffect(() => {
            if (!svgRef.current || !zoomLayerRef.current || !d3) return undefined;
            const svg = d3.select(svgRef.current);
            const layer = d3.select(zoomLayerRef.current);
            const zoom = d3.zoom()
                .scaleExtent([1, 7])
                .translateExtent([[-size.width, -size.height], [size.width * 2, size.height * 2]])
                .on("zoom", event => {
                    layer.attr("transform", event.transform.toString());
                });
            zoomBehaviorRef.current = zoom;
            svg.call(zoom);
            svg.on("dblclick.zoom", null);
            return () => {
                zoomBehaviorRef.current = null;
                svg.on(".zoom", null);
            };
        }, [size.width, size.height, topology]);

        const mapData = React.useMemo(() => {
            if (!topology || !topojson || !d3) return null;
            const countries = topojson.feature(topology, topology.objects.countries).features;
            const projection = d3.geoNaturalEarth1()
                .fitExtent([[18, 18], [size.width - 18, size.height - 18]], { type: "Sphere" });
            const path = d3.geoPath(projection);
            const graticule = d3.geoGraticule10();
            const activeRecords = buildActiveRecords(analytics);
            const activeIds = new Set(activeRecords.keys());
            return { countries, projection, path, graticule, activeRecords, activeIds };
        }, [topology, analytics, size.width, size.height]);

        const currentTooltip = tooltip
            ? e("div", {
                className: "wxm-atlas-tooltip",
                style: { left: `${tooltip.x}px`, top: `${tooltip.y}px` }
            },
                e("strong", null, tooltip.name),
                e("span", null, tooltip.meta),
                e("small", null, tooltip.status),
                tooltip.details?.length
                    ? e("ul", null, tooltip.details.map((item, index) => e("li", { key: index }, item)))
                    : null
            )
            : null;

        if (!React || !ReactDOM || !d3 || !topojson) {
            return e("div", { className: "wxm-atlas-loading" }, "Atlas engine no disponible");
        }

        if (error) {
            return e("div", { className: "wxm-atlas-loading" }, `No se pudo cargar TopoJSON: ${error}`);
        }

        if (!mapData) {
            return e("div", { className: "wxm-atlas-loading" }, "Cargando world atlas real...");
        }

        const { countries, projection, path, graticule, activeRecords, activeIds } = mapData;
        const originPoint = projection([ORIGIN.lng, ORIGIN.lat]);
        const topRoutes = ROUTES.map((route, index) => ({
            ...route,
            path: routePath(projection, route, index),
            point: projection([route.lng, route.lat])
        }));
        const applyZoom = action => {
            if (!svgRef.current || !zoomBehaviorRef.current || !d3) return;
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

        return e("div", { className: "wxm-atlas-shell", ref: containerRef },
            e("div", { className: "wxm-atlas-hud" },
                e("div", null,
                    e("span", { className: "wxm-atlas-kicker" }, "CMS DASHBOARD"),
                    e("strong", null, title),
                    e("small", null, subtitle)
                ),
                e("div", { className: "wxm-atlas-live-pill" }, "TRANSMISION GLOBAL")
            ),
            e("div", { className: "wxm-atlas-controls", "aria-label": "Controles del mapa" },
                e("button", { type: "button", onClick: () => applyZoom("in"), "aria-label": "Acercar mapa" }, "+"),
                e("button", { type: "button", onClick: () => applyZoom("out"), "aria-label": "Alejar mapa" }, "-"),
                e("button", { type: "button", onClick: () => applyZoom("reset"), "aria-label": "Centrar mapa" }, "0")
            ),
            e("svg", {
                ref: svgRef,
                className: "wxm-atlas-svg",
                viewBox: `0 0 ${size.width} ${size.height}`,
                role: "img",
                "aria-label": "WXM world atlas analytics map"
            },
                e("defs", null,
                    e("filter", { id: "wxmAtlasMagentaGlow", x: "-60%", y: "-60%", width: "220%", height: "220%" },
                        e("feGaussianBlur", { stdDeviation: "3.2", result: "coloredBlur" }),
                        e("feMerge", null,
                            e("feMergeNode", { in: "coloredBlur" }),
                            e("feMergeNode", { in: "SourceGraphic" })
                        )
                    ),
                    e("filter", { id: "wxmAtlasWhiteGlow", x: "-55%", y: "-55%", width: "210%", height: "210%" },
                        e("feGaussianBlur", { stdDeviation: "2.4", result: "whiteBlur" }),
                        e("feMerge", null,
                            e("feMergeNode", { in: "whiteBlur" }),
                            e("feMergeNode", { in: "SourceGraphic" })
                        )
                    ),
                    e("radialGradient", { id: "wxmAtlasOcean", cx: "50%", cy: "44%", r: "70%" },
                        e("stop", { offset: "0%", stopColor: "#101015" }),
                        e("stop", { offset: "55%", stopColor: "#07070a" }),
                        e("stop", { offset: "100%", stopColor: "#050505" })
                    ),
                    e("pattern", { id: "wxmAtlasTexture", width: "9", height: "9", patternUnits: "userSpaceOnUse" },
                        e("rect", { width: "9", height: "9", fill: "transparent" }),
                        e("circle", { cx: "1", cy: "1", r: "0.45", fill: "rgba(255,45,149,0.11)" }),
                        e("path", { d: "M0 9 L9 0", stroke: "rgba(255,255,255,0.025)", strokeWidth: "0.6" })
                    )
                ),
                e("rect", { width: size.width, height: size.height, fill: "url(#wxmAtlasOcean)" }),
                e("rect", { width: size.width, height: size.height, fill: "url(#wxmAtlasTexture)", opacity: "0.82" }),
                e("g", { ref: zoomLayerRef },
                    e("path", { d: path(graticule), className: "wxm-atlas-graticule" }),
                    e("g", { className: "wxm-atlas-countries" },
                        countries.map(feature => {
                            const id = String(feature.id || "");
                            const record = activeRecords.get(id);
                            const isActive = activeIds.has(id);
                            const isSelected = Boolean(selectedId && id && selectedId === id);
                            const className = [
                                "wxm-atlas-country",
                                isActive ? "is-active" : "is-inactive",
                                isSelected ? "is-selected" : ""
                            ].filter(Boolean).join(" ");
                            const name = getFeatureName(feature);
                            return e("path", {
                                key: id || name,
                                d: path(feature),
                                className,
                                tabIndex: 0,
                                role: "button",
                                "aria-label": `${name} ${isActive ? "activo" : "inactivo"}`,
                                onClick: () => setSelectedId(id),
                                onKeyDown: event => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        setSelectedId(id);
                                    }
                                },
                                onMouseMove: event => {
                                    setTooltip({
                                        x: event.clientX + 14,
                                        y: event.clientY + 14,
                                        ...buildTooltipPayload(name, record, isActive)
                                    });
                                },
                                onMouseLeave: () => setTooltip(null)
                            });
                        })
                    ),
                    e("g", { className: "wxm-atlas-routes" },
                        topRoutes.map((route, index) => route.path
                            ? e("g", { key: route.id, className: "wxm-atlas-route-group" },
                                e("path", {
                                    id: `wxm-route-${route.id}`,
                                    d: route.path,
                                    className: "wxm-atlas-route",
                                    style: { animationDelay: `${index * 0.35}s` }
                                }),
                                e("circle", { r: "3.8", className: "wxm-atlas-route-pulse" },
                                    e("animateMotion", {
                                        dur: `${4.8 + index * 0.24}s`,
                                        repeatCount: "indefinite",
                                        path: route.path
                                    })
                                )
                            )
                            : null)
                    ),
                    e("g", { className: "wxm-atlas-nodes" },
                        originPoint
                            ? e("g", { className: "wxm-atlas-origin", transform: `translate(${originPoint[0]}, ${originPoint[1]})` },
                                e("circle", { r: 22, className: "wxm-atlas-origin-halo" }),
                                e("circle", { r: 9, className: "wxm-atlas-origin-core" }),
                                e("text", { x: -26, y: 34 }, "REPUBLICA"),
                                e("text", { x: -26, y: 49 }, "DOMINICANA")
                            )
                            : null,
                        topRoutes.map(route => e(NodeLabel, {
                            key: `${route.id}-label`,
                            point: route.point,
                            label: route.label,
                            country: route.country
                        }))
                    )
                )
            ),
            e("div", { className: "wxm-atlas-legend" },
                e("span", null, e("i", { className: "is-active" }), "Pais activo"),
                e("span", null, e("i", { className: "is-live" }), "En linea ahora"),
                e("span", null, e("i", { className: "is-inactive" }), "Inactivo")
            ),
            currentTooltip
        );
    }

    function mount(container, props = {}) {
        if (!container || !React || !ReactDOM || !d3 || !topojson) return false;
        let root = roots.get(container);
        if (!root) {
            root = ReactDOM.createRoot(container);
            roots.set(container, root);
        }
        root.render(e(WxmWorldAtlasMap, props));
        return true;
    }

    function unmount(container) {
        const root = roots.get(container);
        if (!root) return;
        root.unmount();
        roots.delete(container);
    }

    global.WxmWorldAtlasMap = {
        mount,
        unmount,
        Component: WxmWorldAtlasMap,
        routes: ROUTES,
        origin: ORIGIN
    };
})(window);

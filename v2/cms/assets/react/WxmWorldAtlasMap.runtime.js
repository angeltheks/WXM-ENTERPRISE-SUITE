(function initWxmWorldAtlasMap(global) {
    "use strict";

    const React = global.React;
    const ReactDOM = global.ReactDOM;
    const d3 = global.d3;
    const topojson = global.topojson;

    const COUNTRY_CODE_TO_ID = {
        AG: "028",
        AR: "032",
        AU: "036",
        BS: "044",
        BB: "052",
        BZ: "084",
        BR: "076",
        CA: "124",
        CL: "152",
        CN: "156",
        CO: "170",
        CR: "188",
        CU: "192",
        DM: "212",
        DO: "214",
        EC: "218",
        FI: "246",
        FR: "250",
        DE: "276",
        GD: "308",
        GT: "320",
        GY: "328",
        HT: "332",
        HN: "340",
        HU: "348",
        IN: "356",
        IT: "380",
        JM: "388",
        JP: "392",
        KN: "659",
        LC: "662",
        VC: "670",
        MX: "484",
        NL: "528",
        PA: "591",
        PE: "604",
        PR: "630",
        RU: "643",
        ES: "724",
        SR: "740",
        TT: "780",
        AE: "784",
        GB: "826",
        US: "840",
        VE: "862"
    };

    const COUNTRY_NAME_TO_CODE = {
        antigua: "AG",
        "antigua and barbuda": "AG",
        "antigua y barbuda": "AG",
        argentina: "AR",
        australia: "AU",
        bahamas: "BS",
        barbados: "BB",
        belize: "BZ",
        brasil: "BR",
        brazil: "BR",
        canada: "CA",
        chile: "CL",
        china: "CN",
        colombia: "CO",
        "costa rica": "CR",
        cuba: "CU",
        dominica: "DM",
        "dominican republic": "DO",
        "republica dominicana": "DO",
        ecuador: "EC",
        finland: "FI",
        france: "FR",
        germany: "DE",
        grenada: "GD",
        guatemala: "GT",
        guyana: "GY",
        haiti: "HT",
        honduras: "HN",
        hungary: "HU",
        india: "IN",
        italy: "IT",
        jamaica: "JM",
        japan: "JP",
        "saint kitts and nevis": "KN",
        "san cristobal y nieves": "KN",
        "saint lucia": "LC",
        "santa lucia": "LC",
        "saint vincent and the grenadines": "VC",
        "san vicente": "VC",
        mexico: "MX",
        netherlands: "NL",
        panama: "PA",
        peru: "PE",
        "puerto rico": "PR",
        russia: "RU",
        spain: "ES",
        espana: "ES",
        suriname: "SR",
        "trinidad and tobago": "TT",
        "trinidad y tobago": "TT",
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

    const CARIBBEAN_NODES = [
        { code: "CU", label: "Cuba", group: "Antillas Mayores", lat: 21.5218, lng: -77.7812, major: true },
        { code: "JM", label: "Jamaica", group: "Antillas Mayores", lat: 18.1096, lng: -77.2975, major: true },
        { code: "HT", label: "Haiti", group: "Antillas Mayores", lat: 18.9712, lng: -72.2852, major: true },
        { code: "DO", label: "Rep. Dominicana", group: "Antillas Mayores", lat: 18.4861, lng: -69.9312, major: true },
        { code: "PR", label: "Puerto Rico", group: "Antillas Mayores", lat: 18.2208, lng: -66.5901, major: true },
        { code: "BS", label: "Bahamas", group: "Antillas Menores", lat: 25.0343, lng: -77.3963 },
        { code: "TC", label: "Turks & Caicos", group: "Antillas Menores", lat: 21.6940, lng: -71.7979, territory: true },
        { code: "KY", label: "Cayman", group: "Antillas Menores", lat: 19.3133, lng: -81.2546, territory: true },
        { code: "VG", label: "BVI", group: "Antillas Menores", lat: 18.4207, lng: -64.6400, territory: true },
        { code: "VI", label: "USVI", group: "Antillas Menores", lat: 18.3358, lng: -64.8963, territory: true },
        { code: "SX", label: "Sint Maarten", group: "Antillas Menores", lat: 18.0425, lng: -63.0548, territory: true },
        { code: "MF", label: "Saint Martin", group: "Antillas Menores", lat: 18.0708, lng: -63.0501, territory: true },
        { code: "BL", label: "St. Barthelemy", group: "Antillas Menores", lat: 17.9000, lng: -62.8333, territory: true },
        { code: "KN", label: "St. Kitts", group: "Antillas Menores", lat: 17.3578, lng: -62.7830 },
        { code: "AG", label: "Antigua", group: "Antillas Menores", lat: 17.0608, lng: -61.7964 },
        { code: "MS", label: "Montserrat", group: "Antillas Menores", lat: 16.7425, lng: -62.1874, territory: true },
        { code: "GP", label: "Guadeloupe", group: "Antillas Menores", lat: 16.2650, lng: -61.5510, territory: true },
        { code: "DM", label: "Dominica", group: "Antillas Menores", lat: 15.4150, lng: -61.3710 },
        { code: "MQ", label: "Martinique", group: "Antillas Menores", lat: 14.6415, lng: -61.0242, territory: true },
        { code: "LC", label: "St. Lucia", group: "Antillas Menores", lat: 13.9094, lng: -60.9789 },
        { code: "VC", label: "St. Vincent", group: "Antillas Menores", lat: 13.2528, lng: -61.1971 },
        { code: "BB", label: "Barbados", group: "Antillas Menores", lat: 13.1939, lng: -59.5432 },
        { code: "GD", label: "Grenada", group: "Antillas Menores", lat: 12.1165, lng: -61.6790 },
        { code: "TT", label: "Trinidad", group: "Antillas Menores", lat: 10.6918, lng: -61.2225 },
        { code: "AW", label: "Aruba", group: "Antillas Menores", lat: 12.5211, lng: -69.9683, territory: true },
        { code: "CW", label: "Curazao", group: "Antillas Menores", lat: 12.1696, lng: -68.9900, territory: true },
        { code: "BQ", label: "Bonaire", group: "Antillas Menores", lat: 12.1784, lng: -68.2385, territory: true },
        { code: "BZ", label: "Belize", group: "Costa Caribe", lat: 17.1899, lng: -88.4976 },
        { code: "GT", label: "Guatemala", group: "Costa Caribe", lat: 15.7835, lng: -90.2308 },
        { code: "HN", label: "Honduras", group: "Costa Caribe", lat: 15.2000, lng: -86.2419 },
        { code: "NI", label: "Nicaragua", group: "Costa Caribe", lat: 12.8654, lng: -85.2072, territory: true },
        { code: "CR", label: "Costa Rica", group: "Costa Caribe", lat: 9.7489, lng: -83.7534 },
        { code: "PA", label: "Panama", group: "Costa Caribe", lat: 8.5380, lng: -80.7821 },
        { code: "CO", label: "Colombia", group: "Costa Caribe", lat: 10.3910, lng: -75.4794 },
        { code: "VE", label: "Venezuela", group: "Costa Caribe", lat: 10.4806, lng: -66.9036 },
        { code: "GY", label: "Guyana", group: "Costa Caribe", lat: 6.8013, lng: -58.1551 },
        { code: "SR", label: "Suriname", group: "Costa Caribe", lat: 5.8520, lng: -55.2038 },
        { code: "GF", label: "Guayana Francesa", group: "Costa Caribe", lat: 4.9224, lng: -52.3135, territory: true }
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

    function getRecordForCode(records, code) {
        const id = COUNTRY_CODE_TO_ID[String(code || "").toUpperCase()];
        return id ? records.get(id) : null;
    }

    function isLiveCaribbeanRecord(record) {
        return Boolean(record && (Number(record.live || 0) > 0 || Number(record.value || 0) > 0));
    }

    function buildCaribbeanTooltipPayload(node, record) {
        const live = isLiveCaribbeanRecord(record);
        const details = [
            `Grupo: ${node.group}`,
            node.territory ? "Tipo: territorio / isla asociada" : "Tipo: pais o costa continental",
            record ? `Live: ${formatAtlasNumber(record.live)}` : "Live: sin datos",
            record ? `Access: ${formatAtlasNumber(record.access)}` : "Access: sin datos"
        ];

        return {
            name: node.label,
            meta: live ? "Conexion caribena detectada" : "Nodo caribeno monitoreado",
            status: live ? "Activo WXM" : "Sin actividad agregada",
            details
        };
    }

    function countByGroup(nodes) {
        return nodes.reduce((acc, node) => {
            acc[node.group] = (acc[node.group] || 0) + 1;
            return acc;
        }, {});
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
                const width = Math.max(360, Math.round(rect.width));
                const compact = width < 720;
                const height = Math.max(compact ? 420 : 330, Math.round(rect.height));
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
            const compact = size.width < 720;
            const horizontalPadding = compact ? 8 : 18;
            const topPadding = compact ? 64 : 18;
            const bottomPadding = compact ? 80 : 18;
            const projection = d3.geoNaturalEarth1()
                .fitExtent([[horizontalPadding, topPadding], [size.width - horizontalPadding, size.height - bottomPadding]], { type: "Sphere" });
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
        const caribbeanNodes = CARIBBEAN_NODES.map(node => ({
            ...node,
            point: projection([node.lng, node.lat]),
            record: getRecordForCode(activeRecords, node.code)
        })).filter(node => node.point);
        const caribbeanActiveCount = caribbeanNodes.filter(node => isLiveCaribbeanRecord(node.record)).length;
        const caribbeanGroups = countByGroup(CARIBBEAN_NODES);
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
            if (action === "caribbean") {
                const center = projection([-70.8, 17.5]);
                if (!center) return;
                const scale = size.width < 720 ? 5.2 : 4.1;
                zoomBehaviorRef.current.transform(
                    transition,
                    d3.zoomIdentity
                        .translate(size.width / 2 - center[0] * scale, size.height / 2 - center[1] * scale)
                        .scale(scale)
                );
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
                e("button", { type: "button", className: "is-wide", onClick: () => applyZoom("caribbean"), "aria-label": "Enfocar Caribe" }, "Caribe"),
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
                    e("g", { className: "wxm-atlas-caribbean-nodes", "aria-label": "Capa Caribe WXM" },
                        caribbeanNodes.map(node => {
                            const active = isLiveCaribbeanRecord(node.record);
                            const selected = selectedId === `caribbean-${node.code}`;
                            const className = [
                                "wxm-atlas-caribbean-node",
                                active ? "is-active" : "is-idle",
                                node.major ? "is-major" : "",
                                node.territory ? "is-territory" : "",
                                selected ? "is-selected" : ""
                            ].filter(Boolean).join(" ");
                            const showLabel = node.major || ["BS", "BB", "TT", "PA", "CO", "VE"].includes(node.code);
                            return e("g", {
                                key: `caribbean-${node.code}-${node.label}`,
                                className,
                                transform: `translate(${node.point[0]}, ${node.point[1]})`,
                                tabIndex: 0,
                                role: "button",
                                "aria-label": `${node.label} ${active ? "activo" : "monitoreado"}`,
                                onClick: () => setSelectedId(`caribbean-${node.code}`),
                                onKeyDown: event => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        setSelectedId(`caribbean-${node.code}`);
                                    }
                                },
                                onMouseMove: event => {
                                    setTooltip({
                                        x: event.clientX + 14,
                                        y: event.clientY + 14,
                                        ...buildCaribbeanTooltipPayload(node, node.record)
                                    });
                                },
                                onMouseLeave: () => setTooltip(null)
                            },
                                e("circle", { r: node.major ? 4.8 : 3.4 }),
                                showLabel ? e("text", { x: 7, y: -7 }, node.label) : null
                            );
                        })
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
            e("div", { className: "wxm-caribbean-inset" },
                e("span", { className: "wxm-atlas-kicker" }, "Caribe WXM"),
                e("strong", null, `${caribbeanActiveCount} activos / ${CARIBBEAN_NODES.length} nodos`),
                e("small", null, "Antillas Mayores, Antillas Menores y costa continental monitoreadas."),
                e("div", { className: "wxm-caribbean-groups" },
                    Object.entries(caribbeanGroups).map(([group, count]) => e("span", { key: group },
                        e("b", null, count),
                        group
                    ))
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

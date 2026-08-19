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

    const CARIBBEAN_PLACES = [
        { code: "DO", label: "Santo Domingo", lat: 18.4861, lng: -69.9312, tier: 1 },
        { code: "DO", label: "Santiago", lat: 19.4517, lng: -70.6970, tier: 2 },
        { code: "DO", label: "Punta Cana", lat: 18.5601, lng: -68.3725, tier: 2 },
        { code: "PR", label: "San Juan", lat: 18.4655, lng: -66.1057, tier: 1 },
        { code: "CU", label: "La Habana", lat: 23.1136, lng: -82.3666, tier: 1 },
        { code: "JM", label: "Kingston", lat: 17.9712, lng: -76.7936, tier: 1 },
        { code: "HT", label: "Puerto Principe", lat: 18.5944, lng: -72.3074, tier: 1 },
        { code: "BS", label: "Nassau", lat: 25.0443, lng: -77.3504, tier: 2 },
        { code: "BB", label: "Bridgetown", lat: 13.0975, lng: -59.6167, tier: 2 },
        { code: "TT", label: "Port of Spain", lat: 10.6596, lng: -61.5086, tier: 2 },
        { code: "CW", label: "Willemstad", lat: 12.1224, lng: -68.8824, tier: 2 },
        { code: "AW", label: "Oranjestad", lat: 12.5092, lng: -70.0086, tier: 2 },
        { code: "LC", label: "Castries", lat: 14.0101, lng: -60.9875, tier: 3 },
        { code: "CO", label: "Cartagena", lat: 10.3910, lng: -75.4794, tier: 2 },
        { code: "PA", label: "Panama City", lat: 8.9824, lng: -79.5199, tier: 2 },
        { code: "VE", label: "Caracas", lat: 10.4806, lng: -66.9036, tier: 2 }
    ];

    const CARIBBEAN_LABEL_PRIORITY = new Set(["CU", "JM", "HT", "DO", "PR", "BS", "PA", "CO", "VE"]);
    const CARIBBEAN_LABEL_OFFSETS = {
        BS: { x: 1.8, y: -3.8, anchor: "start" },
        CU: { x: -3.8, y: 3.2, anchor: "end" },
        JM: { x: -3.4, y: 4.1, anchor: "end" },
        HT: { x: -2.8, y: -2.6, anchor: "end" },
        DO: { x: 2.1, y: 4.4, anchor: "start" },
        PR: { x: 3.0, y: -3.1, anchor: "start" },
        PA: { x: -2.8, y: 3.8, anchor: "end" },
        CO: { x: 2.6, y: 4.1, anchor: "start" },
        VE: { x: 3.0, y: 3.6, anchor: "start" }
    };
    const CARIBBEAN_PLACE_LABEL_PRIORITY = new Set([
        "Santo Domingo",
        "San Juan",
        "La Habana",
        "Kingston",
        "Nassau",
        "Bridgetown",
        "Port of Spain",
        "Cartagena"
    ]);

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

    function buildTopCountries(analytics = {}) {
        const rows = Array.isArray(analytics.countries) ? analytics.countries : [];
        return rows
            .map(row => ({
                code: String(row.code || row.countryCode || "").toUpperCase(),
                name: row.country || row.name || row.label || row.code || "Pais",
                value: Number(row.live || row.uniqueListeners || row.listeners || row.access || 0),
                listeningHours: Number(row.listeningHours || row.hours || 0)
            }))
            .filter(row => row.value > 0 || row.listeningHours > 0)
            .sort((a, b) => (b.value || b.listeningHours) - (a.value || a.listeningHours))
            .slice(0, 6);
    }

    function buildLiveConnections(analytics = {}) {
        const rows = Array.isArray(analytics.liveConnections) ? analytics.liveConnections : [];
        return rows.slice(0, 6).map((row, index) => ({
            id: row.id || `${row.country || row.name || "connection"}-${index}`,
            country: row.country || row.name || "Conexion",
            city: row.city || row.region || "",
            secondsAgo: Number(row.secondsAgo || row.ageSeconds || row.lastSeenSeconds || 0)
        }));
    }

    function formatAge(seconds) {
        if (!Number.isFinite(seconds) || seconds <= 0) return "ahora";
        if (seconds < 60) return `${Math.round(seconds)}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        return `${Math.round(seconds / 3600)}h`;
    }

    function getTooltipPosition(container, event) {
        const rect = container?.getBoundingClientRect();
        if (!rect) return { x: event.clientX + 14, y: event.clientY + 14 };
        const maxX = Math.max(12, rect.width - 236);
        const maxY = Math.max(12, rect.height - 156);
        return {
            x: Math.min(maxX, Math.max(12, event.clientX - rect.left + 14)),
            y: Math.min(maxY, Math.max(12, event.clientY - rect.top + 14))
        };
    }

    function buildSelectedPayload(selectedId, countries, activeRecords, caribbeanNodes) {
        if (!selectedId) return null;
        if (selectedId.startsWith("caribbean-")) {
            const code = selectedId.replace("caribbean-", "");
            const node = caribbeanNodes.find(item => item.code === code);
            if (!node) return null;
            const record = getRecordForCode(activeRecords, code);
            const live = record?.live ?? record?.uniqueListeners ?? record?.value ?? 0;
            return {
                title: node.label,
                kicker: node.group,
                meta: live > 0 ? `${formatAtlasNumber(live)} oyentes activos` : "Sin datos activos",
                detail: node.territory ? "Territorio caribeno monitoreado" : "Nodo WXM Caribe"
            };
        }

        const country = countries.find(featureItem => String(featureItem.id || "") === selectedId);
        if (!country) return null;
        const record = activeRecords.get(selectedId);
        const name = record?.name || getFeatureName(country);
        const live = record?.live ?? record?.uniqueListeners ?? record?.value ?? 0;
        return {
            title: name,
            kicker: record ? "Pais activo" : "Pais sin actividad",
            meta: record ? `${formatAtlasNumber(live)} oyentes activos` : "Sin conexiones recientes",
            detail: record?.routeNode ? "Nodo estrategico WXM" : "Datos agregados por pais"
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

    function NodeLabel({ point }) {
        if (!point) return null;
        return e("g", {
            className: "wxm-atlas-node-label is-marker-only",
            transform: `translate(${point[0]}, ${point[1]})`
        },
            e("circle", { r: 4, className: "wxm-atlas-node-dot" })
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
        const [atlasMode, setAtlasMode] = React.useState("world");
        const [zoomScale, setZoomScale] = React.useState(1);

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
                .scaleExtent([1, 9])
                .translateExtent([[-size.width, -size.height], [size.width * 2, size.height * 2]])
                .on("zoom", event => {
                    layer.attr("transform", event.transform.toString());
                    setZoomScale(event.transform.k);
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
        const compact = size.width < 720;
        const topCountries = buildTopCountries(analytics);
        const liveConnections = buildLiveConnections(analytics);
        const selectedPayload = buildSelectedPayload(selectedId, countries, activeRecords, CARIBBEAN_NODES);
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
        const caribbeanPlaces = CARIBBEAN_PLACES.map(place => ({
            ...place,
            point: projection([place.lng, place.lat])
        })).filter(place => place.point);
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
                setAtlasMode("caribbean");
                const center = projection([-70.8, 17.5]);
                if (!center) return;
                const scale = size.width < 720 ? 6.4 : 5.35;
                zoomBehaviorRef.current.transform(
                    transition,
                    d3.zoomIdentity
                        .translate(size.width / 2 - center[0] * scale, size.height / 2 - center[1] * scale)
                        .scale(scale)
                );
                return;
            }
            setAtlasMode("world");
            zoomBehaviorRef.current.transform(transition, d3.zoomIdentity);
        };

        return e("div", {
            className: [
                "wxm-atlas-shell",
                atlasMode === "caribbean" ? "is-caribbean-focus" : "",
                compact ? "is-compact-atlas" : ""
            ].filter(Boolean).join(" "),
            ref: containerRef
        },
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
                e("button", { type: "button", onClick: () => applyZoom("reset"), "aria-label": "Centrar mapa" }, "Mundo")
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
                                    const position = getTooltipPosition(containerRef.current, event);
                                    setTooltip({
                                        x: position.x,
                                        y: position.y,
                                        ...buildTooltipPayload(name, record, isActive)
                                    });
                                },
                                onMouseLeave: () => setTooltip(null)
                            });
                        })
                    ),
                    atlasMode === "world" ? e("g", { className: "wxm-atlas-routes" },
                        topRoutes.map((route, index) => route.path
                            ? e("g", { key: route.id, className: "wxm-atlas-route-group" },
                                e("path", {
                                    id: `wxm-route-${route.id}`,
                                    d: route.path,
                                    className: "wxm-atlas-route",
                                    style: { animationDelay: `${index * 0.35}s` }
                                }),
                                e("circle", { r: "2.8", className: "wxm-atlas-route-pulse" },
                                    e("animateMotion", {
                                        dur: `${4.8 + index * 0.24}s`,
                                        repeatCount: "indefinite",
                                        path: route.path
                                    })
                                )
                            )
                            : null)
                    ) : null,
                    e("g", { className: "wxm-atlas-caribbean-nodes", "aria-label": "Capa Caribe WXM" },
                        caribbeanNodes.map(node => {
                            const active = isLiveCaribbeanRecord(node.record);
                            const selected = selectedId === `caribbean-${node.code}`;
                            const showLabel = selected;
                            const labelOffset = CARIBBEAN_LABEL_OFFSETS[node.code] || { x: 2.6, y: -2.8, anchor: "start" };
                            const markerRadius = atlasMode === "caribbean"
                                ? (selected ? 1.32 : node.major ? 1.12 : active ? 0.98 : 0.62)
                                : (node.major ? 2.8 : 1.8);
                            const className = [
                                "wxm-atlas-caribbean-node",
                                active ? "is-active" : "is-idle",
                                node.major ? "is-major" : "",
                                node.territory ? "is-territory" : "",
                                selected ? "is-selected" : "",
                                showLabel ? "has-label" : ""
                            ].filter(Boolean).join(" ");
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
                                    const position = getTooltipPosition(containerRef.current, event);
                                    setTooltip({
                                        x: position.x,
                                        y: position.y,
                                        ...buildCaribbeanTooltipPayload(node, node.record)
                                    });
                                },
                                onMouseLeave: () => setTooltip(null)
                            },
                                e("circle", { r: markerRadius }),
                                showLabel ? e("text", { x: labelOffset.x, y: labelOffset.y, textAnchor: labelOffset.anchor }, node.label) : null
                            );
                        })
                    ),
                    atlasMode === "caribbean" ? e("g", { className: "wxm-atlas-caribbean-places", "aria-label": "Ciudades principales del Caribe" },
                        caribbeanPlaces.map(place => {
                            const showPlaceLabel = false;
                            return e("g", {
                                key: `${place.code}-${place.label}`,
                                className: `wxm-atlas-place-node is-tier-${place.tier} ${showPlaceLabel ? "has-label" : "is-dot-only"}`,
                                transform: `translate(${place.point[0]}, ${place.point[1]})`
                            },
                                e("circle", { r: place.tier === 1 ? 0.98 : 0.72 }),
                                showPlaceLabel ? e("text", { x: 1.7, y: place.tier === 1 ? -1.9 : -1.5 }, place.label) : null
                            );
                        })
                    ) : null,
                    e("g", { className: "wxm-atlas-nodes" },
                        originPoint && atlasMode === "world"
                            ? e("g", { className: "wxm-atlas-origin", transform: `translate(${originPoint[0]}, ${originPoint[1]})` },
                                e("circle", { r: 13, className: "wxm-atlas-origin-halo" }),
                                e("circle", { r: 5.5, className: "wxm-atlas-origin-core" })
                            )
                            : null,
                        !compact && atlasMode === "world" ? topRoutes.map(route => e(NodeLabel, {
                            key: `${route.id}-label`,
                            point: route.point,
                            label: route.label,
                            country: route.country
                        })) : null
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

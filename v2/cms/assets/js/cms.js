const CMC_LOCAL_URL = "../assets/data/wxm-cmc.json";
const DRAFT_KEY = "wxm_cmc_admin_draft";
const REMOTE_ENDPOINT_KEY = "wxm_cmc_endpoint";
const PREVIEW_HIDDEN_KEY = "wxm_cms_preview_hidden";
const GOOGLE_MAPS_KEY = "wxm_cms_google_maps_key";
const ASSET_ENDPOINT_KEY = "wxm_cms_asset_endpoint";
const ADVANCED_VISIBLE_KEY = "wxm_cms_advanced_visible";
const ATLAS_MAP_DATASET_URL = "assets/maps/countries-110m.json";
const REMOTE_ANALYTICS_TIMEOUT_MS = 8000;
const MAX_EMBEDDED_IMAGE_CHARS = 900_000;
const MAX_UPLOAD_IMAGE_BYTES = 8 * 1024 * 1024;
let generatedFieldId = 0;

const IMAGE_PRESETS = {
    logo: {
        hint: "Recomendado: 1024x1024 PNG/WEBP, maximo 700 KB para produccion.",
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.82
    },
    hero: {
        hint: "Recomendado: 1920x1080 o 1600x900 WEBP/JPG, maximo 900 KB para produccion.",
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.82
    },
    banner: {
        hint: "Recomendado: 1600x900 WEBP/JPG para portada, eventos y promociones.",
        maxWidth: 1600,
        maxHeight: 900,
        quality: 0.82
    },
    program: {
        hint: "Recomendado: 1200x675 WEBP/JPG para ficha de programa.",
        maxWidth: 1200,
        maxHeight: 675,
        quality: 0.82
    },
    presenter: {
        hint: "Recomendado: 1080x1080 WEBP/JPG para locutor o DJ.",
        maxWidth: 1080,
        maxHeight: 1080,
        quality: 0.84
    },
    square: {
        hint: "Recomendado: 1024x1024 WEBP/JPG para canal, podcast o portada cuadrada.",
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.82
    },
    article: {
        hint: "Recomendado: 1200x675 WEBP/JPG para noticias y articulos.",
        maxWidth: 1200,
        maxHeight: 675,
        quality: 0.82
    },
    sponsor: {
        hint: "Recomendado: 1600x900 WEBP/JPG para sponsor o aliado.",
        maxWidth: 1600,
        maxHeight: 900,
        quality: 0.82
    }
};

const COUNTRY_COORDINATES = {
    CA: [56.13, -106.35],
    US: [39.82, -98.58],
    ES: [40.46, -3.75],
    FI: [61.92, 25.75],
    HU: [47.16, 19.5],
    DO: [18.74, -70.16],
    MX: [23.63, -102.55],
    CO: [4.57, -74.3],
    PR: [18.22, -66.59],
    PA: [8.54, -80.78],
    CL: [-35.68, -71.54],
    AR: [-38.42, -63.62],
    PE: [-9.19, -75.02],
    EC: [-1.83, -78.18],
    VE: [6.42, -66.59],
    BR: [-14.24, -51.93],
    GB: [55.38, -3.44],
    FR: [46.23, 2.21],
    DE: [51.17, 10.45],
    IT: [41.87, 12.57],
    NL: [52.13, 5.29],
    PT: [39.4, -8.22],
    JP: [36.2, 138.25],
    AU: [-25.27, 133.78],
    AE: [23.42, 53.85],
    UNKNOWN: [20, 0]
};

const COUNTRY_NAME_TO_CODE = {
    canada: "CA",
    "united states": "US",
    "estados unidos": "US",
    spain: "ES",
    espana: "ES",
    "dominican republic": "DO",
    "republica dominicana": "DO",
    mexico: "MX",
    colombia: "CO",
    "puerto rico": "PR",
    panama: "PA",
    chile: "CL",
    argentina: "AR",
    peru: "PE",
    ecuador: "EC",
    venezuela: "VE",
    brazil: "BR",
    brasil: "BR",
    "united kingdom": "GB",
    london: "GB",
    france: "FR",
    germany: "DE",
    italy: "IT",
    netherlands: "NL",
    portugal: "PT",
    japan: "JP",
    australia: "AU",
    "united arab emirates": "AE",
    dubai: "AE"
};

const FEATURE_LABELS = {
    banners: ["Banners", "Portadas editoriales con imagen para Inicio y Explorar."],
    miniPlayer: ["Mini player", "Barra compacta y controles persistentes."],
    languageSelector: ["Idiomas", "Selector ES/EN preparado para la app."],
    editorialHighlights: ["Destacados", "Promos, eventos y contenido editorial."],
    programs: ["Programas", "Parrilla y fichas de programas."],
    presenters: ["Locutores", "Perfiles visibles de DJs, cabina y talentos."],
    requests: ["Peticiones", "Pedir canciones y contactar cabina."],
    history: ["Historial", "Canciones recientes y semana."],
    favorites: ["Favoritos", "Canciones guardadas por usuario."],
    sleepTimer: ["Sleep timer", "Apagado programado."],
    fallbackStreams: ["Fallback streams", "Fuentes secundarias de audio."],
    audioProfiles: ["Audio profiles", "Perfiles DSP cuando esten listos."],
    secondaryStations: ["Radios secundarias", "Canales extra tipo WXM Urban, Club o Chill."],
    podcasts: ["Podcasts", "Replays, entrevistas y episodios."],
    mixes: ["Mixes", "Sesiones y sets curados."],
    news: ["Noticias", "Contenido editorial tipo magazine."],
    videos: ["Videos", "Clips y WXM TV."],
    songQuiz: ["Que cancion es", "Juego/descubrimiento musical."],
    replays: ["Replays", "Programas grabados."],
    polls: ["Encuestas", "Votaciones y preguntas para la comunidad."],
    sponsors: ["Sponsors", "Promociones, aliados y monetizacion editorial."],
    emergencyMode: ["Modo emergencia", "Avisos y stream alterno ante incidencias."],
    visualConfig: ["Visual remoto", "Tema, acento e imagen hero desde CMC."],
    audioExperience: ["Audio experience", "Perfil recomendado y ajustes de red/audio."],
    analyticsDashboard: ["Analytics", "Audiencia, players, paises y origen App/Web."]
};

const DEFAULT_CMC = {
    revision: "2026-05-20-cms-draft",
    source: "local",
    station: {
        name: "WXM ONE RADIO",
        domain: "wxmoneradio.com",
        slogan: "La radio que conecta al mundo",
        subtitle: "Music & Culture",
        logo: "assets/img/brand/wxm-emblem-square.png"
    },
    stream: {
        primaryUrl: "https://jm8n.net:8024/stream",
        fallbackUrls: [],
        infoApi: "https://jm8n.net/cp/get_info.php?p=8024",
        reconnectIntervalMs: 5000,
        maxRetries: 5
    },
    features: Object.fromEntries(Object.keys(FEATURE_LABELS).map(key => [key, false])),
    emergency: {
        enabled: false,
        severity: "info",
        title: "WXM en vivo",
        message: "La senal opera normalmente.",
        streamUrl: ""
    },
    visual: {
        themeDefault: "dark",
        heroImage: "assets/img/brand/hero-world-wide.png",
        accentColor: "#e91e63"
    },
    audioExperience: {
        enabled: true,
        recommendedProfile: "standard",
        lowDataMode: false,
        networkWarning: true
    },
    analytics: {
        enabled: true,
        mode: "local-sample",
        periodLabel: "Ultimos 7 dias",
        periodRange: {
            start: "Apr 30, 2026",
            end: "May 30, 2026"
        },
        ingestEndpoint: "",
        dashboardEndpoint: "",
        retentionDays: 90,
        map: {
            provider: "local"
        },
        kpis: {
            liveListeners: 9,
            peakAudience: 9,
            peakAt: "04:05",
            avgHoursDay: 0,
            avgListeningTimeMin: 0,
            totalListeningHours: 0,
            appUsers: 5
        },
        listeningHoursTrend: [
            { label: "May 12", value: 0 },
            { label: "May 13", value: 0 },
            { label: "May 14", value: 0 },
            { label: "May 15", value: 0 },
            { label: "May 16", value: 0 },
            { label: "May 17", value: 0 },
            { label: "May 18", value: 0 }
        ],
        audienceRealtime: [
            { label: "03:30", value: 6 },
            { label: "03:35", value: 7 },
            { label: "03:40", value: 7 },
            { label: "03:45", value: 7 },
            { label: "03:50", value: 8 },
            { label: "03:55", value: 8 },
            { label: "04:00", value: 9 },
            { label: "04:05", value: 9 },
            { label: "04:10", value: 9 },
            { label: "04:15", value: 8 }
        ],
        quickSeries: {
            listeningHours: [
                { label: "May 03", value: 0 },
                { label: "May 06", value: 0 },
                { label: "May 09", value: 0 },
                { label: "May 12", value: 0 },
                { label: "May 15", value: 0 },
                { label: "May 18", value: 0 },
                { label: "May 21", value: 0 },
                { label: "May 24", value: 0 },
                { label: "May 27", value: 0 },
                { label: "May 30", value: 0 }
            ],
            uniqueListeners: [
                { label: "May 03", value: 1 },
                { label: "May 06", value: 2 },
                { label: "May 09", value: 2 },
                { label: "May 12", value: 3 },
                { label: "May 15", value: 3 },
                { label: "May 18", value: 4 },
                { label: "May 21", value: 4 },
                { label: "May 24", value: 5 },
                { label: "May 27", value: 5 },
                { label: "May 30", value: 6 }
            ],
            accessCount: [
                { label: "May 03", value: 2 },
                { label: "May 06", value: 3 },
                { label: "May 09", value: 3 },
                { label: "May 12", value: 4 },
                { label: "May 15", value: 5 },
                { label: "May 18", value: 5 },
                { label: "May 21", value: 6 },
                { label: "May 24", value: 7 },
                { label: "May 27", value: 7 },
                { label: "May 30", value: 8 }
            ]
        },
        countries: [
            { country: "Canada", code: "CA", listeningHours: 0, access: 3, uniqueListeners: 3, distinctIps: 3, live: 3 },
            { country: "United States", code: "US", listeningHours: 0, access: 2, uniqueListeners: 2, distinctIps: 2, live: 2 },
            { country: "Spain", code: "ES", listeningHours: 0, access: 1, uniqueListeners: 1, distinctIps: 1, live: 1 },
            { country: "Finland", code: "FI", listeningHours: 0, access: 1, uniqueListeners: 1, distinctIps: 1, live: 1 },
            { country: "Hungary", code: "HU", listeningHours: 0, access: 1, uniqueListeners: 1, distinctIps: 1, live: 1 },
            { country: "Dominican Republic", code: "DO", listeningHours: 0, access: 1, uniqueListeners: 1, distinctIps: 1, live: 1 }
        ],
        players: [
            { name: "WXM Android App", key: "wxm_android_app", listeningHours: 0, access: 5, uniqueListeners: 5, distinctIps: 5 },
            { name: "Web Browser", key: "wxm_web_app", listeningHours: 0, access: 2, uniqueListeners: 2, distinctIps: 2 },
            { name: "External Player", key: "external_player", listeningHours: 0, access: 1, uniqueListeners: 1, distinctIps: 1 }
        ],
        referrers: [
            { name: "WXM Android App", source: "wxm_android_app", listeningHours: 0, access: 5, uniqueListeners: 5, distinctIps: 5 },
            { name: "Direct", source: "direct", listeningHours: 0, access: 2, uniqueListeners: 2, distinctIps: 2 },
            { name: "wxmoneradio.com", source: "official_site", listeningHours: 0, access: 1, uniqueListeners: 1, distinctIps: 1 }
        ],
        liveConnections: [
            { country: "Hungary", ageSeconds: 9 },
            { country: "Canada", ageSeconds: 53 },
            { country: "Canada", ageSeconds: 56 },
            { country: "United States", ageSeconds: 77 },
            { country: "Dominican Republic", ageSeconds: 82 }
        ],
        quickStats: {
            uniqueListeners: { yesterday: 0, week: 0, month: 0, selected: 0 },
            listeningHours: { yesterday: 0, week: 0, month: 0, selected: 0 },
            accessCount: { yesterday: 0, week: 0, month: 0, selected: 0 }
        }
    },
    content: {
        banners: [],
        schedule: [],
        highlights: [],
        presenters: [],
        articles: [],
        podcasts: [],
        stations: [],
        polls: [],
        sponsors: []
    }
};

const dom = {
    sidebarStatus: document.getElementById("sidebarStatus"),
    nav: document.querySelectorAll(".nav-pill"),
    panels: document.querySelectorAll(".cms-section"),
    previewPanel: document.querySelector(".preview-panel"),
    togglePreviewBtn: document.getElementById("togglePreviewBtn"),
    reloadBtn: document.getElementById("reloadBtn"),
    saveDraftBtn: document.getElementById("saveDraftBtn"),
    addFallbackBtn: document.getElementById("addFallbackBtn"),
    addScheduleBtn: document.getElementById("addScheduleBtn"),
    addHighlightBtn: document.getElementById("addHighlightBtn"),
    addBannerBtn: document.getElementById("addBannerBtn"),
    addPresenterBtn: document.getElementById("addPresenterBtn"),
    addArticleBtn: document.getElementById("addArticleBtn"),
    addPodcastBtn: document.getElementById("addPodcastBtn"),
    addStationBtn: document.getElementById("addStationBtn"),
    addPollBtn: document.getElementById("addPollBtn"),
    addSponsorBtn: document.getElementById("addSponsorBtn"),
    downloadAppJsonBtn: document.getElementById("downloadAppJsonBtn"),
    copyAppJsonBtn: document.getElementById("copyAppJsonBtn"),
    downloadJsonBtn: document.getElementById("downloadJsonBtn"),
    copyJsonBtn: document.getElementById("copyJsonBtn"),
    saveEndpointBtn: document.getElementById("saveEndpointBtn"),
    saveAssetEndpointBtn: document.getElementById("saveAssetEndpointBtn"),
    uploadEmbeddedAssetsBtn: document.getElementById("uploadEmbeddedAssetsBtn"),
    downloadAssetPackageBtn: document.getElementById("downloadAssetPackageBtn"),
    remoteEndpoint: document.getElementById("remoteEndpoint"),
    assetUploadEndpoint: document.getElementById("assetUploadEndpoint"),
    assetPipelineStatus: document.getElementById("assetPipelineStatus"),
    publishGateStatus: document.getElementById("publishGateStatus"),
    fallbackList: document.getElementById("fallbackList"),
    scheduleList: document.getElementById("scheduleList"),
    highlightList: document.getElementById("highlightList"),
    bannerList: document.getElementById("bannerList"),
    presenterList: document.getElementById("presenterList"),
    articleList: document.getElementById("articleList"),
    podcastList: document.getElementById("podcastList"),
    stationList: document.getElementById("stationList"),
    pollList: document.getElementById("pollList"),
    sponsorList: document.getElementById("sponsorList"),
    analyticsPeriod: document.getElementById("analyticsPeriod"),
    analyticsDateRange: document.getElementById("analyticsDateRange"),
    analyticsSource: document.getElementById("analyticsSource"),
    analyticsMode: document.getElementById("analyticsMode"),
    analyticsRetention: document.getElementById("analyticsRetention"),
    analyticsIngestEndpoint: document.getElementById("analyticsIngestEndpoint"),
    analyticsDashboardEndpoint: document.getElementById("analyticsDashboardEndpoint"),
    analyticsMapProvider: document.getElementById("analyticsMapProvider"),
    analyticsGoogleMapsKey: document.getElementById("analyticsGoogleMapsKey"),
    dashboardAnalyticsMapStatus: document.getElementById("dashboardAnalyticsMapStatus"),
    analyticsMapStatus: document.getElementById("analyticsMapStatus"),
    analyticsLiveListeners: document.getElementById("analyticsLiveListeners"),
    analyticsPeakAudience: document.getElementById("analyticsPeakAudience"),
    analyticsPeakAt: document.getElementById("analyticsPeakAt"),
    analyticsAvgHours: document.getElementById("analyticsAvgHours"),
    analyticsAvgTime: document.getElementById("analyticsAvgTime"),
    analyticsAppUsers: document.getElementById("analyticsAppUsers"),
    analyticsTotalHours: document.getElementById("analyticsTotalHours"),
    listeningHoursChart: document.getElementById("listeningHoursChart"),
    audienceRealtimeChart: document.getElementById("audienceRealtimeChart"),
    quickListeningChart: document.getElementById("quickListeningChart"),
    quickUniqueChart: document.getElementById("quickUniqueChart"),
    quickAccessChart: document.getElementById("quickAccessChart"),
    quickListeningTotal: document.getElementById("quickListeningTotal"),
    quickUniqueTotal: document.getElementById("quickUniqueTotal"),
    quickAccessTotal: document.getElementById("quickAccessTotal"),
    playersAudienceChart: document.getElementById("playersAudienceChart"),
    referrersAudienceChart: document.getElementById("referrersAudienceChart"),
    dashboardAnalyticsMap: document.getElementById("dashboardAnalyticsMap"),
    analyticsMap: document.getElementById("analyticsMap"),
    dashboardLiveConnectionsList: document.getElementById("dashboardLiveConnectionsList"),
    liveConnectionsList: document.getElementById("liveConnectionsList"),
    topCountriesList: document.getElementById("topCountriesList"),
    topPlayersList: document.getElementById("topPlayersList"),
    topReferrersList: document.getElementById("topReferrersList"),
    countriesDonut: document.getElementById("countriesDonut"),
    playersDonut: document.getElementById("playersDonut"),
    countriesAnalyticsTable: document.getElementById("countriesAnalyticsTable"),
    playersAnalyticsTable: document.getElementById("playersAnalyticsTable"),
    referrersAnalyticsTable: document.getElementById("referrersAnalyticsTable"),
    quickStatsTable: document.getElementById("quickStatsTable"),
    exportAnalyticsBtn: document.getElementById("exportAnalyticsBtn"),
    refreshRemoteAnalyticsBtn: document.getElementById("refreshRemoteAnalyticsBtn"),
    analyticsTabs: document.querySelectorAll(".analytics-tab"),
    analyticsTabPanels: document.querySelectorAll(".analytics-tab-panel"),
    systemTabs: document.querySelectorAll(".system-tab"),
    systemTabPanels: document.querySelectorAll(".system-tab-panel"),
    toggleAdvancedBtn: document.getElementById("toggleAdvancedBtn"),
    leaveAdvancedBtn: document.getElementById("leaveAdvancedBtn"),
    featureGrid: document.getElementById("featureGrid"),
    appJsonOutput: document.getElementById("appJsonOutput"),
    jsonOutput: document.getElementById("jsonOutput"),
    validationList: document.getElementById("validationList"),
    readinessCard: document.getElementById("readinessCard"),
    readinessTitle: document.getElementById("readinessTitle"),
    readinessSummary: document.getElementById("readinessSummary"),
    readinessIssues: document.getElementById("readinessIssues"),
    toast: document.getElementById("toast"),
    metricRevision: document.getElementById("metricRevision"),
    metricStream: document.getElementById("metricStream"),
    metricFallbacks: document.getElementById("metricFallbacks"),
    metricFeatures: document.getElementById("metricFeatures"),
    previewLogo: document.getElementById("previewLogo"),
    previewName: document.getElementById("previewName"),
    previewSlogan: document.getElementById("previewSlogan"),
    previewProgram: document.getElementById("previewProgram"),
    previewHost: document.getElementById("previewHost"),
    previewHighlights: document.getElementById("previewHighlights"),
    stationName: document.getElementById("stationName"),
    stationDomain: document.getElementById("stationDomain"),
    stationSlogan: document.getElementById("stationSlogan"),
    stationSubtitle: document.getElementById("stationSubtitle"),
    stationLogo: document.getElementById("stationLogo"),
    stationLogoFile: document.getElementById("stationLogoFile"),
    stationLogoPreview: document.getElementById("stationLogoPreview"),
    streamPrimary: document.getElementById("streamPrimary"),
    streamInfoApi: document.getElementById("streamInfoApi"),
    streamReconnect: document.getElementById("streamReconnect"),
    streamRetries: document.getElementById("streamRetries"),
    emergencyEnabled: document.getElementById("emergencyEnabled"),
    emergencySeverity: document.getElementById("emergencySeverity"),
    emergencyTitle: document.getElementById("emergencyTitle"),
    emergencyStream: document.getElementById("emergencyStream"),
    emergencyMessage: document.getElementById("emergencyMessage"),
    visualTheme: document.getElementById("visualTheme"),
    visualAccent: document.getElementById("visualAccent"),
    visualHero: document.getElementById("visualHero"),
    visualHeroFile: document.getElementById("visualHeroFile"),
    visualHeroPreview: document.getElementById("visualHeroPreview"),
    audioProfile: document.getElementById("audioProfile"),
    audioLowData: document.getElementById("audioLowData")
};

let state = clone(DEFAULT_CMC);
let previewHidden = localStorage.getItem(PREVIEW_HIDDEN_KEY) === "true";
let advancedVisible = localStorage.getItem(ADVANCED_VISIBLE_KEY) === "true";
let activePanel = "overview";
let activeSystemTab = "operations";
let googleMapsLoadPromise = null;
let googleMapContexts = new Map();
let remoteAnalyticsState = {
    loading: false,
    lastLoadedAt: "",
    error: ""
};

const SYSTEM_TAB_ALIASES = {
    stream: "operations",
    emergency: "operations",
    visual: "app",
    audio: "app",
    analytics: "advanced",
    assets: "advanced",
    faq: "advanced"
};

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function text(value, fallback = "") {
    return String(value ?? fallback).replace(/[\u0000-\u001f\u007f]/g, "").trim();
}

function isHttps(value) {
    try {
        return new URL(String(value)).protocol === "https:";
    } catch {
        return false;
    }
}

function isLocalHttp(value) {
    try {
        const url = new URL(String(value));
        return url.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    } catch {
        return false;
    }
}

function isAdminEndpoint(value) {
    return isHttps(value) || isLocalHttp(value);
}

function isAssetOrHttps(value) {
    const safe = text(value);
    return isHttps(safe) || safe.startsWith("assets/img/") || isDataImage(safe);
}

function isDataImage(value) {
    const safe = String(value || "").trim();
    return safe.length <= MAX_EMBEDDED_IMAGE_CHARS
        && /^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=]+$/i.test(safe);
}

function normalizeImageInput(value, fallback = "") {
    const safe = text(value);
    if (isDataImage(safe)) return safe;
    const compact = safe.slice(0, 260);
    return isAssetOrHttps(compact) ? compact : fallback;
}

function isSafeActionUrl(value) {
    const safe = text(value);
    if (!safe) return true;
    try {
        const parsed = new URL(safe);
        return ["https:", "mailto:", "tel:"].includes(parsed.protocol);
    } catch {
        return false;
    }
}

function safeUrl(value) {
    const safe = text(value).slice(0, 260);
    return isHttps(safe) ? safe : "";
}

function safeAdminUrl(value) {
    const safe = text(value).slice(0, 260);
    return isAdminEndpoint(safe) ? safe : "";
}

function safeImage(value, fallback = "") {
    return normalizeImageInput(value, fallback);
}

function imageInputDisplay(value) {
    return isDataImage(value) ? "Imagen local embebida en este CMC" : (value || "");
}

function resolveImageSrc(value) {
    const safe = text(value);
    if (!safe) return "";
    return safe.startsWith("assets/") ? `../${safe}` : safe;
}

function setText(node, value) {
    if (node) node.textContent = value;
}

function applyPreviewState() {
    const analyticsMode = activePanel === "analytics";
    document.body.classList.toggle("preview-hidden", previewHidden);
    document.body.classList.toggle("analytics-focus", analyticsMode);
    if (dom.togglePreviewBtn) {
        dom.togglePreviewBtn.textContent = previewHidden ? "Mostrar preview" : "Ocultar preview";
        dom.togglePreviewBtn.setAttribute("aria-pressed", String(previewHidden));
    }
}

function applyAdvancedVisibility() {
    const advancedTab = [...dom.systemTabs].find(button => button.dataset.systemTab === "advanced");
    if (advancedTab) {
        advancedTab.hidden = !advancedVisible;
        advancedTab.setAttribute("aria-hidden", String(!advancedVisible));
    }
    if (dom.toggleAdvancedBtn) {
        dom.toggleAdvancedBtn.textContent = advancedVisible ? "Ocultar avanzado" : "Mostrar avanzado";
        dom.toggleAdvancedBtn.setAttribute("aria-pressed", String(advancedVisible));
    }
}

function setAdvancedVisible(visible, persist = true) {
    advancedVisible = Boolean(visible);
    if (!advancedVisible && activeSystemTab === "advanced") {
        activeSystemTab = "operations";
    }
    if (persist) localStorage.setItem(ADVANCED_VISIBLE_KEY, String(advancedVisible));
    applyAdvancedVisibility();
}

function setPreviewHidden(hidden, persist = true) {
    previewHidden = Boolean(hidden);
    if (persist) localStorage.setItem(PREVIEW_HIDDEN_KEY, String(previewHidden));
    applyPreviewState();
}

function showAnalyticsTab(name) {
    const target = name || "dashboard";
    dom.analyticsTabs.forEach(button => {
        const active = button.dataset.analyticsTab === target;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
    });
    dom.analyticsTabPanels.forEach(panel => {
        const active = panel.dataset.analyticsPanel === target;
        panel.classList.toggle("active", active);
        panel.toggleAttribute("hidden", !active);
        panel.setAttribute("aria-hidden", String(!active));
    });
}

function showSystemTab(name) {
    const target = SYSTEM_TAB_ALIASES[name] || name || "operations";
    if (target === "advanced" && !advancedVisible) setAdvancedVisible(true);
    activeSystemTab = target;
    applyAdvancedVisibility();
    dom.systemTabs.forEach(button => {
        const active = button.dataset.systemTab === target;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
    });
    dom.systemTabPanels.forEach(panel => {
        const active = panel.dataset.systemPanel === target;
        panel.classList.toggle("active", active);
        panel.toggleAttribute("hidden", !active);
        panel.setAttribute("aria-hidden", String(!active));
    });
}

function setupTabSemantics(tabs, panels, prefix, tabDatasetKey, panelDatasetKey) {
    tabs.forEach(button => {
        const key = button.dataset[tabDatasetKey];
        if (!key) return;
        button.id = button.id || `${prefix}-tab-${key}`;
        button.setAttribute("aria-controls", `${prefix}-panel-${key}`);
    });

    panels.forEach(panel => {
        const key = panel.dataset[panelDatasetKey];
        if (!key) return;
        panel.id = panel.id || `${prefix}-panel-${key}`;
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", `${prefix}-tab-${key}`);
        panel.setAttribute("aria-hidden", String(!panel.classList.contains("active")));
        panel.toggleAttribute("hidden", !panel.classList.contains("active"));
    });
}

function setupInterfaceSemantics() {
    dom.panels.forEach(panel => {
        const key = panel.dataset.panel;
        if (!key) return;
        panel.id = panel.id || `cms-panel-${key}`;
        const heading = panel.querySelector("h2, h3");
        if (heading) {
            heading.id = heading.id || `${panel.id}-heading`;
            panel.setAttribute("aria-labelledby", heading.id);
        }
        panel.setAttribute("aria-hidden", String(!panel.classList.contains("active")));
        panel.toggleAttribute("hidden", !panel.classList.contains("active"));
    });

    dom.nav.forEach(button => {
        const key = button.dataset.section;
        const panel = key ? document.getElementById(`cms-panel-${key}`) : null;
        button.type = "button";
        if (panel) button.setAttribute("aria-controls", panel.id);
        button.setAttribute("aria-expanded", String(button.classList.contains("active")));
        if (button.classList.contains("active")) {
            button.setAttribute("aria-current", "page");
        } else {
            button.removeAttribute("aria-current");
        }
    });

    setupTabSemantics(dom.analyticsTabs, dom.analyticsTabPanels, "analytics", "analyticsTab", "analyticsPanel");
    setupTabSemantics(dom.systemTabs, dom.systemTabPanels, "system", "systemTab", "systemPanel");
}

function boundedNumber(value, fallback, min, max) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
}

function validTime(value) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ""));
}

function payloadBytes(value) {
    return new Blob([JSON.stringify(value)]).size;
}

function safeIcon(value) {
    return /^fa-[a-z0-9-]+$/i.test(String(value || "")) ? value : "fa-bolt";
}

function setSelectValue(node, value) {
    if (!node) return;
    node.value = String(value);
}

function nextFieldId(prefix = "cms-field") {
    generatedFieldId += 1;
    return `${prefix}-${generatedFieldId}`;
}

function field(label, value, onInput, options = {}) {
    const wrapper = document.createElement("label");
    wrapper.className = options.wide ? "field wide" : "field";

    const span = document.createElement("span");
    span.textContent = label;

    const input = options.multiline ? document.createElement("textarea") : document.createElement("input");
    input.value = value ?? "";
    input.maxLength = options.maxLength || 180;
    if (options.type) input.type = options.type;
    if (options.placeholder) input.placeholder = options.placeholder;
    input.addEventListener("input", () => {
        onInput(input.value);
        refreshDerived();
    });

    wrapper.append(span, input);
    return wrapper;
}

function imageField(label, value, onInput, options = {}) {
    const preset = options.preset || IMAGE_PRESETS.banner;
    const fieldId = nextFieldId("cms-image");
    const labelId = `${fieldId}-label`;
    const hintId = `${fieldId}-hint`;
    const wrapper = document.createElement("div");
    wrapper.className = options.wide === false ? "field image-field" : "field image-field wide";

    const span = document.createElement("span");
    span.id = labelId;
    span.textContent = label;

    const input = document.createElement("input");
    input.id = `${fieldId}-url`;
    input.type = "text";
    input.maxLength = MAX_EMBEDDED_IMAGE_CHARS;
    input.placeholder = "assets/img/... o https://...";
    input.setAttribute("aria-labelledby", labelId);
    input.setAttribute("aria-describedby", hintId);
    input.setAttribute("autocomplete", "off");
    input.value = imageInputDisplay(value);
    input.addEventListener("input", () => {
        onInput(normalizeImageInput(input.value));
        refreshDerived();
    });

    const hint = document.createElement("small");
    hint.id = hintId;
    hint.className = "image-hint";
    hint.textContent = `${preset.hint} Puedes elegir archivo local para borrador o usar URL HTTPS/CDN en produccion.`;

    const controls = document.createElement("div");
    controls.className = "image-tools";

    const fileInput = document.createElement("input");
    fileInput.id = `${fieldId}-file`;
    fileInput.className = "image-file-input";
    fileInput.type = "file";
    fileInput.accept = "image/png,image/jpeg,image/webp";
    fileInput.setAttribute("aria-label", `Seleccionar archivo para ${label}`);
    fileInput.setAttribute("aria-describedby", hintId);
    fileInput.addEventListener("change", async () => {
        const prepared = await handleImageFile(fileInput, preset);
        if (!prepared) return;
        onInput(prepared.dataUrl);
        input.value = imageInputDisplay(prepared.dataUrl);
        renderImagePreview(preview, prepared.dataUrl);
        refreshDerived();
    });

    const clearButton = document.createElement("button");
    clearButton.className = "ghost-btn tiny-btn";
    clearButton.type = "button";
    clearButton.textContent = "Limpiar";
    clearButton.setAttribute("aria-label", `Limpiar imagen de ${label}`);
    clearButton.addEventListener("click", () => {
        onInput("");
        input.value = "";
        renderImagePreview(preview, "");
        refreshDerived();
    });

    controls.append(fileInput, clearButton);

    const preview = document.createElement("div");
    preview.className = "image-preview";
    renderImagePreview(preview, value);

    wrapper.append(span, input, hint, controls, preview);
    return wrapper;
}

async function handleImageFile(fileInput, preset) {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    if (!file) return null;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
        toast("Formato no permitido. Usa PNG, JPG o WEBP.");
        return null;
    }
    if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
        toast("Imagen demasiado pesada. Usa una menor de 8 MB.");
        return null;
    }
    try {
        const prepared = await prepareImageFile(file, preset);
        toast(`Imagen lista ${prepared.width}x${prepared.height}`);
        return prepared;
    } catch (error) {
        toast(error?.message || "No se pudo preparar la imagen");
        return null;
    }
}

function prepareImageFile(file, preset) {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            const scale = Math.min(1, preset.maxWidth / img.naturalWidth, preset.maxHeight / img.naturalHeight);
            const width = Math.max(1, Math.round(img.naturalWidth * scale));
            const height = Math.max(1, Math.round(img.naturalHeight * scale));
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d", { alpha: true });
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, width, height);

            const qualities = [preset.quality || 0.82, 0.74, 0.66, 0.58];
            for (const quality of qualities) {
                const dataUrl = canvas.toDataURL("image/webp", quality);
                if (isDataImage(dataUrl)) {
                    resolve({
                        dataUrl,
                        width,
                        height,
                        originalWidth: img.naturalWidth,
                        originalHeight: img.naturalHeight
                    });
                    return;
                }
            }
            reject(new Error("La imagen preparada sigue muy pesada. Reduce dimensiones o usa WEBP."));
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("No se pudo leer la imagen."));
        };
        img.src = objectUrl;
    });
}

function renderImagePreview(container, value) {
    if (!container) return;
    container.replaceChildren();
    if (!isAssetOrHttps(value)) {
        const empty = document.createElement("small");
        empty.textContent = "Sin preview";
        container.append(empty);
        return;
    }
    const img = document.createElement("img");
    img.src = resolveImageSrc(value);
    img.alt = "Preview de imagen CMS";
    const meta = document.createElement("small");
    meta.textContent = isDataImage(value)
        ? "Imagen local embebida. Para produccion, conviene subirla a hosting/CDN HTTPS."
        : value;
    container.append(img, meta);
}

function normalizeCmc(payload) {
    const base = clone(DEFAULT_CMC);
    const data = payload && typeof payload === "object" ? payload : {};

    base.revision = text(data.revision, base.revision).slice(0, 80);
    base.source = text(data.source, "local").slice(0, 30);
    base.station = {
        name: text(data.station?.name, base.station.name).slice(0, 60),
        domain: text(data.station?.domain, base.station.domain).slice(0, 80),
        slogan: text(data.station?.slogan, base.station.slogan).slice(0, 100),
        subtitle: text(data.station?.subtitle, base.station.subtitle).slice(0, 80),
        logo: safeImage(data.station?.logo, base.station.logo)
    };

    base.stream = {
        primaryUrl: isHttps(data.stream?.primaryUrl) ? text(data.stream.primaryUrl).slice(0, 260) : base.stream.primaryUrl,
        fallbackUrls: Array.isArray(data.stream?.fallbackUrls)
            ? data.stream.fallbackUrls.map(value => text(value).slice(0, 260)).filter(isHttps).slice(0, 5)
            : [],
        infoApi: isHttps(data.stream?.infoApi) ? text(data.stream.infoApi).slice(0, 260) : base.stream.infoApi,
        reconnectIntervalMs: boundedNumber(data.stream?.reconnectIntervalMs, base.stream.reconnectIntervalMs, 2000, 30000),
        maxRetries: boundedNumber(data.stream?.maxRetries, base.stream.maxRetries, 1, 10)
    };

    Object.keys(FEATURE_LABELS).forEach(key => {
        base.features[key] = typeof data.features?.[key] === "boolean" ? data.features[key] : base.features[key];
    });

    base.emergency = {
        enabled: data.emergency?.enabled === true,
        severity: ["info", "warning", "critical"].includes(data.emergency?.severity) ? data.emergency.severity : "info",
        title: text(data.emergency?.title, base.emergency.title).slice(0, 80),
        message: text(data.emergency?.message, base.emergency.message).slice(0, 180),
        streamUrl: safeUrl(data.emergency?.streamUrl)
    };

    base.visual = {
        themeDefault: data.visual?.themeDefault === "light" ? "light" : "dark",
        heroImage: safeImage(data.visual?.heroImage, base.visual.heroImage),
        accentColor: /^#[0-9a-f]{6}$/i.test(String(data.visual?.accentColor || "")) ? data.visual.accentColor : base.visual.accentColor
    };

    base.audioExperience = {
        enabled: data.audioExperience?.enabled !== false,
        recommendedProfile: text(data.audioExperience?.recommendedProfile, base.audioExperience.recommendedProfile).slice(0, 40),
        lowDataMode: data.audioExperience?.lowDataMode === true,
        networkWarning: data.audioExperience?.networkWarning !== false
    };
    base.analytics = normalizeAnalytics(data.analytics);

    const content = data.content || {};
    base.content.banners = normalizeBanners(content.banners);
    base.content.schedule = normalizeSchedule(content.schedule);
    base.content.highlights = normalizeHighlights(content.highlights);
    base.content.presenters = normalizePresenters(content.presenters);
    base.content.articles = normalizeArticles(content.articles);
    base.content.podcasts = normalizePodcasts(content.podcasts);
    base.content.stations = normalizeStations(content.stations);
    base.content.polls = normalizePolls(content.polls);
    base.content.sponsors = normalizeSponsors(content.sponsors);
    return base;
}

function normalizeAnalytics(value) {
    const base = clone(DEFAULT_CMC.analytics);
    const data = value && typeof value === "object" ? value : {};
    const kpis = data.kpis && typeof data.kpis === "object" ? data.kpis : {};
    return {
        enabled: data.enabled !== false,
        mode: ["local-sample", "remote", "disabled"].includes(data.mode) ? data.mode : base.mode,
        periodLabel: text(data.periodLabel, base.periodLabel).slice(0, 60),
        periodRange: normalizePeriodRange(data.periodRange, base.periodRange),
        ingestEndpoint: safeUrl(data.ingestEndpoint),
        dashboardEndpoint: safeAdminUrl(data.dashboardEndpoint),
        retentionDays: boundedNumber(data.retentionDays, base.retentionDays, 7, 730),
        map: {
            provider: data.map?.provider === "google" ? "google" : "local"
        },
        kpis: {
            liveListeners: boundedNumber(kpis.liveListeners, base.kpis.liveListeners, 0, 1000000),
            peakAudience: boundedNumber(kpis.peakAudience, base.kpis.peakAudience, 0, 1000000),
            peakAt: text(kpis.peakAt, base.kpis.peakAt).slice(0, 20),
            avgHoursDay: boundedNumber(kpis.avgHoursDay, base.kpis.avgHoursDay, 0, 1000000),
            avgListeningTimeMin: boundedNumber(kpis.avgListeningTimeMin, base.kpis.avgListeningTimeMin, 0, 1000000),
            totalListeningHours: boundedNumber(kpis.totalListeningHours, base.kpis.totalListeningHours, 0, 100000000),
            appUsers: boundedNumber(kpis.appUsers, base.kpis.appUsers, 0, 1000000)
        },
        listeningHoursTrend: normalizeSeries(data.listeningHoursTrend, base.listeningHoursTrend, 60),
        audienceRealtime: normalizeSeries(data.audienceRealtime, base.audienceRealtime, 120),
        quickSeries: normalizeQuickSeries(data.quickSeries, base.quickSeries),
        countries: normalizeAnalyticsRows(data.countries, base.countries, "country", 50),
        players: normalizeAnalyticsRows(data.players, base.players, "name", 40),
        referrers: normalizeAnalyticsRows(data.referrers, base.referrers, "name", 40),
        liveConnections: Array.isArray(data.liveConnections)
            ? data.liveConnections.slice(0, 50).map(item => ({
                country: text(item?.country, "Unknown").slice(0, 80),
                city: text(item?.city, "").slice(0, 80),
                player: text(item?.player, "").slice(0, 80),
                sourceClient: text(item?.sourceClient, "").slice(0, 60),
                referrer: text(item?.referrer, "").slice(0, 120),
                ageSeconds: boundedNumber(item?.ageSeconds, 0, 0, 86400)
            }))
            : base.liveConnections,
        quickStats: normalizeQuickStats(data.quickStats, base.quickStats)
    };
}

function normalizeSeries(items, fallback, maxItems) {
    const source = Array.isArray(items) && items.length ? items : fallback;
    return source.slice(0, maxItems).map(item => ({
        label: text(item?.label, "").slice(0, 24),
        value: boundedNumber(item?.value, 0, 0, 1000000)
    }));
}

function normalizeAnalyticsRows(items, fallback, labelKey, maxItems) {
    const source = Array.isArray(items) && items.length ? items : fallback;
    return source.slice(0, maxItems).map(item => ({
        country: text(item?.country, item?.name || "Unknown").slice(0, 80),
        code: text(item?.code, "").slice(0, 4).toUpperCase(),
        name: text(item?.name, item?.country || "Unknown").slice(0, 80),
        key: text(item?.key, item?.source || "").slice(0, 60),
        source: text(item?.source, item?.key || "").slice(0, 80),
        listeningHours: boundedNumber(item?.listeningHours, 0, 0, 100000000),
        access: boundedNumber(item?.access, 0, 0, 100000000),
        uniqueListeners: boundedNumber(item?.uniqueListeners, 0, 0, 100000000),
        distinctIps: boundedNumber(item?.distinctIps, item?.uniqueListeners || 0, 0, 100000000),
        live: boundedNumber(item?.live, 0, 0, 1000000),
        label: text(item?.[labelKey], item?.country || item?.name || "Unknown").slice(0, 80)
    }));
}

function normalizePeriodRange(value, fallback) {
    const data = value && typeof value === "object" ? value : {};
    return {
        start: text(data.start, fallback?.start || "").slice(0, 32),
        end: text(data.end, fallback?.end || "").slice(0, 32)
    };
}

function normalizeQuickSeries(value, fallback) {
    const data = value && typeof value === "object" ? value : {};
    return {
        listeningHours: normalizeSeries(data.listeningHours, fallback.listeningHours, 90),
        uniqueListeners: normalizeSeries(data.uniqueListeners, fallback.uniqueListeners, 90),
        accessCount: normalizeSeries(data.accessCount, fallback.accessCount, 90)
    };
}

function normalizeQuickStats(value, fallback) {
    const data = value && typeof value === "object" ? value : {};
    const metrics = ["uniqueListeners", "listeningHours", "accessCount"];
    return metrics.reduce((output, metric) => {
        const row = data[metric] && typeof data[metric] === "object" ? data[metric] : fallback[metric];
        output[metric] = {
            yesterday: boundedNumber(row?.yesterday, 0, 0, 100000000),
            week: boundedNumber(row?.week, 0, 0, 100000000),
            month: boundedNumber(row?.month, 0, 0, 100000000),
            selected: boundedNumber(row?.selected, 0, 0, 100000000)
        };
        return output;
    }, {});
}

function normalizeRemoteAnalyticsPayload(payload, currentAnalytics) {
    const previous = clone(currentAnalytics || DEFAULT_CMC.analytics);
    const source = payload?.analytics && typeof payload.analytics === "object"
        ? payload.analytics
        : buildAnalyticsFromRemoteSummary(payload);
    const normalized = normalizeAnalytics({
        ...previous,
        ...source,
        enabled: true,
        mode: "remote",
        ingestEndpoint: previous.ingestEndpoint,
        dashboardEndpoint: previous.dashboardEndpoint,
        retentionDays: previous.retentionDays,
        map: previous.map
    });
    normalized.periodLabel = source.periodLabel || "Backend remoto";
    return normalized;
}

function buildAnalyticsFromRemoteSummary(payload = {}) {
    const now = new Date();
    const countries = objectEntriesToAnalyticsRows(payload.byCountry, "country");
    const players = objectEntriesToAnalyticsRows(payload.byPlayer, "name");
    const referrers = objectEntriesToAnalyticsRows(payload.bySourceClient || payload.byReferrer, "name");
    const totalAccess = Number(payload.totalEvents || 0);
    const liveConnections = Array.isArray(payload.liveConnections)
        ? payload.liveConnections.map(item => ({
            country: item.country || "Unknown",
            city: item.city || "",
            player: item.player || "",
            sourceClient: item.sourceClient || "",
            referrer: item.referrer || "",
            ageSeconds: item.ageSeconds || 0
        }))
        : [];

    return {
        periodLabel: payload.periodLabel || "Backend remoto",
        periodRange: payload.periodRange || {
            start: now.toISOString().slice(0, 10),
            end: now.toISOString().slice(0, 10)
        },
        kpis: {
            liveListeners: Number(payload.liveListeners || liveConnections.length || 0),
            peakAudience: Number(payload.peakAudience || Math.max(liveConnections.length, totalAccess ? 1 : 0)),
            peakAt: payload.peakAt || now.toTimeString().slice(0, 5),
            avgHoursDay: Number(payload.avgHoursDay || 0),
            avgListeningTimeMin: Number(payload.avgListeningTimeMin || 0),
            totalListeningHours: Number(payload.totalListeningHours || 0),
            appUsers: Number(payload.appUsers || referrers.find(item => item.name === "wxm_android_app")?.uniqueListeners || 0)
        },
        listeningHoursTrend: normalizeRemoteSeries(payload.listeningHoursTrend, totalAccess, 7),
        audienceRealtime: normalizeRemoteSeries(payload.audienceRealtime, liveConnections.length || totalAccess, 10),
        quickSeries: {
            listeningHours: normalizeRemoteSeries(payload.quickSeries?.listeningHours, 0, 10),
            uniqueListeners: normalizeRemoteSeries(payload.quickSeries?.uniqueListeners, liveConnections.length || totalAccess, 10),
            accessCount: normalizeRemoteSeries(payload.quickSeries?.accessCount, totalAccess, 10)
        },
        countries,
        players,
        referrers,
        liveConnections,
        quickStats: payload.quickStats || {
            uniqueListeners: { yesterday: 0, week: liveConnections.length || totalAccess, month: liveConnections.length || totalAccess, selected: liveConnections.length || totalAccess },
            listeningHours: { yesterday: 0, week: 0, month: 0, selected: 0 },
            accessCount: { yesterday: 0, week: totalAccess, month: totalAccess, selected: totalAccess }
        }
    };
}

function objectEntriesToAnalyticsRows(source, labelKey) {
    return Object.entries(source || {})
        .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
        .slice(0, 40)
        .map(([label, value]) => ({
            [labelKey]: label,
            country: label,
            name: label,
            listeningHours: 0,
            access: Number(value || 0),
            uniqueListeners: Number(value || 0),
            distinctIps: Number(value || 0),
            live: Number(value || 0)
        }));
}

function normalizeRemoteSeries(series, fallbackValue, length) {
    if (Array.isArray(series) && series.length) return series;
    const today = new Date();
    return Array.from({ length }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (length - index - 1));
        return {
            label: date.toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
            value: index === length - 1 ? Number(fallbackValue || 0) : 0
        };
    });
}

function normalizeSchedule(items) {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 24).map(item => ({
        time: validTime(item?.time) ? item.time : "00:00",
        title: text(item?.title, "Nuevo programa").slice(0, 80),
        host: text(item?.host, "WXM ONE RADIO").slice(0, 80),
        tag: text(item?.tag, "Radio en vivo").slice(0, 120),
        genre: text(item?.genre, "").slice(0, 60),
        image: safeImage(item?.image),
        description: text(item?.description, "").slice(0, 220),
        socialUrl: safeUrl(item?.socialUrl),
        playlistUrl: safeUrl(item?.playlistUrl)
    }));
}

function normalizeHighlights(items) {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 24).map(item => ({
        title: text(item?.title, "Nuevo destacado").slice(0, 90),
        meta: text(item?.meta, "Hoy").slice(0, 40),
        icon: safeIcon(item?.icon),
        body: text(item?.body, "Contenido editorial WXM.").slice(0, 180),
        image: safeImage(item?.image),
        ctaLabel: text(item?.ctaLabel, "").slice(0, 32),
        ctaUrl: safeUrl(item?.ctaUrl)
    }));
}

function normalizeBanners(items) {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 12).map(item => ({
        title: text(item?.title, "Nuevo banner").slice(0, 90),
        meta: text(item?.meta, "WXM").slice(0, 50),
        body: text(item?.body, "Mensaje destacado para la app.").slice(0, 180),
        image: safeImage(item?.image),
        ctaLabel: text(item?.ctaLabel, "").slice(0, 32),
        ctaUrl: safeUrl(item?.ctaUrl),
        placement: text(item?.placement, "home").slice(0, 20)
    }));
}

function normalizePresenters(items) {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 24).map(item => ({
        name: text(item?.name, "Nuevo locutor").slice(0, 70),
        role: text(item?.role, "Cabina WXM").slice(0, 70),
        program: text(item?.program, "").slice(0, 80),
        bio: text(item?.bio, "").slice(0, 220),
        image: safeImage(item?.image),
        instagram: safeUrl(item?.instagram),
        website: safeUrl(item?.website)
    }));
}

function normalizeArticles(items) {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 30).map(item => ({
        title: text(item?.title, "Nueva noticia").slice(0, 100),
        category: text(item?.category, "WXM").slice(0, 40),
        excerpt: text(item?.excerpt, "").slice(0, 220),
        image: safeImage(item?.image),
        url: safeUrl(item?.url),
        publishedAt: text(item?.publishedAt, "").slice(0, 24)
    }));
}

function normalizePodcasts(items) {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 30).map(item => ({
        title: text(item?.title, "Nuevo podcast").slice(0, 100),
        show: text(item?.show, "").slice(0, 70),
        episodes: boundedNumber(item?.episodes, 0, 0, 10000),
        image: safeImage(item?.image),
        url: safeUrl(item?.url),
        description: text(item?.description, "").slice(0, 200)
    }));
}

function normalizeStations(items) {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 12).map(item => ({
        name: text(item?.name, "WXM Channel").slice(0, 70),
        description: text(item?.description, "").slice(0, 160),
        streamUrl: safeUrl(item?.streamUrl),
        image: safeImage(item?.image),
        enabled: item?.enabled !== false
    }));
}

function normalizePolls(items) {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 8).map(item => ({
        question: text(item?.question, "Nueva encuesta").slice(0, 120),
        meta: text(item?.meta, "Encuesta").slice(0, 40),
        image: safeImage(item?.image),
        options: Array.isArray(item?.options)
            ? item.options.slice(0, 6).map(option => text(option).slice(0, 40)).filter(Boolean)
            : ["Opcion 1", "Opcion 2"]
    })).map(item => ({
        ...item,
        options: item.options.length >= 2 ? item.options : ["Opcion 1", "Opcion 2"]
    }));
}

function normalizeSponsors(items) {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 12).map(item => ({
        title: text(item?.title, "Nuevo sponsor").slice(0, 90),
        brand: text(item?.brand, "").slice(0, 70),
        body: text(item?.body, "").slice(0, 180),
        image: safeImage(item?.image),
        url: safeUrl(item?.url),
        startsAt: text(item?.startsAt, "").slice(0, 24),
        endsAt: text(item?.endsAt, "").slice(0, 24)
    }));
}

async function loadInitialCmc(useDraft = true) {
    try {
        const response = await fetch(CMC_LOCAL_URL, { cache: "no-store" });
        const payload = await response.json();
        state = normalizeCmc(payload);
        dom.sidebarStatus.textContent = "CMC local cargado";
    } catch {
        state = clone(DEFAULT_CMC);
        dom.sidebarStatus.textContent = "Usando fallback interno";
    }

    if (useDraft) {
        try {
            const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
            if (draft) {
                state = normalizeCmc(draft);
                dom.sidebarStatus.textContent = "Borrador local activo";
            }
        } catch {
            localStorage.removeItem(DRAFT_KEY);
        }
    }

    renderAll();
}

function renderAll() {
    renderStationForm();
    renderStreamForm();
    renderSystemForm();
    renderFallbacks();
    renderFeatures();
    renderBanners();
    renderSchedule();
    renderPresenters();
    renderHighlights();
    renderArticles();
    renderPodcasts();
    renderStations();
    renderPolls();
    renderSponsors();
    renderAnalytics();
    refreshDerived();
}

function refreshDerived() {
    renderMetrics();
    renderAnalytics();
    renderPreview();
    renderValidation();
    renderAssetPipelineStatus();
    renderJson();
}

function renderStationForm() {
    dom.stationName.value = state.station.name;
    dom.stationDomain.value = state.station.domain;
    dom.stationSlogan.value = state.station.slogan;
    dom.stationSubtitle.value = state.station.subtitle;
    dom.stationLogo.value = imageInputDisplay(state.station.logo);
    renderImagePreview(dom.stationLogoPreview, state.station.logo);
}

function renderStreamForm() {
    dom.streamPrimary.value = state.stream.primaryUrl;
    dom.streamInfoApi.value = state.stream.infoApi;
    dom.streamReconnect.value = state.stream.reconnectIntervalMs;
    dom.streamRetries.value = state.stream.maxRetries;
}

function renderSystemForm() {
    setSelectValue(dom.emergencyEnabled, state.emergency.enabled);
    setSelectValue(dom.emergencySeverity, state.emergency.severity);
    dom.emergencyTitle.value = state.emergency.title;
    dom.emergencyStream.value = state.emergency.streamUrl;
    dom.emergencyMessage.value = state.emergency.message;
    setSelectValue(dom.visualTheme, state.visual.themeDefault);
    dom.visualAccent.value = state.visual.accentColor;
    dom.visualHero.value = imageInputDisplay(state.visual.heroImage);
    renderImagePreview(dom.visualHeroPreview, state.visual.heroImage);
    dom.audioProfile.value = state.audioExperience.recommendedProfile;
    setSelectValue(dom.audioLowData, state.audioExperience.lowDataMode);
}

function renderFallbacks() {
    dom.fallbackList.replaceChildren();
    if (!state.stream.fallbackUrls.length) return renderEmpty(dom.fallbackList, "Sin fallback configurado. Cuando tengas una URL secundaria HTTPS, agregala aqui.");

    state.stream.fallbackUrls.forEach((url, index) => {
        const card = editableCard(`Fallback ${index + 1}`, () => {
            state.stream.fallbackUrls.splice(index, 1);
            renderFallbacks();
            refreshDerived();
        });
        card.append(field("URL HTTPS", url, value => {
            state.stream.fallbackUrls[index] = text(value).slice(0, 260);
        }, { type: "url", wide: true, maxLength: 260 }));
        dom.fallbackList.append(card);
    });
}

function renderFeatures() {
    dom.featureGrid.replaceChildren();
    Object.entries(FEATURE_LABELS).forEach(([key, [label, description]]) => {
        const button = document.createElement("button");
        button.className = `feature-toggle ${state.features[key] ? "active" : "disabled"}`;
        button.type = "button";

        const strong = document.createElement("strong");
        strong.textContent = label;
        const span = document.createElement("span");
        span.textContent = `${description} Estado: ${state.features[key] ? "on" : "off"}`;

        button.append(strong, span);
        button.addEventListener("click", () => {
            state.features[key] = !state.features[key];
            renderFeatures();
            refreshDerived();
        });
        dom.featureGrid.append(button);
    });
}

function renderBanners() {
    renderCollection(dom.bannerList, state.content.banners, "Todavia no hay banners.", (item, index) => {
        const card = editableCard(item.title, () => removeItem(state.content.banners, index, renderBanners));
        const grid = formGrid();
        grid.append(
            field("Titulo", item.title, value => { item.title = text(value).slice(0, 90); }),
            field("Meta", item.meta, value => { item.meta = text(value).slice(0, 50); }),
            imageField("Imagen", item.image, value => { item.image = value; }, { preset: IMAGE_PRESETS.banner }),
            field("Descripcion", item.body, value => { item.body = text(value).slice(0, 180); }, { multiline: true, wide: true }),
            field("CTA label", item.ctaLabel, value => { item.ctaLabel = text(value).slice(0, 32); }),
            field("CTA URL HTTPS", item.ctaUrl, value => { item.ctaUrl = text(value).slice(0, 260); }, { type: "url", maxLength: 260 }),
            field("Ubicacion", item.placement, value => { item.placement = text(value).slice(0, 20); })
        );
        card.append(grid);
        return card;
    });
}

function renderSchedule() {
    renderCollection(dom.scheduleList, state.content.schedule, "Todavia no hay programas en la parrilla.", (program, index) => {
        const card = editableCard(`${program.time} · ${program.title}`, () => removeItem(state.content.schedule, index, renderSchedule));
        const grid = formGrid();
        grid.append(
            field("Hora", program.time, value => { program.time = text(value).slice(0, 5); }, { placeholder: "18:00" }),
            field("Titulo", program.title, value => { program.title = text(value).slice(0, 80); }),
            field("Locutor/DJ", program.host, value => { program.host = text(value).slice(0, 80); }),
            field("Genero", program.genre, value => { program.genre = text(value).slice(0, 60); }),
            imageField("Imagen programa", program.image, value => { program.image = value; }, { preset: IMAGE_PRESETS.program }),
            field("Descripcion corta", program.tag, value => { program.tag = text(value).slice(0, 120); }),
            field("Descripcion larga", program.description, value => { program.description = text(value).slice(0, 220); }, { multiline: true, wide: true }),
            field("Redes HTTPS", program.socialUrl, value => { program.socialUrl = text(value).slice(0, 260); }, { type: "url", maxLength: 260 }),
            field("Playlist HTTPS", program.playlistUrl, value => { program.playlistUrl = text(value).slice(0, 260); }, { type: "url", maxLength: 260 })
        );
        card.append(grid);
        return card;
    });
}

function renderPresenters() {
    renderCollection(dom.presenterList, state.content.presenters, "Todavia no hay locutores.", (item, index) => {
        const card = editableCard(item.name, () => removeItem(state.content.presenters, index, renderPresenters));
        const grid = formGrid();
        grid.append(
            field("Nombre", item.name, value => { item.name = text(value).slice(0, 70); }),
            field("Rol", item.role, value => { item.role = text(value).slice(0, 70); }),
            field("Programa", item.program, value => { item.program = text(value).slice(0, 80); }),
            imageField("Foto", item.image, value => { item.image = value; }, { preset: IMAGE_PRESETS.presenter }),
            field("Bio", item.bio, value => { item.bio = text(value).slice(0, 220); }, { multiline: true, wide: true }),
            field("Instagram HTTPS", item.instagram, value => { item.instagram = text(value).slice(0, 260); }, { type: "url", maxLength: 260 }),
            field("Website HTTPS", item.website, value => { item.website = text(value).slice(0, 260); }, { type: "url", maxLength: 260 })
        );
        card.append(grid);
        return card;
    });
}

function renderHighlights() {
    renderCollection(dom.highlightList, state.content.highlights, "Todavia no hay destacados editoriales.", (item, index) => {
        const card = editableCard(item.title, () => removeItem(state.content.highlights, index, renderHighlights));
        const grid = formGrid();
        grid.append(
            field("Titulo", item.title, value => { item.title = text(value).slice(0, 90); }),
            field("Meta", item.meta, value => { item.meta = text(value).slice(0, 40); }),
            field("Icono FontAwesome", item.icon, value => { item.icon = text(value).slice(0, 40); }),
            imageField("Imagen", item.image, value => { item.image = value; }, { preset: IMAGE_PRESETS.banner }),
            field("Descripcion", item.body, value => { item.body = text(value).slice(0, 180); }, { multiline: true, wide: true }),
            field("CTA label", item.ctaLabel, value => { item.ctaLabel = text(value).slice(0, 32); }),
            field("CTA URL HTTPS", item.ctaUrl, value => { item.ctaUrl = text(value).slice(0, 260); }, { type: "url", maxLength: 260 })
        );
        card.append(grid);
        return card;
    });
}

function renderArticles() {
    renderCollection(dom.articleList, state.content.articles, "Sin noticias/articulos.", (item, index) => {
        const card = editableCard(item.title, () => removeItem(state.content.articles, index, renderArticles));
        const grid = formGrid();
        grid.append(
            field("Titulo", item.title, value => { item.title = text(value).slice(0, 100); }),
            field("Categoria", item.category, value => { item.category = text(value).slice(0, 40); }),
            imageField("Imagen", item.image, value => { item.image = value; }, { preset: IMAGE_PRESETS.article }),
            field("Resumen", item.excerpt, value => { item.excerpt = text(value).slice(0, 220); }, { multiline: true, wide: true }),
            field("URL HTTPS", item.url, value => { item.url = text(value).slice(0, 260); }, { type: "url", maxLength: 260 }),
            field("Fecha", item.publishedAt, value => { item.publishedAt = text(value).slice(0, 24); })
        );
        card.append(grid);
        return card;
    });
}

function renderPodcasts() {
    renderCollection(dom.podcastList, state.content.podcasts, "Sin podcasts/replays.", (item, index) => {
        const card = editableCard(item.title, () => removeItem(state.content.podcasts, index, renderPodcasts));
        const grid = formGrid();
        grid.append(
            field("Titulo", item.title, value => { item.title = text(value).slice(0, 100); }),
            field("Show", item.show, value => { item.show = text(value).slice(0, 70); }),
            field("Episodios", item.episodes, value => { item.episodes = boundedNumber(value, 0, 0, 10000); }, { type: "number" }),
            imageField("Imagen", item.image, value => { item.image = value; }, { preset: IMAGE_PRESETS.square }),
            field("Descripcion", item.description, value => { item.description = text(value).slice(0, 200); }, { multiline: true, wide: true }),
            field("URL HTTPS", item.url, value => { item.url = text(value).slice(0, 260); }, { type: "url", maxLength: 260 })
        );
        card.append(grid);
        return card;
    });
}

function renderStations() {
    renderCollection(dom.stationList, state.content.stations, "Sin canales secundarios.", (item, index) => {
        const card = editableCard(item.name, () => removeItem(state.content.stations, index, renderStations));
        const grid = formGrid();
        grid.append(
            field("Nombre", item.name, value => { item.name = text(value).slice(0, 70); }),
            field("Estado true/false", item.enabled, value => { item.enabled = value !== "false"; }),
            imageField("Imagen", item.image, value => { item.image = value; }, { preset: IMAGE_PRESETS.square }),
            field("Descripcion", item.description, value => { item.description = text(value).slice(0, 160); }, { multiline: true, wide: true }),
            field("Stream HTTPS", item.streamUrl, value => { item.streamUrl = text(value).slice(0, 260); }, { type: "url", wide: true, maxLength: 260 })
        );
        card.append(grid);
        return card;
    });
}

function renderPolls() {
    renderCollection(dom.pollList, state.content.polls, "Sin encuestas.", (item, index) => {
        const card = editableCard(item.question, () => removeItem(state.content.polls, index, renderPolls));
        const grid = formGrid();
        grid.append(
            field("Pregunta", item.question, value => { item.question = text(value).slice(0, 120); }, { wide: true }),
            field("Meta", item.meta, value => { item.meta = text(value).slice(0, 40); }),
            imageField("Imagen", item.image, value => { item.image = value; }, { preset: IMAGE_PRESETS.article }),
            field("Opciones separadas por coma", item.options.join(", "), value => {
                item.options = value.split(",").map(option => text(option).slice(0, 40)).filter(Boolean).slice(0, 6);
            }, { wide: true, maxLength: 260 })
        );
        card.append(grid);
        return card;
    });
}

function renderSponsors() {
    renderCollection(dom.sponsorList, state.content.sponsors, "Sin sponsors/promociones.", (item, index) => {
        const card = editableCard(item.title, () => removeItem(state.content.sponsors, index, renderSponsors));
        const grid = formGrid();
        grid.append(
            field("Titulo", item.title, value => { item.title = text(value).slice(0, 90); }),
            field("Marca", item.brand, value => { item.brand = text(value).slice(0, 70); }),
            imageField("Imagen", item.image, value => { item.image = value; }, { preset: IMAGE_PRESETS.sponsor }),
            field("Descripcion", item.body, value => { item.body = text(value).slice(0, 180); }, { multiline: true, wide: true }),
            field("URL HTTPS", item.url, value => { item.url = text(value).slice(0, 260); }, { type: "url", maxLength: 260 }),
            field("Inicio", item.startsAt, value => { item.startsAt = text(value).slice(0, 24); }),
            field("Fin", item.endsAt, value => { item.endsAt = text(value).slice(0, 24); })
        );
        card.append(grid);
        return card;
    });
}

function renderAnalytics() {
    if (!dom.analyticsLiveListeners) return;
    const analytics = state.analytics;
    const kpis = analytics.kpis;
    setSelectValue(dom.analyticsMode, analytics.mode);
    dom.analyticsRetention.value = analytics.retentionDays;
    dom.analyticsIngestEndpoint.value = analytics.ingestEndpoint;
    dom.analyticsDashboardEndpoint.value = analytics.dashboardEndpoint;
    setSelectValue(dom.analyticsMapProvider, analytics.map?.provider || "local");
    if (dom.analyticsGoogleMapsKey) dom.analyticsGoogleMapsKey.value = getGoogleMapsKey();
    setText(dom.analyticsPeriod, analytics.periodLabel);
    setText(dom.analyticsDateRange, formatPeriodRange(analytics.periodRange));
    setText(dom.analyticsSource, analyticsSourceText(analytics));
    if (dom.refreshRemoteAnalyticsBtn) {
        dom.refreshRemoteAnalyticsBtn.disabled = remoteAnalyticsState.loading || analytics.mode !== "remote" || !analytics.dashboardEndpoint;
        dom.refreshRemoteAnalyticsBtn.textContent = remoteAnalyticsState.loading ? "Actualizando..." : "Actualizar remoto";
    }
    setText(dom.analyticsLiveListeners, formatNumber(kpis.liveListeners));
    setText(dom.analyticsPeakAudience, formatNumber(kpis.peakAudience));
    setText(dom.analyticsPeakAt, `A las ${kpis.peakAt}`);
    setText(dom.analyticsAvgHours, `${formatNumber(kpis.avgHoursDay)}h`);
    setText(dom.analyticsAvgTime, `${formatNumber(kpis.avgListeningTimeMin)}m`);
    setText(dom.analyticsAppUsers, formatNumber(kpis.appUsers));
    setText(dom.analyticsTotalHours, formatNumber(kpis.totalListeningHours));
    renderLineChart(dom.listeningHoursChart, analytics.listeningHoursTrend, { maxHint: 10, area: false });
    renderLineChart(dom.audienceRealtimeChart, analytics.audienceRealtime, { maxHint: 10, area: true });
    renderLineChart(dom.quickListeningChart, analytics.quickSeries.listeningHours, { maxHint: 10, area: false });
    renderLineChart(dom.quickUniqueChart, analytics.quickSeries.uniqueListeners, { maxHint: 10, area: true });
    renderLineChart(dom.quickAccessChart, analytics.quickSeries.accessCount, { maxHint: 10, area: true });
    setText(dom.quickListeningTotal, formatNumber(sumSeries(analytics.quickSeries.listeningHours)));
    setText(dom.quickUniqueTotal, formatNumber(sumSeries(analytics.quickSeries.uniqueListeners)));
    setText(dom.quickAccessTotal, formatNumber(sumSeries(analytics.quickSeries.accessCount)));
    renderLineChart(dom.playersAudienceChart, rowsToSeries(analytics.players, "access"), { maxHint: 10, area: true });
    renderLineChart(dom.referrersAudienceChart, rowsToSeries(analytics.referrers, "access"), { maxHint: 10, area: true });
    renderAudienceMap(analytics);
    renderCompactList(dom.dashboardLiveConnectionsList, analytics.liveConnections);
    renderCompactList(dom.liveConnectionsList, analytics.liveConnections);
    renderRankList(dom.topCountriesList, analytics.countries, item => item.country, item => `${formatNumber(item.live || item.uniqueListeners)} live`);
    renderRankList(dom.topPlayersList, analytics.players, item => item.name, item => `${formatNumber(item.access)} access`);
    renderRankList(dom.topReferrersList, analytics.referrers, item => item.name, item => `${formatNumber(item.access)} access`);
    renderDonut(dom.countriesDonut, analytics.countries, item => item.country, item => item.live || item.uniqueListeners || item.access || 0);
    renderDonut(dom.playersDonut, analytics.players, item => item.name, item => item.access || item.uniqueListeners || 0);
    renderAnalyticsTable(dom.countriesAnalyticsTable, ["Country", "Listening hours", "Access", "Unique listeners"], analytics.countries, [
        item => item.country,
        item => formatNumber(item.listeningHours),
        item => formatNumber(item.access),
        item => formatNumber(item.uniqueListeners)
    ]);
    renderAnalyticsTable(dom.playersAnalyticsTable, ["Player", "Listening hours", "Distinct IPs", "Access"], analytics.players, [
        item => item.name,
        item => formatNumber(item.listeningHours),
        item => formatNumber(item.distinctIps || item.uniqueListeners),
        item => formatNumber(item.access)
    ]);
    renderAnalyticsTable(dom.referrersAnalyticsTable, ["Referrer", "Listening hours", "Distinct IPs", "Access"], analytics.referrers, [
        item => item.name,
        item => formatNumber(item.listeningHours),
        item => formatNumber(item.distinctIps || item.uniqueListeners),
        item => formatNumber(item.access)
    ]);
    renderQuickStats();
}

function formatPeriodRange(range) {
    if (!range?.start && !range?.end) return "Periodo sin definir";
    return `${range.start || "--"} - ${range.end || "--"}`;
}

function analyticsSourceText(analytics) {
    if (analytics.mode === "disabled") return "Analytics apagado";
    if (remoteAnalyticsState.loading) return "Cargando backend remoto...";
    if (analytics.mode === "remote" && remoteAnalyticsState.lastLoadedAt) {
        return `Fuente: backend remoto · ${remoteAnalyticsState.lastLoadedAt}`;
    }
    if (analytics.mode === "remote" && remoteAnalyticsState.error) {
        return `Fuente: muestra local · remoto fallo: ${remoteAnalyticsState.error}`;
    }
    if (analytics.mode === "remote") {
        return analytics.dashboardEndpoint ? "Fuente: backend remoto configurado" : "Fuente: backend remoto sin endpoint";
    }
    return "Fuente: muestra local preparada";
}

async function refreshRemoteAnalytics() {
    if (state.analytics.mode === "disabled") {
        toast("Analytics esta apagado");
        return;
    }
    if (state.analytics.mode !== "remote") {
        toast("Cambia Analytics a Backend remoto para actualizar");
        return;
    }
    const endpoint = safeAdminUrl(state.analytics.dashboardEndpoint);
    if (!endpoint) {
        remoteAnalyticsState.error = "endpoint no configurado";
        refreshDerived();
        toast("Configura un endpoint dashboard valido");
        return;
    }

    remoteAnalyticsState = { loading: true, lastLoadedAt: remoteAnalyticsState.lastLoadedAt, error: "" };
    renderAnalytics();
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), REMOTE_ANALYTICS_TIMEOUT_MS);
    try {
        const response = await fetch(endpoint, {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: { Accept: "application/json" },
            signal: controller.signal
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        state.analytics = normalizeRemoteAnalyticsPayload(payload, state.analytics);
        remoteAnalyticsState = {
            loading: false,
            lastLoadedAt: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
            error: ""
        };
        refreshDerived();
        toast("Analytics remoto actualizado");
    } catch (error) {
        remoteAnalyticsState = {
            loading: false,
            lastLoadedAt: "",
            error: error?.name === "AbortError" ? "timeout" : text(error?.message, "error")
        };
        refreshDerived();
        toast("No se pudo cargar analytics remoto; usando datos locales");
    } finally {
        window.clearTimeout(timer);
    }
}

function sumSeries(items) {
    return (items || []).reduce((sum, item) => sum + Number(item.value || 0), 0);
}

function rowsToSeries(items, metric) {
    return (items || []).slice(0, 10).map(item => ({
        label: item.name || item.country || item.label || "Item",
        value: Number(item?.[metric] || 0)
    }));
}

function renderLineChart(svg, items, options = {}) {
    if (!svg) return;
    svg.replaceChildren();
    const box = svg.viewBox?.baseVal;
    const width = box?.width || 640;
    const height = box?.height || 220;
    const pad = 28;
    const values = items.map(item => item.value);
    const max = Math.max(options.maxHint || 1, ...values, 1);
    const step = items.length > 1 ? (width - pad * 2) / (items.length - 1) : 0;
    const points = items.map((item, index) => {
        const x = pad + index * step;
        const y = height - pad - ((item.value / max) * (height - pad * 2));
        return [x, y];
    });

    for (let i = 0; i < 5; i++) {
        const line = svgEl("line", {
            x1: pad,
            x2: width - pad,
            y1: pad + i * ((height - pad * 2) / 4),
            y2: pad + i * ((height - pad * 2) / 4),
            class: "grid-line"
        });
        svg.append(line);
    }

    if (options.area && points.length) {
        const areaPath = [
            `M ${points[0][0]} ${height - pad}`,
            ...points.map(([x, y]) => `L ${x} ${y}`),
            `L ${points[points.length - 1][0]} ${height - pad}`,
            "Z"
        ].join(" ");
        svg.append(svgEl("path", { d: areaPath, class: "area" }));
    }

    const path = points.map(([x, y], index) => `${index ? "L" : "M"} ${x} ${y}`).join(" ");
    svg.append(svgEl("path", { d: path || `M ${pad} ${height - pad}`, class: "line" }));
    points.forEach(([x, y]) => svg.append(svgEl("circle", { cx: x, cy: y, r: 4, class: "point" })));
}

function getGoogleMapsKey() {
    return localStorage.getItem(GOOGLE_MAPS_KEY) || "";
}

function getAudienceMapTargets() {
    return [
        {
            map: dom.dashboardAnalyticsMap,
            status: dom.dashboardAnalyticsMapStatus,
            label: "Dashboard"
        },
        {
            map: dom.analyticsMap,
            status: dom.analyticsMapStatus,
            label: "Paises"
        }
    ].filter(target => target.map);
}

function setMapStatus(target, message) {
    setText(target?.status, message || "Mapa agregado por pais");
}

function renderAudienceMap(analytics) {
    const provider = analytics.map?.provider || "local";
    const key = getGoogleMapsKey();
    const targets = getAudienceMapTargets();
    if (!targets.length) return;

    if (provider === "google" && key) {
        renderGoogleAudienceMaps(analytics, key, targets);
        return;
    }

    const message = provider === "google"
        ? "Google Maps requiere API key local. Mostrando fallback interno."
        : "Mapa interno agregado por pais";
    targets.forEach(target => renderLocalAudienceMap(analytics, message, target));
}

function renderLocalAudienceMap(analytics, statusMessage, target = { map: dom.analyticsMap, status: dom.analyticsMapStatus }) {
    if (!target.map) return;
    clearGoogleMarkers(target.map);
    clearAtlasMap(target.map);
    target.map.classList.remove("google-map-ready");
    target.map.classList.add("local-map-ready");
    target.map.replaceChildren();
    setMapStatus(target, statusMessage);

    if (window.WxmWorldAtlasMap?.mount) {
        try {
            const mounted = window.WxmWorldAtlasMap.mount(target.map, {
                analytics,
                datasetUrl: ATLAS_MAP_DATASET_URL,
                title: "WXM ONE RADIO",
                subtitle: target.label === "Dashboard"
                    ? "Live connections · Global broadcast"
                    : "Audience by country · Real TopoJSON"
            });
            if (mounted) {
                target.map.classList.add("atlas-map-ready");
                setMapStatus(target, "World Atlas D3/TopoJSON activo");
                return;
            }
        } catch {
            target.map.classList.remove("atlas-map-ready");
        }
    }

    const label = document.createElement("div");
    label.className = "geo-map-label";
    label.textContent = statusMessage;
    target.map.append(createLocalWorldMapSvg(analytics), label);

    getCountryPoints(analytics).slice(0, 18).forEach(point => {
        const marker = document.createElement("button");
        marker.type = "button";
        marker.className = "geo-marker";
        marker.style.left = `${point.x}%`;
        marker.style.top = `${point.y}%`;
        marker.style.setProperty("--pulse-size", `${Math.min(18, 10 + point.value * 1.5)}px`);
        marker.title = `${point.name}: ${formatNumber(point.value)} usuarios`;
        marker.setAttribute("aria-label", marker.title);

        const dot = document.createElement("span");
        dot.textContent = formatNumber(point.value);
        marker.append(dot);
        target.map.append(marker);
    });
}

function renderGoogleAudienceMaps(analytics, key, targets) {
    targets.forEach(target => {
        setMapStatus(target, "Cargando Google Maps...");
        clearAtlasMap(target.map);
        target.map.classList.add("google-map-ready");
        target.map.classList.remove("local-map-ready");
        target.map.classList.remove("atlas-map-ready");
        target.map.replaceChildren();
    });

    loadGoogleMaps(key)
        .then(maps => {
            targets.forEach(target => renderGoogleAudienceMapTarget(analytics, maps, target));
        })
        .catch(() => {
            googleMapsLoadPromise = null;
            targets.forEach(target => renderLocalAudienceMap(analytics, "Google Maps no cargo. Fallback interno activo.", target));
        });
}

function renderGoogleAudienceMapTarget(analytics, maps, target) {
    if (!target.map) return;
    const points = getCountryPoints(analytics);
    let context = googleMapContexts.get(target.map);
    if (!context) {
        context = {
            instance: new maps.Map(target.map, {
                    center: { lat: 20, lng: 0 },
                    zoom: 2,
                    minZoom: 2,
                    maxZoom: 7,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                    backgroundColor: "#08090d",
                    styles: getGoogleMapStyles()
            }),
            infoWindow: new maps.InfoWindow(),
            markers: []
        };
        googleMapContexts.set(target.map, context);
    }

    clearGoogleMarkers(target.map);
    const bounds = new maps.LatLngBounds();
    points.forEach(point => {
        const position = { lat: point.lat, lng: point.lng };
        bounds.extend(position);
        const marker = new maps.Marker({
            position,
            map: context.instance,
            title: point.name,
            label: {
                text: String(point.value),
                color: "#ffffff",
                fontWeight: "800"
            },
            icon: {
                path: maps.SymbolPath.CIRCLE,
                scale: Math.min(18, 8 + point.value),
                fillColor: "#f72570",
                fillOpacity: 0.92,
                strokeColor: "#25c2ff",
                strokeWeight: 2
            }
        });
        marker.addListener("click", () => {
            context.infoWindow.setContent(`<strong>${escapeHtml(point.name)}</strong><br>${formatNumber(point.value)} usuarios conectados`);
            context.infoWindow.open(context.instance, marker);
        });
        context.markers.push(marker);
    });

    if (points.length > 1) context.instance.fitBounds(bounds, 54);
    setMapStatus(target, "Google Maps activo · usuarios por pais");
}

function createLocalWorldMapSvg(analytics) {
    const svg = svgEl("svg", {
        class: "geo-world-map",
        viewBox: "0 0 1000 500",
        role: "img",
        "aria-label": "Mapa mundial estilizado de conexiones"
    });
    const activeCodes = new Set(getCountryPoints(analytics).map(point => point.code));

    const grid = svgEl("g", { class: "geo-world-grid" });
    for (let x = 80; x < 1000; x += 120) {
        grid.append(svgEl("path", {
            d: `M ${x - 180} 500 L ${x + 160} 0`,
            class: "geo-world-grid-line"
        }));
    }
    for (let x = 20; x < 1000; x += 150) {
        grid.append(svgEl("path", {
            d: `M ${x} 0 L ${x + 340} 500`,
            class: "geo-world-grid-line subtle"
        }));
    }

    const regions = [
        { code: "GL", d: "M424 70 C455 43 514 43 544 68 C564 86 548 107 504 113 C456 119 413 100 408 80 C406 76 411 72 424 70 Z" },
        { code: "NA", d: "M64 156 C85 110 129 91 179 91 C203 76 252 80 287 102 C326 126 351 157 345 192 C339 225 309 217 284 223 C263 228 251 252 225 257 C202 261 193 238 174 224 C151 207 120 207 96 190 C74 176 55 176 64 156 Z" },
        { code: "MX", d: "M185 230 C209 238 229 253 242 273 C251 287 243 301 221 296 C203 292 189 276 179 260 C171 248 172 236 185 230 Z" },
        { code: "SA", d: "M259 276 C295 292 314 332 306 372 C299 411 263 450 230 438 C205 429 210 391 193 360 C179 334 181 301 212 280 C229 269 243 270 259 276 Z" },
        { code: "EU", d: "M463 141 C499 117 559 128 579 161 C591 181 571 200 536 198 C504 196 486 183 454 191 C427 198 407 182 419 161 C426 151 439 145 463 141 Z" },
        { code: "AF", d: "M492 202 C540 176 593 202 605 256 C618 318 579 377 535 366 C493 357 474 311 472 263 C470 231 466 215 492 202 Z" },
        { code: "AS", d: "M586 137 C664 93 790 100 874 151 C934 187 942 237 893 261 C841 287 803 255 753 263 C695 273 669 248 619 246 C577 245 546 188 586 137 Z" },
        { code: "AU", d: "M787 330 C829 312 895 326 923 363 C940 385 915 409 870 409 C823 409 773 384 760 357 C753 344 765 334 787 330 Z" },
        { code: "JP", d: "M889 188 C906 180 927 188 932 205 C937 220 922 236 899 235 C876 234 858 219 865 204 C869 196 876 191 889 188 Z" },
        { code: "ID", d: "M703 291 C727 284 780 286 803 298 C814 304 807 315 783 317 C746 321 706 313 692 303 C688 299 692 294 703 290 Z" },
        { code: "NZ", d: "M932 386 C948 392 963 405 966 419 C948 419 930 408 922 393 C920 389 924 386 932 386 Z" }
    ];

    const countryOverlays = [
        { code: "CA", d: "M92 118 C128 91 199 86 254 104 C302 120 335 154 328 187 C322 212 286 214 255 219 C224 224 204 212 180 214 C148 217 118 199 91 185 C70 174 71 139 92 118 Z" },
        { code: "US", d: "M116 203 C161 198 210 203 246 224 C236 246 216 260 190 257 C171 255 162 238 143 229 C121 218 105 218 116 203 Z" },
        { code: "ES", d: "M445 184 C459 177 476 179 486 188 C478 199 458 201 443 194 C438 191 439 187 445 184 Z" },
        { code: "FI", d: "M518 120 C536 108 557 116 560 137 C551 151 529 151 517 137 C511 130 511 123 518 120 Z" },
        { code: "HU", d: "M507 184 C519 178 535 181 541 192 C530 201 513 200 503 191 C499 188 501 185 507 184 Z" },
        { code: "DO", d: "M300 258 C308 256 316 260 316 267 C307 270 298 269 294 264 C293 261 295 259 300 258 Z" }
    ];

    const borderLines = [
        "M257 104 C247 143 246 183 255 219",
        "M115 203 C162 205 203 209 246 224",
        "M445 184 C469 187 493 187 520 184",
        "M518 120 C516 150 519 167 526 181",
        "M585 137 C630 167 657 207 619 246",
        "M492 202 C535 219 574 219 605 256",
        "M535 366 C541 315 535 258 492 202",
        "M259 276 C243 323 232 382 230 438"
    ];

    const land = svgEl("g", { class: "geo-world-land" });
    regions.forEach(region => land.append(svgEl("path", {
        d: region.d,
        class: activeCodes.has(region.code) ? "geo-continent is-active" : "geo-continent",
        "data-code": region.code
    })));

    const overlays = svgEl("g", { class: "geo-country-overlays" });
    countryOverlays.forEach(region => overlays.append(svgEl("path", {
        d: region.d,
        class: activeCodes.has(region.code) ? "geo-country-active" : "geo-country-muted",
        "data-code": region.code
    })));

    const borders = svgEl("g", { class: "geo-country-borders" });
    borderLines.forEach(d => borders.append(svgEl("path", { d, class: "geo-country-border" })));

    svg.append(grid, land, borders, overlays);
    return svg;
}

function loadGoogleMaps(key) {
    if (window.google?.maps) return Promise.resolve(window.google.maps);
    if (googleMapsLoadPromise) return googleMapsLoadPromise;

    googleMapsLoadPromise = new Promise((resolve, reject) => {
        const callbackName = `__wxmGoogleMapsReady_${Date.now()}`;
        window[callbackName] = () => {
            delete window[callbackName];
            resolve(window.google.maps);
        };

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=${callbackName}&v=weekly`;
        script.async = true;
        script.defer = true;
        script.onerror = () => {
            delete window[callbackName];
            reject(new Error("Google Maps load failed"));
        };
        document.head.append(script);
    });

    return googleMapsLoadPromise;
}

function clearGoogleMarkers(mapElement) {
    if (!mapElement) {
        googleMapContexts.forEach(context => {
            context.markers.forEach(marker => marker.setMap?.(null));
            context.markers = [];
        });
        return;
    }

    const context = googleMapContexts.get(mapElement);
    if (!context) return;
    context.markers.forEach(marker => marker.setMap?.(null));
    context.markers = [];
}

function clearAtlasMap(mapElement) {
    try {
        window.WxmWorldAtlasMap?.unmount?.(mapElement);
    } catch {
        // Keep analytics resilient: if React unmount fails, the SVG fallback can still render.
    }
    mapElement?.classList?.remove("atlas-map-ready");
}

function getCountryPoints(analytics) {
    const rows = analytics.countries?.length ? analytics.countries : [];
    return rows.map(row => {
        const code = resolveCountryCode(row);
        const [lat, lng] = COUNTRY_COORDINATES[code] || COUNTRY_COORDINATES.UNKNOWN;
        const value = row.live || row.uniqueListeners || row.access || 1;
        const position = projectLatLng(lat, lng);
        return {
            code,
            lat,
            lng,
            value,
            x: position.x,
            y: position.y,
            name: row.country || row.name || code
        };
    });
}

function resolveCountryCode(row) {
    const code = text(row?.code).toUpperCase();
    if (COUNTRY_COORDINATES[code]) return code;
    const name = text(row?.country || row?.name).toLowerCase();
    return COUNTRY_NAME_TO_CODE[name] || "UNKNOWN";
}

function projectLatLng(lat, lng) {
    return {
        x: Math.min(94, Math.max(6, ((lng + 180) / 360) * 100)),
        y: Math.min(88, Math.max(10, ((90 - lat) / 180) * 100))
    };
}

function getGoogleMapStyles() {
    return [
        { elementType: "geometry", stylers: [{ color: "#11131d" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#c9cad6" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#08090d" }] },
        { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#34384a" }] },
        { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#10121b" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "road", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#050711" }] }
    ];
}

function escapeHtml(value) {
    return text(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    })[char]);
}

function svgEl(tag, attributes) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
}

function renderAnalyticsEmpty(container, message = "Sin datos para este periodo.") {
    if (!container) return;
    container.replaceChildren();
    const empty = document.createElement("div");
    empty.className = "analytics-empty";
    empty.textContent = message;
    container.append(empty);
}

function renderCompactList(container, items) {
    if (!container) return;
    container.replaceChildren();
    if (!items?.length) {
        renderAnalyticsEmpty(container, "Sin conexiones activas en este momento.");
        return;
    }
    items.slice(0, 8).forEach(item => {
        const row = document.createElement("div");
        row.className = "compact-row";
        const country = document.createElement("strong");
        country.textContent = item.country;
        const age = document.createElement("span");
        age.textContent = `${item.ageSeconds}s`;
        row.append(country, age);
        container.append(row);
    });
}

function renderRankList(container, items, labelFn, valueFn) {
    if (!container) return;
    container.replaceChildren();
    if (!items?.length) {
        renderAnalyticsEmpty(container, "Sin ranking disponible para este periodo.");
        return;
    }
    const max = Math.max(...items.map(item => item.access || item.uniqueListeners || item.live || 0), 1);
    items.slice(0, 5).forEach(item => {
        const row = document.createElement("div");
        row.className = "rank-row";
        const label = document.createElement("strong");
        label.textContent = labelFn(item);
        const value = document.createElement("span");
        value.textContent = valueFn(item);
        const meter = document.createElement("div");
        meter.className = "rank-meter";
        const fill = document.createElement("i");
        const raw = item.access || item.uniqueListeners || item.live || 0;
        fill.style.setProperty("--value", `${Math.round((raw / max) * 100)}%`);
        meter.append(fill);
        row.append(label, value, meter);
        container.append(row);
    });
}

function renderDonut(container, items, labelFn, valueFn) {
    if (!container) return;
    container.replaceChildren();
    const rows = (items || [])
        .slice(0, 5)
        .map(item => ({
            label: labelFn(item),
            value: Number(valueFn(item) || 0)
        }))
        .filter(item => item.value > 0);
    const total = rows.reduce((sum, item) => sum + item.value, 0);
    if (!rows.length || total <= 0) {
        renderAnalyticsEmpty(container, "Sin distribucion agregada todavia.");
        return;
    }
    const colors = ["#ff007a", "#ff2d95", "#8d39ff", "#ffb703", "#35e08a"];
    let cursor = 0;
    const stops = rows.map((item, index) => {
        const size = (item.value / total) * 100;
        const start = cursor;
        const end = cursor + size;
        cursor = end;
        return `${colors[index % colors.length]} ${start}% ${end}%`;
    }).join(", ");

    const chart = document.createElement("div");
    chart.className = "donut-chart";
    chart.style.background = `conic-gradient(${stops || "rgba(255,255,255,0.12) 0 100%"})`;
    const core = document.createElement("span");
    core.textContent = formatNumber(total);
    chart.append(core);

    const list = document.createElement("div");
    list.className = "donut-legend";
    rows.forEach((item, index) => {
        const row = document.createElement("div");
        const swatch = document.createElement("i");
        swatch.style.background = colors[index % colors.length];
        const label = document.createElement("strong");
        label.textContent = item.label;
        const value = document.createElement("span");
        value.textContent = `${Math.round((item.value / total) * 100)}% · ${formatNumber(item.value)}`;
        row.append(swatch, label, value);
        list.append(row);
    });

    container.append(chart, list);
}

function renderAnalyticsTable(container, headers, rows, cellFns) {
    if (!container) return;
    container.replaceChildren();
    const head = document.createElement("div");
    head.className = "analytics-table-row header";
    headers.forEach(label => {
        const cell = document.createElement("strong");
        cell.textContent = label;
        head.append(cell);
    });
    container.append(head);

    if (!rows?.length) {
        const empty = document.createElement("div");
        empty.className = "analytics-table-row empty";
        empty.textContent = "No hay datos para este periodo.";
        container.append(empty);
        return;
    }

    rows.slice(0, 12).forEach(item => {
        const line = document.createElement("div");
        line.className = "analytics-table-row";
        cellFns.forEach((fn, index) => {
            const cell = document.createElement(index === 0 ? "strong" : "span");
            cell.textContent = fn(item);
            line.append(cell);
        });
        container.append(line);
    });
}

function renderQuickStats() {
    if (!dom.quickStatsTable) return;
    const labels = {
        uniqueListeners: "Unique listeners",
        listeningHours: "Listening hours",
        accessCount: "Access count"
    };
    dom.quickStatsTable.replaceChildren();
    const head = document.createElement("div");
    head.className = "analytics-table-row";
    ["Quick stats", "Ayer", "Semana", "Mes", "Periodo"].forEach(label => {
        const cell = document.createElement("span");
        cell.textContent = label;
        head.append(cell);
    });
    dom.quickStatsTable.append(head);
    Object.entries(state.analytics.quickStats).forEach(([key, row]) => {
        const line = document.createElement("div");
        line.className = "analytics-table-row";
        [labels[key] || key, row.yesterday, row.week, row.month, row.selected].forEach(value => {
            const cell = document.createElement(typeof value === "string" ? "strong" : "span");
            cell.textContent = typeof value === "number" ? formatNumber(value) : value;
            line.append(cell);
        });
        dom.quickStatsTable.append(line);
    });
}

function formatNumber(value) {
    return Number(value || 0).toLocaleString("es-ES");
}

function formGrid() {
    const grid = document.createElement("div");
    grid.className = "form-grid two";
    return grid;
}

function renderCollection(container, items, emptyMessage, renderer) {
    container.replaceChildren();
    if (!items.length) return renderEmpty(container, emptyMessage);
    items.forEach((item, index) => container.append(renderer(item, index)));
}

function renderEmpty(container, message) {
    const empty = document.createElement("p");
    empty.className = "empty-note";
    empty.textContent = message;
    container.append(empty);
}

function removeItem(list, index, renderFn) {
    list.splice(index, 1);
    renderFn();
    refreshDerived();
}

function editableCard(titleText, onRemove) {
    const card = document.createElement("article");
    card.className = "editable-card";
    const head = document.createElement("div");
    head.className = "editable-head";
    const title = document.createElement("span");
    title.className = "editable-title";
    title.textContent = titleText;
    const remove = document.createElement("button");
    remove.className = "remove-btn";
    remove.type = "button";
    remove.title = "Eliminar";
    remove.textContent = "x";
    remove.addEventListener("click", onRemove);
    head.append(title, remove);
    card.append(head);
    return card;
}

function renderMetrics() {
    setText(dom.metricRevision, state.revision || "--");
    setText(dom.metricStream, compactUrl(state.stream.primaryUrl));
    setText(dom.metricFallbacks, String(state.stream.fallbackUrls.length));
    setText(dom.metricFeatures, String(Object.values(state.features).filter(Boolean).length));
}

function compactUrl(value) {
    try {
        const url = new URL(value);
        return url.host;
    } catch {
        return "--";
    }
}

function renderPreview() {
    dom.previewLogo.src = resolveImageSrc(state.station.logo);
    dom.previewLogo.alt = state.station.name;
    setText(dom.previewName, state.station.name || "WXM ONE RADIO");
    setText(dom.previewSlogan, state.station.slogan || "La radio que conecta al mundo");

    const current = getCurrentProgram();
    setText(dom.previewProgram, current?.title || "Radio en vivo");
    setText(dom.previewHost, current?.host || state.station.name);

    dom.previewHighlights.replaceChildren();
    state.content.highlights.slice(0, 3).forEach(item => {
        const row = document.createElement("div");
        row.className = "preview-item";
        const meta = document.createElement("span");
        meta.textContent = item.meta;
        const title = document.createElement("strong");
        title.textContent = item.title;
        row.append(meta, title);
        dom.previewHighlights.append(row);
    });
}

function getCurrentProgram() {
    const schedule = state.content.schedule;
    if (!schedule.length) return null;
    const hour = new Date().getHours();
    let match = schedule[0];
    schedule.forEach(program => {
        const start = Number.parseInt(String(program.time).split(":")[0], 10);
        if (Number.isFinite(start) && hour >= start) match = program;
    });
    return match;
}

function renderValidation() {
    const imageFields = [
        state.station.logo,
        state.visual.heroImage,
        ...state.content.banners.map(item => item.image),
        ...state.content.schedule.map(item => item.image),
        ...state.content.highlights.map(item => item.image),
        ...state.content.presenters.map(item => item.image),
        ...state.content.articles.map(item => item.image),
        ...state.content.podcasts.map(item => item.image),
        ...state.content.stations.map(item => item.image),
        ...state.content.polls.map(item => item.image),
        ...state.content.sponsors.map(item => item.image)
    ].filter(Boolean);

    const checks = [];
    checks.push([isHttps(state.stream.primaryUrl), "Stream principal HTTPS"]);
    checks.push([isHttps(state.stream.infoApi), "API de metadata HTTPS"]);
    checks.push([state.stream.fallbackUrls.every(isHttps), "Fallbacks HTTPS"]);
    checks.push([isAssetOrHttps(state.station.logo), "Logo seguro"]);
    checks.push([state.content.schedule.every(item => validTime(item.time)), "Horas de programacion validas"]);
    checks.push([imageFields.every(isAssetOrHttps), "Imagenes seguras assets/img, HTTPS o archivo local"]);
    checks.push([!state.emergency.streamUrl || isHttps(state.emergency.streamUrl), "Stream de emergencia seguro"]);
    checks.push([!state.analytics.ingestEndpoint || isHttps(state.analytics.ingestEndpoint), "Endpoint analytics HTTPS"]);
    checks.push([!state.analytics.dashboardEndpoint || isAdminEndpoint(state.analytics.dashboardEndpoint), "Endpoint dashboard valido"]);
    checks.push([state.content.highlights.length > 0, "Destacados cargados"]);

    dom.validationList.replaceChildren();
    checks.forEach(([ok, label]) => {
        const item = document.createElement("li");
        item.className = ok ? "ok" : "bad";
        item.textContent = `${ok ? "OK" : "Revisar"} · ${label}`;
        dom.validationList.append(item);
    });

    const fallbackNotice = document.createElement("li");
    fallbackNotice.className = state.stream.fallbackUrls.length ? "ok" : "warn";
    fallbackNotice.textContent = state.stream.fallbackUrls.length
        ? "OK · Hay fallback secundario"
        : "Pendiente · Agregar fallback cuando exista una segunda fuente";
    dom.validationList.append(fallbackNotice);

    if (state.analytics.map?.provider === "google") {
        const googleMapsNotice = document.createElement("li");
        googleMapsNotice.className = getGoogleMapsKey() ? "ok" : "warn";
        googleMapsNotice.textContent = getGoogleMapsKey()
            ? "OK · Google Maps configurado solo para el panel CMS"
            : "Pendiente · Google Maps seleccionado sin API key local; se usara fallback interno";
        dom.validationList.append(googleMapsNotice);
    }

    const gate = validateAppCmsContract(buildAppCmsContract());
    const publishable = gate.errors.length === 0;
    if (dom.publishGateStatus) {
        dom.publishGateStatus.className = `publish-gate ${publishable ? (gate.warnings.length ? "warn" : "ok") : "bad"}`;
        dom.publishGateStatus.textContent = publishable
            ? `Contrato publicable · ${gate.warnings.length} advertencias`
            : `Contrato bloqueado · ${gate.errors.length} errores`;
    }
    if (dom.downloadAppJsonBtn) dom.downloadAppJsonBtn.disabled = !publishable;
    if (dom.copyAppJsonBtn) dom.copyAppJsonBtn.disabled = !publishable;
    renderReadiness(gate, publishable);

    gate.errors.forEach(message => appendValidationItem("bad", `Bloquea publicacion · ${message}`));
    gate.warnings.slice(0, 8).forEach(message => appendValidationItem("warn", `Advertencia · ${message}`));
}

function renderReadiness(gate, publishable) {
    if (!dom.readinessCard) return;
    const hasWarnings = gate.warnings.length > 0;
    dom.readinessCard.className = `readiness-card ${publishable ? (hasWarnings ? "warn" : "ok") : "bad"}`;
    setText(
        dom.readinessTitle,
        publishable ? (hasWarnings ? "Publicable con advertencias" : "Listo para publicar") : "Publicacion bloqueada"
    );
    setText(
        dom.readinessSummary,
        publishable
            ? (hasWarnings ? `${gate.warnings.length} advertencia(s) antes de produccion.` : "El contrato esta limpio para exportar.")
            : `${gate.errors.length} error(es) deben corregirse antes de exportar.`
    );
    if (!dom.readinessIssues) return;
    dom.readinessIssues.replaceChildren();
    const issues = publishable ? gate.warnings.slice(0, 4) : gate.errors.slice(0, 4);
    if (!issues.length) {
        const item = document.createElement("li");
        item.textContent = "Sin acciones pendientes.";
        dom.readinessIssues.append(item);
        return;
    }
    issues.forEach(message => {
        const item = document.createElement("li");
        item.textContent = message;
        dom.readinessIssues.append(item);
    });
}

function appendValidationItem(className, message) {
    const item = document.createElement("li");
    item.className = className;
    item.textContent = message;
    dom.validationList.append(item);
}

function validateAppCmsContract(contract) {
    const errors = [];
    const warnings = [];
    const rails = contract?.rails && typeof contract.rails === "object" ? contract.rails : {};
    const railIds = Object.keys(rails);
    const maxItems = 40;

    if (!contract || typeof contract !== "object") {
        return { errors: ["JSON de publicacion invalido."], warnings };
    }
    if (!text(contract.revision)) errors.push("Falta revision.");
    if (!contract.features || typeof contract.features !== "object") errors.push("Falta bloque features.");
    if (!contract.station?.name) errors.push("Falta station.name.");
    if (!isHttps(contract.stream?.primaryUrl)) errors.push("El stream principal debe ser HTTPS.");
    if (contract.stream?.infoApi && !isHttps(contract.stream.infoApi)) errors.push("La API de metadata debe ser HTTPS.");
    if (contract.stream?.fallbackUrls?.some(url => !isHttps(url))) errors.push("Todos los fallback streams deben ser HTTPS.");
    if (contract.emergency?.enabled && !isHttps(contract.emergency?.streamUrl)) {
        errors.push("Modo emergencia activo sin stream HTTPS valido.");
    }
    if (!isAssetOrHttps(contract.visual?.heroImage)) errors.push("Imagen hero insegura o vacia.");
    if (!isAssetOrHttps(contract.visual?.logoImage)) errors.push("Logo inseguro o vacio.");
    if (contract.analytics?.ingestEndpoint && !isHttps(contract.analytics.ingestEndpoint)) {
        errors.push("Endpoint analytics debe ser HTTPS.");
    }
    if (contract.analytics?.dashboardEndpoint && !isHttps(contract.analytics.dashboardEndpoint)) {
        errors.push("Endpoint dashboard analytics debe ser HTTPS.");
    }

    ["homeRails", "exploreRails"].forEach(key => {
        const list = contract[key];
        if (!Array.isArray(list)) {
            errors.push(`${key} debe ser una lista.`);
            return;
        }
        list.forEach(railId => {
            if (!rails[railId]) errors.push(`${key} referencia un rail inexistente: ${railId}.`);
        });
    });

    railIds.forEach(railId => {
        const rail = rails[railId];
        if (!rail || typeof rail !== "object") {
            errors.push(`Rail ${railId} invalido.`);
            return;
        }
        if (!text(rail.feature)) errors.push(`Rail ${railId} sin feature.`);
        if (!text(rail.titleKey)) errors.push(`Rail ${railId} sin titleKey.`);
        if (!Array.isArray(rail.items)) {
            errors.push(`Rail ${railId} sin items.`);
            return;
        }
        if (rail.items.length > maxItems) errors.push(`Rail ${railId} excede ${maxItems} items.`);
        if (contract.features?.[rail.feature] === true && rail.items.length === 0) {
            warnings.push(`${railId} esta activo pero no tiene contenido; la app ocultara esa seccion.`);
        }
        rail.items.forEach((item, index) => {
            const label = `${railId}[${index + 1}]`;
            if (!text(item?.title)) errors.push(`${label} sin titulo.`);
            if (item?.image && !isAssetOrHttps(item.image)) errors.push(`${label} tiene imagen insegura.`);
            if (item?.url && !isSafeActionUrl(item.url)) errors.push(`${label} tiene URL insegura.`);
            if (text(item?.body).length < 12 && text(item?.subtitle).length < 12) {
                warnings.push(`${label} tiene poco texto editorial.`);
            }
        });
    });

    const embeddedImages = collectContractImages(contract).filter(isDataImage);
    const bytes = payloadBytes(contract);
    if (bytes > 180_000) warnings.push(`JSON pesado (${Math.round(bytes / 1024)} KB). Conviene reducir imagenes/items.`);
    if (embeddedImages.length) {
        warnings.push(`${embeddedImages.length} imagen(es) local(es) embebida(s). Perfecto para borrador; para produccion conviene subirlas a hosting/CDN HTTPS.`);
    }
    if (!contract.stream?.fallbackUrls?.length) warnings.push("No hay fallback stream; recomendable antes de produccion.");
    if (contract.analytics?.enabled && !contract.analytics?.ingestEndpoint) {
        warnings.push("Analytics remoto no configurado; el dashboard seguira con datos locales/mock.");
    }
    if (contract.analytics?.map?.provider === "google") {
        warnings.push("Google Maps requiere una browser API key restringida por dominio en el CMS; la key no se exporta al contrato publico.");
    }

    return { errors, warnings };
}

function collectContractImages(contract) {
    const images = [
        contract?.visual?.heroImage,
        contract?.visual?.logoImage,
        contract?.station?.logo
    ];
    const rails = contract?.rails && typeof contract.rails === "object" ? contract.rails : {};
    Object.values(rails).forEach(rail => {
        if (!Array.isArray(rail?.items)) return;
        rail.items.forEach(item => images.push(item?.image));
    });
    return images.filter(Boolean);
}

function collectStateImageRefs() {
    const refs = [
        {
            label: "Logo app",
            suggestedName: "station-logo",
            get: () => state.station.logo,
            set: value => { state.station.logo = value; }
        },
        {
            label: "Imagen hero",
            suggestedName: "hero-main",
            get: () => state.visual.heroImage,
            set: value => { state.visual.heroImage = value; }
        }
    ];

    const collections = [
        ["banners", state.content.banners, "banner"],
        ["schedule", state.content.schedule, "program"],
        ["highlights", state.content.highlights, "highlight"],
        ["presenters", state.content.presenters, "presenter"],
        ["articles", state.content.articles, "article"],
        ["podcasts", state.content.podcasts, "podcast"],
        ["stations", state.content.stations, "station"],
        ["polls", state.content.polls, "poll"],
        ["sponsors", state.content.sponsors, "sponsor"]
    ];

    collections.forEach(([collectionName, items, prefix]) => {
        items.forEach((item, index) => {
            refs.push({
                label: `${collectionName} ${index + 1}`,
                suggestedName: `${prefix}-${index + 1}-${slugifyAssetName(item.title || item.name || item.question || "image")}`,
                get: () => item.image,
                set: value => { item.image = value; }
            });
        });
    });

    return refs;
}

function getEmbeddedImageRefs() {
    return collectStateImageRefs().filter(ref => isDataImage(ref.get()));
}

function slugifyAssetName(value) {
    return text(value)
        .slice(0, 80)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "image";
}

function assetDataUrlInfo(dataUrl) {
    const match = String(dataUrl || "").match(/^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/i);
    if (!match) return { mime: "", bytes: 0 };
    const padding = match[2].endsWith("==") ? 2 : match[2].endsWith("=") ? 1 : 0;
    return {
        mime: match[1].toLowerCase().replace("image/jpg", "image/jpeg"),
        bytes: Math.floor((match[2].length * 3) / 4) - padding
    };
}

function renderAssetPipelineStatus() {
    if (!dom.assetPipelineStatus) return;
    const refs = getEmbeddedImageRefs();
    const bytes = refs.reduce((total, ref) => total + assetDataUrlInfo(ref.get()).bytes, 0);
    dom.assetPipelineStatus.className = `publish-gate ${refs.length ? "warn" : "ok"}`;
    dom.assetPipelineStatus.textContent = refs.length
        ? `${refs.length} imagen(es) locales pendientes · ${Math.round(bytes / 1024)} KB embebidos.`
        : "OK · Sin imagenes locales embebidas pendientes.";
    if (dom.uploadEmbeddedAssetsBtn) dom.uploadEmbeddedAssetsBtn.disabled = refs.length === 0;
    if (dom.downloadAssetPackageBtn) dom.downloadAssetPackageBtn.disabled = refs.length === 0;
}

function buildExportCmc() {
    return normalizeCmc({
        ...state,
        revision: state.revision || `cms-${new Date().toISOString().slice(0, 10)}`,
        source: "cms-local"
    });
}

function buildAppCmsContract() {
    const cmc = buildExportCmc();
    const rails = {
        banners: {
            feature: "banners",
            titleKey: "cms.rails.banners",
            actionKey: "common.viewMore",
            layout: "hero-banner",
            items: cmc.content.banners.map(item => ({
                title: item.title,
                subtitle: item.body,
                badge: item.meta || "WXM",
                meta: item.meta,
                body: item.body,
                image: item.image,
                url: item.ctaUrl
            }))
        },
        secondaryStations: {
            feature: "secondaryStations",
            titleKey: "cms.rails.radios",
            actionKey: "common.viewMore",
            layout: "station-grid",
            items: cmc.content.stations
                .filter(item => item.enabled)
                .map(item => ({
                    title: item.name,
                    subtitle: item.description,
                    badge: "Live",
                    body: item.description,
                    image: item.image
                }))
        },
        podcasts: {
            feature: "podcasts",
            titleKey: "cms.rails.podcasts",
            actionKey: "common.viewMore",
            layout: "media-row",
            items: cmc.content.podcasts.map(item => ({
                title: item.title,
                subtitle: item.description,
                badge: item.show || "Podcast",
                meta: item.episodes ? `${item.episodes} episodios` : "",
                body: item.description,
                image: item.image,
                url: item.url
            }))
        },
        mixes: emptyRail("mixes", "cms.rails.mixes", "media-row"),
        news: {
            feature: "news",
            titleKey: "cms.rails.news",
            actionKey: "common.viewMore",
            layout: "article-row",
            items: cmc.content.articles.map(item => ({
                title: item.title,
                subtitle: item.excerpt,
                badge: item.category || "Noticias",
                meta: item.publishedAt,
                body: item.excerpt,
                image: item.image,
                url: item.url
            }))
        },
        presenters: {
            feature: "presenters",
            titleKey: "cms.rails.presenters",
            actionKey: "common.viewMore",
            layout: "presenter-row",
            items: cmc.content.presenters.map(item => ({
                title: item.name,
                subtitle: [item.role, item.program].filter(Boolean).join(" · "),
                badge: "Cabina",
                body: item.bio,
                image: item.image,
                url: item.website || item.instagram
            }))
        },
        polls: {
            feature: "polls",
            titleKey: "cms.rails.polls",
            actionKey: "common.viewMore",
            layout: "poll-row",
            items: cmc.content.polls.map(item => ({
                title: item.question,
                subtitle: item.options.join(" · "),
                badge: item.meta || "Encuesta",
                body: `Opciones: ${item.options.join(", ")}`,
                image: item.image
            }))
        },
        songQuiz: emptyRail("songQuiz", "cms.rails.songQuiz", "media-row"),
        videos: emptyRail("videos", "cms.rails.videos", "video-row"),
        replays: emptyRail("replays", "cms.rails.replays", "media-row"),
        sponsors: {
            feature: "sponsors",
            titleKey: "cms.rails.sponsors",
            actionKey: "common.viewMore",
            layout: "sponsor-row",
            items: cmc.content.sponsors.map(item => ({
                title: item.title,
                subtitle: item.brand,
                badge: "Sponsor",
                meta: [item.startsAt, item.endsAt].filter(Boolean).join(" - "),
                body: item.body,
                image: item.image,
                url: item.url
            }))
        }
    };

    const homeRails = ["banners", "secondaryStations", "podcasts", "news", "presenters", "sponsors"]
        .filter(key => cmc.features[key] && rails[key]?.items?.length);
    const exploreRails = ["banners", "secondaryStations", "podcasts", "mixes", "news", "presenters", "polls", "songQuiz", "videos", "replays", "sponsors"]
        .filter(key => rails[key]);

    return {
        revision: cmc.revision,
        source: "cms-panel",
        station: cmc.station,
        features: {
            miniPlayer: cmc.features.miniPlayer,
            languageSelector: cmc.features.languageSelector,
            editorialHighlights: cmc.features.editorialHighlights,
            programs: cmc.features.programs,
            requests: cmc.features.requests,
            banners: cmc.features.banners,
            secondaryStations: cmc.features.secondaryStations,
            podcasts: cmc.features.podcasts,
            mixes: cmc.features.mixes,
            news: cmc.features.news,
            videos: cmc.features.videos,
            songQuiz: cmc.features.songQuiz,
            replays: cmc.features.replays,
            presenters: cmc.features.presenters,
            polls: cmc.features.polls,
            sponsors: cmc.features.sponsors,
            audioExperience: cmc.features.audioExperience,
            emergencyMode: cmc.features.emergencyMode && cmc.emergency.enabled,
            analyticsDashboard: cmc.features.analyticsDashboard
        },
        visual: {
            themeDefault: cmc.visual.themeDefault,
            allowLightTheme: true,
            heroImage: cmc.visual.heroImage,
            logoImage: cmc.station.logo,
            accentColor: cmc.visual.accentColor
        },
        audioExperience: {
            enabled: cmc.audioExperience.enabled,
            recommendedProfile: cmc.audioExperience.recommendedProfile,
            defaultProfile: cmc.audioExperience.recommendedProfile,
            allowUserProfiles: cmc.audioExperience.enabled,
            showAdvancedProfiles: cmc.features.audioProfiles || cmc.features.audioExperience,
            lowDataMode: cmc.audioExperience.lowDataMode,
            networkWarning: cmc.audioExperience.networkWarning
        },
        emergency: cmc.emergency,
        analytics: {
            enabled: cmc.analytics.enabled,
            mode: cmc.analytics.mode,
            ingestEndpoint: cmc.analytics.ingestEndpoint,
            dashboardEndpoint: isHttps(cmc.analytics.dashboardEndpoint) ? cmc.analytics.dashboardEndpoint : "",
            retentionDays: cmc.analytics.retentionDays,
            map: {
                provider: cmc.analytics.map?.provider || "local",
                note: "Google Maps API key is CMS-local and is never exported in this app contract."
            },
            requiredDimensions: ["sourceClient", "platform", "appVersion", "stationId", "streamRole", "player", "referrer"],
            sourceClients: ["wxm_android_app", "wxm_web_app", "cms_preview", "external_player", "tunein", "alexa", "unknown"]
        },
        stream: cmc.stream,
        content: cmc.content,
        homeRails,
        exploreRails,
        rails
    };
}

function emptyRail(feature, titleKey, layout) {
    return {
        feature,
        titleKey,
        actionKey: "common.viewMore",
        layout,
        items: []
    };
}

function renderJson() {
    dom.appJsonOutput.textContent = JSON.stringify(buildAppCmsContract(), null, 2);
    dom.jsonOutput.textContent = JSON.stringify(buildExportCmc(), null, 2);
}

function bindStaticForms() {
    dom.stationName.addEventListener("input", () => { state.station.name = text(dom.stationName.value).slice(0, 60); refreshDerived(); });
    dom.stationDomain.addEventListener("input", () => { state.station.domain = text(dom.stationDomain.value).slice(0, 80); refreshDerived(); });
    dom.stationSlogan.addEventListener("input", () => { state.station.slogan = text(dom.stationSlogan.value).slice(0, 100); refreshDerived(); });
    dom.stationSubtitle.addEventListener("input", () => { state.station.subtitle = text(dom.stationSubtitle.value).slice(0, 80); refreshDerived(); });
    dom.stationLogo.addEventListener("input", () => {
        state.station.logo = normalizeImageInput(dom.stationLogo.value);
        renderImagePreview(dom.stationLogoPreview, state.station.logo);
        refreshDerived();
    });
    dom.stationLogoFile?.addEventListener("change", async () => {
        const prepared = await handleImageFile(dom.stationLogoFile, IMAGE_PRESETS.logo);
        if (!prepared) return;
        state.station.logo = prepared.dataUrl;
        dom.stationLogo.value = imageInputDisplay(state.station.logo);
        renderImagePreview(dom.stationLogoPreview, state.station.logo);
        refreshDerived();
    });

    dom.streamPrimary.addEventListener("input", () => { state.stream.primaryUrl = text(dom.streamPrimary.value).slice(0, 260); refreshDerived(); });
    dom.streamInfoApi.addEventListener("input", () => { state.stream.infoApi = text(dom.streamInfoApi.value).slice(0, 260); refreshDerived(); });
    dom.streamReconnect.addEventListener("input", () => {
        state.stream.reconnectIntervalMs = boundedNumber(dom.streamReconnect.value, 5000, 2000, 30000);
        refreshDerived();
    });
    dom.streamRetries.addEventListener("input", () => {
        state.stream.maxRetries = boundedNumber(dom.streamRetries.value, 5, 1, 10);
        refreshDerived();
    });

    dom.emergencyEnabled.addEventListener("change", () => { state.emergency.enabled = dom.emergencyEnabled.value === "true"; refreshDerived(); });
    dom.emergencySeverity.addEventListener("change", () => { state.emergency.severity = dom.emergencySeverity.value; refreshDerived(); });
    dom.emergencyTitle.addEventListener("input", () => { state.emergency.title = text(dom.emergencyTitle.value).slice(0, 80); refreshDerived(); });
    dom.emergencyStream.addEventListener("input", () => { state.emergency.streamUrl = text(dom.emergencyStream.value).slice(0, 260); refreshDerived(); });
    dom.emergencyMessage.addEventListener("input", () => { state.emergency.message = text(dom.emergencyMessage.value).slice(0, 180); refreshDerived(); });
    dom.visualTheme.addEventListener("change", () => { state.visual.themeDefault = dom.visualTheme.value === "light" ? "light" : "dark"; refreshDerived(); });
    dom.visualAccent.addEventListener("input", () => { state.visual.accentColor = text(dom.visualAccent.value).slice(0, 7); refreshDerived(); });
    dom.visualHero.addEventListener("input", () => {
        state.visual.heroImage = normalizeImageInput(dom.visualHero.value);
        renderImagePreview(dom.visualHeroPreview, state.visual.heroImage);
        refreshDerived();
    });
    dom.visualHeroFile?.addEventListener("change", async () => {
        const prepared = await handleImageFile(dom.visualHeroFile, IMAGE_PRESETS.hero);
        if (!prepared) return;
        state.visual.heroImage = prepared.dataUrl;
        dom.visualHero.value = imageInputDisplay(state.visual.heroImage);
        renderImagePreview(dom.visualHeroPreview, state.visual.heroImage);
        refreshDerived();
    });
    dom.audioProfile.addEventListener("input", () => { state.audioExperience.recommendedProfile = text(dom.audioProfile.value).slice(0, 40); refreshDerived(); });
    dom.audioLowData.addEventListener("change", () => { state.audioExperience.lowDataMode = dom.audioLowData.value === "true"; refreshDerived(); });
    dom.analyticsMode?.addEventListener("change", () => {
        state.analytics.mode = dom.analyticsMode.value;
        remoteAnalyticsState = { loading: false, lastLoadedAt: "", error: "" };
        refreshDerived();
    });
    dom.analyticsRetention?.addEventListener("input", () => { state.analytics.retentionDays = boundedNumber(dom.analyticsRetention.value, 90, 7, 730); refreshDerived(); });
    dom.analyticsIngestEndpoint?.addEventListener("input", () => { state.analytics.ingestEndpoint = text(dom.analyticsIngestEndpoint.value).slice(0, 260); refreshDerived(); });
    dom.analyticsDashboardEndpoint?.addEventListener("input", () => {
        state.analytics.dashboardEndpoint = text(dom.analyticsDashboardEndpoint.value).slice(0, 260);
        remoteAnalyticsState = { loading: false, lastLoadedAt: "", error: "" };
        refreshDerived();
    });
    dom.analyticsMapProvider?.addEventListener("change", () => {
        state.analytics.map = { provider: dom.analyticsMapProvider.value === "google" ? "google" : "local" };
        refreshDerived();
    });
    dom.analyticsGoogleMapsKey?.addEventListener("input", () => {
        localStorage.setItem(GOOGLE_MAPS_KEY, text(dom.analyticsGoogleMapsKey.value).slice(0, 160));
        renderAudienceMap(state.analytics);
        renderValidation();
    });
    if (dom.assetUploadEndpoint) dom.assetUploadEndpoint.value = getAssetUploadEndpoint();
    dom.assetUploadEndpoint?.addEventListener("input", () => {
        localStorage.setItem(ASSET_ENDPOINT_KEY, text(dom.assetUploadEndpoint.value).slice(0, 260));
    });
}

function leaveAdvancedMode() {
    setAdvancedVisible(false);
    showSystemTab("operations");
    toast("Modo avanzado oculto");
}

function bindActions() {
    dom.nav.forEach(button => {
        button.addEventListener("click", () => showPanel(button.dataset.section));
    });
    dom.analyticsTabs.forEach(button => {
        button.addEventListener("click", () => showAnalyticsTab(button.dataset.analyticsTab));
    });
    dom.systemTabs.forEach(button => {
        button.addEventListener("click", () => showSystemTab(button.dataset.systemTab));
    });
    dom.toggleAdvancedBtn?.addEventListener("click", () => {
        const nextVisible = !advancedVisible;
        if (nextVisible) {
            setAdvancedVisible(true);
            toast("Modo avanzado visible");
        } else {
            leaveAdvancedMode();
        }
    });
    dom.leaveAdvancedBtn?.addEventListener("click", leaveAdvancedMode);
    document.querySelectorAll("[data-jump]").forEach(button => {
        button.addEventListener("click", () => {
            showPanel(button.dataset.jump);
            if (button.dataset.systemTabJump) showSystemTab(button.dataset.systemTabJump);
        });
    });
    dom.togglePreviewBtn?.addEventListener("click", () => {
        setPreviewHidden(!previewHidden);
        toast(previewHidden ? "Preview oculto" : "Preview visible");
    });

    dom.reloadBtn.addEventListener("click", () => {
        const hasDraft = Boolean(localStorage.getItem(DRAFT_KEY));
        if (hasDraft && !window.confirm("Esto descarta el borrador local y recarga el CMC base. Continuar?")) {
            return toast("Recarga cancelada");
        }
        localStorage.removeItem(DRAFT_KEY);
        loadInitialCmc(false);
        toast("CMC local recargado");
    });

    dom.saveDraftBtn.addEventListener("click", () => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(buildExportCmc()));
        dom.sidebarStatus.textContent = "Borrador guardado";
        toast("Borrador local guardado");
    });

    dom.addFallbackBtn.addEventListener("click", () => {
        if (state.stream.fallbackUrls.length >= 5) return toast("Maximo 5 fallbacks");
        state.stream.fallbackUrls.push("https://");
        renderFallbacks();
        refreshDerived();
    });

    dom.addScheduleBtn.addEventListener("click", () => {
        state.content.schedule.push({
            time: "18:00",
            title: "Nuevo programa",
            host: "Equipo WXM",
            tag: "Descripcion del programa",
            genre: "Musica",
            image: "assets/img/brand/wxm-emblem-square.png",
            description: "",
            socialUrl: "",
            playlistUrl: ""
        });
        renderSchedule();
        refreshDerived();
    });

    dom.addHighlightBtn.addEventListener("click", () => {
        state.content.highlights.push({
            title: "Nuevo destacado",
            meta: "Hoy",
            icon: "fa-bolt",
            body: "Mensaje editorial para la app.",
            image: "assets/img/brand/hero-world-mobile.png",
            ctaLabel: "",
            ctaUrl: ""
        });
        renderHighlights();
        refreshDerived();
    });

    dom.addBannerBtn.addEventListener("click", () => {
        state.content.banners.push({
            title: "Nuevo banner",
            meta: "WXM",
            body: "Mensaje destacado para la portada.",
            image: "assets/img/brand/hero-world-wide.png",
            ctaLabel: "Ver mas",
            ctaUrl: "",
            placement: "home"
        });
        renderBanners();
        refreshDerived();
    });

    dom.addPresenterBtn.addEventListener("click", () => {
        state.content.presenters.push({
            name: "Nuevo locutor",
            role: "Cabina WXM",
            program: "WXM ONE RADIO",
            bio: "",
            image: "assets/img/brand/wxm-emblem-square.png",
            instagram: "",
            website: ""
        });
        renderPresenters();
        refreshDerived();
    });

    dom.addArticleBtn.addEventListener("click", () => {
        state.content.articles.push({
            title: "Nueva noticia",
            category: "Cultura",
            excerpt: "Resumen editorial para WXM.",
            image: "assets/img/brand/hero-world-wide.png",
            url: "",
            publishedAt: new Date().toISOString().slice(0, 10)
        });
        renderArticles();
        refreshDerived();
    });

    dom.addPodcastBtn.addEventListener("click", () => {
        state.content.podcasts.push({
            title: "Nuevo replay",
            show: "WXM Replays",
            episodes: 0,
            image: "assets/img/brand/wxm-emblem-square.png",
            url: "",
            description: ""
        });
        renderPodcasts();
        refreshDerived();
    });

    dom.addStationBtn.addEventListener("click", () => {
        state.content.stations.push({
            name: "WXM Channel",
            description: "Canal secundario preparado para CMS remoto.",
            streamUrl: "https://",
            image: "assets/img/brand/wxm-emblem-square.png",
            enabled: true
        });
        renderStations();
        refreshDerived();
    });

    dom.addPollBtn.addEventListener("click", () => {
        state.content.polls.push({
            question: "Que quieres escuchar mas en WXM?",
            meta: "Encuesta",
            image: "assets/img/brand/wxm-emblem-square.png",
            options: ["Urbano", "Pop", "Dance", "Entrevistas"]
        });
        renderPolls();
        refreshDerived();
    });

    dom.addSponsorBtn.addEventListener("click", () => {
        state.content.sponsors.push({
            title: "Nuevo sponsor",
            brand: "Aliado WXM",
            body: "Promocion oficial administrable desde CMC.",
            image: "assets/img/brand/hero-world-mobile.png",
            url: "",
            startsAt: new Date().toISOString().slice(0, 10),
            endsAt: ""
        });
        renderSponsors();
        refreshDerived();
    });

    dom.downloadAppJsonBtn.addEventListener("click", downloadAppJson);
    dom.copyAppJsonBtn.addEventListener("click", copyAppJson);
    dom.downloadJsonBtn.addEventListener("click", downloadJson);
    dom.copyJsonBtn.addEventListener("click", copyJson);
    dom.exportAnalyticsBtn?.addEventListener("click", downloadAnalyticsJson);
    dom.refreshRemoteAnalyticsBtn?.addEventListener("click", refreshRemoteAnalytics);
    dom.saveEndpointBtn.addEventListener("click", saveRemoteEndpoint);
    dom.saveAssetEndpointBtn?.addEventListener("click", saveAssetEndpoint);
    dom.uploadEmbeddedAssetsBtn?.addEventListener("click", uploadEmbeddedAssets);
    dom.downloadAssetPackageBtn?.addEventListener("click", downloadAssetPackage);
}

function showPanel(name) {
    activePanel = name || "overview";
    dom.nav.forEach(button => {
        const active = button.dataset.section === activePanel;
        button.classList.toggle("active", active);
        button.setAttribute("aria-expanded", String(active));
        if (active) {
            button.setAttribute("aria-current", "page");
        } else {
            button.removeAttribute("aria-current");
        }
    });
    dom.panels.forEach(panel => {
        const active = panel.dataset.panel === activePanel;
        panel.classList.toggle("active", active);
        panel.toggleAttribute("hidden", !active);
        panel.setAttribute("aria-hidden", String(!active));
    });
    if (activePanel === "system") showSystemTab(activeSystemTab);
    applyPreviewState();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function downloadJson() {
    const blob = new Blob([JSON.stringify(buildExportCmc(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "wxm-cmc.json";
    anchor.click();
    URL.revokeObjectURL(url);
    toast("JSON descargado");
}

function downloadAppJson() {
    const contract = buildAppCmsContract();
    const gate = validateAppCmsContract(contract);
    if (gate.errors.length) {
        toast("Contrato bloqueado: revisa validacion");
        renderValidation();
        return;
    }
    const blob = new Blob([JSON.stringify(contract, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "wxm-cms.json";
    anchor.click();
    URL.revokeObjectURL(url);
    toast("JSON app descargado");
}

function downloadAnalyticsJson() {
    const analytics = buildExportCmc().analytics;
    const blob = new Blob([JSON.stringify(analytics, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "wxm-analytics-sample.json";
    anchor.click();
    URL.revokeObjectURL(url);
    window.setTimeout(() => downloadTextFile(buildAnalyticsCsv(analytics), "wxm-analytics-summary.csv", "text/csv;charset=utf-8"), 120);
    toast("Analytics JSON + CSV exportado");
}

function csvCell(value) {
    const safe = text(value).replace(/"/g, "\"\"");
    return `"${safe}"`;
}

function csvLine(values) {
    return values.map(csvCell).join(",");
}

function buildAnalyticsCsv(analytics) {
    const rows = [
        ["section", "label", "metricA", "metricB", "metricC", "metricD"],
        ["kpi", "liveListeners", analytics?.kpis?.liveListeners || 0, "", "", ""],
        ["kpi", "peakAudience", analytics?.kpis?.peakAudience || 0, analytics?.kpis?.peakAt || "", "", ""],
        ["kpi", "avgHoursDay", analytics?.kpis?.avgHoursDay || 0, "", "", ""],
        ["kpi", "avgListeningTimeMin", analytics?.kpis?.avgListeningTimeMin || 0, "", "", ""],
        ["kpi", "totalListeningHours", analytics?.kpis?.totalListeningHours || 0, "", "", ""],
        ["kpi", "appUsers", analytics?.kpis?.appUsers || 0, "", "", ""]
    ];

    (analytics?.countries || []).forEach(item => {
        rows.push(["country", item.country || item.name || "", item.live || 0, item.uniqueListeners || 0, item.access || 0, item.listeningHours || 0]);
    });
    (analytics?.players || []).forEach(item => {
        rows.push(["player", item.name || "", item.listeningHours || 0, item.uniqueListeners || 0, item.access || 0, ""]);
    });
    (analytics?.referrers || []).forEach(item => {
        rows.push(["referrer", item.name || "", item.listeningHours || 0, item.uniqueListeners || 0, item.access || 0, ""]);
    });
    (analytics?.liveConnections || []).forEach(item => {
        rows.push(["live_connection", item.country || "", item.city || "", item.player || "", item.sourceClient || "", item.ageSeconds || 0]);
    });

    return rows.map(csvLine).join("\n");
}

function downloadTextFile(content, filename, type = "text/plain;charset=utf-8") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}

async function copyJson() {
    try {
        await navigator.clipboard.writeText(JSON.stringify(buildExportCmc(), null, 2));
        toast("JSON copiado");
    } catch {
        toast("No se pudo copiar");
    }
}

async function copyAppJson() {
    try {
        const contract = buildAppCmsContract();
        const gate = validateAppCmsContract(contract);
        if (gate.errors.length) {
            toast("Contrato bloqueado: revisa validacion");
            renderValidation();
            return;
        }
        await navigator.clipboard.writeText(JSON.stringify(contract, null, 2));
        toast("JSON app copiado");
    } catch {
        toast("No se pudo copiar");
    }
}

function saveRemoteEndpoint() {
    const endpoint = text(dom.remoteEndpoint.value);
    if (!isHttps(endpoint)) {
        toast("El endpoint debe ser HTTPS");
        return;
    }
    localStorage.setItem(REMOTE_ENDPOINT_KEY, endpoint);
    toast("Endpoint guardado para pruebas");
}

function getAssetUploadEndpoint() {
    return text(localStorage.getItem(ASSET_ENDPOINT_KEY) || "");
}

function saveAssetEndpoint() {
    const endpoint = text(dom.assetUploadEndpoint?.value);
    if (!isAdminEndpoint(endpoint)) {
        toast("El endpoint assets debe ser HTTPS o localhost");
        return;
    }
    localStorage.setItem(ASSET_ENDPOINT_KEY, endpoint);
    toast("Endpoint assets guardado");
}

async function uploadEmbeddedAssets() {
    const endpoint = text(dom.assetUploadEndpoint?.value || getAssetUploadEndpoint());
    if (!isAdminEndpoint(endpoint)) {
        toast("Configura un endpoint HTTPS de assets o localhost");
        return;
    }
    const refs = getEmbeddedImageRefs();
    if (!refs.length) return toast("No hay imagenes locales pendientes");

    dom.uploadEmbeddedAssetsBtn.disabled = true;
    let uploaded = 0;
    try {
        for (const ref of refs) {
            const response = await fetch(endpoint, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    label: ref.label,
                    suggestedName: ref.suggestedName,
                    image: ref.get()
                })
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload.ok) {
                throw new Error(payload.error || `upload_failed_${response.status}`);
            }
            const candidate = normalizeImageInput(payload.url || payload.path);
            const localUrl = isLocalHttp(payload.url) ? String(payload.url) : "";
            const nextUrl = candidate || localUrl;
            if (!nextUrl || isDataImage(nextUrl)) {
                throw new Error("asset_url_invalida");
            }
            ref.set(nextUrl);
            uploaded += 1;
        }
        renderAll();
        toast(`${uploaded} imagen(es) subidas y reemplazadas por URL`);
    } catch (error) {
        renderAssetPipelineStatus();
        toast(`No se pudo subir assets: ${error.message}`);
    }
}

function downloadAssetPackage() {
    const refs = getEmbeddedImageRefs();
    if (!refs.length) return toast("No hay imagenes locales pendientes");
    const packagePayload = {
        schema: "wxm-media-package.v1",
        revision: state.revision,
        createdAt: new Date().toISOString(),
        targetEndpoint: text(dom.assetUploadEndpoint?.value || getAssetUploadEndpoint()),
        note: "Paquete temporal para migrar imagenes embebidas a hosting/CDN. No publicarlo como JSON de app.",
        items: refs.map(ref => {
            const info = assetDataUrlInfo(ref.get());
            return {
                label: ref.label,
                suggestedName: ref.suggestedName,
                mime: info.mime,
                bytes: info.bytes,
                dataUrl: ref.get()
            };
        })
    };
    downloadObject(packagePayload, "wxm-media-package.json");
    toast("Paquete media descargado");
}

function downloadObject(payload, filename) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}

function toast(message) {
    dom.toast.textContent = message;
    dom.toast.classList.add("active");
    setTimeout(() => dom.toast.classList.remove("active"), 2200);
}

bindStaticForms();
bindActions();
setupInterfaceSemantics();
applyPreviewState();
applyAdvancedVisibility();
showPanel(activePanel);
showAnalyticsTab("dashboard");
showSystemTab("operations");
loadInitialCmc();

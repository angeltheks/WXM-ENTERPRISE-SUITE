/**
 * WXM ONE RADIO - Configuration
 * Centraliza todos los parámetros del reproductor.
 */

const CONFIG = {
    BRAND: {
        NAME: "WXM ONE RADIO",
        DOMAIN: "wxmoneradio.com",
        SLOGAN: "La radio que conecta al mundo",
        SUBTITLE: "Music & Culture",
        LOGO: "assets/img/brand/wxm-emblem-square.png",
    },
    STREAM: {
        URL: "https://jm8n.net:8024/stream",
        FALLBACK_URLS: [],
        INFO_API: "https://jm8n.net/cp/get_info.php?p=8024",
        RECONNECT_INTERVAL: 5000,
        MAX_RETRIES: 5
    },
    CMC: {
        LOCAL_URL: "assets/data/wxm-cmc.json",
        REMOTE_ENDPOINT_STORAGE_KEY: "wxm_cmc_endpoint",
        STATUS: {
            loaded: false,
            source: "built-in",
            revision: "built-in",
            endpoint: "built-in",
            error: null
        }
    },
    FEATURES: {},
    EMERGENCY: {
        enabled: false,
        severity: "info",
        title: "",
        message: "",
        streamUrl: ""
    },
    VISUAL: {
        themeDefault: "dark",
        heroImage: "assets/img/brand/hero-world-wide.png",
        accentColor: "#e91e63"
    },
    AUDIO_EXPERIENCE: {
        enabled: true,
        recommendedProfile: "standard",
        lowDataMode: false,
        networkWarning: true
    },
    ANALYTICS: {
        enabled: true,
        endpoint: "",
        dashboardEndpoint: "",
        sourceClient: "wxm_web_app",
        appVersion: "web-dev",
        stationId: "main",
        flushIntervalMs: 30000,
        maxLocalEvents: 800,
        retentionDays: 90
    },
    CONTENT: {
        schedule: [],
        highlights: [],
        banners: [],
        presenters: [],
        articles: [],
        podcasts: [],
        stations: [],
        polls: [],
        sponsors: []
    },
    SERVICES: {
        // Web local/hosting: relativo. App Android/iOS: endpoint HTTPS remoto.
        SPOTIFY_PROXY: "spotify-proxy.php",
        SPOTIFY_PROXY_APP: "https://wxmoneradio.com/spotify-proxy.php"
    },
    UI: {
        POLLING_INTERVAL: 10000,
        DEFAULT_VOLUME: 0.7,
        THEMES: ['dark', 'light']
    },
    PLAYLIST: {
        ENABLE: true,
        MAX_TRACKS_PER_DAY: 100,
        DEFAULT_VIEW: "today", // 'today', 'week', 'all'
        ENABLE_COVERS: true,
        HIGHLIGHT_CURRENT: true,
        STORAGE_MODE: "local", // 'local' o 'api'
        TIME_FORMAT: "24h",
        COLLAPSE_BY_DEFAULT: true
    }
};

const DEFAULT_FEATURES = Object.freeze({
    banners: true,
    miniPlayer: true,
    languageSelector: true,
    editorialHighlights: true,
    programs: true,
    presenters: true,
    requests: true,
    history: true,
    favorites: true,
    sleepTimer: true,
    fallbackStreams: true,
    audioProfiles: false,
    secondaryStations: false,
    podcasts: false,
    mixes: false,
    news: false,
    videos: false,
    songQuiz: false,
    replays: false,
    polls: true,
    sponsors: true,
    emergencyMode: true,
    visualConfig: true,
    audioExperience: true,
    analyticsDashboard: true
});

const MAX_TEXT_LENGTH = 180;
const SAFE_ICON_PATTERN = /^fa-[a-z0-9-]+$/i;
const SAFE_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function isHttpsUrl(value) {
    try {
        return new URL(String(value)).protocol === "https:";
    } catch {
        return false;
    }
}

function isSafeAssetOrHttpsUrl(value) {
    const text = String(value || "");
    return isHttpsUrl(text) || text.startsWith("assets/img/");
}

function safeUrl(value) {
    const text = String(value || "");
    return isHttpsUrl(text) ? text : "";
}

function safeImage(value, fallback = "") {
    const text = String(value || "");
    return isSafeAssetOrHttpsUrl(text) ? text : fallback;
}

function sanitizeText(value, fallback = "", maxLength = MAX_TEXT_LENGTH) {
    const text = String(value ?? fallback)
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .trim();
    return (text || fallback).slice(0, maxLength);
}

function boundedInt(value, fallback, min, max) {
    const number = Number.parseInt(value, 10);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
}

function sanitizeFeatures(features) {
    return Object.keys(DEFAULT_FEATURES).reduce((safe, key) => {
        safe[key] = typeof features?.[key] === "boolean" ? features[key] : DEFAULT_FEATURES[key];
        return safe;
    }, {});
}

function sanitizeSchedule(items) {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 24)
        .map(item => ({
            time: SAFE_TIME_PATTERN.test(String(item?.time || "")) ? item.time : null,
            title: sanitizeText(item?.title, "", 80),
            host: sanitizeText(item?.host, "WXM ONE RADIO", 80),
            tag: sanitizeText(item?.tag, "Radio en vivo", 120),
            genre: sanitizeText(item?.genre, "", 60),
            image: safeImage(item?.image),
            description: sanitizeText(item?.description, "", 220),
            socialUrl: safeUrl(item?.socialUrl),
            playlistUrl: safeUrl(item?.playlistUrl)
        }))
        .filter(item => item.time && item.title);
}

function sanitizeHighlights(items) {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 24)
        .map(item => ({
            title: sanitizeText(item?.title, "", 90),
            meta: sanitizeText(item?.meta, "", 40),
            icon: SAFE_ICON_PATTERN.test(String(item?.icon || "")) ? item.icon : "fa-bolt",
            body: sanitizeText(item?.body, "", 180),
            image: safeImage(item?.image),
            ctaLabel: sanitizeText(item?.ctaLabel, "", 32),
            ctaUrl: safeUrl(item?.ctaUrl)
        }))
        .filter(item => item.title && item.body);
}

function sanitizeBanners(items) {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 12)
        .map(item => ({
            title: sanitizeText(item?.title, "", 90),
            meta: sanitizeText(item?.meta, "", 50),
            body: sanitizeText(item?.body, "", 180),
            image: safeImage(item?.image),
            ctaLabel: sanitizeText(item?.ctaLabel, "", 32),
            ctaUrl: safeUrl(item?.ctaUrl),
            placement: sanitizeText(item?.placement, "home", 20)
        }))
        .filter(item => item.title && item.body);
}

function sanitizePresenters(items) {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 24)
        .map(item => ({
            name: sanitizeText(item?.name, "", 70),
            role: sanitizeText(item?.role, "", 70),
            program: sanitizeText(item?.program, "", 80),
            bio: sanitizeText(item?.bio, "", 220),
            image: safeImage(item?.image),
            instagram: safeUrl(item?.instagram),
            website: safeUrl(item?.website)
        }))
        .filter(item => item.name);
}

function sanitizeArticles(items) {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 30)
        .map(item => ({
            title: sanitizeText(item?.title, "", 100),
            category: sanitizeText(item?.category, "WXM", 40),
            excerpt: sanitizeText(item?.excerpt, "", 220),
            image: safeImage(item?.image),
            url: safeUrl(item?.url),
            publishedAt: sanitizeText(item?.publishedAt, "", 24)
        }))
        .filter(item => item.title && item.excerpt);
}

function sanitizePodcasts(items) {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 30)
        .map(item => ({
            title: sanitizeText(item?.title, "", 100),
            show: sanitizeText(item?.show, "", 70),
            episodes: boundedInt(item?.episodes, 0, 0, 10000),
            image: safeImage(item?.image),
            url: safeUrl(item?.url),
            description: sanitizeText(item?.description, "", 200)
        }))
        .filter(item => item.title);
}

function sanitizeStations(items) {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 12)
        .map(item => ({
            name: sanitizeText(item?.name, "", 70),
            description: sanitizeText(item?.description, "", 160),
            streamUrl: safeUrl(item?.streamUrl),
            image: safeImage(item?.image),
            enabled: item?.enabled !== false
        }))
        .filter(item => item.name);
}

function sanitizePolls(items) {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 8)
        .map(item => ({
            question: sanitizeText(item?.question, "", 120),
            meta: sanitizeText(item?.meta, "", 40),
            image: safeImage(item?.image),
            options: Array.isArray(item?.options)
                ? item.options.slice(0, 6).map(option => sanitizeText(option, "", 40)).filter(Boolean)
                : []
        }))
        .filter(item => item.question && item.options.length >= 2);
}

function sanitizeSponsors(items) {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 12)
        .map(item => ({
            title: sanitizeText(item?.title, "", 90),
            brand: sanitizeText(item?.brand, "", 70),
            body: sanitizeText(item?.body, "", 180),
            image: safeImage(item?.image),
            url: safeUrl(item?.url),
            startsAt: sanitizeText(item?.startsAt, "", 24),
            endsAt: sanitizeText(item?.endsAt, "", 24)
        }))
        .filter(item => item.title && item.body);
}

function railItems(payload, railKey) {
    const items = payload?.rails?.[railKey]?.items;
    return Array.isArray(items) ? items : [];
}

function optionList(value) {
    if (Array.isArray(value)) {
        return value.map(item => sanitizeText(item, "", 40)).filter(Boolean).slice(0, 6);
    }
    return String(value || "")
        .split(/[·,|]/)
        .map(item => sanitizeText(item, "", 40))
        .filter(Boolean)
        .slice(0, 6);
}

function deriveContentFromRails(payload) {
    if (!payload?.rails || typeof payload.rails !== "object") {
        return {};
    }

    return {
        banners: railItems(payload, "banners").map(item => ({
            title: item?.title,
            meta: item?.meta || item?.badge,
            body: item?.body || item?.subtitle,
            image: item?.image,
            ctaLabel: item?.ctaLabel || "",
            ctaUrl: item?.url || item?.ctaUrl,
            placement: item?.placement || "home"
        })),
        highlights: railItems(payload, "banners").map(item => ({
            title: item?.title,
            meta: item?.meta || item?.badge || "WXM",
            icon: item?.icon || "fa-bolt",
            body: item?.body || item?.subtitle,
            image: item?.image,
            ctaLabel: item?.ctaLabel || "",
            ctaUrl: item?.url || item?.ctaUrl
        })),
        presenters: railItems(payload, "presenters").map(item => ({
            name: item?.title,
            role: item?.badge || item?.subtitle,
            program: item?.meta || "",
            bio: item?.body || item?.subtitle,
            image: item?.image,
            instagram: "",
            website: item?.url
        })),
        articles: railItems(payload, "news").map(item => ({
            title: item?.title,
            category: item?.badge || "WXM",
            excerpt: item?.body || item?.subtitle,
            image: item?.image,
            url: item?.url,
            publishedAt: item?.meta || ""
        })),
        podcasts: [
            ...railItems(payload, "podcasts"),
            ...railItems(payload, "replays")
        ].map(item => ({
            title: item?.title,
            show: item?.badge || item?.subtitle || "WXM",
            episodes: Number.parseInt(String(item?.episodes || item?.meta || "0").replace(/\D+/g, ""), 10) || 0,
            image: item?.image,
            url: item?.url,
            description: item?.body || item?.subtitle
        })),
        stations: railItems(payload, "secondaryStations").map(item => ({
            name: item?.title,
            description: item?.body || item?.subtitle,
            streamUrl: item?.streamUrl || item?.url,
            image: item?.image,
            enabled: item?.enabled !== false
        })),
        polls: railItems(payload, "polls").map(item => ({
            question: item?.title,
            meta: item?.badge || item?.meta || "",
            image: item?.image,
            options: optionList(item?.options || item?.subtitle || item?.body)
        })),
        sponsors: railItems(payload, "sponsors").map(item => ({
            title: item?.title,
            brand: item?.brand || item?.subtitle || item?.badge,
            body: item?.body || item?.subtitle,
            image: item?.image,
            url: item?.url,
            startsAt: item?.startsAt || "",
            endsAt: item?.endsAt || ""
        }))
    };
}

function contentSection(content, railContent, key) {
    if (Array.isArray(content?.[key]) && content[key].length) return content[key];
    if (Array.isArray(railContent?.[key]) && railContent[key].length) return railContent[key];
    return Array.isArray(content?.[key]) ? content[key] : [];
}

function getRemoteCmcEndpoint() {
    try {
        const endpoint = localStorage.getItem(CONFIG.CMC.REMOTE_ENDPOINT_STORAGE_KEY);
        return isHttpsUrl(endpoint) ? endpoint : null;
    } catch {
        return null;
    }
}

async function fetchJson(endpoint) {
    const response = await fetch(endpoint, {
        cache: "no-store",
        credentials: "omit"
    });
    if (!response.ok) {
        throw new Error(`CMC HTTP ${response.status}`);
    }
    return response.json();
}

function applyCmcPayload(payload, endpoint) {
    if (!payload || typeof payload !== "object") {
        throw new Error("CMC invalido");
    }

    const station = payload.station || {};
    const stream = payload.stream || {};
    const railContent = deriveContentFromRails(payload);
    const content = payload.content || {};
    const emergency = payload.emergency || {};
    const visual = payload.visual || {};
    const audioExperience = payload.audioExperience || {};
    const analytics = payload.analytics || {};

    CONFIG.BRAND.NAME = sanitizeText(station.name, CONFIG.BRAND.NAME, 60);
    CONFIG.BRAND.DOMAIN = sanitizeText(station.domain, CONFIG.BRAND.DOMAIN, 80);
    CONFIG.BRAND.SLOGAN = sanitizeText(station.slogan, CONFIG.BRAND.SLOGAN, 100);
    CONFIG.BRAND.SUBTITLE = sanitizeText(station.subtitle, CONFIG.BRAND.SUBTITLE, 80);
    const logoCandidate = station.logo || visual.logoImage;
    if (isSafeAssetOrHttpsUrl(logoCandidate)) {
        CONFIG.BRAND.LOGO = logoCandidate;
    }

    if (isHttpsUrl(stream.primaryUrl)) {
        CONFIG.STREAM.URL = stream.primaryUrl;
    }
    if (Array.isArray(stream.fallbackUrls)) {
        CONFIG.STREAM.FALLBACK_URLS = stream.fallbackUrls
            .filter(isHttpsUrl)
            .filter(url => url !== CONFIG.STREAM.URL)
            .slice(0, 5);
    }
    if (isHttpsUrl(stream.infoApi)) {
        CONFIG.STREAM.INFO_API = stream.infoApi;
    }
    CONFIG.STREAM.RECONNECT_INTERVAL = boundedInt(
        stream.reconnectIntervalMs,
        CONFIG.STREAM.RECONNECT_INTERVAL,
        2000,
        30000
    );
    CONFIG.STREAM.MAX_RETRIES = boundedInt(stream.maxRetries, CONFIG.STREAM.MAX_RETRIES, 1, 10);

    CONFIG.FEATURES = sanitizeFeatures(payload.features || {});
    CONFIG.CONTENT.schedule = sanitizeSchedule(contentSection(content, railContent, "schedule"));
    CONFIG.CONTENT.highlights = sanitizeHighlights(contentSection(content, railContent, "highlights"));
    CONFIG.CONTENT.banners = sanitizeBanners(contentSection(content, railContent, "banners"));
    CONFIG.CONTENT.presenters = sanitizePresenters(contentSection(content, railContent, "presenters"));
    CONFIG.CONTENT.articles = sanitizeArticles(contentSection(content, railContent, "articles"));
    CONFIG.CONTENT.podcasts = sanitizePodcasts(contentSection(content, railContent, "podcasts"));
    CONFIG.CONTENT.stations = sanitizeStations(contentSection(content, railContent, "stations"));
    CONFIG.CONTENT.polls = sanitizePolls(contentSection(content, railContent, "polls"));
    CONFIG.CONTENT.sponsors = sanitizeSponsors(contentSection(content, railContent, "sponsors"));
    CONFIG.EMERGENCY = {
        enabled: emergency.enabled === true,
        severity: ["info", "warning", "critical"].includes(emergency.severity) ? emergency.severity : "info",
        title: sanitizeText(emergency.title, "", 80),
        message: sanitizeText(emergency.message, "", 180),
        streamUrl: safeUrl(emergency.streamUrl)
    };
    CONFIG.VISUAL = {
        themeDefault: visual.themeDefault === "light" ? "light" : "dark",
        heroImage: safeImage(visual.heroImage, CONFIG.VISUAL.heroImage),
        accentColor: /^#[0-9a-f]{6}$/i.test(String(visual.accentColor || "")) ? visual.accentColor : CONFIG.VISUAL.accentColor
    };
    CONFIG.AUDIO_EXPERIENCE = {
        enabled: audioExperience.enabled !== false && audioExperience.allowUserProfiles !== false,
        recommendedProfile: sanitizeText(audioExperience.recommendedProfile || audioExperience.defaultProfile, "standard", 40),
        lowDataMode: audioExperience.lowDataMode === true,
        networkWarning: audioExperience.networkWarning !== false
    };
    CONFIG.ANALYTICS = {
        enabled: analytics.enabled !== false,
        endpoint: safeUrl(analytics.ingestEndpoint || analytics.endpoint),
        dashboardEndpoint: safeUrl(analytics.dashboardEndpoint),
        sourceClient: sanitizeText(analytics.sourceClient, CONFIG.ANALYTICS.sourceClient, 40),
        appVersion: sanitizeText(analytics.appVersion, CONFIG.ANALYTICS.appVersion, 30),
        stationId: sanitizeText(analytics.stationId, CONFIG.ANALYTICS.stationId, 40),
        flushIntervalMs: boundedInt(analytics.flushIntervalMs, CONFIG.ANALYTICS.flushIntervalMs, 10000, 300000),
        maxLocalEvents: boundedInt(analytics.maxLocalEvents, CONFIG.ANALYTICS.maxLocalEvents, 120, 2000),
        retentionDays: boundedInt(analytics.retentionDays, CONFIG.ANALYTICS.retentionDays, 7, 730)
    };
    CONFIG.CMC.STATUS = {
        loaded: true,
        source: sanitizeText(payload.source, endpoint.startsWith("http") ? "remote" : "local", 30),
        revision: sanitizeText(payload.revision, "unknown", 80),
        endpoint,
        error: null
    };
}

export async function loadRuntimeConfig() {
    CONFIG.FEATURES = sanitizeFeatures(CONFIG.FEATURES);
    const remoteEndpoint = getRemoteCmcEndpoint();
    const endpoints = remoteEndpoint ? [remoteEndpoint, CONFIG.CMC.LOCAL_URL] : [CONFIG.CMC.LOCAL_URL];

    for (const endpoint of endpoints) {
        try {
            const payload = await fetchJson(endpoint);
            applyCmcPayload(payload, endpoint);
            return CONFIG;
        } catch (error) {
            CONFIG.CMC.STATUS = {
                loaded: false,
                source: "fallback",
                revision: "built-in",
                endpoint,
                error: sanitizeText(error?.message, "CMC no disponible", 120)
            };
        }
    }

    return CONFIG;
}

const runtimeProtocol = window.location.protocol;
const runtimeHost = window.location.hostname;
if (
    runtimeProtocol === 'capacitor:' ||
    runtimeProtocol === 'ionic:' ||
    runtimeHost === 'appassets.androidplatform.net'
) {
    CONFIG.SERVICES.SPOTIFY_PROXY = CONFIG.SERVICES.SPOTIFY_PROXY_APP;
}

export default CONFIG;

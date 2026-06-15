#!/usr/bin/env node
"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const PORT = Number.parseInt(process.env.PORT || "8787", 10);
const DATA_DIR = path.resolve(process.env.WXM_CMS_DATA_DIR || path.join(__dirname, "data"));
const PUBLIC_DIR = path.resolve(path.join(__dirname, "public"));
const UPLOAD_DIR = path.join(PUBLIC_DIR, "uploads");
const CURRENT_FILE = path.join(DATA_DIR, "current", "wxm-cms.json");
const REVISION_DIR = path.join(DATA_DIR, "revisions");
const ANALYTICS_DIR = path.join(DATA_DIR, "analytics");
const MAX_JSON_BYTES = 220 * 1024;
const MAX_ASSET_JSON_BYTES = 2 * 1024 * 1024;
const MAX_ASSET_BYTES = 900 * 1024;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const ALLOWED_ORIGINS = (process.env.WXM_CMS_ALLOWED_ORIGINS || "*")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
const PASSWORD_HASH = process.env.WXM_CMS_ADMIN_PASSWORD_SHA256 || "";
const PASSWORD_PLAIN = process.env.WXM_CMS_ADMIN_PASSWORD || "";
const SESSION_SECRET = process.env.WXM_CMS_SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const SECURE_COOKIE = process.env.WXM_CMS_SECURE_COOKIE === "1";
const PUBLIC_BASE_URL = process.env.WXM_CMS_PUBLIC_BASE_URL || "";
const ANALYTICS_LOOKBACK_DAYS = 30;
const LIVE_CONNECTION_WINDOW_MS = 5 * 60 * 1000;
const COUNTRY_CODES = {
    "Argentina": "AR",
    "Brazil": "BR",
    "Brasil": "BR",
    "Canada": "CA",
    "Chile": "CL",
    "Colombia": "CO",
    "Dominican Republic": "DO",
    "Republica Dominicana": "DO",
    "República Dominicana": "DO",
    "France": "FR",
    "Francia": "FR",
    "Germany": "DE",
    "Alemania": "DE",
    "Hungary": "HU",
    "Mexico": "MX",
    "México": "MX",
    "Spain": "ES",
    "España": "ES",
    "United Arab Emirates": "AE",
    "United States": "US",
    "Estados Unidos": "US"
};

const analyticsRate = new Map();

fs.mkdirSync(path.dirname(CURRENT_FILE), { recursive: true });
fs.mkdirSync(REVISION_DIR, { recursive: true });
fs.mkdirSync(ANALYTICS_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function securityHeaders(extra = {}) {
    return {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "no-referrer",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        ...extra
    };
}

function corsHeaders(req) {
    const origin = req.headers.origin || "";
    const allowAll = ALLOWED_ORIGINS.includes("*");
    const allowed = allowAll || ALLOWED_ORIGINS.includes(origin);
    return allowed
        ? {
            "Access-Control-Allow-Origin": allowAll ? (origin || "*") : origin,
            "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Credentials": "true",
            "Vary": "Origin"
        }
        : {};
}

function sendJson(req, res, status, payload, headers = {}) {
    const body = JSON.stringify(payload, null, 2);
    res.writeHead(status, securityHeaders({
        ...corsHeaders(req),
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(body),
        ...headers
    }));
    res.end(req.method === "HEAD" ? undefined : body);
}

function sendText(res, status, body, headers = {}) {
    res.writeHead(status, securityHeaders({
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Length": Buffer.byteLength(body),
        ...headers
    }));
    res.end(body);
}

function readBody(req, maxBytes = MAX_JSON_BYTES) {
    return new Promise((resolve, reject) => {
        let size = 0;
        const chunks = [];
        req.on("data", chunk => {
            size += chunk.length;
            if (size > maxBytes) {
                reject(Object.assign(new Error("payload_too_large"), { status: 413 }));
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        req.on("error", reject);
    });
}

async function readJson(req, maxBytes = MAX_JSON_BYTES) {
    const raw = await readBody(req, maxBytes);
    if (!raw.trim()) return {};
    return JSON.parse(raw);
}

function parseCookies(req) {
    return Object.fromEntries(String(req.headers.cookie || "")
        .split(";")
        .map(part => part.trim())
        .filter(Boolean)
        .map(part => {
            const index = part.indexOf("=");
            return index === -1 ? [part, ""] : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
        }));
}

function hmac(value) {
    return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
}

function createSessionCookie() {
    const expires = Date.now() + SESSION_TTL_MS;
    const nonce = crypto.randomBytes(18).toString("hex");
    const value = `${expires}.${nonce}`;
    const signed = `${value}.${hmac(value)}`;
    const secure = SECURE_COOKIE ? "; Secure" : "";
    return `wxm_session=${encodeURIComponent(signed)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure}`;
}

function hasValidSession(req) {
    const token = parseCookies(req).wxm_session;
    if (!token) return false;
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const value = `${parts[0]}.${parts[1]}`;
    const expected = hmac(value);
    const provided = parts[2];
    if (provided.length !== expected.length) return false;
    const ok = crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
    return ok && Number(parts[0]) > Date.now();
}

function requireAuth(req, res) {
    if (hasValidSession(req)) return true;
    sendJson(req, res, 401, { ok: false, error: "auth_required" });
    return false;
}

function hashPassword(password) {
    return crypto.createHash("sha256").update(String(password)).digest("hex");
}

function passwordMatches(password) {
    if (!PASSWORD_HASH && !PASSWORD_PLAIN) return false;
    const expected = PASSWORD_HASH || hashPassword(PASSWORD_PLAIN);
    const provided = hashPassword(password);
    return expected.length === provided.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

function isHttpsUrl(value) {
    try {
        return new URL(String(value)).protocol === "https:";
    } catch {
        return false;
    }
}

function isSafeAssetOrHttps(value) {
    const text = String(value || "");
    return isHttpsUrl(text) || text.startsWith("assets/img/");
}

function decodeDataImage(value) {
    const match = String(value || "").match(/^data:(image\/(?:png|jpe?g|webp));base64,([a-z0-9+/=]+)$/i);
    if (!match) return null;
    const mime = match[1].toLowerCase().replace("image/jpg", "image/jpeg");
    const buffer = Buffer.from(match[2], "base64");
    if (!buffer.length || buffer.length > MAX_ASSET_BYTES) return null;
    if (!hasValidImageSignature(buffer, mime)) return null;
    const extension = mime === "image/png" ? "png" : mime === "image/jpeg" ? "jpg" : "webp";
    return { mime, buffer, extension };
}

function hasValidImageSignature(buffer, mime) {
    if (mime === "image/png") return buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    if (mime === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (mime === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF"
        && buffer.subarray(8, 12).toString("ascii") === "WEBP";
    return false;
}

function safeAssetName(value) {
    const base = text(value, 80)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
    return base || "wxm-image";
}

function publicAssetUrl(req, publicPath) {
    const configured = PUBLIC_BASE_URL.trim();
    if (configured) return new URL(publicPath, configured.endsWith("/") ? configured : `${configured}/`).toString();
    const proto = String(req.headers["x-forwarded-proto"] || "http").split(",")[0].trim();
    return `${proto}://${req.headers.host || "127.0.0.1"}${publicPath}`;
}

function text(value, max = 180) {
    return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
}

function validateContract(contract) {
    const errors = [];
    const warnings = [];
    const rails = contract?.rails && typeof contract.rails === "object" ? contract.rails : {};

    if (!contract || typeof contract !== "object") errors.push("Payload invalido.");
    if (!text(contract?.revision, 80)) errors.push("Falta revision.");
    if (!text(contract?.station?.name, 80)) errors.push("Falta station.name.");
    if (!isHttpsUrl(contract?.stream?.primaryUrl)) errors.push("stream.primaryUrl debe ser HTTPS.");
    if (contract?.stream?.infoApi && !isHttpsUrl(contract.stream.infoApi)) errors.push("stream.infoApi debe ser HTTPS.");
    if (contract?.stream?.fallbackUrls?.some(url => !isHttpsUrl(url))) errors.push("fallbackUrls debe contener solo HTTPS.");
    if (!isSafeAssetOrHttps(contract?.visual?.heroImage)) errors.push("visual.heroImage inseguro.");
    if (!isSafeAssetOrHttps(contract?.visual?.logoImage)) errors.push("visual.logoImage inseguro.");
    if (contract?.analytics?.ingestEndpoint && !isHttpsUrl(contract.analytics.ingestEndpoint)) errors.push("analytics.ingestEndpoint debe ser HTTPS.");
    if (contract?.analytics?.dashboardEndpoint && !isHttpsUrl(contract.analytics.dashboardEndpoint)) errors.push("analytics.dashboardEndpoint debe ser HTTPS.");

    ["homeRails", "exploreRails"].forEach(key => {
        if (!Array.isArray(contract?.[key])) {
            errors.push(`${key} debe ser una lista.`);
            return;
        }
        contract[key].forEach(railId => {
            if (!rails[railId]) errors.push(`${key} referencia rail inexistente: ${railId}.`);
        });
    });

    Object.entries(rails).forEach(([railId, rail]) => {
        if (!Array.isArray(rail?.items)) {
            errors.push(`Rail ${railId} no tiene items.`);
            return;
        }
        if (rail.items.length > 40) errors.push(`Rail ${railId} supera 40 items.`);
        rail.items.forEach((item, index) => {
            if (!text(item?.title, 120)) errors.push(`${railId}[${index + 1}] sin titulo.`);
            if (item?.image && !isSafeAssetOrHttps(item.image)) errors.push(`${railId}[${index + 1}] imagen insegura.`);
            if (item?.url) {
                try {
                    const protocol = new URL(item.url).protocol;
                    if (!["https:", "mailto:", "tel:"].includes(protocol)) errors.push(`${railId}[${index + 1}] url insegura.`);
                } catch {
                    errors.push(`${railId}[${index + 1}] url invalida.`);
                }
            }
        });
    });

    if (!contract?.stream?.fallbackUrls?.length) warnings.push("Sin fallback stream.");
    if (contract?.analytics?.enabled && !contract?.analytics?.ingestEndpoint) warnings.push("Analytics habilitado sin endpoint remoto.");
    return { ok: errors.length === 0, errors, warnings };
}

function sha256(value) {
    return crypto.createHash("sha256").update(value).digest("hex");
}

function writeAtomic(file, content) {
    const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(temp, content, { mode: 0o640 });
    fs.renameSync(temp, file);
}

function listRevisions() {
    if (!fs.existsSync(REVISION_DIR)) return [];
    return fs.readdirSync(REVISION_DIR)
        .filter(name => /^wxm-cms-\d{8}T\d{6}Z-[a-f0-9]{12}\.json$/.test(name))
        .sort()
        .reverse()
        .slice(0, 80);
}

function todayAnalyticsFile() {
    return path.join(ANALYTICS_DIR, `${new Date().toISOString().slice(0, 10)}.ndjson`);
}

function sanitizeAnalyticsEvent(event, req) {
    const userAgent = text(req.headers["user-agent"], 180);
    const sourceSession = text(event?.sessionId || event?.playbackSessionId || event?.clientId, 160);
    const anonSeed = sourceSession || `${req.socket.remoteAddress || "unknown"}:${userAgent}`;
    return {
        ts: new Date().toISOString(),
        name: text(event?.name || event?.event, 80) || "unknown",
        sourceClient: text(event?.sourceClient, 40) || "unknown",
        platform: text(event?.platform, 40),
        appVersion: text(event?.appVersion, 30),
        stationId: text(event?.stationId, 40) || "main",
        player: text(event?.player, 40),
        streamRole: text(event?.streamRole, 20),
        country: text(event?.country, 80),
        city: text(event?.city, 80),
        referrer: text(event?.referrer, 120),
        durationSeconds: Math.max(0, Math.min(Number(event?.durationSeconds || event?.duration || 0) || 0, 24 * 60 * 60)),
        networkScore: Math.max(0, Math.min(Number(event?.networkScore || 0) || 0, 5)),
        errorCode: text(event?.errorCode, 80),
        anonId: sha256(anonSeed).slice(0, 18),
        userAgent
    };
}

function checkAnalyticsRate(req) {
    const key = req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const bucket = analyticsRate.get(key) || { resetAt: now + 60_000, count: 0 };
    if (bucket.resetAt < now) {
        bucket.resetAt = now + 60_000;
        bucket.count = 0;
    }
    bucket.count += 1;
    analyticsRate.set(key, bucket);
    return bucket.count <= 120;
}

function increment(map, key, amount = 1) {
    const safeKey = text(key, 100) || "Unknown";
    map[safeKey] = (map[safeKey] || 0) + amount;
}

function addUnique(map, key, anonId) {
    const safeKey = text(key, 100) || "Unknown";
    if (!map[safeKey]) map[safeKey] = new Set();
    map[safeKey].add(anonId || "anonymous");
}

function countryCode(country) {
    return COUNTRY_CODES[text(country, 80)] || "";
}

function dateLabel(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(5, 10);
}

function fiveMinuteBucket(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const bucket = new Date(Math.floor(date.getTime() / 300000) * 300000);
    return bucket.toISOString();
}

function analyticsRows(counts, uniques, hours, liveCounts, keyName) {
    return Object.entries(counts)
        .map(([key, access]) => ({
            [keyName]: key,
            country: keyName === "country" ? key : undefined,
            code: keyName === "country" ? countryCode(key) : undefined,
            name: keyName === "name" || keyName === "source" ? key : undefined,
            source: keyName === "source" ? key : undefined,
            access,
            uniqueListeners: uniques[key]?.size || 0,
            distinctIps: uniques[key]?.size || 0,
            listeningHours: Number((hours[key] || 0).toFixed(2)),
            live: liveCounts[key] || 0
        }))
        .sort((a, b) => b.access - a.access)
        .slice(0, 50);
}

function emptySeries(days) {
    const today = new Date();
    return Array.from({ length: days }).map((_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (days - index - 1));
        return { label: date.toISOString().slice(5, 10), value: 0 };
    });
}

function summarizeAnalytics() {
    const files = fs.existsSync(ANALYTICS_DIR)
        ? fs.readdirSync(ANALYTICS_DIR).filter(name => name.endsWith(".ndjson")).sort()
        : [];
    const selectedFiles = files.slice(-ANALYTICS_LOOKBACK_DAYS);
    const events = [];
    const byEvent = {};
    const byCountry = {};
    const bySourceClient = {};
    const byPlayer = {};
    const byReferrer = {};
    const countryUniques = {};
    const playerUniques = {};
    const referrerUniques = {};
    const sourceUniques = {};
    const countryHours = {};
    const playerHours = {};
    const referrerHours = {};
    const countryLive = {};
    const dailyAccess = {};
    const dailyListeningHours = {};
    const dailyUnique = {};
    const bucketUniques = {};
    const now = Date.now();

    selectedFiles.forEach(file => {
        const lines = fs.readFileSync(path.join(ANALYTICS_DIR, file), "utf8").split("\n").filter(Boolean);
        lines.forEach(line => {
            try {
                const event = JSON.parse(line);
                const ts = new Date(event.ts);
                if (Number.isNaN(ts.getTime())) return;
                events.push(event);
                const anonId = event.anonId || sha256(`${event.sourceClient || "unknown"}:${event.userAgent || ""}`).slice(0, 18);
                const country = text(event.country, 80) || "Unknown";
                const player = text(event.player, 40) || text(event.sourceClient, 40) || "Unknown";
                const referrer = text(event.referrer, 120) || text(event.sourceClient, 40) || "direct";
                const sourceClient = text(event.sourceClient, 40) || "unknown";
                const day = dateLabel(event.ts);
                const bucket = fiveMinuteBucket(event.ts);
                const durationHours = Math.max(0, Number(event.durationSeconds || 0) || 0) / 3600;

                increment(byEvent, event.name || "unknown");
                increment(byCountry, country);
                increment(bySourceClient, sourceClient);
                increment(byPlayer, player);
                increment(byReferrer, referrer);
                addUnique(countryUniques, country, anonId);
                addUnique(playerUniques, player, anonId);
                addUnique(referrerUniques, referrer, anonId);
                addUnique(sourceUniques, sourceClient, anonId);
                countryHours[country] = (countryHours[country] || 0) + durationHours;
                playerHours[player] = (playerHours[player] || 0) + durationHours;
                referrerHours[referrer] = (referrerHours[referrer] || 0) + durationHours;
                increment(dailyAccess, day);
                dailyListeningHours[day] = (dailyListeningHours[day] || 0) + durationHours;
                if (!dailyUnique[day]) dailyUnique[day] = new Set();
                dailyUnique[day].add(anonId);
                if (bucket) {
                    if (!bucketUniques[bucket]) bucketUniques[bucket] = new Set();
                    bucketUniques[bucket].add(anonId);
                }
                if (now - ts.getTime() <= LIVE_CONNECTION_WINDOW_MS) increment(countryLive, country);
            } catch {
                // Ignore corrupted analytics line; raw file remains available for audit.
            }
        });
    });

    events.sort((a, b) => new Date(a.ts) - new Date(b.ts));
    const uniqueListeners = new Set(events.map(event => event.anonId).filter(Boolean)).size;
    const totalListeningHours = Number(events.reduce((sum, event) => sum + Math.max(0, Number(event.durationSeconds || 0) || 0), 0) / 3600).toFixed(2);
    const listeningHours = Number(totalListeningHours);
    const liveEvents = events
        .filter(event => now - new Date(event.ts).getTime() <= LIVE_CONNECTION_WINDOW_MS)
        .slice(-12)
        .reverse();
    const liveConnections = liveEvents.map(event => ({
        country: text(event.country, 80) || "Unknown",
        city: text(event.city, 80),
        player: text(event.player, 40) || text(event.sourceClient, 40),
        sourceClient: text(event.sourceClient, 40),
        referrer: text(event.referrer, 120),
        ageSeconds: Math.max(0, Math.round((now - new Date(event.ts).getTime()) / 1000))
    }));
    const peakAudience = Object.values(bucketUniques).reduce((max, set) => Math.max(max, set.size), 0);
    const peakAtBucket = Object.entries(bucketUniques).sort((a, b) => b[1].size - a[1].size)[0]?.[0] || "";
    const trendLabels = emptySeries(7).map(item => item.label);
    const listeningHoursTrend = trendLabels.map(label => ({ label, value: Number((dailyListeningHours[label] || 0).toFixed(2)) }));
    const audienceRealtime = Object.entries(bucketUniques)
        .slice(-24)
        .map(([label, set]) => ({ label: new Date(label).toISOString().slice(11, 16), value: set.size }));
    const quickAccess = emptySeries(30).map(item => ({ label: item.label, value: dailyAccess[item.label] || 0 }));
    const quickHours = emptySeries(30).map(item => ({ label: item.label, value: Number((dailyListeningHours[item.label] || 0).toFixed(2)) }));
    const quickUnique = emptySeries(30).map(item => ({ label: item.label, value: dailyUnique[item.label]?.size || 0 }));
    const periodStart = events[0]?.ts || selectedFiles[0]?.replace(".ndjson", "") || "";
    const periodEnd = events.at(-1)?.ts || selectedFiles.at(-1)?.replace(".ndjson", "") || "";
    const sourceAppUsers = sourceUniques.wxm_android_app?.size || bySourceClient.wxm_android_app || 0;
    const countries = analyticsRows(byCountry, countryUniques, countryHours, countryLive, "country");
    const players = analyticsRows(byPlayer, playerUniques, playerHours, {}, "name");
    const referrers = analyticsRows(byReferrer, referrerUniques, referrerHours, {}, "source");
    const analytics = {
        enabled: true,
        mode: "remote",
        periodLabel: `Ultimos ${ANALYTICS_LOOKBACK_DAYS} dias`,
        periodRange: {
            start: periodStart ? String(periodStart).slice(0, 10) : "",
            end: periodEnd ? String(periodEnd).slice(0, 10) : ""
        },
        kpis: {
            liveListeners: new Set(liveEvents.map(event => event.anonId).filter(Boolean)).size || liveConnections.length,
            peakAudience,
            peakAt: peakAtBucket ? new Date(peakAtBucket).toISOString().slice(11, 16) : "--:--",
            avgHoursDay: selectedFiles.length ? Number((listeningHours / selectedFiles.length).toFixed(2)) : 0,
            avgListeningTimeMin: uniqueListeners ? Number(((listeningHours * 60) / uniqueListeners).toFixed(1)) : 0,
            totalListeningHours: listeningHours,
            appUsers: sourceAppUsers
        },
        listeningHoursTrend,
        audienceRealtime: audienceRealtime.length ? audienceRealtime : emptySeries(12),
        quickSeries: {
            listeningHours: quickHours,
            uniqueListeners: quickUnique,
            accessCount: quickAccess
        },
        countries,
        players,
        referrers,
        liveConnections,
        quickStats: {
            uniqueListeners: {
                yesterday: quickUnique.at(-2)?.value || 0,
                week: quickUnique.slice(-7).reduce((sum, item) => sum + item.value, 0),
                month: uniqueListeners,
                selected: uniqueListeners
            },
            listeningHours: {
                yesterday: quickHours.at(-2)?.value || 0,
                week: Number(quickHours.slice(-7).reduce((sum, item) => sum + item.value, 0).toFixed(2)),
                month: listeningHours,
                selected: listeningHours
            },
            accessCount: {
                yesterday: quickAccess.at(-2)?.value || 0,
                week: quickAccess.slice(-7).reduce((sum, item) => sum + item.value, 0),
                month: events.length,
                selected: events.length
            }
        }
    };

    return {
        totalEvents: events.length,
        byEvent,
        byCountry,
        bySourceClient,
        byPlayer,
        byReferrer,
        liveListeners: analytics.kpis.liveListeners,
        peakAudience,
        peakAt: analytics.kpis.peakAt,
        appUsers: analytics.kpis.appUsers,
        totalListeningHours: listeningHours,
        avgHoursDay: analytics.kpis.avgHoursDay,
        avgListeningTimeMin: analytics.kpis.avgListeningTimeMin,
        liveConnections,
        analytics
    };
}

function serveStatic(req, res, pathname) {
    const requested = pathname === "/admin" || pathname === "/admin/" ? "/admin/index.html" : pathname;
    const file = path.resolve(PUBLIC_DIR, `.${requested}`);
    if (!file.startsWith(PUBLIC_DIR)) return sendText(res, 403, "Forbidden");
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        if (requested === "/admin/index.html") {
            return sendText(res, 200, "WXM CMS remote starter activo. Copia el panel estatico en public/admin o usa la API documentada.", {
                "Content-Type": "text/plain; charset=utf-8"
            });
        }
        return sendText(res, 404, "Not found");
    }
    const ext = path.extname(file).toLowerCase();
    const types = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".svg": "image/svg+xml"
    };
    const body = fs.readFileSync(file);
    const cache = pathname.startsWith("/uploads/") ? { "Cache-Control": "public, max-age=31536000, immutable" } : {};
    res.writeHead(200, securityHeaders({ "Content-Type": types[ext] || "application/octet-stream", "Content-Length": body.length, ...cache }));
    res.end(req.method === "HEAD" ? undefined : body);
}

async function route(req, res) {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = url.pathname;

    if (req.method === "OPTIONS") {
        res.writeHead(204, securityHeaders(corsHeaders(req)));
        return res.end();
    }

    if ((req.method === "GET" || req.method === "HEAD") && pathname === "/health") {
        return sendJson(req, res, 200, { ok: true, service: "wxm-cms-remote", hasPublishedCms: fs.existsSync(CURRENT_FILE) });
    }

    if ((req.method === "GET" || req.method === "HEAD") && pathname === "/wxm-cms.json") {
        if (!fs.existsSync(CURRENT_FILE)) return sendJson(req, res, 404, { ok: false, error: "cms_not_published" });
        const body = fs.readFileSync(CURRENT_FILE);
        const etag = `"${sha256(body).slice(0, 16)}"`;
        if (req.headers["if-none-match"] === etag) {
            res.writeHead(304, securityHeaders({ ...corsHeaders(req), ETag: etag, "Cache-Control": "public, max-age=60, stale-while-revalidate=300" }));
            return res.end();
        }
        res.writeHead(200, securityHeaders({
            ...corsHeaders(req),
            "Content-Type": "application/json; charset=utf-8",
            "Content-Length": body.length,
            "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
            ETag: etag
        }));
        return res.end(req.method === "HEAD" ? undefined : body);
    }

    if (req.method === "POST" && pathname === "/api/auth/login") {
        if (!PASSWORD_HASH && !PASSWORD_PLAIN) return sendJson(req, res, 503, { ok: false, error: "admin_password_not_configured" });
        const body = await readJson(req);
        if (!passwordMatches(body.password)) return sendJson(req, res, 401, { ok: false, error: "invalid_credentials" });
        return sendJson(req, res, 200, { ok: true }, { "Set-Cookie": createSessionCookie() });
    }

    if (req.method === "POST" && pathname === "/api/auth/logout") {
        return sendJson(req, res, 200, { ok: true }, { "Set-Cookie": "wxm_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0" });
    }

    if (req.method === "GET" && pathname === "/api/auth/status") {
        return sendJson(req, res, 200, { ok: true, authenticated: hasValidSession(req) });
    }

    if (req.method === "GET" && pathname === "/api/cms/current") {
        if (!requireAuth(req, res)) return;
        if (!fs.existsSync(CURRENT_FILE)) return sendJson(req, res, 404, { ok: false, error: "cms_not_published" });
        return sendJson(req, res, 200, JSON.parse(fs.readFileSync(CURRENT_FILE, "utf8")));
    }

    if (req.method === "POST" && pathname === "/api/cms/publish") {
        if (!requireAuth(req, res)) return;
        const contract = await readJson(req);
        const validation = validateContract(contract);
        if (!validation.ok) return sendJson(req, res, 422, { ok: false, ...validation });
        const payload = JSON.stringify(contract, null, 2);
        const hash = sha256(payload);
        const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
        const revisionFile = `wxm-cms-${stamp}-${hash.slice(0, 12)}.json`;
        fs.writeFileSync(path.join(REVISION_DIR, revisionFile), payload, { mode: 0o640 });
        writeAtomic(CURRENT_FILE, payload);
        return sendJson(req, res, 200, { ok: true, revisionFile, sha256: hash, warnings: validation.warnings });
    }

    if (req.method === "GET" && pathname === "/api/cms/revisions") {
        if (!requireAuth(req, res)) return;
        return sendJson(req, res, 200, { ok: true, revisions: listRevisions() });
    }

    if (req.method === "POST" && pathname === "/api/cms/rollback") {
        if (!requireAuth(req, res)) return;
        const body = await readJson(req);
        const file = path.basename(String(body.file || ""));
        if (!listRevisions().includes(file)) return sendJson(req, res, 404, { ok: false, error: "revision_not_found" });
        const payload = fs.readFileSync(path.join(REVISION_DIR, file), "utf8");
        writeAtomic(CURRENT_FILE, payload);
        return sendJson(req, res, 200, { ok: true, restored: file });
    }

    if (req.method === "POST" && pathname === "/api/assets/upload") {
        if (!requireAuth(req, res)) return;
        const body = await readJson(req, MAX_ASSET_JSON_BYTES);
        const image = decodeDataImage(body.image);
        if (!image) return sendJson(req, res, 422, { ok: false, error: "invalid_or_too_large_image" });
        const hash = sha256(image.buffer);
        const month = new Date().toISOString().slice(0, 7).replace("-", "/");
        const targetDir = path.join(UPLOAD_DIR, month);
        fs.mkdirSync(targetDir, { recursive: true });
        const filename = `${safeAssetName(body.suggestedName || body.label)}-${hash.slice(0, 12)}.${image.extension}`;
        const file = path.join(targetDir, filename);
        if (!file.startsWith(UPLOAD_DIR)) return sendJson(req, res, 403, { ok: false, error: "invalid_asset_path" });
        writeAtomic(file, image.buffer);
        const publicPath = `/uploads/${month}/${filename}`;
        return sendJson(req, res, 201, {
            ok: true,
            path: publicPath,
            url: publicAssetUrl(req, publicPath),
            sha256: hash,
            bytes: image.buffer.length,
            mime: image.mime
        });
    }

    if (req.method === "GET" && pathname === "/api/assets/list") {
        if (!requireAuth(req, res)) return;
        const assets = [];
        function walk(dir, prefix = "/uploads") {
            if (!fs.existsSync(dir)) return;
            fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
                const full = path.join(dir, entry.name);
                const publicPath = `${prefix}/${entry.name}`;
                if (entry.isDirectory()) return walk(full, publicPath);
                if (!/\.(png|jpe?g|webp)$/i.test(entry.name)) return;
                const stat = fs.statSync(full);
                assets.push({
                    path: publicPath,
                    url: publicAssetUrl(req, publicPath),
                    bytes: stat.size,
                    updatedAt: stat.mtime.toISOString()
                });
            });
        }
        walk(UPLOAD_DIR);
        return sendJson(req, res, 200, { ok: true, assets: assets.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 200) });
    }

    if (req.method === "POST" && pathname === "/api/analytics/ingest") {
        if (!checkAnalyticsRate(req)) return sendJson(req, res, 429, { ok: false, error: "rate_limited" });
        const body = await readJson(req);
        const events = Array.isArray(body.events) ? body.events : [body];
        const safeEvents = events.slice(0, 50).map(event => sanitizeAnalyticsEvent(event, req));
        fs.appendFileSync(todayAnalyticsFile(), safeEvents.map(event => JSON.stringify(event)).join("\n") + "\n", { mode: 0o640 });
        return sendJson(req, res, 202, { ok: true, accepted: safeEvents.length });
    }

    if (req.method === "GET" && pathname === "/api/analytics/summary") {
        if (!requireAuth(req, res)) return;
        return sendJson(req, res, 200, { ok: true, ...summarizeAnalytics() });
    }

    if ((req.method === "GET" || req.method === "HEAD") && (pathname.startsWith("/admin") || pathname.startsWith("/uploads/"))) return serveStatic(req, res, pathname);
    return sendJson(req, res, 404, { ok: false, error: "not_found" });
}

const server = http.createServer((req, res) => {
    route(req, res).catch(error => {
        const status = error.status || 500;
        sendJson(req, res, status, { ok: false, error: status === 500 ? "internal_error" : error.message });
    });
});

server.listen(PORT, () => {
    console.log(`WXM CMS remote starter listening on http://127.0.0.1:${PORT}`);
});

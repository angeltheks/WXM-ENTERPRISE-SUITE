"use strict";

const http = require("node:http");
const https = require("node:https");

const DEFAULT_TIMEOUT_MS = 6500;
const CACHE_TTL_MS = 20_000;

function toInt(value, fallback = 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function splitCsv(value) {
    return String(value || "")
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
}

function redact(value) {
    if (!value) return "";
    const text = String(value);
    if (text.length <= 8) return "configured";
    return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

function parseJsonSafe(raw) {
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

class WxmShoutcastConnector {
    constructor(env = process.env) {
        this.baseUrl = String(env.WXM_SHOUTCAST_BASE_URL || "").replace(/\/+$/, "");
        this.sids = splitCsv(env.WXM_SHOUTCAST_SIDS || env.WXM_SHOUTCAST_SID || "1");
        this.primarySid = String(env.WXM_SHOUTCAST_PRIMARY_SID || this.sids[0] || "1");
        this.adminUser = env.WXM_SHOUTCAST_ADMIN_USER || "";
        this.adminPassword = env.WXM_SHOUTCAST_ADMIN_PASSWORD || "";
        this.timeoutMs = toInt(env.WXM_SHOUTCAST_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
        this.cacheTtlMs = toInt(env.WXM_SHOUTCAST_CACHE_TTL_MS, CACHE_TTL_MS);
        this.cache = new Map();
    }

    get configured() {
        return Boolean(this.baseUrl);
    }

    get hasAdminCredentials() {
        return Boolean(this.adminUser && this.adminPassword);
    }

    safeConfig() {
        return {
            configured: this.configured,
            baseUrl: this.baseUrl ? this.baseUrl.replace(/\/\/([^:@/]+):([^@/]+)@/, "//***:***@") : "",
            sids: this.sids,
            primarySid: this.primarySid,
            authMode: this.hasAdminCredentials ? "basic" : "public",
            adminUser: this.adminUser ? "configured" : "missing",
            adminPassword: this.adminPassword ? "configured" : "missing",
            cacheTtlMs: this.cacheTtlMs,
            timeoutMs: this.timeoutMs
        };
    }

    async summary() {
        if (!this.configured) {
            return {
                ok: false,
                configured: false,
                error: "shoutcast_not_configured",
                config: this.safeConfig()
            };
        }

        const [statistics, config] = await Promise.all([
            this.fetchStatistics(),
            this.fetchStreamConfig().catch(error => ({ ok: false, error: error.message }))
        ]);

        const streams = this.mergeStreams(statistics.streams || [], config.streams || []);
        const totals = {
            totalStreams: toInt(statistics.totalstreams ?? statistics.totalStreams, streams.length),
            activeStreams: toInt(statistics.activestreams ?? statistics.activeStreams, streams.filter(stream => stream.streamStatus === 1).length),
            currentListeners: toInt(statistics.currentlisteners ?? statistics.currentListeners),
            peakListeners: toInt(statistics.peaklisteners ?? statistics.peakListeners),
            maxListeners: toInt(statistics.maxlisteners ?? statistics.maxListeners),
            uniqueListeners: toInt(statistics.uniquelisteners ?? statistics.uniqueListeners),
            averageTimeSeconds: toInt(statistics.averagetime ?? statistics.averageTimeSeconds),
            version: String(statistics.version || "")
        };

        return {
            ok: true,
            configured: true,
            provider: "shoutcast-dnas",
            generatedAt: new Date().toISOString(),
            source: {
                baseUrl: this.baseUrl,
                authMode: this.hasAdminCredentials ? "basic" : "public",
                primarySid: this.primarySid,
                sids: this.sids
            },
            totals,
            streams
        };
    }

    mergeStreams(statsStreams, configStreams) {
        const configs = new Map(configStreams.map(stream => [String(stream.id), stream]));
        return statsStreams.map(stream => {
            const sid = String(stream.id);
            const config = configs.get(sid) || {};
            return {
                id: sid,
                role: sid === this.primarySid ? "primary" : "secondary",
                title: String(stream.servertitle || ""),
                path: String(stream.streampath || config.path || ""),
                content: String(stream.content || ""),
                bitrate: toInt(stream.bitrate),
                sampleRate: toInt(stream.samplerate),
                currentListeners: toInt(stream.currentlisteners),
                uniqueListeners: toInt(stream.uniquelisteners),
                peakListeners: toInt(stream.peaklisteners),
                maxListeners: toInt(stream.maxlisteners),
                averageTimeSeconds: toInt(stream.averagetime),
                streamHits: toInt(stream.streamhits),
                streamUptimeSeconds: toInt(stream.streamuptime),
                streamStatus: toInt(stream.streamstatus),
                backupStatus: toInt(stream.backupstatus),
                listed: toInt(stream.streamlisted) === 1,
                public: String(config.public || ""),
                allowRelay: String(config.allowrelay || "") === "1",
                publicRelay: String(config.publicrelay || "") === "1",
                source: String(stream.streamsource || ""),
                url: String(stream.serverurl || ""),
                genre: [
                    stream.servergenre,
                    stream.servergenre2,
                    stream.servergenre3,
                    stream.servergenre4,
                    stream.servergenre5
                ].filter(Boolean).join(" / "),
                songTitle: String(stream.songtitle || ""),
                authhash: config.authhash ? redact(config.authhash) : "",
                hasAuthhash: Boolean(config.authhash)
            };
        });
    }

    async fetchStatistics() {
        return this.getJson("/statistics?json=1", { authenticated: false });
    }

    async fetchStreamConfig() {
        if (!this.hasAdminCredentials) return { streams: [] };
        const sid = encodeURIComponent(this.primarySid);
        return this.getJson(`/admin.cgi?sid=${sid}&mode=viewjson&page=6`, { authenticated: true });
    }

    async getJson(pathname, options = {}) {
        const url = `${this.baseUrl}${pathname}`;
        const cacheKey = `${options.authenticated ? "auth" : "public"}:${url}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.ts < this.cacheTtlMs) return cached.value;

        const raw = await this.request(url, options);
        const parsed = parseJsonSafe(raw);
        if (!parsed) throw new Error("invalid_shoutcast_json");
        this.cache.set(cacheKey, { ts: Date.now(), value: parsed });
        return parsed;
    }

    request(url, options = {}) {
        return new Promise((resolve, reject) => {
            const target = new URL(url);
            const transport = target.protocol === "https:" ? https : http;
            const headers = {
                "Accept": "application/json",
                "User-Agent": "WXM-Enterprise-CMS/1.0"
            };
            if (options.authenticated && this.hasAdminCredentials) {
                const token = Buffer.from(`${this.adminUser}:${this.adminPassword}`).toString("base64");
                headers.Authorization = `Basic ${token}`;
            }
            const req = transport.request(target, { method: "GET", headers, timeout: this.timeoutMs }, res => {
                const chunks = [];
                res.on("data", chunk => chunks.push(chunk));
                res.on("end", () => {
                    const body = Buffer.concat(chunks).toString("utf8");
                    if (res.statusCode < 200 || res.statusCode >= 300) {
                        reject(new Error(`shoutcast_http_${res.statusCode}`));
                        return;
                    }
                    resolve(body);
                });
            });
            req.on("timeout", () => {
                req.destroy(new Error("shoutcast_timeout"));
            });
            req.on("error", reject);
            req.end();
        });
    }
}

module.exports = { WxmShoutcastConnector };

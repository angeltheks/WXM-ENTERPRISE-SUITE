/**
 * WXM ONE RADIO - Analytics Service
 * Recolecta telemetria anonima preparada para CMS remoto.
 */

import CONFIG from './config.js';

const EVENT_KEY = 'wxm_analytics_events';
const SESSION_KEY = 'wxm_analytics_session';
const MAX_EVENTS = 800;
const MAX_FIELD = 120;

function nowIso() {
    return new Date().toISOString();
}

function safeText(value, fallback = '', max = MAX_FIELD) {
    return String(value ?? fallback)
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .trim()
        .slice(0, max);
}

function randomId(prefix) {
    const cryptoApi = window.crypto || window.msCrypto;
    if (cryptoApi?.getRandomValues) {
        const bytes = new Uint8Array(12);
        cryptoApi.getRandomValues(bytes);
        return `${prefix}_${Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('')}`;
    }
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function isHttps(value) {
    try {
        return new URL(String(value)).protocol === 'https:';
    } catch {
        return false;
    }
}

class AnalyticsService {
    constructor() {
        this.sessionId = this._getSessionId();
        this.playbackSessionId = null;
        this.lastFlush = 0;
        this.lastState = 'idle';
        this.lastAudienceSnapshot = 0;
    }

    init() {
        this.track('app_open', {
            view: document.body?.dataset?.currentView || 'home',
            sourceClient: this._sourceClient()
        });
        window.addEventListener('pagehide', () => this.endPlaybackSession('pagehide'));
    }

    startPlaybackSession() {
        if (!this.playbackSessionId) {
            this.playbackSessionId = randomId('playback');
        }
        return this.playbackSessionId;
    }

    endPlaybackSession(reason = 'ended') {
        if (!this.playbackSessionId) return;
        this.track('playback_session_closed', { reason });
        this.playbackSessionId = null;
    }

    track(name, details = {}) {
        if (CONFIG.ANALYTICS?.enabled === false) return;

        const event = {
            id: randomId('evt'),
            name: safeText(name, 'event', 50),
            timestamp: nowIso(),
            sessionId: this.sessionId,
            playbackSessionId: this.playbackSessionId || '',
            sourceClient: this._sourceClient(),
            platform: this._platform(),
            appVersion: safeText(CONFIG.ANALYTICS?.appVersion, 'web-dev', 30),
            stationId: safeText(details.stationId, CONFIG.ANALYTICS?.stationId || 'main', 40),
            streamRole: safeText(details.streamRole, 'primary', 30),
            player: this._playerLabel(),
            referrer: this._referrer(),
            path: safeText(window.location.pathname || '/', '/', 120),
            details: this._sanitizeDetails(details)
        };

        const events = this._loadEvents();
        events.push(event);
        const compact = events.slice(-this._maxEvents());
        this._saveEvents(compact);
        this._flushIfAllowed(compact);
    }

    trackPlaybackState(state) {
        const safeState = safeText(state, 'unknown', 40);
        if (this.lastState === safeState) return;
        this.lastState = safeState;

        if (safeState === 'playing') {
            this.startPlaybackSession();
            this.track('play_started', { state: safeState });
            return;
        }

        if (safeState === 'loading' || safeState === 'reconnecting') {
            this.startPlaybackSession();
            this.track('buffering_started', { state: safeState });
            return;
        }

        if (safeState === 'paused') {
            this.track('play_paused', { state: safeState });
            return;
        }

        if (safeState === 'error') {
            this.track('playback_error', { state: safeState });
        }
    }

    trackAudienceSnapshot(liveListeners, totalConnections) {
        const interval = Number.parseInt(CONFIG.ANALYTICS?.audienceSnapshotIntervalMs || 60000, 10);
        if (Date.now() - this.lastAudienceSnapshot < interval) return;
        this.lastAudienceSnapshot = Date.now();
        this.track('audience_snapshot', {
            liveListeners: Number(liveListeners || 0),
            totalConnections: Number(totalConnections || 0)
        });
    }

    getLocalSummary() {
        return this._summarize(this._loadEvents());
    }

    _getSessionId() {
        try {
            const stored = sessionStorage.getItem(SESSION_KEY);
            if (stored) return stored;
            const created = randomId('session');
            sessionStorage.setItem(SESSION_KEY, created);
            return created;
        } catch {
            return randomId('session');
        }
    }

    _loadEvents() {
        try {
            const raw = JSON.parse(localStorage.getItem(EVENT_KEY) || '[]');
            return Array.isArray(raw) ? raw : [];
        } catch {
            localStorage.removeItem(EVENT_KEY);
            return [];
        }
    }

    _saveEvents(events) {
        try {
            localStorage.setItem(EVENT_KEY, JSON.stringify(events));
        } catch {
            localStorage.setItem(EVENT_KEY, JSON.stringify(events.slice(-120)));
        }
    }

    _sanitizeDetails(details) {
        const output = {};
        Object.entries(details || {}).slice(0, 20).forEach(([key, value]) => {
            const safeKey = safeText(key, '', 40);
            if (!safeKey) return;
            if (typeof value === 'number' || typeof value === 'boolean') {
                output[safeKey] = value;
            } else {
                output[safeKey] = safeText(value, '', 180);
            }
        });
        delete output.email;
        delete output.phone;
        delete output.name;
        delete output.message;
        return output;
    }

    _flushIfAllowed(events) {
        const endpoint = CONFIG.ANALYTICS?.endpoint;
        if (!isHttps(endpoint)) return;

        const interval = Number.parseInt(CONFIG.ANALYTICS?.flushIntervalMs || 30000, 10);
        if (Date.now() - this.lastFlush < interval) return;
        this.lastFlush = Date.now();

        const payload = JSON.stringify({
            schema: 'wxm.analytics.v1',
            sentAt: nowIso(),
            events: events.slice(-50)
        });

        try {
            if (navigator.sendBeacon) {
                navigator.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }));
                return;
            }
            fetch(endpoint, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                credentials: 'omit',
                keepalive: true,
                body: payload
            }).catch(() => {});
        } catch {
            // La telemetria nunca debe romper reproduccion ni UI.
        }
    }

    _summarize(events) {
        const byName = {};
        const bySource = {};
        const byPlayer = {};
        const byReferrer = {};
        events.forEach(event => {
            byName[event.name] = (byName[event.name] || 0) + 1;
            bySource[event.sourceClient] = (bySource[event.sourceClient] || 0) + 1;
            byPlayer[event.player] = (byPlayer[event.player] || 0) + 1;
            byReferrer[event.referrer] = (byReferrer[event.referrer] || 0) + 1;
        });
        return {
            totalEvents: events.length,
            playStarted: byName.play_started || 0,
            playbackErrors: byName.playback_error || 0,
            appOpens: byName.app_open || 0,
            bySource,
            byPlayer,
            byReferrer
        };
    }

    _maxEvents() {
        const configured = Number.parseInt(CONFIG.ANALYTICS?.maxLocalEvents || MAX_EVENTS, 10);
        return Number.isFinite(configured) ? Math.min(2000, Math.max(120, configured)) : MAX_EVENTS;
    }

    _sourceClient() {
        if (window.WXMAndroidAudio) return 'wxm_android_app';
        if (window.location.pathname.includes('/cms/')) return 'cms_preview';
        return CONFIG.ANALYTICS?.sourceClient || 'wxm_web_app';
    }

    _platform() {
        if (window.WXMAndroidAudio) return 'android';
        return 'web';
    }

    _playerLabel() {
        if (window.WXMAndroidAudio) return 'Android App';
        const ua = navigator.userAgent || '';
        if (/Chrome/i.test(ua)) return 'Web Browser Chrome';
        if (/Safari/i.test(ua)) return 'Web Browser Safari';
        return 'Web Browser';
    }

    _referrer() {
        if (!document.referrer) return 'direct';
        try {
            return new URL(document.referrer).hostname || 'direct';
        } catch {
            return 'unknown';
        }
    }
}

export default new AnalyticsService();

/**
 * WXM ONE RADIO - Remote CMS loader.
 *
 * Carga un JSON remoto por HTTPS cuando exista en hosting. Si falla,
 * vuelve al CMC local o a una cache remota previamente validada.
 */

import LOCAL_CMS_CONFIG from './cms-config.js';

const RAIL_KEYS = [
    'banners',
    'secondaryStations',
    'podcasts',
    'mixes',
    'news',
    'presenters',
    'polls',
    'songQuiz',
    'videos',
    'replays',
    'sponsors'
];

const TEXT_LIMITS = {
    title: 120,
    subtitle: 160,
    badge: 36,
    body: 360,
    meta: 120,
    url: 500,
    image: 500
};

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function sanitizeText(value, limit = 160) {
    return String(value ?? '')
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]*>/g, '')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, limit);
}

function isSafeRemoteEndpoint(url) {
    if (!url || typeof url !== 'string') return false;
    try {
        const parsed = new URL(url);
        if (parsed.protocol === 'https:') return true;
        const localDev = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
        return localDev && parsed.protocol === 'http:';
    } catch {
        return false;
    }
}

function isSafeAssetOrHttpsUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (trimmed.startsWith('assets/')) return true;
    try {
        const parsed = new URL(trimmed);
        return parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

function isSafeActionUrl(url) {
    if (!url || typeof url !== 'string') return false;
    try {
        const parsed = new URL(url.trim());
        return ['https:', 'mailto:', 'tel:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

function sanitizeRailIds(value, knownRails) {
    if (!Array.isArray(value)) return null;
    return value
        .map(item => sanitizeText(item, 48))
        .filter(item => knownRails.includes(item));
}

function sanitizeItem(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const title = sanitizeText(raw.title, TEXT_LIMITS.title);
    if (!title) return null;

    const item = {
        title,
        subtitle: sanitizeText(raw.subtitle, TEXT_LIMITS.subtitle),
        badge: sanitizeText(raw.badge, TEXT_LIMITS.badge),
        meta: sanitizeText(raw.meta, TEXT_LIMITS.meta),
        body: sanitizeText(raw.body, TEXT_LIMITS.body)
    };

    const image = sanitizeText(raw.image, TEXT_LIMITS.image);
    if (isSafeAssetOrHttpsUrl(image)) item.image = image;

    const url = sanitizeText(raw.url, TEXT_LIMITS.url);
    if (isSafeActionUrl(url)) item.url = url;

    return item;
}

class CmsConfigService {
    constructor(localConfig) {
        this.localConfig = localConfig;
        this.lastStatus = {
            source: 'local-cmc',
            endpoint: '',
            loadedAt: new Date().toISOString(),
            error: ''
        };
    }

    getConfiguredEndpoint() {
        const storageKey = this.localConfig.remote?.endpointStorageKey;
        const saved = storageKey ? localStorage.getItem(storageKey) : '';
        return sanitizeText(saved || this.localConfig.remote?.endpoint || '', 500);
    }

    setConfiguredEndpoint(endpoint) {
        const storageKey = this.localConfig.remote?.endpointStorageKey;
        if (!storageKey) return false;
        const next = sanitizeText(endpoint, 500);
        if (!next) {
            localStorage.removeItem(storageKey);
            return true;
        }
        if (!isSafeRemoteEndpoint(next)) {
            throw new Error('El endpoint CMS debe usar HTTPS en produccion.');
        }
        localStorage.setItem(storageKey, next);
        return true;
    }

    async load() {
        const endpoint = this.getConfiguredEndpoint();
        const hasOverride = Boolean(localStorage.getItem(this.localConfig.remote?.endpointStorageKey || ''));
        const remoteEnabled = Boolean(this.localConfig.remote?.enabled);

        if (!endpoint || (!remoteEnabled && !hasOverride)) {
            return this._localStatus('local-cmc', endpoint);
        }

        if (!isSafeRemoteEndpoint(endpoint)) {
            return this._fallbackWithCache(endpoint, 'Endpoint CMS inseguro.');
        }

        try {
            const payload = await this._fetchJson(endpoint);
            const config = this._mergeRemoteConfig(payload, endpoint, 'remote-cms');
            this._saveCache(endpoint, payload);
            this.lastStatus = {
                source: 'remote-cms',
                endpoint,
                loadedAt: new Date().toISOString(),
                revision: config.revision || '',
                error: ''
            };
            return { config, status: this.lastStatus };
        } catch (error) {
            return this._fallbackWithCache(endpoint, error?.message || 'No se pudo cargar CMS remoto.');
        }
    }

    _localStatus(source, endpoint = '', error = '') {
        const config = clone(this.localConfig);
        this.lastStatus = {
            source,
            endpoint,
            loadedAt: new Date().toISOString(),
            revision: config.revision || '',
            error
        };
        return { config, status: this.lastStatus };
    }

    _fallbackWithCache(endpoint, error) {
        const cached = this._readCache(endpoint);
        if (cached) {
            const config = this._mergeRemoteConfig(cached.payload, endpoint, 'remote-cache');
            this.lastStatus = {
                source: 'remote-cache',
                endpoint,
                loadedAt: new Date().toISOString(),
                revision: config.revision || '',
                cacheSavedAt: cached.savedAt,
                error
            };
            return { config, status: this.lastStatus };
        }
        return this._localStatus('local-cmc-fallback', endpoint, error);
    }

    async _fetchJson(endpoint) {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeout = Number(this.localConfig.remote?.timeoutMs) || 4500;
        const timer = controller ? setTimeout(() => controller.abort(), timeout) : null;

        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-store',
                credentials: 'omit',
                signal: controller?.signal,
                headers: {
                    Accept: 'application/json'
                }
            });
            if (!response.ok) throw new Error(`CMS HTTP ${response.status}`);
            const payload = await response.json();
            if (!payload || typeof payload !== 'object') throw new Error('CMS JSON invalido.');
            return payload;
        } finally {
            if (timer) clearTimeout(timer);
        }
    }

    _mergeRemoteConfig(remotePayload, endpoint, source) {
        const base = clone(this.localConfig);
        const remote = remotePayload && typeof remotePayload === 'object' ? remotePayload : {};
        const knownRails = Object.keys(base.rails || {});

        base.source = source;
        base.remote = {
            ...base.remote,
            activeEndpoint: endpoint,
            lastLoadedAt: new Date().toISOString()
        };
        base.revision = sanitizeText(remote.revision || base.revision, 80);

        if (remote.visual && typeof remote.visual === 'object') {
            const heroImage = sanitizeText(remote.visual.heroImage || '', TEXT_LIMITS.image);
            const logoImage = sanitizeText(remote.visual.logoImage || '', TEXT_LIMITS.image);
            base.visual = {
                ...base.visual,
                themeDefault: sanitizeText(remote.visual.themeDefault || base.visual?.themeDefault || 'dark', 24),
                allowLightTheme: typeof remote.visual.allowLightTheme === 'boolean'
                    ? remote.visual.allowLightTheme
                    : Boolean(base.visual?.allowLightTheme),
                heroImage: isSafeAssetOrHttpsUrl(heroImage) ? heroImage : base.visual?.heroImage,
                logoImage: isSafeAssetOrHttpsUrl(logoImage) ? logoImage : base.visual?.logoImage
            };
        }

        if (remote.audioExperience && typeof remote.audioExperience === 'object') {
            base.audioExperience = {
                ...base.audioExperience,
                defaultProfile: sanitizeText(remote.audioExperience.defaultProfile || base.audioExperience?.defaultProfile || 'standard', 40),
                allowUserProfiles: typeof remote.audioExperience.allowUserProfiles === 'boolean'
                    ? remote.audioExperience.allowUserProfiles
                    : Boolean(base.audioExperience?.allowUserProfiles),
                showAdvancedProfiles: typeof remote.audioExperience.showAdvancedProfiles === 'boolean'
                    ? remote.audioExperience.showAdvancedProfiles
                    : Boolean(base.audioExperience?.showAdvancedProfiles)
            };
        }

        if (remote.features && typeof remote.features === 'object') {
            Object.keys(base.features || {}).forEach(key => {
                if (Object.prototype.hasOwnProperty.call(remote.features, key)) {
                    base.features[key] = Boolean(remote.features[key]);
                }
            });
        }

        const homeRails = sanitizeRailIds(remote.homeRails, knownRails);
        if (homeRails) base.homeRails = homeRails;

        const exploreRails = sanitizeRailIds(remote.exploreRails, knownRails);
        if (exploreRails) base.exploreRails = exploreRails;

        if (remote.emptyStates?.explore && typeof remote.emptyStates.explore === 'object') {
            base.emptyStates.explore = {
                ...base.emptyStates.explore,
                icon: sanitizeText(remote.emptyStates.explore.icon || base.emptyStates.explore.icon, 48),
                titleKey: sanitizeText(remote.emptyStates.explore.titleKey || base.emptyStates.explore.titleKey, 80),
                bodyKey: sanitizeText(remote.emptyStates.explore.bodyKey || base.emptyStates.explore.bodyKey, 80)
            };
        }

        if (remote.rails && typeof remote.rails === 'object') {
            knownRails.forEach(railId => {
                const remoteRail = remote.rails[railId];
                if (!remoteRail || typeof remoteRail !== 'object') return;

                const baseRail = base.rails[railId] || {};
                const items = Array.isArray(remoteRail.items)
                    ? remoteRail.items
                        .slice(0, Number(base.remote?.maxItemsPerRail) || 40)
                        .map(sanitizeItem)
                        .filter(Boolean)
                    : baseRail.items;

                base.rails[railId] = {
                    ...baseRail,
                    feature: sanitizeText(remoteRail.feature || baseRail.feature || railId, 60),
                    titleKey: sanitizeText(remoteRail.titleKey || baseRail.titleKey, 90),
                    actionKey: sanitizeText(remoteRail.actionKey || baseRail.actionKey || 'common.viewMore', 90),
                    layout: sanitizeText(remoteRail.layout || baseRail.layout || 'media-row', 40),
                    items
                };
            });
        }

        return base;
    }

    _saveCache(endpoint, payload) {
        try {
            const cacheKey = this.localConfig.remote?.cacheKey;
            if (!cacheKey) return;
            localStorage.setItem(cacheKey, JSON.stringify({
                endpoint,
                savedAt: Date.now(),
                payload
            }));
        } catch {
            // La cache es opcional: si localStorage esta lleno, la app sigue con fallback local.
        }
    }

    _readCache(endpoint) {
        try {
            const cacheKey = this.localConfig.remote?.cacheKey;
            if (!cacheKey) return null;
            const raw = localStorage.getItem(cacheKey);
            if (!raw) return null;
            const cached = JSON.parse(raw);
            if (!cached || cached.endpoint !== endpoint || !cached.payload) return null;
            const ttl = Number(this.localConfig.remote?.cacheTtlMs) || 0;
            if (ttl > 0 && Date.now() - Number(cached.savedAt || 0) > ttl) return null;
            return cached;
        } catch {
            return null;
        }
    }
}

export default new CmsConfigService(LOCAL_CMS_CONFIG);

/**
 * WXM ONE RADIO - Metadata Service
 * Gestiona la información de la canción, carátulas y Spotify.
 */

import CONFIG from './config.js';

class MetadataService {
    constructor() {
        this.lastTitle = "";
        this.cache = new Map();
        this.proxyFailed = false;
        this.safeImageHosts = [
            'i.scdn.co',
            'mosaic.scdn.co',
            'is1-ssl.mzstatic.com',
            'is2-ssl.mzstatic.com',
            'is3-ssl.mzstatic.com',
            'is4-ssl.mzstatic.com',
            'is5-ssl.mzstatic.com',
            'jm8n.net',
            'wxmoneradio.com'
        ];
    }

    async _fetchJson(url, timeoutMs = 8000) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                credentials: 'same-origin'
            });
            if (!response.ok) throw new Error("API Error");
            return await response.json();
        } finally {
            clearTimeout(timeout);
        }
    }

    isSafeImageUrl(url) {
        if (!url || typeof url !== 'string') return false;
        try {
            const parsed = new URL(url, window.location.href);
            if (parsed.protocol !== 'https:') return false;
            return this.safeImageHosts.some(host =>
                parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
            );
        } catch {
            return false;
        }
    }

    async fetchInfo() {
        try {
            return await this._fetchJson(`${CONFIG.STREAM.INFO_API}&nocache=${Date.now()}`);
        } catch (error) {
            console.error("[Metadata] Fetch failed:", error);
            return null;
        }
    }

    async getCover(track) {
        if (!track) return null;
        
        // 1. Verificar Cache
        if (this.cache.has(track)) return this.cache.get(track);

        const [artist, title] = this._parseTrack(track);
        
        try {
            // 2. Intentar Spotify via Proxy
            const cover = await this._searchSpotify(artist, title);
            if (cover) {
                this.cache.set(track, cover);
                return cover;
            }
        } catch (err) {
            console.warn("[Metadata] Spotify search failed");
        }

        // 3. FALLBACK: Intentar iTunes (Funciona en local sin PHP)
        try {
            const itunesCover = await this._searchiTunes(artist, title);
            if (itunesCover) {
                this.cache.set(track, itunesCover);
                return itunesCover;
            }
        } catch (err) {
            console.warn("[Metadata] iTunes fallback failed");
        }

        return null;
    }

    async _searchiTunes(artist, title) {
        const query = encodeURIComponent(`${artist} ${title}`);
        const data = await this._fetchJson(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
        
        if (data.results?.length > 0) {
            // Convertir carátula de 100x100 a 600x600 para calidad premium
            const cover = data.results[0].artworkUrl100?.replace('100x100bb', '600x600bb');
            return this.isSafeImageUrl(cover) ? cover : null;
        }
        return null;
    }

    getCleanTrackName(track) {
        if (!track) return "";
        return String(track)
            .replace(/^\d+\.\)\s*/, '') // Elimina "1.) ", "2.) ", etc.
            .replace(/<br\s*\/?>/gi, '') // Elimina <br>, <br/>, <br />
            .replace(/<[^>]*>/g, '')     // Elimina cualquier otra etiqueta HTML
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
            .replace(/\s+/g, ' ')      // Normaliza espacios
            .trim()
            .slice(0, 300);
    }

    _parseTrack(track) {
        const cleaned = this.getCleanTrackName(track);
        const parts = cleaned.split(' - ');
        if (parts.length < 2) return ["Unknown", cleaned];
        return [parts[0].trim(), parts.slice(1).join(' - ').trim()];
    }

    async _searchSpotify(artist, title) {
        if (this.proxyFailed) return null;

        const query = `${artist} ${title}`;
        try {
            const data = await this._fetchJson(`${CONFIG.SERVICES.SPOTIFY_PROXY}?action=search&q=${encodeURIComponent(query)}`);
            
            if (data.tracks?.items?.length > 0) {
                const cover = data.tracks.items[0].album.images[1]?.url || data.tracks.items[0].album.images[0]?.url;
                return this.isSafeImageUrl(cover) ? cover : null;
            }
        } catch (err) {
            this.proxyFailed = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            console.warn("[Metadata] Spotify search failed");
        }
        return null;
    }
}

export default new MetadataService();

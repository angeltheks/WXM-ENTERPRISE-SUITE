/**
 * WXM ONE RADIO - Playlist Storage Adapter
 * Gestiona la persistencia de datos (actualmente localStorage).
 */

class PlaylistStorage {
    constructor() {
        // Cambiamos el nombre de la clave para forzar un reset limpio (V3)
        this.STORAGE_KEY = 'wxm_radio_playlist_v3_elite';
        this.weekdays = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        this.MAX_TRACKS_PER_DAY = 500;
    }

    _sanitizeText(value, max = 160) {
        return String(value ?? '')
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/<[^>]*>/g, '')
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, max);
    }

    _sanitizeTrack(track, dayName) {
        if (!track || typeof track !== 'object') return null;
        const title = this._sanitizeText(track.title);
        const artist = this._sanitizeText(track.artist || 'WXM Radio');
        if (!title || !artist) return null;

        const time = typeof track.time === 'string' && /^\d{2}:\d{2}$/.test(track.time) ? track.time : '';
        const date = typeof track.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(track.date) ? track.date : '';
        const playedAtDate = Date.parse(track.playedAt);

        return {
            id: this._sanitizeText(track.id || `stored-${Date.now()}`, 80),
            title,
            artist,
            playedAt: Number.isFinite(playedAtDate) ? new Date(playedAtDate).toISOString() : new Date().toISOString(),
            date,
            time,
            dayName,
            cover: typeof track.cover === 'string' ? track.cover.slice(0, 500) : null
        };
    }

    _sanitizeData(data) {
        if (!data || typeof data !== 'object') return null;
        const sanitized = {};

        this.weekdays.forEach(day => {
            const slot = data[day] && typeof data[day] === 'object' ? data[day] : {};
            const date = typeof slot.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(slot.date) ? slot.date : '';
            const tracks = Array.isArray(slot.tracks)
                ? slot.tracks.slice(0, this.MAX_TRACKS_PER_DAY).map(track => this._sanitizeTrack(track, day)).filter(Boolean)
                : [];

            sanitized[day] = {
                date,
                count: tracks.length,
                tracks
            };
        });

        return sanitized;
    }

    /**
     * Obtiene todos los datos de la playlist semanal.
     */
    getData() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (!data) return null;
        try {
            return this._sanitizeData(JSON.parse(data));
        } catch (e) {
            console.error("[PlaylistStorage] Error parsing data", e);
            localStorage.removeItem(this.STORAGE_KEY);
            return null;
        }
    }

    /**
     * Guarda el objeto completo de la playlist.
     */
    saveData(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._sanitizeData(data)));
            return true;
        } catch (e) {
            console.error("[PlaylistStorage] Error saving data", e);
            try {
                const compact = this._sanitizeData(data);
                if (!compact) return false;
                this.weekdays.forEach(day => {
                    compact[day].tracks = compact[day].tracks.slice(0, 250);
                    compact[day].count = compact[day].tracks.length;
                });
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(compact));
                return true;
            } catch (fallbackError) {
                console.error("[PlaylistStorage] Error saving compact data", fallbackError);
            }
            return false;
        }
    }
}

export default new PlaylistStorage();

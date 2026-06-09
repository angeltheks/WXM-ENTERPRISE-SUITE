/**
 * WXM ONE RADIO - Playlist Engine (Professional Broadcasting Logic)
 * Maneja el historial real, rotación de días y persistencia de 7 días.
 */

import Storage from './playlist-storage.js';
import CONFIG from '../../config.js';

class PlaylistEngine {
    constructor() {
        this.weekdays = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        this._init();
    }

    _init() {
        this.data = Storage.getData() || this._generateEmptyWeek();
        this._rotateAndPrune();
        Storage.saveData(this.data);
    }

    _sanitizeText(value, fallback = '') {
        return String(value ?? fallback)
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/<[^>]*>/g, '')
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 160);
    }

    _getLocalDateKey(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    _getMostRecentDateForWeekday(dayName, reference = new Date()) {
        const targetDay = this.weekdays.indexOf(dayName);
        if (targetDay < 0) return '';

        const date = new Date(reference);
        date.setHours(0, 0, 0, 0);
        const daysBack = (date.getDay() - targetDay + 7) % 7;
        date.setDate(date.getDate() - daysBack);
        return this._getLocalDateKey(date);
    }

    _ensureDaySlot(dayName, dateStr) {
        if (!this.data[dayName] || this.data[dayName].date !== dateStr) {
            this._resetDay(dayName, dateStr);
        }
        return this.data[dayName];
    }

    /**
     * Procesa una nueva canción detectada por la metadata.
     */
    addTrack(trackData) {
        if (!CONFIG.PLAYLIST.ENABLE || !trackData.title || !trackData.artist) return;
        const safeTitle = this._sanitizeText(trackData.title);
        const safeArtist = this._sanitizeText(trackData.artist, 'WXM Radio');
        if (!safeTitle || !safeArtist) return;

        const now = new Date();
        const dateStr = this._getLocalDateKey(now);
        const dayName = this.weekdays[now.getDay()];
        const daySlot = this._ensureDaySlot(dayName, dateStr);

        if (this._isSameAsLast(daySlot.tracks, { title: safeTitle, artist: safeArtist })) return;

        const newTrack = {
            id: `live-${Date.now()}`,
            title: safeTitle,
            artist: safeArtist,
            playedAt: now.toISOString(),
            date: dateStr,
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            dayName: dayName,
            cover: typeof trackData.cover === 'string' ? trackData.cover.slice(0, 500) : null
        };

        daySlot.tracks.unshift(newTrack);
        
        if (daySlot.tracks.length > CONFIG.PLAYLIST.MAX_TRACKS_PER_DAY) {
            daySlot.tracks.length = CONFIG.PLAYLIST.MAX_TRACKS_PER_DAY;
        }
        daySlot.count = daySlot.tracks.length;

        Storage.saveData(this.data);
        return newTrack;
    }

    /**
     * Importa historial de la API.
     */
    async addHistory(historyArray) {
        if (!CONFIG.PLAYLIST.ENABLE || !Array.isArray(historyArray)) return;

        const now = new Date();
        const dateStr = this._getLocalDateKey(now);
        const dayName = this.weekdays[now.getDay()];
        const daySlot = this._ensureDaySlot(dayName, dateStr);

        const recentHistory = historyArray.slice(0, 10);
        let minutesBack = 5;

        for (const rawTrack of recentHistory) {
            // La API devuelve: "1.) Amantes<br>" → limpiar número, <br> y espacios
            let cleanTrack = this._sanitizeText(rawTrack)
                .replace(/^\d+\.\)\s*/, '')       // elimina "1.) "
                .trim();
            const parts = cleanTrack.split(' - ');
            const artist = this._sanitizeText(parts[0] || 'WXM Radio', 'WXM Radio');
            const title = this._sanitizeText(parts.length > 1 ? parts.slice(1).join(' - ') : parts[0]);
            if (!title || !artist) continue;

            const estimatedTime = new Date(now.getTime() - (minutesBack * 60000));
            if (!this._isRecentlyStored(daySlot.tracks, title, artist, estimatedTime)) {
                const trackId = `hist-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                
                const hTrack = {
                    id: trackId,
                    title,
                    artist,
                    playedAt: estimatedTime.toISOString(),
                    date: dateStr,
                    time: estimatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                    dayName: dayName,
                    cover: null
                };
                
                daySlot.tracks.push(hTrack);
                minutesBack += 4;

                // Lanzar búsqueda de carátula en segundo plano
                this._fetchCoverForHistory(trackId, `${artist} - ${title}`);
            }
        }

        daySlot.tracks.sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt));
        if (daySlot.tracks.length > CONFIG.PLAYLIST.MAX_TRACKS_PER_DAY) {
            daySlot.tracks.length = CONFIG.PLAYLIST.MAX_TRACKS_PER_DAY;
        }
        daySlot.count = daySlot.tracks.length;
        Storage.saveData(this.data);
    }

    /**
     * Busca carátulas para el historial y las aplica MASIVAMENTE a todas las canciones iguales.
     */
    async _fetchCoverForHistory(trackId, query) {
        try {
            const { default: MetadataService } = await import('../../metadata-service.js');
            const cover = await MetadataService.getCover(query);
            
            if (cover) {
                let updated = false;
                const [targetArtist, targetTitle] = query.split(' - ').map(s => s.trim());

                // Actualización MASIVA: Buscar en todos los días por si la canción se repite
                this.weekdays.forEach(day => {
                    this.data[day].tracks.forEach(track => {
                        if (track.artist === targetArtist && track.title === targetTitle) {
                            if (!track.cover) {
                                track.cover = cover;
                                updated = true;
                            }
                        }
                    });
                });
                
                if (updated) {
                    Storage.saveData(this.data);
                    window.dispatchEvent(new CustomEvent('playlist-updated'));
                }
            }
        } catch (e) {
            console.error("[PlaylistEngine] Error fetching history cover", e);
        }
    }

    _isSameAsLast(tracks, newData) {
        if (tracks.length === 0) return false;
        const last = tracks[0];
        return last.title === newData.title && last.artist === newData.artist;
    }

    _isRecentlyStored(tracks, title, artist, playedAt, duplicateWindowMs = 20 * 60 * 1000) {
        const playedAtMs = playedAt instanceof Date ? playedAt.getTime() : Date.parse(playedAt);
        if (!Number.isFinite(playedAtMs)) return false;
        return tracks.some(t => {
            if (t.title !== title || t.artist !== artist) return false;
            const existingMs = Date.parse(t.playedAt);
            return Number.isFinite(existingMs) && Math.abs(existingMs - playedAtMs) <= duplicateWindowMs;
        });
    }

    _resetDay(dayName, dateStr) {
        this.data[dayName] = {
            date: dateStr,
            count: 0,
            tracks: []
        };
    }

    _generateEmptyWeek() {
        const data = {};
        this.weekdays.forEach(day => {
            data[day] = { date: '', count: 0, tracks: [] };
        });
        return data;
    }

    _rotateAndPrune() {
        const now = new Date();
        this.weekdays.forEach(day => {
            const slot = this.data[day];
            const expectedDate = this._getMostRecentDateForWeekday(day, now);
            if (slot && slot.date && slot.date !== expectedDate) {
                this._resetDay(day, '');
            }
        });
    }

    getAllPlaylists() {
        return this.data;
    }
}

export default new PlaylistEngine();

/**
 * WXM ONE RADIO - Audio Engine
 * Maneja el flujo de audio, estados y reconexiones.
 */

import CONFIG from './config.js';

export const PlayerState = {
    IDLE: 'idle',
    LOADING: 'loading',
    PLAYING: 'playing',
    PAUSED: 'paused',
    ERROR: 'error',
    RECONNECTING: 'reconnecting'
};

class AudioEngine {
    constructor() {
        this.audio = new Audio();
        this.audio.preload = "none";
        this.nativeAndroid = window.WXMAndroidAudio || null;
        this.state = PlayerState.IDLE;
        this.retries = 0;
        this.callbacks = [];
        this.nativeStatusCallbacks = [];
        this.nativeStatus = null;
        this.audioProfile = localStorage.getItem('wxm_audio_profile') || 'standard';
        this.volume = Number.parseFloat(localStorage.getItem('wxm_audio_volume') || CONFIG.UI.DEFAULT_VOLUME);
        if (!Number.isFinite(this.volume)) this.volume = CONFIG.UI.DEFAULT_VOLUME;
        this.isMuted = localStorage.getItem('wxm_audio_muted') === 'true';

        this._setupListeners();
        this._setupNativeStatusPolling();
    }

    _setupListeners() {
        this.audio.crossOrigin = "anonymous"; // FIX para el Visualizador (CORS)
        this.audio.addEventListener('playing', () => this._setState(PlayerState.PLAYING));
        this.audio.addEventListener('waiting', () => this._setState(PlayerState.LOADING));
        this.audio.addEventListener('pause', () => this._setState(PlayerState.PAUSED));
        this.audio.addEventListener('error', (e) => this._handleError(e));
        this.audio.addEventListener('stalled', () => this._handleStalled());
    }

    _setState(newState) {
        if (this.state !== newState) {
            this.state = newState;
            this.callbacks.forEach(cb => cb(newState));
            console.log(`[AudioEngine] State changed: ${newState}`);
        }
    }

    onStateChange(callback) {
        this.callbacks.push(callback);
    }

    onNativeStatusChange(callback) {
        if (typeof callback !== 'function') return;
        this.nativeStatusCallbacks.push(callback);
        if (this.nativeStatus) callback(this.nativeStatus);
    }

    getNativeStatus() {
        return this._pollNativeStatus() || this.nativeStatus;
    }

    async play() {
        if (this.state === PlayerState.PLAYING) return;

        if (this.nativeAndroid) {
            this._setState(PlayerState.LOADING);
            this.nativeAndroid.play(
                CONFIG.STREAM.URL,
                this.audioProfile,
                this.volume,
                this.isMuted
            );
            this._pollNativeStatus();
            return;
        }
        
        // Evitar múltiples peticiones simultáneas
        if (this.playPromise) {
            console.log("[AudioEngine] Play in progress, waiting...");
            return;
        }

        this._setState(PlayerState.LOADING);
        const nocache = Date.now();
        this.audio.src = `${CONFIG.STREAM.URL}?nocache=${nocache}`;
        this.audio.load();
        
        try {
            this.playPromise = this.audio.play();
            await this.playPromise;
            this.playPromise = null;
            this.retries = 0;
        } catch (err) {
            this.playPromise = null;
            if (err.name !== 'AbortError') {
                console.error("[AudioEngine] Play failed:", err);
                this._handleError(err);
            }
        }
    }

    pause() {
        if (this.nativeAndroid) {
            this.nativeAndroid.pause();
            this._setState(PlayerState.PAUSED);
            this._pollNativeStatus();
            return;
        }

        this.audio.pause();
        // Al pausar un stream en vivo, vaciamos el src para no seguir descargando datos
        this.audio.src = "";
        this._setState(PlayerState.PAUSED);
    }

    stop() {
        if (this.nativeAndroid) {
            this.nativeAndroid.stop();
            this._setState(PlayerState.IDLE);
            this._pollNativeStatus();
            return;
        }

        this.audio.pause();
        this.audio.src = "";
        this.audio.load();
        this._setState(PlayerState.IDLE);
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, Number.parseFloat(value)));
        if (!Number.isFinite(this.volume)) this.volume = CONFIG.UI.DEFAULT_VOLUME;
        localStorage.setItem('wxm_audio_volume', String(this.volume));
        if (this.nativeAndroid?.setVolume) {
            const canApplyNow = [
                PlayerState.LOADING,
                PlayerState.PLAYING,
                PlayerState.PAUSED,
                PlayerState.RECONNECTING
            ].includes(this.state);
            if (canApplyNow) {
                this.nativeAndroid.setVolume(this.volume);
                this._pollNativeStatus();
            }
            return;
        }
        this.audio.volume = this.volume;
    }

    mute(isMuted) {
        this.isMuted = Boolean(isMuted);
        localStorage.setItem('wxm_audio_muted', this.isMuted ? 'true' : 'false');
        if (this.nativeAndroid?.setMuted) {
            const canApplyNow = [
                PlayerState.LOADING,
                PlayerState.PLAYING,
                PlayerState.PAUSED,
                PlayerState.RECONNECTING
            ].includes(this.state);
            if (canApplyNow) {
                this.nativeAndroid.setMuted(this.isMuted);
                this._pollNativeStatus();
            }
            return;
        }
        this.audio.muted = this.isMuted;
    }

    updateMetadata({ title, artist, cover } = {}) {
        if (!this.nativeAndroid?.updateMetadata) return;
        this.nativeAndroid.updateMetadata(
            String(title || 'WXM ONE RADIO').slice(0, 120),
            String(artist || 'Radio en vivo').slice(0, 120),
            typeof cover === 'string' ? cover.slice(0, 500) : ''
        );
    }

    setAudioProfile(profile) {
        const normalized = String(profile || 'standard').slice(0, 40);
        this.audioProfile = normalized;
        if (this.nativeAndroid?.setAudioProfile) {
            const canApplyNow = [
                PlayerState.LOADING,
                PlayerState.PLAYING,
                PlayerState.PAUSED,
                PlayerState.RECONNECTING
            ].includes(this.state);
            if (canApplyNow) {
                this.nativeAndroid.setAudioProfile(normalized);
                this._pollNativeStatus();
            }
        }
    }

    supportsVisualizer() {
        return !this.nativeAndroid;
    }

    _handleError(error) {
        // Ignorar errores si el usuario pausó o detuvo el reproductor intencionadamente
        if (this.state === PlayerState.PAUSED || this.state === PlayerState.IDLE) {
            return;
        }

        console.error("[AudioEngine] Error detected:", error);
        
        if (this.retries < CONFIG.STREAM.MAX_RETRIES) {
            this.retries++;
            this._setState(PlayerState.RECONNECTING);
            setTimeout(() => this.play(), CONFIG.STREAM.RECONNECT_INTERVAL);
        } else {
            this._setState(PlayerState.ERROR);
        }
    }

    _handleStalled() {
        if (this.state === PlayerState.PLAYING) {
            console.warn("[AudioEngine] Stream stalled, attempting recovery...");
            this.play();
        }
    }

    _setupNativeStatusPolling() {
        if (!this.nativeAndroid?.getPlaybackStatus) return;
        this._pollNativeStatus();
        this.nativeStatusTimer = setInterval(() => this._pollNativeStatus(), 1500);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) this._pollNativeStatus();
        });
    }

    _pollNativeStatus() {
        if (!this.nativeAndroid?.getPlaybackStatus) return null;
        try {
            const raw = this.nativeAndroid.getPlaybackStatus();
            if (!raw) return null;
            const status = JSON.parse(raw);
            this.nativeStatus = status;
            this._syncStateFromNativeStatus(status);
            this.nativeStatusCallbacks.forEach(callback => callback(status));
            return status;
        } catch (error) {
            console.warn('[AudioEngine] Native status unavailable:', error);
            return null;
        }
    }

    _syncStateFromNativeStatus(status = {}) {
        const nativeState = String(status.state || '').toLowerCase();
        if (nativeState === 'playing') {
            this._setState(PlayerState.PLAYING);
            return;
        }
        if (['loading', 'buffering'].includes(nativeState)) {
            this._setState(PlayerState.LOADING);
            return;
        }
        if (['recovering', 'fallback', 'waiting_recovery'].includes(nativeState)) {
            this._setState(PlayerState.RECONNECTING);
            return;
        }
        if (['paused', 'audio_focus_paused', 'ready'].includes(nativeState)) {
            this._setState(status.playing ? PlayerState.PLAYING : PlayerState.PAUSED);
            return;
        }
        if (['error', 'unavailable'].includes(nativeState)) {
            this._setState(PlayerState.ERROR);
            return;
        }
        if (['idle', 'ended'].includes(nativeState)) {
            this._setState(PlayerState.IDLE);
        }
    }

    getAudioContext() {
        if (this.nativeAndroid) {
            return { context: null, analyzer: null };
        }

        // Para el visualizador real
        if (!this.context) {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.source = this.context.createMediaElementSource(this.audio);
            this.analyzer = this.context.createAnalyser();
            this.source.connect(this.analyzer);
            this.analyzer.connect(this.context.destination);
        }
        return { context: this.context, analyzer: this.analyzer };
    }
}

export default new AudioEngine();

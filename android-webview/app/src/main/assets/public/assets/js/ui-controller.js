/**
 * WXM ONE RADIO - UI Controller
 * Orquesta la interfaz de usuario y las animaciones.
 */

import AudioEngine, { PlayerState } from './audio-engine.js';
import MetadataService from './metadata-service.js';
import CONFIG, { loadRuntimeConfig } from './config.js';
import PlaylistEngine from './modules/playlist/playlist-engine.js';
import PlaylistUI from './modules/playlist/playlist-ui.js';
import AnalyticsService from './analytics-service.js';

const APP_CONTENT = {
    schedule: [
        { time: '06:00', title: 'WXM Morning', host: 'Equipo WXM', tag: 'Noticias, energia y hits' },
        { time: '10:00', title: 'Global Mix', host: 'WXM DJs', tag: 'Pop, urbano y dance' },
        { time: '14:00', title: 'La Conexion', host: 'Cabina WXM', tag: 'Cultura, llamadas y comunidad' },
        { time: '18:00', title: 'Prime Time WXM', host: 'Invitados especiales', tag: 'Estrenos, entrevistas y tendencia' },
        { time: '22:00', title: 'Night Sessions', host: 'WXM Selectors', tag: 'Late night, chill y electronica' }
    ],
    highlights: [
        { title: 'Especial urbano global', meta: 'Hoy 18:00', icon: 'fa-bolt', body: 'Una hora con los lanzamientos que estan moviendo la semana.' },
        { title: 'Entrevistas WXM', meta: 'Proximamente', icon: 'fa-microphone', body: 'Conversaciones cortas con artistas, productores y voces culturales.' },
        { title: 'Mapa de oyentes', meta: 'En desarrollo', icon: 'fa-earth-americas', body: 'La comunidad WXM conectada por ciudades y paises.' }
    ],
    banners: [
        { title: 'Broadcasting worldwide 24/7', meta: 'WXM Future Network', body: 'Musica, cultura y comunidad desde el Caribe para el mundo.', image: 'assets/img/brand/hero-world-wide.png', ctaLabel: 'Escuchar ahora', ctaUrl: '', placement: 'home' }
    ],
    presenters: [
        { name: 'Equipo WXM', role: 'Cabina central', program: 'Prime Time WXM', bio: 'Voces de la comunidad WXM con foco en musica, cultura y conexion global.', image: 'assets/img/brand/wxm-emblem-square.png', instagram: '', website: '' }
    ],
    articles: [],
    podcasts: [],
    stations: [],
    polls: [],
    sponsors: []
};

class UIController {
    constructor() {
        this.dom = {
            container: document.querySelector('.wxm-player-container'),
            playBtn: document.getElementById('playBtn'),
            playIcon: document.querySelector('#playBtn i'),
            homePlayBtn: document.getElementById('homePlayBtn'),
            homePlayIcon: document.querySelector('#homePlayBtn i'),
            homeTrackTitle: document.getElementById('homeTrackTitle'),
            homeTrackArtist: document.getElementById('homeTrackArtist'),
            trackTitle: document.getElementById('trackTitle'),
            trackArtist: document.getElementById('trackArtist'),
            artwork: document.getElementById('artwork'),
            volumeSlider: document.getElementById('volumeSlider'),
            visualizer: document.getElementById('visualizer'),
            muteBtn: document.getElementById('muteBtn'),
            shareBtn: document.getElementById('shareBtn'),
            themeBtn: document.getElementById('themeBtn'),
            stopBtn: document.getElementById('stopBtn'),
            syncBtn: document.getElementById('syncBtn'),
            playlistContainer: document.getElementById('weeklyPlaylistContainer'),
            liveListeners: document.getElementById('liveListeners'),
            totalConnections: document.getElementById('totalConnections'),
            emergencyBanner: document.getElementById('emergencyBanner'),
            homeBanners: document.getElementById('homeBanners'),
            homeSchedule: document.getElementById('homeSchedule'),
            homeHighlights: document.getElementById('homeHighlights'),
            homeCmsRails: document.getElementById('homeCmsRails'),
            homeSponsors: document.getElementById('homeSponsors'),
            programsList: document.getElementById('programsList'),
            presentersList: document.getElementById('presentersList'),
            exploreList: document.getElementById('exploreList'),
            exploreRails: document.getElementById('exploreRails'),
            exploreBanners: document.getElementById('exploreBanners'),
            articleList: document.getElementById('articleList'),
            podcastList: document.getElementById('podcastList'),
            stationList: document.getElementById('stationList'),
            pollList: document.getElementById('pollList'),
            sponsorList: document.getElementById('sponsorList'),
            favoriteTrackBtn: document.getElementById('favoriteTrackBtn'),
            sleepTimerBtn: document.getElementById('sleepTimerBtn'),
            requestSongBtn: document.getElementById('requestSongBtn'),
            openHistoryBtn: document.getElementById('openHistoryBtn'),
            historySheet: document.getElementById('historySheet'),
            closeHistoryBtn: document.getElementById('closeHistoryBtn'),
            quickRequestBtn: document.getElementById('quickRequestBtn'),
            quickSleepBtn: document.getElementById('quickSleepBtn'),
            quickWhatsappBtn: document.getElementById('quickWhatsappBtn'),
            favoritesCount: document.getElementById('favoritesCount'),
            favoritesList: document.getElementById('favoritesList'),
            clearFavoritesBtn: document.getElementById('clearFavoritesBtn'),
            audioExperienceCard: document.getElementById('audioExperienceCard'),
            audioSettingsBtn: document.getElementById('audioSettingsBtn'),
            languageSettingsBtn: document.getElementById('languageSettingsBtn'),
            serviceStatusBtn: document.getElementById('serviceStatusBtn'),
            cmsStatusBtn: document.getElementById('cmsStatusBtn'),
            engineStatusBtn: document.getElementById('engineStatusBtn'),
            miniPlayBtn: document.getElementById('miniPlayBtn'),
            miniPlayIcon: document.getElementById('miniPlayIcon'),
            miniArtwork: document.getElementById('miniArtwork'),
            miniTrackTitle: document.getElementById('miniTrackTitle'),
            miniTrackArtist: document.getElementById('miniTrackArtist'),
            miniPlayerState: document.getElementById('miniPlayerState'),
            contactBtn: document.getElementById('contactBtn'),
            privacyBtn: document.getElementById('privacyBtn'),
            modal: document.getElementById('appModal'),
            modalTitle: document.getElementById('appModalTitle'),
            modalBody: document.getElementById('appModalBody'),
            modalClose: document.getElementById('appModalClose')
        };

        this.ctx = this.dom.visualizer?.getContext?.('2d') || null;
        this.isMuted = false;
        this.currentTrack = { title: 'Cargando...', artist: 'WXM Radio', cover: null };
        this.sleepTimerId = null;
        this.content = this._getRuntimeContent();
        this._totalPeak = Number.parseInt(localStorage.getItem('wxm_total_peak') || '0', 10);
        if (!Number.isFinite(this._totalPeak) || this._totalPeak < 0) this._totalPeak = 0;
        this.favorites = this._loadFavorites();
        document.body.dataset.currentView = 'home';

        // El CMC puede proponer tema inicial, pero el usuario conserva control local.
        const savedTheme = localStorage.getItem('wxm_theme');
        this.isDark = savedTheme ? savedTheme !== 'light' : CONFIG.VISUAL.themeDefault !== 'light';

        if (!this.isDark) {
            document.body.classList.add('light-theme');
        }

        this._init();
    }

    _init() {
        this._applyRuntimeConfig();
        AnalyticsService.init();

        // Icono de tema inicial
        if (this.dom.themeBtn) {
            this.dom.themeBtn.querySelector('i').className = this.isDark ? 'fas fa-moon' : 'fas fa-sun';
        }

        this.dom.playBtn?.addEventListener('click', () => this._togglePlay());
        this.dom.homePlayBtn?.addEventListener('click', () => this._togglePlay());
        this.dom.miniPlayBtn?.addEventListener('click', () => this._togglePlay());
        this.dom.stopBtn?.addEventListener('click', () => AudioEngine.stop());
        this.dom.syncBtn?.addEventListener('click', () => this._syncStream());
        this.dom.themeBtn?.addEventListener('click', () => this._toggleTheme());
        this.dom.volumeSlider?.addEventListener('input', (e) => this._updateVolume(e.target.value));
        this.dom.muteBtn?.addEventListener('click', () => this._toggleMute());
        this.dom.shareBtn?.addEventListener('click', () => this._share());
        this.dom.favoriteTrackBtn?.addEventListener('click', () => this._toggleFavoriteCurrent());
        this.dom.sleepTimerBtn?.addEventListener('click', () => this._openSleepTimer());
        this.dom.requestSongBtn?.addEventListener('click', () => this._openRequestSong());
        this.dom.openHistoryBtn?.addEventListener('click', () => this._openHistorySheet());
        this.dom.closeHistoryBtn?.addEventListener('click', () => this._closeHistorySheet());
        this.dom.historySheet?.addEventListener('click', (event) => {
            if (event.target === this.dom.historySheet) this._closeHistorySheet();
        });
        this.dom.quickRequestBtn?.addEventListener('click', () => this._openRequestSong());
        this.dom.quickSleepBtn?.addEventListener('click', () => this._openSleepTimer());
        this.dom.quickWhatsappBtn?.addEventListener('click', () => this._openContact());
        this.dom.clearFavoritesBtn?.addEventListener('click', () => this._clearFavorites());
        this.dom.audioExperienceCard?.addEventListener('click', () => this._openAudioExperience());
        this.dom.audioSettingsBtn?.addEventListener('click', () => this._openAudioExperience());
        this.dom.languageSettingsBtn?.addEventListener('click', () => this._openLanguageSettings());
        this.dom.serviceStatusBtn?.addEventListener('click', () => this._openServiceStatus());
        this.dom.cmsStatusBtn?.addEventListener('click', () => this._openCmsStatus());
        this.dom.engineStatusBtn?.addEventListener('click', () => this._openEngineStatus());
        this.dom.contactBtn?.addEventListener('click', () => this._openContact());
        this.dom.privacyBtn?.addEventListener('click', () => this._openPrivacy());
        this.dom.modalClose?.addEventListener('click', () => this._closeModal());
        this.dom.modal?.addEventListener('click', (event) => {
            if (event.target === this.dom.modal) this._closeModal();
        });

        document.querySelectorAll('[data-target-view]').forEach(btn => {
            btn.addEventListener('click', () => this._showView(btn.dataset.targetView));
        });
        document.querySelectorAll('[data-jump-view]').forEach(btn => {
            btn.addEventListener('click', () => this._showView(btn.dataset.jumpView));
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this._closeHistorySheet();
                this._closeModal();
            }
        });

        AudioEngine.onStateChange((state) => this._handleStateChange(state));

        this._updateMetadata();
        setInterval(() => this._updateMetadata(), CONFIG.UI.POLLING_INTERVAL);

        this._updateVolume(CONFIG.UI.DEFAULT_VOLUME);

        // Contador animado de oyentes
        this._startListenerCounter();

        if (CONFIG.PLAYLIST.ENABLE) {
            this.playlistUI = new PlaylistUI('weeklyPlaylistContainer');
            this.playlistUI.render();
        }

        this._renderAppContent();
        this._renderFavorites();
        this._updateFavoriteButton();
    }

    _applyRuntimeConfig() {
        document.title = `${CONFIG.BRAND.NAME} | ${CONFIG.BRAND.SLOGAN}`;
        if (/^#[0-9a-f]{6}$/i.test(CONFIG.VISUAL?.accentColor || '')) {
            document.documentElement.style.setProperty('--accent', CONFIG.VISUAL.accentColor);
        }
        document.querySelectorAll('.brand-logo-img').forEach(logo => {
            logo.src = CONFIG.BRAND.LOGO;
            logo.alt = CONFIG.BRAND.NAME;
        });
        document.querySelectorAll('.brand-slogan').forEach(label => {
            label.textContent = CONFIG.BRAND.SLOGAN;
        });

        const features = CONFIG.FEATURES || {};
        this._toggleFeatureElement(this.dom.quickRequestBtn, features.requests);
        this._toggleFeatureElement(this.dom.requestSongBtn, features.requests);
        this._toggleFeatureElement(this.dom.quickSleepBtn, features.sleepTimer);
        this._toggleFeatureElement(this.dom.sleepTimerBtn, features.sleepTimer);
        this._toggleFeatureElement(this.dom.openHistoryBtn, features.history);
        this._toggleFeatureElement(this.dom.favoriteTrackBtn, features.favorites);

        document.querySelectorAll('[data-feature]').forEach(element => {
            element.hidden = features[element.dataset.feature] === false;
        });
        document.querySelectorAll('[data-target-view="programs"], [data-jump-view="programs"]').forEach(element => {
            element.hidden = features.programs === false;
        });
        document.getElementById('view-programs')?.toggleAttribute('hidden', features.programs === false);

        const heroImage = this._resolveImage(CONFIG.VISUAL?.heroImage, 'assets/img/brand/hero-world-wide.png');
        document.querySelectorAll('.hero-live-card').forEach(card => {
            card.style.setProperty('--hero-image', `url("${heroImage}")`);
        });
    }

    _toggleFeatureElement(element, enabled) {
        if (!element) return;
        element.hidden = enabled === false;
    }

    _startListenerCounter() {
        // Los datos vienen de la API real del stream
        // ulistener = oyentes únicos, listeners = conexiones totales activas
        // Se actualiza junto con el polling de metadatos (_updateMetadata)
        // Este método solo inicializa la UI con valores de espera
        if (this.dom.liveListeners)
            this.dom.liveListeners.textContent = '...';
        if (this.dom.totalConnections)
            this.dom.totalConnections.textContent = '...';
    }

    _updateListenerStats(data) {
        const parsedLive = Number.parseInt(data.ulistener || data.listeners || 0, 10);
        const live = Number.isFinite(parsedLive) && parsedLive > 0 ? Math.min(parsedLive, 1000000) : 0;

        // ── Acumulado de conexiones ──────────────────────────────────
        // Cada vez que el conteo de oyentes sube, significa que
        // nuevas personas se conectaron → sumamos esa diferencia al total.
        // Se guarda en localStorage para que nunca se pierda.

        const STORAGE_TOTAL = 'wxm_cumulative_connections';
        const STORAGE_PREV  = 'wxm_prev_listeners';

        const parsedCumulative = Number.parseInt(localStorage.getItem(STORAGE_TOTAL) || '0', 10);
        const parsedPrev = Number.parseInt(localStorage.getItem(STORAGE_PREV) || '0', 10);
        let cumulative = Number.isFinite(parsedCumulative) && parsedCumulative > 0 ? parsedCumulative : 0;
        const prevListeners = Number.isFinite(parsedPrev) && parsedPrev > 0 ? parsedPrev : 0;

        if (live > prevListeners) {
            // Hay más oyentes que antes → nuevas conexiones entraron
            cumulative += (live - prevListeners);
            localStorage.setItem(STORAGE_TOTAL, cumulative.toString());
        }

        // Siempre guardamos el valor actual para comparar en el próximo poll
        localStorage.setItem(STORAGE_PREV, live.toString());

        const fmt = n => n.toLocaleString('es-ES');

        if (this.dom.liveListeners)
            this.dom.liveListeners.textContent = fmt(live);
        if (this.dom.totalConnections)
            this.dom.totalConnections.textContent = fmt(cumulative);
        AnalyticsService.trackAudienceSnapshot(live, cumulative);
    }

    _togglePlay() {
        if (AudioEngine.state === PlayerState.PLAYING || AudioEngine.state === PlayerState.LOADING) {
            AnalyticsService.track('play_pause_request', { state: AudioEngine.state });
            AudioEngine.pause();
        } else {
            AnalyticsService.track('play_request', {
                stationId: CONFIG.ANALYTICS?.stationId || 'main',
                streamRole: 'primary'
            });
            AudioEngine.play();
            if (AudioEngine.supportsVisualizer()) {
                this._startVisualizer();
            }
        }
    }

    _handleStateChange(state) {
        AnalyticsService.trackPlaybackState(state);
        switch (state) {
            case PlayerState.PLAYING:
                if (this.dom.playIcon) this.dom.playIcon.className = 'fas fa-pause';
                if (this.dom.homePlayIcon) this.dom.homePlayIcon.className = 'fas fa-pause';
                if (this.dom.miniPlayIcon) this.dom.miniPlayIcon.className = 'fas fa-pause';
                if (this.dom.miniPlayerState) this.dom.miniPlayerState.textContent = 'En vivo';
                this.dom.playBtn?.classList.add('playing');
                this.dom.playBtn?.classList.add('ctrl-play');
                break;
            case PlayerState.LOADING:
            case PlayerState.RECONNECTING:
                if (this.dom.playIcon) this.dom.playIcon.className = 'fas fa-spinner fa-spin';
                if (this.dom.homePlayIcon) this.dom.homePlayIcon.className = 'fas fa-spinner fa-spin';
                if (this.dom.miniPlayIcon) this.dom.miniPlayIcon.className = 'fas fa-spinner fa-spin';
                if (this.dom.miniPlayerState) this.dom.miniPlayerState.textContent = 'Conectando';
                break;
            default:
                if (this.dom.playIcon) this.dom.playIcon.className = 'fas fa-play';
                if (this.dom.homePlayIcon) this.dom.homePlayIcon.className = 'fas fa-play';
                if (this.dom.miniPlayIcon) this.dom.miniPlayIcon.className = 'fas fa-play';
                if (this.dom.miniPlayerState) this.dom.miniPlayerState.textContent = state === PlayerState.ERROR ? 'Error' : 'En vivo';
                this.dom.playBtn?.classList.remove('playing');
        }
    }

    async _updateMetadata() {
        const data = await MetadataService.fetchInfo();
        if (!data) return;

        // Actualizar estadísticas de oyentes con datos reales
        this._updateListenerStats(data);

        const currentTrack = data.title;
        if (currentTrack === MetadataService.lastTitle) return;

        MetadataService.lastTitle = currentTrack;
        
        // Limpiar el nombre de la pista
        const cleanTrack = MetadataService.getCleanTrackName(currentTrack);

        // Update UI Text
        const [artist, title] = cleanTrack.split(' - ').length > 1 ? cleanTrack.split(' - ') : ['WXM Radio', cleanTrack];
        this.currentTrack = {
            title: title || cleanTrack,
            artist: artist || 'WXM Radio',
            cover: null
        };
        this.dom.trackTitle.textContent = title || currentTrack;
        this.dom.trackArtist.textContent = artist || 'WXM Radio';
        if (this.dom.homeTrackTitle) this.dom.homeTrackTitle.textContent = title || currentTrack;
        if (this.dom.homeTrackArtist) this.dom.homeTrackArtist.textContent = artist || 'WXM Radio';
        if (this.dom.miniTrackTitle) this.dom.miniTrackTitle.textContent = title || currentTrack;
        if (this.dom.miniTrackArtist) this.dom.miniTrackArtist.textContent = artist || 'WXM Radio';

        // Update Artwork with Intelligent State
        const cover = await MetadataService.getCover(currentTrack);
        const artworkWrapper = this.dom.container;
        
        if (MetadataService.isSafeImageUrl(cover)) {
            this.currentTrack.cover = cover;
            this.dom.artwork.src = cover;
            if (this.dom.miniArtwork) this.dom.miniArtwork.src = cover;
            artworkWrapper?.classList.remove('has-no-artwork');
        } else {
            this.dom.artwork.src = CONFIG.BRAND.LOGO;
            if (this.dom.miniArtwork) this.dom.miniArtwork.src = CONFIG.BRAND.LOGO;
            artworkWrapper?.classList.add('has-no-artwork');
        }
        AudioEngine.updateMetadata(this.currentTrack);

        // Actualizar marquesina con canción actual
        const marqueeTexts = document.querySelectorAll('.wxm-marquee-text');
        const songInfo = `${artist} - ${title}`;
        marqueeTexts.forEach(el => {
            el.textContent = `LA RADIO QUE CONECTA AL MUNDO \u00a0•\u00a0 SONANDO: ${songInfo} \u00a0•\u00a0 `;
        });

        // Update Weekly Playlist Engine
        PlaylistEngine.addTrack({
            title: title || cleanTrack,
            artist: artist || 'WXM Radio',
            cover: cover
        });
        AnalyticsService.track('metadata_changed', {
            title: title || cleanTrack,
            artist: artist || 'WXM Radio'
        });

        // Import History if available (for initial load)
        if (data.history) {
            PlaylistEngine.addHistory(data.history);
        }

        if (this.playlistUI) this.playlistUI.refresh();
        this._updateFavoriteButton();
    }

    _updateVolume(val) {
        AudioEngine.setVolume(val);
        this.dom.volumeSlider.value = val;
    }

    _toggleMute() {
        this.isMuted = !this.isMuted;
        AudioEngine.mute(this.isMuted);
        this.dom.muteBtn.className = this.isMuted ? 'fas fa-volume-mute volume-icon' : 'fas fa-volume-up volume-icon';
    }

    _toggleTheme() {
        this.isDark = !this.isDark;
        document.body.classList.toggle('light-theme', !this.isDark);
        const icon = this.dom.themeBtn?.querySelector('i');
        if (icon) icon.className = this.isDark ? 'fas fa-moon' : 'fas fa-sun';
        localStorage.setItem('wxm_theme', this.isDark ? 'dark' : 'light');
    }

    _syncStream() {
        AnalyticsService.track('stream_sync_requested');
        AudioEngine.stop();
        setTimeout(() => AudioEngine.play(), 100);
    }

    _startVisualizer() {
        if (!AudioEngine.supportsVisualizer() || !this.dom.visualizer || !this.ctx) return;

        const { analyzer } = AudioEngine.getAudioContext();
        if (!analyzer) return;
        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (AudioEngine.state !== PlayerState.PLAYING) return;
            requestAnimationFrame(draw);

            analyzer.getByteFrequencyData(dataArray);

            if (!this.ctx || !this.dom.visualizer) return;
            this.ctx.clearRect(0, 0, this.dom.visualizer.width, this.dom.visualizer.height);
            
            const barWidth = (this.dom.visualizer.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for(let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;
                this.ctx.fillStyle = `rgba(233, 30, 99, ${barHeight/100})`;
                this.ctx.fillRect(x, this.dom.visualizer.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        };

        draw();
    }

    _share() {
        if (navigator.share) {
            navigator.share({
                title: CONFIG.BRAND.NAME,
                text: CONFIG.BRAND.SLOGAN,
                url: window.location.href
            });
        }
    }

    _resolveImage(src, fallback = CONFIG.BRAND.LOGO) {
        const value = String(src || '').trim();
        if (value.startsWith('assets/img/')) return value;
        try {
            const url = new URL(value);
            return url.protocol === 'https:' ? value : fallback;
        } catch {
            return fallback;
        }
    }

    _openExternalOrToast(url, label = 'Contenido') {
        const value = String(url || '').trim();
        if (!value) {
            this._toast(`${label} preparado para CMS remoto`);
            return;
        }
        try {
            const parsed = new URL(value);
            if (parsed.protocol !== 'https:') throw new Error('unsafe');
            window.open(value, '_blank', 'noopener,noreferrer');
        } catch {
            this._toast('URL no segura o no disponible');
        }
    }

    _showView(viewName) {
        document.body.dataset.currentView = viewName;
        document.querySelectorAll('.app-view').forEach(view => {
            view.classList.toggle('active', view.dataset.view === viewName);
        });
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.targetView === viewName);
        });
        AnalyticsService.track('view_opened', { view: viewName });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    _renderAppContent() {
        this.content = this._getRuntimeContent();
        this._renderEmergency();
        this._renderBanners(this.dom.homeBanners, this.content.banners.filter(item => item.placement !== 'explore').slice(0, 2));
        this._renderBanners(this.dom.exploreBanners, this.content.banners);
        this._renderHomeSchedule();
        this._renderHighlights(this.dom.homeHighlights, this.content.highlights.slice(0, 2));
        this._renderHighlights(this.dom.exploreList, this.content.highlights);
        this._renderCmsSections();
        this._renderPrograms();
        this._renderPresenters();
        this._renderArticles();
        this._renderPodcasts();
        this._renderStations();
        this._renderPolls();
        this._renderSponsors(this.dom.homeSponsors, this.content.sponsors.slice(0, 1));
        this._renderSponsors(this.dom.sponsorList, this.content.sponsors);
        this._renderAudioExperienceCard();
    }

    _getRuntimeContent() {
        const pick = key => Array.isArray(CONFIG.CONTENT?.[key]) && CONFIG.CONTENT[key].length
            ? CONFIG.CONTENT[key]
            : APP_CONTENT[key];
        return {
            schedule: pick('schedule'),
            highlights: pick('highlights'),
            banners: pick('banners'),
            presenters: pick('presenters'),
            articles: pick('articles'),
            podcasts: pick('podcasts'),
            stations: pick('stations'),
            polls: pick('polls'),
            sponsors: pick('sponsors')
        };
    }

    _renderEmergency() {
        if (!this.dom.emergencyBanner) return;
        const config = CONFIG.EMERGENCY || {};
        const visible = CONFIG.FEATURES?.emergencyMode !== false && config.enabled === true && (config.title || config.message);
        this.dom.emergencyBanner.hidden = !visible;
        this.dom.emergencyBanner.replaceChildren();
        if (!visible) return;

        this.dom.emergencyBanner.className = `emergency-alert ${config.severity || 'info'}`;
        const icon = document.createElement('i');
        icon.className = 'fas fa-triangle-exclamation';
        const body = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = config.title || 'Aviso WXM';
        const copy = document.createElement('span');
        copy.textContent = config.message || 'Tenemos una actualizacion operativa.';
        body.append(title, copy);
        this.dom.emergencyBanner.append(icon, body);
    }

    _renderBanners(container, items) {
        if (!container) return;
        container.replaceChildren();
        if (!this._featureAllows(container) || !items.length) {
            container.hidden = true;
            return;
        }
        container.hidden = false;
        const nodes = items.map(item => {
            const card = document.createElement('article');
            card.className = 'broadcast-banner';
            const image = this._resolveImage(item.image, CONFIG.VISUAL?.heroImage || CONFIG.BRAND.LOGO);
            card.style.setProperty('--banner-image', `url("${image}")`);

            const body = document.createElement('div');
            const meta = document.createElement('span');
            meta.className = 'section-kicker';
            meta.textContent = item.meta || 'WXM';
            const title = document.createElement('strong');
            title.textContent = item.title;
            const copy = document.createElement('p');
            copy.textContent = item.body;
            body.append(meta, title, copy);

            if (item.ctaLabel) {
                const cta = document.createElement('button');
                cta.className = 'text-action banner-action';
                cta.type = 'button';
                cta.textContent = item.ctaLabel;
                cta.addEventListener('click', () => {
                    AnalyticsService.track('banner_opened', { title: item.title, placement: item.placement || 'home' });
                    this._openExternalOrToast(item.ctaUrl, item.ctaLabel);
                });
                body.appendChild(cta);
            }

            card.appendChild(body);
            return card;
        });
        container.append(...nodes);
    }

    _renderHomeSchedule() {
        if (!this.dom.homeSchedule) return;
        const schedule = this.content.schedule;
        if (!schedule.length) {
            this.dom.homeSchedule.replaceChildren();
            return;
        }
        const now = this._getCurrentProgramIndex();
        const next = (now + 1) % schedule.length;
        this.dom.homeSchedule.replaceChildren(
            this._programMiniCard('Ahora', schedule[now]),
            this._programMiniCard('Siguiente', schedule[next])
        );
    }

    _programMiniCard(label, program) {
        const card = document.createElement('article');
        card.className = 'program-mini-card';

        const badge = document.createElement('span');
        badge.className = 'mini-label';
        badge.textContent = label;

        const title = document.createElement('strong');
        title.textContent = program.title;

        const meta = document.createElement('span');
        meta.textContent = `${program.time} · ${program.host}`;

        card.appendChild(badge);
        card.appendChild(title);
        card.appendChild(meta);
        return card;
    }

    _renderPrograms() {
        if (!this.dom.programsList) return;
        const nodes = this.content.schedule.map(program => {
            const card = document.createElement('article');
            card.className = 'program-card';

            const media = document.createElement('div');
            media.className = 'program-media';
            if (program.image) {
                const img = document.createElement('img');
                img.src = this._resolveImage(program.image, CONFIG.BRAND.LOGO);
                img.alt = program.title;
                media.appendChild(img);
            } else {
                const time = document.createElement('span');
                time.className = 'program-time';
                time.textContent = program.time;
                media.appendChild(time);
            }

            const body = document.createElement('div');
            const title = document.createElement('strong');
            title.textContent = program.title;
            const host = document.createElement('span');
            host.textContent = `${program.host} · ${program.tag}`;
            const details = document.createElement('small');
            details.textContent = [program.time, program.genre, program.description].filter(Boolean).join(' · ');
            body.appendChild(title);
            body.appendChild(host);
            if (details.textContent) body.appendChild(details);

            const remind = document.createElement('button');
            remind.className = 'icon-btn small';
            remind.title = 'Recordar';
            const bell = document.createElement('i');
            bell.className = 'far fa-bell';
            remind.appendChild(bell);
            remind.addEventListener('click', () => this._toast(`Recordatorio local: ${program.title}`));

            card.appendChild(media);
            card.appendChild(body);
            card.appendChild(remind);
            return card;
        });
        this.dom.programsList.replaceChildren(...nodes);
    }

    _renderHighlights(container, items) {
        if (!container) return;
        const nodes = items.map(item => {
            const card = document.createElement('article');
            card.className = item.image ? 'editorial-card with-image' : 'editorial-card';

            const media = item.image ? document.createElement('img') : document.createElement('i');
            if (item.image) {
                media.className = 'editorial-image';
                media.src = this._resolveImage(item.image, CONFIG.BRAND.LOGO);
                media.alt = item.title;
            } else {
                media.className = `fas ${item.icon}`;
            }

            const body = document.createElement('div');
            const meta = document.createElement('span');
            meta.className = 'editorial-meta';
            meta.textContent = item.meta;
            const title = document.createElement('strong');
            title.textContent = item.title;
            const copy = document.createElement('p');
            copy.textContent = item.body;
            body.appendChild(meta);
            body.appendChild(title);
            body.appendChild(copy);
            if (item.ctaLabel) {
                const cta = document.createElement('button');
                cta.className = 'inline-link';
                cta.type = 'button';
                cta.textContent = item.ctaLabel;
                cta.addEventListener('click', () => {
                    AnalyticsService.track('editorial_highlight_opened', { title: item.title, meta: item.meta });
                    this._openExternalOrToast(item.ctaUrl, item.ctaLabel);
                });
                body.appendChild(cta);
            }

            card.appendChild(media);
            card.appendChild(body);
            return card;
        });
        container.replaceChildren(...nodes);
    }

    _renderCmsSections() {
        const rails = this._getCmsRails();

        if (this.dom.homeCmsRails) {
            this.dom.homeCmsRails.replaceChildren();
            this.dom.homeCmsRails.hidden = true;
        }

        this._renderCmsRailStack(this.dom.exploreRails, [
            rails.secondaryStations,
            rails.podcasts,
            rails.news,
            rails.presenters,
            rails.polls,
            rails.sponsors
        ], { maxItemsPerRail: 8 });
    }

    _getCmsRails() {
        return {
            secondaryStations: {
                feature: 'secondaryStations',
                type: 'station',
                title: 'Radios WXM',
                action: 'Ver todo',
                items: this.content.stations
            },
            podcasts: {
                feature: 'podcasts',
                type: 'podcast',
                title: 'Podcasts / Replays',
                action: 'Explorar',
                items: this.content.podcasts
            },
            news: {
                feature: 'news',
                type: 'article',
                title: 'Noticias y cultura',
                action: 'Ver mas',
                items: this.content.articles
            },
            presenters: {
                feature: 'presenters',
                type: 'presenter',
                title: 'Locutores / DJs',
                action: 'Perfiles',
                items: this.content.presenters
            },
            polls: {
                feature: 'polls',
                type: 'poll',
                title: 'Encuestas',
                action: 'Participar',
                items: this.content.polls
            },
            sponsors: {
                feature: 'sponsors',
                type: 'sponsor',
                title: 'Aliados WXM',
                action: 'Ver',
                items: this.content.sponsors
            }
        };
    }

    _renderCmsRailStack(container, rails, options = {}) {
        if (!container) return;
        const visibleRails = rails
            .filter(Boolean)
            .filter(rail => this._cmsFeatureEnabled(rail.feature))
            .map(rail => ({
                ...rail,
                items: Array.isArray(rail.items)
                    ? rail.items.slice(0, options.maxItemsPerRail || 8)
                    : []
            }))
            .filter(rail => rail.items.length);

        container.replaceChildren();
        container.hidden = !visibleRails.length;
        container.classList.toggle('compact-cms-rails', options.compact === true);
        if (container.hidden) return;

        container.append(...visibleRails.map(rail => this._cmsRailNode(rail)));
    }

    _cmsFeatureEnabled(feature) {
        return !feature || CONFIG.FEATURES?.[feature] !== false;
    }

    _cmsRailNode(rail) {
        const section = document.createElement('section');
        section.className = `cms-rail cms-rail-${rail.type}`;

        const heading = document.createElement('div');
        heading.className = 'section-row compact cms-rail-heading';
        const title = document.createElement('h3');
        title.textContent = rail.title;
        const action = document.createElement('button');
        action.className = 'text-action';
        action.type = 'button';
        action.textContent = rail.action;
        action.addEventListener('click', () => {
            AnalyticsService.track('cms_rail_action', { rail: rail.type });
            this._toast(`${rail.title} listo para CMS remoto`);
        });
        heading.append(title, action);

        const scroller = document.createElement('div');
        scroller.className = 'cms-rail-scroll';
        scroller.append(...rail.items.map(item => this._cmsCardNode(item, rail.type)));

        section.append(heading, scroller);
        return section;
    }

    _cmsCardNode(item, type) {
        const normalized = this._normalizeCmsCard(item, type);
        const card = document.createElement('article');
        card.className = `cms-card cms-card-${type}`;
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', normalized.title);

        if (normalized.image) {
            card.appendChild(this._image(normalized.image, normalized.title, 'cms-card-image'));
        }

        const body = document.createElement('div');
        const badge = document.createElement('span');
        badge.className = 'cms-card-badge';
        badge.textContent = normalized.badge;
        const title = document.createElement('strong');
        title.textContent = normalized.title;
        const subtitle = document.createElement('small');
        subtitle.textContent = normalized.subtitle;
        const copy = document.createElement('p');
        copy.className = 'cms-card-copy';
        copy.textContent = normalized.body;
        body.append(badge, title);
        if (normalized.subtitle) body.appendChild(subtitle);
        if (normalized.body) body.appendChild(copy);

        card.appendChild(body);
        card.addEventListener('click', () => this._openCmsContentDetail(normalized));
        card.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this._openCmsContentDetail(normalized);
            }
        });
        return card;
    }

    _normalizeCmsCard(item, type) {
        const fallbackImage = CONFIG.VISUAL?.heroImage || CONFIG.BRAND.LOGO;
        const maps = {
            station: {
                title: item.name,
                subtitle: item.description,
                badge: item.streamUrl ? 'Live' : 'WXM',
                body: item.description || 'Canal WXM preparado desde CMS.',
                image: item.image
            },
            podcast: {
                title: item.title,
                subtitle: `${item.show || 'WXM'} · ${item.episodes || 0} episodios`,
                badge: 'Podcast',
                body: item.description || 'Serie preparada para replays y entrevistas.',
                image: item.image,
                url: item.url
            },
            article: {
                title: item.title,
                subtitle: [item.category, item.publishedAt].filter(Boolean).join(' · '),
                badge: item.category || 'News',
                body: item.excerpt || 'Contenido editorial WXM.',
                image: item.image,
                url: item.url
            },
            presenter: {
                title: item.name,
                subtitle: [item.role, item.program].filter(Boolean).join(' · '),
                badge: 'Cabina',
                body: item.bio || 'Perfil de locutor preparado desde CMS.',
                image: item.image,
                url: item.website || item.instagram
            },
            poll: {
                title: item.question,
                subtitle: item.meta || 'Encuesta activa',
                badge: 'Vota',
                body: Array.isArray(item.options) ? item.options.join(' · ') : 'Participacion WXM.',
                image: item.image,
                options: item.options || []
            },
            sponsor: {
                title: item.title,
                subtitle: item.brand || 'Aliado WXM',
                badge: 'Sponsor',
                body: item.body || 'Modulo comercial controlado desde CMS.',
                image: item.image,
                url: item.url
            }
        };
        const data = maps[type] || maps.article;
        return {
            type,
            title: data.title || 'WXM',
            subtitle: data.subtitle || '',
            badge: data.badge || 'WXM',
            body: data.body || '',
            image: this._resolveImage(data.image, fallbackImage),
            url: data.url || '',
            options: data.options || []
        };
    }

    _openCmsContentDetail(item) {
        AnalyticsService.track('cms_content_opened', { type: item.type, title: item.title });
        const body = document.createElement('div');
        body.className = 'cms-detail';

        const hero = document.createElement('div');
        hero.className = 'cms-detail-hero';
        const img = this._image(item.image, item.title, 'cms-detail-image');
        const heroCopy = document.createElement('div');
        const badge = document.createElement('span');
        badge.className = 'section-kicker';
        badge.textContent = item.badge;
        const title = document.createElement('strong');
        title.textContent = item.title;
        const subtitle = document.createElement('small');
        subtitle.textContent = item.subtitle;
        heroCopy.append(badge, title);
        if (item.subtitle) heroCopy.appendChild(subtitle);
        hero.append(img, heroCopy);

        const copy = document.createElement('p');
        copy.className = 'cms-detail-copy';
        copy.textContent = item.body;
        body.append(hero, copy);

        if (item.type === 'poll' && item.options.length) {
            const options = document.createElement('div');
            options.className = 'poll-options';
            item.options.forEach(option => {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = option;
                button.addEventListener('click', () => this._toast(`Voto local registrado: ${option}`));
                options.appendChild(button);
            });
            body.appendChild(options);
        } else {
            const action = document.createElement('button');
            action.className = 'primary-action';
            action.type = 'button';
            action.textContent = item.url ? 'Abrir contenido' : 'Preparado para CMS';
            action.addEventListener('click', () => this._openExternalOrToast(item.url, item.title));
            body.appendChild(action);
        }

        this._openModal(item.title, body);
    }

    _renderPresenters() {
        if (!this.dom.presentersList) return;
        this._renderCards(this.dom.presentersList, this.content.presenters, item => {
            const card = document.createElement('article');
            card.className = 'presenter-card';
            const img = this._image(item.image, item.name, 'presenter-photo');
            const body = document.createElement('div');
            const name = document.createElement('strong');
            name.textContent = item.name;
            const meta = document.createElement('span');
            meta.textContent = [item.role, item.program].filter(Boolean).join(' · ');
            const bio = document.createElement('p');
            bio.textContent = item.bio || 'Talento WXM.';
            body.append(name, meta, bio);
            card.append(img, body);
            return card;
        });
    }

    _renderArticles() {
        this._renderMediaCards(this.dom.articleList, this.content.articles, 'article');
    }

    _renderPodcasts() {
        this._renderMediaCards(this.dom.podcastList, this.content.podcasts, 'podcast');
    }

    _renderMediaCards(container, items, type) {
        this._renderCards(container, items, item => {
            const card = document.createElement('article');
            card.className = 'media-card';
            const img = this._image(item.image, item.title, 'media-thumb');
            const body = document.createElement('div');
            const meta = document.createElement('span');
            meta.className = 'editorial-meta';
            meta.textContent = type === 'podcast'
                ? `${item.show || 'WXM'} · ${item.episodes || 0} episodios`
                : `${item.category || 'WXM'} ${item.publishedAt ? `· ${item.publishedAt}` : ''}`;
            const title = document.createElement('strong');
            title.textContent = item.title;
            const copy = document.createElement('p');
            copy.textContent = item.description || item.excerpt || 'Contenido WXM.';
            body.append(meta, title, copy);
            card.append(img, body);
            card.addEventListener('click', () => {
                AnalyticsService.track(type === 'podcast' ? 'podcast_viewed' : 'article_viewed', { title: item.title });
                this._openExternalOrToast(item.url, item.title);
            });
            return card;
        });
    }

    _renderStations() {
        this._renderCards(this.dom.stationList, this.content.stations.filter(item => item.enabled !== false), item => {
            const card = document.createElement('article');
            card.className = 'station-card';
            const img = this._image(item.image, item.name, 'station-thumb');
            const body = document.createElement('div');
            const title = document.createElement('strong');
            title.textContent = item.name;
            const copy = document.createElement('span');
            copy.textContent = item.description || 'Canal WXM.';
            const action = document.createElement('button');
            action.className = 'inline-link';
            action.type = 'button';
            action.textContent = item.streamUrl ? 'Canal preparado' : 'Próximamente';
            action.addEventListener('click', () => {
                AnalyticsService.track('secondary_station_selected', { stationId: item.name, streamRole: 'secondary' });
                this._toast('Los canales secundarios ya estan listos en CMC; el cambio real de stream entra en fase de backend remoto.');
            });
            body.append(title, copy, action);
            card.append(img, body);
            return card;
        });
    }

    _renderPolls() {
        this._renderCards(this.dom.pollList, this.content.polls, item => {
            const card = document.createElement('article');
            card.className = 'poll-card';
            if (item.image) card.appendChild(this._image(item.image, item.question, 'poll-image'));
            const meta = document.createElement('span');
            meta.className = 'editorial-meta';
            meta.textContent = item.meta || 'Encuesta';
            const title = document.createElement('strong');
            title.textContent = item.question;
            const options = document.createElement('div');
            options.className = 'poll-options';
            item.options.forEach(option => {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = option;
                button.addEventListener('click', () => {
                    AnalyticsService.track('poll_voted', { poll: item.question, option });
                    this._toast(`Voto local registrado: ${option}`);
                });
                options.appendChild(button);
            });
            card.append(meta, title, options);
            return card;
        });
    }

    _renderSponsors(container, items) {
        this._renderCards(container, items, item => {
            const card = document.createElement('article');
            card.className = 'sponsor-card';
            const img = this._image(item.image, item.title, 'sponsor-thumb');
            const body = document.createElement('div');
            const meta = document.createElement('span');
            meta.className = 'editorial-meta';
            meta.textContent = item.brand || 'Aliado WXM';
            const title = document.createElement('strong');
            title.textContent = item.title;
            const copy = document.createElement('p');
            copy.textContent = item.body || '';
            body.append(meta, title, copy);
            card.append(img, body);
            card.addEventListener('click', () => {
                AnalyticsService.track('sponsor_opened', { title: item.title, brand: item.brand });
                this._openExternalOrToast(item.url, item.title);
            });
            return card;
        });
    }

    _renderAudioExperienceCard() {
        const label = this.dom.audioExperienceCard?.querySelector('span');
        if (!label) return;
        const profile = CONFIG.AUDIO_EXPERIENCE?.recommendedProfile || 'standard';
        label.textContent = `Audio WXM · ${profile}`;
    }

    _renderCards(container, items, renderer) {
        if (!container) return;
        container.replaceChildren();
        const safeItems = Array.isArray(items) ? items : [];
        container.hidden = !this._featureAllows(container) || !safeItems.length;
        if (container.hidden) return;
        container.append(...safeItems.map(renderer));
    }

    _featureAllows(container) {
        const feature = container?.dataset?.feature;
        return !feature || CONFIG.FEATURES?.[feature] !== false;
    }

    _image(src, alt, className) {
        const img = document.createElement('img');
        img.className = className;
        img.src = this._resolveImage(src, CONFIG.BRAND.LOGO);
        img.alt = alt || CONFIG.BRAND.NAME;
        img.loading = 'lazy';
        return img;
    }

    _getCurrentProgramIndex() {
        const schedule = this.content.schedule;
        if (!schedule.length) return 0;
        const hour = new Date().getHours();
        const starts = schedule.map(item => Number.parseInt(item.time.split(':')[0], 10));
        let index = 0;
        starts.forEach((start, i) => {
            if (hour >= start) index = i;
        });
        return index;
    }

    _loadFavorites() {
        try {
            const parsed = JSON.parse(localStorage.getItem('wxm_favorites') || '[]');
            return Array.isArray(parsed) ? parsed.slice(0, 100).filter(item => item?.title && item?.artist) : [];
        } catch {
            localStorage.removeItem('wxm_favorites');
            return [];
        }
    }

    _saveFavorites() {
        localStorage.setItem('wxm_favorites', JSON.stringify(this.favorites.slice(0, 100)));
    }

    _trackKey(track) {
        return `${track.artist}::${track.title}`.toLowerCase();
    }

    _toggleFavoriteCurrent() {
        const track = {
            title: String(this.currentTrack.title || '').slice(0, 120),
            artist: String(this.currentTrack.artist || 'WXM Radio').slice(0, 120),
            cover: MetadataService.isSafeImageUrl(this.currentTrack.cover) ? this.currentTrack.cover : null,
            savedAt: new Date().toISOString()
        };
        if (!track.title || track.title === 'Cargando...') return;

        const key = this._trackKey(track);
        const exists = this.favorites.some(item => this._trackKey(item) === key);
        this.favorites = exists
            ? this.favorites.filter(item => this._trackKey(item) !== key)
            : [track, ...this.favorites].slice(0, 100);
        this._saveFavorites();
        this._renderFavorites();
        this._updateFavoriteButton();
        AnalyticsService.track(exists ? 'favorite_removed' : 'favorite_added', {
            title: track.title,
            artist: track.artist
        });
    }

    _updateFavoriteButton() {
        if (!this.dom.favoriteTrackBtn) return;
        const exists = this.favorites.some(item => this._trackKey(item) === this._trackKey(this.currentTrack));
        const icon = this.dom.favoriteTrackBtn.querySelector('i');
        const label = this.dom.favoriteTrackBtn.querySelector('span');
        if (icon) icon.className = exists ? 'fas fa-heart' : 'far fa-heart';
        if (label) label.textContent = exists ? 'Guardada' : 'Guardar';
        this.dom.favoriteTrackBtn.classList.toggle('active', exists);
    }

    _renderFavorites() {
        if (this.dom.favoritesCount) {
            this.dom.favoritesCount.textContent = `${this.favorites.length} canciones guardadas`;
        }
        if (!this.dom.favoritesList) return;
        if (!this.favorites.length) {
            const empty = document.createElement('div');
            empty.className = 'empty-playlist';
            empty.textContent = 'Guarda canciones desde En vivo para verlas aqui.';
            this.dom.favoritesList.replaceChildren(empty);
            return;
        }
        const nodes = this.favorites.map(track => {
            const item = document.createElement('article');
            item.className = 'favorite-item';
            const icon = document.createElement('i');
            icon.className = 'fas fa-music';
            const body = document.createElement('div');
            const title = document.createElement('strong');
            title.textContent = track.title;
            const artist = document.createElement('span');
            artist.textContent = track.artist;
            body.appendChild(title);
            body.appendChild(artist);
            item.appendChild(icon);
            item.appendChild(body);
            return item;
        });
        this.dom.favoritesList.replaceChildren(...nodes);
    }

    _clearFavorites() {
        this.favorites = [];
        this._saveFavorites();
        this._renderFavorites();
        this._updateFavoriteButton();
    }

    _openSleepTimer() {
        const body = document.createElement('div');
        body.className = 'modal-action-grid';
        [15, 30, 45, 60].forEach(minutes => {
            const button = document.createElement('button');
            button.className = 'modal-action-btn';
            button.textContent = `${minutes} min`;
            button.addEventListener('click', () => {
                clearTimeout(this.sleepTimerId);
                this.sleepTimerId = setTimeout(() => AudioEngine.stop(), minutes * 60 * 1000);
                this._closeModal();
                this._toast(`Sleep timer activo: ${minutes} minutos`);
            });
            body.appendChild(button);
        });
        this._openModal('Sleep timer', body);
    }

    _openRequestSong() {
        const form = document.createElement('form');
        form.className = 'request-form';
        const name = this._input('Tu nombre', 'text', 40);
        const song = this._input('Cancion o artista', 'text', 80);
        const message = this._input('Mensaje para cabina', 'text', 120);
        const submit = document.createElement('button');
        submit.className = 'primary-action';
        submit.type = 'submit';
        submit.textContent = 'Enviar peticion';
        form.appendChild(name);
        form.appendChild(song);
        form.appendChild(message);
        form.appendChild(submit);
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            AnalyticsService.track('request_song_submitted', {
                song: song.value,
                sourceClient: CONFIG.ANALYTICS?.sourceClient || 'wxm_web_app'
            });
            this._closeModal();
            this._toast('Peticion guardada localmente para conectar con cabina.');
        });
        this._openModal('Pedir cancion', form);
    }

    _input(placeholder, type, maxLength) {
        const input = document.createElement('input');
        input.type = type;
        input.placeholder = placeholder;
        input.maxLength = maxLength;
        input.required = true;
        return input;
    }

    _openContact() {
        const body = document.createElement('div');
        body.className = 'modal-copy';
        const title = document.createElement('strong');
        title.textContent = 'Cabina WXM';
        const copy = document.createElement('p');
        copy.textContent = 'Conecta esta accion con WhatsApp Business, email o un panel de peticiones cuando tengas backend.';
        body.appendChild(title);
        body.appendChild(copy);
        this._openModal('Contacto', body);
    }

    _openPrivacy() {
        const body = document.createElement('div');
        body.className = 'modal-copy';
        const copy = document.createElement('p');
        copy.textContent = 'La app no guarda credenciales ni secretos. Los favoritos se guardan localmente en el dispositivo.';
        body.appendChild(copy);
        this._openModal('Privacidad', body);
    }

    _openAudioExperience() {
        const body = document.createElement('div');
        body.className = 'modal-copy';
        const title = document.createElement('strong');
        title.textContent = `Perfil recomendado: ${CONFIG.AUDIO_EXPERIENCE?.recommendedProfile || 'standard'}`;
        const copy = document.createElement('p');
        copy.textContent = CONFIG.AUDIO_EXPERIENCE?.lowDataMode
            ? 'Modo bajo consumo sugerido desde CMC. La app prioriza estabilidad y menor uso de datos.'
            : 'Audio WXM usa el motor nativo cuando la app corre en Android y mantiene fallback web seguro en navegador.';
        body.append(title, copy);
        this._openModal('Experiencia de audio', body);
    }

    _openLanguageSettings() {
        const body = document.createElement('div');
        body.className = 'nextgen-status-panel';

        const note = document.createElement('p');
        note.className = 'nextgen-status-note';
        note.textContent = 'Selecciona el idioma de la interfaz. Se guarda localmente y queda preparado para el CMC remoto.';

        const grid = document.createElement('div');
        grid.className = 'modal-action-grid';
        [
            ['system', 'Sistema'],
            ['es', 'Español'],
            ['en', 'English']
        ].forEach(([value, label]) => {
            const button = document.createElement('button');
            button.className = 'modal-action-btn';
            button.type = 'button';
            button.textContent = label;
            button.addEventListener('click', () => {
                localStorage.setItem('wxm_language', value);
                document.getElementById('languageLabel')?.replaceChildren(document.createTextNode(label));
                AnalyticsService.track('language_selected', { language: value });
                this._closeModal();
                this._toast(`Idioma guardado: ${label}`);
            });
            grid.appendChild(button);
        });

        body.append(note, grid);
        this._openModal('Idioma', body);
    }

    _openServiceStatus() {
        const body = document.createElement('div');
        body.className = 'nextgen-status-panel';
        const streamHost = this._safeHost(CONFIG.STREAM?.URL);
        const infoHost = this._safeHost(CONFIG.STREAM?.INFO_API);
        const analyticsHost = this._safeHost(CONFIG.ANALYTICS?.endpoint) || 'Local';
        const enabledFeatures = Object.entries(CONFIG.FEATURES || {}).filter(([, enabled]) => enabled === true).length;

        const grid = document.createElement('div');
        grid.className = 'nextgen-status-grid';
        [
            ['fa-radio', 'Stream', streamHost || 'Configurado'],
            ['fa-signal', 'Metadata', infoHost || 'API lista'],
            ['fa-route', 'Fallback', `${CONFIG.STREAM?.FALLBACK_URLS?.length || 0} secundarios`],
            ['fa-chart-line', 'Analítica', analyticsHost],
            ['fa-toggle-on', 'Funciones', `${enabledFeatures} activas`],
            ['fa-shield-halved', 'Seguridad', 'HTTPS obligatorio']
        ].forEach(item => grid.appendChild(this._statusCard(...item)));

        const note = document.createElement('p');
        note.className = 'nextgen-status-note';
        note.textContent = 'Este panel solo resume salud operativa para el usuario; las métricas profundas quedan en modo desarrollador y CMS.';

        body.append(grid, note);
        this._openModal('Estado del servicio', body);
    }

    _openCmsStatus() {
        const body = document.createElement('div');
        body.className = 'nextgen-status-panel';
        const status = CONFIG.CMC?.STATUS || {};
        const remoteEndpoint = localStorage.getItem(CONFIG.CMC?.REMOTE_ENDPOINT_STORAGE_KEY || 'wxm_cmc_endpoint') || '';

        const grid = document.createElement('div');
        grid.className = 'nextgen-status-grid';
        [
            ['fa-cloud-arrow-down', 'Fuente', status.source || 'local'],
            ['fa-code-branch', 'Revisión', status.revision || 'built-in'],
            ['fa-link', 'Endpoint', status.endpoint || 'CMC local'],
            ['fa-circle-check', 'Estado', status.error || (status.loaded ? 'OK' : 'Fallback local')],
            ['fa-server', 'Remoto', remoteEndpoint ? this._safeHost(remoteEndpoint) : 'No configurado'],
            ['fa-database', 'Cache', 'Local segura']
        ].forEach(item => grid.appendChild(this._statusCard(...item)));

        const note = document.createElement('p');
        note.className = 'nextgen-status-note';
        note.textContent = 'El CMC local mantiene la app funcional. Cuando publiques un CMS por HTTPS, la app puede leerlo sin actualizar APK.';

        body.append(grid, note);
        this._openModal('CMS / CMC', body);
    }

    _openEngineStatus() {
        const body = document.createElement('div');
        body.className = 'nextgen-status-panel';
        const native = AudioEngine.getNativeStatus?.() || {};
        const network = native.network || {};
        const buffer = native.buffer || {};
        const spatial = native.spatial || {};
        const telemetry = native.telemetry || {};

        const grid = document.createElement('div');
        grid.className = 'nextgen-status-grid';
        [
            ['fa-microchip', 'Motor', window.WXMAndroidAudio ? 'Android nativo' : 'Web fallback'],
            ['fa-circle-play', 'Estado', native.state || AudioEngine.state || 'idle'],
            ['fa-wifi', 'Red', network.score ? `${network.score} · ${network.transport || ''}` : 'Pendiente'],
            ['fa-layer-group', 'Buffer', buffer.activeProfile || native.bufferProfile || 'Estándar'],
            ['fa-route', 'Stream', [native.streamRole, native.streamHealth].filter(Boolean).join(' · ') || 'Principal'],
            ['fa-headphones', 'Salida', native.audioRoute || native.outputRoute || 'Sistema'],
            ['fa-vr-cardboard', 'Spatial', spatial.available ? 'Disponible' : 'No soportado'],
            ['fa-rotate', 'Retries', `${telemetry.retryCount ?? native.retryCount ?? 0} intentos`]
        ].forEach(item => grid.appendChild(this._statusCard(...item)));

        const note = document.createElement('p');
        note.className = 'nextgen-status-note';
        note.textContent = 'Estos datos se actualizan desde el bridge nativo cuando corres la APK. En navegador se muestran como fallback web.';

        body.append(grid, note);
        this._openModal('Motor NEXTGEN', body);
    }

    _statusCard(iconClass, label, value) {
        const card = document.createElement('article');
        card.className = 'nextgen-status-card';
        const icon = document.createElement('i');
        icon.className = `fas ${iconClass}`;
        const copy = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = label;
        const text = document.createElement('span');
        text.textContent = String(value || 'No disponible').slice(0, 140);
        copy.append(title, text);
        card.append(icon, copy);
        return card;
    }

    _safeHost(value) {
        try {
            return new URL(String(value || '')).host;
        } catch {
            return '';
        }
    }

    _openModal(title, node) {
        if (!this.dom.modal || !this.dom.modalTitle || !this.dom.modalBody) return;
        this.dom.modalTitle.textContent = title;
        this.dom.modalBody.replaceChildren(node);
        this.dom.modal.classList.add('active');
        this.dom.modal.setAttribute('aria-hidden', 'false');
    }

    _closeModal() {
        this.dom.modal?.classList.remove('active');
        this.dom.modal?.setAttribute('aria-hidden', 'true');
    }

    _openHistorySheet() {
        this.dom.historySheet?.classList.add('active');
        this.dom.historySheet?.setAttribute('aria-hidden', 'false');
    }

    _closeHistorySheet() {
        this.dom.historySheet?.classList.remove('active');
        this.dom.historySheet?.setAttribute('aria-hidden', 'true');
    }

    _toast(message) {
        const toast = document.createElement('div');
        toast.className = 'app-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('active'));
        setTimeout(() => {
            toast.classList.remove('active');
            setTimeout(() => toast.remove(), 300);
        }, 2200);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadRuntimeConfig();
    new UIController();
});

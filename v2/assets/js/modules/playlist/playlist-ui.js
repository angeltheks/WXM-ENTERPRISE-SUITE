/**
 * WXM ONE RADIO - Playlist UI (Pro Version)
 * Renderiza la interfaz premium con delegación de eventos y modal persistente.
 */

import Engine from './playlist-engine.js';
import CONFIG from '../../config.js';

class PlaylistUI {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.currentView = CONFIG.PLAYLIST.DEFAULT_VIEW;
        this.weekdays = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        this.dayLabels = {
            domingo: 'Domingo', lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
            jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado'
        };
        this.initialized = false;
    }

    _scopedId(name) {
        return `${this.containerId}-${name}`;
    }

    _messageNode(text) {
        const node = document.createElement('div');
        node.className = 'empty-playlist';
        node.textContent = text;
        return node;
    }

    // ── Seguridad: validar URL de imagen contra allowlist de dominios ──────────
    _isSafeImageUrl(url) {
        if (!url || typeof url !== 'string') return false;
        try {
            const parsed = new URL(url);
            if (parsed.protocol !== 'https:') return false;
            const allowed = [
                'i.scdn.co',          // Spotify CDN
                'mosaic.scdn.co',     // Spotify mosaico
                'is1-ssl.mzstatic.com', // iTunes
                'is2-ssl.mzstatic.com',
                'is3-ssl.mzstatic.com',
                'is4-ssl.mzstatic.com',
                'is5-ssl.mzstatic.com',
                'jm8n.net',           // Servidor propio
                'wxmoneradio.com',    // Dominio propio
            ];
            return allowed.some(d => parsed.hostname === d || parsed.hostname.endsWith('.' + d));
        } catch { return false; }
    }

    /**
     * Crea la estructura base (solo se ejecuta una vez)
     */
    initStructure() {
        if (!this.container || !CONFIG.PLAYLIST.ENABLE || this.initialized) return;

        // 1. Estructura interna del reproductor
        const module = document.createElement('div');
        module.className = 'playlist-module';
        module.id = this._scopedId('playlistModule');

        const tabs = document.createElement('div');
        tabs.className = 'playlist-tabs';
        tabs.id = this._scopedId('playlistTabs');

        const todayTab = document.createElement('button');
        todayTab.className = 'tab-btn';
        todayTab.dataset.view = 'today';
        todayTab.textContent = 'Hoy';

        const weekTab = document.createElement('button');
        weekTab.className = 'tab-btn';
        weekTab.dataset.view = 'week';
        weekTab.textContent = 'Semana';

        const content = document.createElement('div');
        content.className = 'playlist-content';
        content.id = this._scopedId('playlistContent');

        tabs.appendChild(todayTab);
        tabs.appendChild(weekTab);
        module.appendChild(tabs);
        module.appendChild(content);
        this.container.replaceChildren(module);

        // 2. Inyectar el Modal directamente en el BODY (para evitar clipping)
        if (!document.getElementById('playlistModal')) {
            const modalDiv = document.createElement('div');
            modalDiv.id = 'playlistModal';
            modalDiv.className = 'playlist-modal';

            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';

            const modalHeader = document.createElement('div');
            modalHeader.className = 'modal-header';

            const modalTitle = document.createElement('span');
            modalTitle.className = 'modal-title';
            modalTitle.id = 'modalTitle';
            modalTitle.textContent = 'Detalles';

            const closeButton = document.createElement('button');
            closeButton.className = 'close-modal';
            closeButton.id = 'closeModal';

            const closeIcon = document.createElement('i');
            closeIcon.className = 'fas fa-times';
            closeButton.appendChild(closeIcon);

            const modalBody = document.createElement('div');
            modalBody.className = 'modal-body';
            modalBody.id = 'modalBody';

            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeButton);
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalBody);
            modalDiv.appendChild(modalContent);
            document.body.appendChild(modalDiv);
        }

        this._setupEventListeners();
        this.initialized = true;
        this.render();
    }

    /**
     * Renderiza solo el contenido dinámico
     */
    render() {
        if (!this.initialized) {
            this.initStructure();
            return;
        }
        const content = this.container?.querySelector('.playlist-content');
        if (content) {
            const rendered = this._renderView();
            if (rendered instanceof Node) {
                content.replaceChildren(rendered);
            } else {
                content.replaceChildren(this._messageNode(String(rendered)));
            }
            this._updateActiveTab();
        }
    }

    _renderView() {
        const data = Engine.getAllPlaylists();
        if (!data) return this._messageNode('Cargando datos...');

        const now = new Date();
        const currentDayName = this.weekdays[now.getDay()];

        if (this.currentView === 'today') {
            const todayData = data[currentDayName];
            return this._renderDayList(currentDayName, todayData, true);
        }

        if (this.currentView === 'week') {
            const frag = document.createDocumentFragment();
            const grid = document.createElement('div');
            grid.className = 'week-grid';
            this.weekdays.forEach(day => {
                const dayData = data[day];
                grid.appendChild(this._renderDayCard(day, dayData, day === currentDayName));
            });
            frag.appendChild(grid);
            return frag;
        }
        return '';
    }

    _renderDayCard(dayName, dayData, isToday) {
        // Si no hay datos para ese día, mostramos 0 temas de forma segura
        const parsedCount = Number.parseInt(dayData?.count ?? 0, 10);
        const count = Number.isFinite(parsedCount) && parsedCount > 0 ? Math.min(parsedCount, 500) : 0;
        const label = this.dayLabels[dayName] || dayName;
        const rawDate = typeof dayData?.date === 'string' ? dayData.date : '';
        const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : '--/--';

        const card = document.createElement('div');
        card.className = 'day-card' + (isToday ? ' is-today' : '');
        card.dataset.day = dayName;

        const header = document.createElement('div');
        header.className = 'day-card-header';

        const name = document.createElement('span');
        name.className = 'day-card-name';
        name.textContent = label;

        const dateEl = document.createElement('span');
        dateEl.className = 'day-card-date';
        dateEl.textContent = date;

        const meta = document.createElement('span');
        meta.className = 'day-card-meta';
        meta.textContent = `${count} temas`;

        header.appendChild(name);
        header.appendChild(dateEl);
        card.appendChild(header);
        card.appendChild(meta);
        return card;
    }

    _renderDayList(dayName, dayData, isFullView = false) {
        const label = this.dayLabels[dayName] || dayName;

        if (!dayData || !dayData.tracks || dayData.tracks.length === 0) {
            return this._messageNode(`No hay canciones para el ${label}.`);
        }

        // Construir lista con nodos DOM seguros
        const frag = document.createDocumentFragment();

        if (isFullView && this.currentView !== 'today') {
            const title = document.createElement('div');
            title.className = 'view-title';
            title.textContent = `${this.dayLabels[dayName]} (${dayData.count})`;
            frag.appendChild(title);
        }

        const list = document.createElement('div');
        list.className = 'tracks-list';
        dayData.tracks.forEach(track => list.appendChild(this._renderTrackItem(track)));
        frag.appendChild(list);

        return frag; // devuelve DocumentFragment
    }

    // ── Renderiza un track-item usando DOM seguro ───────────────────────────
    _renderTrackItem(track) {
        const isCurrent = CONFIG.PLAYLIST.HIGHLIGHT_CURRENT && this._isCurrentTrack(track);

        const item = document.createElement('div');
        item.className = 'track-item' + (isCurrent ? ' is-current' : '');

        // Tiempo
        const time = document.createElement('div');
        time.className = 'track-time';
        time.textContent = track.time ?? '';
        item.appendChild(time);

        // Carátula (solo si URL es segura)
        if (CONFIG.PLAYLIST.ENABLE_COVERS) {
            const coverWrap = document.createElement('div');
            coverWrap.className = 'track-cover-mini';
            const img = document.createElement('img');
            const safeSrc = this._isSafeImageUrl(track.cover) ? track.cover : CONFIG.BRAND.LOGO;
            img.src = safeSrc;
            img.alt = '';
            img.loading = 'lazy';
            img.addEventListener('error', () => { img.src = CONFIG.BRAND.LOGO; });
            coverWrap.appendChild(img);
            item.appendChild(coverWrap);
        }

        // Detalles: título y artista
        const details = document.createElement('div');
        details.className = 'track-details';

        const name = document.createElement('div');
        name.className = 'track-name';
        name.textContent = track.title ?? '';

        const artist = document.createElement('div');
        artist.className = 'track-artist-mini';
        artist.textContent = track.artist ?? '';

        details.appendChild(name);
        details.appendChild(artist);
        item.appendChild(details);

        // Indicador de reproducción actual
        if (isCurrent) {
            const ind = document.createElement('div');
            ind.className = 'playing-indicator';
            ind.appendChild(document.createElement('span'));
            ind.appendChild(document.createElement('span'));
            ind.appendChild(document.createElement('span'));
            item.appendChild(ind);
        }

        return item; // devuelve nodo DOM, no string
    }

    _isCurrentTrack(track) {
        const currentTitle = document.getElementById('trackTitle')?.textContent;
        const currentArtist = document.getElementById('trackArtist')?.textContent;
        return track.title === currentTitle && track.artist === currentArtist;
    }

    _setupEventListeners() {
        // 1. Delegación de Eventos para el Contenedor
        this.container.addEventListener('click', (e) => {
            // Click en Tabs
            const tabBtn = e.target.closest('.tab-btn');
            if (tabBtn) {
                this.currentView = tabBtn.dataset.view;
                this.render();
                return;
            }

            // Click en Tarjetas de Día
            const dayCard = e.target.closest('.day-card');
            if (dayCard) {
                const dayName = dayCard.dataset.day;
                const dayData = Engine.getAllPlaylists()[dayName];
                this._openModal(dayName, dayData);
                return;
            }
        });

        // 2. Eventos del Modal (Cerrar)
        const modal = document.getElementById('playlistModal');
        const closeModal = document.getElementById('closeModal');

        if (modal && closeModal) {
            closeModal.addEventListener('click', () => modal.classList.remove('active'));
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('active');
            });
        }

        // 3. Listener para actualizaciones de fondo (ej: carátulas encontradas tarde)
        window.addEventListener('playlist-updated', () => {
            this.refresh();
        });
    }

    _openModal(dayName, dayData) {
        const modal = document.getElementById('playlistModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');

        if (!modal || !modalTitle || !modalBody) return;

        modalTitle.textContent = `Playlist del ${this.dayLabels[dayName] ?? dayName}`;

        const rendered = this._renderDayList(dayName, dayData, false);
        if (rendered instanceof Node) {
            modalBody.replaceChildren(rendered);
        } else {
            modalBody.replaceChildren(this._messageNode(String(rendered)));
        }

        modal.classList.add('active');
    }

    _updateActiveTab() {
        this.container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === this.currentView);
        });
    }

    refresh() {
        this.render();
    }
}

export default PlaylistUI;
